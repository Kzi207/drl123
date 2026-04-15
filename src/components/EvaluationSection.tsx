import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Section, DRLDetails } from '../types';
import { EvaluationCriteria } from './EvaluationCriteria';

interface EvaluationSectionProps {
  section: Section;
  details: DRLDetails;
  showClassScore?: boolean;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  sectionScore: number;
  uploadingId: string | null;
  onScoreChange: (critId: string, value: number, max: number) => void;
  onFileUpload: (critId: string, files: FileList | null) => void;
  onRemoveProof: (critId: string, index: number) => void;
  onImageClick: (urls: string[], index: number, critId: string) => void;
}

export const EvaluationSection: React.FC<EvaluationSectionProps> = React.memo(({
  section,
  details,
  showClassScore = true,
  isExpanded,
  onToggle,
  sectionScore,
  uploadingId,
  onScoreChange,
  onFileUpload,
  onRemoveProof,
  onImageClick
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
      <button 
        onClick={() => onToggle(section.id)}
        className={cn(
          "w-full flex items-center justify-between p-3 md:p-4 transition-colors text-left gap-2 md:gap-4",
          isExpanded ? "bg-slate-50/80 border-b border-slate-100" : "bg-white hover:bg-slate-50"
        )}
      >
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          <div className={cn(
            "w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm shadow-sm transition-all",
            isExpanded ? "bg-blue-600 text-white scale-110" : "bg-slate-100 text-slate-500"
          )}>
            {section.id.split('-')[1]}
          </div>
          <h2 className="font-bold text-slate-800 text-[13px] md:text-lg leading-tight md:max-w-md">{section.title}</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <div className="flex flex-col items-center md:items-end">
            <span className="text-[8px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Điểm mục</span>
            <span className={cn(
              "text-[10px] md:text-sm font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full whitespace-nowrap",
              sectionScore > 0 ? "text-blue-600 bg-blue-50" : "text-slate-400 bg-slate-50"
            )}>
              {sectionScore} / {section.maxPoints}
            </span>
          </div>
          <div className={cn(
            "p-1 md:p-2 rounded-full transition-all shrink-0",
            isExpanded ? "bg-blue-100 text-blue-600 rotate-180" : "bg-slate-100 text-slate-400"
          )}>
            <ChevronDown size={16} className="md:w-5 md:h-5" />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6 divide-y divide-slate-100 bg-white">
              {section.criteria.map((crit) => (
                <EvaluationCriteria 
                  key={crit.id}
                  crit={crit}
                  details={details}
                  showClassScore={showClassScore}
                  uploadingId={uploadingId}
                  onScoreChange={onScoreChange}
                  onFileUpload={onFileUpload}
                  onRemoveProof={onRemoveProof}
                  onImageClick={onImageClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
