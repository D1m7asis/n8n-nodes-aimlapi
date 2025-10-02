# n8n-nodes-aimlapi

This is an n8n community node for [AI/ML API](https://aimlapi.com/?utm_source=n8n&utm_medium=github&utm_campaign=integration) integration.  
It allows you to interact with large language models (LLMs) and multimodal models directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[AI/ML API](https://aimlapi.com/app/?utm_source=n8n&utm_medium=github&utm_campaign=integration) provides access to **300+ AI models**, including Deepseek, Gemini, ChatGPT, and many others — all with **enterprise-grade rate limits and uptimes**.

---

## Features

- Chat with any LLM available on AI/ML API
- Generate AI images with supported diffusion and vision models
- Dynamic model selection for chat and image endpoints
- Parameter tuning (temperature, max tokens, top-p, penalties)
- Multiple output formats: raw, full response, messages, or plain text
- Flexible image outputs: URLs, base64 data, or raw payloads
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
````

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

* **Operation** – Choose between `Chat Completion` and `Image Generation`.
* **Model** – Select a model from the list or provide an ID via expression.
* **Chat Prompt** *(Chat Completion)* – User prompt to send to the chat model.
* **Chat Extract From Response** – Decide what to return:

  * `Text Only (First Message)` – plain answer string
  * `Assistant Messages` – array of `message` objects
  * `Choices Array` – raw OpenAI-style `choices[]`
  * `Full Raw JSON` – full API response
* **Chat Options** – Fine-tune completions with:

  * **Temperature**
  * **Top P**
  * **Max Tokens**
  * **Presence Penalty**
  * **Frequency Penalty**
  * **Response Format** (e.g. `text`)
* **Image Prompt** *(Image Generation)* – Describe the image you want the model to create.
* **Image Extract From Response** – Return the first/all URLs, first/all base64 images, or the raw payload.
* **Image Options** – Configure additional rendering settings:

  * **Background**
  * **Image Count**
  * **Negative Prompt**
  * **Quality**
  * **Response Format** (`url` or `b64_json`)
  * **Size**
  * **Style**

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

* If the node doesn't show up, try restarting your instance
* If the icon or name doesn't render, make sure you ran `npm run build && gulp build:icons`
* To debug model list: ensure credentials and `/models` endpoint return valid JSON

---

## Support

Please open an issue or pull request in the [GitHub repository](https://github.com/D1m7asis/n8n-nodes-aimlapi) if you encounter problems.
