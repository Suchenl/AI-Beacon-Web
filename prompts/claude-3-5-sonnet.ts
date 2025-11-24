/**
 * Claude 3.5 Sonnet specific prompts
 * Optimized for Claude's structured thinking and accuracy
 */

import { PromptModule } from './types';

export const claude35SonnetPrompts: PromptModule = {
    getAiFillPrompt: (input) => {
        const { title, link, authors } = input;

        return `You are an expert research paper metadata extractor. Your task is to extract complete metadata for a research paper.

Input data:
${JSON.stringify({ title: title || '', link: link || '', authors: authors || '' }, null, 2)}

Please:
1. Search for the paper on ArXiv, Semantic Scholar, Google Scholar, or official publisher sites
2. If a link is provided, verify and extract metadata from that source
3. Cross-reference multiple sources to ensure accuracy
4. Extract ALL available metadata fields
5. Use "Unknown" for missing fields (not empty strings)
6. Ensure dates are accurate: YYYY for year, MMM for month, DD for day
7. Extract the complete abstract text, not just summaries

Return ONLY a valid JSON object. No Markdown, no code blocks, no explanations:
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

Search query: "AI research papers ${searchQuery} ${startDate}..${endDate} arxiv"

Context:
${context}

Instructions:
1. Perform a Google Search to find real papers from this specific date range
2. Ensure papers are highly relevant to the provided Context
3. IGNORE these titles: ${JSON.stringify(existingTitles)}
4. CRITICAL: For EACH paper, the link MUST be the URL where you found that EXACT title. Verify the link points to the page displaying that exact title. DO NOT mix titles and links from different papers.
5. For citationCount and stars:
   - Search for the actual paper on Google Scholar or Semantic Scholar to get REAL citation counts
   - Search for the actual GitHub repository to get REAL star counts
   - DO NOT guess, estimate, or make up numbers
   - If you cannot find the actual data, use "0"
   - Citation counts should be from Google Scholar or Semantic Scholar
   - Stars should be from the actual GitHub repository page

Return ONLY a valid JSON ARRAY. No Markdown, no code blocks, no explanations:
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

        return `You are an expert research paper verifier and metrics finder. Your task is to verify the paper links match the paper, and find ACCURATE citation count and GitHub stars.

Current paper data:
- Title: "${title}"
- Authors: ${authors}
${abstract ? `- Abstract: "${abstract.substring(0, 500)}${abstract.length > 500 ? '...' : ''}"` : ''}
${link ? `- Current Paper Link: ${link}` : '- Current Paper Link: Not provided'}
${codeLink ? `- Current Code Link: ${codeLink}` : '- Current Code Link: Not provided'}

Verification instructions:
1. Verify Paper Link:
   - Search for this paper using: "${title}" by ${authors}
   - Visit the current link and verify it matches (check title, authors${abstract ? ', abstract' : ''})
   - If the link does NOT match, find the CORRECT paper link from ArXiv, Semantic Scholar, Google Scholar, or official publisher website
   - Return the VERIFIED and CORRECT link

2. Verify Code Link:
   - If a codeLink is provided, verify it matches this paper (check README, description, authors)
   - If the codeLink does NOT match, search for the correct repository on GitHub
   - If no matching repository is found, return empty string ""

3. Find Citation Count:
   - Search for this paper on Google Scholar or Semantic Scholar
   - Find the EXACT paper matching the title and authors
   - Extract the ACTUAL citation count shown on the search results or paper page
   - Format: "1,200+" or "50" or "0" if not found
   - DO NOT guess or estimate

4. Find GitHub Stars:
   - Use the VERIFIED codeLink
   - Visit the GitHub repository page
   - Extract the ACTUAL star count from the repository page
   - Format: "4.5k" or "500" or "0" if no repository or not found
   - DO NOT guess or estimate

CRITICAL RULES:
- Only return data you can verify from actual sources
- If you cannot find real data, use "0" for numbers and "" for links
- The link and codeLink MUST match the paper (verified by title, authors, and abstract)
- Do NOT return incorrect or mismatched links

Return ONLY valid JSON (no Markdown, no code blocks, no explanations):
{
  "link": "verified and correct paper URL (or current link if it matches)",
  "codeLink": "verified and correct GitHub URL (or empty string if none or doesn't match)",
  "citationCount": "actual number from Google Scholar/Semantic Scholar",
  "stars": "actual number from GitHub (or '0' if no repository)"
}`;
    }
};

