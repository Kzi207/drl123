import React from 'react';
import { Check, X } from 'lucide-react';
import { Criterion, DRLDetails } from '../types';
import { formatImageUrl } from '../lib/utils';

interface AdminEvaluationCriteriaProps {
  crit: Criterion;
  details: DRLDetails;
  onApproveItem: (critId: string, approve: boolean) => void;
  onClassScoreChange: (critId: string, value: number, max: number) => void;
  onImageClick: (urls: string[], index: number) => void;
}

export const AdminEvaluationCriteria: React.FC<AdminEvaluationCriteriaProps> = React.memo(({
  crit,
  details,
  onApproveItem,
  onClassScoreChange,
  onImageClick
}) => {
  const critData = details[crit.id] || { self: 0, class: 0, proofs: [] };
  const isApproved = critData.class === critData.self && critData.self !== 0;
  const isRejected = critData.class === 0 && critData.self !== 0;

  return (
    <div className="pt-4 first:pt-0 group">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-1.5">
            <span className="text-blue-600 font-bold text-xs mt-0.5 min-w-[1.5rem]">{crit.id}</span>
            <p className="text-slate-800 font-semibold text-sm leading-snug">{crit.content}</p>
          </div>
          
          {critData.proofs?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 ml-8">
              {critData.proofs.map((url, idx) => (
                <button 
                  key={idx} 
                  onClick={() => {
                    const formattedUrls = (critData.proofs || []).map(u => formatImageUrl(u));
                    onImageClick(formattedUrls, idx);
                  }}
                  className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all shadow-sm"
                >
                  <img src={formatImageUrl(url)} alt="proof" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-80 flex items-center gap-3">
          <div className="flex items-center gap-6 bg-blue-50/30 p-2 px-4 rounded-xl border border-blue-100 w-fit shadow-sm">
            <div className="text-center">
              <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Tự chấm</p>
              <p className="text-lg font-black text-slate-700">{critData.self === 0 ? '' : critData.self}</p>
            </div>
            <div className="h-8 w-px bg-blue-100/50"></div>
            <div className="text-center">
              <p className="text-[8px] text-blue-400 uppercase font-black tracking-widest mb-0.5">Lớp chấm</p>
              <input 
                type="number"
                value={critData.class === 0 ? '' : critData.class}
                onChange={(e) => {
                  const raw = e.target.value;
                  onClassScoreChange(crit.id, raw === '' ? 0 : (parseInt(raw, 10) || 0), crit.maxPoints);
                }}
                className="w-12 px-1 py-0.5 border-b-2 border-blue-200 rounded-none text-center focus:border-blue-500 outline-none text-lg font-black text-blue-600 bg-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex flex-row gap-2">
            <button 
              onClick={() => onApproveItem(crit.id, true)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                isApproved 
                ? 'bg-green-600 text-white shadow-lg shadow-green-200 scale-105' 
                : 'bg-white text-slate-400 border border-slate-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50'
              }`}
              title="Duyệt mục này"
            >
              <Check size={20} strokeWidth={3} />
            </button>
            <button 
              onClick={() => onApproveItem(crit.id, false)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                isRejected 
                ? 'bg-red-600 text-white shadow-lg shadow-red-200 scale-105' 
                : 'bg-white text-slate-400 border border-slate-200 hover:border-red-500 hover:text-red-600 hover:bg-red-50'
              }`}
              title="Không duyệt mục này"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

AdminEvaluationCriteria.displayName = 'AdminEvaluationCriteria';
