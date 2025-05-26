import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AIMLApi implements ICredentialType {
	name = 'aimlApi';

	displayName = 'AI/ML API';

	documentationUrl = 'https://docs.aimlapi.com/?utm_source=n8n&utm_medium=github&utm_campaign=integration';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
		},
		{
			displayName: 'Base URL',
			name: 'url',
			type: 'hidden',
			default: 'https://api.aimlapi.com/v1',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.aimlapi.com',
			url: '/assistants',
			method: 'GET',
		},
	};
}
