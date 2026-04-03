import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { EVALUATION_DATA } from '../constants';
import { DRLDetails, DRLScore } from '../types';
import { drlService } from '../services/api';
import { parseDRLDetails, calculateDRLScore, formatImageUrl } from '../lib/utils';
import { FileText, Save, Send, ChevronDown, ChevronUp, Upload, Trash2, Eye, Download, Loader2, Maximize2, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { PrintableScorecard } from '../components/PrintableScorecard';
import ImageLightbox from '../components/ImageLightbox';

export default function EvaluationPage() {
  const { user } = useAuth();
  const [details, setDetails] = useState<DRLDetails>({});
  const [scoreId, setScoreId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('HK2-2023-2024');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['sec-1']);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isInitialLoad = useRef(true);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
    critId: string;
  }>({
    isOpen: false,
    images: [],
    index: 0,
    critId: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  // Auto-save effect
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      handleSave('draft');
    }, 2000); // Auto save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [details]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scores, proofsRes, periodsRes] = await Promise.all([
        drlService.getScores(),
        drlService.getProofs(user?.mssv || user?.username || ''),
        drlService.getPeriods()
      ]);
      
      setPeriods(periodsRes);
      if (periodsRes.length > 0 && !periodsRes.find(p => p.name === selectedPeriod)) {
        if (selectedPeriod === 'HK2-2023-2024' && periodsRes[0].name !== 'HK2-2023-2024') {
          setSelectedPeriod(periodsRes[0].name);
          return;
        }
      }

      const myScore = scores.find(s => s.studentId === user?.username && s.semester === selectedPeriod);
      let initialDetails: DRLDetails = {};
      
      if (myScore) {
        setScoreId(myScore.id || null);
        initialDetails = parseDRLDetails(myScore.details);
      } else {
        setScoreId(null);
        // Initialize empty details
        EVALUATION_DATA.forEach(sec => {
          sec.criteria.forEach(crit => {
            initialDetails[crit.id] = { self: 0, class: 0, proofs: [] };
          });
        });
      }

      // Merge proofs from getProofs API if available
      if (proofsRes.success && proofsRes.proofs) {
        Object.entries(proofsRes.proofs).forEach(([critId, urls]) => {
          // Ensure the entry exists and is an object before setting proofs
          if (!initialDetails[critId] || typeof initialDetails[critId] !== 'object') {
            initialDetails[critId] = { self: 0, class: 0, proofs: [] };
          }
          
          // If the score record already has proofs for this criteria, we TRUST the score record
          // and only add proofs from getProofs if they are NOT already there AND the score record is empty.
          // This is tricky because we want to show newly uploaded proofs too.
          
          const existingProofs = initialDetails[critId].proofs || [];
          
          // If we have a score record (myScore exists), we ONLY add proofs that are in the score record.
          // The getProofs is useful for when there is NO score record yet.
          if (!myScore) {
            const allProofs = [...new Set([...existingProofs, ...urls])];
            initialDetails[critId].proofs = allProofs;
          } else {
            // If we have a score record, we trust it. 
            // However, if getProofs has something that is NOT in the score record, 
            // it might be a newly uploaded proof that wasn't saved to the score record yet?
            // But handleFileUpload saves the score record immediately.
            // So we should probably just trust the score record if it exists.
            // Let's log if there's a mismatch for debugging.
            const missingInScore = urls.filter(u => !existingProofs.includes(u));
            if (missingInScore.length > 0) {
              console.log(`Proofs in getProofs but not in score record for ${critId}:`, missingInScore);
              // For now, let's NOT merge them if a score record exists, to respect deletions.
            }
          }
        });
      }

      setDetails(initialDetails);
      
      // Mark initial load as complete after a short delay to avoid immediate auto-save
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
    } catch (err) {
      console.error('Failed to load DRL data', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleScoreChange = (critId: string, value: number, max: number) => {
    const val = Math.min(Math.max(0, value), max);
    setDetails(prev => {
      const currentCrit = (prev[critId] && typeof prev[critId] === 'object') 
        ? prev[critId] 
        : { self: 0, class: 0, proofs: [] };
      
      const updatedDetails = {
        ...prev,
        [critId]: { ...currentCrit, self: val }
      };
      
      // Also trigger auto-save via useEffect
      return updatedDetails;
    });
  };

  const handleSave = async (status: DRLScore['status'] = 'draft', customDetails?: DRLDetails) => {
    const detailsToSave = customDetails || details;
    setSaving(true);
    try {
      const score: DRLScore = {
        id: scoreId || '',
        studentId: user?.username || '',
        semester: selectedPeriod,
        selfScore: calculateDRLScore(detailsToSave, EVALUATION_DATA, 'self'),
        classScore: 0,
        bchScore: 0,
        finalScore: 0,
        details: JSON.stringify(detailsToSave),
        status,
        updatedAt: null
      };
      const savedScore = await drlService.saveScore(score);
      if (savedScore && savedScore.id) {
        setScoreId(savedScore.id);
      }
      if (!customDetails) {
        toast.success(status === 'submitted' ? 'Đã gửi phiếu điểm thành công' : 'Đã lưu bản nháp');
      }
    } catch (err) {
      console.error('Save failed', err);
      toast.error('Lưu thất bại. Vui lòng kiểm tra kết nối mạng.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (critId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    if ((details[critId]?.proofs?.length || 0) + files.length > 10) {
      toast.error('Tối đa 10 ảnh minh chứng cho mỗi mục');
      return;
    }

    setUploadingId(critId);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split('.').pop() || 'jpg';
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        
        // Naming convention: mssv_mục nào_số ram dom (ví dụ CNCD2511016_I-1_56526521258)
        const sectionMap: Record<string, string> = { 'sec-1': 'I', 'sec-2': 'II', 'sec-3': 'III', 'sec-4': 'IV', 'sec-5': 'V' };
        const sectionId = EVALUATION_DATA.find(s => s.criteria.some(c => c.id === critId))?.id || '';
        const sectionLabel = sectionMap[sectionId] || 'X';
        const critIndex = critId.split('.')[1];
        const randomNum = Math.floor(Math.random() * 10000000000);
        const fileName = `${user?.username}_${sectionLabel}-${critIndex}_${randomNum}.${extension}`;
        
        const res = await drlService.uploadProof(fileName, base64, user?.username || '', critId, selectedPeriod, sectionLabel, sectionId, user?.mssv);
        if (res.success && (res.url_anh || res.url)) {
          uploadedUrls.push(res.url_anh || res.url);
        }
      }
      
      const currentCrit = (details[critId] && typeof details[critId] === 'object') 
        ? details[critId] 
        : { self: 0, class: 0, proofs: [] };
        
      const updatedDetails = {
        ...details,
        [critId]: { 
          ...currentCrit, 
          proofs: [...(currentCrit.proofs || []), ...uploadedUrls] 
        }
      };
      
      setDetails(updatedDetails);
      
      // Immediate save for proof changes
      await handleSave('draft', updatedDetails);
    } catch (err) {
      toast.error('Upload thất bại');
    } finally {
      setUploadingId(null);
    }
  };

  const removeProof = async (critId: string, index: number) => {
    const proofUrl = details[critId]?.proofs[index];
    if (!proofUrl) return;

    // Extract filename and path from URL
    let fileName = '';
    let fullPath = '';
    try {
      // If it's a proxy URL, extract the path after /api-proxy/
      if (proofUrl.includes('/api-proxy/')) {
        fullPath = proofUrl.split('/api-proxy/')[1].split('?')[0];
        fileName = fullPath.split('/').pop() || '';
      } else if (proofUrl.includes('path=')) {
        const urlParts = proofUrl.split('path=');
        const pathValue = urlParts[1].split('&')[0];
        fullPath = pathValue;
        fileName = pathValue.split('/').pop() || '';
      } else {
        fileName = proofUrl.split('/').pop()?.split('?')[0] || '';
        fullPath = fileName;
      }
      
      // If fullPath is just the filename, try to prepend 'uploads/' if it's a common pattern
      if (!fullPath.includes('/') && fileName) {
        // Many backends store files in an 'uploads' directory
        // We'll send both the filename and a guessed path
      }
    } catch (e) {
      fileName = proofUrl.split('/').pop()?.split('?')[0] || '';
      fullPath = fileName;
    }

    const currentCrit = (details[critId] && typeof details[critId] === 'object') 
      ? details[critId] 
      : { self: 0, class: 0, proofs: [] };
      
    const newProofs = [...currentCrit.proofs];
    newProofs.splice(index, 1);
    
    const updatedDetails = {
      ...details,
      [critId]: { ...currentCrit, proofs: newProofs }
    };
    
    setDetails(updatedDetails);
    
    try {
      // 1. Update the score record first
      await handleSave('draft', updatedDetails);
      
      // 2. Then delete from server
      try {
        const sectionMap: Record<string, string> = { 'sec-1': 'I', 'sec-2': 'II', 'sec-3': 'III', 'sec-4': 'IV', 'sec-5': 'V' };
        const sectionId = EVALUATION_DATA.find(s => s.criteria.some(c => c.id === critId))?.id || '';
        const sectionLabel = sectionMap[sectionId] || 'X';
        
        await drlService.deleteProof(fileName, user?.username || '', critId, selectedPeriod, fullPath, scoreId || '', sectionLabel, sectionId, user?.mssv);
      } catch (deleteErr: any) {
        console.error('Failed to delete proof from server', deleteErr);
        // If save succeeded but delete failed, we don't want to show the generic error
        // that suggests the whole operation failed.
        toast.error(`Lỗi xóa file trên máy chủ: ${deleteErr.message || 'Vui lòng thử lại.'}`);
      }
    } catch (saveErr: any) {
      console.error('Failed to save score record during deletion', saveErr);
      // handleSave already showed a toast for save failure
      // Revert local state to keep it in sync with server
      loadData();
    }
  };

  const printRef = useRef<HTMLDivElement>(null);

  const calculateSectionScore = (sectionId: string) => {
    const section = EVALUATION_DATA.find(s => s.id === sectionId);
    if (!section) return 0;
    return calculateDRLScore(details, [section], 'self');
  };

  const calculateTotalScore = (customDetails?: DRLDetails) => {
    return calculateDRLScore(customDetails || details, EVALUATION_DATA, 'self');
  };

  const exportPDF = async () => {
    const element = document.getElementById('printable-scorecard');
    if (!element) return;
    
    setExporting(true);
    const opt = {
      margin: 10,
      filename: `PhieuDiemRL_${user?.username}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById('printable-scorecard-container');
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
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set(opt).from(element).save();
      toast.success('Đã tải xuống file PDF');
    } catch (err) {
      console.error('Failed to export PDF', err);
      toast.error('Không thể xuất file PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = () => {
    if (!user) return;
    setExporting(true);
    try {
      const excelData: any[] = [];
      
      // Add student info
      excelData.push({ 'Tên mục': 'Họ và tên:', 'Tự chấm': `${user.lastName} ${user.firstName}`, 'Lớp chấm': '' });
      excelData.push({ 'Tên mục': 'MSSV:', 'Tự chấm': user.username, 'Lớp chấm': '' });
      excelData.push({ 'Tên mục': 'Lớp:', 'Tự chấm': user.classId || '', 'Lớp chấm': '' });
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
        excelData.push({
          'Tên mục': `Cộng mục ${section.id.split('-')[1]}`,
          'Tự chấm': calculateSectionScore(section.id),
          'Lớp chấm': calculateDRLScore(details, [section], 'class')
        });
        
        // Add empty row for spacing
        excelData.push({});
      });

      // Add total score
      excelData.push({
        'Tên mục': 'TỔNG ĐIỂM RÈN LUYỆN',
        'Tự chấm': calculateTotalScore(),
        'Lớp chấm': calculateDRLScore(details, EVALUATION_DATA, 'class')
      });

      const ws = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PhieuDiem");
      
      // Set column widths
      ws['!cols'] = [
        { wch: 80 }, // Content
        { wch: 15 }, // Self
        { wch: 15 }  // Class
      ];

      XLSX.writeFile(wb, `PhieuDiemRL_${user.username}.xlsx`);
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Không thể xuất file Excel. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-full mx-auto p-4 md:p-8 pb-24 px-4 md:px-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Phiếu điểm rèn luyện</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Đợt chấm:</p>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-blue-600 shadow-sm transition-all hover:border-blue-300"
            >
              {periods.length > 0 ? (
                periods.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))
              ) : (
                <option value="HK2-2023-2024">Học kỳ 2 - Năm học 2023-2024</option>
              )}
            </select>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {saving && (
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold animate-pulse mr-2">
              <Loader2 className="animate-spin" size={14} />
              Đang lưu...
            </div>
          )}
          <button 
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Eye size={18} />
            Xem phiếu
          </button>
          <button 
            onClick={exportExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
            Xuất Excel
          </button>
          <button 
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Save size={18} />
            Lưu nháp
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {EVALUATION_DATA.map((section) => (
          <div key={section.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button 
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs">
                  {section.id.split('-')[1]}
                </span>
                <h2 className="font-bold text-slate-800 text-sm">{section.title}</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {calculateSectionScore(section.id)} / {section.maxPoints}
                </span>
                {expandedSections.includes(section.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
                    {section.criteria.map((crit) => (
                      <div key={crit.id} className="pt-3 first:pt-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex-1">
                            <p className="text-slate-800 font-bold text-xs mb-1">{crit.content}</p>
                            <p className="text-[10px] text-slate-500 whitespace-pre-line bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">{crit.guide}</p>
                          </div>
                          <div className="flex flex-row items-center gap-4 bg-slate-50/50 p-2 px-3 rounded-lg border border-slate-100 w-fit">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-400 uppercase font-bold">Tự chấm</span>
                                <input 
                                  type="number"
                                  value={details[crit.id]?.self || 0}
                                  onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value) || 0, crit.maxPoints)}
                                  className="w-12 px-1 py-0.5 border-b border-slate-200 rounded-none text-center focus:border-blue-500 outline-none text-sm font-bold bg-transparent"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-400 uppercase font-bold">Lớp chấm</span>
                                <div className="w-12 py-0.5 text-center text-slate-600 font-bold text-sm">
                                  {details[crit.id]?.class || 0}
                                </div>
                              </div>
                            </div>
                            
                            <div className="h-6 w-px bg-slate-200"></div>

                            <div className="flex items-center gap-2">
                              <label className="flex items-center justify-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all text-slate-500 hover:text-blue-600 shadow-sm">
                                <Upload size={12} />
                                <span className="text-[9px] font-bold uppercase">
                                  {uploadingId === crit.id ? '...' : 'Minh chứng'}
                                </span>
                                <input 
                                  type="file" 
                                  multiple 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(crit.id, e.target.files)}
                                  disabled={uploadingId !== null}
                                />
                              </label>
                              
                              {details[crit.id]?.proofs?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {details[crit.id].proofs.map((url, idx) => (
                                    <div key={idx} className="relative group w-8 h-8 rounded overflow-hidden border border-slate-200 shadow-sm">
                                      <img 
                                        src={formatImageUrl(url)} 
                                        alt="proof" 
                                        className="w-full h-full object-cover cursor-pointer" 
                                        onClick={() => {
                                          const formattedUrls = (details[crit.id]?.proofs || []).map(u => formatImageUrl(u));
                                          setLightbox({ 
                                            isOpen: true, 
                                            images: formattedUrls, 
                                            index: idx, 
                                            critId: crit.id 
                                          });
                                        }} 
                                      />
                                      <button 
                                        onClick={() => removeProof(crit.id, idx)} 
                                        className="absolute top-0 right-0 p-0.5 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-bl"
                                        title="Xóa"
                                      >
                                        <Trash2 size={8} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
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
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-50">
        <div className="max-w-full mx-auto flex items-center justify-between px-4 md:px-12">
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Tổng điểm dự kiến</p>
              <p className="text-2xl font-black text-blue-600">{calculateTotalScore()} / 100</p>
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Xếp loại</p>
              <p className="text-lg font-bold text-slate-700">
                {calculateTotalScore() >= 90 ? 'Xuất sắc' : 
                 calculateTotalScore() >= 80 ? 'Giỏi' : 
                 calculateTotalScore() >= 65 ? 'Khá' : 
                 calculateTotalScore() >= 50 ? 'Trung bình' : 'Yếu'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleSave('submitted')}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            <Send size={20} />
            Nộp phiếu điểm
          </button>
        </div>
      </div>
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none z-[-1]" style={{ width: '210mm' }} id="printable-scorecard-container">
        <div id="printable-scorecard">
          {user && (
            <PrintableScorecard 
              student={{
                id: user.username,
                username: user.username,
                firstName: user.name?.split(' ').pop() || '',
                lastName: user.name?.split(' ').slice(0, -1).join(' ') || '',
                classId: user.classId || '',
                department: user.department || '',
                role: 'student'
              }} 
              score={{
                id: 'current',
                studentId: user.username,
                semester: 'II-2023-2024',
                selfScore: calculateTotalScore(),
                classScore: 0,
                bchScore: 0,
                finalScore: 0,
                details: JSON.stringify(details),
                status: 'draft'
              }} 
            />
          )}
        </div>
      </div>

      <ImageLightbox 
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        initialIndex={lightbox.index}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
        onDelete={(idx) => removeProof(lightbox.critId, idx)}
      />

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Xem trước phiếu điểm</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={exportPDF}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm"
                >
                  {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                  Tải PDF
                </button>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <Maximize2 size={20} className="rotate-45" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-slate-100 flex justify-center">
              <div className="bg-white shadow-lg p-8 w-[210mm] min-h-[297mm]">
                {user && (
                  <PrintableScorecard 
                    student={{
                      id: user.username,
                      username: user.username,
                      firstName: user.name?.split(' ').pop() || '',
                      lastName: user.name?.split(' ').slice(0, -1).join(' ') || '',
                      classId: user.classId || '',
                      department: user.department || '',
                      role: 'student'
                    }} 
                    score={{
                      id: 'current',
                      studentId: user.username,
                      semester: selectedPeriod,
                      selfScore: calculateTotalScore(),
                      classScore: 0,
                      bchScore: 0,
                      finalScore: 0,
                      details: JSON.stringify(details),
                      status: 'draft'
                    }} 
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
