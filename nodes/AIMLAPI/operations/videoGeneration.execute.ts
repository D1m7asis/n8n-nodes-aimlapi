import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import { getModelEndpoints } from '../utils/models';
import { extractVideoOutputs, resolveGenerationResponse } from '../utils/generation';
import type { OperationExecuteContext, VideoExtractOption } from '../types';

type VideoProvider = 'google' | 'alibaba' | 'minimax' | 'kling' | 'runway' | 'other';

function detectVideoProvider(model: string): VideoProvider {
	const value = model.toLowerCase();

	if (value.includes('veo') || value.includes('google')) {
		return 'google';
	}

	if (value.includes('alibaba') || value.includes('wan')) {
		return 'alibaba';
	}

	if (value.includes('minimax') || value.includes('live2d')) {
		return 'minimax';
	}

	if (value.includes('kling')) {
		return 'kling';
	}

	if (value.includes('runway') || value.includes('gen3a')) {
		return 'runway';
	}

	return 'other';
}

function parseImageList(value: unknown): string[] | undefined {
	if (!value) {
		return undefined;
	}

	if (Array.isArray(value)) {
		const entries = value
			.filter((entry): entry is string => typeof entry === 'string')
			.map((entry) => entry.trim())
			.filter(Boolean);

		return entries.length ? entries : undefined;
	}

	if (typeof value === 'string') {
		const entries = value
			.split(/[\n,]+/)
			.map((entry) => entry.trim())
			.filter(Boolean);

		return entries.length ? entries : undefined;
	}

	return undefined;
}

function resolveVideoUrl(entry: IDataObject): string | undefined {
	return (
		(entry.url as string | undefined) ||
		(entry.video_url as string | undefined) ||
		(entry.videoUrl as string | undefined)
	);
}

// Handles the orchestration for text-to-video and image-to-video flows
export async function executeVideoGeneration({
	context,
	itemIndex,
	baseURL,
	model,
}: OperationExecuteContext): Promise<INodeExecutionData> {
	const prompt = context.getNodeParameter('videoPrompt', itemIndex) as string;
	const extract = context.getNodeParameter('videoExtract', itemIndex) as VideoExtractOption;
	const options = context.getNodeParameter('videoOptions', itemIndex, {}) as IDataObject;

	const endpoints = await getModelEndpoints(context, baseURL, model);
	const generationPath =
		endpoints.find((endpoint) => endpoint.includes('/v2/generate/video')) ??
		endpoints.find((endpoint) => endpoint.includes('/video/generations')) ??
		'/v2/video/generations';

	const requestOptions = createRequestOptions(baseURL, generationPath);

	const provider = detectVideoProvider(model);
	const body: IDataObject = {
		model,
		prompt,
	};

	const referenceImageUrl = options.referenceImageUrl as string | undefined;
	const tailImageUrl = options.tailImageUrl as string | undefined;
	const lastImageUrl = options.lastImageUrl as string | undefined;

	switch (provider) {
		case 'google': {
			setIfDefined(body, 'image_url', referenceImageUrl);
			setIfDefined(body, 'tail_image_url', tailImageUrl ?? lastImageUrl);
			setIfDefined(body, 'aspect_ratio', options.aspectRatio);
			setIfDefined(body, 'duration', options.duration);
			setIfDefined(body, 'negative_prompt', options.negativePrompt);
			setIfDefined(body, 'seed', options.seed);
			setIfDefined(body, 'enhance_prompt', options.enhancePrompt);
			break;
		}
		case 'alibaba': {
			setIfDefined(body, 'resolution', options.resolution);
			setIfDefined(body, 'aspect_ratio', options.aspectRatio);
			setIfDefined(body, 'negative_prompt', options.negativePrompt);
			setIfDefined(body, 'watermark', options.watermark);
			setIfDefined(body, 'seed', options.seed);
			setIfDefined(body, 'enable_prompt_expansion', options.enablePromptExpansion);
			break;
		}
		case 'minimax': {
			const firstFrame = (options.firstFrameImage as string | undefined) ?? referenceImageUrl;
			setIfDefined(body, 'prompt_optimizer', options.promptOptimizer);
			setIfDefined(body, 'first_frame_image', firstFrame);
			break;
		}
		case 'kling': {
			const images =
				parseImageList(options.imageList) ?? (referenceImageUrl ? [referenceImageUrl] : undefined);
			setIfDefined(body, 'type', options.klingType);
			setIfDefined(body, 'image_list', images);
			setIfDefined(body, 'aspect_ratio', options.aspectRatio);
			setIfDefined(body, 'negative_prompt', options.negativePrompt);
			setIfDefined(body, 'duration', options.duration);
			setIfDefined(body, 'external_task_id', options.externalTaskId);
			break;
		}
		case 'runway': {
			setIfDefined(body, 'image_url', referenceImageUrl);
			setIfDefined(body, 'last_image_url', lastImageUrl ?? tailImageUrl);
			setIfDefined(body, 'duration', options.duration);
			setIfDefined(body, 'ratio', options.aspectRatio);
			setIfDefined(body, 'seed', options.seed);
			break;
		}
		default: {
			setIfDefined(body, 'mode', options.mode);
			setIfDefined(body, 'duration', options.duration);
			setIfDefined(body, 'aspect_ratio', options.aspectRatio);
			setIfDefined(body, 'cfg_scale', options.cfgScale);
			setIfDefined(body, 'seed', options.seed);
			setIfDefined(body, 'negative_prompt', options.negativePrompt);
			setIfDefined(body, 'prompt_strength', options.promptStrength);
			setIfDefined(body, 'reference_image_url', referenceImageUrl);
			setIfDefined(body, 'reference_video_url', options.referenceVideoUrl);
			setIfDefined(body, 'music_url', options.musicUrl);
			break;
		}
	}

	if (provider !== 'other') {
		setIfDefined(body, 'music_url', options.musicUrl);
	}

	requestOptions.body = body;

	const initialResponse = (await context.helpers.httpRequestWithAuthentication.call(
		context,
		'aimlApi',
		requestOptions,
	)) as IDataObject;

	const rawResponse = await resolveGenerationResponse(
		context,
		baseURL,
		generationPath,
		initialResponse,
		{
			mediaType: 'video',
		},
	);

	const data = extractVideoOutputs(rawResponse);

	switch (extract) {
		case 'firstUrl': {
			const url = data.map(resolveVideoUrl).find((value): value is string => Boolean(value)) ?? '';
			return { json: { url }, pairedItem: { item: itemIndex } };
		}
		case 'allUrls': {
			const urls = data.map(resolveVideoUrl).filter((value): value is string => Boolean(value));
			return { json: { urls }, pairedItem: { item: itemIndex } };
		}
		default:
			return {
				json: { result: rawResponse } as IDataObject,
				pairedItem: { item: itemIndex },
			};
	}
}
