import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminRejectionDialogProps {
  isOpen: boolean;
  studentName: string;
  onReject: (feedback: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Dialog cho phép admin từ chối phiếu điểm với lý do và yêu cầu chỉnh sửa
 */
export const AdminRejectionDialog: React.FC<AdminRejectionDialogProps> = ({
  isOpen,
  studentName,
  onReject,
  onCancel,
  isLoading = false
}) => {
  const [feedback, setFeedback] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleFeedbackChange = (text: string) => {
    setFeedback(text);
    setCharCount(text.length);
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    await onReject(feedback);
    setFeedback('');
    setCharCount(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-rose-100">
          <h2 className="text-xl font-bold text-rose-600">Từ chối phiếu điểm</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-rose-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-2">Học sinh:</p>
            <p className="font-semibold text-slate-900">{studentName}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Lý do từ chối <span className="text-orange-500">*</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => handleFeedbackChange(e.target.value)}
              placeholder="Nhập lý do và chi tiết vấn đề cần chỉnh sửa..."
              disabled={isLoading}
              className="w-full h-32 p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 resize-none disabled:opacity-50 disabled:bg-slate-50"
            />
            <p className="text-xs text-slate-500 mt-2">
              {charCount} ký tự (tối thiểu 10)
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Lưu ý:</strong> Sinh viên sẽ nhận được thông báo và có thể chỉnh sửa + nộp lại phiếu.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !feedback.trim() || feedback.trim().length < 10}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {isLoading ? 'Đang gửi...' : 'Từ chối'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
