import FormData from 'form-data';
import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import type { OperationExecuteContext, SpeechTranscriptionExtractOption } from '../types';

const TEXTUAL_FORMATS = new Set(['text', 'srt', 'vtt']);

function appendIfDefined(form: FormData, field: string, value: unknown) {
  if (value === undefined || value === null) {
    return;
  }

  form.append(field, typeof value === 'string' ? value : String(value));
}

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

  const expectsText = TEXTUAL_FORMATS.has((options.responseFormat as string) ?? '');

  const formData = new FormData();
  formData.append('file', binaryData, {
    filename: binaryMetadata.fileName ?? `audio.${binaryMetadata.fileExtension ?? 'wav'}`,
    contentType: binaryMetadata.mimeType ?? undefined,
  });
  formData.append('model', model);

  appendIfDefined(formData, 'language', options.language);
  appendIfDefined(formData, 'prompt', options.prompt);
  appendIfDefined(formData, 'response_format', options.responseFormat);
  appendIfDefined(formData, 'temperature', options.temperature);

  const requestOptions = createRequestOptions(baseURL, '/v1/stt', 'POST', {
    headers: formData.getHeaders(),
    body: formData,
    json: !expectsText,
  });

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
