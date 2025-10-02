import {
        IExecuteSingleFunctions,
        IHttpRequestOptions,
        ILoadOptionsFunctions,
        IN8nHttpFullResponse,
        INodeExecutionData,
        INodePropertyOptions,
        INodeType,
        INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow/dist/Interfaces';

export class AimlApiImageGeneration implements INodeType {
        description: INodeTypeDescription = {
                displayName: 'AI/ML Image Generation',
                name: 'aimlApiImageGeneration',
                icon: 'file:aimlapi.svg',
                group: ['transform'],
                version: 1,
                description: 'Generate AI images using AIMLAPI models.',
                defaults: {
                        name: 'AI/ML Image Generation',
                },
                inputs: [NodeConnectionType.Main],
                outputs: [NodeConnectionType.Main],
                credentials: [
                        {
                                name: 'aimlApi',
                                required: true,
                        },
                ],
                requestDefaults: {
                        baseURL: '={{ $credentials.url.endsWith("/") ? $credentials.url.slice(0, -1) : $credentials.url }}',
                        headers: {
                                'Content-Type': 'application/json',
                                'X-Title': `n8n AIMLAPI Image Generation Node`,
                        },
                },
                properties: [
                        {
                                displayName: 'Model Name or ID',
                                name: 'model',
                                type: 'options',
                                typeOptions: {
                                        loadOptionsMethod: 'getImageModels',
                                },
                                default: '',
                                required: true,
                                description:
                                        'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>'
                        },
                        {
                                displayName: 'Prompt',
                                name: 'prompt',
                                type: 'string',
                                typeOptions: {
                                        rows: 4,
                                },
                                default: '',
                                required: true,
                                description: 'Describe the image you want the model to generate',
                                routing: {
                                        request: {
                                                method: 'POST',
                                                url: '/images/generations',
                                                body: {
                                                        model: '={{ $parameter["model"] }}',
                                                        prompt: '={{ $value }}',
                                                        n: '={{ $parameter["options"]["imageCount"] ?? undefined }}',
                                                        size: '={{ $parameter["options"]["size"] ?? undefined }}',
                                                        response_format:
                                                                '={{ $parameter["options"]["responseFormat"] ?? undefined }}',
                                                        quality: '={{ $parameter["options"]["quality"] ?? undefined }}',
                                                        style: '={{ $parameter["options"]["style"] ?? undefined }}',
                                                        background:
                                                                '={{ $parameter["options"]["background"] ?? undefined }}',
                                                        negative_prompt:
                                                                '={{ $parameter["options"]["negativePrompt"] ?? undefined }}',
                                                },
                                        },
                                        output: {
                                                postReceive: [
                                                        async function (
                                                                this: IExecuteSingleFunctions,
                                                                items: INodeExecutionData[],
                                                                response: IN8nHttpFullResponse
                                                        ): Promise<INodeExecutionData[]> {
                                                                const extract = this.getNodeParameter('extract', 0) as string;
                                                                const body = response.body as {
                                                                        data?: Array<{
                                                                                url?: string;
                                                                                b64_json?: string;
                                                                                [key: string]: any;
                                                                        }>;
                                                                        [key: string]: any;
                                                                };

                                                                if (extract === 'firstUrl') {
                                                                        const url = body.data?.[0]?.url ?? '';
                                                                        return this.helpers.returnJsonArray([{ url }]);
                                                                }

                                                                if (extract === 'allUrls') {
                                                                        const urls =
                                                                                body.data
                                                                                        ?.map((entry) => entry.url)
                                                                                        .filter((url): url is string => Boolean(url)) ?? [];
                                                                        return this.helpers.returnJsonArray([{ urls }]);
                                                                }

                                                                if (extract === 'firstBase64') {
                                                                        const b64 = body.data?.[0]?.b64_json ?? '';
                                                                        return this.helpers.returnJsonArray([{ base64: b64 }]);
                                                                }

                                                                if (extract === 'allBase64') {
                                                                        const base64 =
                                                                                body.data
                                                                                        ?.map((entry) => entry.b64_json)
                                                                                        .filter((value): value is string => Boolean(value)) ?? [];
                                                                        return this.helpers.returnJsonArray([{ base64 }]);
                                                                }

                                                                return this.helpers.returnJsonArray([{ result: body }]);
                                                        },
                                                ],
                                        },
                                },
                        },
                        {
                                displayName: 'Extract From Response',
                                name: 'extract',
                                type: 'options',
                                default: 'firstUrl',
                                description: 'Choose what part of the response to return',
                                options: [
                                        {
                                                name: 'All Base64 Images',
                                                value: 'allBase64',
                                        },
                                        {
                                                name: 'All Image URLs',
                                                value: 'allUrls',
                                        },
                                        {
                                                name: 'First Base64 Image',
                                                value: 'firstBase64',
                                        },
                                        {
                                                name: 'First Image URL',
                                                value: 'firstUrl',
                                        },
                                        {
                                                name: 'Full Raw JSON',
                                                value: 'raw',
                                        },
                                ],
                        },
                        {
                                displayName: 'Options',
                                name: 'options',
                                type: 'collection',
                                placeholder: 'Add Option',
                                default: {},
                                options: [
                                        {
                                                displayName: 'Background',
                                                name: 'background',
                                                type: 'string',
                                                default: '',
                                                description:
                                                        'Preferred background (for models that support transparent or solid backgrounds)'
                                        },
                                        {
                                                displayName: 'Image Count',
                                                name: 'imageCount',
                                                type: 'number',
                                                default: 1,
                                                description: 'Number of images to generate'
                                        },
                                        {
                                                displayName: 'Negative Prompt',
                                                name: 'negativePrompt',
                                                type: 'string',
                                                typeOptions: {
                                                        rows: 4,
                                                },
                                                default: '',
                                                description: 'Describe what the model should avoid in the generated image'
                                        },
                                        {
                                                displayName: 'Quality',
                                                name: 'quality',
                                                type: 'options',
                                                options: [
                                                        {
                                                                name: 'Standard',
                                                                value: 'standard',
                                                        },
                                                        {
                                                                name: 'High',
                                                                value: 'high',
                                                        },
                                                ],
                                                default: 'standard',
                                                description: 'Image quality level'
                                        },
                                        {
                                                displayName: 'Response Format',
                                                name: 'responseFormat',
                                                type: 'options',
                                                options: [
                                                        {
                                                                name: 'URL',
                                                                value: 'url',
                                                        },
                                                        {
                                                                name: 'Base64 JSON',
                                                                value: 'b64_json',
                                                        },
                                                ],
                                                default: 'url',
                                                description: 'Format in which the images should be returned'
                                        },
                                        {
                                                displayName: 'Size',
                                                name: 'size',
                                                type: 'options',
                                                options: [
                                                        {
                                                                name: '256x256',
                                                                value: '256x256',
                                                        },
                                                        {
                                                                name: '512x512',
                                                                value: '512x512',
                                                        },
                                                        {
                                                                name: '1024x1024',
                                                                value: '1024x1024',
                                                        },
                                                        {
                                                                name: '1920x1080',
                                                                value: '1920x1080',
                                                        },
                                                ],
                                                default: '1024x1024',
                                                description: 'Image size to generate'
                                        },
                                        {
                                                displayName: 'Style',
                                                name: 'style',
                                                type: 'string',
                                                default: '',
                                                description: 'Preferred artistic style (for models that support it)'
                                        },
                                ],
                        },
                ],
        };

        methods = {
                loadOptions: {
                        async getImageModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
                                        options,
                                );

                                const models = response?.models ?? response?.data ?? response;

                                return (models as any[])
                                        .filter((model) => {
                                                const type =
                                                        typeof model.type === 'string'
                                                                ? (model.type as string).toLowerCase()
                                                                : '';

                                                return ['image', 'image-generation', 'images'].includes(type);
                                        })
                                        .map((model) => ({
                                                name: model.info?.name || model.name || model.id,
                                                value: model.id,
                                        }));
                        },
                },
        };
}
