/**
 * Grok Beta specific prompts
 * Optimized for Grok's conversational style
 */

import { PromptModule } from './types';

export const grokBetaPrompts: PromptModule = {
    getAiFillPrompt: (input) => {
        const { title, link, authors } = input;

        return `Extract complete metadata for this research paper.

Input: ${JSON.stringify({ title: title || '', link: link || '', authors: authors || '' }, null, 2)}

Search for the paper on ArXiv, Semantic Scholar, Google Scholar, or official publisher sites. If a link is provided, verify and extract metadata from that source. Cross-reference multiple sources for accuracy.

Extract ALL available fields. Use "Unknown" for missing fields. Ensure dates are accurate (YYYY for year, MMM for month, DD for day). Extract the complete abstract.

Return ONLY valid JSON (no Markdown, no code blocks):
{
  "title": "Full Official Paper Title",
  "authors": "First Author et al.",
  "year": "YYYY",
  "month": "MMM",
  "day": "DD",
  "summary": "One concise sentence describing the main contribution.",
  "abstract": "Complete official abstract text from the paper.",
  "link": "https://arxiv.org/abs/XXXX.XXXXX or publisher URL",
  "codeLink": "https://github.com/username/repo or empty string",
  "citationCount": "1,200+ or 50 or 0",
  "stars": "1.2k or 500 or 0"
}`;
    },

    getFindPapersPrompt: (input) => {
        const {
            searchCount,
            startDate,
            endDate,
            searchQuery,
            context,
            existingTitles,
            language
        } = input;

        const languageInstruction = language === 'cn'
            ? 'Summary/Abstract in Chinese. Title in English.'
            : 'English.';

        const prompt = `Search for exactly ${searchCount} NEW AI research papers released between ${startDate} and ${endDate}.

Query: "AI research papers ${searchQuery} ${startDate}..${endDate} arxiv"

Context: ${context}

Instructions:
1. Perform a Google Search to find real papers from this date range
2. Ensure papers are highly relevant to the Context
3. IGNORE these titles: ${JSON.stringify(existingTitles)}
4. For EACH paper, the link MUST be the URL where you found that EXACT title
5. For citationCount and stars: Search for REAL data on Google Scholar/Semantic Scholar and GitHub. Use "0" if not found. DO NOT guess.

Return ONLY valid JSON ARRAY:
[
  { 
    "title": "Exact Paper Title", 
    "authors": "First Author et al.", 
    "year": "YYYY", 
    "month": "MMM", 
    "day": "DD", 
    "summary": "One sentence value proposition.", 
    "abstract": "A detailed paragraph describing the methodology.", 
    "link": "URL (MUST match the title above)", 
    "codeLink": "GitHub URL (optional)",
    "stars": "GitHub stars (e.g. '1.5k' or '0')", 
    "citationCount": "Citations (e.g. '50+' or '0')" 
  }
]

Language: ${languageInstruction}`;

        return { prompt, systemInstruction: undefined };
    },

    getRefreshStatsPrompt: (input) => {
        const { title, authors, abstract, link, codeLink } = input;

        return `Verify the paper links match the paper, and find ACCURATE citation count and GitHub stars.

Paper: "${title}" by ${authors}
${abstract ? `Abstract: "${abstract.substring(0, 500)}${abstract.length > 500 ? '...' : ''}"` : ''}
Current Paper Link: ${link || 'Not provided'}
Current Code Link: ${codeLink || 'Not provided'}

Instructions:
1. Verify Paper Link: Search for "${title}" by ${authors}. Check if current link matches (title, authors${abstract ? ', abstract' : ''}). If not, find correct link from ArXiv, Semantic Scholar, Google Scholar, or publisher.
2. Verify Code Link: If provided, verify it matches this paper. If not, search GitHub. Return empty string if no match.
3. Find Citation Count: Search Google Scholar or Semantic Scholar. Extract ACTUAL count. Format: "1,200+" or "50" or "0". DO NOT guess.
4. Find GitHub Stars: Use verified codeLink. Extract ACTUAL star count. Format: "4.5k" or "500" or "0". DO NOT guess.

Return ONLY valid JSON:
{
  "link": "verified and correct paper URL",
  "codeLink": "verified GitHub URL or empty string",
  "citationCount": "actual number from Google Scholar/Semantic Scholar",
  "stars": "actual number from GitHub or '0'"
}`;
    }
};

