import React, { useState, useRef } from 'react';
import { Pillar, Paper, Topic, Comment } from './types';
import * as fileSystem from './fileSystem';
import { getAiFillPrompt, getFindPapersPrompt, getRefreshStatsPrompt } from '../prompts';
import { getAIProvider, getSelectedModel } from './aiProvider';

interface Props {
    pillar: Pillar;
    isEditMode: boolean;
    onAddTopic: () => void;
    onImportTopic?: (topic: Topic) => void;
    onDeleteTopic: (id: string) => void;
    onUpdateTopic: (id: string, data: Partial<Topic>) => void;
    onAddPaper: (topicId: string, paper: Paper) => void;
    onUpdatePaper: (topicId: string, paperId: string, data: Partial<Paper>) => void;
    onDeletePaper: (topicId: string, paperId: string) => void;
    onUpdatePillar: (data: Partial<Pillar>) => void;
    onAddComment: (topicId: string, paperId: string, text: string) => void;
    onDeleteComment: (topicId: string, paperId: string, commentId: string) => void;
    language: 'en' | 'cn';
    userName: string;
}

// Enhanced Robust JSON Parser Helper with better error reporting
const parseJSON = (text: string): { data: any; error: string | null } => {
    if (!text || !text.trim()) {
        return { data: null, error: 'Empty response from AI' };
    }

    try {
        // Strategy 1: Try parsing strictly first (fastest)
        try {
            const parsed = JSON.parse(text);
            return { data: parsed, error: null };
        } catch (e) {
            // Continue to cleaning strategies
        }

        let cleanText = text;

        // Strategy 2: Extract from Markdown code blocks (handle multiple formats)
        const jsonBlockMatch = text.match(/```(?:json|javascript)?\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
            cleanText = jsonBlockMatch[1].trim();
            try {
                return { data: JSON.parse(cleanText), error: null };
            } catch (e) {
                // Continue to more aggressive cleaning
            }
        }

        // Strategy 3: Find JSON array/object boundaries more intelligently
        // Look for the first complete JSON structure
        const arrayStart = text.indexOf('[');
        const objectStart = text.indexOf('{');

        let start = -1;
        let isArray = false;

        if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
            start = arrayStart;
            isArray = true;
        } else if (objectStart !== -1) {
            start = objectStart;
            isArray = false;
        }

        if (start !== -1) {
            // Find the matching closing bracket/brace
            let depth = 0;
            let inString = false;
            let escapeNext = false;
            let end = start;

            for (let i = start; i < text.length; i++) {
                const char = text[i];

                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }

                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }

                if (char === '"') {
                    inString = !inString;
                    continue;
                }

                if (inString) continue;

                if ((isArray && char === '[') || (!isArray && char === '{')) {
                    depth++;
                } else if ((isArray && char === ']') || (!isArray && char === '}')) {
                    depth--;
                    if (depth === 0) {
                        end = i;
                        break;
                    }
                }
            }

            if (end > start) {
                cleanText = text.substring(start, end + 1);
            }
        }

        // Enhanced Cleanup: Handle more edge cases
        // Remove comments (single-line and multi-line)
        cleanText = cleanText.replace(/\/\/.*?$/gm, ''); // Single-line comments
        cleanText = cleanText.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments

        // Remove trailing commas before } or ]
        cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');

        // Fix single quotes to double quotes (but preserve escaped quotes)
        cleanText = cleanText.replace(/([{,]\s*)'([^']*)'(\s*[:,\]}])/g, '$1"$2"$3');

        // Fix unescaped newlines and control characters in string values
        // This is more careful - only fix strings that are values, not keys
        cleanText = cleanText.replace(/"([^"]*)"\s*:/g, (match, key) => {
            // This is a key, leave it alone
            return match;
        });

        // Fix unescaped quotes and newlines in string values (after the colon)
        cleanText = cleanText.replace(/:\s*"([^"]*)"([,\]}])/g, (match, value, ending) => {
            // Escape quotes and newlines in the value
            const fixedValue = value
                .replace(/\\/g, '\\\\')  // Escape backslashes first
                .replace(/"/g, '\\"')    // Escape quotes
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r')   // Escape carriage returns
                .replace(/\t/g, '\\t');  // Escape tabs
            return `: "${fixedValue}"${ending}`;
        });

        // Remove any remaining problematic control characters (but keep valid whitespace)
        cleanText = cleanText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        cleanText = cleanText.trim();

        try {
            return { data: JSON.parse(cleanText), error: null };
        } catch (parseError: any) {
            // Last resort: Try to extract and fix partial JSON
            try {
                // Try to find and extract a valid JSON object/array even if incomplete
                const objMatch = cleanText.match(/\{[\s\S]*\}/);
                const arrMatch = cleanText.match(/\[[\s\S]*\]/);

                if (objMatch || arrMatch) {
                    let partialText = objMatch ? objMatch[0] : arrMatch![0];
                    // Apply aggressive cleanup
                    partialText = partialText.replace(/\/\/.*?$/gm, '');
                    partialText = partialText.replace(/\/\*[\s\S]*?\*\//g, '');
                    partialText = partialText.replace(/,(\s*[}\]])/g, '$1');
                    partialText = partialText.replace(/([{,]\s*)'([^']*)'(\s*[:,\]}])/g, '$1"$2"$3');

                    // Try to close unclosed brackets
                    const openBraces = (partialText.match(/\{/g) || []).length;
                    const closeBraces = (partialText.match(/\}/g) || []).length;
                    const openBrackets = (partialText.match(/\[/g) || []).length;
                    const closeBrackets = (partialText.match(/\]/g) || []).length;

                    if (openBraces > closeBraces) {
                        partialText += '}'.repeat(openBraces - closeBraces);
                    }
                    if (openBrackets > closeBrackets) {
                        partialText += ']'.repeat(openBrackets - closeBrackets);
                    }

                    const parsed = JSON.parse(partialText);
                    return { data: parsed, error: null };
                }
            } catch (e2) {
                // Final failure
                const errorMsg = `JSON parse failed: ${parseError?.message || 'Unknown error'}. First 200 chars: ${text.substring(0, 200)}`;
                console.error("JSON Parse Failed:", errorMsg, parseError);
                return { data: null, error: errorMsg };
            }
        }
    } catch (e: any) {
        const errorMsg = `Unexpected error during JSON parsing: ${e?.message || 'Unknown error'}`;
        console.error("JSON Parse Error:", errorMsg, e);
        return { data: null, error: errorMsg };
    }

    return { data: null, error: 'Could not extract JSON from response' };
};

// Helper function to verify title-link match by actually fetching the link
const verifyTitleLinkMatch = async (title: string, link: string): Promise<{ matches: boolean; error?: string; extractedTitle?: string }> => {
    if (!link || link === '#' || !link.startsWith('http')) {
        return { matches: false, error: 'Invalid link' };
    }

    try {
        // Use CORS proxy to fetch the link
        const proxyUrl = 'https://corsproxy.io/?';
        const response = await fetch(proxyUrl + encodeURIComponent(link), {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            // Set timeout
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
            return { matches: false, error: `Failed to fetch link: ${response.status}` };
        }

        const html = await response.text();

        // Extract title from HTML
        // Try multiple methods to find the paper title
        let extractedTitle = '';

        // Method 1: Look for <title> tag
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            extractedTitle = titleMatch[1].trim();
        }

        // Method 2: Look for meta property="og:title"
        if (!extractedTitle) {
            const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
            if (ogTitleMatch) {
                extractedTitle = ogTitleMatch[1].trim();
            }
        }

        // Method 3: Look for ArXiv-specific title (in <h1 class="title">)
        if (!extractedTitle && link.includes('arxiv.org')) {
            const arxivTitleMatch = html.match(/<h1[^>]*class=["']title["'][^>]*>([^<]+)<\/h1>/i);
            if (arxivTitleMatch) {
                extractedTitle = arxivTitleMatch[1].trim();
            }
        }

        // Method 4: Look for Semantic Scholar title (in data-testid="paper-title" or similar)
        if (!extractedTitle && link.includes('semanticscholar.org')) {
            const ssTitleMatch = html.match(/<h1[^>]*data-testid=["']paper-title["'][^>]*>([^<]+)<\/h1>/i) ||
                html.match(/<span[^>]*class=["'][^"']*title[^"']*["'][^>]*>([^<]+)<\/span>/i);
            if (ssTitleMatch) {
                extractedTitle = ssTitleMatch[1].trim();
            }
        }

        // Clean extracted title (remove HTML entities, extra whitespace)
        extractedTitle = extractedTitle
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();

        if (!extractedTitle) {
            return { matches: false, error: 'Could not extract title from page' };
        }

        // Normalize titles for comparison (lowercase, remove special chars)
        const normalizeTitle = (t: string) => t
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const normalizedTitle = normalizeTitle(title);
        const normalizedExtracted = normalizeTitle(extractedTitle);

        // Check if titles match (allowing for some variation)
        // Method 1: Exact match after normalization
        if (normalizedTitle === normalizedExtracted) {
            return { matches: true, extractedTitle };
        }

        // Method 2: Check if extracted title contains all significant words from expected title
        const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 3);
        const extractedWords = normalizedExtracted.split(/\s+/).filter(w => w.length > 3);

        // Check if at least 70% of significant words match
        const matchingWords = titleWords.filter(word => extractedWords.includes(word));
        const matchRatio = titleWords.length > 0 ? matchingWords.length / titleWords.length : 0;

        if (matchRatio >= 0.7) {
            return { matches: true, extractedTitle };
        }

        // Method 3: Check if expected title contains all significant words from extracted title (reverse check)
        const reverseMatchingWords = extractedWords.filter(word => titleWords.includes(word));
        const reverseMatchRatio = extractedWords.length > 0 ? reverseMatchingWords.length / extractedWords.length : 0;

        if (reverseMatchRatio >= 0.7) {
            return { matches: true, extractedTitle };
        }

        return {
            matches: false,
            extractedTitle,
            error: `Title mismatch: expected "${title.substring(0, 60)}..." but found "${extractedTitle.substring(0, 60)}..."`
        };

    } catch (error: any) {
        // If fetch fails (CORS, network error, etc.), we can't verify but don't reject
        // This is a warning, not a critical error
        console.warn(`Could not verify link ${link}:`, error.message);
        return { matches: false, error: `Could not verify link: ${error.message}` };
    }
};

// Data Validation and Repair Helper with enhanced validation
const validateAndRepairPaper = async (paper: any, verifyLink: boolean = true): Promise<{ paper: any | null; errors: string[] }> => {
    const errors: string[] = [];

    if (!paper || typeof paper !== 'object') {
        return { paper: null, errors: ['Paper is not a valid object'] };
    }

    const repaired: any = {};

    // Required fields with validation
    repaired.title = String(paper.title || '').trim();
    if (!repaired.title || repaired.title === 'Untitled Paper' || repaired.title.length < 3) {
        errors.push('Title is missing or too short');
        repaired.title = repaired.title || 'Untitled Paper';
    }

    repaired.authors = String(paper.authors || '').trim();
    if (!repaired.authors || repaired.authors === 'Unknown') {
        errors.push('Authors are missing');
        repaired.authors = repaired.authors || 'Unknown';
    }

    repaired.link = String(paper.link || '').trim();
    if (!repaired.link || repaired.link === '#') {
        errors.push('Link is missing');
        repaired.link = repaired.link || '#';
    }

    // Optional fields with defaults
    repaired.year = String(paper.year || '').trim() || '';
    repaired.month = String(paper.month || '').trim() || '';
    repaired.day = String(paper.day || '').trim() || '';
    repaired.summary = String(paper.summary || '').trim() || '';
    repaired.abstract = String(paper.abstract || paper.summary || '').trim() || 'No abstract available.';
    repaired.codeLink = String(paper.codeLink || '').trim() || '';
    repaired.stars = String(paper.stars || '0').trim() || '0';
    repaired.citationCount = String(paper.citationCount || '0').trim() || '0';

    // Validate and fix URL format
    if (repaired.link && !repaired.link.startsWith('http://') && !repaired.link.startsWith('https://') && repaired.link !== '#') {
        repaired.link = 'https://' + repaired.link;
    }

    // Enhanced validation - check if link seems valid
    if (repaired.link && repaired.link !== '#') {
        // Check if link contains common paper repository domains
        const validDomains = ['arxiv.org', 'semanticscholar.org', 'acm.org', 'ieee.org', 'springer.com', 'nature.com', 'openreview.net', 'paperswithcode.com', 'github.com', 'scholar.google.com'];
        const linkLower = repaired.link.toLowerCase();
        const hasValidDomain = validDomains.some(domain => linkLower.includes(domain));

        // If link doesn't have a valid domain, it's suspicious
        if (!hasValidDomain) {
            errors.push(`Link domain may be invalid: ${repaired.link}`);
        }

        // Additional validation: Check if ArXiv link format is correct
        if (linkLower.includes('arxiv.org')) {
            const arxivMatch = repaired.link.match(/arxiv\.org\/(abs|pdf)\/(\d{4}\.\d{4,5})/);
            if (!arxivMatch) {
                errors.push(`ArXiv link format may be incorrect: ${repaired.link}`);
            }
        }

        // Additional validation: Check if Semantic Scholar link format is correct
        if (linkLower.includes('semanticscholar.org')) {
            if (!linkLower.includes('/paper/')) {
                errors.push(`Semantic Scholar link format may be incorrect: ${repaired.link}`);
            }
        }
    }

    if (repaired.codeLink && !repaired.codeLink.startsWith('http://') && !repaired.codeLink.startsWith('https://')) {
        repaired.codeLink = 'https://' + repaired.codeLink;
    }

    // Validate year format
    if (repaired.year && !/^\d{4}$/.test(repaired.year)) {
        const yearMatch = repaired.year.match(/\d{4}/);
        if (yearMatch) {
            repaired.year = yearMatch[0];
        } else {
            errors.push(`Year format is invalid: ${paper.year}`);
            repaired.year = '';
        }
    }

    // Validate month format (should be 3 letters like "Jan", "Feb", etc. or empty)
    if (repaired.month && !/^[A-Za-z]{3}$/.test(repaired.month)) {
        const monthMap: { [key: string]: string } = {
            'january': 'Jan', 'february': 'Feb', 'march': 'Mar', 'april': 'Apr',
            'may': 'May', 'june': 'Jun', 'july': 'Jul', 'august': 'Aug',
            'september': 'Sep', 'october': 'Oct', 'november': 'Nov', 'december': 'Dec',
            'jan': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr',
            'jun': 'Jun', 'jul': 'Jul', 'aug': 'Aug', 'sep': 'Sep',
            'oct': 'Oct', 'nov': 'Nov', 'dec': 'Dec'
        };
        const lowerMonth = repaired.month.toLowerCase();
        if (monthMap[lowerMonth]) {
            repaired.month = monthMap[lowerMonth];
        } else {
            errors.push(`Month format is invalid: ${paper.month}`);
            repaired.month = '';
        }
    }

    // CRITICAL validation: Check if title and link match
    // This is a strict check - if title and link don't match, reject the paper
    if (repaired.title && repaired.link && repaired.link !== '#') {
        const linkLower = repaired.link.toLowerCase();
        const titleLower = repaired.title.toLowerCase();

        // For ArXiv links, verify format and try to extract meaningful words from title
        if (linkLower.includes('arxiv.org')) {
            const arxivMatch = repaired.link.match(/arxiv\.org\/(abs|pdf)\/(\d{4}\.\d{4,5})/);
            if (!arxivMatch) {
                errors.push(`Invalid ArXiv link format: ${repaired.link}`);
            }
            // Even for ArXiv, we can do some basic validation
            // Extract key technical terms from title (words longer than 5 chars, excluding common words)
            const titleKeyTerms = titleLower
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter((w: string) => w.length > 5 && !['learning', 'network', 'model', 'method', 'approach', 'system', 'algorithm', 'using', 'based'].includes(w))
                .slice(0, 3);

            // For ArXiv, we can't verify from URL, but we can check if the link looks suspicious
            // If the link contains common unrelated terms, flag it
            const suspiciousTerms = ['search', 'list', 'index', 'category', 'archive'];
            const hasSuspiciousTerms = suspiciousTerms.some(term => linkLower.includes(term) && !linkLower.includes('arxiv.org/abs/') && !linkLower.includes('arxiv.org/pdf/'));

            if (hasSuspiciousTerms) {
                errors.push(`ArXiv link may not match the paper: "${repaired.title}" vs ${repaired.link}`);
            }
        }
        // For Semantic Scholar, check if URL structure is valid
        else if (linkLower.includes('semanticscholar.org')) {
            if (!linkLower.includes('/paper/')) {
                errors.push(`Invalid Semantic Scholar link format: ${repaired.link}`);
            }
            // Extract key words from title and check if they appear in the link
            // Semantic Scholar URLs sometimes contain paper IDs, so we check title words
            const titleWords = titleLower
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter((w: string) => w.length > 4 && !['the', 'and', 'for', 'with', 'from'].includes(w))
                .slice(0, 4);

            const matchingWords = titleWords.filter((word: string) => linkLower.includes(word));

            // For Semantic Scholar, if no title words match, it's suspicious
            if (titleWords.length >= 2 && matchingWords.length === 0) {
                errors.push(`Title and link may not match (Semantic Scholar): "${repaired.title}" vs ${repaired.link}`);
            }
        }
        // For other links (Google Scholar, publisher sites, etc.)
        else {
            // Extract key words from title
            const titleWords = titleLower
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter((w: string) => w.length > 4 && !['the', 'and', 'for', 'with', 'from', 'using', 'based'].includes(w))
                .slice(0, 4); // Check first 4 significant words

            const matchingWords = titleWords.filter((word: string) => linkLower.includes(word));

            // For non-ArXiv/Semantic Scholar links, require at least some title words to match
            if (titleWords.length >= 2 && matchingWords.length === 0) {
                errors.push(`Title and link likely don't match: "${repaired.title}" vs ${repaired.link}`);
            }
        }

        // Additional check: Look for common mismatches
        // If link contains words that contradict the title, flag it
        const titleKeyTerms = titleLower
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((w: string) => w.length > 5)
            .slice(0, 3);

        // Check if link contains unrelated common terms that suggest a mismatch
        const unrelatedTerms = ['abstract', 'citation', 'reference', 'related', 'similar'];
        const hasUnrelatedContext = unrelatedTerms.some(term =>
            linkLower.includes(term) &&
            !titleKeyTerms.some(titleTerm => linkLower.includes(titleTerm))
        );

        if (hasUnrelatedContext && titleKeyTerms.length > 0) {
            errors.push(`Link appears to be a related/abstract page, not the paper itself: ${repaired.link}`);
        }
    }

    // CRITICAL validation: Actually fetch the link and verify title matches
    if (verifyLink && repaired.title && repaired.link && repaired.link !== '#' && repaired.link.startsWith('http')) {
        try {
            const verification = await verifyTitleLinkMatch(repaired.title, repaired.link);
            if (!verification.matches) {
                if (verification.error && !verification.error.includes('Could not verify')) {
                    // Only add as critical error if we successfully fetched but titles don't match
                    errors.push(`Title-link mismatch verified: ${verification.error}`);
                } else if (verification.extractedTitle) {
                    // We extracted a title but it doesn't match
                    errors.push(`Title-link mismatch: Expected "${repaired.title.substring(0, 50)}..." but link shows "${verification.extractedTitle.substring(0, 50)}..."`);
                }
                // If we couldn't fetch (CORS, network error), just log a warning, don't reject
            } else {
                console.log(`✅ Verified title-link match for: ${repaired.title.substring(0, 50)}...`);
            }
        } catch (error: any) {
            // If verification fails, log but don't reject (network issues shouldn't block valid papers)
            console.warn(`Could not verify link ${repaired.link}:`, error.message);
        }
    }

    // CRITICAL validation: Check if codeLink matches the paper (if provided)
    if (repaired.codeLink && repaired.codeLink.trim() !== '') {
        const codeLinkLower = repaired.codeLink.toLowerCase();
        const titleLower = repaired.title.toLowerCase();

        // CodeLink should be a GitHub URL
        if (!codeLinkLower.includes('github.com')) {
            errors.push(`CodeLink should be a GitHub URL: ${repaired.codeLink}`);
        } else {
            // Extract key technical terms from title
            const titleKeyTerms = titleLower
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter((w: string) => w.length > 4 && !['the', 'and', 'for', 'with', 'from', 'using', 'based', 'learning', 'network', 'model'].includes(w))
                .slice(0, 3);

            // Check if codeLink contains any title keywords (GitHub repo names/descriptions often contain paper title words)
            const matchingWords = titleKeyTerms.filter((word: string) => codeLinkLower.includes(word));

            // If codeLink is provided but contains no title words, it might be a mismatch
            // However, this is less strict than paper link validation since repo names can vary
            if (titleKeyTerms.length >= 2 && matchingWords.length === 0) {
                // This is a warning, not a critical error, since repo names can be different
                errors.push(`CodeLink may not match the paper (no title keywords found): "${repaired.title}" vs ${repaired.codeLink}`);
            }

            // Check for obviously wrong patterns
            const wrongPatterns = ['awesome-', 'papers', 'list', 'collection', 'survey'];
            const hasWrongPattern = wrongPatterns.some(pattern =>
                codeLinkLower.includes(pattern) &&
                !titleKeyTerms.some(term => codeLinkLower.includes(term))
            );

            if (hasWrongPattern) {
                errors.push(`CodeLink appears to be a collection/list, not the paper's repository: ${repaired.codeLink}`);
            }
        }
    }

    // Only return paper if it has at least title and link (even if there are warnings)
    if (repaired.title && repaired.title !== 'Untitled Paper' && repaired.link && repaired.link !== '#') {
        return { paper: repaired, errors };
    } else {
        return { paper: null, errors: ['Paper missing critical fields (title or link)'] };
    }
};

// Validate and repair array of papers with error reporting
const validateAndRepairPapers = async (papers: any[], verifyLinks: boolean = true): Promise<{ papers: any[]; errors: string[] }> => {
    if (!Array.isArray(papers)) {
        return { papers: [], errors: ['Input is not an array'] };
    }

    const allErrors: string[] = [];
    const validPapers: any[] = [];

    // Process papers sequentially to avoid overwhelming the CORS proxy
    for (let index = 0; index < papers.length; index++) {
        const paper = papers[index];
        const result = await validateAndRepairPaper(paper, verifyLinks);
        if (result.paper) {
            // Check if there are critical errors that should cause rejection
            const criticalErrors = result.errors.filter(err =>
                err.includes('Title and link likely don\'t match') ||
                err.includes('Title and link may not match') ||
                err.includes('Link appears to be a related/abstract page') ||
                err.includes('ArXiv link may not match the paper') ||
                err.includes('CodeLink appears to be a collection/list') ||
                err.includes('Title-link mismatch verified') ||
                err.includes('Title-link mismatch:')
            );

            if (criticalErrors.length > 0) {
                // Reject papers with critical title/link mismatch errors
                console.error(`❌ Paper ${index + 1} REJECTED due to title/link mismatch:`, {
                    title: result.paper.title,
                    link: result.paper.link,
                    errors: criticalErrors
                });
                allErrors.push(`Paper ${index + 1} REJECTED (title/link mismatch): ${criticalErrors.join('; ')}`);
            } else {
                // Accept paper but log warnings
                validPapers.push(result.paper);
                if (result.errors.length > 0) {
                    console.warn(`⚠️ Paper ${index + 1} has warnings:`, result.errors);
                    allErrors.push(`Paper ${index + 1}: ${result.errors.join('; ')}`);
                }
            }
        } else {
            // Log errors for rejected papers
            console.error(`❌ Paper ${index + 1} was rejected:`, result.errors);
            allErrors.push(`Paper ${index + 1} rejected: ${result.errors.join('; ')}`);
        }
    };

    return { papers: validPapers, errors: allErrors };
};

// Helper for parsing metrics strings like "1.2k" or "100+"
const parseMetric = (val: string | number | undefined) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    let s = val.toString().toLowerCase().replace(/,/g, '').replace(/\+/g, '').replace(/ /g, '');
    let multiplier = 1;
    if (s.includes('k')) { multiplier = 1000; s = s.replace('k', ''); }
    if (s.includes('m')) { multiplier = 1000000; s = s.replace('m', ''); }
    return (parseFloat(s) || 0) * multiplier;
};

export const ViewPillar: React.FC<Props> = ({
    pillar, isEditMode,
    onAddTopic, onImportTopic, onDeleteTopic, onUpdateTopic,
    onAddPaper, onUpdatePaper, onDeletePaper, onUpdatePillar,
    onAddComment, onDeleteComment,
    language, userName
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 }); // Track scan progress
    const scanCancelRef = useRef(false); // Ref to track if scan should be cancelled
    const [stagedPapers, setStagedPapers] = useState<Paper[]>([]);
    const [searchCount, setSearchCount] = useState(3);

    // Numeric Date Input State
    const [startYear, setStartYear] = useState<number>(2024);
    const [endYear, setEndYear] = useState<number>(2025);
    const [startMonth, setStartMonth] = useState<number>(1);
    const [endMonth, setEndMonth] = useState<number>(12);

    // Topic-specific results staging { topicId: Paper[] }
    const [topicResults, setTopicResults] = useState<Record<string, Paper[]>>({});

    // State for creating a new topic from a staged paper
    const [creatingTopicForPaper, setCreatingTopicForPaper] = useState<string | null>(null);
    const [newTopicNameInput, setNewTopicNameInput] = useState('');

    // Manual Add/Edit State
    const [modalState, setModalState] = useState<{ topicId: string, paper?: Paper } | null>(null);

    // State for tracking which paper is currently refreshing stats
    const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());

    // Sorting State
    const [sortBy, setSortBy] = useState<'date' | 'stars' | 'citations'>('date');

    // Localization Dictionary
    const t = {
        quickAccess: language === 'cn' ? '快速访问' : 'Quick Access',
        findNewPapers: language === 'cn' ? '🔎 查找新论文' : '🔎 Find New Papers',
        count: language === 'cn' ? '数量' : 'Count',
        scanning: language === 'cn' ? '扫描中...' : 'Scanning...',
        stop: language === 'cn' ? '停止' : 'Stop',
        foundProgress: language === 'cn' ? '已找到' : 'Found',
        staging: language === 'cn' ? '论文暂存区' : 'Paper Staging Area',
        clear: language === 'cn' ? '🗑️ 清空结果' : '🗑️ Clear Results',
        merge: language === 'cn' ? '选择操作...' : 'Choose Action...',
        createNewTopic: language === 'cn' ? '新建主题' : 'Create New Topic',
        enterTopicName: language === 'cn' ? '输入新主题名称...' : 'Enter new topic name...',
        discard: language === 'cn' ? '丢弃' : 'Discard',
        emptyTitle: language === 'cn' ? '暂无主题' : 'No Topics Yet',
        emptyDesc: language === 'cn' ? '此支柱为空。请创建新主题或导入主题。' : 'This pillar is empty. Start building your knowledge base by creating a new topic or importing one.',
        createFirst: language === 'cn' ? '创建第一个主题' : 'Create First Topic',
        createTopic: language === 'cn' ? '创建新主题' : 'Create New Topic',
        importTopic: language === 'cn' ? '导入主题 (JSON)' : 'Import Topic (JSON)',
        addPaper: language === 'cn' ? '添加' : 'Add',
        manualAdd: language === 'cn' ? '+ 手动添加论文' : '+ Add Paper manually',
        found: language === 'cn' ? '找到' : 'Found',
        papers: language === 'cn' ? '篇论文' : 'Papers',
        close: language === 'cn' ? '关闭' : 'Close',
        to: language === 'cn' ? '至' : 'to',
        pillarTitle: language === 'cn' ? '支柱标题' : 'Pillar Title',
        pillarDesc: language === 'cn' ? '支柱描述...' : 'Pillar Description...',
        year: language === 'cn' ? '年' : 'Year',
        month: language === 'cn' ? '月' : 'Month',
        mergeGroup: language === 'cn' ? '--- 归档至现有主题 ---' : '--- Merge into Topic ---',
        sortBy: language === 'cn' ? '排序:' : 'Sort by:',
        sortDate: language === 'cn' ? '发布日期 (最新)' : 'Date (Newest)',
        sortStars: language === 'cn' ? 'GitHub 星标' : 'GitHub Stars',
        sortCitations: language === 'cn' ? '引用数' : 'Citations'
    };

    // Scroll to topic
    const scrollToTopic = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 100; // Height of sticky header + gap
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = el.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    // --- SORTING LOGIC ---
    const getSortedPapers = (papers: Paper[]) => {
        return [...papers].sort((a, b) => {
            if (sortBy === 'stars') {
                return parseMetric(b.stars) - parseMetric(a.stars);
            }
            if (sortBy === 'citations') {
                return parseMetric(b.citationCount) - parseMetric(a.citationCount);
            }
            // Date Sort: Year Desc
            if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
            return 0;
        });
    };

    // --- EXPORT / IMPORT ---

    const handleExportPillar = async () => {
        const filename = `pillar-${pillar.title.replace(/\s+/g, '-').toLowerCase()}.json`;
        await fileSystem.saveNewJSON(pillar, filename);
    };

    const handleExportTopic = async (topic: Topic) => {
        const filename = `topic-${topic.title.replace(/\s+/g, '-').toLowerCase()}.json`;
        await fileSystem.saveNewJSON(topic, filename);
    };

    const handleImportTopicClick = async () => {
        if (!onImportTopic) return;
        const data = await fileSystem.loadJSON();
        if (data) {
            if (data.title && Array.isArray(data.papers)) {
                onImportTopic(data);
            } else {
                alert(language === 'cn' ? "无效的主题文件。" : "Invalid Topic JSON.");
            }
        }
    };

    const handleCreateTopicFromPaper = (paper: Paper) => {
        if (!newTopicNameInput.trim() || !onImportTopic) return;

        const newTopic: Topic = {
            id: `topic-created-${Date.now()}`,
            title: newTopicNameInput.trim(),
            description: `Research centered around: ${paper.title}`,
            papers: [{ ...paper, isNew: false }] // Remove isNew flag when creating
        };

        onImportTopic(newTopic);

        // Clean up
        setStagedPapers(prev => prev.filter(p => p.id !== paper.id));
        setCreatingTopicForPaper(null);
        setNewTopicNameInput('');

        // Scroll to bottom (where new topic likely appeared)
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 300);
    };

    // --- AI ACTIONS ---

    const handleStopScan = () => {
        scanCancelRef.current = true;
    };

    const handleScan = async (scope: 'pillar' | 'topic', topicId?: string) => {

        // Validation: Start date must be before End date
        if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
            alert(language === 'cn' ? "起始时间不能晚于结束时间。" : "Start date cannot be after end date.");
            return;
        }

        // Reset cancel flag and progress
        scanCancelRef.current = false;
        setIsScanning(true);
        setScanProgress({ current: 0, total: searchCount });

        try {
            const provider = getAIProvider();

            // Determine Context and Search Query
            let context = "";
            let searchQueryTerm = "";
            let existingTitles: string[] = [];
            const cleanPillarTitle = pillar.title.replace(/^[IVX]+\.\s*/, ''); // Strip "I. " for better search

            if (scope === 'pillar') {
                // Area Search - Aligned with Topic Search format
                searchQueryTerm = cleanPillarTitle;
                // Collect example papers from all topics (similar to topic search)
                const domainPapers = pillar.topics
                    .flatMap(t => t.papers)
                    .map(p => p.title)
                    .slice(0, 10)
                    .join(', ');
                // Use similar format as topic search for consistency
                const topicsList = pillar.topics.map(t => t.title).join(', ');
                context = `Domain: "${cleanPillarTitle}". \nDescription: ${pillar.description}. \nExisting Topics: ${topicsList}. \nExamples: ${domainPapers}.`;
                // Limit context size
                existingTitles = pillar.topics.flatMap(t => t.papers.map(p => p.title)).slice(0, 30);
            } else {
                // Topic Search
                const topic = pillar.topics.find(t => t.id === topicId);
                if (topic) {
                    searchQueryTerm = topic.title;
                    // Improved Context
                    const topicPapers = topic.papers.map(p => p.title).slice(0, 10).join(', ');
                    context = `Specific Topic: "${topic.title}". \nDescription: ${topic.description}. \nExamples: ${topicPapers}.`;
                    existingTitles = topic.papers.map(p => p.title).slice(0, 30);
                }
            }

            const sMonth = startMonth.toString().padStart(2, '0');
            const eMonth = endMonth.toString().padStart(2, '0');

            const startStr = `${startYear}-${sMonth}`;
            const endStr = `${endYear}-${eMonth}`;

            const currentModel = getSelectedModel();
            const maxRetries = 3;
            let foundCount = 0;

            // Find papers one by one
            for (let paperIndex = 0; paperIndex < searchCount; paperIndex++) {
                // Check if user cancelled
                if (scanCancelRef.current) {
                    console.log('⏹️ Scan cancelled by user');
                    break;
                }

                // Update progress
                setScanProgress({ current: foundCount, total: searchCount });

                // Get current list of found papers to exclude
                // Limit to avoid RECITATION errors (too many titles can trigger recitation policy)
                // Start with fewer titles, will reduce further if RECITATION occurs
                let currentExistingTitles = [...existingTitles].slice(0, 10); // Start with 10 to avoid RECITATION
                if (scope === 'pillar') {
                    const stagedTitles = stagedPapers.map(p => p.title).slice(0, 5); // Limit staged papers
                    currentExistingTitles = [
                        ...currentExistingTitles,
                        ...stagedTitles
                    ].slice(0, 15); // Total limit of 15
                } else if (scope === 'topic' && topicId) {
                    const topicStagedTitles = (topicResults[topicId] || []).map(p => p.title).slice(0, 5);
                    currentExistingTitles = [
                        ...currentExistingTitles,
                        ...topicStagedTitles
                    ].slice(0, 15); // Total limit of 15
                }

                // Request ONE paper at a time
                let promptConfig = getFindPapersPrompt({
                    searchCount: 1, // Always request 1 paper at a time
                    startDate: startStr,
                    endDate: endStr,
                    searchQuery: searchQueryTerm,
                    context,
                    existingTitles: currentExistingTitles,
                    language
                }, currentModel || undefined);

                let paperFound = false;
                let lastError: any = null;
                let adjustedExistingTitles = currentExistingTitles; // Track adjusted titles for RECITATION retries

                // Retry mechanism for this single paper
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    // Check if user cancelled before each attempt
                    if (scanCancelRef.current) {
                        break;
                    }

                    // If previous attempt failed with RECITATION, reduce existingTitles and regenerate prompt
                    if (lastError && lastError.message && lastError.message.includes('recitation')) {
                        console.warn(`⚠️ RECITATION detected, reducing existingTitles from ${adjustedExistingTitles.length} to ${Math.max(5, Math.floor(adjustedExistingTitles.length / 2))}`);
                        adjustedExistingTitles = adjustedExistingTitles.slice(0, Math.max(5, Math.floor(adjustedExistingTitles.length / 2)));

                        // Regenerate prompt with reduced titles
                        promptConfig = getFindPapersPrompt({
                            searchCount: 1,
                            startDate: startStr,
                            endDate: endStr,
                            searchQuery: searchQueryTerm,
                            context,
                            existingTitles: adjustedExistingTitles,
                            language
                        }, currentModel || undefined);
                    }

                    try {
                        const response = await provider.generateContent({
                            prompt: promptConfig.prompt,
                            systemInstruction: promptConfig.systemInstruction,
                            tools: [{ googleSearch: {} }]
                        });

                        // Check for empty response BEFORE parsing
                        if (!response.text || response.text.trim().length === 0) {
                            console.error(`❌ Empty response from AI (Paper ${paperIndex + 1}, Attempt ${attempt})`);
                            lastError = new Error('AI returned empty response.');
                            if (attempt < maxRetries) {
                                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                                continue;
                            }
                            break;
                        }

                        const parseResult = parseJSON(response.text);

                        if (parseResult.error) {
                            console.error(`JSON Parse Error (Paper ${paperIndex + 1}, Attempt ${attempt}):`, parseResult.error);
                            lastError = new Error(`JSON parsing failed: ${parseResult.error}`);
                            if (attempt < maxRetries) {
                                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                                continue;
                            }
                            break;
                        }

                        const json = parseResult.data;

                        if (!json || !Array.isArray(json) || json.length === 0) {
                            console.warn(`Invalid or Empty JSON from AI (Paper ${paperIndex + 1}, Attempt ${attempt}), retrying...`);
                            lastError = new Error("Invalid JSON format or empty array");
                            if (attempt < maxRetries) {
                                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                                continue;
                            }
                            break;
                        }

                        // Validate and repair the paper (with link verification)
                        const validationResult = await validateAndRepairPapers(json, true);

                        // Log validation results for debugging
                        if (validationResult.errors.length > 0) {
                            console.log(`⚠️ Validation warnings/errors for paper ${paperIndex + 1}:`, validationResult.errors);

                            // Check for critical errors
                            const criticalErrors = validationResult.errors.filter(err =>
                                err.includes('REJECTED') ||
                                err.includes('title/link mismatch') ||
                                err.includes('Title and link') ||
                                err.includes('ArXiv link may not match') ||
                                err.includes('CodeLink appears to be a collection/list')
                            );

                            if (criticalErrors.length > 0) {
                                console.error(`❌ Paper ${paperIndex + 1} has critical validation errors and will be rejected:`, criticalErrors);
                            }
                        }

                        if (validationResult.papers.length > 0) {
                            // Success: Found a valid paper
                            const validPaper = {
                                ...validationResult.papers[0],
                                id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                isNew: true
                            };

                            // Additional verification: Log title and link for manual inspection
                            console.log(`✅ Paper ${paperIndex + 1} validated:`, {
                                title: validPaper.title.substring(0, 60) + (validPaper.title.length > 60 ? '...' : ''),
                                link: validPaper.link,
                                codeLink: validPaper.codeLink || 'none'
                            });

                            // Immediately add to results (real-time update)
                            if (scope === 'pillar') {
                                setStagedPapers(prev => [...prev, validPaper]);
                                // Auto-scroll to staging area on first paper
                                if (foundCount === 0) {
                                    setTimeout(() => {
                                        document.getElementById('staging-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                }
                            } else if (scope === 'topic' && topicId) {
                                setTopicResults(prev => ({
                                    ...prev,
                                    [topicId]: [...(prev[topicId] || []), validPaper]
                                }));
                            }

                            foundCount++;
                            setScanProgress({ current: foundCount, total: searchCount });
                            paperFound = true;

                            console.log(`✅ Found paper ${foundCount}/${searchCount}:`, validPaper.title);
                            break; // Success, exit retry loop
                        } else {
                            // Paper validation failed
                            console.warn(`❌ Paper validation failed (Paper ${paperIndex + 1}, Attempt ${attempt})`);
                            lastError = new Error(`Paper validation failed: ${validationResult.errors.join('; ')}`);
                            if (attempt < maxRetries) {
                                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                                continue;
                            }
                        }
                    } catch (e) {
                        console.error(`Scan Error (Paper ${paperIndex + 1}, Attempt ${attempt}):`, e);
                        lastError = e;
                        if (attempt < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                            continue;
                        }
                    }
                }

                // If we couldn't find a valid paper after all retries, log and continue
                if (!paperFound) {
                    console.warn(`⚠️ Could not find valid paper ${paperIndex + 1} after ${maxRetries} attempts, continuing...`);
                }

                // Small delay between papers to avoid rate limiting
                if (paperIndex < searchCount - 1 && !scanCancelRef.current) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // Final progress update
            setScanProgress({ current: foundCount, total: searchCount });

            // Show completion message
            if (foundCount > 0) {
                console.log(`✅ Scan completed: Found ${foundCount} out of ${searchCount} requested papers`);
            } else if (!scanCancelRef.current) {
                // Only show error if not cancelled
                const errorMessage = language === 'cn'
                    ? `未找到符合条件的论文。\n\n请检查：\n1. 日期范围是否合理\n2. 搜索关键词是否准确\n3. 控制台中的详细错误信息`
                    : `No papers found matching criteria.\n\nPlease check:\n1. If the date range is reasonable\n2. If the search keywords are accurate\n3. Detailed error information in the console`;
                alert(errorMessage);
            }
        } catch (e) {
            console.error("Scan Error:", e);
            if (!scanCancelRef.current) {
                alert(language === 'cn' ? "扫描失败，请检查网络或 API 密钥。" : "Scan failed. Please check your network or API Key.");
            }
        } finally {
            setIsScanning(false);
            setScanProgress({ current: 0, total: 0 });
            scanCancelRef.current = false;
        }
    };

    const refreshPaperStats = async (topicId: string, paper: Paper) => {
        // Set refreshing state at the start
        setRefreshingIds(prev => new Set(prev).add(paper.id));

        try {
            const provider = getAIProvider();
            const currentModel = getSelectedModel();
            const prompt = getRefreshStatsPrompt({
                title: paper.title,
                authors: paper.authors,
                abstract: paper.abstract,
                link: paper.link,
                codeLink: paper.codeLink
            }, currentModel || undefined);

            const response = await provider.generateContent({
                prompt,
                tools: [{ googleSearch: {} }]
            });

            const parseResult = parseJSON(response.text);
            if (parseResult.data && !parseResult.error) {
                const json = parseResult.data;
                // Update all verified fields: link, codeLink, citationCount, and stars
                const updates: Partial<Paper> = {};

                // Only update link if a verified one is returned and it's different
                if (json.link && json.link !== paper.link) {
                    updates.link = json.link;
                }

                // Update codeLink (can be empty string if no match found)
                if (json.codeLink !== undefined) {
                    updates.codeLink = json.codeLink || '';
                }

                // Update citation count if found
                if (json.citationCount !== undefined) {
                    updates.citationCount = json.citationCount || paper.citationCount;
                }

                // Update stars if found
                if (json.stars !== undefined) {
                    updates.stars = json.stars || paper.stars;
                }

                // Only update if there are actual changes
                if (Object.keys(updates).length > 0) {
                    onUpdatePaper(topicId, paper.id, updates);
                }
            } else {
                console.warn("Stats refresh parse failed:", parseResult.error);
            }
        } catch (e) {
            console.error("Stats refresh failed", e);
        } finally {
            setRefreshingIds(prev => {
                const next = new Set(prev);
                next.delete(paper.id);
                return next;
            });
        }
    };

    // Helper to render date input with correct order based on language
    const DateInputGroup = ({
        year, setYear, month, setMonth, labelYear, labelMonth
    }: {
        year: number, setYear: (n: number) => void,
        month: number, setMonth: (n: number) => void,
        labelYear: string, labelMonth: string
    }) => {
        const YearInput = (
            <input
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
                className="bg-transparent text-white text-sm py-2 w-16 text-center focus:outline-none"
                placeholder="YYYY"
            />
        );
        const MonthInput = (
            <input
                type="number"
                value={month}
                min="1"
                max="12"
                onChange={e => setMonth(parseInt(e.target.value))}
                className="bg-transparent text-white text-sm py-2 w-12 text-center focus:outline-none"
                placeholder="MM"
            />
        );

        return (
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 px-2 gap-2">
                <div className="flex items-center">
                    {language === 'en' ? <><span className="text-xs text-slate-500 mr-2 font-bold">{labelYear}</span>{YearInput}</> : <>{YearInput}<span className="text-xs text-slate-500 mr-2 font-bold">{labelYear}</span></>}
                </div>
                <div className="w-px h-4 bg-slate-700"></div>
                <div className="flex items-center">
                    {language === 'en' ? <><span className="text-xs text-slate-500 mr-2 font-bold">{labelMonth}</span>{MonthInput}</> : <>{MonthInput}<span className="text-xs text-slate-500 mr-1 font-bold">{labelMonth}</span></>}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4">

            {/* PILLAR HEADER */}
            <div className="mb-8 border-b border-slate-800 pb-8">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        {isEditMode ? (
                            <div className="space-y-4">
                                <input
                                    value={pillar.title}
                                    onChange={(e) => onUpdatePillar({ title: e.target.value })}
                                    className="text-4xl font-bold text-white bg-transparent border-b border-slate-700 w-full focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                                    placeholder={t.pillarTitle}
                                />
                                <textarea
                                    value={pillar.description}
                                    onChange={(e) => onUpdatePillar({ description: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 text-lg"
                                    rows={3}
                                    placeholder={t.pillarDesc}
                                />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-4xl font-bold text-white mb-4">{pillar.title}</h1>
                                <p className="text-slate-400 text-lg leading-relaxed max-w-4xl">{pillar.description}</p>
                            </>
                        )}
                    </div>
                    <button
                        onClick={handleExportPillar}
                        className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
                        title="Export Pillar to JSON"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                </div>

                {/* QUICK ACCESS / TOC */}
                <div className="mt-8 flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase py-1.5 mr-2">{t.quickAccess}:</span>
                    {pillar.topics.map(topic => (
                        <button
                            key={topic.id}
                            onClick={() => scrollToTopic(topic.id)}
                            className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs hover:bg-indigo-500/10 hover:border-indigo-500 hover:text-indigo-400 transition-all"
                        >
                            {topic.title}
                        </button>
                    ))}
                </div>

                {/* UNIFIED SEARCH BAR */}
                <div className="mt-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center gap-3 shadow-lg">

                    {/* Start Date */}
                    <DateInputGroup
                        year={startYear} setYear={setStartYear}
                        month={startMonth} setMonth={setStartMonth}
                        labelYear={t.year} labelMonth={t.month}
                    />

                    <span className="text-slate-500 text-sm font-bold">{t.to}</span>

                    {/* End Date */}
                    <DateInputGroup
                        year={endYear} setYear={setEndYear}
                        month={endMonth} setMonth={setEndMonth}
                        labelYear={t.year} labelMonth={t.month}
                    />

                    {/* Count */}
                    <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700">
                        <span className="px-3 text-xs text-slate-500 font-bold uppercase">{t.count}</span>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={searchCount}
                            onChange={(e) => setSearchCount(parseInt(e.target.value) || 5)}
                            className="w-12 bg-transparent text-center text-white text-sm font-bold focus:outline-none border-l border-slate-700 py-2"
                        />
                    </div>

                    <div className="flex-1"></div>

                    <div className="flex items-center gap-2">
                        {isScanning && (
                            <div className="text-sm text-slate-400">
                                {t.foundProgress} {scanProgress.current}/{scanProgress.total}
                            </div>
                        )}
                        {isScanning ? (
                            <button
                                onClick={handleStopScan}
                                className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                {t.stop}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleScan('pillar')}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                {t.findNewPapers}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* GLOBAL STAGING AREA */}
            {stagedPapers.length > 0 && (
                <div id="staging-area" className="mb-12 bg-slate-900/30 border border-indigo-500/20 rounded-2xl p-6 animate-fade-in relative shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-indigo-400 font-bold flex items-center gap-3 text-xl">
                                <span>📥 {t.staging}</span>
                                <span className="text-sm bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">{stagedPapers.length}</span>
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">Found between {startYear}-{startMonth} and {endYear}-{endMonth}</p>
                        </div>
                        <button
                            onClick={() => setStagedPapers([])}
                            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-sm transition-colors border border-red-900/30 font-bold flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            {t.clear}
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {stagedPapers.map(paper => (
                            <StagedPaperCard
                                key={paper.id}
                                paper={paper}
                                language={language}
                                actions={
                                    creatingTopicForPaper === paper.id ? (
                                        <div className="flex flex-col gap-2 animate-fade-in w-full md:w-64 bg-slate-950 p-3 rounded-lg border border-emerald-500/30">
                                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Creating New Topic</span>
                                            <input
                                                autoFocus
                                                className="bg-slate-900 border border-emerald-500 text-white text-sm rounded px-3 py-2 focus:outline-none w-full"
                                                placeholder={t.enterTopicName}
                                                value={newTopicNameInput}
                                                onChange={(e) => setNewTopicNameInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreateTopicFromPaper(paper)}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCreateTopicFromPaper(paper)}
                                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => { setCreatingTopicForPaper(null); setNewTopicNameInput(''); }}
                                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-bold"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <select
                                                className="bg-slate-950 text-white text-sm rounded px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer w-full md:w-56 hover:bg-slate-800 transition-colors appearance-none font-medium"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '__NEW__') {
                                                        setCreatingTopicForPaper(paper.id);
                                                        setNewTopicNameInput('');
                                                    } else if (val) {
                                                        // Remove isNew flag when adding to existing topic
                                                        onAddPaper(val, { ...paper, isNew: false });
                                                        setStagedPapers(prev => prev.filter(p => p.id !== paper.id));
                                                    }
                                                }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>{t.merge}</option>
                                                {pillar.topics.length > 0 && <option disabled className="text-slate-600 bg-slate-950">{t.mergeGroup}</option>}
                                                {pillar.topics.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.title}</option>)}
                                                <option disabled className="bg-slate-950 text-slate-700">────────────────</option>
                                                <option value="__NEW__" className="text-indigo-300 bg-slate-900">
                                                    + {t.createNewTopic}
                                                </option>
                                            </select>

                                            <button
                                                onClick={() => setStagedPapers(prev => prev.filter(p => p.id !== paper.id))}
                                                className="w-full py-1.5 text-xs text-slate-500 hover:text-red-400 hover:bg-red-900/10 rounded transition-colors border border-transparent hover:border-red-900/20"
                                            >
                                                {t.discard}
                                            </button>
                                        </>
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* EMPTY STATE */}
            {pillar.topics.length === 0 && (
                <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                    <div className="text-slate-600 text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-bold text-slate-400 mb-2">{t.emptyTitle}</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        {t.emptyDesc}
                    </p>
                    {isEditMode ? (
                        <button
                            onClick={onAddTopic}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                        >
                            {t.createFirst}
                        </button>
                    ) : (
                        <div className="text-sm text-slate-600 bg-slate-800 px-4 py-2 rounded-full inline-block">
                            Switch to <strong>{t.manualAdd.replace('+ ', '')}</strong> to add content.
                        </div>
                    )}
                </div>
            )}

            {/* SORT CONTROLS - GLOBAL FOR VIEW */}
            {pillar.topics.length > 0 && (
                <div className="flex justify-end items-center mb-6 gap-2 px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{t.sortBy}</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 font-medium hover:bg-slate-800 cursor-pointer"
                    >
                        <option value="date">{t.sortDate}</option>
                        <option value="stars">{t.sortStars}</option>
                        <option value="citations">{t.sortCitations}</option>
                    </select>
                </div>
            )}

            {/* TOPICS LIST */}
            <div className="space-y-16">
                {pillar.topics.map(topic => (
                    <div key={topic.id} id={topic.id} className="scroll-mt-32 bg-slate-900/20 rounded-3xl p-6 md:p-8 border border-slate-800/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-slate-800 gap-4">
                            <div className="flex-1">
                                {isEditMode ? (
                                    <input
                                        value={topic.title}
                                        onChange={(e) => onUpdateTopic(topic.id, { title: e.target.value })}
                                        className="text-2xl font-bold text-slate-200 bg-transparent border-b border-slate-700 focus:outline-none w-full"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
                                        <span className={`w-2 h-8 rounded-full bg-${pillar.color}-500`}></span>
                                        {topic.title}
                                    </h2>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Topic Level Search Controls */}
                                {isScanning ? (
                                    <button
                                        onClick={handleStopScan}
                                        className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-xs font-bold transition-colors flex items-center gap-1 border border-red-500/20"
                                        title="Stop scanning"
                                    >
                                        {t.stop}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleScan('topic', topic.id)}
                                        className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-500/20"
                                        title={`Find Papers for ${topic.title} using dates ${startYear}-${startMonth} to ${endYear}-${endMonth}`}
                                    >
                                        {t.findNewPapers}
                                    </button>
                                )}
                                {isScanning && (
                                    <div className="text-xs text-slate-400">
                                        {t.foundProgress} {scanProgress.current}/{scanProgress.total}
                                    </div>
                                )}

                                <div className="w-px h-4 bg-slate-700 mx-2"></div>

                                <button
                                    onClick={() => handleExportTopic(topic)}
                                    className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                                    title="Export Topic"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                </button>
                                {isEditMode && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteTopic(topic.id); }}
                                        className="text-red-500 hover:text-red-400 text-sm hover:underline whitespace-nowrap px-2 py-1 rounded hover:bg-slate-800"
                                    >
                                        {t.close}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* TOPIC LOCAL STAGING RESULTS */}
                        {topicResults[topic.id] && topicResults[topic.id].length > 0 && (
                            <div className="mb-6 bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-6 animate-fade-in">
                                <div className="flex justify-between items-center mb-4 border-b border-indigo-500/20 pb-2">
                                    <h4 className="text-indigo-300 font-bold text-sm flex items-center gap-2">
                                        <span>🔍 {t.found} {topicResults[topic.id].length} {t.papers}</span>
                                        <span className="text-[10px] text-slate-500 font-normal">({startYear}/{startMonth} - {endYear}/{endMonth})</span>
                                    </h4>
                                    <button
                                        onClick={() => setTopicResults(prev => {
                                            const next = { ...prev };
                                            delete next[topic.id];
                                            return next;
                                        })}
                                        className="text-xs text-slate-400 hover:text-white"
                                    >
                                        {t.clear}
                                    </button>
                                </div>
                                <div className="grid gap-4">
                                    {topicResults[topic.id].map(stagedPaper => (
                                        <StagedPaperCard
                                            key={stagedPaper.id}
                                            paper={stagedPaper}
                                            language={language}
                                            actions={
                                                <div className="flex gap-2 md:flex-col">
                                                    <button
                                                        onClick={() => {
                                                            // Remove isNew flag here too
                                                            onAddPaper(topic.id, { ...stagedPaper, isNew: false });
                                                            setTopicResults(prev => ({
                                                                ...prev,
                                                                [topic.id]: prev[topic.id].filter(p => p.id !== stagedPaper.id)
                                                            }));
                                                        }}
                                                        className="flex-1 md:w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-emerald-900/20"
                                                    >
                                                        {t.addPaper}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setTopicResults(prev => ({
                                                                ...prev,
                                                                [topic.id]: prev[topic.id].filter(p => p.id !== stagedPaper.id)
                                                            }));
                                                        }}
                                                        className="md:w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded font-bold transition-colors"
                                                    >
                                                        {t.discard}
                                                    </button>
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {getSortedPapers(topic.papers).map(paper => (
                                <PaperCard
                                    key={paper.id}
                                    paper={paper}
                                    accentColor={pillar.color}
                                    isEditMode={isEditMode}
                                    isRefreshing={refreshingIds.has(paper.id)}
                                    onDelete={() => onDeletePaper(topic.id, paper.id)}
                                    onEdit={() => setModalState({ topicId: topic.id, paper })}
                                    onRefresh={() => refreshPaperStats(topic.id, paper)}
                                    onAddComment={(txt) => onAddComment(topic.id, paper.id, txt)}
                                    onDeleteComment={(cId) => onDeleteComment(topic.id, paper.id, cId)}
                                    language={language}
                                    userName={userName}
                                />
                            ))}

                            {isEditMode && (
                                <button
                                    onClick={() => setModalState({ topicId: topic.id })}
                                    className="w-full py-4 border-2 border-dashed border-slate-800 rounded-xl text-slate-600 hover:border-slate-600 hover:text-slate-400 transition-all font-medium"
                                >
                                    {t.manualAdd}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* BOTTOM ACTION AREA (Add Topic / Import Topic) */}
                {isEditMode && pillar.topics.length > 0 && (
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CREATE NEW TOPIC */}
                        <div
                            onClick={onAddTopic}
                            className="p-8 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-indigo-500/50 hover:bg-slate-800/30 cursor-pointer transition-all group min-h-[180px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center mb-3 transition-colors">
                                <span className="text-xl font-bold group-hover:text-white">+</span>
                            </div>
                            <span className="font-bold text-lg">{t.createTopic}</span>
                        </div>

                        {/* IMPORT TOPIC */}
                        {onImportTopic && (
                            <button
                                onClick={handleImportTopicClick}
                                className="p-8 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-emerald-500/50 hover:bg-slate-800/30 cursor-pointer transition-all group min-h-[180px]"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-emerald-600 flex items-center justify-center mb-3 transition-colors">
                                    <svg className="w-5 h-5 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                </div>
                                <span className="font-bold text-lg">{t.importTopic}</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* PAPER FORM MODAL (Add & Edit) */}
            {modalState && (
                <PaperFormModal
                    initialData={modalState.paper}
                    onClose={() => setModalState(null)}
                    onSave={(p) => {
                        if (modalState.paper) {
                            onUpdatePaper(modalState.topicId, modalState.paper.id, p);
                        } else {
                            // Ensure we don't start with isNew if manually added unless checkbox
                            onAddPaper(modalState.topicId, { ...p, id: Date.now().toString() });
                        }
                        setModalState(null);
                    }}
                    language={language}
                />
            )}

        </div>
    );
};

// --- SUB COMPONENTS ---

const StagedPaperCard: React.FC<{ paper: Paper, actions: React.ReactNode, language: 'en' | 'cn' }> = ({ paper, actions, language }) => {
    const [showAbstract, setShowAbstract] = useState(false);

    // 拖动功能已注释
    // const handleDragStart = (e: React.DragEvent) => {
    //     e.dataTransfer.setData('application/json', JSON.stringify(paper));
    //     e.dataTransfer.effectAllowed = 'move';
    // };

    return (
        <div
            // draggable
            // onDragStart={handleDragStart}
            className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 shadow-sm flex flex-col gap-3 transition-all hover:border-indigo-500/50 hover:shadow-md animate-fade-in"
        >
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="flex-1 min-w-0">
                    {/* Header: Date + New Badge */}
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-bold text-slate-400">{paper.year} {paper.month && `• ${paper.month}`} {paper.day && `• ${paper.day}`}</span>
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">NEW</span>

                        {/* Metrics */}
                        {/* Show even if 0 if explicitly returned from search as 0/N/A to show we tried */}
                        {(paper.citationCount || paper.stars) && (
                            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
                                {paper.citationCount && (
                                    <span className="text-xs text-slate-500 flex items-center gap-1" title="Citations">
                                        {/* STANDARD BLOCK QUOTE ICON FOR CITATION */}
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 13h3a3 3 0 0 0 3-3V5H6v8zm9 0h3a3 3 0 0 0 3-3V5h-6v8z" /></svg>
                                        {paper.citationCount}
                                    </span>
                                )}
                                {paper.stars && (
                                    <span className="text-xs text-yellow-600 flex items-center gap-1" title="GitHub Stars">
                                        ★ {paper.stars}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Title & Author */}
                    <h4 className="text-base font-bold text-slate-100 leading-snug mb-1">
                        <a href={paper.link} target="_blank" rel="noreferrer" className="hover:underline hover:text-indigo-400 transition-colors">
                            {paper.title}
                        </a>
                    </h4>
                    <div className="text-xs text-slate-500 mb-2">{paper.authors}</div>

                    {/* Summary */}
                    <p className="text-sm text-slate-300 leading-relaxed italic bg-slate-950/30 p-2 rounded border border-slate-800/50 mb-2">
                        {paper.summary}
                    </p>

                    {/* Abstract Toggle */}
                    <button
                        onClick={() => setShowAbstract(!showAbstract)}
                        className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors focus:outline-none"
                    >
                        {showAbstract ? (language === 'cn' ? '隐藏摘要' : 'Hide Abstract') : (language === 'cn' ? '查看摘要' : 'View Abstract')}
                        <svg className={`w-3 h-3 transition-transform ${showAbstract ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>

                    {showAbstract && (
                        <div className="mt-2 p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400 leading-relaxed animate-fade-in">
                            {paper.abstract || (language === 'cn' ? '暂无摘要' : 'No abstract available.')}
                        </div>
                    )}
                </div>

                {/* Actions Column */}
                <div className="w-full md:w-auto md:min-w-[200px] shrink-0 flex flex-col gap-2">
                    {actions}
                </div>
            </div>
        </div>
    );
};

interface PaperCardProps {
    paper: Paper;
    accentColor: string;
    isEditMode: boolean;
    isRefreshing: boolean;
    onDelete: () => void;
    onEdit: () => void;
    onRefresh: () => void;
    onAddComment: (text: string) => void;
    onDeleteComment: (id: string) => void;
    language: 'en' | 'cn';
    userName: string;
}

const PaperCard: React.FC<PaperCardProps> = ({
    paper, accentColor, isEditMode, isRefreshing,
    onDelete, onEdit, onRefresh,
    onAddComment, onDeleteComment,
    language, userName
}) => {
    const borderClass = `hover:border-${accentColor}-500`;
    const textClass = `text-${accentColor}-400`;
    const [showAbstract, setShowAbstract] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');

    const t = {
        hide: language === 'cn' ? '隐藏摘要' : 'Hide Full Abstract',
        show: language === 'cn' ? '显示摘要' : 'Show Full Abstract',
        updating: language === 'cn' ? '更新中...' : 'Updating...',
        comments: language === 'cn' ? '评论' : 'Comments',
        addComment: language === 'cn' ? '添加评论...' : 'Add a thought...',
        post: language === 'cn' ? '发布' : 'Post'
    }

    const commentCount = paper.comments?.length || 0;

    // 拖动功能已注释
    // const handleDragStart = (e: React.DragEvent) => {
    //     e.dataTransfer.setData('application/json', JSON.stringify(paper));
    //     e.dataTransfer.effectAllowed = 'move';
    // };

    return (
        <div
            // draggable
            // onDragStart={handleDragStart}
            className={`bg-slate-800/40 border border-slate-700 rounded-xl p-5 transition-all hover:bg-slate-800 hover:shadow-xl ${borderClass} group relative`}
        >
            {isEditMode && (
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="text-slate-500 hover:text-indigo-400 p-1.5 bg-slate-900/80 rounded-full hover:bg-slate-800 transition-colors"
                        title="Edit Paper"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="text-slate-500 hover:text-red-500 p-1.5 bg-slate-900/80 rounded-full hover:bg-slate-800 transition-colors"
                        title="Delete Paper"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`font-mono text-xs font-bold px-2 py-1 rounded bg-slate-900 border border-slate-700 ${textClass}`}>
                            {paper.year} {paper.month && `• ${paper.month}`} {paper.day && `• ${paper.day}`}
                        </span>
                        {paper.isNew && (
                            <span className="bg-emerald-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 leading-snug pr-16">
                        <a href={paper.link} target="_blank" rel="noreferrer" className="hover:underline decoration-slate-500 underline-offset-4">
                            {paper.title}
                        </a>
                    </h3>
                    <p className="text-sm text-slate-400 font-medium mb-3">{paper.authors}</p>

                    {/* Short Summary (Always Visible) */}
                    <p className="text-slate-300 text-sm leading-relaxed mb-2 italic">
                        {paper.summary}
                    </p>

                    {/* Abstract Toggle */}
                    <div className="mt-2 flex items-center gap-4">
                        <button
                            onClick={() => setShowAbstract(!showAbstract)}
                            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 focus:outline-none"
                        >
                            {showAbstract ? (
                                <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                    {t.hide}
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    {t.show}
                                </>
                            )}
                        </button>

                        {/* Comment Toggle Button */}
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className={`text-xs flex items-center gap-1 transition-colors ${commentCount > 0 ? 'text-indigo-400' : 'text-slate-600 hover:text-indigo-300'}`}
                            title="Comments"
                        >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                            {commentCount > 0 && <span className="font-bold">{commentCount}</span>}
                        </button>
                    </div>

                    {showAbstract && (
                        <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800 text-slate-400 text-xs leading-relaxed animate-fade-in">
                            {paper.abstract || "No full abstract available."}
                        </div>
                    )}
                </div>

                <div className="flex items-center md:flex-col gap-2 md:items-end md:min-w-[140px] mt-2 md:mt-0">
                    <div className="flex flex-col items-end gap-1 mb-2 w-full">
                        {/* Stats Row - Always visible sync button */}
                        <div className="flex items-center gap-2 justify-end w-full">
                            {isRefreshing ? (
                                <span className="text-xs text-indigo-400 animate-pulse">{t.updating}</span>
                            ) : (
                                <>
                                    {paper.citationCount && (
                                        <div className="text-xs text-slate-500 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded" title="Citations">
                                            {/* STANDARD BLOCK QUOTE ICON FOR CITATION */}
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 13h3a3 3 0 0 0 3-3V5H6v8zm9 0h3a3 3 0 0 0 3-3V5h-6v8z" /></svg>
                                            {paper.citationCount}
                                        </div>
                                    )}
                                    {paper.stars !== undefined && (
                                        <div className="text-xs text-yellow-600/80 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-yellow-900/20" title="GitHub Stars">
                                            <span>★</span> {paper.stars}
                                        </div>
                                    )}
                                    {paper.upvotes !== undefined && paper.upvotes > 0 && (
                                        <div className="text-xs text-yellow-500 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-yellow-500/20" title="HF Upvotes">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                                            {paper.upvotes}
                                        </div>
                                    )}
                                </>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                                disabled={isRefreshing}
                                className="text-slate-600 hover:text-indigo-400 p-1 rounded hover:bg-slate-800 transition-colors"
                                title="Sync Stats (Live)"
                            >
                                <svg className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {paper.codeLink && (
                            <a href={paper.codeLink} target="_blank" rel="noreferrer" className="p-2 rounded bg-slate-700 hover:bg-white hover:text-black transition-colors" title="Code">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
                            </a>
                        )}
                        <a href={paper.link} target="_blank" rel="noreferrer" className="p-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors" title="Paper PDF">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </a>
                    </div>
                </div>
            </div>

            {/* COMMENTS MODAL / DRAWER */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.comments}</h4>
                        <button onClick={() => setShowComments(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide mb-3">
                        {(!paper.comments || paper.comments.length === 0) && (
                            <div className="text-xs text-slate-600 italic py-2">No comments yet.</div>
                        )}
                        {paper.comments?.map(comment => (
                            <div key={comment.id} className="bg-slate-900/50 p-2 rounded border border-slate-800 flex gap-3 group/comment">
                                <div className="w-6 h-6 rounded-full bg-indigo-900/50 flex items-center justify-center text-[10px] text-indigo-300 font-bold shrink-0">
                                    {comment.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xs text-indigo-300 font-bold">{comment.userName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-600">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteComment(comment.id); }}
                                                className="text-slate-600 hover:text-red-400 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
                            placeholder={userName ? t.addComment : "Set username in settings to comment..."}
                            disabled={!userName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newComment.trim()) {
                                    onAddComment(newComment);
                                    setNewComment('');
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                if (newComment.trim()) {
                                    onAddComment(newComment);
                                    setNewComment('');
                                }
                            }}
                            disabled={!userName || !newComment.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2 rounded transition-colors"
                        >
                            {t.post}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface PaperFormModalProps {
    initialData?: Paper;
    onClose: () => void;
    onSave: (paper: Paper) => void;
    language?: 'en' | 'cn';
}

const PaperFormModal: React.FC<PaperFormModalProps> = ({ initialData, onClose, onSave, language }) => {
    const [isFilling, setIsFilling] = useState(false);
    const [formData, setFormData] = useState<Paper>(initialData || {
        id: '',
        title: '',
        authors: '',
        year: new Date().getFullYear().toString(),
        month: '',
        day: '',
        summary: '',
        abstract: '',
        link: '',
        codeLink: '',
        citationCount: '',
        stars: '',
        isNew: false
    });

    const handleChange = (field: keyof Paper, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    // AI AUTO-FILL LOGIC with Retry Mechanism
    const handleAiFill = async () => {
        if (!formData.title && !formData.link) {
            alert("Please enter at least a Title or Link.");
            return;
        }
        setIsFilling(true);

        const maxRetries = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const provider = getAIProvider();

                // Simplified input to avoid confusing the model with empty fields
                const relevantInput = {
                    title: formData.title,
                    link: formData.link,
                    authors: formData.authors
                };

                // Use optimized prompt from prompts.ts (automatically uses current model)
                const currentModel = getSelectedModel();
                const prompt = getAiFillPrompt(relevantInput, currentModel || undefined);

                const response = await provider.generateContent({
                    prompt,
                    tools: [{ googleSearch: {} }]
                });

                console.log(`AI Fill Response (Attempt ${attempt}):`, response.text); // Debug

                const parseResult = parseJSON(response.text);

                if (parseResult.error) {
                    console.warn(`AI Fill parse failed (Attempt ${attempt}):`, parseResult.error);
                    lastError = new Error(`JSON parsing failed: ${parseResult.error}`);
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                        continue;
                    }
                    break;
                }

                const json = parseResult.data;

                if (json && typeof json === 'object') {
                    // Validate and repair the data
                    const validationResult = await validateAndRepairPaper(json, false); // Don't verify link for AI Fill

                    if (validationResult.paper && validationResult.paper.title && validationResult.paper.title !== 'Untitled Paper') {
                        // Success: Update form with repaired data
                        setFormData(prev => ({
                            ...prev,
                            ...validationResult.paper,
                            isNew: prev.isNew // Keep user preference for isNew
                        }));
                        console.log("✅ AI Fill successful with repaired data:", validationResult.paper);
                        if (validationResult.errors.length > 0) {
                            console.warn("⚠️ AI Fill warnings:", validationResult.errors);
                        }
                        setIsFilling(false);
                        return; // Success, exit retry loop
                    } else {
                        // Partial success but data is too incomplete
                        console.warn("AI Fill returned incomplete data, retrying...", validationResult);
                        lastError = new Error(`Incomplete data returned: ${validationResult.errors.join('; ')}`);
                        if (attempt < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                            continue;
                        }
                    }
                } else {
                    // Parse failed
                    console.warn(`AI Fill parse failed (Attempt ${attempt}), retrying...`);
                    lastError = new Error("Invalid JSON format or not an object");
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                        continue;
                    }
                }
            } catch (e) {
                console.error(`AI Fill failed (Attempt ${attempt}):`, e);
                lastError = e;
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                    continue;
                }
            }
        }

        // All retries failed
        console.error("AI Fill failed after all retries", lastError);
        alert(`AI Fill failed after ${maxRetries} attempts. ${lastError?.message || 'Please check the console or your API key.'}`);
        setIsFilling(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white">
                        {initialData ? 'Edit Paper' : 'Add New Paper'}
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-2">✕</button>
                </div>

                <div className="p-6 overflow-y-auto scrollbar-hide relative">

                    {/* AI FILL BUTTON */}
                    <div className="absolute top-6 right-8 z-10">
                        <button
                            type="button"
                            onClick={handleAiFill}
                            disabled={isFilling}
                            className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all"
                            title="Fill details using AI based on Title/Link"
                        >
                            {isFilling ? (
                                <>
                                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                    Filling...
                                </>
                            ) : (
                                <>
                                    <span>✨</span> AI Auto-Fill
                                </>
                            )}
                        </button>
                    </div>

                    <form id="paper-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                            <input
                                required
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors pr-32"
                                value={formData.title}
                                onChange={e => handleChange('title', e.target.value)}
                                placeholder="Paper Title (e.g. Attention Is All You Need)"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Authors</label>
                                <input
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.authors}
                                    onChange={e => handleChange('authors', e.target.value)}
                                    placeholder="Author names"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
                                    <input
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={formData.year}
                                        onChange={e => handleChange('year', e.target.value)}
                                        placeholder="YYYY"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Month</label>
                                    <input
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={formData.month || ''}
                                        onChange={e => handleChange('month', e.target.value)}
                                        placeholder="Short (Jan)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Day</label>
                                    <input
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={formData.day || ''}
                                        onChange={e => handleChange('day', e.target.value)}
                                        placeholder="DD"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">One-Sentence Summary</label>
                            <input
                                required
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.summary}
                                onChange={e => handleChange('summary', e.target.value)}
                                placeholder="Brief description (Always visible)..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Abstract</label>
                            <textarea
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors min-h-[120px]"
                                value={formData.abstract || ''}
                                onChange={e => handleChange('abstract', e.target.value)}
                                placeholder="Detailed abstract (Hidden by default)..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Paper Link (URL)</label>
                                <input
                                    required
                                    type="url"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.link}
                                    onChange={e => handleChange('link', e.target.value)}
                                    placeholder="https://arxiv.org/..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Code Link (Optional)</label>
                                <input
                                    type="url"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.codeLink || ''}
                                    onChange={e => handleChange('codeLink', e.target.value)}
                                    placeholder="https://github.com/..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Citations (Optional)</label>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.citationCount || ''}
                                    onChange={e => handleChange('citationCount', e.target.value)}
                                    placeholder="e.g. 1,200+"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GitHub Stars (Optional)</label>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.stars || ''}
                                    onChange={e => handleChange('stars', e.target.value)}
                                    placeholder="e.g. 4.5k"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="isNew"
                                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                checked={formData.isNew || false}
                                onChange={e => handleChange('isNew', e.target.checked)}
                            />
                            <label htmlFor="isNew" className="text-sm text-slate-400 select-none cursor-pointer">Mark as New / Trending</label>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="paper-form"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-900/20"
                    >
                        Save Paper
                    </button>
                </div>
            </div>
        </div>
    );
};
