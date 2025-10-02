import type { INodeProperties } from 'n8n-workflow';

export const embeddingGenerationProperties: INodeProperties[] = [
  {
    displayName: 'Input Text',
    name: 'embeddingInput',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    displayOptions: {
      show: {
        operation: ['embeddingGeneration'],
      },
    },
    default: '',
    required: true,
    description: 'Text that should be converted into a numeric embedding',
  },
  {
    displayName: 'Extract From Response',
    name: 'embeddingExtract',
    type: 'options',
    displayOptions: {
      show: {
        operation: ['embeddingGeneration'],
      },
    },
    default: 'vector',
    description: 'Choose what part of the embedding response to return',
    options: [
      {
        name: 'First Embedding Vector',
        value: 'vector',
      },
      {
        name: 'All Embedding Vectors',
        value: 'vectors',
      },
      {
        name: 'Full Raw JSON',
        value: 'raw',
      },
    ],
  },
  {
    displayName: 'Embedding Options',
    name: 'embeddingOptions',
    type: 'collection',
    placeholder: 'Add Option',
    displayOptions: {
      show: {
        operation: ['embeddingGeneration'],
      },
    },
    default: {},
    description: 'Fine-tune the embedding request',
    options: [
      {
        displayName: 'Encoding Format',
        name: 'encodingFormat',
        type: 'options',
        options: [
          {
            name: 'Float',
            value: 'float',
          },
          {
            name: 'Base64',
            value: 'base64',
          },
        ],
        default: 'float',
        description: 'Embedding output encoding',
      },
      {
        displayName: 'User Identifier',
        name: 'user',
        type: 'string',
        default: '',
        description: 'Arbitrary identifier for tracking usage (if supported)',
      },
    ],
  },
];
