import {
        IDataObject,
        IExecuteFunctions,
        IHttpRequestOptions,
        ILoadOptionsFunctions,
        INodeExecutionData,
        INodePropertyOptions,
        INodeType,
        INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow/dist/Interfaces';

type ChatOperation = 'chatCompletion';
type ImageOperation = 'imageGeneration';
type Operation = ChatOperation | ImageOperation;
type ChatExtractOption = 'text' | 'messages' | 'choices' | 'raw';
type ImageExtractOption = 'firstUrl' | 'allUrls' | 'firstBase64' | 'allBase64' | 'raw';

const IMAGE_MODEL_TYPES = new Set(['image', 'image-generation', 'images']);
const CHAT_MODEL_TYPES = new Set(['chat-completion', 'chat', 'completion', 'text-generation']);

export class AimlApi implements INodeType {
        description: INodeTypeDescription = {
                displayName: 'AI/ML API',
                name: 'aimlApi',
                icon: 'file:aimlapi.svg',
                group: ['transform'],
                version: 1,
                subtitle: '={{ $parameter["operation"] === "imageGeneration" ? "Image Generation" : "Chat Completion" }}',
                description: 'Choose from 300+ AI models from Gemini and ChatGPT to DeepSeek and Llama.',
                defaults: {
                        name: 'AI/ML API',
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
                                displayName: 'Operation',
                                name: 'operation',
                                type: 'options',
                                noDataExpression: true,
                                options: [
                                        {
                                                name: 'Chat Completion',
                                                value: 'chatCompletion',
                                                action: 'Generate text using chat completion models',
                                                description: 'Generate text using chat completion models',
                                        },
                                        {
                                                name: 'Image Generation',
                                                value: 'imageGeneration',
                                                action: 'Generate images from text prompts',
                                                description: 'Generate images from text prompts',
                                        },
                                ],
                                default: 'chatCompletion',
                        },
                        {
                                displayName: 'Model Name or ID',
                                name: 'model',
                                type: 'options',
                                typeOptions: {
                                        loadOptionsMethod: 'getModels',
                                        loadOptionsDependsOn: ['operation'],
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
                                displayOptions: {
                                        show: {
                                                operation: ['chatCompletion'],
                                        },
                                },
                                default: '',
                                required: true,
                                description: 'Prompt to send to the AI model',
                        },
                        {
                                displayName: 'Extract From Response',
                                name: 'extract',
                                type: 'options',
                                displayOptions: {
                                        show: {
                                                operation: ['chatCompletion'],
                                        },
                                },
                                default: 'text',
                                description: 'Choose what part of the response to return',
                                options: [
                                        {
                                                name: 'Text Only (First Message)',
                                                value: 'text',
                                        },
                                        {
                                                name: 'Assistant Messages',
                                                value: 'messages',
                                        },
                                        {
                                                name: 'Choices Array',
                                                value: 'choices',
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
                                displayOptions: {
                                        show: {
                                                operation: ['chatCompletion'],
                                        },
                                },
                                default: {},
                                description: 'Additional parameters for the request',
                                options: [
                                        {
                                                displayName: 'Frequency Penalty',
                                                name: 'frequencyPenalty',
                                                type: 'number',
                                                default: null,
                                                typeOptions: {
                                                        minValue: -2,
                                                        maxValue: 2,
                                                        numberPrecision: 2,
                                                },
                                                description: 'Penalty for repeated tokens (range -2 to 2)',
                                        },
                                        {
                                                displayName: 'Max Tokens',
                                                name: 'maxTokens',
                                                type: 'number',
                                                default: null,
                                                description: 'Maximum number of tokens to generate',
                                        },
                                        {
                                                displayName: 'Presence Penalty',
                                                name: 'presencePenalty',
                                                type: 'number',
                                                default: null,
                                                typeOptions: {
                                                        minValue: -2,
                                                        maxValue: 2,
                                                        numberPrecision: 2,
                                                },
                                                description: 'Penalty for new topics (range -2 to 2)',
                                        },
                                        {
                                                displayName: 'Response Format',
                                                name: 'responseFormat',
                                                type: 'options',
                                                options: [
                                                        {
                                                                name: 'Default (Full JSON)',
                                                                value: 'default',
                                                        },
                                                        {
                                                                name: 'Text Only',
                                                                value: 'text',
                                                        },
                                                ],
                                                default: 'default',
                                        },
                                        {
                                                displayName: 'Temperature',
                                                name: 'temperature',
                                                type: 'number',
                                                default: 1,
                                                typeOptions: {
                                                        minValue: 0,
                                                        maxValue: 2,
                                                        numberPrecision: 2,
                                                },
                                                description: 'Sampling temperature (0-2)',
                                        },
                                        {
                                                displayName: 'Top P',
                                                name: 'topP',
                                                type: 'number',
                                                default: 1,
                                                typeOptions: {
                                                        minValue: 0,
                                                        maxValue: 1,
                                                        numberPrecision: 2,
                                                },
                                                description: 'Nucleus sampling (alternative to temperature)',
                                        },
                                ],
                        },
                        {
                                displayName: 'Prompt',
                                name: 'imagePrompt',
                                type: 'string',
                                typeOptions: {
                                        rows: 4,
                                },
                                displayOptions: {
                                        show: {
                                                operation: ['imageGeneration'],
                                        },
                                },
                                default: '',
                                required: true,
                                description: 'Describe the image you want the model to generate',
                        },
                        {
                                displayName: 'Extract From Response',
                                name: 'imageExtract',
                                type: 'options',
                                displayOptions: {
                                        show: {
                                                operation: ['imageGeneration'],
                                        },
                                },
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
                                displayName: 'Image Options',
                                name: 'imageOptions',
                                type: 'collection',
                                placeholder: 'Add Option',
                                displayOptions: {
                                        show: {
                                                operation: ['imageGeneration'],
                                        },
                                },
                                default: {},
                                description: 'Additional image generation parameters',
                                options: [
                                        {
                                                displayName: 'Background',
                                                name: 'background',
                                                type: 'string',
                                                default: '',
                                                description: 'Preferred background (for models that support transparent or solid backgrounds)',
                                        },
                                        {
                                                displayName: 'Image Count',
                                                name: 'imageCount',
                                                type: 'number',
                                                default: 1,
                                                description: 'Number of images to generate',
                                        },
                                        {
                                                displayName: 'Negative Prompt',
                                                name: 'negativePrompt',
                                                type: 'string',
                                                typeOptions: {
                                                        rows: 4,
                                                },
                                                default: '',
                                                description: 'Describe what the model should avoid in the generated image',
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
                                                description: 'Image quality level',
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
                                                description: 'Format in which the images should be returned',
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
                                                description: 'Image size to generate',
                                        },
                                        {
                                                displayName: 'Style',
                                                name: 'style',
                                                type: 'string',
                                                default: '',
                                                description: 'Preferred artistic style (for models that support it)',
                                        },
                                ],
                        },
                ],
        };

        async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
                const items = this.getInputData();
                const returnItems: INodeExecutionData[] = [];

                const credentials = await this.getCredentials('aimlApi');
                const rawBaseUrl = (credentials.url as string) ?? '';
                const baseURL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

                for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                        try {
                                const operation = this.getNodeParameter('operation', itemIndex) as Operation;
                                const model = this.getNodeParameter('model', itemIndex) as string;

                                const headersTitle =
                                        operation === 'imageGeneration'
                                                ? 'n8n AIMLAPI Image Generation Node'
                                                : 'n8n AIMLAPI Node';

                                const requestOptions: IHttpRequestOptions = {
                                        method: 'POST',
                                        baseURL,
                                        url: operation === 'imageGeneration' ? '/images/generations' : '/chat/completions',
                                        headers: {
                                                'Content-Type': 'application/json',
                                                'X-Title': headersTitle,
                                        },
                                        body: {},
                                        json: true,
                                };

                                if (operation === 'chatCompletion') {
                                        const prompt = this.getNodeParameter('prompt', itemIndex) as string;
                                        const extract = this.getNodeParameter('extract', itemIndex) as ChatExtractOption;
                                        const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

                                        const body: IDataObject = {
                                                model,
                                                messages: [
                                                        {
                                                                role: 'user',
                                                                content: prompt,
                                                        },
                                                ],
                                        };

                                        const temperature = options.temperature as number | null | undefined;
                                        if (temperature !== undefined && temperature !== null) {
                                                body.temperature = temperature;
                                        }

                                        const topP = options.topP as number | null | undefined;
                                        if (topP !== undefined && topP !== null) {
                                                body.top_p = topP;
                                        }

                                        const maxTokens = options.maxTokens as number | null | undefined;
                                        if (maxTokens !== undefined && maxTokens !== null) {
                                                body.max_tokens = maxTokens;
                                        }

                                        const frequencyPenalty = options.frequencyPenalty as number | null | undefined;
                                        if (frequencyPenalty !== undefined && frequencyPenalty !== null) {
                                                body.frequency_penalty = frequencyPenalty;
                                        }

                                        const presencePenalty = options.presencePenalty as number | null | undefined;
                                        if (presencePenalty !== undefined && presencePenalty !== null) {
                                                body.presence_penalty = presencePenalty;
                                        }

                                        const responseFormat = options.responseFormat as string | undefined;
                                        if (responseFormat === 'text') {
                                                body.response_format = { type: 'text' };
                                        }

                                        requestOptions.body = body;

                                        const response = (await this.helpers.httpRequestWithAuthentication.call(
                                                this,
                                                'aimlApi',
                                                requestOptions,
                                        )) as IDataObject;

                                        const choices = (response.choices as IDataObject[]) ?? [];

                                        if (extract === 'text') {
                                                const firstMessage = (choices[0]?.message as IDataObject | undefined) ?? {};
                                                const content = (firstMessage.content as string | undefined) ?? '';
                                                returnItems.push({ json: { content } });
                                                continue;
                                        }

                                        if (extract === 'messages') {
                                                const messages = choices
                                                        .map((choice) => choice.message as IDataObject | undefined)
                                                        .filter((message): message is IDataObject => message !== undefined);
                                                returnItems.push({ json: { result: messages } });
                                                continue;
                                        }

                                        if (extract === 'choices') {
                                                returnItems.push({ json: { result: choices } });
                                                continue;
                                        }

                                        returnItems.push({ json: { result: response } });
                                        continue;
                                }

                                const prompt = this.getNodeParameter('imagePrompt', itemIndex) as string;
                                const extract = this.getNodeParameter('imageExtract', itemIndex) as ImageExtractOption;
                                const options = this.getNodeParameter('imageOptions', itemIndex, {}) as IDataObject;

                                const body: IDataObject = {
                                        model,
                                        prompt,
                                };

                                const imageCount = options.imageCount as number | null | undefined;
                                if (imageCount !== undefined && imageCount !== null) {
                                        body.n = imageCount;
                                }

                                const size = options.size as string | undefined;
                                if (size) {
                                        body.size = size;
                                }

                                const responseFormat = options.responseFormat as string | undefined;
                                if (responseFormat) {
                                        body.response_format = responseFormat;
                                }

                                const quality = options.quality as string | undefined;
                                if (quality) {
                                        body.quality = quality;
                                }

                                const style = options.style as string | undefined;
                                if (style) {
                                        body.style = style;
                                }

                                const background = options.background as string | undefined;
                                if (background) {
                                        body.background = background;
                                }

                                const negativePrompt = options.negativePrompt as string | undefined;
                                if (negativePrompt) {
                                        body.negative_prompt = negativePrompt;
                                }

                                requestOptions.body = body;

                                const response = (await this.helpers.httpRequestWithAuthentication.call(
                                        this,
                                        'aimlApi',
                                        requestOptions,
                                )) as IDataObject;

                                const data = (response.data as IDataObject[]) ?? [];

                                if (extract === 'firstUrl') {
                                        const url = (data[0]?.url as string | undefined) ?? '';
                                        returnItems.push({ json: { url } });
                                        continue;
                                }

                                if (extract === 'allUrls') {
                                        const urls = data
                                                .map((entry) => entry.url as string | undefined)
                                                .filter((url): url is string => Boolean(url));
                                        returnItems.push({ json: { urls } });
                                        continue;
                                }

                                if (extract === 'firstBase64') {
                                        const base64 = (data[0]?.b64_json as string | undefined) ?? '';
                                        returnItems.push({ json: { base64 } });
                                        continue;
                                }

                                if (extract === 'allBase64') {
                                        const base64 = data
                                                .map((entry) => entry.b64_json as string | undefined)
                                                .filter((value): value is string => Boolean(value));
                                        returnItems.push({ json: { base64 } });
                                        continue;
                                }

                                returnItems.push({ json: { result: response } });
                        } catch (error) {
                                if (this.continueOnFail()) {
                                        returnItems.push({
                                                json: {
                                                        error:
                                                                error instanceof Error
                                                                        ? error.message
                                                                        : (error as IDataObject),
                                                },
                                        });
                                        continue;
                                }

                                throw error;
                        }
                }

                return [returnItems];
        }

        methods = {
                loadOptions: {
                        async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
                                const operation = (this.getCurrentNodeParameter('operation') as Operation) ?? 'chatCompletion';

                                if (!Array.isArray(models)) {
                                        return [];
                                }

                                return (models as IDataObject[])
                                        .filter((model) => {
                                                const type =
                                                        typeof model.type === 'string'
                                                                ? (model.type as string).toLowerCase()
                                                                : '';

                                                if (operation === 'imageGeneration') {
                                                        return IMAGE_MODEL_TYPES.has(type);
                                                }

                                                if (type) {
                                                        return CHAT_MODEL_TYPES.has(type) && !IMAGE_MODEL_TYPES.has(type);
                                                }

                                                if (operation === 'imageGeneration') {
                                                        return false;
                                                }

                                                return true;
                                        })
                                        .map((model) => {
                                                const info = model.info as IDataObject | undefined;
                                                const name =
                                                        (info?.name as string | undefined) ??
                                                        (model.name as string | undefined) ??
                                                        (model.id as string | undefined) ??
                                                        '';

                                                const value = (model.id as string | undefined) ?? '';

                                                return {
                                                        name,
                                                        value,
                                                };
                                        })
                                        .filter((option) => option.value !== '');
                        },
                },
        };
}
