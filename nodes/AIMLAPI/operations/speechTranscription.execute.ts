import FormData from 'form-data';
import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import type { OperationExecuteContext, SpeechTranscriptionExtractOption } from '../types';

const WAITING_STATUSES = new Set(['waiting', 'active', 'processing', 'queued', 'pending']);
const FAILURE_STATUSES = new Set(['failed', 'error', 'cancelled', 'canceled', 'timeout']);
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 120;

type InputSource = 'binary' | 'url';

function sleep(duration: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });
}

function toList(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function applyOptionsToJson(target: IDataObject, options: IDataObject) {
  const listOptions: Array<[keyof IDataObject, keyof IDataObject]> = [
    ['custom_intent', 'customIntent'],
    ['custom_topic', 'customTopic'],
    ['tag', 'tags'],
  ];

  for (const [jsonKey, optionKey] of listOptions) {
    const values = toList(options[optionKey]);

    if (values.length === 1) {
      target[jsonKey] = values[0];
    } else if (values.length > 1) {
      target[jsonKey] = values;
    }
  }

  const stringOptions: Array<[keyof IDataObject, keyof IDataObject]> = [
    ['language', 'language'],
    ['keywords', 'keywords'],
    ['summarize', 'summarize'],
    ['search', 'search'],
    ['extra', 'extra'],
    ['diarize_version', 'diarizeVersion'],
  ];

  for (const [jsonKey, optionKey] of stringOptions) {
    const value = options[optionKey];
    if (typeof value === 'string' && value.trim() !== '') {
      target[jsonKey] = value;
    }
  }

  const numericOptions: Array<[keyof IDataObject, keyof IDataObject]> = [['utt_split', 'uttSplit']];

  for (const [jsonKey, optionKey] of numericOptions) {
    const value = options[optionKey];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      target[jsonKey] = value;
    }
  }

  const booleanOptions: Array<[keyof IDataObject, keyof IDataObject]> = [
    ['detect_language', 'detectLanguage'],
    ['detect_entities', 'detectEntities'],
    ['detect_topics', 'detectTopics'],
    ['diarize', 'diarize'],
    ['dictation', 'dictation'],
    ['filler_words', 'fillerWords'],
    ['intents', 'intents'],
    ['measurements', 'measurements'],
    ['multi_channel', 'multiChannel'],
    ['numerals', 'numerals'],
    ['paragraphs', 'paragraphs'],
    ['profanity_filter', 'profanityFilter'],
    ['punctuate', 'punctuate'],
    ['sentiment', 'sentiment'],
    ['smart_format', 'smartFormat'],
    ['topics', 'topics'],
    ['utterances', 'utterances'],
  ];

  for (const [jsonKey, optionKey] of booleanOptions) {
    const value = options[optionKey];
    if (typeof value === 'boolean') {
      target[jsonKey] = value;
    }
  }

  const enumOptions: Array<[keyof IDataObject, keyof IDataObject]> = [
    ['custom_intent_mode', 'customIntentMode'],
    ['custom_topic_mode', 'customTopicMode'],
  ];

  for (const [jsonKey, optionKey] of enumOptions) {
    const value = options[optionKey];
    if (typeof value === 'string' && value.trim() !== '') {
      target[jsonKey] = value;
    }
  }
}

function applyOptionsToForm(form: FormData, options: IDataObject) {
  const appendList = (key: string, sourceKey: keyof IDataObject) => {
    const values = toList(options[sourceKey]);

    if (values.length === 0) {
      return;
    }

    if (values.length === 1) {
      form.append(key, values[0]);
      return;
    }

    for (const value of values) {
      form.append(key, value);
    }
  };

  appendList('custom_intent', 'customIntent');
  appendList('custom_topic', 'customTopic');
  appendList('tag', 'tags');

  const appendString = (key: string, sourceKey: keyof IDataObject) => {
    const value = options[sourceKey];
    if (typeof value === 'string' && value.trim() !== '') {
      form.append(key, value);
    }
  };

  appendString('language', 'language');
  appendString('keywords', 'keywords');
  appendString('summarize', 'summarize');
  appendString('search', 'search');
  appendString('extra', 'extra');
  appendString('diarize_version', 'diarizeVersion');

  const appendBoolean = (key: string, sourceKey: keyof IDataObject) => {
    const value = options[sourceKey];
    if (typeof value === 'boolean') {
      form.append(key, value ? 'true' : 'false');
    }
  };

  appendBoolean('detect_language', 'detectLanguage');
  appendBoolean('detect_entities', 'detectEntities');
  appendBoolean('detect_topics', 'detectTopics');
  appendBoolean('diarize', 'diarize');
  appendBoolean('dictation', 'dictation');
  appendBoolean('filler_words', 'fillerWords');
  appendBoolean('intents', 'intents');
  appendBoolean('measurements', 'measurements');
  appendBoolean('multi_channel', 'multiChannel');
  appendBoolean('numerals', 'numerals');
  appendBoolean('paragraphs', 'paragraphs');
  appendBoolean('profanity_filter', 'profanityFilter');
  appendBoolean('punctuate', 'punctuate');
  appendBoolean('sentiment', 'sentiment');
  appendBoolean('smart_format', 'smartFormat');
  appendBoolean('topics', 'topics');
  appendBoolean('utterances', 'utterances');

  const appendEnum = (key: string, sourceKey: keyof IDataObject) => {
    const value = options[sourceKey];
    if (typeof value === 'string' && value.trim() !== '') {
      form.append(key, value);
    }
  };

  appendEnum('custom_intent_mode', 'customIntentMode');
  appendEnum('custom_topic_mode', 'customTopicMode');

  const value = options.uttSplit;
  if (typeof value === 'number' && !Number.isNaN(value)) {
    form.append('utt_split', value.toString());
  }
}

function extractGenerationId(response: IDataObject): string | undefined {
  if (typeof response.generation_id === 'string') {
    return response.generation_id;
  }

  if (response.result && typeof response.result === 'object') {
    const nested = response.result as IDataObject;
    if (typeof nested.generation_id === 'string') {
      return nested.generation_id;
    }
  }

  return undefined;
}

function shouldContinuePolling(status: unknown): boolean {
  if (typeof status !== 'string') {
    return true;
  }

  const normalized = status.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (WAITING_STATUSES.has(normalized)) {
    return true;
  }

  return false;
}

function extractErrorMessage(response: IDataObject): string | undefined {
  const candidates: Array<unknown> = [response.message, response.error];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate;
    }
  }

  if (response.result && typeof response.result === 'object') {
    const nested = response.result as IDataObject;
    const nestedCandidates: Array<unknown> = [nested.message, nested.error];

    for (const candidate of nestedCandidates) {
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate;
      }
    }
  }

  return undefined;
}

function getResultPayload(response: IDataObject): IDataObject {
  if (response.result && typeof response.result === 'object') {
    return response.result as IDataObject;
  }

  return response;
}

function pickTranscriptFromAlternatives(result: IDataObject): string | undefined {
  const results = result.results as IDataObject | undefined;
  if (!results) {
    return undefined;
  }

  const channels = (results.channels as IDataObject[]) ?? [];
  for (const channel of channels) {
    if (!channel || typeof channel !== 'object') {
      continue;
    }

    const alternatives = (channel.alternatives as IDataObject[]) ?? [];
    for (const alternative of alternatives) {
      if (!alternative || typeof alternative !== 'object') {
        continue;
      }

      const transcript = alternative.transcript as string | undefined;
      if (typeof transcript === 'string' && transcript.trim() !== '') {
        return transcript;
      }
    }
  }

  return undefined;
}

function extractTranscriptText(payload: IDataObject): string {
  const directCandidates = [payload.text, payload.transcript, payload.output];
  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate;
    }
  }

  const fromAlternatives = pickTranscriptFromAlternatives(payload);
  if (fromAlternatives) {
    return fromAlternatives;
  }

  return '';
}

function extractSegments(payload: IDataObject): IDataObject[] {
  if (Array.isArray(payload.segments)) {
    return payload.segments as IDataObject[];
  }

  const results = payload.results as IDataObject | undefined;
  if (!results) {
    return [];
  }

  const collected: IDataObject[] = [];
  const channels = (results.channels as IDataObject[]) ?? [];
  for (const channel of channels) {
    if (!channel || typeof channel !== 'object') {
      continue;
    }

    const alternatives = (channel.alternatives as IDataObject[]) ?? [];
    for (const alternative of alternatives) {
      if (!alternative || typeof alternative !== 'object') {
        continue;
      }

      const segments = (alternative.segments as IDataObject[]) ?? [];
      if (Array.isArray(segments) && segments.length > 0) {
        collected.push(...(segments.filter((segment) => typeof segment === 'object') as IDataObject[]));
        continue;
      }

      const words = (alternative.words as IDataObject[]) ?? [];
      if (Array.isArray(words) && words.length > 0) {
        collected.push(...(words.filter((word) => typeof word === 'object') as IDataObject[]));
      }
    }
  }

  return collected;
}

async function pollForTranscription(
  context: OperationExecuteContext['context'],
  baseURL: string,
  generationId: string,
): Promise<IDataObject> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(POLL_INTERVAL_MS);
    }

    const requestOptions = createRequestOptions(baseURL, `/v1/stt/${encodeURIComponent(generationId)}`, 'GET');
    requestOptions.body = undefined;

    const response = (await context.helpers.httpRequestWithAuthentication.call(
      context,
      'aimlApi',
      requestOptions,
    )) as IDataObject;

    const status = response.status;
    const normalizedStatus =
      typeof status === 'string' && status.trim() !== '' ? status.trim().toLowerCase() : undefined;

    if (normalizedStatus && FAILURE_STATUSES.has(normalizedStatus)) {
      const reason = extractErrorMessage(response);
      const suffix = reason ? `: ${reason}` : '';
      throw new Error(`Transcription failed with status "${normalizedStatus}"${suffix}`);
    }

    if (shouldContinuePolling(status)) {
      continue;
    }

    return response;
  }

  throw new Error(`Timed out while waiting for transcription (generation_id: ${generationId})`);
}

// Uploads audio or schedules remote transcription for STT models
export async function executeSpeechTranscription({
  context,
  itemIndex,
  baseURL,
  model,
}: OperationExecuteContext): Promise<INodeExecutionData> {
  const inputSource = context.getNodeParameter('transcriptionInputSource', itemIndex) as InputSource;
  const extract = context.getNodeParameter(
    'transcriptionExtract',
    itemIndex,
  ) as SpeechTranscriptionExtractOption;
  const options = context.getNodeParameter('transcriptionOptions', itemIndex, {}) as IDataObject;

  let creationResponse: IDataObject;

  if (inputSource === 'url') {
    const audioUrl = context.getNodeParameter('transcriptionAudioUrl', itemIndex) as string;

    if (!audioUrl || audioUrl.trim() === '') {
      throw new Error('Audio URL is required when using the remote URL input source.');
    }

    const body: IDataObject = {
      model,
      url: audioUrl,
    };

    applyOptionsToJson(body, options);

    const requestOptions = createRequestOptions(baseURL, '/v1/stt/create');
    requestOptions.body = body;

    creationResponse = (await context.helpers.httpRequestWithAuthentication.call(
      context,
      'aimlApi',
      requestOptions,
    )) as IDataObject;
  } else {
    const binaryPropertyName = context.getNodeParameter('transcriptionBinaryProperty', itemIndex) as string;
    const binaryData = await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
    const binaryMetadata = context.helpers.assertBinaryData(itemIndex, binaryPropertyName);

    const form = new FormData();
    form.append('model', model);

    const filename = binaryMetadata.fileName ?? `audio.${binaryMetadata.fileExtension ?? 'wav'}`;
    const contentType = binaryMetadata.mimeType ?? 'application/octet-stream';

    form.append('audio', binaryData, {
      filename,
      contentType,
      knownLength: binaryData.length,
    });

    applyOptionsToForm(form, options);

    const requestOptions = createRequestOptions(baseURL, '/v1/stt/create', 'POST', {
      json: false,
      headers: form.getHeaders(),
    });
    requestOptions.body = form;

    creationResponse = (await context.helpers.httpRequestWithAuthentication.call(
      context,
      'aimlApi',
      requestOptions,
    )) as IDataObject;
  }

  const generationId = extractGenerationId(creationResponse);
  if (!generationId) {
    throw new Error('No generation_id returned from the speech transcription request.');
  }

  const finalResponse = await pollForTranscription(context, baseURL, generationId);

  if (extract === 'raw') {
    return { json: { result: finalResponse } };
  }

  const resultPayload = getResultPayload(finalResponse);

  if (extract === 'segments') {
    const segments = extractSegments(resultPayload);
    return { json: { segments } };
  }

  const text = extractTranscriptText(resultPayload);
  return { json: { text } };
}
