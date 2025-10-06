import type { INodeProperties } from 'n8n-workflow';

export const speechTranscriptionProperties: INodeProperties[] = [
  {
    displayName: 'Input Source',
    name: 'transcriptionInputSource',
    type: 'options',
    default: 'binary',
    displayOptions: {
      show: {
        operation: ['speechTranscription'],
      },
    },
    options: [
      {
        name: 'Binary File',
        value: 'binary',
      },
      {
        name: 'Remote URL',
        value: 'url',
      },
    ],
    description: 'Choose whether to upload audio from the workflow or fetch it from a remote URL',
  },
  {
    displayName: 'Binary Property',
    name: 'transcriptionBinaryProperty',
    type: 'string',
    default: 'data',
    required: true,
    displayOptions: {
      show: {
        operation: ['speechTranscription'],
        transcriptionInputSource: ['binary'],
      },
    },
    description: 'Name of the binary property that contains the audio file',
  },
  {
    displayName: 'Audio URL',
    name: 'transcriptionAudioUrl',
    type: 'string',
    default: '',
    placeholder: 'https://example.com/sample.mp3',
    displayOptions: {
      show: {
        operation: ['speechTranscription'],
        transcriptionInputSource: ['url'],
      },
    },
    description: 'Public URL of the audio file to transcribe',
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
        displayName: 'Custom Intent',
        name: 'customIntent',
        type: 'string',
        default: '',
        description:
          'Intent or comma-separated intents for the model to detect in the audio (up to 100 entries)',
      },
      {
        displayName: 'Custom Topic',
        name: 'customTopic',
        type: 'string',
        default: '',
        description:
          'Topic or comma-separated topics for the model to detect in the audio (up to 100 entries)',
      },
      {
        displayName: 'Custom Intent Mode',
        name: 'customIntentMode',
        type: 'options',
        default: 'strict',
        options: [
          {
            name: 'Strict',
            value: 'strict',
          },
          {
            name: 'Extended',
            value: 'extended',
          },
        ],
        description: 'Control whether intents outside of the custom list can be returned',
      },
      {
        displayName: 'Custom Topic Mode',
        name: 'customTopicMode',
        type: 'options',
        default: 'strict',
        options: [
          {
            name: 'Strict',
            value: 'strict',
          },
          {
            name: 'Extended',
            value: 'extended',
          },
        ],
        description: 'Control whether topics outside of the custom list can be returned',
      },
      {
        displayName: 'Detect Language',
        name: 'detectLanguage',
        type: 'boolean',
        default: false,
        description: 'Enable automatic language detection',
      },
      {
        displayName: 'Detect Entities',
        name: 'detectEntities',
        type: 'boolean',
        default: false,
        description: 'Return entity recognition results',
      },
      {
        displayName: 'Detect Topics',
        name: 'detectTopics',
        type: 'boolean',
        default: false,
        description: 'Enable topic classification',
      },
      {
        displayName: 'Diarize',
        name: 'diarize',
        type: 'boolean',
        default: false,
        description: 'Enable speaker diarization',
      },
      {
        displayName: 'Diarize Version',
        name: 'diarizeVersion',
        type: 'string',
        default: '',
        description: 'Specific diarization model version to use',
      },
      {
        displayName: 'Dictation',
        name: 'dictation',
        type: 'boolean',
        default: false,
        description: 'Enable dictation-style formatting',
      },
      {
        displayName: 'Filler Words',
        name: 'fillerWords',
        type: 'boolean',
        default: false,
        description: 'Preserve filler words such as “uh” and “um”',
      },
      {
        displayName: 'Intents',
        name: 'intents',
        type: 'boolean',
        default: false,
        description: 'Return detected intents from the transcript',
      },
      {
        displayName: 'Keywords',
        name: 'keywords',
        type: 'string',
        default: '',
        description: 'Comma-separated keywords to boost detection',
      },
      {
        displayName: 'Search Terms',
        name: 'search',
        type: 'string',
        default: '',
        description: 'Search terms or phrases to match in the audio',
      },
      {
        displayName: 'Measurements',
        name: 'measurements',
        type: 'boolean',
        default: false,
        description: 'Convert spoken measurements to abbreviations',
      },
      {
        displayName: 'Multi Channel',
        name: 'multiChannel',
        type: 'boolean',
        default: false,
        description: 'Transcribe each channel separately',
      },
      {
        displayName: 'Numerals',
        name: 'numerals',
        type: 'boolean',
        default: false,
        description: 'Convert words like “one” to digits',
      },
      {
        displayName: 'Paragraphs',
        name: 'paragraphs',
        type: 'boolean',
        default: false,
        description: 'Split the transcript into paragraphs',
      },
      {
        displayName: 'Profanity Filter',
        name: 'profanityFilter',
        type: 'boolean',
        default: false,
        description: 'Remove or mask profane language',
      },
      {
        displayName: 'Punctuate',
        name: 'punctuate',
        type: 'boolean',
        default: false,
        description: 'Apply punctuation and capitalization',
      },
      {
        displayName: 'Sentiment',
        name: 'sentiment',
        type: 'boolean',
        default: false,
        description: 'Return sentiment analysis results',
      },
      {
        displayName: 'Smart Format',
        name: 'smartFormat',
        type: 'boolean',
        default: false,
        description: 'Improve readability with smart formatting',
      },
      {
        displayName: 'Summarize',
        name: 'summarize',
        type: 'string',
        default: '',
        description: 'Request summary generation (model dependent)',
      },
      {
        displayName: 'Topics',
        name: 'topics',
        type: 'boolean',
        default: false,
        description: 'Return topic analysis results',
      },
      {
        displayName: 'Utterances',
        name: 'utterances',
        type: 'boolean',
        default: false,
        description: 'Segment speech into utterances',
      },
      {
        displayName: 'Utterance Split Seconds',
        name: 'uttSplit',
        type: 'number',
        default: 0,
        description: 'Seconds to wait before detecting pauses between words',
      },
      {
        displayName: 'Extra Metadata',
        name: 'extra',
        type: 'string',
        default: '',
        description: 'Arbitrary metadata to attach to the request',
      },
      {
        displayName: 'Tags',
        name: 'tags',
        type: 'string',
        default: '',
        description: 'Comma-separated tags to label the request',
      },
    ],
  },
];
