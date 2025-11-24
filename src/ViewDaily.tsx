
import React, { useState, useEffect } from 'react';
import { Paper, Pillar } from './types';
import { getAIProvider } from './aiProvider';

interface Props {
  pillars: Pillar[];
  onAddPaperToPillar: (pillarId: string, topicName: string, paper: Paper) => void;
  language: 'en' | 'cn';
}

type SortOption = 'upvotes' | 'date' | 'relevance' | 'stars';

export const ViewDaily: React.FC<Props> = ({ pillars, onAddPaperToPillar, language }) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('upvotes');
  
  // Toggle for AI Curator Mode
  const [curatorMode, setCuratorMode] = useState(false);

  // Form state for adding paper
  const [targetPillarId, setTargetPillarId] = useState<string>('');
  const [targetTopicName, setTargetTopicName] = useState<string>('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  // Localization Dictionary
  const t = {
    title: language === 'cn' ? '每日论文' : 'Daily Papers',
    subtitle: language === 'cn' ? 'Hugging Face 热门研究' : 'Top trending research from Hugging Face.',
    sort: language === 'cn' ? '排序:' : 'Sort:',
    upvotes: language === 'cn' ? '🔥 推荐数' : '🔥 Upvotes',
    date: language === 'cn' ? '📅 日期' : '📅 Date',
    relevance: language === 'cn' ? '🤖 AI 推荐' : '🤖 AI Relevance',
    stars: language === 'cn' ? '★ GitHub 星标' : '★ GitHub Stars',
    standard: language === 'cn' ? '标准模式' : 'Standard',
    assistant: language === 'cn' ? 'AI 助手' : 'AI Assistant',
    refresh: language === 'cn' ? '刷新' : 'Refresh',
    fetching: language === 'cn' ? '加载中...' : 'Fetching...',
    empty: language === 'cn' ? '未找到论文或连接失败。' : 'No papers found or connection failed.',
    add: language === 'cn' ? '+ 添加到知识库' : '+ Add to Beacon',
    viewHF: language === 'cn' ? '在 HF 查看 ↗' : 'View on HF ↗',
    addToKB: language === 'cn' ? '添加到知识库' : 'Add to Knowledge Base',
    whereTo: language === 'cn' ? '我们要把这篇论文归档到哪里？' : 'Where should we file',
    pillar: language === 'cn' ? '支柱' : 'Pillar',
    topic: language === 'cn' ? '主题' : 'Topic',
    newTopic: language === 'cn' ? '+ 新建' : '+ New',
    newTopicName: language === 'cn' ? '新主题名称...' : 'New Topic Name...',
    cancel: language === 'cn' ? '取消' : 'Cancel',
    save: language === 'cn' ? '保存论文' : 'Save Paper',
    trending: language === 'cn' ? '趋势' : 'Trending',
    success: language === 'cn' ? '论文添加成功！' : 'Paper added successfully!'
  };

  useEffect(() => {
    // Initial fetch
    fetchPapers();
  }, [language, curatorMode]); 

  // Sorting effect
  useEffect(() => {
    if (papers.length > 0) {
      const sorted = [...papers].sort((a, b) => {
        if (sortBy === 'upvotes') {
          return (b.upvotes || 0) - (a.upvotes || 0);
        } else if (sortBy === 'stars') {
          // Handle numbers or strings like "1.2k"
          const starA = parseMetric(a.stars);
          const starB = parseMetric(b.stars);
          return starB - starA;
        } else if (sortBy === 'date') {
          // Sort by Year -> Month -> Day (Newest First)
          // If dates equal, fallback to Upvotes
          const dateA = new Date(`${a.year} ${a.month} ${a.day}`).getTime();
          const dateB = new Date(`${b.year} ${b.month} ${b.day}`).getTime();
          
          if (dateB !== dateA) return dateB - dateA;
          return (b.upvotes || 0) - (a.upvotes || 0);
        }
        // Relevance is handled by the AI order, so default sort preserves it
        return 0;
      });
      setPapers(sorted);
    }
  }, [sortBy]); // Added sortBy to dependencies so changes trigger resort

  const parseMetric = (val?: string | number) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    let n = parseFloat(val.replace(/,/g, ''));
    if (val.includes('k')) n *= 1000;
    return isNaN(n) ? 0 : n;
  };

  const fetchPapers = () => {
    if (curatorMode) {
      fetchPapersAI_Curator();
    } else {
      fetchPapersHF_Standard();
    }
  };

  const fetchPapersHF_Standard = async () => {
    setIsLoading(true);
    try {
      const proxyUrl = 'https://corsproxy.io/?';
      const targetUrl = 'https://huggingface.co/api/daily_papers';
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      if (!response.ok) throw new Error('Failed to fetch from HF');

      const data = await response.json();
      
      const mappedPapers: Paper[] = data.map((item: any) => {
        const paperData = item.paper || item; 
        const paperId = paperData.id; 
        const date = new Date(item.publishedAt);
        const locale = language === 'cn' ? 'zh-CN' : 'en-US';

        // Use HF "upvotes" as "stars" in our UI model
        const upvotes = paperData.upvotes || item.upvotes || 0;
        
        // CHECK ALL POSSIBLE LOCATIONS FOR STARS
        // Fallback chain: item.numGitHubStars -> paperData.numGitHubStars -> paperData.githubStars
        const githubStars = item.numGitHubStars || paperData.numGitHubStars || paperData.githubStars || 0;

        return {
          id: paperId || `hf-${Date.now()}-${Math.random()}`,
          title: paperData.title,
          authors: paperData.authors?.map((a: any) => a.name).join(', ') || 'Unknown Authors',
          year: date.getFullYear().toString(),
          month: date.toLocaleString(locale, { month: 'short' }),
          day: date.getDate().toString(),
          summary: paperData.summary || "No summary available.", 
          abstract: paperData.abstract || paperData.summary, 
          link: `https://huggingface.co/papers/${paperId}`,
          citationCount: '', 
          stars: githubStars, // Store real GitHub stars
          upvotes: upvotes, // Explicitly store HF Upvotes
          isNew: true
        };
      });

      // Default sort by upvotes
      mappedPapers.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      
      setPapers(mappedPapers);
      setSortBy('upvotes');

    } catch (e) {
      console.error("Error fetching daily papers (HF):", e);
      alert(language === 'cn' ? "获取日报失败，请检查网络。" : "Failed to fetch Daily Papers. Check network or CORS.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * AI CURATOR MODE
   * Fetches raw list, asks Gemini to RANK and FILTER for a professional researcher.
   */
  const fetchPapersAI_Curator = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Raw Data
      const proxyUrl = 'https://corsproxy.io/?';
      const targetUrl = 'https://huggingface.co/api/daily_papers';
      const rawResponse = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      if (!rawResponse.ok) throw new Error("HF Fetch failed");
      const rawData = await rawResponse.json();
      
      // Simplify data for prompt context window
      const candidates = rawData.map((p:any, idx: number) => ({
          id: p.paper.id,
          title: p.paper.title,
          summary: p.paper.summary?.substring(0, 200), // Truncate for token limits
          index: idx
      }));

      const provider = getAIProvider();
      
      // 2. Prompt for Curation
      const prompt = `
        You are a Senior AI Editor for a top-tier research lab.
        I have a list of ${candidates.length} new papers. 
        
        TASK:
        1. Select the top 10 most significant papers for a General AI Researcher.
        2. Focus on: Generalization, Agents, Scaling, Architecture (Transformers/Mamba), and Alignment.
        3. Filter out niche applications (e.g. "medical segmentation of kidney" or "traffic prediction") unless they propose a major architectural shift.
        4. Sort them by IMPORTANCE/IMPACT.
        
        INPUT DATA: ${JSON.stringify(candidates)}
        
        OUTPUT:
        Return a JSON Array of indices [3, 12, 0, ...] corresponding to the input list.
        If language is 'cn', return a JSON Object mapping index to a translated Chinese summary: 
        { "indices": [3, 12...], "translations": { "3": "Chinese Summary...", "12": "..." } }
      `;

      const response = await provider.generateContent({
        prompt,
        contents: prompt
      });
      
      const resultText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(resultText);

      let indices: number[] = [];
      let translations: Record<string, string> = {};

      if (Array.isArray(result)) {
        indices = result;
      } else if (result.indices) {
        indices = result.indices;
        translations = result.translations || {};
      }

      // 3. Reconstruct Filtered List
      const curatedPapers: Paper[] = [];
      
      indices.forEach((originalIndex) => {
         const item = rawData[originalIndex];
         if (!item) return;

         const paperData = item.paper;
         const date = new Date(item.publishedAt);
         const locale = language === 'cn' ? 'zh-CN' : 'en-US';
         const upvotes = paperData.upvotes || item.upvotes || 0;
         // Extended check for stars
         const githubStars = item.numGitHubStars || paperData.numGitHubStars || paperData.githubStars || 0;
         
         // Use AI translated summary if available
         const finalSummary = translations[originalIndex.toString()] || paperData.summary;

         curatedPapers.push({
            id: paperData.id,
            title: paperData.title,
            authors: paperData.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
            year: date.getFullYear().toString(),
            month: date.toLocaleString(locale, { month: 'short' }),
            day: date.getDate().toString(),
            summary: finalSummary,
            abstract: paperData.abstract,
            link: `https://huggingface.co/papers/${paperData.id}`,
            citationCount: '',
            stars: githubStars, 
            upvotes: upvotes,
            isNew: true
         });
      });

      setPapers(curatedPapers);
      setSortBy('relevance');

    } catch (e) {
      console.error("Error in AI Curation:", e);
      fetchPapersHF_Standard(); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = (paper: Paper) => {
    setSelectedPaper(paper);
    if (pillars.length > 0) {
      setTargetPillarId(pillars[0].id);
      if (pillars[0].topics.length > 0) {
        setTargetTopicName(pillars[0].topics[0].title);
        setIsCreatingTopic(false);
      } else {
        setTargetTopicName('');
        setIsCreatingTopic(true);
      }
    }
  };

  const handleSave = () => {
    if (!selectedPaper || !targetPillarId || !targetTopicName) return;
    onAddPaperToPillar(targetPillarId, targetTopicName, selectedPaper);
    setSelectedPaper(null);
    setTargetTopicName('');
    alert(t.success);
  };

  const selectedPillarTopics = pillars.find(p => p.id === targetPillarId)?.topics || [];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{t.title}</h2>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort Control */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 px-3 py-1">
             <span className="text-xs text-slate-500 mr-2 uppercase font-bold">{t.sort}</span>
             <select 
               value={sortBy} 
               onChange={(e) => setSortBy(e.target.value as SortOption)}
               className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
             >
                <option value="upvotes" className="bg-slate-800 text-white">{t.upvotes}</option>
                <option value="date" className="bg-slate-800 text-white">{t.date}</option>
                <option value="stars" className="bg-slate-800 text-white">{t.stars}</option>
                {curatorMode && <option value="relevance" className="bg-slate-800 text-white">{t.relevance}</option>}
             </select>
          </div>

          {/* Mode Switch */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-full p-1 pr-3 border border-slate-700">
            <button
              onClick={() => setCuratorMode(false)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${!curatorMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {t.standard}
            </button>
            <button
              onClick={() => setCuratorMode(true)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${curatorMode ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="AI Curates & Ranks for Researchers"
            >
              {t.assistant}
            </button>
          </div>

          <button 
            onClick={fetchPapers}
            disabled={isLoading}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
          >
            {isLoading ? t.fetching : (
                <>
                    <span>🔄</span> {t.refresh}
                </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-slate-800/50 rounded-2xl animate-pulse border border-slate-700"></div>
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700">
            <p className="text-slate-400">{t.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {papers.map((paper, idx) => {
            // 拖动功能已注释
            // const handleDragStart = (e: React.DragEvent) => {
            //   e.dataTransfer.setData('application/json', JSON.stringify(paper));
            //   e.dataTransfer.effectAllowed = 'move';
            // };

            return (
            <div 
              key={paper.id} 
              // draggable
              // onDragStart={handleDragStart}
              className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 hover:bg-slate-800 transition-all group relative flex flex-col"
            >
              {/* Ranking Badge for AI Mode */}
              {curatorMode && (
                <div className="absolute -left-3 -top-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white border-4 border-slate-900 z-20 shadow-lg">
                   {idx + 1}
                </div>
              )}

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={() => handleAddClick(paper)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
                >
                  <span>{t.add}</span>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{t.trending}</span>
                  {paper.upvotes !== undefined && paper.upvotes > 0 && (
                    <span className="text-xs text-yellow-500 flex items-center gap-1 bg-slate-900/50 px-2 py-0.5 rounded border border-yellow-500/20" title="HF Upvotes">
                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                       {paper.upvotes}
                    </span>
                  )}
                  {paper.stars !== undefined && (
                    <span className="text-xs text-yellow-600 flex items-center gap-1 bg-slate-900/50 px-2 py-0.5 rounded border border-yellow-600/20" title="GitHub Stars">
                        ★ {paper.stars}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white leading-tight mb-2 pr-20">
                  <a href={paper.link} target="_blank" rel="noreferrer" className="hover:underline">{paper.title}</a>
                </h3>
                <p className="text-sm text-slate-400">{paper.authors}</p>
              </div>
              
              <div className="flex-1">
                 <p className="text-sm text-slate-300 line-clamp-4 mb-4 italic">
                    {paper.summary}
                 </p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-700/50 text-xs text-slate-500 flex justify-between">
                  <span>{paper.year} • {paper.month} {paper.day}</span>
                  <a href={paper.link} target="_blank" rel="noreferrer" className="hover:text-white">{t.viewHF}</a>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Add to Library Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">{t.addToKB}</h3>
            <p className="text-sm text-slate-400 mb-6">
              {t.whereTo} <strong>"{selectedPaper.title}"</strong>?
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.pillar}</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  value={targetPillarId}
                  onChange={(e) => {
                    setTargetPillarId(e.target.value);
                    // Reset topic selection when pillar changes
                    const p = pillars.find(pil => pil.id === e.target.value);
                    if (p && p.topics.length > 0) {
                      setTargetTopicName(p.topics[0].title);
                      setIsCreatingTopic(false);
                    } else {
                      setTargetTopicName('');
                      setIsCreatingTopic(true);
                    }
                  }}
                >
                  {pillars.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.topic}</label>
                
                {!isCreatingTopic && selectedPillarTopics.length > 0 ? (
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                      value={targetTopicName}
                      onChange={(e) => setTargetTopicName(e.target.value)}
                    >
                      {selectedPillarTopics.map(t => (
                        <option key={t.id} value={t.title}>{t.title}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => { setIsCreatingTopic(true); setTargetTopicName(''); }}
                      className="px-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white"
                      title="Create New Topic"
                    >
                      {t.newTopic}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                     <input 
                        type="text"
                        className="flex-1 bg-slate-800 border border-indigo-500 text-white rounded-lg p-2.5 focus:outline-none"
                        placeholder={t.newTopicName}
                        value={targetTopicName}
                        onChange={(e) => setTargetTopicName(e.target.value)}
                        autoFocus
                     />
                     {selectedPillarTopics.length > 0 && (
                       <button 
                         onClick={() => { setIsCreatingTopic(false); setTargetTopicName(selectedPillarTopics[0].title); }}
                         className="px-3 text-xs text-slate-500 hover:text-white"
                       >
                         {t.cancel}
                       </button>
                     )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPaper(null)}
                className="text-slate-400 hover:text-white px-4 py-2"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSave}
                disabled={!targetTopicName}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
