/**
 * Claude 3 Opus specific prompts
 * Optimized for Claude 3 Opus's advanced reasoning
 */

import { PromptModule } from './types';
import { claude35SonnetPrompts } from './claude-3-5-sonnet';

// Claude 3 Opus can use similar prompts to Claude 3.5 Sonnet
export const claude3OpusPrompts: PromptModule = {
    ...claude35SonnetPrompts
};

