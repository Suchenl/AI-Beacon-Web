/**
 * Grok 2 specific prompts
 * Optimized for Grok 2
 */

import { PromptModule } from './types';
import { grokBetaPrompts } from './grok-beta';

// Grok 2 can use similar prompts to Grok Beta
export const grok2Prompts: PromptModule = {
    ...grokBetaPrompts
};

