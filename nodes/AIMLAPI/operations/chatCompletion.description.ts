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
    required: true,
    description: 'Prompt to send to the AI model',
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
