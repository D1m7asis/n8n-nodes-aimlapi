import type { INodeProperties } from 'n8n-workflow';

export const audioGenerationProperties: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'audioPrompt',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    displayOptions: {
      show: {
        operation: ['audioGeneration'],
      },
    },
    default: '',
    required: true,
    description: 'Describe the audio or music you want the model to generate',
  },
  {
    displayName: 'Extract From Response',
    name: 'audioExtract',
    type: 'options',
    displayOptions: {
      show: {
        operation: ['audioGeneration'],
      },
    },
    default: 'firstUrl',
    description: 'Choose what part of the audio response to return',
    options: [
      {
        name: 'All Audio Base64 Blobs',
        value: 'allBase64',
      },
      {
        name: 'All Audio URLs',
        value: 'allUrls',
      },
      {
        name: 'First Audio Base64 Blob',
        value: 'firstBase64',
      },
      {
        name: 'First Audio URL',
        value: 'firstUrl',
      },
      {
        name: 'Full Raw JSON',
        value: 'raw',
      },
    ],
  },
  {
    displayName: 'Audio Options',
    name: 'audioOptions',
    type: 'collection',
    placeholder: 'Add Option',
    displayOptions: {
      show: {
        operation: ['audioGeneration'],
      },
    },
    default: {},
    description: 'Fine-tune the audio request for compatible models',
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
            name: 'WAV',
            value: 'wav',
          },
          {
            name: 'OGG',
            value: 'ogg',
          },
        ],
        default: 'mp3',
        description: 'Preferred output audio format when supported',
      },
      {
        displayName: 'CFG Scale',
        name: 'cfgScale',
        type: 'number',
        typeOptions: {
          minValue: 0,
          numberPrecision: 2,
        },
        default: null,
        description: 'Classifier-free guidance scale (model dependent)',
      },
      {
        displayName: 'Duration (Seconds)',
        name: 'duration',
        type: 'number',
        typeOptions: {
          minValue: 1,
        },
        default: 30,
        description: 'Target duration of the generated clip',
      },
      {
        displayName: 'Instrument / Style Hint',
        name: 'instrument',
        type: 'string',
        default: '',
        description: 'Optional instrument or style hint for compatible models',
      },
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        options: [
          {
            name: 'Auto',
            value: 'auto',
          },
          {
            name: 'Music',
            value: 'music',
          },
          {
            name: 'Sound Effects',
            value: 'sfx',
          },
        ],
        default: 'auto',
        description: 'High-level guidance for generation mode',
      },
      {
        displayName: 'Negative Prompt',
        name: 'negativePrompt',
        type: 'string',
        typeOptions: {
          rows: 3,
        },
        default: '',
        description: 'Describe what the audio should avoid',
      },
      {
        displayName: 'Prompt Strength',
        name: 'promptStrength',
        type: 'number',
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 2,
        },
        default: null,
        description: 'How strongly the model should follow the prompt (0-1)',
      },
      {
        displayName: 'Random Seed',
        name: 'seed',
        type: 'number',
        default: null,
        description: 'Seed for deterministic generations when supported',
      },
      {
        displayName: 'Reference Audio URL',
        name: 'referenceAudioUrl',
        type: 'string',
        default: '',
        description: 'URL to an audio file to guide style transfer if supported',
      },
    ],
  },
];
