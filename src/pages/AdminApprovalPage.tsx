import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { drlService, studentService } from '../services/api';
import { EVALUATION_DATA } from '../constants';
import { DRLDetails, DRLScore, Student } from '../types';
import { parseDRLDetails, calculateDRLScore, formatImageUrl } from '../lib/utils';
import { Check, X, ChevronRight, Search, Filter, CheckCircle, AlertCircle, Eye, ChevronDown, ChevronUp, FileSpreadsheet, Printer, FolderArchive, Loader2, RefreshCw, RotateCcw, Trash2 as TrashIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { PrintableScorecard } from '../components/PrintableScorecard';
import ImageLightbox from '../components/ImageLightbox';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function AdminApprovalPage() {
  const [scores, setScores] = useState<DRLScore[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('HK2-2023-2024');
  const [selectedScore, setSelectedScore] = useState<DRLScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [expandedSections, setExpandedSections] = useState(['sec-1']);
  const printRef = useRef<HTMLDivElement>(null);
  const singlePrintRef = useRef<HTMLDivElement>(null);
  const [printingStudent, setPrintingStudent] = useState<{student: Student, score?: DRLScore} | null>(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
  }>({
    isOpen: false,
    images: [],
    index: 0
  });

  const [exportingAllPDF, setExportingAllPDF] = useState(false);

  const exportAllPDFs = async () => {
    if (filteredItems.length === 0) return;
    setExportingAllPDF(true);
    
    // Wait for the printable component to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const element = printRef.current;
    if (!element) {
      setExportingAllPDF(false);
      return;
    }

    const opt = {
      margin: 10,
      filename: `DanhSachPhieuDiem_${filterClass === 'all' ? 'TatCa' : filterClass}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc: Document) => {
          // Ensure the cloned element is visible for capture
          const el = clonedDoc.getElementById('printable-all-container');
          if (el) {
            el.style.opacity = '1';
            el.style.position = 'static';
            el.style.left = '0';
          }

          Array.from(clonedDoc.styleSheets).forEach((sheet) => {
            try {
              const rules = Array.from(sheet.cssRules);
              for (let i = rules.length - 1; i >= 0; i--) {
                if (rules[i].cssText.includes('oklch')) {
                  sheet.deleteRule(i);
                }
              }
            } catch (e) {}
          });
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      toast.success('Đã tải xuống danh sách phiếu điểm');
    } catch (err) {
      console.error('All PDF export failed', err);
      toast.error('Không thể xuất danh sách PDF');
    } finally {
      setExportingAllPDF(false);
    }
  };

  const [exportingPDF, setExportingPDF] = useState<string | null>(null);

  const exportSinglePDF = async (student: Student, score?: DRLScore) => {
    if (!student) return;
    setExportingPDF(student.id);
    
    // Wait for the printable component to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const element = singlePrintRef.current;
    if (!element) {
      setExportingPDF(null);
      return;
    }

    const opt = {
      margin: 10,
      filename: `PhieuDiemRL_${student.id}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc: Document) => {
          // Ensure the cloned element is visible for capture
          const el = clonedDoc.getElementById('printable-single-container');
          if (el) {
            el.style.opacity = '1';
            el.style.position = 'static';
            el.style.left = '0';
          }

          Array.from(clonedDoc.styleSheets).forEach((sheet) => {
            try {
              const rules = Array.from(sheet.cssRules);
              for (let i = rules.length - 1; i >= 0; i--) {
                if (rules[i].cssText.includes('oklch')) {
                  sheet.deleteRule(i);
                }
              }
            } catch (e) {}
          });
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      toast.success('Đã tải xuống file PDF');
    } catch (err) {
      console.error('PDF export failed', err);
      toast.error('Không thể xuất file PDF');
    } finally {
      setExportingPDF(null);
      setPrintingStudent(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterClass('all');
  };

  const resetClassScores = async () => {
    const itemsToReset = filteredItems.filter(item => item.score && item.status !== 'not_submitted');
    if (itemsToReset.length === 0) {
      toast.error('Không có phiếu điểm nào để reset trong danh sách hiện tại');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn RESET điểm lớp chấm của ${itemsToReset.length} sinh viên trong danh sách này? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    setRefreshing(true);
    try {
      for (const item of itemsToReset) {
        if (!item.score) continue;
        const details: DRLDetails = parseDRLDetails(item.score.details);
        // Reset class scores to 0
        Object.keys(details).forEach(id => {
          if (details[id] && typeof details[id] === 'object') {
            details[id].class = 0;
          }
        });

        const updatedScore: DRLScore = {
          id: item.score.id || '',
          ...item.score,
          classScore: 0,
          status: 'submitted', // Back to submitted status
          details: JSON.stringify(details),
          updatedAt: item.score.updatedAt || null
        };
        await drlService.saveScore(updatedScore);
      }
      await loadData();
      toast.success('Đã reset điểm lớp chấm thành công');
    } catch (err) {
      console.error('Failed to reset scores', err);
      toast.error('Có lỗi xảy ra khi reset điểm');
    } finally {
      setRefreshing(false);
    }
  };

  const exportZip = async () => {
    if (filteredItems.length === 0) return;
    setExportingZip(true);
    setZipProgress({ current: 0, total: filteredItems.length });
    
    const zip = new JSZip();
    const itemsToExport = filteredItems;

    for (let i = 0; i < itemsToExport.length; i++) {
      const item = itemsToExport[i];
      setZipProgress({ current: i + 1, total: itemsToExport.length });
      
      const folderName = `${item.student.lastName} ${item.student.firstName} - ${item.student.id}`;
      const studentFolder = zip.folder(folderName);
      if (!studentFolder) continue;

      // 1. Generate PDF
      const element = document.getElementById(`printable-card-${item.student.id}`);
      if (element) {
        const opt = {
          margin: 0,
          filename: `PhieuDiem_${item.student.id}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            onclone: (clonedDoc: Document) => {
              // Strip oklch from all stylesheets in the cloned document
              // This prevents html2canvas from crashing on unsupported color functions
              Array.from(clonedDoc.styleSheets).forEach((sheet) => {
                try {
                  const rules = Array.from(sheet.cssRules);
                  for (let i = rules.length - 1; i >= 0; i--) {
                    if (rules[i].cssText.includes('oklch')) {
                      sheet.deleteRule(i);
                    }
                  }
                } catch (e) {
                  // Ignore cross-origin stylesheet errors
                }
              });
            }
          },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };
        
        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
        studentFolder.file(`PhieuDiem_${item.student.id}.pdf`, pdfBlob);
      }

      // 2. Add Proofs
      const proofFolder = studentFolder.folder('minh chứng');
      if (proofFolder && item.score) {
        const details = parseDRLDetails(item.score.details) as DRLDetails;
        const allProofs = Object.values(details).flatMap(d => d.proofs);
        
        for (let pIdx = 0; pIdx < allProofs.length; pIdx++) {
          const proofUrl = allProofs[pIdx];
          try {
            const response = await fetch(formatImageUrl(proofUrl));
            const blob = await response.blob();
            const ext = proofUrl?.split('.').pop() || 'jpg';
            proofFolder.file(`minh_chung_${pIdx + 1}.${ext}`, blob);
          } catch (err) {
            console.error(`Failed to fetch proof: ${proofUrl}`, err);
          }
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `HoSo_DRL_${filterClass === 'all' ? 'TatCa' : filterClass}.zip`);
    setExportingZip(false);
  };

  useEffect(() => {
    if (printingStudent) {
      exportSinglePDF(printingStudent.student, printingStudent.score);
    }
  }, [printingStudent]);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  useEffect(() => {
    const fetchProofsForSelected = async () => {
      if (selectedScore) {
        try {
          const proofsRes = await drlService.getProofs(selectedScore.studentId);
          if (proofsRes.success && proofsRes.proofs) {
            const currentDetails = parseDRLDetails(selectedScore.details);
            let hasChanges = false;

            Object.entries(proofsRes.proofs).forEach(([critId, urls]) => {
              if (!currentDetails[critId] || typeof currentDetails[critId] !== 'object') {
                currentDetails[critId] = { self: 0, class: 0, proofs: [] };
              }
              
              const existingProofs = currentDetails[critId].proofs || [];
              
              // Only merge if the current details have no proofs for this criteria
              // This is safer to avoid re-adding deleted proofs
              if (existingProofs.length === 0 && urls.length > 0) {
                currentDetails[critId].proofs = [...urls];
                hasChanges = true;
              } else {
                // If there are existing proofs, we only add if they are not already there
                // BUT we should probably trust the score record more.
                // For now, let's just log if there's a mismatch
                const missingInScore = urls.filter(u => !existingProofs.includes(u));
                if (missingInScore.length > 0) {
                  console.log(`Proofs in getProofs but not in score record for ${critId}:`, missingInScore);
                }
              }
            });

            if (hasChanges) {
              setSelectedScore({
                ...selectedScore,
                details: JSON.stringify(currentDetails)
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch proofs for selected score', err);
        }
      }
    };

    fetchProofsForSelected();
  }, [selectedScore?.studentId]);

  const classes = Array.from(new Set((Object.values(students) as Student[]).map(s => s.classId))).sort();

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getScoreForStudent = (student: Student, score?: DRLScore): DRLScore => {
    if (score) return score;
    
    const dummyDetails: DRLDetails = {};
    EVALUATION_DATA.forEach(sec => {
      sec.criteria.forEach(crit => {
        dummyDetails[crit.id] = { self: 0, class: 0, proofs: [] };
      });
    });
    
    return {
      id: 'unsubmitted',
      studentId: student.id,
      semester: selectedPeriod,
      selfScore: 0,
      classScore: 0,
      bchScore: 0,
      finalScore: 0,
      details: JSON.stringify(dummyDetails),
      status: 'draft',
      updatedAt: null
    };
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [scoresRes, studentsRes, periodsRes] = await Promise.all([
        drlService.getScores(),
        studentService.getAll(),
        drlService.getPeriods()
      ]);
      
      setPeriods(periodsRes);
      if (periodsRes.length > 0 && !periodsRes.find(p => p.name === selectedPeriod)) {
        if (selectedPeriod === 'HK2-2023-2024' && periodsRes[0].name !== 'HK2-2023-2024') {
          setSelectedPeriod(periodsRes[0].name);
          return;
        }
      }

      setScores(scoresRes);
      const studentMap: Record<string, Student> = {};
      studentsRes.forEach(s => studentMap[s.id] = s);
      setStudents(studentMap);
    } catch (err) {
      console.error('Failed to load approval data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredItems = (Object.values(students) as Student[]).map(student => {
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

  const handleApproveItem = (critId: string, approve: boolean) => {
    if (!selectedScore) return;
    const details: DRLDetails = parseDRLDetails(selectedScore.details);
    
    // Ensure the criterion object exists
    if (!details[critId] || typeof details[critId] !== 'object') {
      details[critId] = { self: 0, class: 0, proofs: [] };
    }
    
    details[critId].class = approve ? (Number(details[critId].self) || 0) : 0;
    
    const classTotal = calculateDRLScore(details, EVALUATION_DATA, 'class');

    setSelectedScore({
      ...selectedScore,
      details: JSON.stringify(details),
      classScore: classTotal
    });
  };

  const handleClassScoreChange = (critId: string, value: number, max: number) => {
    if (!selectedScore) return;
    const val = Math.min(Math.max(0, value), max);
    const details: DRLDetails = parseDRLDetails(selectedScore.details);
    
    if (!details[critId] || typeof details[critId] !== 'object') {
      details[critId] = { self: 0, class: 0, proofs: [] };
    }
    
    details[critId].class = val;
    
    const classTotal = calculateDRLScore(details, EVALUATION_DATA, 'class');

    setSelectedScore({
      ...selectedScore,
      details: JSON.stringify(details),
      classScore: classTotal
    });
  };

  const handleApproveAll = (mode: 'all' | 'remaining') => {
    if (!selectedScore) return;

    const details: DRLDetails = parseDRLDetails(selectedScore.details);
    
    EVALUATION_DATA.forEach(section => {
      section.criteria.forEach(crit => {
        const id = crit.id;
        // Ensure the criterion object exists
        if (!details[id] || typeof details[id] !== 'object') {
          details[id] = { self: 0, class: 0, proofs: [] };
        }
        
        if (mode === 'all') {
          details[id].class = Number(details[id].self) || 0;
        } else if (mode === 'remaining') {
          // "Duyệt mục còn lại thì trừ mục nào đã tích x"
          // "Tích x" is defined as class === 0 and self !== 0
          const isRejected = Number(details[id].class) === 0 && (Number(details[id].self) || 0) !== 0;
          if (!isRejected) {
            details[id].class = Number(details[id].self) || 0;
          }
        }
      });
    });

    const classTotal = calculateDRLScore(details, EVALUATION_DATA, 'class');

    setSelectedScore({
      ...selectedScore,
      details: JSON.stringify(details),
      classScore: classTotal
    });

    toast.success(mode === 'all' ? 'Đã duyệt tất cả các mục' : 'Đã duyệt các mục còn lại');
  };

  const saveApproval = async () => {
    if (!selectedScore) return;
    try {
      const details: DRLDetails = parseDRLDetails(selectedScore.details);
      const classTotal = calculateDRLScore(details, EVALUATION_DATA, 'class');
      
      const updatedScore: DRLScore = {
        ...selectedScore,
        id: selectedScore.id === 'unsubmitted' ? '' : (selectedScore.id || ''),
        classScore: classTotal,
        status: 'finalized',
        updatedAt: selectedScore.updatedAt || null
      };
      const saved = await drlService.saveScore(updatedScore);
      setScores(prev => {
        const exists = prev.find(s => s.studentId === selectedScore.studentId && s.semester === selectedPeriod);
        if (exists) {
          return prev.map(s => s.studentId === selectedScore.studentId && s.semester === selectedPeriod ? saved : s);
        }
        return [...prev, saved];
      });
      setSelectedScore(null);
      toast.success('Đã lưu kết quả duyệt và hoàn tất phiếu!');
    } catch (err) {
      toast.error('Duyệt thất bại');
    }
  };

  const exportExcel = () => {
    const data = filteredItems.map(item => ({
      'Họ và tên': `${item.student.lastName} ${item.student.firstName}`,
      'MSSV': item.student.id,
      'Ngày sinh': item.student.dob || '',
      'Lớp': item.student.classId,
      'Điểm tự chấm': item.score ? item.score.selfScore : 0,
      'Điểm lớp chấm': item.score ? item.score.classScore : 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DiemRenLuyen');
    
    // Set column widths
    const wscols = [
      { wch: 25 }, // Họ và tên
      { wch: 15 }, // MSSV
      { wch: 15 }, // Ngày sinh
      { wch: 15 }, // Lớp
      { wch: 15 }, // Điểm tự chấm
      { wch: 15 }  // Điểm lớp chấm
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `DiemRenLuyen_${filterClass === 'all' ? 'TatCa' : filterClass}.xlsx`);
  };

  const exportDetailedExcel = (student: Student, score: DRLScore) => {
    const details = parseDRLDetails(score.details);
    const excelData: any[] = [];
    
    // Add student info
    excelData.push({ 'Tên mục': 'Họ và tên:', 'Tự chấm': `${student.lastName} ${student.firstName}`, 'Lớp chấm': '' });
    excelData.push({ 'Tên mục': 'MSSV:', 'Tự chấm': student.id, 'Lớp chấm': '' });
    excelData.push({ 'Tên mục': 'Lớp:', 'Tự chấm': student.classId || '', 'Lớp chấm': '' });
    excelData.push({}); // Empty row

    // Add header row
    excelData.push({
      'Tên mục': 'Nội dung đánh giá',
      'Tự chấm': 'Tự chấm',
      'Lớp chấm': 'Lớp chấm'
    });

    EVALUATION_DATA.forEach(section => {
      // Add section row
      excelData.push({
        'Tên mục': section.title.toUpperCase(),
        'Tự chấm': '',
        'Lớp chấm': ''
      });

      section.criteria.forEach(crit => {
        excelData.push({
          'Tên mục': crit.content,
          'Tự chấm': details[crit.id]?.self || 0,
          'Lớp chấm': details[crit.id]?.class || 0
        });
      });
      
      // Add section total
      const sectionScoreSelf = section.criteria.reduce((sum, crit) => sum + (details[crit.id]?.self || 0), 0);
      const sectionScoreClass = section.criteria.reduce((sum, crit) => sum + (details[crit.id]?.class || 0), 0);

      excelData.push({
        'Tên mục': `Cộng mục ${section.id.split('-')[1]}`,
        'Tự chấm': Math.min(sectionScoreSelf, section.maxPoints),
        'Lớp chấm': Math.min(sectionScoreClass, section.maxPoints)
      });
      
      // Add empty row for spacing
      excelData.push({});
    });

    // Add total score
    excelData.push({
      'Tên mục': 'TỔNG ĐIỂM RÈN LUYỆN',
      'Tự chấm': calculateDRLScore(details, EVALUATION_DATA, 'self'),
      'Lớp chấm': calculateDRLScore(details, EVALUATION_DATA, 'class')
    });

    const ws = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PhieuDiemChiTiet");
    
    // Set column widths
    ws['!cols'] = [
      { wch: 80 }, // Content
      { wch: 15 }, // Self
      { wch: 15 }  // Class
    ];

    XLSX.writeFile(wb, `PhieuDiemChiTiet_${student.id}.xlsx`);
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-full mx-auto p-4 md:p-8 px-4 md:px-12">
      <AnimatePresence mode="wait">
        {!selectedScore ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900">Xem phiếu điểm</h1>
                <button 
                  onClick={loadData}
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Đợt chấm:</p>
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-blue-600"
                  >
                    {periods.length > 0 ? (
                      periods.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
                    ) : (
                      <option value="HK2-2023-2024">HK2-2023-2024</option>
                    )}
                  </select>
                </div>
                <select 
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
                >
                  <option value="all">Tất cả lớp</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                
                <div className="flex gap-2">
                  <button 
                    onClick={resetFilters}
                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
                    title="Reset bộ lọc"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

                <button 
                  onClick={exportExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-md shadow-green-100"
                >
                  <FileSpreadsheet size={18} />
                  Xuất Excel
                </button>
                <button 
                  onClick={exportAllPDFs}
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
                  onClick={exportZip}
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
                                  onClick={() => setPrintingStudent({ student, score: getScoreForStudent(student, score) })}
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
                                  onClick={() => setSelectedScore(getScoreForStudent(student, score))}
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
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSelectedScore(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
              >
                <ChevronRight size={20} className="rotate-180" /> Quay lại danh sách
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleApproveAll('all')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-xs shadow-md shadow-blue-100"
                >
                  <CheckCircle size={14} /> Duyệt tất cả
                </button>
                <button 
                  onClick={() => handleApproveAll('remaining')}
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
                    {students[selectedScore.studentId] ? `${students[selectedScore.studentId].lastName} ${students[selectedScore.studentId].firstName}` : selectedScore.studentId}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">MSSV: <span className="text-blue-600 font-bold">{selectedScore.studentId}</span> | Lớp: <span className="text-slate-700 font-bold">{students[selectedScore.studentId]?.classId}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                {EVALUATION_DATA.map(section => {
                  const details: DRLDetails = parseDRLDetails(selectedScore.details);
                  const sectionScoreSelf = section.criteria.reduce((sum, crit) => sum + (details[crit.id]?.self || 0), 0);
                  const sectionScoreClass = section.criteria.reduce((sum, crit) => sum + (details[crit.id]?.class || 0), 0);

                  return (
                    <div key={section.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <button 
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm">
                            {section.id.split('-')[1]}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base">{section.title}</h3>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex gap-4">
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Tự chấm</p>
                              <p className="text-sm font-black text-slate-600">{Math.min(sectionScoreSelf, section.maxPoints)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-blue-400 uppercase">Lớp chấm</p>
                              <p className="text-sm font-black text-blue-600">{Math.min(sectionScoreClass, section.maxPoints)}</p>
                            </div>
                          </div>
                          {expandedSections.includes(section.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedSections.includes(section.id) && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 space-y-3 divide-y divide-slate-100">
                              {section.criteria.map(crit => (
                                <div key={crit.id} className="pt-3 first:pt-0">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-bold text-slate-900 leading-snug mb-1">{crit.content}</p>
                                      {details[crit.id]?.proofs?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {details[crit.id].proofs.map((url, idx) => (
                                            <button 
                                              key={idx} 
                                              onClick={() => {
                                                const formattedUrls = (details[crit.id]?.proofs || []).map(url => formatImageUrl(url));
                                                setLightbox({
                                                  isOpen: true,
                                                  images: formattedUrls,
                                                  index: idx
                                                });
                                              }}
                                              className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all shadow-sm"
                                            >
                                              <img src={formatImageUrl(url)} alt="proof" className="w-full h-full object-cover" />
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-6 bg-blue-50/30 p-2 px-4 rounded-lg border border-blue-100 w-fit">
                                        <div className="text-center">
                                          <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Tự chấm</p>
                                          <p className="text-lg font-black text-slate-700">{details[crit.id]?.self || 0}</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-[8px] text-blue-400 uppercase font-black tracking-widest mb-0.5">Lớp chấm</p>
                                          <input 
                                            type="number"
                                            value={details[crit.id]?.class || 0}
                                            onChange={(e) => handleClassScoreChange(crit.id, parseInt(e.target.value) || 0, crit.maxPoints)}
                                            className="w-12 px-1 py-0.5 border-b border-blue-200 rounded-none text-center focus:border-blue-500 outline-none text-lg font-black text-blue-600 bg-transparent"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex flex-row gap-2">
                                        <button 
                                          onClick={() => handleApproveItem(crit.id, true)}
                                          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                                            details[crit.id]?.class === details[crit.id]?.self && details[crit.id]?.self !== 0 
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-200 scale-105' 
                                            : 'bg-white text-slate-400 border border-slate-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50'
                                          }`}
                                          title="Duyệt mục này"
                                        >
                                          <Check size={20} strokeWidth={3} />
                                        </button>
                                        <button 
                                          onClick={() => handleApproveItem(crit.id, false)}
                                          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                                            details[crit.id]?.class === 0 && details[crit.id]?.self !== 0 
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
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-lg flex items-center justify-between sticky bottom-4 z-10">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tự chấm</p>
                    <p className="text-xl font-black text-slate-700">
                      {calculateDRLScore(parseDRLDetails(selectedScore.details), EVALUATION_DATA, 'self')}đ
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lớp chấm</p>
                    <p className="text-xl font-black text-blue-600">
                      {calculateDRLScore(parseDRLDetails(selectedScore.details), EVALUATION_DATA, 'class')}đ
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedScore && students[selectedScore.studentId] && (
                    <div className="flex gap-2">
                      <button 
                        onClick={saveApproval}
                        className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-100 text-sm"
                      >
                        <CheckCircle size={18} /> Lưu kết quả duyệt
                      </button>
                      <button 
                        onClick={() => exportDetailedExcel(students[selectedScore.studentId], selectedScore)}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-all shadow-lg shadow-green-100 text-sm"
                      >
                        <FileSpreadsheet size={18} /> Xuất Excel
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedScore(null)}
                    className="px-8 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl transition-all shadow-lg shadow-slate-100 text-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 opacity-0 pointer-events-none z-[-1]" style={{ width: '210mm' }}>
        <div ref={printRef} id="printable-all-container">
          {filteredItems.map(item => (
            <div key={item.student.id} id={`printable-card-${item.student.id}`}>
              <PrintableScorecard 
                student={item.student} 
                score={item.score} 
              />
            </div>
          ))}
        </div>
        <div ref={singlePrintRef} id="printable-single-container">
          {printingStudent && (
            <PrintableScorecard 
              student={printingStudent.student} 
              score={printingStudent.score} 
            />
          )}
        </div>
      </div>

      <ImageLightbox 
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        initialIndex={lightbox.index}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
