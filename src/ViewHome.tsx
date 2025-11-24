
import React from 'react';
import { View, Pillar } from './types';
import * as fileSystem from './fileSystem';

interface Props {
  pillars: Pillar[];
  onChangeView: (view: View, pillarId?: string) => void;
  isEditMode?: boolean;
  onAddPillar?: () => void;
  onImportPillar?: (pillar: Pillar) => void;
  onDeletePillar?: (id: string) => void;
  language: 'en' | 'cn';
}

export const ViewHome: React.FC<Props> = ({ pillars, onChangeView, isEditMode, onAddPillar, onImportPillar, onDeletePillar, language }) => {
  
  const handleImportClick = async () => {
    if (!onImportPillar) return;
    
    // Use robust loadJSON which has fallbacks
    const data = await fileSystem.loadJSON();
    
    if (data) {
      // Check if it looks like a Pillar (has title and topics)
      if (data.title && Array.isArray(data.topics)) {
        onImportPillar(data);
      } else {
        alert(language === 'cn' ? "选择的文件似乎不是有效的 Pillar JSON。" : "The file selected does not appear to be a valid Pillar JSON.");
      }
    }
  };

  const t = {
    title: 'AI BEACON',
    subtitle: language === 'cn' ? '构建你的个人智能图谱' : 'Construct your personal map of Intelligence.',
    manage: language === 'cn' ? '管理 • 追踪 • 进化' : 'Manage • Track • Evolve',
    create: language === 'cn' ? '创建新支柱' : 'Create New Pillar',
    import: language === 'cn' ? '导入支柱 (JSON)' : 'Import Pillar (JSON)',
    more: language === 'cn' ? '更多' : 'more',
    delete: language === 'cn' ? '删除支柱' : 'Delete Pillar'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 py-12 animate-fade-in">
      <h1 className="text-7xl md:text-8xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500 mb-6 tracking-tight drop-shadow-2xl">
        {t.title}
      </h1>
      <p className="text-xl text-slate-400 max-w-2xl mb-16 font-light leading-relaxed">
        {t.subtitle}
        <br/>
        <span className="text-sm mt-2 block opacity-60">{t.manage}</span>
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full px-2">
        {pillars.map((pillar) => {
          const colors: Record<string, string> = {
            cyan: 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-cyan-500/10',
            indigo: 'border-indigo-500/30 hover:border-indigo-400 hover:shadow-indigo-500/10',
            emerald: 'border-emerald-500/30 hover:border-emerald-400 hover:shadow-emerald-500/10',
            rose: 'border-rose-500/30 hover:border-rose-400 hover:shadow-rose-500/10',
            amber: 'border-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/10',
          };
          
          const textColors: Record<string, string> = {
            cyan: 'text-cyan-400',
            indigo: 'text-indigo-400',
            emerald: 'text-emerald-400',
            rose: 'text-rose-400',
            amber: 'text-amber-400',
          };

          const color = colors[pillar.color] || colors['indigo'];
          const textColor = textColors[pillar.color] || textColors['indigo'];

          return (
            <div key={pillar.id} className="relative group">
              {isEditMode && onDeletePillar && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeletePillar(pillar.id); }}
                  className="absolute -top-3 -right-3 w-9 h-9 bg-red-600 text-white rounded-full z-20 flex items-center justify-center hover:bg-red-500 shadow-xl border-2 border-slate-900 transition-transform hover:scale-110"
                  title={t.delete}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              )}
              <button 
                onClick={() => onChangeView(View.PILLAR_DETAIL, pillar.id)}
                className={`w-full h-full p-8 bg-slate-800/20 border rounded-3xl text-left transition-all duration-300 backdrop-blur-sm group-hover:-translate-y-1 ${color}`}
              >
                <div className={`text-xs font-bold uppercase tracking-widest mb-4 opacity-70 ${textColor}`}>
                  {pillar.title.split('.')[0]}
                </div>
                <h3 className="text-2xl font-bold text-slate-100 mb-3 leading-tight">
                  {pillar.title.split('. ')[1] || pillar.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[40px]">
                  {pillar.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {pillar.topics.slice(0, 3).map(t => (
                    <span key={t.id} className="text-[10px] px-2 py-1 rounded bg-slate-900/50 border border-slate-700 text-slate-400">
                      {t.title}
                    </span>
                  ))}
                  {pillar.topics.length > 3 && (
                    <span className="text-[10px] px-2 py-1 text-slate-500">+{pillar.topics.length - 3} {t.more}</span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
        
        {isEditMode && onAddPillar && (
          <div className="relative flex flex-col gap-4">
            <button 
              onClick={onAddPillar}
              className="flex-1 p-8 border border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800/30 transition-all gap-4 min-h-[200px]"
            >
               <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl">+</div>
               <span className="font-medium">{t.create}</span>
            </button>
            
            {onImportPillar && (
              <button 
                onClick={handleImportClick}
                className="p-4 border border-dashed border-slate-700 rounded-3xl flex items-center justify-center gap-2 text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800/30 transition-all"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                 <span className="font-medium">{t.import}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
