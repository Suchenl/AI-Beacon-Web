/**
 * AI Provider Abstraction Layer
 * 
 * This module provides a unified interface for multiple AI models:
 * - Google Gemini
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic Claude
 * - Qwen (通义千问)
 * - Grok (xAI)
 * 
 * Usage:
 *   const provider = getAIProvider();
 *   const response = await provider.generateContent({ prompt, tools });
 */

import { GoogleGenAI } from "@google/genai";

// ============================================================================
// Types and Interfaces
// ============================================================================

export type AIModel = 'gemini-3-pro' | 'gemini-2.5-flash' | 'gemini-2.0-flash' | 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'claude-3-5-sonnet' | 'claude-3-opus' | 'qwen3-max' | 'qwen3-omni' | 'grok-beta' | 'grok-2';

export interface GenerateContentOptions {
    prompt: string;
    model?: AIModel;
    tools?: Array<{ googleSearch?: {} }>;
    systemInstruction?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface GenerateContentResponse {
    text: string;
    candidates?: any[];
    groundingMetadata?: any;
}

export interface AIProvider {
    generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse>;
    createChat?(options: { model?: AIModel; config?: { systemInstruction?: string } }): any;
}

// ============================================================================
// Model Configuration
// ============================================================================

export interface ModelConfig {
    name: string;
    displayName: string;
    provider: 'gemini' | 'openai' | 'anthropic' | 'qwen' | 'grok';
    requiresApiKey: string; // Environment variable name
    supportsTools: boolean;
    supportsStreaming: boolean;
}

export const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
    'gemini-3-pro': {
        name: 'gemini-3-pro',
        displayName: 'Gemini 3 Pro',
        provider: 'gemini',
        requiresApiKey: 'VITE_GEMINI_API_KEY',
        supportsTools: true,
        supportsStreaming: false,
    },
    'gemini-2.5-flash': {
        name: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        provider: 'gemini',
        requiresApiKey: 'VITE_GEMINI_API_KEY',
        supportsTools: true,
        supportsStreaming: false,
    },
    'gemini-2.0-flash': {
        name: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        provider: 'gemini',
        requiresApiKey: 'VITE_GEMINI_API_KEY',
        supportsTools: true,
        supportsStreaming: false,
    },
    'gpt-4': {
        name: 'gpt-4',
        displayName: 'GPT-4',
        provider: 'openai',
        requiresApiKey: 'VITE_OPENAI_API_KEY',
        supportsTools: true,
        supportsStreaming: true,
    },
    'gpt-4-turbo': {
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        provider: 'openai',
        requiresApiKey: 'VITE_OPENAI_API_KEY',
        supportsTools: true,
        supportsStreaming: true,
    },
    'gpt-3.5-turbo': {
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        provider: 'openai',
        requiresApiKey: 'VITE_OPENAI_API_KEY',
        supportsTools: true,
        supportsStreaming: true,
    },
    'claude-3-5-sonnet': {
        name: 'claude-3-5-sonnet',
        displayName: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        requiresApiKey: 'VITE_ANTHROPIC_API_KEY',
        supportsTools: false,
        supportsStreaming: true,
    },
    'claude-3-opus': {
        name: 'claude-3-opus',
        displayName: 'Claude 3 Opus',
        provider: 'anthropic',
        requiresApiKey: 'VITE_ANTHROPIC_API_KEY',
        supportsTools: false,
        supportsStreaming: true,
    },
    'qwen3-max': {
        name: 'qwen3-max',
        displayName: 'Qwen3 Max (通义千问)',
        provider: 'qwen',
        requiresApiKey: 'VITE_QWEN_API_KEY',
        supportsTools: true,  // Qwen supports search via extra_body.enable_search
        supportsStreaming: true,
    },
    'qwen3-omni': {
        name: 'qwen3-omni',
        displayName: 'Qwen3 Omni (通义千问 - 多模态)',
        provider: 'qwen',
        requiresApiKey: 'VITE_QWEN_API_KEY',
        supportsTools: true,  // Qwen supports search via extra_body.enable_search
        supportsStreaming: true,
    },
    'grok-beta': {
        name: 'grok-beta',
        displayName: 'Grok Beta',
        provider: 'grok',
        requiresApiKey: 'VITE_GROK_API_KEY',
        supportsTools: false,
        supportsStreaming: true,
    },
    'grok-2': {
        name: 'grok-2',
        displayName: 'Grok 2',
        provider: 'grok',
        requiresApiKey: 'VITE_GROK_API_KEY',
        supportsTools: false,
        supportsStreaming: true,
    },
};

// ============================================================================
// Gemini Provider Implementation
// ============================================================================

class GeminiProvider implements AIProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse> {
        const { prompt, model = 'gemini-2.5-flash', tools, systemInstruction } = options;

        const ai = new GoogleGenAI({ apiKey: this.apiKey });

        const config: any = {};
        if (tools && tools.length > 0) {
            config.tools = tools;
        }
        if (systemInstruction) {
            config.systemInstruction = systemInstruction;
        }

        const response = await ai.models.generateContent({
            model: model as string,
            contents: prompt,
            config,
        });

        return {
            text: response.text,
            candidates: response.candidates,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata,
        };
    }

    createChat(options: { model?: AIModel; config?: { systemInstruction?: string } }) {
        const ai = new GoogleGenAI({ apiKey: this.apiKey });
        return ai.chats.create({
            model: (options.model || 'gemini-2.5-flash') as string,
            config: options.config || {},
        });
    }
}

// ============================================================================
// OpenAI Provider Implementation
// ============================================================================

class OpenAIProvider implements AIProvider {
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey: string, baseURL?: string) {
        this.apiKey = apiKey;
        this.baseURL = baseURL || 'https://api.openai.com/v1';
    }

    async generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse> {
        const { prompt, model = 'gpt-4', tools, systemInstruction, temperature, maxTokens } = options;

        // Convert tools format for OpenAI
        const openaiTools = tools?.map(tool => {
            if (tool.googleSearch) {
                // OpenAI doesn't support Google Search directly, but we can use function calling
                // For now, we'll skip tools that aren't supported
                return null;
            }
            return tool;
        }).filter(Boolean);

        const messages: any[] = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: temperature || 0.7,
                max_tokens: maxTokens || 2000,
                ...(openaiTools && openaiTools.length > 0 ? { tools: openaiTools } : {}),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            text: data.choices[0]?.message?.content || '',
            candidates: data.choices,
        };
    }
}

// ============================================================================
// Anthropic Provider Implementation
// ============================================================================

class AnthropicProvider implements AIProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse> {
        const { prompt, model = 'claude-3-5-sonnet', systemInstruction } = options;

        // Anthropic API implementation
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
                ...(systemInstruction ? { system: systemInstruction } : {}),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            text: data.content[0]?.text || '',
            candidates: data.content,
        };
    }
}

// ============================================================================
// Qwen Provider Implementation (通义千问)
// ============================================================================

class QwenProvider implements AIProvider {
    private apiKey: string;
    private baseURL: string;
    private defaultModel: string;

    constructor(apiKey: string, baseURL?: string, defaultModel: string = 'qwen3-max') {
        this.apiKey = apiKey;
        // Use compatible-mode endpoint (OpenAI-compatible format)
        this.baseURL = baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        this.defaultModel = defaultModel;
    }

    async generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse> {
        const { prompt, model, systemInstruction, temperature, maxTokens, tools } = options;
        // Use the model from options, or fall back to the default model set in constructor
        const modelName = model || this.defaultModel;

        const messages: any[] = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        // Build request body
        const requestBody: any = {
            model: modelName,
            messages,
            temperature: temperature || 0.7,
            max_tokens: maxTokens || 2000,
        };

        // Enable search if googleSearch tool is requested
        const hasSearchTool = tools && tools.some(tool => tool.googleSearch);
        if (hasSearchTool) {
            requestBody.extra_body = { enable_search: true };
        }

        // Use OpenAI-compatible format for compatible-mode endpoint
        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error?.message || errorData.message || errorData.code || errorMessage;
                // Include more details if available
                if (errorData.request_id) {
                    errorMessage += ` (Request ID: ${errorData.request_id})`;
                }
            } catch (e) {
                // If JSON parsing fails, use status text
            }
            throw new Error(`Qwen API error: ${errorMessage}`);
        }

        const data = await response.json();

        // OpenAI-compatible format: data.choices[0].message.content
        return {
            text: data.choices?.[0]?.message?.content || '',
            candidates: data.choices || [],
        };
    }
}

// ============================================================================
// Grok Provider Implementation (xAI)
// ============================================================================

class GrokProvider implements AIProvider {
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey: string, baseURL?: string) {
        this.apiKey = apiKey;
        this.baseURL = baseURL || 'https://api.x.ai/v1';
    }

    async generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse> {
        const { prompt, model = 'grok-beta', systemInstruction, temperature, maxTokens } = options;

        const messages: any[] = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: temperature || 0.7,
                max_tokens: maxTokens || 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(`Grok API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            text: data.choices[0]?.message?.content || '',
            candidates: data.choices || [],
        };
    }
}

// ============================================================================
// Provider Factory
// ============================================================================

let cachedProvider: AIProvider | null = null;
let cachedModel: AIModel | null = null;

export function getAIProvider(model?: AIModel): AIProvider {
    // Get model from parameter, localStorage, or default
    const selectedModel = model || getSelectedModel() || 'gemini-2.5-flash';

    // Return cached provider if model hasn't changed
    if (cachedProvider && cachedModel === selectedModel) {
        return cachedProvider;
    }

    const config = MODEL_CONFIGS[selectedModel];
    if (!config) {
        throw new Error(`Unknown model: ${selectedModel}`);
    }

    // Get API key from environment
    const apiKey = getApiKeyForModel(selectedModel);
    if (!apiKey) {
        throw new Error(`API key not found for model ${selectedModel}. Please set ${config.requiresApiKey} in .env.local`);
    }

    // Create provider based on model type
    let provider: AIProvider;
    switch (config.provider) {
        case 'gemini':
            provider = new GeminiProvider(apiKey);
            break;
        case 'openai':
            provider = new OpenAIProvider(apiKey);
            break;
        case 'anthropic':
            provider = new AnthropicProvider(apiKey);
            break;
        case 'qwen':
            provider = new QwenProvider(apiKey, undefined, selectedModel);
            break;
        case 'grok':
            provider = new GrokProvider(apiKey);
            break;
        default:
            throw new Error(`Unsupported provider: ${config.provider}`);
    }

    // Cache provider
    cachedProvider = provider;
    cachedModel = selectedModel;

    return provider;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getSelectedModel(): AIModel | null {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ai_beacon_selected_model');
        if (saved && saved in MODEL_CONFIGS) {
            return saved as AIModel;
        }
    }
    return null;
}

export function setSelectedModel(model: AIModel): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('ai_beacon_selected_model', model);
        // Clear cache to force recreation
        cachedProvider = null;
        cachedModel = null;
    }
}

export function getApiKeyForModel(model: AIModel): string | null {
    const config = MODEL_CONFIGS[model];
    if (!config) return null;

    // Try to get from environment variables
    const envKey = config.requiresApiKey;

    // Special handling for Qwen: prioritize DASHSCOPE_API_KEY (official env var name)
    // but also support VITE_QWEN_API_KEY for frontend compatibility
    if (config.provider === 'qwen') {
        // First try process.env.DASHSCOPE_API_KEY (exposed via vite.config.ts define)
        if (typeof process !== 'undefined' && process.env && process.env.DASHSCOPE_API_KEY) {
            return process.env.DASHSCOPE_API_KEY;
        }

        // Then try import.meta.env.DASHSCOPE_API_KEY (unlikely to work in browser, but try anyway)
        try {
            const metaEnv = (import.meta as any)?.env;
            if (metaEnv && metaEnv.DASHSCOPE_API_KEY) {
                return metaEnv.DASHSCOPE_API_KEY;
            }
        } catch (e) {
            // Ignore if import.meta is not available
        }
    }

    // Vite exposes env vars with import.meta.env (for VITE_ prefixed vars)
    try {
        const metaEnv = (import.meta as any)?.env;
        if (metaEnv && metaEnv[envKey]) {
            return metaEnv[envKey];
        }
    } catch (e) {
        // Ignore if import.meta is not available
    }

    // Fallback: Try process.env (for Node.js environments or vite.config.ts define)
    if (typeof process !== 'undefined' && process.env && process.env[envKey]) {
        return process.env[envKey];
    }

    // Fallback: Try window (for some build setups)
    if (typeof window !== 'undefined' && (window as any).__ENV__) {
        return (window as any).__ENV__[envKey] || null;
    }

    return null;
}

export function getAvailableModels(): AIModel[] {
    return Object.keys(MODEL_CONFIGS) as AIModel[];
}

export function getModelConfig(model: AIModel): ModelConfig | null {
    return MODEL_CONFIGS[model] || null;
}

export function isModelAvailable(model: AIModel): boolean {
    const apiKey = getApiKeyForModel(model);
    return apiKey !== null && apiKey.length > 0;
}

