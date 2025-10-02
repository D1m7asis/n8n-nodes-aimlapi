import type {
        IHttpRequestOptions,
        ILoadOptionsFunctions,
        INodePropertyOptions,
} from 'n8n-workflow';

export async function fetchModelsByType(
        this: ILoadOptionsFunctions,
        allowedTypes: string[]
): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('aimlApi');
        const apiUrl = credentials.url as string;
        const endpoint = apiUrl.endsWith('/') ? `${apiUrl}models` : `${apiUrl}/models`;

        const options: IHttpRequestOptions = {
                method: 'GET',
                url: endpoint,
                json: true,
        };

        const response = await this.helpers.httpRequestWithAuthentication.call(
                this,
                'aimlApi',
                options
        );

        const models = (response?.models ?? response?.data ?? response) as Array<Record<string, any>>;

        return models
                .filter((model) => {
                        const type = (model.type ?? model.info?.type ?? '').toString().toLowerCase();
                        if (!allowedTypes.length) {
                                return true;
                        }

                        return allowedTypes.some((allowedType) => type === allowedType.toLowerCase());
                })
                .map((model) => ({
                        name: model.info?.name || model.name || model.id,
                        value: model.id,
                        description: model.info?.description ?? model.description,
                }));
}
