# n8n-nodes-aimlapi

This is an n8n community node for [AI/ML API](https://aimlapi.com/?utm_source=n8n&utm_medium=github&utm_campaign=integration) integration.  
It allows you to interact with large language models (LLMs) and multimodal models directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[AI/ML API](https://aimlapi.com/app/?utm_source=n8n&utm_medium=github&utm_campaign=integration) provides access to **300+ AI models**, including Deepseek, Gemini, ChatGPT, and many others — all with **enterprise-grade rate limits and uptimes**.

---

## Features

- Chat with any LLM available on AI/ML API
- Generate AI images with supported diffusion and vision models
- Create AI music and sound effects with audio-generation models
- Render text-to-video or image-to-video clips
- Convert text to speech and speech to text via TTS/STT models
- Produce text embeddings for search and retrieval workflows
- Dynamic model selection per modality with shared authentication
- Parameter tuning (temperature, max tokens, top-p, penalties, etc.)
- Multiple output formats: raw payloads or curated fields for each modality
- Credential-based authentication

---

## Installation

### Community Node (Recommended)

1. Open your n8n instance
2. Go to **Settings → Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-aimlapi`
5. Accept the prompt to install the node
6. After installation, the node will appear under **AI/ML API** in the node palette

### Manual Installation (Advanced)

```bash
npm install n8n-nodes-aimlapi
```

Then restart your `n8n` instance.

---

## Configuration

### Credentials

To use this node, you must configure **AI/ML API** credentials:

1. Sign up at [https://aimlapi.com/](https://aimlapi.com/?utm_source=n8n&utm_medium=github&utm_campaign=integration)
2. Go to your [dashboard](https://aimlapi.com/app/?utm_source=n8n&utm_medium=github&utm_campaign=integration) and generate an API key
3. In n8n, create new credentials of type **AI/ML API**
4. Paste your API key
5. Save and use in the node

📚 You can also refer to the [provider documentation](https://docs.aimlapi.com/?utm_source=n8n&utm_medium=github&utm_campaign=integration) for detailed API specs.

### Node Parameters

- **Operation** – Select the modality (`Chat Completion`, `Image Generation`, `Audio Generation`, `Video Generation`, `Speech Synthesis`, `Speech Transcription`, or `Embedding Generation`).
- **Model** – Pick a model from the filtered list (dependent on operation) or provide an ID via expression.

#### Chat Completion

- **Use Message List** – Switch between a single prompt and a structured list of chat messages.
- **Prompt/Messages** – Provide either one prompt or multiple messages with explicit roles (`system`, `user`, `assistant`, `developer`, `tool`). Each structured message also supports an optional **Name** to identify the sender (for example, a tool/function name) along with its text **Content**. When using the `tool` role, fill in the required **Tool Call ID** with the identifier returned alongside the assistant tool invocation so the API can pair the response correctly.
- **Extract From Response** – Decide what to return (`Text Only`, `Assistant Messages`, `Choices Array`, or `Full Raw JSON`).
- **Options** – Fine-tune completions with **Temperature**, **Top P**, **Max Tokens**, **Presence Penalty**, **Frequency Penalty**, and **Response Format**.

#### Image Generation

- **Prompt** – Describe the image you want the model to create.
- **Extract From Response** – Return the first/all URLs, first/all base64 images, or the raw payload.
- **Image Options** – Configure **Background**, **Image Count**, **Negative Prompt**, **Quality**, **Response Format**, **Size**, and **Style**.

#### Audio Generation

- **Prompt** – Describe the audio clip you want to generate.
- **Extract From Response** – Return audio URLs, base64 blobs, or the raw payload.
- **Audio Options** – Adjust **Audio Format**, **Duration**, **Mode**, **Negative Prompt**, **Prompt Strength**, **Seed**, **Reference Audio URL**, **Instrument**, and **CFG Scale**.

#### Video Generation

- **Prompt** – Describe the scene for the generated video.
- **Extract From Response** – Return the first/all video URLs or the raw payload.
- **Video Options** – Control **Aspect Ratio/Ratio**, **Duration**, **Kling Types & Image Lists**, **Google Veo Tail Images & Prompt Enhancement**, **Alibaba Resolution/Watermark/Prompt Expansion**, **MiniMax Prompt Optimizer & First Frame**, **Runway Last Image**, plus legacy toggles like **Negative Prompt**, **Prompt Strength**, **Reference Media**, **Background Audio**, **CFG Scale**, and **Seed**.

#### Speech Synthesis

- **Text** – Content that should be spoken aloud.
- **Extract From Response** – Return an audio URL, base64 payload, or the raw response.
- **Speech Options** – Configure **Voice**, **Audio Format**, **Sample Rate**, **Speaking Rate**, and **Style**.

#### Speech Transcription

- **Binary Property** – Name of the binary property that contains the audio file.
- **Extract From Response** – Return transcript text, segment breakdowns, or the raw payload.
- **Transcription Options** – Provide **Language**, **Prompt**, **Response Format**, and **Temperature**.

#### Embedding Generation

- **Input Text** – Text that should be converted into an embedding vector.
- **Extract From Response** – Return the first vector, all vectors, or the raw payload.
- **Embedding Options** – Configure **Encoding Format** and **User Identifier** metadata.

---

## Usage Example

1. Add a **Manual Trigger**
2. Add the **AI/ML API** node
3. Configure credentials
4. Set a model (e.g. `gpt-3.5-turbo`)
5. Enter prompt: `What is the capital of France?`
6. Select `Extract: Text Only`
7. Execute — you’ll get `Paris`

---

## Troubleshooting

- If the node doesn't show up, try restarting your instance
- If the icon or name doesn't render, make sure you ran `npm run build && gulp build:icons`
- To debug model list: ensure credentials and `/models` endpoint return valid JSON

---

## Support

Please open an issue or pull request in the [GitHub repository](https://github.com/D1m7asis/n8n-nodes-aimlapi) if you encounter problems.
