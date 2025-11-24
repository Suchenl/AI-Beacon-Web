/**
 * GPT-3.5 Turbo specific prompts
 * Optimized for GPT-3.5 Turbo's efficiency
 */

import { PromptModule } from './types';
import { gpt4Prompts } from './gpt-4';

// GPT-3.5 Turbo can use similar prompts to GPT-4, but may need simpler instructions
export const gpt35TurboPrompts: PromptModule = {
    ...gpt4Prompts
};

