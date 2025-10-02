import type { IDataObject, IHttpRequestOptions, INodeExecutionData } from 'n8n-workflow';
import { resolveEndpoint } from '../utils/request';
import { setIfDefined } from '../utils/object';
import type { OperationExecuteContext, SpeechTranscriptionExtractOption } from '../types';

const AIMLAPI_NODE_TITLE = 'n8n AIMLAPI Node';
const TEXTUAL_FORMATS = new Set(['text', 'srt', 'vtt']);

// Uploads audio and retrieves transcription output for STT models
export async function executeSpeechTranscription({
  context,
  itemIndex,
  baseURL,
  model,
}: OperationExecuteContext): Promise<INodeExecutionData> {
  const binaryPropertyName = context.getNodeParameter('transcriptionBinaryProperty', itemIndex) as string;
  const extract = context.getNodeParameter(
    'transcriptionExtract',
    itemIndex,
  ) as SpeechTranscriptionExtractOption;
  const options = context.getNodeParameter('transcriptionOptions', itemIndex, {}) as IDataObject;

  const binaryData = await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
  const binaryMetadata = context.helpers.assertBinaryData(itemIndex, binaryPropertyName);

  const endpoint = resolveEndpoint(baseURL, '/v1/stt');
  const expectsText = TEXTUAL_FORMATS.has((options.responseFormat as string) ?? '');

  const formData: IDataObject = {
    file: {
      value: binaryData,
      options: {
        filename: binaryMetadata.fileName ?? `audio.${binaryMetadata.fileExtension ?? 'wav'}`,
        contentType: binaryMetadata.mimeType,
      },
    },
    model,
  };

  setIfDefined(formData, 'language', options.language);
  setIfDefined(formData, 'prompt', options.prompt);
  setIfDefined(formData, 'response_format', options.responseFormat);
  setIfDefined(formData, 'temperature', options.temperature);

  const requestOptions: IHttpRequestOptions = {
    method: 'POST',
    baseURL: endpoint.baseURL,
    url: endpoint.url,
    headers: {
      'X-Title': AIMLAPI_NODE_TITLE,
    },
    formData,
    json: !expectsText,
  };

  const response = (await context.helpers.httpRequestWithAuthentication.call(
    context,
    'aimlApi',
    requestOptions,
  )) as IDataObject | string;

  if (typeof response === 'string') {
    if (extract === 'text') {
      return { json: { text: response } };
    }

    return { json: { result: response } };
  }

  if (extract === 'segments') {
    const segments = (response.segments as IDataObject[]) ?? [];
    return { json: { segments } };
  }

  if (extract === 'text') {
    const text = (response.text as string | undefined) ?? '';
    return { json: { text } };
  }

  return { json: { result: response } };
}
