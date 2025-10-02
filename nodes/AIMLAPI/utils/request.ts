import type { IHttpRequestOptions } from 'n8n-workflow';

export function createRequestOptions(baseURL: string, url: string, title: string): IHttpRequestOptions {
  return {
    method: 'POST',
    baseURL,
    url,
    headers: {
      'Content-Type': 'application/json',
      'X-Title': title,
    },
    json: true,
    body: {},
  };
}
