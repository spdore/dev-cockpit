// ── AI Provider Registry ──
// Each provider defines its name, models, API endpoint, and auth method.

export interface ProviderConfig {
  key: string;
  name: string;
  models: string[];
  defaultModel: string;
  apiKeyLabel: string;
  apiKeyHelp: string;
  /** SSE streaming endpoint */
  baseUrl: string;
  /** Build fetch options for the provider's API */
  buildRequest: (model: string, apiKey: string, systemPrompt: string, userMessage: string) => { url: string; init: RequestInit };
  /** Parse an SSE data line into a text token, or null if not a token */
  parseToken: (data: Record<string, unknown>) => string | null;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  gemini: {
    key: "gemini",
    name: "Gemini",
    models: ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.5-flash"],
    defaultModel: "gemini-3.1-flash-lite",
    apiKeyLabel: "Gemini API Key",
    apiKeyHelp: "在 aistudio.google.com/apikey 免费获取",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    buildRequest(model, apiKey, systemPrompt, userMessage) {
      const url = `${this.baseUrl}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
      const body = JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      });
      return { url, init: { method: "POST", headers: { "Content-Type": "application/json" }, body } };
    },
    parseToken(data) {
      return (data?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>)?.[0]?.content?.parts?.[0]?.text || null;
    },
  },

  openai: {
    key: "openai",
    name: "OpenAI",
    models: ["gpt-5.4-mini", "gpt-5.4", "gpt-5.5"],
    defaultModel: "gpt-5.4-mini",
    apiKeyLabel: "OpenAI API Key",
    apiKeyHelp: "在 platform.openai.com/api-keys 获取",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    buildRequest(model, apiKey, systemPrompt, userMessage) {
      const body = JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 2048,
        stream: true,
      });
      return { url: this.baseUrl, init: { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body } };
    },
    parseToken(data) {
      return (data?.choices as Array<{ delta?: { content?: string } }>)?.[0]?.delta?.content || null;
    },
  },

  claude: {
    key: "claude",
    name: "Claude",
    models: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-8"],
    defaultModel: "claude-haiku-4-5-20251001",
    apiKeyLabel: "Anthropic API Key",
    apiKeyHelp: "在 console.anthropic.com 获取",
    baseUrl: "https://api.anthropic.com/v1/messages",
    buildRequest(model, apiKey, systemPrompt, userMessage) {
      const body = JSON.stringify({
        model,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
        max_tokens: 2048,
        temperature: 0.2,
        stream: true,
      });
      return { url: this.baseUrl, init: { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body } };
    },
    parseToken(data) {
      if (data?.type === "content_block_delta") return (data?.delta as { text?: string })?.text || null;
      return null;
    },
  },

  deepseek: {
    key: "deepseek",
    name: "DeepSeek",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
    defaultModel: "deepseek-v4-flash",
    apiKeyLabel: "DeepSeek API Key",
    apiKeyHelp: "在 platform.deepseek.com 获取",
    baseUrl: "https://api.deepseek.com/v1/chat/completions",
    buildRequest(model, apiKey, systemPrompt, userMessage) {
      const body = JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 2048,
        stream: true,
      });
      return { url: this.baseUrl, init: { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body } };
    },
    parseToken(data) {
      return (data?.choices as Array<{ delta?: { content?: string } }>)?.[0]?.delta?.content || null;
    },
  },

  qwen: {
    key: "qwen",
    name: "Qwen (通义千问)",
    models: ["qwen3-max", "qwen-plus", "qwen3.5-plus", "qwen3.5-flash"],
    defaultModel: "qwen-plus",
    apiKeyLabel: "Qwen API Key",
    apiKeyHelp: "在 dashscope.aliyuncs.com 获取",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    buildRequest(model, apiKey, systemPrompt, userMessage) {
      const body = JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 2048,
        stream: true,
      });
      return { url: this.baseUrl, init: { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body } };
    },
    parseToken(data) {
      return (data?.choices as Array<{ delta?: { content?: string } }>)?.[0]?.delta?.content || null;
    },
  },
};

export function getProvider(key: string): ProviderConfig | undefined {
  return PROVIDERS[key];
}

export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS);
}

export const DEFAULT_PROVIDER = "gemini";
