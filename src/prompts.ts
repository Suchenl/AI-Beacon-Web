/**
 * AI Prompt Templates for AI-Beacon
 * 
 * This file contains all AI prompts used in the application.
 * Separated from component code for easier maintenance and optimization.
 */

// ============================================================================
// AI FILL PROMPT - For auto-filling paper metadata
// ============================================================================

export interface AiFillInput {
    title?: string;
    link?: string;
    authors?: string;
}

export const getAiFillPrompt = (input: AiFillInput): string => {
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
};

// ============================================================================
// FIND NEW PAPERS PROMPT - For searching and discovering new papers
// ============================================================================

export interface FindPapersInput {
    searchCount: number;
    startDate: string; // Format: "YYYY-MM"
    endDate: string;   // Format: "YYYY-MM"
    searchQuery: string;
    context: string;
    existingTitles: string[];
    language: 'en' | 'cn';
}

export const getFindPapersPrompt = (input: FindPapersInput): string => {
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
        ? 'Summary and Abstract should be in Chinese. Paper titles should remain in English.'
        : 'All content should be in English.';

    return `ROLE: Expert AI Research Paper Discovery Agent

TASK: Discover exactly ${searchCount} NEW research papers published between ${startDate} and ${endDate} that match the search criteria.

SEARCH QUERY: "AI research papers ${searchQuery} ${startDate}..${endDate} arxiv"

CONTEXT INFORMATION:
${context}

EXISTING PAPERS (IGNORE - Do not include these):
${existingTitles.length > 0 ? existingTitles.map((title, idx) => `${idx + 1}. ${title}`).join('\n') : 'None'}

INSTRUCTIONS:

1. Search Strategy:
   - Perform Google Search using the provided query
   - Focus on papers from ArXiv, Semantic Scholar, Google Scholar, and official conferences
   - Ensure papers are published within the exact date range: ${startDate} to ${endDate}
   - Verify publication dates match the criteria

2. Relevance Filtering:
   - Papers MUST be highly relevant to the provided Context
   - Papers MUST be NEW (not in the existing papers list)
   - Papers MUST be published within the specified date range
   - Prioritize papers with high impact or recent citations

3. Data Collection (CRITICAL - Follow this process for EACH paper):
   - **STEP 1**: Find a paper that matches the search criteria
   - **STEP 2**: Extract the EXACT title of that paper
   - **STEP 3**: Find the EXACT URL/link that corresponds to THAT SPECIFIC paper title
   - **STEP 4**: VERIFY that the link you found actually points to the paper with that exact title
   - **STEP 5**: Only after verification, extract the other metadata (authors, year, abstract, etc.) for THAT SAME paper
   - **DO NOT**: Mix and match titles and links from different papers
   - **DO NOT**: Use a link from Paper A with a title from Paper B
   - **VERIFICATION RULE**: For each paper object, the link MUST be the URL where you found that specific title
   - Find citation counts from Google Scholar or Semantic Scholar (approximate is acceptable)
   - Find GitHub repositories and star counts if available
   - Extract full abstracts, not summaries
   - Verify all URLs are accessible

4. Output Format Requirements:
   - Return ONLY a valid JSON array
   - Start with [ and end with ]
   - NO Markdown formatting
   - NO code blocks or backticks
   - NO explanatory text before or after the JSON
   - NO comments in the JSON
   - All string values must be properly escaped (use \\n for newlines, \\" for quotes)
   - Array must contain exactly ${searchCount} paper objects (or as many as found if fewer)

5. Field Requirements (for each paper object):
   **ABSOLUTE REQUIREMENT: Each paper object must be a COMPLETE, SELF-CONSISTENT unit.**
   **The title, link, authors, abstract, and all other fields MUST all refer to the SAME paper.**
   
   - title: Full official paper title (required, in English)
            **MUST be the exact title found at the link URL**
   - authors: Author names in standard format (e.g., "First Author et al.")
              **MUST be the authors of the paper with the above title**
   - year: 4-digit year (YYYY format, e.g., "2024")
           **MUST match the publication year of the paper with the above title**
   - month: 3-letter abbreviation (MMM format, e.g., "Jan", "Feb", "Mar")
            **MUST match the publication month of the paper with the above title**
   - day: 2-digit day (DD format, e.g., "15") or empty string if unknown
          **MUST match the publication day of the paper with the above title**
   - summary: One concise sentence describing the paper's value proposition
              **MUST describe the paper with the above title**
   - abstract: A detailed paragraph describing the methodology and contributions
               **MUST be the abstract of the paper with the above title**
   - link: Direct URL to PDF or paper page (prefer ArXiv, official publisher, or Semantic Scholar)
           **ABSOLUTELY CRITICAL:**
           - This link MUST be the URL where you found the exact title listed above
           - The link MUST point to a page that displays the exact same title
           - If the link is https://arxiv.org/abs/XXXX.XXXXX, the ArXiv page MUST show the exact title above
           - If the link is a Semantic Scholar URL, that page MUST show the exact title above
           - **DO NOT use a link from a different paper, even if it's related**
           - **DO NOT guess or approximate - only use links you have verified**
           - **Before including each paper, mentally verify: "Does this link show this exact title?"**
   - codeLink: GitHub repository URL if available, otherwise empty string ""
               **MUST be the code repository for the paper with the above title**
   - stars: GitHub stars in format like "1.5k" or "500" or "0" if no repository
            **MUST be the stars for the codeLink repository above**
   - citationCount: Citation count in format like "50+" or "100" or "0" if unknown
                    **MUST be the citation count for the paper with the above title**

6. Quality Standards:
   - All papers must be unique (no duplicates)
   - All papers must be within the date range
   - All papers must be relevant to the context
   - URLs must be valid and accessible
   - Dates must be accurate

7. Language Requirements:
   ${languageInstruction}

OUTPUT SCHEMA (return ONLY this JSON array, nothing else):
[
  {
    "title": "Exact Paper Title (English)",
    "authors": "First Author et al.",
    "year": "YYYY",
    "month": "MMM",
    "day": "DD",
    "summary": "One sentence value proposition.",
    "abstract": "A detailed paragraph describing the methodology and contributions.",
    "link": "https://arxiv.org/abs/XXXX.XXXXX or publisher URL",
    "codeLink": "https://github.com/username/repo or empty string",
    "stars": "1.5k or 500 or 0",
    "citationCount": "50+ or 100 or 0"
  }
]

CRITICAL QUALITY CHECKS (MUST PERFORM BEFORE RETURNING JSON):
- Return exactly ${searchCount} papers (or as many as found if fewer)
- Return ONLY the JSON array. No markdown, no explanations, no code blocks.
- Ensure all papers are NEW and not in the existing papers list.

**FINAL VERIFICATION STEP (MANDATORY):**
Before returning the JSON, for EACH paper object, verify:
1. ✅ The link URL points to a page that displays the exact same title
2. ✅ The authors listed match the authors on the page at that link
3. ✅ The year/month match the publication date on the page at that link
4. ✅ The abstract describes the paper found at that link
5. ✅ All fields in the object refer to the SAME paper

**IF YOU CANNOT VERIFY ALL OF THE ABOVE FOR A PAPER, DO NOT INCLUDE IT.**
**It is better to return fewer papers than to return papers with mismatched titles and links.**

**REMEMBER: Each paper object is a package deal - all fields must match the same paper.**
**DO NOT create "Frankenstein papers" by mixing titles from one paper with links from another.**`;
};

// ============================================================================
// REFRESH PAPER STATS PROMPT - For updating citation counts and stars
// ============================================================================

export interface RefreshStatsInput {
    title: string;
    authors: string;
}

export const getRefreshStatsPrompt = (input: RefreshStatsInput): string => {
    const { title, authors } = input;

    return `Search for the latest citation count (Google Scholar/Semantic Scholar) and GitHub stars for the paper: "${title}" by ${authors}.

Return ONLY valid JSON: { "citationCount": "e.g. 1,200+", "stars": "e.g. 4.5k" }
Do NOT use Markdown.`;
};

