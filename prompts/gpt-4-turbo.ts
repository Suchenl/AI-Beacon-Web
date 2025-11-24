/**
 * GPT-4 Turbo specific prompts
 * Optimized for GPT-4 Turbo's speed and capabilities
 */

import { PromptModule } from './types';
import { gpt4Prompts } from './gpt-4';

// GPT-4 Turbo can use similar prompts to GPT-4
export const gpt4TurboPrompts: PromptModule = {
    ...gpt4Prompts
};

