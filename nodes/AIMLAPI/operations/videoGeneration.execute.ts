import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import { getModelEndpoints } from '../utils/models';
import { resolveGenerationResponse } from '../utils/generation';
import type { OperationExecuteContext, VideoExtractOption } from '../types';

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

  const body: IDataObject = {
    model,
    prompt,
  };

  setIfDefined(body, 'mode', options.mode);
  setIfDefined(body, 'duration', options.duration);
  setIfDefined(body, 'aspect_ratio', options.aspectRatio);
  setIfDefined(body, 'cfg_scale', options.cfgScale);
  setIfDefined(body, 'seed', options.seed);
  setIfDefined(body, 'negative_prompt', options.negativePrompt);
  setIfDefined(body, 'prompt_strength', options.promptStrength);
  setIfDefined(body, 'reference_image_url', options.referenceImageUrl);
  setIfDefined(body, 'reference_video_url', options.referenceVideoUrl);
  setIfDefined(body, 'music_url', options.musicUrl);

  requestOptions.body = body;

  const initialResponse = (await context.helpers.httpRequestWithAuthentication.call(
    context,
    'aimlApi',
    requestOptions,
  )) as IDataObject;

  const response = await resolveGenerationResponse(context, baseURL, generationPath, initialResponse, {
    mediaType: 'video',
  });

  const data = (response.data as IDataObject[]) ?? [];

  switch (extract) {
    case 'firstUrl': {
      const url = data.map(resolveVideoUrl).find((value): value is string => Boolean(value)) ?? '';
      return { json: { url } };
    }
    case 'allUrls': {
      const urls = data.map(resolveVideoUrl).filter((value): value is string => Boolean(value));
      return { json: { urls } };
    }
    default:
      return { json: { result: response } };
  }
}
