import type { IDataObject, IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';

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

type RequestOptionsOverrides = Omit<
	IHttpRequestOptions,
	'baseURL' | 'url' | 'method' | 'headers'
> & {
	headers?: IDataObject;
};

function hasContentTypeHeader(headers?: IDataObject): boolean {
	if (!headers) {
		return false;
	}

	return Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');
}

// Builds a JSON request configuration for AIMLAPI endpoints
export function createRequestOptions(
	baseURL: string,
	path: string,
	method: IHttpRequestMethods = 'POST',
	overrides: RequestOptionsOverrides = {},
): IHttpRequestOptions {
	const endpoint = resolveEndpoint(baseURL, path);

	const { headers: overrideHeaders, ...restOverrides } = overrides;

	const headers: IDataObject = {
		'X-Title': AIMLAPI_NODE_TITLE,
		...(overrideHeaders ?? {}),
	};

	if (!hasContentTypeHeader(headers)) {
		headers['Content-Type'] = 'application/json';
	}

	return {
		method,
		baseURL: endpoint.baseURL,
		url: endpoint.url,
		headers,
		json: true,
		body: {},
		...restOverrides,
	};
}

export { resolveEndpoint };
