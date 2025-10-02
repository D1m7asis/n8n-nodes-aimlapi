import type { IExecuteFunctions } from 'n8n-workflow';

export type Operation = 'chatCompletion' | 'imageGeneration';
export type ChatExtractOption = 'text' | 'messages' | 'choices' | 'raw';
export type ImageExtractOption = 'firstUrl' | 'allUrls' | 'firstBase64' | 'allBase64' | 'raw';

export interface OperationExecuteContext {
  context: IExecuteFunctions;
  itemIndex: number;
  baseURL: string;
  model: string;
}
