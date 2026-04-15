import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Section, DRLDetails } from '../types';
import { AdminEvaluationCriteria } from './AdminEvaluationCriteria';

interface AdminEvaluationSectionProps {
  section: Section;
  details: DRLDetails;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  sectionScoreSelf: number;
  sectionScoreClass: number;
  onApproveItem: (critId: string, approve: boolean) => void;
  onClassScoreChange: (critId: string, value: number, max: number) => void;
  onImageClick: (urls: string[], index: number) => void;
}

export const AdminEvaluationSection: React.FC<AdminEvaluationSectionProps> = React.memo(({
  section,
  details,
  isExpanded,
  onToggle,
  sectionScoreSelf,
  sectionScoreClass,
  onApproveItem,
  onClassScoreChange,
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
          <h3 className="font-bold text-slate-800 text-[13px] md:text-lg leading-tight md:max-w-md">{section.title}</h3>
        </div>
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <div className="flex gap-3 md:gap-6">
            <div className="flex flex-col items-center md:items-end">
              <span className="text-[8px] md:text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Tự chấm</span>
              <span className="text-[11px] md:text-sm font-black text-slate-600 px-1 py-0.5">{Math.min(sectionScoreSelf, section.maxPoints)}</span>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <span className="text-[8px] md:text-[9px] text-blue-400 uppercase font-black tracking-widest mb-0.5">Lớp chấm</span>
              <span className="text-[11px] md:text-sm font-black text-blue-600 px-1 py-0.5">{Math.min(sectionScoreClass, section.maxPoints)}</span>
            </div>
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
                <AdminEvaluationCriteria 
                  key={crit.id}
                  crit={crit}
                  details={details}
                  onApproveItem={onApproveItem}
                  onClassScoreChange={onClassScoreChange}
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

AdminEvaluationSection.displayName = 'AdminEvaluationSection';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
