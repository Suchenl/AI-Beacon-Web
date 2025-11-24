/**
 * GPT-4 specific prompts
 * Optimized for GPT-4's reasoning capabilities
 */

import { PromptModule } from './types';

export const gpt4Prompts: PromptModule = {
    getAiFillPrompt: (input) => {
        const { title, link, authors } = input;

        return `You are an expert research paper metadata extractor. Extract complete metadata for this research paper.

Input: ${JSON.stringify({ title: title || '', link: link || '', authors: authors || '' }, null, 2)}

Instructions:
1. Search for the paper on ArXiv, Semantic Scholar, Google Scholar, or official publisher sites
2. If a link is provided, verify and extract metadata from that source
3. Cross-reference multiple sources for accuracy
4. Extract ALL available fields
5. Use "Unknown" for missing fields (not empty strings)
6. Ensure dates are accurate (YYYY for year, MMM for month, DD for day)
7. Extract the complete abstract, not just summaries

Return ONLY a valid JSON object (no Markdown, no code blocks, no explanations):
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

        const prompt = `You are an expert AI researcher. Search for exactly ${searchCount} NEW AI research papers released between ${startDate} and ${endDate}.

Query: "AI research papers ${searchQuery} ${startDate}..${endDate} arxiv"

Context:
${context}

Instructions:
1. Perform a Google Search to find real papers from this date range
2. Ensure papers are highly relevant to the Context
3. IGNORE these titles: ${JSON.stringify(existingTitles)}
4. CRITICAL: For EACH paper, the link MUST be the URL where you found that EXACT title. Verify the link matches the title.
5. For citationCount and stars:
   - Search Google Scholar or Semantic Scholar for REAL citation counts
   - Search GitHub for REAL star counts
   - DO NOT guess or estimate
   - Use "0" if not found

Return ONLY a valid JSON ARRAY (no Markdown, no code blocks):
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

        return `You are an expert research paper verifier. Verify the paper links match the paper, and find ACCURATE citation count and GitHub stars.

Paper: "${title}" by ${authors}
${abstract ? `Abstract: "${abstract.substring(0, 500)}${abstract.length > 500 ? '...' : ''}"` : ''}
Current Paper Link: ${link || 'Not provided'}
Current Code Link: ${codeLink || 'Not provided'}

Instructions:
1. Verify Paper Link:
   - Search for: "${title}" by ${authors}
   - Visit current link and verify it matches (title, authors${abstract ? ', abstract' : ''})
   - If not matching, find correct link from ArXiv, Semantic Scholar, Google Scholar, or publisher
   - Return the verified correct link

2. Verify Code Link:
   - If codeLink provided, verify it matches this paper (check README, description, authors)
   - If not matching, search GitHub for correct repository
   - Return empty string if no match found

3. Find Citation Count:
   - Search Google Scholar or Semantic Scholar
   - Extract ACTUAL citation count
   - Format: "1,200+" or "50" or "0"
   - DO NOT guess

4. Find GitHub Stars:
   - Use verified codeLink
   - Extract ACTUAL star count from GitHub
   - Format: "4.5k" or "500" or "0"
   - DO NOT guess

Return ONLY valid JSON:
{
  "link": "verified and correct paper URL",
  "codeLink": "verified GitHub URL or empty string",
  "citationCount": "actual number from Google Scholar/Semantic Scholar",
  "stars": "actual number from GitHub or '0'"
}`;
    }
};

