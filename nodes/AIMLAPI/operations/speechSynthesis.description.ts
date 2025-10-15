import type { INodeProperties } from 'n8n-workflow';

export const speechSynthesisProperties: INodeProperties[] = [
	{
		displayName: 'Text',
		name: 'ttsInput',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				operation: ['speechSynthesis'],
			},
		},
		default: '',
		required: true,
		description: 'Text that should be converted into spoken audio',
	},
	{
		displayName: 'Extract From Response',
		name: 'ttsExtract',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['speechSynthesis'],
			},
		},
		default: 'audioUrl',
		description: 'Choose what part of the speech response to return',
		options: [
			{
				name: 'Audio Base64',
				value: 'audioBase64',
			},
			{
				name: 'Audio URL',
				value: 'audioUrl',
			},
			{
				name: 'Full Raw JSON',
				value: 'raw',
			},
		],
	},
	{
		displayName: 'Speech Options',
		name: 'ttsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				operation: ['speechSynthesis'],
			},
		},
		default: {},
		description: 'Fine-tune the generated audio for compatible voice models',
		options: [
			{
				displayName: 'CFG Scale',
				name: 'cfgScale',
				type: 'number',
				typeOptions: {
					minValue: 0.1,
					maxValue: 2,
					numberPrecision: 2,
				},
				default: 1.3,
				description: 'Classifier Free Guidance scale for Microsoft VALL-E models',
			},
			{
				displayName: 'Container',
				name: 'container',
				type: 'options',
				options: [
					{ name: 'MP3', value: 'mp3' },
					{ name: 'OGG', value: 'ogg' },
					{ name: 'WAV', value: 'wav' },
				],
				default: 'mp3',
				description: 'File wrapper to use for Aura text-to-speech models',
			},
			{
				displayName: 'Enable Subtitles',
				name: 'subtitle',
				type: 'boolean',
				default: false,
				description: 'Whether to toggle subtitle generation for compatible ElevenLabs models',
			},
			{
				displayName: 'Encoding',
				name: 'encoding',
				type: 'options',
				options: [
					{ name: 'AAC', value: 'aac' },
					{ name: 'ALaw', value: 'alaw' },
					{ name: 'FLAC', value: 'flac' },
					{ name: 'Linear16', value: 'linear16' },
					{ name: 'MP3', value: 'mp3' },
					{ name: 'OPUS', value: 'opus' },
					{ name: 'ULaw', value: 'mulaw' },
				],
				default: 'mp3',
				description: 'Codec to encode the generated audio with',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{ name: 'Hex', value: 'hex' },
					{ name: 'URL', value: 'url' },
				],
				default: 'url',
				description: 'Whether to control the response format for ElevenLabs models',
			},
			{
				displayName: 'Sample Rate',
				name: 'sampleRate',
				type: 'number',
				typeOptions: {
					minValue: 8000,
				},
				default: 44100,
				description: 'Whether to set the output sample rate in hertz',
			},
			{
				displayName: 'Script Override',
				name: 'scriptOverride',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Provide a custom script when using Microsoft VALL-E voice models',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Whether to use a deterministic sampling seed for Microsoft VALL-E models',
			},
			{
				displayName: 'Speakers (JSON)',
				name: 'speakers',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Whether to define speakers via JSON for Microsoft VALL-E models',
			},
			{
				displayName: 'Voice',
				name: 'voice',
				type: 'string',
				default: '',
				description: 'Whether to select the ElevenLabs voice to use for synthesis',
			},
		],
	},
];
