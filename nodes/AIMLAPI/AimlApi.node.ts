import {
	IExecuteSingleFunctions,
	ILoadOptionsFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import {NodeConnectionType} from 'n8n-workflow/dist/Interfaces';

export class AIMLApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI/ML API',
		name: 'aimlApi',
		icon: 'file:aimlapi.svg',
		group: ['transform'],
		version: 1,
		description: 'AI chat completion via AI/ML API (AIMLAPI)',
		defaults: {
			name: 'AIMLAPI ChatCompletion',
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
			baseURL: '={{ $credentials.url.endsWith("/") ? $credentials.url.slice(0, -1) : $credentials.url }}',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer {{$credentials.apiKey}}',
			},
		},
		properties: [
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				default: '',
				required: true,
				description: 'Choose model or specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				description: 'Prompt to send to the AI model',
				routing: {
					request: {
						method: 'POST',
						url: '/chat/completions',
						body: {
							model: '={{ $parameter["model"] }}',
							messages: [
								{
									role: 'user',
									content: '={{ $value }}',
								},
							],
							temperature: '={{ $parameter["options"]["temperature"] ?? undefined }}',
							max_tokens: '={{ $parameter["options"]["maxTokens"] ?? undefined }}',
							top_p: '={{ $parameter["options"]["topP"] ?? undefined }}',
							frequency_penalty: '={{ $parameter["options"]["frequencyPenalty"] ?? undefined }}',
							presence_penalty: '={{ $parameter["options"]["presencePenalty"] ?? undefined }}',
							response_format:
								'={{ $parameter["options"]["responseFormat"] === "text" ? {"type": "text"} : undefined }}',
						},
					},
					output: {
						postReceive: [
							async function (
								this: IExecuteSingleFunctions,
								items: INodeExecutionData[],
								response: IN8nHttpFullResponse
							): Promise<INodeExecutionData[]> {
								const extract = this.getNodeParameter('extract', 0) as string;

								const body = response.body as {
									choices?: Array<{
										message?: { content?: string };
									}>;
									[key: string]: any;
								};

								if (extract === 'text') {
									const content = body.choices?.[0]?.message?.content ?? '';
									return this.helpers.returnJsonArray([{content}]);
								}

								if (extract === 'messages') {
									const messages = body.choices?.map(c => c.message) ?? [];
									return this.helpers.returnJsonArray([{result: messages}]);
								}

								if (extract === 'choices') {
									return this.helpers.returnJsonArray([{result: body.choices ?? []}]);
								}

								// default fallback: raw
								return this.helpers.returnJsonArray([{result: body}]);
							}
						],
					},
				},
			},
			{
				displayName: 'Extract From Response',
				name: 'extract',
				type: 'options',
				default: 'text',

				description: 'Choose what part of the response to return',
				options: [
					{
						name: 'Text Only (First Message)',
						value: 'text',
					},
					{
						name: 'Assistant Messages',
						value: 'messages',
					},
					{
						name: 'Choices Array',
						value: 'choices',
					},
					{
						name: 'Full Raw JSON',
						value: 'raw',
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				description: 'Additional parameters for the request',
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						type: 'number',
						default: null,
						typeOptions: {
							minValue: -2,
							maxValue: 2,
							numberPrecision: 2,
						},
						description: 'Penalty for repeated tokens (range -2 to 2)',
					},
					{
						displayName: 'Max Tokens',
						name: 'maxTokens',
						type: 'number',
						default: null,
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						type: 'number',
						default: null,
						typeOptions: {
							minValue: -2,
							maxValue: 2,
							numberPrecision: 2,
						},
						description: 'Penalty for new topics (range -2 to 2)',
					},
					{
						displayName: 'Response Format',
						name: 'responseFormat',
						type: 'options',
						options: [
							{
								name: 'Default (Full JSON)',
								value: 'default',
							},
							{
								name: 'Text Only',
								value: 'text',
							},
						],
						default: 'default',
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						default: 1,
						typeOptions: {
							minValue: 0,
							maxValue: 2,
							numberPrecision: 2,
						},
						description: 'Sampling temperature (0-2)',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						default: 1,
						typeOptions: {
							minValue: 0,
							maxValue: 1,
							numberPrecision: 2,
						},
						description: 'Nucleus sampling (alternative to temperature)',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('aimlApi');
				const apiUrl = credentials.url as string;
				const apiKey = credentials.apiKey as string;
				const endpoint = apiUrl.endsWith('/') ? `${apiUrl}models` : `${apiUrl}/models`;

				const response = await this.helpers.httpRequest({
					method: 'GET',
					url: endpoint,
					headers: {Authorization: `Bearer ${apiKey}`},
					json: true,
				});

				const models = response?.models ?? response?.data ?? response;

				return models
					.filter((model: any) => model.type === 'chat-completion')
					.map((model: any) => ({
						name: model.info?.name || model.name || model.id,
						value: model.id,
					}));
			},
		},
	};
}
