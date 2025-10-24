import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import type { OperationExecuteContext, SpeechSynthesisExtractOption } from '../types';

function normalizeModelId(model: string): string {
	return model.trim().toLowerCase();
}

function isAuraModel(model: string): boolean {
	const normalized = normalizeModelId(model);
	return normalized.startsWith('#g1_aura');
}

function isElevenLabsModel(model: string): boolean {
	const normalized = normalizeModelId(model);
	return normalized.startsWith('elevenlabs/');
}

function isMicrosoftVallEModel(model: string): boolean {
	const normalized = normalizeModelId(model);
	return normalized.startsWith('microsoft/');
}

function pickFirstUrl(payload: IDataObject): string | undefined {
	const directUrl =
		(payload.audio_url as string | undefined) ?? (payload.url as string | undefined);
	if (directUrl) {
		return directUrl;
	}

	const dataEntries = (payload.data as IDataObject[]) ?? [];
	return dataEntries
		.map((entry) => (entry.audio_url as string | undefined) ?? (entry.url as string | undefined))
		.find((value): value is string => Boolean(value));
}

function pickFirstBase64(payload: IDataObject): string | undefined {
	const direct = (payload.audio as string | undefined) ?? (payload.base64 as string | undefined);
	if (direct) {
		return direct;
	}

	const dataEntries = (payload.data as IDataObject[]) ?? [];
	return dataEntries
		.map((entry) => (entry.b64_json as string | undefined) ?? (entry.audio as string | undefined))
		.find((value): value is string => Boolean(value));
}

// Converts text to speech for voice / TTS models
export async function executeSpeechSynthesis({
	context,
	itemIndex,
	baseURL,
	model,
}: OperationExecuteContext): Promise<INodeExecutionData> {
	const input = context.getNodeParameter('ttsInput', itemIndex) as string;
	const extract = context.getNodeParameter('ttsExtract', itemIndex) as SpeechSynthesisExtractOption;
	const options = context.getNodeParameter('ttsOptions', itemIndex, {}) as IDataObject;

	const requestOptions = createRequestOptions(baseURL, '/v1/tts');

	const body: IDataObject = {
		model,
	};

	const variant = isMicrosoftVallEModel(model)
		? 'microsoft'
		: isAuraModel(model)
			? 'aura'
			: isElevenLabsModel(model)
				? 'elevenlabs'
				: 'generic';

	if (variant === 'microsoft') {
		const scriptOverride = (options.scriptOverride as string | undefined) ?? '';
		body.script = scriptOverride ? scriptOverride : input;

		let speakers = options.speakers as IDataObject | IDataObject[] | string | undefined;
		if (typeof speakers === 'string') {
			try {
				const parsed = JSON.parse(speakers);
				speakers = parsed as IDataObject | IDataObject[] | undefined;
			} catch {}
		}

		if (Array.isArray(speakers)) {
			body.speakers = speakers;
		} else if (speakers && typeof speakers === 'object') {
			body.speakers = [speakers];
		}

		setIfDefined(body, 'seed', options.seed);
		setIfDefined(body, 'cfg_scale', options.cfgScale);
	} else {
		body.text = input;
	}

	const container =
		(options.container as string | undefined) ?? (options.audioFormat as string | undefined);
	const encoding = options.encoding as string | undefined;
	const sampleRate = options.sampleRate as string | number | undefined;

	if (container) {
		body.container = container;
	}

	if (encoding) {
		body.encoding = encoding;
	}

	if (sampleRate !== undefined && sampleRate !== null && sampleRate !== '') {
		body.sample_rate = sampleRate;
	}

	if (variant === 'elevenlabs' || variant === 'generic') {
		setIfDefined(body, 'voice', options.voice);
		setIfDefined(body, 'output_format', options.outputFormat);

		const subtitleOption =
			options.subtitleEnable ??
			options.subtitle ??
			options.subtitle_enable ??
			options.enableSubtitles;
		if (subtitleOption !== undefined) {
			body.subtitle_enable = Boolean(subtitleOption);
		}
	}

	requestOptions.body = body;

	const response = (await context.helpers.httpRequestWithAuthentication.call(
		context,
		'aimlApi',
		requestOptions,
	)) as IDataObject;

	switch (extract) {
		case 'audioUrl': {
			const url = pickFirstUrl(response) ?? '';
			return { json: { url }, pairedItem: { item: itemIndex } };
		}
		case 'audioBase64': {
			const base64 = pickFirstBase64(response) ?? '';
			return { json: { base64 }, pairedItem: { item: itemIndex } };
		}
		default:
			return { json: { result: response }, pairedItem: { item: itemIndex } };
	}
}
