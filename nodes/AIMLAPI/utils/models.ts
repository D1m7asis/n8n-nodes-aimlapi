import type { IDataObject, INodePropertyOptions } from 'n8n-workflow';
import type { Operation } from '../types';

const IMAGE_MODEL_TYPES = new Set(['image', 'image-generation', 'images']);
const CHAT_MODEL_TYPES = new Set(['chat-completion', 'chat', 'completion', 'text-generation']);

const IMAGE_CAPABILITIES = new Set(['image', 'images', 'image-generation', 'vision']);
const CHAT_CAPABILITIES = new Set(['chat', 'completion', 'text', 'language']);

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
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

function hasAnyCapability(capabilities: Set<string>, supported: Set<string>) {
  for (const capability of capabilities) {
    if (supported.has(capability)) {
      return true;
    }
  }

  return false;
}

function supportsOperation(model: IDataObject, operation: Operation): boolean {
  const type = normalize(model.type);
  const capabilities = extractCapabilities(model);

  if (operation === 'imageGeneration') {
    if (type && IMAGE_MODEL_TYPES.has(type)) {
      return true;
    }

    if (hasAnyCapability(capabilities, IMAGE_CAPABILITIES)) {
      return true;
    }

    return !type && capabilities.size === 0;
  }

  if (type) {
    if (IMAGE_MODEL_TYPES.has(type)) {
      return false;
    }

    if (CHAT_MODEL_TYPES.has(type)) {
      return true;
    }
  }

  if (hasAnyCapability(capabilities, CHAT_CAPABILITIES)) {
    return true;
  }

  return !type && capabilities.size === 0;
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
