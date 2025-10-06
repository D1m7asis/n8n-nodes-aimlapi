import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import type { ChatExtractOption, OperationExecuteContext } from '../types';

function collectTextSegments(value: unknown, segments: string[]) {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed) {
      segments.push(trimmed);
    }

    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectTextSegments(entry, segments);
    }

    return;
  }

  const objectValue = value as IDataObject;
  const type = typeof objectValue.type === 'string' ? objectValue.type.toLowerCase() : '';

  if (type.includes('audio')) {
    return;
  }

  const candidates = [
    objectValue.text,
    objectValue.content,
    objectValue.value,
    objectValue.output_text,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();

      if (trimmed) {
        segments.push(trimmed);
      }
    }
  }

  const nestedCollections = [objectValue.content, objectValue.parts, objectValue.messages];

  for (const collection of nestedCollections) {
    if (Array.isArray(collection)) {
      for (const entry of collection) {
        collectTextSegments(entry, segments);
      }
    }
  }
}

function extractTextFromContent(content: unknown): string {
  const segments: string[] = [];
  collectTextSegments(content, segments);
  return segments.join('\n');
}

// Handles the JSON request/response cycle for chat-completion models
export async function executeChatCompletion({
  context,
  itemIndex,
  baseURL,
  model,
}: OperationExecuteContext): Promise<INodeExecutionData> {
  const prompt = context.getNodeParameter('prompt', itemIndex) as string;
  const extract = context.getNodeParameter('extract', itemIndex) as ChatExtractOption;
  const options = context.getNodeParameter('options', itemIndex, {}) as IDataObject;

  const requestOptions = createRequestOptions(baseURL, '/v1/chat/completions');
  const body: IDataObject = {
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  setIfDefined(body, 'temperature', options.temperature);
  setIfDefined(body, 'top_p', options.topP);
  setIfDefined(body, 'max_tokens', options.maxTokens);
  setIfDefined(body, 'frequency_penalty', options.frequencyPenalty);
  setIfDefined(body, 'presence_penalty', options.presencePenalty);

  if (options.responseFormat === 'text') {
    body.response_format = { type: 'text' };
  }

  const audioOutput = options.audioOutput === true;
  const audioVoice = typeof options.audioVoice === 'string' && options.audioVoice.trim() !== '' ? options.audioVoice : undefined;
  const audioFormat = typeof options.audioFormat === 'string' && options.audioFormat.trim() !== '' ? options.audioFormat : undefined;

  if (audioOutput) {
    body.modalities = ['text', 'audio'];

    const audioConfig: IDataObject = {
      voice: audioVoice ?? 'alloy',
    };

    if (audioFormat) {
      audioConfig.format = audioFormat;
    }

    body.audio = audioConfig;
  }

  requestOptions.body = body;

  const response = (await context.helpers.httpRequestWithAuthentication.call(
    context,
    'aimlApi',
    requestOptions,
  )) as IDataObject;

  const choices = (response.choices as IDataObject[]) ?? [];

  switch (extract) {
    case 'text': {
      const firstMessage = (choices[0]?.message as IDataObject | undefined) ?? {};
      let content = extractTextFromContent(firstMessage.content);

      if (!content) {
        const firstChoice = choices[0] ?? {};

        if (typeof firstChoice.text === 'string') {
          content = firstChoice.text;
        }
      }

      return { json: { content } };
    }
    case 'messages': {
      const messages = choices
        .map((choice) => choice.message as IDataObject | undefined)
        .filter((message): message is IDataObject => Boolean(message));
      return { json: { result: messages } };
    }
    case 'choices': {
      return { json: { result: choices } };
    }
    default:
      return { json: { result: response } };
  }
}
