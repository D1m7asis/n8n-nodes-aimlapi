import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import type { OperationExecuteContext, SpeechSynthesisExtractOption } from '../types';

function pickFirstUrl(payload: IDataObject): string | undefined {
  const directUrl = (payload.audio_url as string | undefined) ?? (payload.url as string | undefined);
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
    input,
    text: input,
  };

  setIfDefined(body, 'voice', options.voice);
  setIfDefined(body, 'style', options.style);
  setIfDefined(body, 'format', options.audioFormat);
  setIfDefined(body, 'audio_format', options.audioFormat);
  setIfDefined(body, 'sample_rate', options.sampleRate);
  setIfDefined(body, 'speed', options.speed);

  requestOptions.body = body;

  const response = (await context.helpers.httpRequestWithAuthentication.call(
    context,
    'aimlApi',
    requestOptions,
  )) as IDataObject;

  switch (extract) {
    case 'audioUrl': {
      const url = pickFirstUrl(response) ?? '';
      return { json: { url } };
    }
    case 'audioBase64': {
      const base64 = pickFirstBase64(response) ?? '';
      return { json: { base64 } };
    }
    default:
      return { json: { result: response } };
  }
}
