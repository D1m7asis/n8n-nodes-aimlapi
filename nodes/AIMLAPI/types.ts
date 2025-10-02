import type { IExecuteFunctions } from 'n8n-workflow';

export type Operation =
  | 'chatCompletion'
  | 'imageGeneration'
  | 'audioGeneration'
  | 'videoGeneration'
  | 'speechSynthesis'
  | 'speechTranscription'
  | 'embeddingGeneration';

export type ChatExtractOption = 'text' | 'messages' | 'choices' | 'raw';
export type ImageExtractOption = 'firstUrl' | 'allUrls' | 'firstBase64' | 'allBase64' | 'raw';
export type AudioExtractOption = 'firstUrl' | 'allUrls' | 'firstBase64' | 'allBase64' | 'raw';
export type VideoExtractOption = 'firstUrl' | 'allUrls' | 'raw';
export type SpeechSynthesisExtractOption = 'audioUrl' | 'audioBase64' | 'raw';
export type SpeechTranscriptionExtractOption = 'text' | 'segments' | 'raw';
export type EmbeddingExtractOption = 'vector' | 'vectors' | 'raw';

export interface OperationExecuteContext {
  context: IExecuteFunctions;
  itemIndex: number;
  baseURL: string;
  model: string;
}
