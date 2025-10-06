import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import type { OperationExecuteContext, SpeechTranscriptionExtractOption } from '../types';

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

  const base64Audio = binaryData.toString('base64');
  const audioPayload: IDataObject = {
    buffer: base64Audio,
    encoding: 'base64',
    fieldname: binaryPropertyName,
    size: binaryData.length,
  };

  const filename = binaryMetadata.fileName ?? `audio.${binaryMetadata.fileExtension ?? 'wav'}`;
  setIfDefined(audioPayload, 'originalname', filename);
  setIfDefined(audioPayload, 'mimetype', binaryMetadata.mimeType);

  const body: IDataObject = {
    model,
    audio: audioPayload,
  };

  setIfDefined(body, 'language', options.language);
  setIfDefined(body, 'detect_language', options.detectLanguage);
  setIfDefined(body, 'detect_entities', options.detectEntities);
  setIfDefined(body, 'detect_topics', options.detectTopics);
  setIfDefined(body, 'diarize', options.diarize);
  setIfDefined(body, 'dictation', options.dictation);
  setIfDefined(body, 'filler_words', options.fillerWords);
  setIfDefined(body, 'intents', options.intents);
  setIfDefined(body, 'keywords', options.keywords);
  setIfDefined(body, 'measurements', options.measurements);
  setIfDefined(body, 'multi_channel', options.multiChannel);
  setIfDefined(body, 'numerals', options.numerals);
  setIfDefined(body, 'paragraphs', options.paragraphs);
  setIfDefined(body, 'profanity_filter', options.profanityFilter);
  setIfDefined(body, 'punctuate', options.punctuate);
  setIfDefined(body, 'sentiment', options.sentiment);
  setIfDefined(body, 'smart_format', options.smartFormat);
  setIfDefined(body, 'summarize', options.summarize);
  setIfDefined(body, 'topics', options.topics);
  setIfDefined(body, 'utterances', options.utterances);
  setIfDefined(body, 'utt_split', options.uttSplit);

  const requestOptions = createRequestOptions(baseURL, '/v1/stt');
  requestOptions.body = body;

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
