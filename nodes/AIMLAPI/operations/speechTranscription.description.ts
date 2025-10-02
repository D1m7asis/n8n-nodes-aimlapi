import type { INodeProperties } from 'n8n-workflow';

export const speechTranscriptionProperties: INodeProperties[] = [
  {
    displayName: 'Binary Property',
    name: 'transcriptionBinaryProperty',
    type: 'string',
    default: 'data',
    required: true,
    displayOptions: {
      show: {
        operation: ['speechTranscription'],
      },
    },
    description: 'Name of the binary property that contains the audio file',
  },
  {
    displayName: 'Extract From Response',
    name: 'transcriptionExtract',
    type: 'options',
    displayOptions: {
      show: {
        operation: ['speechTranscription'],
      },
    },
    default: 'text',
    description: 'Choose what part of the transcription response to return',
    options: [
      {
        name: 'Segments',
        value: 'segments',
      },
      {
        name: 'Text',
        value: 'text',
      },
      {
        name: 'Full Raw JSON',
        value: 'raw',
      },
    ],
  },
  {
    displayName: 'Transcription Options',
    name: 'transcriptionOptions',
    type: 'collection',
    placeholder: 'Add Option',
    displayOptions: {
      show: {
        operation: ['speechTranscription'],
      },
    },
    default: {},
    description: 'Fine-tune the transcription request for compatible models',
    options: [
      {
        displayName: 'Language',
        name: 'language',
        type: 'string',
        default: '',
        description: 'Language code of the input audio',
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: {
          rows: 3,
        },
        default: '',
        description: 'Provide additional context or vocabulary hints',
      },
      {
        displayName: 'Response Format',
        name: 'responseFormat',
        type: 'options',
        options: [
          {
            name: 'JSON',
            value: 'json',
          },
          {
            name: 'SRT',
            value: 'srt',
          },
          {
            name: 'Text',
            value: 'text',
          },
          {
            name: 'Verbose JSON',
            value: 'verbose_json',
          },
          {
            name: 'VTT',
            value: 'vtt',
          },
        ],
        default: 'json',
        description: 'Format of the transcription output',
      },
      {
        displayName: 'Temperature',
        name: 'temperature',
        type: 'number',
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 2,
        },
        default: 0,
        description: 'Sampling temperature (0-1)',
      },
    ],
  },
];
