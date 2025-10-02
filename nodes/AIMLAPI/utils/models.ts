import type { IDataObject, INodePropertyOptions } from 'n8n-workflow';
import type { Operation } from '../types';

// Maps operations to known model type aliases returned by the /models endpoint
const OPERATION_TYPE_ALIASES: Record<Operation, Set<string>> = {
  chatCompletion: new Set(['chat-completion', 'chat', 'completion', 'text-generation', 'language-completion', 'responses']),
  imageGeneration: new Set(['image', 'image-generation', 'images', 'vision']),
  audioGeneration: new Set(['audio', 'music', 'sound']),
  videoGeneration: new Set(['video']),
  speechSynthesis: new Set(['tts', 'text-to-speech', 'speech']),
  speechTranscription: new Set(['stt', 'speech-to-text', 'transcription']),
  embeddingGeneration: new Set(['embedding', 'embeddings']),
};

// Maps operations to capability hints so models without a `type` still resolve correctly
const OPERATION_CAPABILITY_ALIASES: Partial<Record<Operation, Set<string>>> = {
  chatCompletion: new Set(['chat', 'completion', 'text', 'language', 'llm']),
  imageGeneration: new Set(['image', 'images', 'image-generation', 'vision']),
  audioGeneration: new Set(['audio', 'music', 'sound']),
  videoGeneration: new Set(['video']),
  speechSynthesis: new Set(['tts', 'speech', 'voice']),
  speechTranscription: new Set(['stt', 'speech-to-text', 'transcription']),
  embeddingGeneration: new Set(['embedding', 'vector']),
};

const TRAILING_WHITESPACE_REGEX = /\s+/g;

function normalize(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(TRAILING_WHITESPACE_REGEX, ' ').toLowerCase();
}

function extractCapabilities(model: IDataObject): Set<string> {
  const capabilities = model.capabilities;

  if (Array.isArray(capabilities)) {
    return new Set(capabilities.map(normalize).filter(Boolean));
  }

  if (capabilities && typeof capabilities === 'object') {
    return new Set(
      Object.entries(capabilities)
        .filter(([, supported]) => Boolean(supported))
        .map(([key]) => normalize(key))
        .filter(Boolean),
    );
  }

  return new Set();
}

function hasAnyCapability(capabilities: Set<string>, supported: Set<string> | undefined) {
  if (!supported) {
    return false;
  }

  for (const capability of capabilities) {
    if (supported.has(capability)) {
      return true;
    }
  }

  return false;
}

function isTypeClaimedByOtherOperation(type: string, operation: Operation) {
  return Object.entries(OPERATION_TYPE_ALIASES).some(([key, set]) => key !== operation && set.has(type));
}

function supportsOperation(model: IDataObject, operation: Operation): boolean {
  const type = normalize(model.type);
  const capabilities = extractCapabilities(model);
  const supportedTypes = OPERATION_TYPE_ALIASES[operation];
  const supportedCapabilities = OPERATION_CAPABILITY_ALIASES[operation];

  if (type && supportedTypes.has(type)) {
    return true;
  }

  if (hasAnyCapability(capabilities, supportedCapabilities)) {
    return true;
  }

  if (operation === 'chatCompletion') {
    if (!type && capabilities.size === 0) {
      return true;
    }

    if (type && !isTypeClaimedByOtherOperation(type, operation)) {
      return true;
    }
  }

  return false;
}

export function toModelOptions(models: unknown, operation: Operation): INodePropertyOptions[] {
  if (!Array.isArray(models)) {
    return [];
  }

  return (models as Array<IDataObject | null | undefined>)
    .filter((model): model is IDataObject => Boolean(model) && typeof model === 'object')
    .filter((model) => supportsOperation(model, operation))
    .map((model) => {
      const info = (model.info as IDataObject) ?? {};
      const name =
        (typeof info.name === 'string' && info.name) ||
        (typeof model.name === 'string' && model.name) ||
        (typeof model.id === 'string' && model.id) ||
        '';

      const value = typeof model.id === 'string' ? model.id : '';

      return {
        name,
        value,
      } satisfies INodePropertyOptions;
    })
    .filter((option) => option.value !== '');
}
