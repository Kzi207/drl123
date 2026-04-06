import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { drlService, studentService } from '../services/api';
import { EVALUATION_DATA } from '../constants';
import { DRLDetails, DRLScore, Student } from '../types';
import { parseDRLDetails, calculateDRLScore, formatImageUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { PrintableScorecard, PrintableScorecardRef } from '../components/PrintableScorecard';
import ImageLightbox from '../components/ImageLightbox';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { AdminScoreList } from '../components/AdminScoreList';
import { AdminScoreDetail } from '../components/AdminScoreDetail';

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
  const singlePrintRef = useRef<PrintableScorecardRef>(null);
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

          // Strip oklch from all style tags in the cloned document
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            try {
              const style = styleTags[i];
              if (style.textContent?.includes('oklch')) {
                style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, '#000000');
              }
            } catch (e) {}
          }

          // Also try to clean styleSheets if possible
          try {
            Array.from(clonedDoc.styleSheets).forEach((sheet) => {
              try {
                const rules = Array.from(sheet.cssRules);
                for (let i = rules.length - 1; i >= 0; i--) {
                  if (rules[i].cssText.includes('oklch')) {
                    (sheet as CSSStyleSheet).deleteRule(i);
                  }
                }
              } catch (e) {}
            });
          } catch (e) {}
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
    if (!student || !singlePrintRef.current) return;
    setExportingPDF(student.id);
    
    // Wait for the printable component to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      await singlePrintRef.current.downloadPDF();
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
              // Strip oklch from all style tags in the cloned document
              const styleTags = clonedDoc.getElementsByTagName('style');
              for (let i = 0; i < styleTags.length; i++) {
                try {
                  const style = styleTags[i];
                  if (style.textContent?.includes('oklch')) {
                    style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, '#000000');
                  }
                } catch (e) {}
              }

              // Also try to clean styleSheets if possible
              try {
                Array.from(clonedDoc.styleSheets).forEach((sheet) => {
                  try {
                    const rules = Array.from(sheet.cssRules);
                    for (let i = rules.length - 1; i >= 0; i--) {
                      if (rules[i].cssText.includes('oklch')) {
                        (sheet as CSSStyleSheet).deleteRule(i);
                      }
                    }
                  } catch (e) {}
                });
              } catch (e) {}
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

  const filteredItems = useMemo(() => {
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

  const handleApproveItem = useCallback((critId: string, approve: boolean) => {
    if (!selectedScore) return;
    const details: DRLDetails = parseDRLDetails(selectedScore.details);
    
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
  }, [selectedScore]);

  const handleClassScoreChange = useCallback((critId: string, value: number, max: number) => {
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
  }, [selectedScore]);

  const handleApproveAll = useCallback((mode: 'all' | 'remaining') => {
    if (!selectedScore) return;

    const details: DRLDetails = parseDRLDetails(selectedScore.details);
    
    EVALUATION_DATA.forEach(section => {
      section.criteria.forEach(crit => {
        const id = crit.id;
        if (!details[id] || typeof details[id] !== 'object') {
          details[id] = { self: 0, class: 0, proofs: [] };
        }
        
        if (mode === 'all') {
          details[id].class = Number(details[id].self) || 0;
        } else if (mode === 'remaining') {
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
  }, [selectedScore]);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const handleImageClick = useCallback((urls: string[], index: number) => {
    setLightbox({
      isOpen: true,
      images: urls,
      index: index
    });
  }, []);

  const handleSelectScore = useCallback((student: Student, score?: DRLScore) => {
    setSelectedScore(getScoreForStudent(student, score));
  }, [selectedPeriod]);

  const handleDownloadPDF = useCallback((student: Student, score?: DRLScore) => {
    setPrintingStudent({ student, score: getScoreForStudent(student, score) });
  }, [selectedPeriod]);

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
          <AdminScoreList 
            students={students}
            scores={scores}
            periods={periods}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterClass={filterClass}
            onClassChange={setFilterClass}
            onRefresh={loadData}
            refreshing={refreshing}
            onResetFilters={resetFilters}
            onExportExcel={exportExcel}
            onExportAllPDFs={exportAllPDFs}
            exportingAllPDF={exportingAllPDF}
            onExportZip={exportZip}
            exportingZip={exportingZip}
            zipProgress={zipProgress}
            onSelectScore={handleSelectScore}
            onDownloadPDF={handleDownloadPDF}
            exportingPDF={exportingPDF}
          />
        ) : (
          <AdminScoreDetail 
            student={students[selectedScore.studentId]}
            score={selectedScore}
            onBack={() => setSelectedScore(null)}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onApproveAll={handleApproveAll}
            onApproveItem={handleApproveItem}
            onClassScoreChange={handleClassScoreChange}
            onSave={saveApproval}
            onExportExcel={() => exportDetailedExcel(students[selectedScore.studentId], selectedScore)}
            onImageClick={handleImageClick}
          />
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
        <div id="printable-single-container">
          {printingStudent && (
            <PrintableScorecard 
              ref={singlePrintRef}
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
