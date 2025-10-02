import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import type { ImageExtractOption, OperationExecuteContext } from '../types';

// Sends prompts to the image generation endpoint and normalizes the response
export async function executeImageGeneration({
  context,
  itemIndex,
  baseURL,
  model,
}: OperationExecuteContext): Promise<INodeExecutionData> {
  const prompt = context.getNodeParameter('imagePrompt', itemIndex) as string;
  const extract = context.getNodeParameter('imageExtract', itemIndex) as ImageExtractOption;
  const options = context.getNodeParameter('imageOptions', itemIndex, {}) as IDataObject;

  const requestOptions = createRequestOptions(baseURL, '/v1/images/generations');

  const body: IDataObject = {
    model,
    prompt,
  };

  setIfDefined(body, 'n', options.imageCount);
  setIfDefined(body, 'size', options.size);
  setIfDefined(body, 'response_format', options.responseFormat);
  setIfDefined(body, 'quality', options.quality);
  setIfDefined(body, 'style', options.style);
  setIfDefined(body, 'background', options.background);
  setIfDefined(body, 'negative_prompt', options.negativePrompt);

  requestOptions.body = body;

  const response = (await context.helpers.httpRequestWithAuthentication.call(
    context,
    'aimlApi',
    requestOptions,
  )) as IDataObject;

  const data = (response.data as IDataObject[]) ?? [];

  switch (extract) {
    case 'firstUrl': {
      const url = data.find((entry) => typeof entry.url === 'string')?.url ?? '';
      return { json: { url } };
    }
    case 'allUrls': {
      const urls = data
        .map((entry) => entry.url as string | undefined)
        .filter((url): url is string => Boolean(url));
      return { json: { urls } };
    }
    case 'firstBase64': {
      const base64 = data.find((entry) => typeof entry.b64_json === 'string')?.b64_json ?? '';
      return { json: { base64 } };
    }
    case 'allBase64': {
      const base64 = data
        .map((entry) => entry.b64_json as string | undefined)
        .filter((value): value is string => Boolean(value));
      return { json: { base64 } };
    }
    default:
      return { json: { result: response } };
  }
}
