import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface RejectionNotificationProps {
  feedback: string;
  rejectedAt: string;
  submissionAttempt?: number;
  onResubmit?: () => void;
}

/**
 * Thông báo cho sinh viên khi phiếu điểm bị từ chối
 * Cho phép sinh viên xem lý do và nộp lại phiếu
 */
export const RejectionNotification: React.FC<RejectionNotificationProps> = ({
  feedback,
  rejectedAt,
  submissionAttempt = 1,
  onResubmit
}) => {
  const rejectedDate = new Date(rejectedAt);
  const formattedDate = rejectedDate.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6"
    >
      <div className="flex gap-4">
        <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
        
        <div className="flex-1">
          <h3 className="text-red-900 font-bold text-lg mb-2">
            Phiếu điểm rèn luyện cần chỉnh sửa
          </h3>
          
          <p className="text-red-800 mb-3">
            Phiếu điểm của bạn lần {submissionAttempt} đã bị từ chối. 
            Vui lòng xem lý do bên dưới và chỉnh sửa trước khi nộp lại.
          </p>

          <div className="bg-white rounded p-3 mb-3 border border-red-200">
            <p className="text-sm font-semibold text-red-700 mb-1">Lý do từ chối:</p>
            <p className="text-slate-700 whitespace-pre-wrap">{feedback}</p>
          </div>

          <p className="text-xs text-red-700 mb-4">
            Thời gian từ chối: {formattedDate}
          </p>

          {onResubmit && (
            <button
              onClick={onResubmit}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Chỉnh sửa và nộp lại
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
