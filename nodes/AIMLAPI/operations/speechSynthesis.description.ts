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
        displayName: 'Container',
        name: 'container',
        type: 'options',
        options: [
          {
            name: 'MP3',
            value: 'mp3',
          },
          {
            name: 'WAV',
            value: 'wav',
          },
          {
            name: 'OGG',
            value: 'ogg',
          },
        ],
        default: 'mp3',
        description: 'File wrapper to use for Aura text-to-speech models',
      },
      {
        displayName: 'Encoding',
        name: 'encoding',
        type: 'options',
        options: [
          {
            name: 'AAC',
            value: 'aac',
          },
          {
            name: 'FLAC',
            value: 'flac',
          },
          {
            name: 'Linear16',
            value: 'linear16',
          },
          {
            name: 'MP3',
            value: 'mp3',
          },
          {
            name: 'OPUS',
            value: 'opus',
          },
          {
            name: 'ULaw',
            value: 'mulaw',
          },
          {
            name: 'ALaw',
            value: 'alaw',
          },
        ],
        default: 'mp3',
        description: 'Codec to encode the generated audio with',
      },
      {
        displayName: 'Sample Rate',
        name: 'sampleRate',
        type: 'number',
        typeOptions: {
          minValue: 8000,
        },
        default: 44100,
        description: 'Output sample rate in hertz',
      },
      {
        displayName: 'Voice',
        name: 'voice',
        type: 'string',
        default: '',
        description: 'ElevenLabs voice to request when using an ElevenLabs model',
      },
      {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        options: [
          {
            name: 'URL',
            value: 'url',
          },
          {
            name: 'Hex',
            value: 'hex',
          },
        ],
        default: 'url',
        description: 'Controls the response format for ElevenLabs models',
      },
      {
        displayName: 'Enable Subtitles',
        name: 'subtitle',
        type: 'boolean',
        default: false,
        description: 'Toggle subtitle generation for compatible ElevenLabs models',
      },
      {
        displayName: 'Script Override',
        name: 'scriptOverride',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '',
        description: 'Provide a custom script when using Microsoft VALL-E voice models',
      },
      {
        displayName: 'Speakers (JSON)',
        name: 'speakers',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '',
        description: 'JSON array describing speakers for Microsoft VALL-E models',
      },
      {
        displayName: 'Seed',
        name: 'seed',
        type: 'number',
        default: 0,
        description: 'Deterministic sampling seed for Microsoft VALL-E models',
      },
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
    ],
  },
];
