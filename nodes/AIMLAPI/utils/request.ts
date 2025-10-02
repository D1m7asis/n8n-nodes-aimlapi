import type { IHttpRequestOptions } from 'n8n-workflow';

// Header value required by AIMLAPI to identify the integration
const AIMLAPI_NODE_TITLE = 'n8n AIMLAPI Node';
const TRAILING_SLASH_REGEX = /\/+$/;
const VERSION_PREFIX_REGEX = /^\/(v\d+)(?=\/|$)/;
const VERSION_SUFFIX_REGEX = /\/v\d+$/;

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

// Normalizes the base URL to the version requested in the path
function resolveEndpoint(baseURL: string, path: string) {
  const normalizedPath = normalizePath(path);
  const trimmedBase = baseURL.replace(TRAILING_SLASH_REGEX, '');
  const versionMatch = VERSION_PREFIX_REGEX.exec(normalizedPath);

  if (!versionMatch) {
    return {
      baseURL: trimmedBase,
      url: normalizedPath,
    };
  }

  const baseWithoutVersion = trimmedBase.replace(VERSION_SUFFIX_REGEX, '');
  const version = versionMatch[1];
  const resolvedPath = normalizedPath.slice(versionMatch[0].length) || '/';

  return {
    baseURL: `${baseWithoutVersion}/${version}`,
    url: resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`,
  };
}

// Builds a JSON request configuration for AIMLAPI endpoints
export function createRequestOptions(
  baseURL: string,
  path: string,
  method: string = 'POST',
): IHttpRequestOptions {
  const endpoint = resolveEndpoint(baseURL, path);

  return {
    method,
    baseURL: endpoint.baseURL,
    url: endpoint.url,
    headers: {
      'Content-Type': 'application/json',
      'X-Title': AIMLAPI_NODE_TITLE,
    },
    json: true,
    body: {},
  };
}

export { resolveEndpoint };
