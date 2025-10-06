import type { INodeProperties } from 'n8n-workflow';

export const imageGenerationProperties: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'imagePrompt',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				operation: ['imageGeneration'],
			},
		},
		default: '',
		required: true,
		description: 'Describe the image you want the model to generate',
	},
	{
		displayName: 'Extract From Response',
		name: 'imageExtract',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['imageGeneration'],
			},
		},
		default: 'firstUrl',
		description: 'Choose what part of the response to return',
		options: [
			{
				name: 'All Base64 Images',
				value: 'allBase64',
			},
			{
				name: 'All Image URLs',
				value: 'allUrls',
			},
			{
				name: 'First Base64 Image',
				value: 'firstBase64',
			},
			{
				name: 'First Image URL',
				value: 'firstUrl',
			},
			{
				name: 'Full Raw JSON',
				value: 'raw',
			},
		],
	},
	{
		displayName: 'Image Options',
		name: 'imageOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				operation: ['imageGeneration'],
			},
		},
		default: {},
		description: 'Additional image generation parameters',
		options: [
			{
				displayName: 'Background',
				name: 'background',
				type: 'string',
				default: '',
				description:
					'Preferred background (for models that support transparent or solid backgrounds)',
			},
			{
				displayName: 'Image Count',
				name: 'imageCount',
				type: 'number',
				default: 1,
				description: 'Number of images to generate',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Describe what the model should avoid in the generated image',
			},
			{
				displayName: 'Quality',
				name: 'quality',
				type: 'options',
				options: [
					{
						name: 'Standard',
						value: 'standard',
					},
					{
						name: 'High',
						value: 'high',
					},
				],
				default: 'standard',
				description: 'Image quality level',
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
					},
					{
						name: 'Base64 JSON',
						value: 'b64_json',
					},
				],
				default: 'url',
				description: 'Format in which the images should be returned',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				options: [
					{
						name: '256x256',
						value: '256x256',
					},
					{
						name: '512x512',
						value: '512x512',
					},
					{
						name: '1024x1024',
						value: '1024x1024',
					},
					{
						name: '1920x1080',
						value: '1920x1080',
					},
				],
				default: '1024x1024',
				description: 'Image size to generate',
			},
			{
				displayName: 'Style',
				name: 'style',
				type: 'string',
				default: '',
				description: 'Preferred artistic style (for models that support it)',
			},
		],
	},
];
