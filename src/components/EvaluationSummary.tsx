import React from 'react';
import { Send, Loader2, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { getRank } from '../lib/utils';

interface EvaluationSummaryProps {
  totalScore: number;
  saving: boolean;
  onSave: (status: 'submitted' | 'draft') => Promise<void>;
  scoreStatus?: 'draft' | 'submitted' | 'rejected' | 'class_approved' | 'bch_approved' | 'finalized';
  periodStatus?: {
    status: 'active' | 'not-started' | 'expired' | 'unknown';
    message: string;
  };
}

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = React.memo(({
  totalScore,
  saving,
  onSave,
  scoreStatus,
  periodStatus
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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] z-50">
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-1 md:gap-4 md:px-8">
        <div className="flex items-center gap-2 md:gap-6 w-auto shrink-0">
          <div className="flex flex-col justify-center">
            <span className="text-[7.5px] md:text-[9px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-0.5">Tổng điểm</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base md:text-3xl font-black text-blue-600 tabular-nums leading-none">{totalScore}</span>
              <span className="text-[8px] md:text-sm font-bold text-slate-400">/100</span>
            </div>
          </div>
          
          <div className="h-5 md:h-10 w-px bg-slate-200"></div>
          
          <div className="flex flex-col justify-center items-start text-left shrink-0">
            <span className="text-[7.5px] md:text-[9px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-0.5 hidden sm:block">Xếp loại</span>
            <span className={cn(
              "text-[9px] md:text-sm font-bold px-1.5 py-0.5 md:px-3 md:py-1 rounded-sm md:rounded-full border transition-all inline-block",
              getRankColor(rank)
            )}>
              {rank}
            </span>
          </div>
          
          {periodStatus && periodStatus.status !== 'unknown' && (
            <div className="hidden lg:flex items-center gap-2 ml-4">
              {periodStatus.status === 'active' && (
                <>
                  <CheckCircle className="text-emerald-600" size={20} />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Trạng thái</span>
                    <span className="text-sm font-bold text-emerald-600">Đang diễn ra</span>
                  </div>
                </>
              )}
              {periodStatus.status === 'not-started' && (
                <>
                  <Clock className="text-amber-600" size={20} />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Trạng thái</span>
                    <span className="text-sm font-bold text-amber-600">Chưa bắt đầu</span>
                  </div>
                </>
              )}
              {periodStatus.status === 'expired' && (
                <>
                  <AlertCircle className="text-red-600" size={20} />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Trạng thái</span>
                    <span className="text-sm font-bold text-red-600">Đã kết thúc</span>
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="hidden lg:block flex-1 w-[200px] mx-4">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${totalScore}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 w-full shrink pr-1">
          {periodStatus && periodStatus.status !== 'active' && periodStatus.status !== 'unknown' && (
            <div className={cn(
              "hidden md:block text-xs font-semibold px-3 py-1.5 rounded-full text-center",
              periodStatus.status === 'not-started' 
                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            )}>
              {periodStatus.message}
            </div>
          )}
          <button 
            onClick={async () => {
              try {
                await onSave('submitted');
              } catch {
                // Error is already handled.
              }
            }}
            disabled={saving || (periodStatus?.status !== 'active' && periodStatus?.status !== 'unknown' && scoreStatus !== 'rejected')}
            title={periodStatus?.status !== 'active' && periodStatus?.status !== 'unknown' && scoreStatus !== 'rejected' ? periodStatus?.message : scoreStatus === 'rejected' ? 'Nộp lại phiếu điểm' : ''}
            className="flex-1 md:flex-none flex items-center justify-center gap-1 px-2.5 mx-0.5 py-1.5 md:px-10 md:py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] md:text-base font-bold rounded-md md:rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none group truncate"
          >
            {saving ? (
              <Loader2 className="animate-spin shrink-0" size={14} />
            ) : (
              <Send size={14} className="shrink-0 md:w-[18px] md:h-[18px]" />
            )}
            <span className="truncate">Nộp điểm</span>
          </button>
        </div>
      </div>
    </div>
  );
});

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
