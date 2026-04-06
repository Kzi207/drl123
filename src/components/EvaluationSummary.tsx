import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { getRank } from '../lib/utils';

interface EvaluationSummaryProps {
  totalScore: number;
  saving: boolean;
  onSave: (status: 'submitted' | 'draft') => void;
}

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = React.memo(({
  totalScore,
  saving,
  onSave
}) => {
  const rank = getRank(totalScore);
  
  const getRankColor = (r: string) => {
    switch (r) {
      case 'Xuất sắc': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Giỏi': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Khá': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Trung bình': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-rose-600 bg-rose-50 border-rose-100';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-8 gap-4">
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Tổng điểm dự kiến</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-blue-600 tabular-nums">{totalScore}</span>
              <span className="text-sm font-bold text-slate-400">/ 100</span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
          
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Xếp loại dự kiến</span>
            <span className={cn(
              "text-sm font-bold px-4 py-1 rounded-full border transition-all",
              getRankColor(rank)
            )}>
              {rank}
            </span>
          </div>
          
          <div className="hidden lg:block flex-1 max-w-[200px] ml-4">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${totalScore}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => onSave('submitted')}
            disabled={saving}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            )}
            Nộp phiếu điểm
          </button>
        </div>
      </div>
    </div>
  );
});

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
