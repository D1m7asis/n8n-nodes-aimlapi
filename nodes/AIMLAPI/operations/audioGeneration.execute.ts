import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import { getModelEndpoints } from '../utils/models';
import { extractAudioOutputs, resolveGenerationResponse } from '../utils/generation';
import type { AudioExtractOption, OperationExecuteContext } from '../types';

function resolveAudioUrl(entry: IDataObject): string | undefined {
  return (
    (entry.url as string | undefined) ||
    (entry.audio_url as string | undefined) ||
    (entry.audioUrl as string | undefined)
  );
}

function resolveAudioBase64(entry: IDataObject): string | undefined {
  return (
    (entry.b64_json as string | undefined) ||
    (entry.base64 as string | undefined) ||
    (entry.audio_base64 as string | undefined) ||
    (entry.audio as string | undefined) ||
    (entry.data as string | undefined)
  );
}

// Handles music and audio generation workflows
export async function executeAudioGeneration({
  context,
  itemIndex,
  baseURL,
  model,
}: OperationExecuteContext): Promise<INodeExecutionData> {
  const prompt = context.getNodeParameter('audioPrompt', itemIndex) as string;
  const extract = context.getNodeParameter('audioExtract', itemIndex) as AudioExtractOption;
  const options = context.getNodeParameter('audioOptions', itemIndex, {}) as IDataObject;

  const endpoints = await getModelEndpoints(context, baseURL, model);
  const generationPath =
    endpoints.find((endpoint) => endpoint.includes('/v2/generate/audio')) ??
    '/v2/generate/audio';

  const requestOptions = createRequestOptions(baseURL, generationPath);

  const body: IDataObject = {
    model,
    prompt,
  };

  setIfDefined(body, 'mode', options.mode);
  setIfDefined(body, 'duration', options.duration);
  setIfDefined(body, 'audio_format', options.audioFormat);
  setIfDefined(body, 'cfg_scale', options.cfgScale);
  setIfDefined(body, 'seed', options.seed);
  setIfDefined(body, 'negative_prompt', options.negativePrompt);
  setIfDefined(body, 'instrument', options.instrument);
  setIfDefined(body, 'reference_audio_url', options.referenceAudioUrl);
  setIfDefined(body, 'prompt_strength', options.promptStrength);

  requestOptions.body = body;

  const initialResponse = (await context.helpers.httpRequestWithAuthentication.call(
    context,
    'aimlApi',
    requestOptions,
  )) as IDataObject;

  const rawResponse = await resolveGenerationResponse(context, baseURL, generationPath, initialResponse, {
    mediaType: 'audio',
  });

  const data = extractAudioOutputs(rawResponse);

  switch (extract) {
    case 'firstUrl': {
      const url = data.map(resolveAudioUrl).find((value): value is string => Boolean(value)) ?? '';
      return { json: { url } };
    }
    case 'allUrls': {
      const urls = data.map(resolveAudioUrl).filter((value): value is string => Boolean(value));
      return { json: { urls } };
    }
    case 'firstBase64': {
      const base64 = data.map(resolveAudioBase64).find((value): value is string => Boolean(value)) ?? '';
      return { json: { base64 } };
    }
    case 'allBase64': {
      const base64 = data.map(resolveAudioBase64).filter((value): value is string => Boolean(value));
      return { json: { base64 } };
    }
    default:
      return { json: { result: rawResponse } as IDataObject };
  }
}
