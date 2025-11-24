/**
 * Shared types for all prompt modules
 */

export interface AiFillInput {
    title?: string;
    link?: string;
    authors?: string;
}

export interface FindPapersInput {
    searchCount: number;
    startDate: string; // Format: "YYYY-MM"
    endDate: string;   // Format: "YYYY-MM"
    searchQuery: string;
    context: string;
    existingTitles: string[];
    language: 'en' | 'cn';
}

export interface RefreshStatsInput {
    title: string;
    authors: string;
    abstract?: string;
    link?: string;
    codeLink?: string;
}

export interface PromptModule {
    getAiFillPrompt: (input: AiFillInput) => string;
    getFindPapersPrompt: (input: FindPapersInput) => { prompt: string; systemInstruction?: string };
    getRefreshStatsPrompt: (input: RefreshStatsInput) => string;
}

