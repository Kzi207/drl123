import React from 'react';
import { ChevronRight, CheckCircle, FileSpreadsheet, AlertCircle, XCircle } from 'lucide-react';
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
  onReject?: (feedback: string) => Promise<void>;
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
  onReject,
  onExportExcel,
  onImageClick
}) => {
  const details = React.useMemo(() => parseDRLDetails(score.details), [score.details]);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
  const [isRejectLoading, setIsRejectLoading] = React.useState(false);
  const [lastSaveTime, setLastSaveTime] = React.useState<number>(0);

  const handleSaveWithDebounce = () => {
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTime;
    const debounceDelay = 10000; // 10 seconds

    if (timeSinceLastSave < debounceDelay) {
      const remainingTime = Math.ceil((debounceDelay - timeSinceLastSave) / 1000);
      alert(`Vui lòng chờ ${remainingTime} giây trước khi lưu lại`);
      return;
    }

    setLastSaveTime(now);
    onSave();
  };

  const handleRejectSubmit = async (feedback: string) => {
    if (!onReject) return;
    setIsRejectLoading(true);
    try {
      await onReject(feedback);
      setIsRejectDialogOpen(false);
    } finally {
      setIsRejectLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-bold transition-colors text-sm md:text-base active:scale-95 px-1 md:px-0"
        >
          <ChevronRight size={18} className="rotate-180 md:w-5 md:h-5" /> 
          <span className="hidden leading-none xs:inline md:hidden">Quay lại</span>
          <span className="hidden leading-none md:inline">Quay lại danh sách</span>
          <span className="leading-none xs:hidden">Về</span>
        </button>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => onApproveAll('all')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-[11px] md:text-xs shadow-sm md:shadow-md shadow-blue-100 whitespace-nowrap active:scale-95"
          >
            <CheckCircle size={14} /> <span className="hidden sm:inline">Duyệt tất cả</span><span className="sm:hidden">Duyệt hết</span>
          </button>
          {onReject && (
            <button 
              onClick={() => setIsRejectDialogOpen(true)}
              className="flex-none flex items-center justify-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all text-[11px] md:text-xs shadow-sm md:shadow-md shadow-rose-100 whitespace-nowrap active:scale-95"
            >
              <XCircle size={14} /> Từ chối
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 pb-24">
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

        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 md:py-3 md:px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] z-50 flex flex-row items-center justify-between gap-1 overflow-x-auto">
          <div className="flex items-center gap-2 md:gap-4 shrink-0 px-1">
            <div className="flex flex-col justify-center">
              <span className="text-[7.5px] md:text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5 md:mb-1">Tự chấm</span>
              <span className="text-base md:text-xl font-black text-slate-700 leading-none">
                {calculateDRLScore(details, EVALUATION_DATA, 'self')}đ
              </span>
            </div>
            <div className="h-5 md:h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col justify-center">
              <span className="text-[7.5px] md:text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5 md:mb-1">Lớp chấm</span>
              <span className="text-base md:text-xl font-black text-blue-600 leading-none">
                {calculateDRLScore(details, EVALUATION_DATA, 'class')}đ
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto pr-1">
            <button 
              onClick={handleSaveWithDebounce}
              className="flex items-center justify-center gap-1 px-3 py-1.5 md:px-6 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] md:text-sm rounded-md md:rounded-xl transition-all whitespace-nowrap active:scale-95 shadow-sm"
              title="Lưu kết quả duyệt"
            >
              <CheckCircle size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Lưu kết quả duyệt</span><span className="sm:hidden">Lưu</span>
            </button>
            <button 
              onClick={onExportExcel}
              className="flex items-center justify-center gap-1 px-3 py-1.5 md:px-6 md:py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] md:text-sm rounded-md md:rounded-xl transition-all whitespace-nowrap active:scale-95 shadow-sm"
            >
              <FileSpreadsheet size={14} className="md:w-4 md:h-4" /> Xuất Excel
            </button>
            <button 
              onClick={onBack}
              className="flex items-center justify-center px-4 py-1.5 md:px-6 md:py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] md:text-sm rounded-md md:rounded-xl transition-all whitespace-nowrap active:scale-95 shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {isRejectDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="flex items-center justify-between p-6 border-b border-rose-100">
              <h2 className="text-xl font-bold text-rose-600">Từ chối phiếu điểm</h2>
              <button
                onClick={() => setIsRejectDialogOpen(false)}
                disabled={isRejectLoading}
                className="p-2 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">Học sinh:</p>
                <p className="font-semibold text-slate-900">
                  {student?.lastName} {student?.firstName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Lý do từ chối <span className="text-orange-500">*</span>
                </label>
                <textarea
                  id="reject-feedback"
                  placeholder="Nhập lý do và chi tiết vấn đề cần chỉnh sửa..."
                  disabled={isRejectLoading}
                  defaultValue=""
                  className="w-full h-32 p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 resize-none disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Lưu ý:</strong> Sinh viên sẽ nhận được thông báo và có thể chỉnh sửa + nộp lại phiếu.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setIsRejectDialogOpen(false)}
                disabled={isRejectLoading}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const feedback = (document.getElementById('reject-feedback') as HTMLTextAreaElement)?.value || '';
                  if (feedback.trim().length < 10) {
                    alert('Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự)');
                    return;
                  }
                  handleRejectSubmit(feedback);
                }}
                disabled={isRejectLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejectLoading ? '...' : 'Từ chối'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
});

AdminScoreDetail.displayName = 'AdminScoreDetail';
