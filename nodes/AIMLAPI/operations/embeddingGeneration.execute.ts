import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { createRequestOptions } from '../utils/request';
import { setIfDefined } from '../utils/object';
import type { EmbeddingExtractOption, OperationExecuteContext } from '../types';

// Requests numerical embeddings for downstream similarity workflows
export async function executeEmbeddingGeneration({
  context,
  itemIndex,
  baseURL,
  model,
}: OperationExecuteContext): Promise<INodeExecutionData> {
  const input = context.getNodeParameter('embeddingInput', itemIndex) as string;
  const extract = context.getNodeParameter(
    'embeddingExtract',
    itemIndex,
  ) as EmbeddingExtractOption;
  const options = context.getNodeParameter('embeddingOptions', itemIndex, {}) as IDataObject;

  const requestOptions = createRequestOptions(baseURL, '/v1/embeddings');

  const body: IDataObject = {
    model,
    input,
  };

  setIfDefined(body, 'encoding_format', options.encodingFormat);
  setIfDefined(body, 'user', options.user);

  requestOptions.body = body;

  const response = (await context.helpers.httpRequestWithAuthentication.call(
    context,
    'aimlApi',
    requestOptions,
  )) as IDataObject;

  const data = (response.data as IDataObject[]) ?? [];

  if (extract === 'vector') {
    const embedding = (data[0]?.embedding as Array<number | string> | undefined) ?? [];
    return { json: { embedding } };
  }

  if (extract === 'vectors') {
    const embeddings = data
      .map((entry) => entry.embedding as Array<number | string> | undefined)
      .filter((value): value is Array<number | string> => Array.isArray(value));
    return { json: { embeddings } };
  }

  return { json: { result: response } };
}
