/**
 * Gemini 2.0 Flash specific prompts
 * Optimized for Gemini 2.0 Flash
 */

import { PromptModule } from './types';
import { gemini3ProPrompts } from './gemini-3-pro';

// Gemini 2.0 Flash can use similar prompts to Gemini 3 Pro
export const gemini20FlashPrompts: PromptModule = {
    ...gemini3ProPrompts
};

