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
        description: 'Preferred output audio format',
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
        displayName: 'Speaking Rate',
        name: 'speed',
        type: 'number',
        typeOptions: {
          minValue: 0.5,
          maxValue: 2,
          numberPrecision: 2,
        },
        default: 1,
        description: 'Playback speed multiplier (0.5-2x)',
      },
      {
        displayName: 'Style',
        name: 'style',
        type: 'string',
        default: '',
        description: 'Optional speaking style or emotion hint',
      },
      {
        displayName: 'Voice',
        name: 'voice',
        type: 'string',
        default: '',
        description: 'Voice or speaker preset to use when the model supports it',
      },
    ],
  },
];
