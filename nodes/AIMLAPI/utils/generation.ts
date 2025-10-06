import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { createRequestOptions } from './request';

const SUCCESS_STATUSES = new Set(['succeeded', 'success', 'completed', 'done', 'ready', 'finished']);
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

function collectObjects(root: unknown): IDataObject[] {
  const collected: IDataObject[] = [];
  const visited = new Set<object>();
  const stack: unknown[] = [root];

  while (stack.length > 0) {
    const value = stack.pop();

    if (!value || typeof value !== 'object') {
      continue;
    }

    if (visited.has(value as object)) {
      continue;
    }

    visited.add(value as object);

    if (Array.isArray(value)) {
      stack.push(...value);
      continue;
    }

    const objectValue = value as IDataObject;
    collected.push(objectValue);

    for (const entry of Object.values(objectValue)) {
      stack.push(entry as unknown);
    }
  }

  return collected;
}

function normalizeStatus(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim().toLowerCase();
  }

  return undefined;
}

function extractStatus(payload: unknown): string | undefined {
  const candidates = collectObjects(payload);

  for (const candidate of candidates) {
    const status = normalizeStatus(
      candidate.status ??
        candidate.state ??
        candidate.task_status ??
        candidate.job_status ??
        candidate.stage ??
        (candidate.task && typeof candidate.task === 'object'
          ? (candidate.task as IDataObject).status
          : undefined),
    );

    if (status) {
      return status;
    }
  }

  return undefined;
}

function extractGenerationId(payload: unknown): string | undefined {
  const candidates = collectObjects(payload);

  for (const candidate of candidates) {
    const ids: Array<unknown> = [
      candidate.generation_id,
      candidate.generationId,
      candidate.id,
      candidate.task_id,
      candidate.taskId,
      candidate.job_id,
      candidate.jobId,
    ];

    for (const id of ids) {
      if (typeof id === 'string' && id.trim() !== '') {
        return id;
      }
    }
  }

  return undefined;
}

function extractErrorMessage(payload: unknown): string | undefined {
  const candidates = collectObjects(payload);

  for (const candidate of candidates) {
    if (typeof candidate.error === 'string' && candidate.error.trim() !== '') {
      return candidate.error;
    }

    if (candidate.error && typeof candidate.error === 'object') {
      const errorObject = candidate.error as IDataObject;
      const message =
        (typeof errorObject.message === 'string' && errorObject.message) ||
        (typeof errorObject.error === 'string' && errorObject.error);

      if (message) {
        return message;
      }
    }

    if (typeof candidate.message === 'string' && candidate.message.trim() !== '') {
      return candidate.message;
    }
  }

  return undefined;
}

function isSuccessfulStatus(status: string | undefined): boolean {
  if (!status) {
    return false;
  }

  return SUCCESS_STATUSES.has(status);
}

function isFailureStatus(status: string | undefined): boolean {
  if (!status) {
    return false;
  }

  return FAILURE_STATUSES.has(status);
}

function pushIfMediaObject(target: IDataObject[], candidate: IDataObject) {
  const url =
    candidate.url ??
    candidate.audio_url ??
    candidate.audioUrl ??
    candidate.video_url ??
    candidate.videoUrl;
  const base64 =
    candidate.b64_json ??
    candidate.base64 ??
    candidate.audio_base64 ??
    candidate.audioBase64 ??
    candidate.data ??
    candidate.bytes;

  if (typeof url === 'string' || typeof base64 === 'string') {
    target.push(candidate);
  }
}

function extractAudioOutputsFromObject(objectValue: IDataObject, outputs: IDataObject[], visited: Set<object>) {
  if (visited.has(objectValue as object)) {
    return;
  }

  visited.add(objectValue as object);

  if (Array.isArray(objectValue)) {
    for (const entry of objectValue) {
      if (entry && typeof entry === 'object') {
        extractAudioOutputsFromObject(entry as IDataObject, outputs, visited);
      }
    }

    return;
  }

  if (objectValue.audio_file && typeof objectValue.audio_file === 'object') {
    extractAudioOutputsFromObject(objectValue.audio_file as IDataObject, outputs, visited);
  }

  if (objectValue.audio_files && Array.isArray(objectValue.audio_files)) {
    for (const entry of objectValue.audio_files) {
      if (entry && typeof entry === 'object') {
        extractAudioOutputsFromObject(entry as IDataObject, outputs, visited);
      }
    }
  }

  if (objectValue.audio && typeof objectValue.audio === 'object') {
    extractAudioOutputsFromObject(objectValue.audio as IDataObject, outputs, visited);
  }

  if (objectValue.tracks && Array.isArray(objectValue.tracks)) {
    for (const entry of objectValue.tracks) {
      if (entry && typeof entry === 'object') {
        extractAudioOutputsFromObject(entry as IDataObject, outputs, visited);
      }
    }
  }

  if (objectValue.files && Array.isArray(objectValue.files)) {
    for (const entry of objectValue.files) {
      if (entry && typeof entry === 'object') {
        extractAudioOutputsFromObject(entry as IDataObject, outputs, visited);
      }
    }
  }

  if (typeof objectValue.url === 'string' || typeof objectValue.b64_json === 'string' || typeof objectValue.base64 === 'string') {
    pushIfMediaObject(outputs, objectValue);
  }

  for (const value of Object.values(objectValue)) {
    if (value && typeof value === 'object') {
      extractAudioOutputsFromObject(value as IDataObject, outputs, visited);
    }
  }
}

function extractVideoOutputsFromObject(objectValue: IDataObject, outputs: IDataObject[], visited: Set<object>) {
  if (visited.has(objectValue as object)) {
    return;
  }

  visited.add(objectValue as object);

  if (Array.isArray(objectValue)) {
    for (const entry of objectValue) {
      if (entry && typeof entry === 'object') {
        extractVideoOutputsFromObject(entry as IDataObject, outputs, visited);
      }
    }

    return;
  }

  if (objectValue.video && typeof objectValue.video === 'object') {
    extractVideoOutputsFromObject(objectValue.video as IDataObject, outputs, visited);
  }

  if (objectValue.videos && Array.isArray(objectValue.videos)) {
    for (const entry of objectValue.videos) {
      if (entry && typeof entry === 'object') {
        extractVideoOutputsFromObject(entry as IDataObject, outputs, visited);
      }
    }
  }

  if (objectValue.assets && Array.isArray(objectValue.assets)) {
    for (const entry of objectValue.assets) {
      if (entry && typeof entry === 'object') {
        extractVideoOutputsFromObject(entry as IDataObject, outputs, visited);
      }
    }
  }

  if (objectValue.output && typeof objectValue.output === 'object') {
    extractVideoOutputsFromObject(objectValue.output as IDataObject, outputs, visited);
  }

  if (typeof objectValue.url === 'string') {
    pushIfMediaObject(outputs, objectValue);
  }

  for (const value of Object.values(objectValue)) {
    if (value && typeof value === 'object') {
      extractVideoOutputsFromObject(value as IDataObject, outputs, visited);
    }
  }
}

export function extractAudioOutputs(payload: unknown): IDataObject[] {
  const outputs: IDataObject[] = [];
  const visited = new Set<object>();

  if (payload && typeof payload === 'object') {
    extractAudioOutputsFromObject(payload as IDataObject, outputs, visited);
  }

  return outputs;
}

export function extractVideoOutputs(payload: unknown): IDataObject[] {
  const outputs: IDataObject[] = [];
  const visited = new Set<object>();

  if (payload && typeof payload === 'object') {
    extractVideoOutputsFromObject(payload as IDataObject, outputs, visited);
  }

  return outputs;
}

function hasMediaPayload(payload: unknown, mediaType: MediaType): boolean {
  if (mediaType === 'audio') {
    return extractAudioOutputs(payload).length > 0;
  }

  return extractVideoOutputs(payload).length > 0;
}

function assertNotFailed(payload: unknown) {
  const status = extractStatus(payload);

  if (isFailureStatus(status)) {
    const reason = extractErrorMessage(payload);
    const suffix = reason ? `: ${reason}` : '';
    throw new Error(`Generation failed with status "${status}"${suffix}`);
  }
}

function shouldPoll(payload: unknown, mediaType: MediaType): { poll: boolean; generationId?: string } {
  const generationId = extractGenerationId(payload);

  if (!generationId) {
    return { poll: false };
  }

  const status = extractStatus(payload);
  const hasMedia = hasMediaPayload(payload, mediaType);

  assertNotFailed(payload);

  if (isSuccessfulStatus(status) && hasMedia) {
    return { poll: false, generationId };
  }

  if (!status && hasMedia) {
    return { poll: false, generationId };
  }

  return { poll: true, generationId };
}

async function pollForGeneration(
  context: IExecuteFunctions,
  baseURL: string,
  path: string,
  generationId: string,
  options: GenerationOptions,
): Promise<unknown> {
  const pollInterval = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  let latest: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await sleep(pollInterval);
    }

    const requestOptions = createRequestOptions(baseURL, path, 'GET', {
      qs: { generation_id: generationId },
    });

    latest = await context.helpers.httpRequestWithAuthentication.call(context, 'aimlApi', requestOptions);

    assertNotFailed(latest);

    const pollState = shouldPoll(latest, options.mediaType);

    if (!pollState.poll) {
      return latest;
    }
  }

  throw new Error(`Timed out while waiting for generation to complete (generation_id: ${generationId})`);
}

export async function resolveGenerationResponse(
  context: IExecuteFunctions,
  baseURL: string,
  path: string,
  initial: unknown,
  options: GenerationOptions,
): Promise<unknown> {
  const pollState = shouldPoll(initial, options.mediaType);

  if (!pollState.poll || !pollState.generationId) {
    return initial;
  }

  return pollForGeneration(context, baseURL, path, pollState.generationId, options);
}
