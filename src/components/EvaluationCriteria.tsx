import React from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Criterion, DRLDetails } from '../types';
import { formatImageUrl } from '../lib/utils';

interface EvaluationCriteriaProps {
  crit: Criterion;
  details: DRLDetails;
  uploadingId: string | null;
  onScoreChange: (critId: string, value: number, max: number) => void;
  onFileUpload: (critId: string, files: FileList | null) => void;
  onRemoveProof: (critId: string, index: number) => void;
  onImageClick: (urls: string[], index: number, critId: string) => void;
}

export const EvaluationCriteria: React.FC<EvaluationCriteriaProps> = React.memo(({
  crit,
  details,
  uploadingId,
  onScoreChange,
  onFileUpload,
  onRemoveProof,
  onImageClick
}) => {
  const critData = details[crit.id] || { self: 0, class: 0, proofs: [] };

  return (
    <div className="pt-4 first:pt-0 group">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-1.5">
            <span className="text-blue-600 font-bold text-xs mt-0.5 min-w-[1.5rem]">{crit.id}</span>
            <p className="text-slate-800 font-semibold text-sm leading-snug">{crit.content}</p>
          </div>
          <div className="ml-8">
            <p className="text-[11px] text-slate-500 whitespace-pre-line bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 leading-relaxed italic">
              {crit.guide}
            </p>
          </div>
        </div>
        
        <div className="lg:w-72 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-white p-2 px-3 rounded-xl border border-slate-200 shadow-sm group-hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold mb-1">Tự chấm</span>
                <input 
                  type="number"
                  value={critData.self || 0}
                  onChange={(e) => onScoreChange(crit.id, parseInt(e.target.value) || 0, crit.maxPoints)}
                  className="w-14 px-1 py-1 border-b-2 border-slate-100 rounded-none text-center focus:border-blue-500 outline-none text-base font-bold bg-transparent transition-colors"
                />
              </div>
              <div className="h-8 w-px bg-slate-100"></div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold mb-1">Lớp chấm</span>
                <div className="w-14 py-1 text-center text-slate-400 font-bold text-base">
                  {critData.class || 0}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <label className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white cursor-pointer transition-all text-blue-600 shadow-sm",
                uploadingId === crit.id && "opacity-50 cursor-not-allowed"
              )}>
                <Upload size={14} />
                <span className="text-[10px] font-bold uppercase">
                  {uploadingId === crit.id ? '...' : 'Minh chứng'}
                </span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    onFileUpload(crit.id, e.target.files);
                    // Clear the input value so the same file can be selected again
                    e.target.value = '';
                  }}
                  disabled={uploadingId !== null}
                />
              </label>
            </div>
          </div>

          {critData.proofs?.length > 0 && (
            <div className="flex flex-wrap gap-2 ml-auto lg:ml-0">
              {critData.proofs.map((url, idx) => (
                <div key={idx} className="relative group/img w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:ring-2 hover:ring-blue-400 transition-all">
                  <img 
                    src={formatImageUrl(url)} 
                    alt="proof" 
                    className="w-full h-full object-cover cursor-pointer" 
                    onClick={() => {
                      const formattedUrls = (critData.proofs || []).map(u => formatImageUrl(u));
                      onImageClick(formattedUrls, idx, crit.id);
                    }} 
                  />
                  <button 
                    onClick={() => onRemoveProof(crit.id, idx)} 
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white opacity-0 group-hover/img:opacity-100 transition-opacity rounded-full shadow-md hover:bg-red-600"
                    title="Xóa"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
