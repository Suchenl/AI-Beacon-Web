import React from 'react';
import { CLASSIC_MODELS } from './constants';
import { TimelineEvent, ModelCardData } from './types';

interface Props {
  customEvents?: TimelineEvent[];
}

export const ViewModels: React.FC<Props> = ({ customEvents = [] }) => {
  
  // Requirement 3: Sync logic. Convert detailed timeline events into Model Cards.
  const dynamicModels: ModelCardData[] = customEvents
    .filter(e => e.impact && e.authors) // Only include events that have enough info to be a model card
    .map(e => ({
      id: e.id || e.title,
      name: e.title,
      year: e.year,
      authors: e.authors || 'Unknown',
      type: e.category,
      description: e.description,
      impact: e.impact || 'Data not available.',
      link: e.link || '#'
    }));

  const allModels = [...CLASSIC_MODELS, ...dynamicModels];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold mb-4 text-center text-slate-100">Hall of Fame Models</h2>
      <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
        Discover the architectures that challenged the need for human labels.
        <br/>
        <span className="text-xs text-slate-500">
          (Newly discovered papers from the History timeline automatically appear here)
        </span>
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {allModels.map((model, idx) => {
            const isDynamic = parseInt(model.year) >= 2024;
            return (
              <div key={model.id + idx} className={`bg-slate-800/80 rounded-2xl overflow-hidden border transition-all flex flex-col animate-fade-in ${
                isDynamic ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-slate-700 hover:border-indigo-500'
              }`}>
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        {model.name}
                        {isDynamic && <span className="text-[10px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded">NEW</span>}
                      </h3>
                      <div className="text-sm text-indigo-400 font-mono mt-1">{model.year} • {model.authors}</div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 whitespace-nowrap">
                      {model.type}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-1">Mechanism</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{model.description}</p>
                    </div>
                    
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                      <h4 className="text-sm uppercase tracking-wider text-emerald-500 font-semibold mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        Superiority over Supervised
                      </h4>
                      <p className="text-slate-300 text-sm">{model.impact}</p>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex justify-end">
                  <a 
                    href={model.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Read Paper 
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                </div>
              </div>
          );
        })}
      </div>
    </div>
  );
};