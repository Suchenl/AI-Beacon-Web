import React, { useState } from 'react';
import { TIMELINE_DATA } from './constants';
import { TimelineEvent } from './types';
import { getAIProvider } from './aiProvider';

interface Props {
  customEvents: TimelineEvent[];
  onAddEvents: (events: TimelineEvent[]) => void;
}

export const ViewTimeline: React.FC<Props> = ({ customEvents, onAddEvents }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Merge static and custom events, sort by year then month
  const allEvents = [...TIMELINE_DATA, ...customEvents].sort((a, b) => {
    if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
    return 0; // Simplified sorting
  });

  const updateTimeline = async () => {
    setIsUpdating(true);

    try {
      const provider = getAIProvider();

      // NOTE: We cannot use responseSchema with googleSearch. We must prompt for JSON text.
      const prompt = `
        Search for the absolute latest Self-Supervised Learning papers released in late 2024 and 2025.
        
        Specifically verify if any of the following have been officially released:
        1. "SAM 3" or "SAM 3D" (Segment Anything in 3D)
        2. "Depth Anything V3" or "Depth Pro" updates.
        3. "DINOv3" official paper or DINO-X.
        
        If they exist, return them. If not, find the most recent high-impact SSL papers from Google DeepMind, Meta FAIR, or Apple.
        
        Exclude these titles: ${allEvents.map(e => e.title).join(', ')}.
        
        CRITICAL OUTPUT INSTRUCTION:
        You must return a valid JSON ARRAY string. 
        Do not use Markdown formatting (no \`\`\`json).
        
        JSON Schema:
        [
          {
            "title": "Model Name",
            "year": "2025",
            "month": "Jan 15", 
            "description": "Brief description",
            "category": "One of: Contrastive, Generative, Pretext, Multimodal, Distillation",
            "authors": "Lab or Authors",
            "impact": "Why it is better than previous methods",
            "link": "url"
          }
        ]
      `;

      const response = await provider.generateContent({
        prompt,
        tools: [{ googleSearch: {} }]
      });

      let text = response.text || '[]';
      
      // Robust Parsing: Find the first '[' and last ']' to isolate JSON
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        text = text.substring(firstBracket, lastBracket + 1);
      }

      // Clean potential markdown syntax just in case
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      const newItems = JSON.parse(text);
      
      if (Array.isArray(newItems) && newItems.length > 0) {
        const mappedEvents: TimelineEvent[] = newItems.map((item: any) => ({
          id: Date.now().toString() + Math.random(),
          year: item.year,
          fullDate: item.month, // Mapping 'month' from JSON to 'fullDate'
          title: item.title,
          description: item.description,
          category: item.category,
          authors: item.authors,
          impact: item.impact,
          link: item.link
        }));

        onAddEvents(mappedEvents);
      } else {
        console.warn("No new items found or format incorrect", newItems);
        alert("The AI found no new papers matching the strict criteria.");
      }

    } catch (e) {
      console.error("Failed to update timeline", e);
      alert("Failed to parse the AI response. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Evolution of Self-Supervision</h2>
          <p className="text-slate-400 text-sm mt-1">From Pretext tasks to World Models</p>
        </div>
        <button 
          onClick={updateTimeline}
          disabled={isUpdating}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            isUpdating 
              ? 'bg-slate-800 text-slate-500 cursor-wait' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
          }`}
        >
          {isUpdating ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              Searching 2025 Papers...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Check for Updates (Live)
            </>
          )}
        </button>
      </div>

      <div className="relative border-l-4 border-slate-700 ml-4 md:ml-10 space-y-12">
        {allEvents.map((event, idx) => {
          const isNew = parseInt(event.year) >= 2025 || (parseInt(event.year) === 2024 && (event.fullDate?.includes('Oct') || event.fullDate?.includes('Dec')));
          return (
            <div key={idx} className="relative pl-8 md:pl-12 group animate-fade-in">
              {/* Dot */}
              <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-slate-900 border-4 transition-colors ${
                isNew ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'border-indigo-500 group-hover:border-cyan-400'
              }`}></div>
              
              {/* Content */}
              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6">
                <div className="min-w-[80px] flex flex-col items-start">
                  <span className={`text-xl font-mono font-bold ${isNew ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {event.year}
                  </span>
                  {/* Requirement: Detailed Date (Month Day) */}
                  {event.fullDate && (
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap">
                      {event.fullDate}
                    </span>
                  )}
                </div>

                <div className={`flex-1 p-5 rounded-lg border transition-all ${
                  isNew 
                    ? 'bg-slate-800/80 border-emerald-500/50 shadow-lg shadow-emerald-900/20' 
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      {event.title}
                      {isNew && (
                        <span className="px-1.5 py-0.5 text-[10px] uppercase bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">New</span>
                      )}
                    </h3>
                    <span className="px-2 py-1 text-xs rounded bg-slate-900 text-slate-400 border border-slate-700 w-fit">
                      {event.category}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-2">{event.description}</p>
                  
                  {/* Requirement 3 indicator: Show that this is also in Models view if it has detailed info */}
                  {event.impact && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-indigo-300">
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                       Available in Model Cards
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 text-center text-slate-500 text-sm">
        Use the button above to find the latest papers. New discoveries are saved automatically.
      </div>
    </div>
  );
};