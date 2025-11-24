/**
 * Gemini 2.5 Flash specific prompts
 * Optimized for Gemini 2.5 Flash's fast response and search capabilities
 */

import { PromptModule } from './types';
import { gemini3ProPrompts } from './gemini-3-pro';

// Gemini 2.5 Flash can use similar prompts to Gemini 3 Pro, but optimized for speed
export const gemini25FlashPrompts: PromptModule = {
    ...gemini3ProPrompts
};

