import React from 'react';
import { Search, RefreshCw, RotateCcw, FileSpreadsheet, Download, FolderArchive, Loader2, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Student, DRLScore } from '../types';
import { calculateDRLScore, parseDRLDetails } from '../lib/utils';
import { EVALUATION_DATA } from '../constants';

interface AdminScoreListProps {
  students: Record<string, Student>;
  scores: DRLScore[];
  periods: any[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterClass: string;
  onClassChange: (classId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onResetFilters: () => void;
  onExportExcel: () => void;
  onExportAllPDFs: () => void;
  exportingAllPDF: boolean;
  onExportZip: () => void;
  exportingZip: boolean;
  zipProgress: { current: number; total: number };
  onSelectScore: (student: Student, score?: DRLScore) => void;
  onDownloadPDF: (student: Student, score?: DRLScore) => void;
  exportingPDF: string | null;
}

export const AdminScoreList: React.FC<AdminScoreListProps> = React.memo(({
  students,
  scores,
  periods,
  selectedPeriod,
  onPeriodChange,
  searchTerm,
  onSearchChange,
  filterClass,
  onClassChange,
  onRefresh,
  refreshing,
  onResetFilters,
  onExportExcel,
  onExportAllPDFs,
  exportingAllPDF,
  onExportZip,
  exportingZip,
  zipProgress,
  onSelectScore,
  onDownloadPDF,
  exportingPDF
}) => {
  const classes = React.useMemo(() => 
    Array.from(new Set((Object.values(students) as Student[]).map(s => s.classId))).sort()
  , [students]);

  const filteredItems = React.useMemo(() => {
    return (Object.values(students) as Student[]).map(student => {
      const score = scores.find(s => s.studentId === student.id && s.semester === selectedPeriod);
      return {
        student,
        score,
        status: score ? score.status : 'not_submitted'
      };
    }).filter(item => {
      const matchesSearch = item.student.id.includes(searchTerm) || 
                           `${item.student.lastName} ${item.student.firstName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = filterClass === 'all' || item.student.classId === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [students, scores, selectedPeriod, searchTerm, filterClass]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Xem phiếu điểm</h1>
          <button 
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px] md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm MSSV, tên..." 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Đợt chấm:</p>
            <select 
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-blue-600"
            >
              {periods.length > 0 ? (
                periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
              ) : (
                <option value="HK2-2023-2024">HK2-2023-2024</option>
              )}
            </select>
          </div>
          <select 
            value={filterClass}
            onChange={(e) => onClassChange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
          >
            <option value="all">Tất cả lớp</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <div className="flex gap-2">
            <button 
              onClick={onResetFilters}
              className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
              title="Reset bộ lọc"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

          <button 
            onClick={onExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-md shadow-green-100"
          >
            <FileSpreadsheet size={18} />
            Xuất Excel
          </button>
          <button 
            onClick={onExportAllPDFs}
            disabled={exportingAllPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-all shadow-md shadow-slate-200 disabled:opacity-50"
          >
            {exportingAllPDF ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Tải Phiếu (PDF)
          </button>
          <button 
            onClick={onExportZip}
            disabled={exportingZip}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingZip ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Đang nén ({zipProgress.current}/{zipProgress.total})
              </>
            ) : (
              <>
                <FolderArchive size={18} />
                Xuất ZIP (Hồ sơ)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Danh sách sinh viên ({filteredItems.length})</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Sinh viên</th>
                  <th className="px-6 py-4">Lớp</th>
                  <th className="px-6 py-4">Tự chấm</th>
                  <th className="px-6 py-4">Lớp chấm</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const { student, score } = item;
                  const uniqueKey = student.id;
                  return (
                    <tr key={uniqueKey} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{student.lastName} {student.firstName}</p>
                        <p className="text-xs text-blue-600 font-mono">{student.id}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{student.classId}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {score ? `${calculateDRLScore(parseDRLDetails(score.details), EVALUATION_DATA, 'self')}đ` : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-600">
                        {score ? `${calculateDRLScore(parseDRLDetails(score.details), EVALUATION_DATA, 'class')}đ` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => onDownloadPDF(student, score)}
                            disabled={exportingPDF === student.id}
                            className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white rounded-lg transition-all disabled:opacity-50"
                            title="Tải PDF"
                          >
                            {exportingPDF === student.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                          </button>
                          <button 
                            onClick={() => onSelectScore(student, score)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-xs transition-all"
                          >
                            <Eye size={14} /> Xem chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>Không tìm thấy phiếu điểm nào phù hợp</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

AdminScoreList.displayName = 'AdminScoreList';
