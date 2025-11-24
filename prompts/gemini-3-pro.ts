/**
 * Gemini 3 Pro specific prompts
 * Optimized for Gemini 3 Pro's capabilities
 */

import { PromptModule } from './types';

export const gemini3ProPrompts: PromptModule = {
    getAiFillPrompt: (input) => {
        const { title, link, authors } = input;

        return `ROLE: Expert Research Paper Metadata Extractor

TASK: Extract complete metadata for a research paper using the provided information.

INPUT DATA:
${JSON.stringify({ title: title || '', link: link || '', authors: authors || '' }, null, 2)}

INSTRUCTIONS:
1. Search Strategy:
   - Use Google Search to find the paper on ArXiv, Semantic Scholar, Google Scholar, or official publisher sites
   - If a direct link is provided, verify and extract metadata from that source
   - Cross-reference multiple sources to ensure accuracy

2. Data Extraction:
   - Extract ALL available metadata fields
   - For missing fields, use "Unknown" (not empty strings)
   - Ensure dates are accurate and in the correct format
   - Extract full abstract text, not just summaries

3. Output Format Requirements:
   - Return ONLY a valid JSON object
   - Start with { and end with }
   - NO Markdown formatting
   - NO code blocks or backticks
   - NO explanatory text before or after the JSON
   - NO comments in the JSON
   - All string values must be properly escaped (use \\n for newlines, \\" for quotes)
   - All URLs must be complete and valid

4. Field Requirements:
   - title: Full official paper title (required)
   - authors: Author names in standard format (e.g., "First Author et al." or "Author1, Author2, Author3")
   - year: 4-digit year (YYYY format, e.g., "2024")
   - month: 3-letter abbreviation (MMM format, e.g., "Jan", "Feb", "Mar") or empty string if unknown
   - day: 2-digit day (DD format, e.g., "15") or empty string if unknown
   - summary: One concise sentence describing the paper's main contribution
   - abstract: Full abstract text (complete paragraph, not truncated)
   - link: Direct URL to PDF or paper page (prefer ArXiv, official publisher, or Semantic Scholar)
   - codeLink: GitHub repository URL if available, otherwise empty string ""
   - citationCount: Current citation count in format like "1,200+" or "50" or "0" if unknown
   - stars: GitHub stars in format like "1.2k" or "500" or "0" if no repository

5. Quality Standards:
   - Verify all URLs are accessible
   - Ensure dates match the paper's publication date
   - Abstract should be the complete official abstract, not a summary
   - Citation counts should be current (approximate is acceptable if exact is unavailable)

OUTPUT SCHEMA (return ONLY this JSON structure, nothing else):
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
}

CRITICAL: Return ONLY the JSON object. No markdown, no explanations, no code blocks.`;
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

        // Detect if this is a domain-level search (based on context content)
        const isDomainSearch = context.includes('Domain:') || context.includes('Existing Topics:');

        // Add extra warning for domain-level searches
        const domainSearchWarning = isDomainSearch
            ? `\n⚠️ **EXTRA CRITICAL FOR DOMAIN-LEVEL SEARCH**: You are searching across multiple topics within a domain. When you find papers from different topics, you MUST ensure that EACH paper's title and link are from the SAME source page. DO NOT mix a title from one paper with a link from another paper, even if they are related to the same domain. For each paper, find the title, then immediately verify the link points to that EXACT paper's page before moving to the next paper.`
            : '';

        const trimmedTitles = existingTitles
            .filter(title => typeof title === 'string' && title.trim().length > 0)
            .map(title => title.trim())
            .slice(0, 12);

        const ignoreSection = trimmedTitles.length > 0
            ? `3. You already have these papers:\n${trimmedTitles.map((title, idx) => `   ${idx + 1}. ${title}`).join('\n')}\n   Do NOT return any of them again, and skip any search result that matches them.`
            : '3. Every paper you return must be NEW compared to what you already have.';

        const prompt = `ROLE: Expert AI Researcher.
TASK: Search for exactly ${searchCount} NEW AI research papers released between ${startDate} and ${endDate}.
QUERY: "AI research papers ${searchQuery} ${startDate}..${endDate} arxiv"

CONTEXT:
${context}

INSTRUCTIONS:
1. Perform a Google Search to find real papers from this specific date range.
2. Ensure papers are highly relevant to the provided Context.
${ignoreSection}
4. **CRITICAL**: For EACH paper, the link MUST be the URL where you found that EXACT title. Verify the link points to the page displaying that exact title. DO NOT mix titles and links from different papers.${domainSearchWarning}
5. **WORKFLOW FOR EACH PAPER**: 
   - Step 1: Find a paper title that matches the context
   - Step 2: Immediately find the URL for THAT SPECIFIC paper
   - Step 3: Verify the URL shows the EXACT same title
   - Step 4: Only then proceed to extract other metadata (authors, abstract, etc.)
   - Step 5: Move to the next paper and repeat
6. **CRITICAL - ACCURATE STATS**: For citationCount and stars, you MUST:
   - Search for the actual paper on Google Scholar, Semantic Scholar, or the paper's official page to get REAL citation counts
   - Search for the actual GitHub repository (if codeLink is provided or found) to get REAL star counts
   - DO NOT guess, estimate, or make up numbers
   - If you cannot find the actual data, use "0" (not approximate values)
   - Citation counts should be from Google Scholar or Semantic Scholar
   - Stars should be from the actual GitHub repository page
7. OUTPUT FORMAT: Return a strictly valid JSON ARRAY.
   - START with [ and END with ]
   - NO Markdown, NO code blocks, NO explanations
   - Only include citationCount and stars if you found REAL data from actual sources

JSON SCHEMA:
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

        return `ROLE: Expert Research Paper Verifier and Metrics Finder

TASK: Verify the paper links match the paper, and find ACCURATE citation count and GitHub stars.

CURRENT PAPER DATA:
- Title: "${title}"
- Authors: ${authors}
${abstract ? `- Abstract: "${abstract.substring(0, 500)}${abstract.length > 500 ? '...' : ''}"` : ''}
${link ? `- Current Paper Link: ${link}` : '- Current Paper Link: Not provided'}
${codeLink ? `- Current Code Link: ${codeLink}` : '- Current Code Link: Not provided'}

VERIFICATION INSTRUCTIONS:
1. **Verify Paper Link**:
   - Search for this paper using: "${title}" by ${authors}
   - Visit the current link (${link || 'N/A'}) and verify it matches:
     * Check if the title matches exactly
     * Check if the authors match
     ${abstract ? `* Check if the abstract matches (at least the first few sentences)` : ''}
   - If the link does NOT match, find the CORRECT paper link from:
     * ArXiv (arxiv.org)
     * Semantic Scholar (semanticscholar.org)
     * Google Scholar (scholar.google.com)
     * Official publisher website
   - Return the VERIFIED and CORRECT link

2. **Verify Code Link**:
   - If a codeLink is provided (${codeLink || 'none'}), verify it matches this paper:
     * Check the GitHub repository README or description mentions this paper
     * Check if the repository title/description matches the paper title or topic
     * Check if the authors are mentioned in the repository
   - If the codeLink does NOT match, search for the correct repository:
     * Search GitHub for: "${title}" OR "${title} github" OR "${authors} ${title.split(' ')[0]} github"
     * Verify the repository is actually for this paper
   - If no matching repository is found, return empty string ""

3. **Find Citation Count**:
   - Search for this paper on Google Scholar (scholar.google.com) or Semantic Scholar (semanticscholar.org)
   - Find the EXACT paper matching the title and authors
   - Extract the ACTUAL citation count shown on the search results or paper page
   - Format: "1,200+" or "50" or "0" if not found
   - DO NOT guess or estimate

4. **Find GitHub Stars**:
   - Use the VERIFIED codeLink (from step 2)
   - Visit the GitHub repository page
   - Extract the ACTUAL star count from the repository page
   - Format: "4.5k" or "500" or "0" if no repository or not found
   - DO NOT guess or estimate

5. **CRITICAL RULES**:
   - Only return data you can verify from actual sources
   - If you cannot find real data, use "0" for numbers and "" for links
   - The link and codeLink MUST match the paper (verified by title, authors, and abstract)
   - Do NOT return incorrect or mismatched links

OUTPUT FORMAT:
Return ONLY valid JSON (no Markdown, no code blocks, no explanations):
{
  "link": "verified and correct paper URL (or current link if it matches)",
  "codeLink": "verified and correct GitHub URL (or empty string if none or doesn't match)",
  "citationCount": "actual number from Google Scholar/Semantic Scholar",
  "stars": "actual number from GitHub (or '0' if no repository)"
}`;
    }
};

