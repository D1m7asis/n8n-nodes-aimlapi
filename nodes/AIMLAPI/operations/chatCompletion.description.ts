import type { INodeProperties } from 'n8n-workflow';

export const chatCompletionProperties: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				operation: ['chatCompletion'],
			},
		},
		default: '',
		description:
		'Either enter a single prompt here or configure multiple messages below with specific roles',
	},
	{
		displayName: 'Messages',
		name: 'messagesUi',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Message',
		displayOptions: {
			show: {
				operation: ['chatCompletion'],
			},
		},
		default: {},
		description: 'Build a structured conversation with individual messages and roles',
		options: [
			{
				displayName: 'Message',
				name: 'message',
				values: [
					{
						displayName: 'Role',
						name: 'role',
						type: 'options',
						options: [
							{
								name: 'System',
								value: 'system',
							},
							{
								name: 'User',
								value: 'user',
							},
							{
								name: 'Assistant',
								value: 'assistant',
							},
							{
								name: 'Tool',
								value: 'tool',
							},
							],
						default: 'user',
						description: 'Role of the message in the conversation',
					},
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Content of the message to send for the specified role',
					},
				],
			},
		],
	},
	{
		displayName: 'Extract From Response',
		name: 'extract',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['chatCompletion'],
			},
		},
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
		displayOptions: {
			show: {
				operation: ['chatCompletion'],
			},
		},
		default: {},
		description: 'Additional parameters for the request',
		options: [
			{
				displayName: 'Audio Format',
				name: 'audioFormat',
				type: 'options',
				options: [
					{
						name: 'MP3',
						value: 'mp3',
					},
					{
						name: 'OGG (Opus)',
						value: 'ogg',
					},
					{
						name: 'PCM 16-Bit',
						value: 'pcm16',
					},
					{
						name: 'WAV',
						value: 'wav',
					},
				],
				default: 'wav',
				description: 'Format to request when audio output is enabled',
				displayOptions: {
					show: {
						audioOutput: [true],
					},
				},
			},
			{
				displayName: 'Audio Voice',
				name: 'audioVoice',
				type: 'string',
				default: 'alloy',
				description: 'Voice to synthesize when requesting audio output',
				displayOptions: {
					show: {
						audioOutput: [true],
					},
				},
			},
			{
				displayName: 'Enable Audio Output',
				name: 'audioOutput',
				type: 'boolean',
				default: false,
				description:
					'Whether to request an audio response in addition to text (required for GPT-4o audio preview models)',
			},
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
];
