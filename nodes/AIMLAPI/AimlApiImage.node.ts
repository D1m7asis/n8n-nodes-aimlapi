import {
        IExecuteSingleFunctions,
        ILoadOptionsFunctions,
        IN8nHttpFullResponse,
        INodeExecutionData,
        INodeType,
        INodeTypeDescription,
} from 'n8n-workflow';
import {NodeConnectionType} from 'n8n-workflow/dist/Interfaces';
import {fetchModelsByType} from './shared';

export class AimlApiImage implements INodeType {
        description: INodeTypeDescription = {
                displayName: 'AI/ML Image Generation',
                name: 'aimlApiImage',
                icon: 'file:aimlapi.svg',
                group: ['transform'],
                version: 1,
                description: 'Generate images with 300+ AI models such as DALL·E and Flux',
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
                                'X-Title': `n8n AIMLAPI Node`,
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
                                        'Choose model or specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
                                description: 'Prompt to send to the AI model',
                                routing: {
                                        request: {
                                                method: 'POST',
                                                url: '/images/generations',
                                                body: {
                                                        model: '={{ $parameter["model"] }}',
                                                        prompt: '={{ $value }}',
                                                        n: '={{ $parameter["options"]["imageCount"] ?? undefined }}',
                                                        size: '={{ $parameter["options"]["size"] ?? undefined }}',
                                                        quality: '={{ $parameter["options"]["quality"] ?? undefined }}',
                                                        style: '={{ $parameter["options"]["style"] ?? undefined }}',
                                                        background:
                                                                '={{ $parameter["options"]["background"] && $parameter["options"]["background"] !== "default" ? $parameter["options"]["background"] : undefined }}',
                                                        response_format:
                                                                '={{ $parameter["options"]["responseFormat"] ?? undefined }}',
                                                        user: '={{ $parameter["options"]["user"] ?? undefined }}',
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
                                                                                revised_prompt?: string;
                                                                        }>;
                                                                        [key: string]: any;
                                                                };

                                                                const data = Array.isArray(body?.data) ? body.data : [];

                                                                const toImageItem = (
                                                                        image: {
                                                                                url?: string;
                                                                                b64_json?: string;
                                                                                revised_prompt?: string;
                                                                        } | undefined,
                                                                        index: number
                                                                ) => {
                                                                        const item: Record<string, any> = {index};
                                                                        if (image?.url) {
                                                                                item.url = image.url;
                                                                        }
                                                                        if (image?.b64_json) {
                                                                                item.base64 = image.b64_json;
                                                                        }
                                                                        if (image?.revised_prompt) {
                                                                                item.revisedPrompt = image.revised_prompt;
                                                                        }
                                                                        return item;
                                                                };

                                                                if (!data.length) {
                                                                        return this.helpers.returnJsonArray([{result: body}]);
                                                                }

                                                                if (extract === 'images') {
                                                                        return this.helpers.returnJsonArray(
                                                                                data.map((image, index) => toImageItem(image, index))
                                                                        );
                                                                }

                                                                if (extract === 'first') {
                                                                        return this.helpers.returnJsonArray([
                                                                                toImageItem(data[0], 0),
                                                                        ]);
                                                                }

                                                                if (extract === 'urls') {
                                                                        return this.helpers.returnJsonArray([
                                                                                {
                                                                                        urls: data
                                                                                                .map((image) => image.url)
                                                                                                .filter((url): url is string => Boolean(url)),
                                                                                        revisedPrompts: data
                                                                                                .map((image) => image.revised_prompt)
                                                                                                .filter(
                                                                                                        (prompt): prompt is string =>
                                                                                                                Boolean(prompt)
                                                                                                ),
                                                                                },
                                                                        ]);
                                                                }

                                                                if (extract === 'base64') {
                                                                        return this.helpers.returnJsonArray([
                                                                                {
                                                                                        base64: data
                                                                                                .map((image) => image.b64_json)
                                                                                                .filter((entry): entry is string => Boolean(entry)),
                                                                                        revisedPrompts: data
                                                                                                .map((image) => image.revised_prompt)
                                                                                                .filter(
                                                                                                        (prompt): prompt is string =>
                                                                                                                Boolean(prompt)
                                                                                                ),
                                                                                },
                                                                        ]);
                                                                }

                                                                return this.helpers.returnJsonArray([{result: body}]);
                                                        },
                                                ],
                                        },
                                },
                        },
                        {
                                displayName: 'Extract From Response',
                                name: 'extract',
                                type: 'options',
                                default: 'images',
                                description: 'Choose what part of the response to return',
                                options: [
                                        {
                                                name: 'Base64 Array',
                                                value: 'base64',
                                        },
                                        {
                                                name: 'First Image Only',
                                                value: 'first',
                                        },
                                        {
                                                name: 'Full Raw JSON',
                                                value: 'raw',
                                        },
                                        {
                                                name: 'Generated Images (One Item Per Image)',
                                                value: 'images',
                                        },
                                        {
                                                name: 'Image URLs Array',
                                                value: 'urls',
                                        },
                                ],
                        },
                        {
                                displayName: 'Options',
                                name: 'options',
                                type: 'collection',
                                placeholder: 'Add Option',
                                default: {},
                                description: 'Additional parameters for the request',
                                options: [
                                        {
                                                displayName: 'Background',
                                                name: 'background',
                                                type: 'options',
                                                options: [
                                                        {
                                                                name: 'Default',
                                                                value: 'default',
                                                        },
                                                        {
                                                                name: 'Transparent',
                                                                value: 'transparent',
                                                        },
                                                ],
                                                default: 'default',
                                        },
                                        {
                                                displayName: 'Image Count',
                                                name: 'imageCount',
                                                type: 'number',
                                                typeOptions: {
                                                        minValue: 1,
                                                        maxValue: 10,
                                                },
                                                default: 1,
                                                description: 'How many images to generate',
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
                                        },
                                        {
                                                displayName: 'Size',
                                                name: 'size',
                                                type: 'options',
                                                options: [
                                                        {
                                                                name: '1024x1024',
                                                                value: '1024x1024',
                                                        },
                                                        {
                                                                name: '1024x576',
                                                                value: '1024x576',
                                                        },
                                                        {
                                                                name: '1152x1152',
                                                                value: '1152x1152',
                                                        },
                                                        {
                                                                name: '1365x768',
                                                                value: '1365x768',
                                                        },
                                                        {
                                                                name: '512x512',
                                                                value: '512x512',
                                                        },
                                                        {
                                                                name: '896x1152',
                                                                value: '896x1152',
                                                        },
                                                ],
                                                default: '1024x1024',
                                        },
                                        {
                                                displayName: 'Style',
                                                name: 'style',
                                                type: 'options',
                                                options: [
                                                        {
                                                                name: 'Natural',
                                                                value: 'natural',
                                                        },
                                                        {
                                                                name: 'Vivid',
                                                                value: 'vivid',
                                                        },
                                                ],
                                                default: 'natural',
                                        },
                                        {
                                                displayName: 'User Identifier',
                                                name: 'user',
                                                type: 'string',
                                                default: '',
                                                description: 'A unique identifier for the end-user',
                                        },
                                ],
                        },
                ],
        };

        methods = {
                loadOptions: {
                        async getImageModels(this: ILoadOptionsFunctions) {
                                return fetchModelsByType.call(this, ['image', 'image-generation']);
                        },
                },
        };
}
