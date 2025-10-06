import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeProperties,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow/dist/Interfaces';
import { chatCompletionProperties } from './operations/chatCompletion.description';
import { imageGenerationProperties } from './operations/imageGeneration.description';
import { audioGenerationProperties } from './operations/audioGeneration.description';
import { videoGenerationProperties } from './operations/videoGeneration.description';
import { speechSynthesisProperties } from './operations/speechSynthesis.description';
import { speechTranscriptionProperties } from './operations/speechTranscription.description';
import { embeddingGenerationProperties } from './operations/embeddingGeneration.description';
import { executeChatCompletion } from './operations/chatCompletion.execute';
import { executeImageGeneration } from './operations/imageGeneration.execute';
import { executeAudioGeneration } from './operations/audioGeneration.execute';
import { executeVideoGeneration } from './operations/videoGeneration.execute';
import { executeSpeechSynthesis } from './operations/speechSynthesis.execute';
import { executeSpeechTranscription } from './operations/speechTranscription.execute';
import { executeEmbeddingGeneration } from './operations/embeddingGeneration.execute';
import type { Operation, OperationExecuteContext } from './types';
import { toModelOptions } from './utils/models';

const operationLabels: Record<Operation, string> = {
	chatCompletion: 'Chat Completion',
	imageGeneration: 'Image Generation',
	audioGeneration: 'Audio Generation',
	videoGeneration: 'Video Generation',
	speechSynthesis: 'Speech Synthesis',
	speechTranscription: 'Speech Transcription',
	embeddingGeneration: 'Embedding Generation',
};

const operationExecutors: Record<
	Operation,
	(context: OperationExecuteContext) => Promise<INodeExecutionData>
> = {
	chatCompletion: executeChatCompletion,
	imageGeneration: executeImageGeneration,
	audioGeneration: executeAudioGeneration,
	videoGeneration: executeVideoGeneration,
	speechSynthesis: executeSpeechSynthesis,
	speechTranscription: executeSpeechTranscription,
	embeddingGeneration: executeEmbeddingGeneration,
};

const operationSpecificProperties: INodeProperties[] = [
	...chatCompletionProperties,
	...imageGenerationProperties,
	...audioGenerationProperties,
	...videoGenerationProperties,
	...speechSynthesisProperties,
	...speechTranscriptionProperties,
	...embeddingGenerationProperties,
];

const baseProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: operationLabels.chatCompletion,
				value: 'chatCompletion',
				action: 'Generate text using chat completion models',
				description: 'Generate text using chat completion models',
			},
			{
				name: operationLabels.imageGeneration,
				value: 'imageGeneration',
				action: 'Generate images from text prompts',
				description: 'Generate images from text prompts',
			},
			{
				name: operationLabels.audioGeneration,
				value: 'audioGeneration',
				action: 'Generate music or sound effects from text prompts',
				description: 'Generate music or sound effects from text prompts',
			},
			{
				name: operationLabels.videoGeneration,
				value: 'videoGeneration',
				action: 'Generate videos from prompts or reference media',
				description: 'Generate videos from prompts or reference media',
			},
			{
				name: operationLabels.speechSynthesis,
				value: 'speechSynthesis',
				action: 'Convert text into speech audio',
				description: 'Convert text into speech audio',
			},
			{
				name: operationLabels.speechTranscription,
				value: 'speechTranscription',
				action: 'Transcribe audio files into text',
				description: 'Transcribe audio files into text',
			},
			{
				name: operationLabels.embeddingGeneration,
				value: 'embeddingGeneration',
				action: 'Create vector embeddings from text',
				description: 'Create vector embeddings from text',
			},
		],
		default: 'chatCompletion',
	},
	{
		displayName: 'Model Name or ID',
		name: 'model',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getModels',
			loadOptionsDependsOn: ['operation'],
		},
		default: '',
		required: true,
		description:
			'Choose model or specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];

export class AimlApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI/ML API',
		name: 'aimlApi',
		icon: 'file:aimlapi.svg',
		group: ['transform'],
		version: 1,
		subtitle:
			'={{ ({ chatCompletion: "Chat Completion", imageGeneration: "Image Generation", audioGeneration: "Audio Generation", videoGeneration: "Video Generation", speechSynthesis: "Speech Synthesis", speechTranscription: "Speech Transcription", embeddingGeneration: "Embedding Generation" })[$parameter["operation"]] }}',
		description: 'Choose from 300+ AI models from Gemini and ChatGPT to DeepSeek and Llama.',
		defaults: {
			name: 'AI/ML API',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'aimlApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL:
				'={{ $credentials.url.endsWith("/") ? $credentials.url.slice(0, -1) : $credentials.url }}',
			headers: {
				'Content-Type': 'application/json',
				'X-Title': `n8n AIMLAPI Node`,
			},
		},
		properties: [...baseProperties, ...operationSpecificProperties],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('aimlApi');
		const rawBaseUrl = (credentials.url as string) ?? '';
		const baseURL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as Operation;
				const model = this.getNodeParameter('model', itemIndex) as string;

				const context: OperationExecuteContext = {
					context: this,
					itemIndex,
					baseURL,
					model,
				};

				const executor = operationExecutors[operation];

				if (!executor) {
					throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`);
				}

				// Delegate the heavy lifting to the operation-specific executor
				const result = await executor(context);

				returnItems.push(result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnItems.push({
						json: {
							error: error instanceof Error ? error.message : (error as IDataObject),
						},
					});
					continue;
				}

				throw error;
			}
		}

		return [returnItems];
	}

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('aimlApi');
				const apiUrl = credentials.url as string;
				const endpoint = apiUrl.endsWith('/') ? `${apiUrl}models` : `${apiUrl}/models`;

				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'aimlApi', {
					method: 'GET',
					url: endpoint,
					json: true,
				});

				const models = response?.models ?? response?.data ?? response;
				const operation =
					(this.getCurrentNodeParameter('operation') as Operation) ?? 'chatCompletion';

				// Filter the available models so the list stays relevant for the selected operation
				return toModelOptions(models, operation);
			},
		},
	};
}
