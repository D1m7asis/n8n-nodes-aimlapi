import type { IDataObject } from 'n8n-workflow';

export function setIfDefined(target: IDataObject, key: string, value: unknown) {
	if (value === undefined || value === null) {
		return;
	}

	if (typeof value === 'string' && value.trim() === '') {
		return;
	}

	target[key] = value;
}
