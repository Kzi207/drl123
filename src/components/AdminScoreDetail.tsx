import React from 'react';
import { ChevronRight, CheckCircle, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Student, DRLScore, DRLDetails } from '../types';
import { calculateDRLScore, parseDRLDetails } from '../lib/utils';
import { EVALUATION_DATA } from '../constants';
import { AdminEvaluationSection } from './AdminEvaluationSection';

interface AdminScoreDetailProps {
  student: Student;
  score: DRLScore;
  onBack: () => void;
  expandedSections: string[];
  onToggleSection: (id: string) => void;
  onApproveAll: (mode: 'all' | 'remaining') => void;
  onApproveItem: (critId: string, approve: boolean) => void;
  onClassScoreChange: (critId: string, value: number, max: number) => void;
  onSave: () => void;
  onExportExcel: () => void;
  onImageClick: (urls: string[], index: number) => void;
}

export const AdminScoreDetail: React.FC<AdminScoreDetailProps> = React.memo(({
  student,
  score,
  onBack,
  expandedSections,
  onToggleSection,
  onApproveAll,
  onApproveItem,
  onClassScoreChange,
  onSave,
  onExportExcel,
  onImageClick
}) => {
  const details = React.useMemo(() => parseDRLDetails(score.details), [score.details]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
        >
          <ChevronRight size={20} className="rotate-180" /> Quay lại danh sách
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => onApproveAll('all')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-xs shadow-md shadow-blue-100"
          >
            <CheckCircle size={14} /> Duyệt tất cả
          </button>
          <button 
            onClick={() => onApproveAll('remaining')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-all text-xs shadow-md shadow-amber-100"
          >
            <AlertCircle size={14} /> Duyệt mục còn lại
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {student ? `${student.lastName} ${student.firstName}` : score.studentId}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              MSSV: <span className="text-blue-600 font-bold">{score.studentId}</span> | 
              Lớp: <span className="text-slate-700 font-bold">{student?.classId}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {EVALUATION_DATA.map(section => {
            const sectionScoreSelf = section.criteria.reduce((sum, crit) => sum + (details[crit.id]?.self || 0), 0);
            const sectionScoreClass = section.criteria.reduce((sum, crit) => sum + (details[crit.id]?.class || 0), 0);

            return (
              <AdminEvaluationSection 
                key={section.id}
                section={section}
                details={details}
                isExpanded={expandedSections.includes(section.id)}
                onToggle={onToggleSection}
                sectionScoreSelf={sectionScoreSelf}
                sectionScoreClass={sectionScoreClass}
                onApproveItem={onApproveItem}
                onClassScoreChange={onClassScoreChange}
                onImageClick={onImageClick}
              />
            );
          })}
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-lg flex items-center justify-between sticky bottom-4 z-10">
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tự chấm</p>
              <p className="text-xl font-black text-slate-700">
                {calculateDRLScore(details, EVALUATION_DATA, 'self')}đ
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lớp chấm</p>
              <p className="text-xl font-black text-blue-600">
                {calculateDRLScore(details, EVALUATION_DATA, 'class')}đ
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onSave}
              className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-100 text-sm"
            >
              <CheckCircle size={18} /> Lưu kết quả duyệt
            </button>
            <button 
              onClick={onExportExcel}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-all shadow-lg shadow-green-100 text-sm"
            >
              <FileSpreadsheet size={18} /> Xuất Excel
            </button>
            <button 
              onClick={onBack}
              className="px-8 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl transition-all shadow-lg shadow-slate-100 text-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

AdminScoreDetail.displayName = 'AdminScoreDetail';
