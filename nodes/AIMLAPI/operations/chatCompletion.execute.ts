import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import type { ChatExtractOption, OperationExecuteContext } from '../types';

export async function executeChatCompletion({
  context,
  itemIndex,
  baseURL,
  model,
}: OperationExecuteContext): Promise<INodeExecutionData> {
  const prompt = context.getNodeParameter('prompt', itemIndex) as string;
  const extract = context.getNodeParameter('extract', itemIndex) as ChatExtractOption;
  const options = context.getNodeParameter('options', itemIndex, {}) as IDataObject;

  const requestOptions = createRequestOptions(baseURL, '/chat/completions', 'n8n AIMLAPI Node');
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
      const content = (firstMessage.content as string | undefined) ?? '';
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
