/**
 * Qwen3 Omni (通义千问 - 多模态) specific prompts
 * Optimized for Qwen3 Omni's multimodal capabilities
 */

import { PromptModule } from './types';
import { qwen3MaxPrompts } from './qwen3-max';

// Qwen3 Omni can use similar prompts to Qwen3 Max
export const qwen3OmniPrompts: PromptModule = {
    ...qwen3MaxPrompts
};

