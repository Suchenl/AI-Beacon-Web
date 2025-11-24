/**
 * Qwen3 Max (通义千问) specific prompts
 * Optimized for Qwen's Chinese and English capabilities
 */

import { PromptModule } from './types';

export const qwen3MaxPrompts: PromptModule = {
    getAiFillPrompt: (input) => {
        const { title, link, authors } = input;

        return `你是一位专业的研究论文元数据提取专家。请根据提供的信息提取研究论文的完整元数据。

输入数据:
${JSON.stringify({ title: title || '', link: link || '', authors: authors || '' }, null, 2)}

请执行以下操作:
1. 如果提供了链接，请验证并从该来源提取元数据
2. 交叉参考多个来源以确保准确性
3. 提取所有可用的元数据字段
4. 对于缺失的字段，使用"Unknown"（不是空字符串）
5. 确保日期准确且格式正确
6. 提取完整的摘要文本，不仅仅是摘要

返回格式要求:
- 仅返回有效的JSON对象
- 以 { 开始，以 } 结束
- 不使用Markdown格式
- 不使用代码块或反引号
- JSON前后不要有解释性文本
- JSON中不要有注释
- 所有字符串值必须正确转义

字段要求:
- title: 完整的官方论文标题（必需）
- authors: 标准格式的作者姓名（例如："First Author et al." 或 "Author1, Author2, Author3"）
- year: 4位数字年份（YYYY格式，例如："2024"）
- month: 3字母缩写（MMM格式，例如："Jan", "Feb", "Mar"）或未知时为空字符串
- day: 2位数字日期（DD格式，例如："15"）或未知时为空字符串
- summary: 描述论文主要贡献的一句话
- abstract: 完整的摘要文本（完整段落，不截断）
- link: 指向PDF或论文页面的直接URL（优先ArXiv、官方出版商或Semantic Scholar）
- codeLink: GitHub仓库URL（如果可用），否则为空字符串""
- citationCount: 当前引用计数，格式如"1,200+"或"50"或"0"（如果未知）
- stars: GitHub stars，格式如"1.2k"或"500"或"0"（如果没有仓库）

只返回这个JSON结构，不要其他内容:
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
            ? '摘要/摘要使用中文。标题使用英文。'
            : 'English.';

        const prompt = `你是一位专业的AI研究专家。
任务: 搜索并返回${searchCount}篇在${startDate}和${endDate}之间发布的新AI研究论文。
查询: "AI research papers ${searchQuery} ${startDate}..${endDate} arxiv"

上下文:
${context}

**重要要求 - 必须遵守**:
1. **必须返回非空数组**: 你绝对不能返回空数组 []。即使找不到完全匹配的论文，也必须返回相关的论文。
2. **必须返回至少${searchCount}篇论文**: 你的JSON数组必须包含至少${searchCount}个论文对象。如果找不到${searchCount}篇，返回你能找到的最相关的论文（但至少要有1篇）。
3. **如果找不到完全匹配的日期范围**: 可以放宽日期范围，但优先选择最接近指定日期范围的论文。

说明:
1. 执行Google搜索以查找此特定日期范围内的真实论文
2. 确保论文与提供的上下文高度相关
3. 忽略这些标题: ${JSON.stringify(existingTitles)}
4. **关键**: 对于每篇论文，链接必须是你找到该确切标题的URL。验证链接指向显示该确切标题的页面。不要混合不同论文的标题和链接。
5. **关键 - 准确统计**: 对于citationCount和stars，你必须:
   - 搜索实际论文以获取真实的引用计数
   - 搜索实际的GitHub仓库（如果提供了codeLink或找到）以获取真实的star计数
   - 不要猜测、估计或编造数字
   - 如果找不到实际数据，使用"0"（不是近似值）
   - 引用计数应来自Google Scholar或Semantic Scholar
   - Stars应来自实际的GitHub仓库页面
6. **输出格式要求**:
   - 返回严格有效的JSON数组
   - 以 [ 开始，以 ] 结束
   - 不使用Markdown，不使用代码块，不使用解释
   - **数组必须包含至少${searchCount}个元素，不能为空**
   - 仅在你从实际来源找到真实数据时包含citationCount和stars

JSON模式（必须返回至少${searchCount}个对象）:
[
  { 
    "title": "Exact Paper Title", 
    "authors": "First Author et al.", 
    "year": "YYYY", 
    "month": "MMM", 
    "day": "DD", 
    "summary": "One sentence value proposition.", 
    "abstract": "A detailed paragraph describing the methodology.", 
    "link": "URL (必须和标题匹配，否则返回空字符串\"\")", 
    "codeLink": "GitHub URL (optional)",
    "stars": "GitHub stars (e.g. '1.5k' or '0')", 
    "citationCount": "Citations (e.g. '50+' or '0')" 
  }
]

**再次强调**: 必须返回非空数组，包含至少${searchCount}篇论文。禁止返回空数组 []。

语言: ${languageInstruction}`;

        return { prompt, systemInstruction: undefined };
    },

    getRefreshStatsPrompt: (input) => {
        const { title, authors, abstract, link, codeLink } = input;

        return `你是一位专业的研究论文验证和指标查找专家。

任务: 验证论文链接是否匹配论文，并查找准确的引用计数和GitHub stars。

当前论文数据:
- 标题: "${title}"
- 作者: ${authors}
${abstract ? `- 摘要: "${abstract.substring(0, 500)}${abstract.length > 500 ? '...' : ''}"` : ''}
${link ? `- 当前论文链接: ${link}` : '- 当前论文链接: 未提供'}
${codeLink ? `- 当前代码链接: ${codeLink}` : '- 当前代码链接: 未提供'}

验证说明:
1. **验证论文链接**:
   - 搜索这篇论文: "${title}" by ${authors}
   - 访问当前链接并验证是否匹配:
     * 检查标题是否完全匹配
     * 检查作者是否匹配
     ${abstract ? `* 检查摘要是否匹配（至少前几句话）` : ''}
   - 如果链接不匹配，从以下来源查找正确的论文链接:
     * ArXiv (arxiv.org)
     * Semantic Scholar (semanticscholar.org)
     * Google Scholar (scholar.google.com)
     * 官方出版商网站
   - 返回已验证和正确的链接

2. **验证代码链接**:
   - 如果提供了codeLink，验证它是否匹配这篇论文:
     * 检查GitHub仓库README或描述是否提及这篇论文
     * 检查仓库标题/描述是否匹配论文标题或主题
     * 检查作者是否在仓库中提及
   - 如果codeLink不匹配，搜索正确的仓库:
     * 在GitHub上搜索: "${title}" OR "${title} github" OR "${authors} ${title.split(' ')[0]} github"
     * 验证仓库是否确实属于这篇论文
   - 如果找不到匹配的仓库，返回空字符串""

3. **查找引用计数**:
   - 在Google Scholar或Semantic Scholar上搜索这篇论文
   - 找到与标题和作者完全匹配的论文
   - 从搜索结果或论文页面提取实际的引用计数
   - 格式: "1,200+"或"50"或"0"（如果未找到）
   - 不要猜测或估计

4. **查找GitHub Stars**:
   - 使用已验证的codeLink
   - 访问GitHub仓库页面
   - 从仓库页面提取实际的star计数
   - 格式: "4.5k"或"500"或"0"（如果没有仓库或未找到）
   - 不要猜测或估计

5. **关键规则**:
   - 仅返回你可以从实际来源验证的数据
   - 如果找不到真实数据，数字使用"0"，链接使用""
   - 链接和codeLink必须匹配论文（通过标题、作者和摘要验证）
   - 不要返回不正确或不匹配的链接

输出格式:
仅返回有效的JSON（不使用Markdown，不使用代码块，不使用解释）:
{
  "link": "已验证和正确的论文URL（如果当前链接匹配则使用当前链接）",
  "codeLink": "已验证和正确的GitHub URL（如果没有或不匹配则使用空字符串）",
  "citationCount": "来自Google Scholar/Semantic Scholar的实际数字",
  "stars": "来自GitHub的实际数字（如果没有仓库则为'0'）"
}`;
    }
};

