/**
 * Unified prompts interface
 * Automatically selects the appropriate prompt module based on the current model
 */

import { AIModel } from '../src/aiProvider';
import { getSelectedModel } from '../src/aiProvider';
import { PromptModule } from './types';

// Import all prompt modules
import { gemini3ProPrompts } from './gemini-3-pro';
import { gemini25FlashPrompts } from './gemini-2.5-flash';
import { gemini20FlashPrompts } from './gemini-2.0-flash';
import { gpt4Prompts } from './gpt-4';
import { gpt4TurboPrompts } from './gpt-4-turbo';
import { gpt35TurboPrompts } from './gpt-3.5-turbo';
import { claude35SonnetPrompts } from './claude-3-5-sonnet';
import { claude3OpusPrompts } from './claude-3-opus';
import { qwen3MaxPrompts } from './qwen3-max';
import { qwen3OmniPrompts } from './qwen3-omni';
import { grokBetaPrompts } from './grok-beta';
import { grok2Prompts } from './grok-2';

// Map models to their prompt modules
const PROMPT_MODULES: Record<AIModel, PromptModule> = {
    'gemini-3-pro': gemini3ProPrompts,
    'gemini-2.5-flash': gemini25FlashPrompts,
    'gemini-2.0-flash': gemini20FlashPrompts,
    'gpt-4': gpt4Prompts,
    'gpt-4-turbo': gpt4TurboPrompts,
    'gpt-3.5-turbo': gpt35TurboPrompts,
    'claude-3-5-sonnet': claude35SonnetPrompts,
    'claude-3-opus': claude3OpusPrompts,
    'qwen3-max': qwen3MaxPrompts,
    'qwen3-omni': qwen3OmniPrompts,
    'grok-beta': grokBetaPrompts,
    'grok-2': grok2Prompts,
};

/**
 * Get the prompt module for a specific model
 */
function getPromptModule(model?: AIModel): PromptModule {
    const selectedModel = model || getSelectedModel() || 'gemini-2.5-flash';
    const module = PROMPT_MODULES[selectedModel];
    
    if (!module) {
        console.warn(`No prompt module found for model ${selectedModel}, falling back to gemini-2.5-flash`);
        return PROMPT_MODULES['gemini-2.5-flash'];
    }
    
    return module;
}

// Re-export types
export * from './types';

// Export prompt functions that automatically use the correct model
export const getAiFillPrompt = (input: Parameters<PromptModule['getAiFillPrompt']>[0], model?: AIModel): string => {
    return getPromptModule(model).getAiFillPrompt(input);
};

export const getFindPapersPrompt = (input: Parameters<PromptModule['getFindPapersPrompt']>[0], model?: AIModel): { prompt: string; systemInstruction?: string } => {
    return getPromptModule(model).getFindPapersPrompt(input);
};

export const getRefreshStatsPrompt = (input: Parameters<PromptModule['getRefreshStatsPrompt']>[0], model?: AIModel): string => {
    return getPromptModule(model).getRefreshStatsPrompt(input);
};

