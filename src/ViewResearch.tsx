import React, { useState } from 'react';
import { ChatMessage } from './types';
import Markdown from 'react-markdown';
import { getAIProvider } from './aiProvider';

export const ViewResearch: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [latestResearch, setLatestResearch] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("What are the most important AI papers released this week (November 2025)?");

  const scanHorizon = async () => {
    setIsLoading(true);
    try {
      const provider = getAIProvider();
      const response = await provider.generateContent({
        prompt: searchQuery,
        tools: [{ googleSearch: {} }]
      });

      const text = response.text;
      // Extract grounding chunks if available
      const groundingChunks = response.groundingMetadata?.groundingChunks;
      
      const sources = groundingChunks?.map((chunk: any) => {
        if (chunk.web) {
            return { title: chunk.web.title, uri: chunk.web.uri };
        }
        return null;
      }).filter(Boolean) || [];

      setLatestResearch({
        id: Date.now().toString(),
        role: 'model',
        text: text || "No results found.",
        groundingSources: sources
      });

    } catch (error: any) {
      setLatestResearch({
        id: 'error',
        role: 'model',
        text: `Failed to fetch research: ${error.message}`,
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Global Research Radar
          </span>
        </h2>
        <p className="text-slate-400 mb-8">
          Scan the entire AI horizon. From Agents to Alignment, find what just happened.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-2xl mx-auto mb-8">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Enter search topic..."
          />
          <button
            onClick={scanHorizon}
            disabled={isLoading}
            className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 min-w-[160px] justify-center ${
              isLoading 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                Scan Horizon
              </>
            )}
          </button>
        </div>
      </div>

      {latestResearch && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 shadow-xl animate-fade-in">
          <div className="prose prose-invert max-w-none prose-headings:text-purple-400 prose-a:text-pink-400 hover:prose-a:text-pink-300">
             <Markdown>{latestResearch.text}</Markdown>
          </div>

          {latestResearch.groundingSources && latestResearch.groundingSources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <h4 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4">Source References</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {latestResearch.groundingSources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-700 transition-colors text-sm text-slate-300 truncate group"
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500 group-hover:bg-purple-500/20 group-hover:text-purple-400 shrink-0">{idx + 1}</span>
                    <span className="truncate">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};