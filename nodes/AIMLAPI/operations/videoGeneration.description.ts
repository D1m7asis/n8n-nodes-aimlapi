import type { INodeProperties } from 'n8n-workflow';

export const videoGenerationProperties: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'videoPrompt',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    displayOptions: {
      show: {
        operation: ['videoGeneration'],
      },
    },
    default: '',
    required: true,
    description: 'Describe the scene you want the model to render as a video',
  },
  {
    displayName: 'Extract From Response',
    name: 'videoExtract',
    type: 'options',
    displayOptions: {
      show: {
        operation: ['videoGeneration'],
      },
    },
    default: 'firstUrl',
    description: 'Choose what part of the video response to return',
    options: [
      {
        name: 'All Video URLs',
        value: 'allUrls',
      },
      {
        name: 'First Video URL',
        value: 'firstUrl',
      },
      {
        name: 'Full Raw JSON',
        value: 'raw',
      },
    ],
  },
  {
    displayName: 'Video Options',
    name: 'videoOptions',
    type: 'collection',
    placeholder: 'Add Option',
    displayOptions: {
      show: {
        operation: ['videoGeneration'],
      },
    },
    default: {},
    description: 'Fine-tune the video generation call when supported',
    options: [
      {
        displayName: 'Aspect Ratio',
        name: 'aspectRatio',
        type: 'options',
        options: [
          {
            name: '16:9',
            value: '16:9',
          },
          {
            name: '1:1',
            value: '1:1',
          },
          {
            name: '9:16',
            value: '9:16',
          },
        ],
        default: '16:9',
        description: 'Desired aspect ratio for the video',
      },
      {
        displayName: 'Background Audio URL',
        name: 'musicUrl',
        type: 'string',
        default: '',
        description: 'Optional background soundtrack URL',
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
        default: 6,
        description: 'Length of the output video clip',
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
            name: 'Text to Video',
            value: 'text-to-video',
          },
          {
            name: 'Image to Video',
            value: 'image-to-video',
          },
        ],
        default: 'auto',
        description: 'Select generation mode for compatible models',
      },
      {
        displayName: 'Negative Prompt',
        name: 'negativePrompt',
        type: 'string',
        typeOptions: {
          rows: 3,
        },
        default: '',
        description: 'Describe what the model should avoid in the scene',
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
        description: 'How strongly the video should follow the prompt (0-1)',
      },
      {
        displayName: 'Random Seed',
        name: 'seed',
        type: 'number',
        default: null,
        description: 'Seed for deterministic generations when available',
      },
      {
        displayName: 'Reference Image URL',
        name: 'referenceImageUrl',
        type: 'string',
        default: '',
        description: 'Image URL to guide image-to-video workflows',
      },
      {
        displayName: 'Reference Video URL',
        name: 'referenceVideoUrl',
        type: 'string',
        default: '',
        description: 'Video URL for remix or motion guidance when supported',
      },
    ],
  },
];
