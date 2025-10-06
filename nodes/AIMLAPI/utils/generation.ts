import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { createRequestOptions } from './request';

const SUCCESS_STATUSES = new Set(['succeeded', 'success', 'completed', 'done', 'ready', 'finished']);
const RUNNING_STATUSES = new Set(['queued', 'pending', 'processing', 'running', 'in_progress', 'generating']);
const FAILURE_STATUSES = new Set(['failed', 'error', 'cancelled', 'canceled', 'timeout', 'timed_out', 'expired']);

const DEFAULT_POLL_INTERVAL = 2000;
const DEFAULT_MAX_ATTEMPTS = 60;

type MediaType = 'audio' | 'video';

interface GenerationOptions {
  mediaType: MediaType;
  pollIntervalMs?: number;
  maxAttempts?: number;
}

function sleep(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function normalizeStatus(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim().toLowerCase();
  }

  return undefined;
}

function extractStatusFromObject(payload: IDataObject | undefined): string | undefined {
  if (!payload) {
    return undefined;
  }

  const candidates = [
    payload.status,
    payload.state,
    payload.task_status,
    payload.job_status,
    payload.stage,
    payload.task && typeof payload.task === 'object' ? (payload.task as IDataObject).status : undefined,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeStatus(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function getNestedValue(root: IDataObject, path: string[]): unknown {
  let current: unknown = root;

  for (const segment of path) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    current = (current as IDataObject)[segment];
  }

  return current;
}

function toDataArray(value: unknown): IDataObject[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is IDataObject => Boolean(entry) && typeof entry === 'object');
  }

  if (value && typeof value === 'object') {
    return [value as IDataObject];
  }

  return [];
}

const MEDIA_DATA_PATHS: Record<MediaType, string[][]> = {
  audio: [
    ['data'],
    ['result', 'data'],
    ['result', 'audios'],
    ['audios'],
    ['tracks'],
    ['output', 'audios'],
    ['output', 'data'],
  ],
  video: [
    ['data'],
    ['result', 'data'],
    ['videos'],
    ['result', 'videos'],
    ['output', 'videos'],
    ['output', 'data'],
    ['assets'],
  ],
};

function normalizeGenerationPayload(payload: IDataObject, mediaType: MediaType): IDataObject {
  const normalized: IDataObject = { ...payload };

  const paths = MEDIA_DATA_PATHS[mediaType];

  for (const path of paths) {
    const value = getNestedValue(normalized, path);
    const data = toDataArray(value);

    if (data.length > 0) {
      normalized.data = data;
      break;
    }
  }

  return normalized;
}

function extractGenerationId(payload: IDataObject): string | undefined {
  const candidates = [
    payload.generation_id,
    payload.generationId,
    payload.id,
    payload.task_id,
    payload.taskId,
    payload.job_id,
    payload.jobId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate;
    }
  }

  const data = Array.isArray(payload.data) ? payload.data : [];

  for (const entry of data) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const innerId = extractGenerationId(entry as IDataObject);

    if (innerId) {
      return innerId;
    }
  }

  return undefined;
}

function hasGenerationError(payload: IDataObject): string | undefined {
  if (typeof payload.error === 'string' && payload.error.trim() !== '') {
    return payload.error;
  }

  if (payload.error && typeof payload.error === 'object') {
    const errorObject = payload.error as IDataObject;
    const message =
      (typeof errorObject.message === 'string' && errorObject.message) ||
      (typeof errorObject.error === 'string' && errorObject.error);

    if (message) {
      return message;
    }
  }

  if (typeof payload.message === 'string' && payload.message.trim() !== '') {
    return payload.message;
  }

  return undefined;
}

function isSuccessfulStatus(status: string | undefined): boolean {
  if (!status) {
    return false;
  }

  if (SUCCESS_STATUSES.has(status)) {
    return true;
  }

  return false;
}

function isRunningStatus(status: string | undefined): boolean {
  if (!status) {
    return false;
  }

  return RUNNING_STATUSES.has(status);
}

function isFailureStatus(status: string | undefined): boolean {
  if (!status) {
    return false;
  }

  return FAILURE_STATUSES.has(status);
}

async function pollForGeneration(
  context: IExecuteFunctions,
  baseURL: string,
  path: string,
  generationId: string,
  options: GenerationOptions,
): Promise<IDataObject> {
  const pollInterval = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const requestOptions = createRequestOptions(baseURL, path, 'GET', {
      qs: { generation_id: generationId },
    });

    const response = (await context.helpers.httpRequestWithAuthentication.call(
      context,
      'aimlApi',
      requestOptions,
    )) as IDataObject;

    const normalized = normalizeGenerationPayload(response, options.mediaType);
    const status = extractStatusFromObject(normalized);

    if (isFailureStatus(status)) {
      const message = hasGenerationError(normalized);
      const reason = message ? `: ${message}` : '';
      throw new Error(`Generation failed with status "${status}"${reason}`);
    }

    if (isSuccessfulStatus(status) || (Array.isArray(normalized.data) && normalized.data.length > 0)) {
      return normalized;
    }

    if (!status && Array.isArray(normalized.data) && normalized.data.length > 0) {
      return normalized;
    }

    await sleep(pollInterval);
  }

  throw new Error(
    `Timed out while waiting for generation to complete (generation_id: ${generationId})`,
  );
}

export async function resolveGenerationResponse(
  context: IExecuteFunctions,
  baseURL: string,
  path: string,
  initial: IDataObject,
  options: GenerationOptions,
): Promise<IDataObject> {
  const initialNormalized = normalizeGenerationPayload(initial, options.mediaType);
  const generationId = extractGenerationId(initialNormalized);
  const initialStatus = extractStatusFromObject(initialNormalized);

  if (!generationId) {
    return initialNormalized;
  }

  if (
    !isRunningStatus(initialStatus) &&
    Array.isArray(initialNormalized.data) &&
    initialNormalized.data.length > 0
  ) {
    initialNormalized.generation_id = generationId;
    return initialNormalized;
  }

  try {
    const finalResponse = await pollForGeneration(context, baseURL, path, generationId, options);

    if (!finalResponse.generation_id) {
      finalResponse.generation_id = generationId;
    }

    return finalResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`${message}`);
  }
}
