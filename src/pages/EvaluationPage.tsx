import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { EVALUATION_DATA } from '../constants';
import { DRLDetails, DRLScore } from '../types';
import { drlService } from '../services/api';
import { parseDRLDetails, calculateDRLScore, formatImageUrl, getRank } from '../lib/utils';
import { FileText, Save, Send, ChevronDown, ChevronUp, Upload, Trash2, Eye, Download, Loader2, Maximize2, RefreshCw, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { PrintableScorecard, PrintableScorecardRef } from '../components/PrintableScorecard';
import ImageLightbox from '../components/ImageLightbox';
import { EvaluationSection } from '../components/EvaluationSection';
import { EvaluationSummary } from '../components/EvaluationSummary';

export default function EvaluationPage() {
  const { user } = useAuth();
  const [details, setDetails] = useState<DRLDetails>({});
  const detailsRef = useRef<DRLDetails>({});
  const [scoreId, setScoreId] = useState<string | null>(null);
  const [scoreStatus, setScoreStatus] = useState<DRLScore['status']>('draft');
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('HK2-2023-2024');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['sec-1']);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isInitialLoad = useRef(true);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const printableRef = useRef<PrintableScorecardRef>(null);
  const lastUploadTime = useRef<number>(0);  // Track last upload time to prevent duplicates

  useEffect(() => {
    detailsRef.current = details;
  }, [details]);

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

  // Auto-save effect (Local only)
  useEffect(() => {
    if (isInitialLoad.current || !user) return;
    
    const draftKey = `drl_draft_${user.username}_${selectedPeriod}`;
    
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(details));
      console.log('Saved draft to localStorage');
    }, 1000); // Auto save after 1 second of inactivity

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [details, user, selectedPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scores, proofsRes, periodsRes] = await Promise.all([
        drlService.getScores(),
        drlService.getProofs(user?.mssv || user?.username || ''),
        drlService.getPeriods()
      ]);
      
      setPeriods(periodsRes);
      // Auto-select first available period if current one doesn't exist
      if (periodsRes.length > 0) {
        // Check if selectedPeriod (as ID) exists in available periods
        const periodExists = periodsRes.find(p => p.id === selectedPeriod);
        if (!periodExists && periodsRes[0]) {
          console.log(`[LoadData] Selected period "${selectedPeriod}" not found. Using first available: "${periodsRes[0].id}"`);
          setSelectedPeriod(periodsRes[0].id);
          return;
        }
      } else {
        console.warn('[LoadData] No grading periods available in database');
      }

      const myScore = scores.find(s => s.studentId === user?.username && s.semester === selectedPeriod);
      let initialDetails: DRLDetails = {};
      
      if (myScore) {
        setScoreId(myScore.id || null);
        setScoreStatus(myScore.status || 'draft');
        initialDetails = parseDRLDetails(myScore.details);
      } else {
        setScoreId(null);
        setScoreStatus('draft');
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

      // Check for local draft (only for unapproved scores)
      const draftKey = `drl_draft_${user?.username}_${selectedPeriod}`;
      const localDraft = localStorage.getItem(draftKey);
      const approvedStatuses: DRLScore['status'][] = ['class_approved', 'bch_approved', 'finalized'];
      const isApproved = myScore ? approvedStatuses.includes(myScore.status) : false;

      if (localDraft && !isApproved) {
        try {
          const parsedDraft = JSON.parse(localDraft);
          // Only suggest restoring if it's different from what we just loaded
          if (JSON.stringify(parsedDraft) !== JSON.stringify(initialDetails)) {
            setDetails(parsedDraft);
            toast.info('Đã khôi phục bản nháp từ trình duyệt của bạn');
          }
        } catch (e) {
          console.error('Failed to parse local draft', e);
        }
      } else if (localDraft && isApproved) {
        // If the score is already approved, discard local draft to avoid overwriting class-approved data.
        localStorage.removeItem(draftKey);
      }
      
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

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const handleScoreChange = useCallback((critId: string, value: number, max: number) => {
    const val = Math.min(Math.max(0, value), max);
    setDetails(prev => {
      const currentCrit = (prev[critId] && typeof prev[critId] === 'object') 
        ? prev[critId] 
        : { self: 0, class: 0, proofs: [] };
      
      const updatedDetails = {
        ...prev,
        [critId]: { ...currentCrit, self: val }
      };
      
      return updatedDetails;
    });
  }, []);

  // Calculate period status
  const getPeriodStatus = () => {
    const activePeriod = periods.find(p => p.id === selectedPeriod);
    if (!activePeriod) return { status: 'unknown', message: 'Không tìm thấy đợt chấm' };
    
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const startDate = activePeriod.startDate ? new Date(activePeriod.startDate).toISOString().split('T')[0] : null;
    const endDate = activePeriod.endDate ? new Date(activePeriod.endDate).toISOString().split('T')[0] : null;
    
    if (startDate && todayDate < startDate) {
      return { 
        status: 'not-started', 
        message: `Đợt chấm "${activePeriod.name}" sẽ bắt đầu từ ngày ${new Date(startDate).toLocaleDateString('vi-VN')}` 
      };
    }
    
    if (endDate && todayDate > endDate) {
      return { 
        status: 'expired', 
        message: `Đợt chấm "${activePeriod.name}" đã kết thúc vào ngày ${new Date(endDate).toLocaleDateString('vi-VN')}` 
      };
    }
    
    return { status: 'active', message: `Đợt chấm "${activePeriod.name}" đang diễn ra` };
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

      setScoreStatus(status);
      
      // Clear local draft on successful server save
      const draftKey = `drl_draft_${user?.username}_${selectedPeriod}`;
      localStorage.removeItem(draftKey);

      setLastSaved(new Date());

      if (!customDetails) {
        toast.success(status === 'submitted' ? 'Đã gửi phiếu điểm thành công' : 'Đã lưu bản nháp');
      }
    } catch (err: any) {
      console.error('Save failed', err);
      
      // Check for period time validation errors from backend
      if (err?.code === 'NOT_STARTED' || err?.message?.includes('Chưa đến thời gian')) {
        toast.error(err?.message || 'Chưa đến thời gian chấm. Vui lòng chờ đến ngày bắt đầu của đợt chấm.');
      } else if (err?.code === 'EXPIRED' || err?.message?.includes('Đã hết hạn')) {
        toast.error(err?.message || 'Đợt chấm đã kết thúc. Vui lòng liên hệ quản trị viên để nộp muộn.');
      } else {
        toast.error('Lưu thất bại. Vui lòng kiểm tra kết nối mạng.');
      }
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = useCallback(async (critId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Prevent duplicate uploads if already uploading
    if (uploadingId) {
      console.warn(`[handleFileUpload] Upload already in progress for ${uploadingId}, skipping duplicate upload for ${critId}`);
      toast.warning('Đang tải ảnh, vui lòng chờ...');
      return;
    }
    
    // Prevent duplicate rapid uploads (within 500ms) - catches React StrictMode double calls
    const now = Date.now();
    if (now - lastUploadTime.current < 500) {
      console.warn(`[handleFileUpload] Duplicate upload detected (${now - lastUploadTime.current}ms since last), skipping`);
      return;
    }
    lastUploadTime.current = now;

    const currentDetails = detailsRef.current;

    if ((currentDetails[critId]?.proofs?.length || 0) + files.length > 10) {
      toast.error('Tối đa 10 ảnh minh chứng cho mỗi mục');
      return;
    }

    // Validate file sizes before uploading
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const invalidFiles: string[] = [];
    let totalSize = 0;

    for (let i = 0; i < files.length; i++) {
      totalSize += files[i].size;
      if (files[i].size > MAX_FILE_SIZE) {
        invalidFiles.push(`${files[i].name} (${(files[i].size / 1024 / 1024).toFixed(1)}MB)`);
      }
    }

    if (invalidFiles.length > 0) {
      toast.error(`Tệp quá lớn (max 5MB mỗi tệp):\n${invalidFiles.join('\n')}`);
      return;
    }

    if (totalSize > 20 * 1024 * 1024) {
      toast.error('Tổng kích thước vượt quá 20MB. Vui lòng chia nhỏ để tải lên.');
      return;
    }

    const readFileAsDataURL = (file: File, timeoutMs = 15000) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        const timeoutId = setTimeout(() => {
          try { reader.abort(); } catch {}
          reject(new Error(`Không đọc được tệp (quá thời gian): ${file.name}`));
        }, timeoutMs);

        reader.onload = () => {
          clearTimeout(timeoutId);
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error(`Không đọc được tệp: ${file.name}`));
        };
        reader.onabort = () => {
          clearTimeout(timeoutId);
          reject(new Error(`Đọc tệp bị hủy: ${file.name}`));
        };

        reader.readAsDataURL(file);
      });
    };

    setUploadingId(critId);
    try {
      const uploadedUrls: string[] = [];
      const failedFiles: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          const extension = file.name.split('.').pop() || 'jpg';
          const base64 = await readFileAsDataURL(file);

          const sectionMap: Record<string, string> = { 'sec-1': 'I', 'sec-2': 'II', 'sec-3': 'III', 'sec-4': 'IV', 'sec-5': 'V' };
          const sectionId = EVALUATION_DATA.find(s => s.criteria.some(c => c.id === critId))?.id || '';
          const sectionLabel = sectionMap[sectionId] || 'X';
          const critIndex = critId.split('.')[1];
          const randomNum = Math.floor(Math.random() * 10000000000);
          const fileName = `${user?.username}_${sectionLabel}-${critIndex}_${randomNum}.${extension}`;

          console.log(`[handleFileUpload] Uploading ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
          const res = await drlService.uploadProof(fileName, base64, user?.username || '', critId, selectedPeriod, sectionLabel, sectionId, user?.mssv);

          if (!res || !res.success) {
            throw new Error(res?.error || 'Unknown error');
          }
          if (!res.url_anh && !res.url) {
            throw new Error('Upload returned no URL');
          }

          uploadedUrls.push(res.url_anh || res.url);
          console.log(`[handleFileUpload] Success: ${file.name} → ${res.url_anh || res.url}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          console.warn(`[handleFileUpload] Failed file: ${file.name} - ${msg}`);
          failedFiles.push(`${file.name}: ${msg}`);
        }
      }

      if (uploadedUrls.length === 0) {
        toast.error('Tải ảnh thất bại. Vui lòng thử lại.');
        return;
      }

      const baseDetails = detailsRef.current;
      const currentCrit = (baseDetails[critId] && typeof baseDetails[critId] === 'object')
        ? baseDetails[critId]
        : { self: 0, class: 0, proofs: [] };

      const newDetailsForSave: DRLDetails = {
        ...baseDetails,
        [critId]: {
          ...currentCrit,
          proofs: [...(currentCrit.proofs || []), ...uploadedUrls]
        }
      };

      detailsRef.current = newDetailsForSave;
      setDetails(newDetailsForSave);

      // Save to server (this may fail, but files are already uploaded)
      try {
        await handleSave('draft', newDetailsForSave);
        console.log('[handleFileUpload] Saved to server successfully');
      } catch (saveErr) {
        console.warn('[handleFileUpload] Save to server failed, but files were uploaded:', saveErr);
        toast.warning('Ảnh đã tải lên nhưng chưa lưu. Vui lòng nhấn lưu kết quả.');
      }

      if (failedFiles.length > 0) {
        toast.error(`Một số ảnh tải lên thất bại:\n${failedFiles.slice(0, 5).join('\n')}${failedFiles.length > 5 ? '\n…' : ''}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload thất bại. Vui lòng thử lại.';
      console.error('[handleFileUpload] Error:', err);
      toast.error(errorMessage);
    } finally {
      setUploadingId(null);
    }
  }, [user, selectedPeriod, uploadingId]);

  const removeProof = useCallback(async (critId: string, index: number) => {
    setDetails(currentDetails => {
      const proofUrl = currentDetails[critId]?.proofs[index];
      if (!proofUrl) return currentDetails;

      // Extract filename and path from URL
      let fileName = '';
      let fullPath = '';
      try {
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
      } catch (e) {
        fileName = proofUrl.split('/').pop()?.split('?')[0] || '';
        fullPath = fileName;
      }

      const currentCrit = (currentDetails[critId] && typeof currentDetails[critId] === 'object') 
        ? currentDetails[critId] 
        : { self: 0, class: 0, proofs: [] };
        
      const newProofs = [...currentCrit.proofs];
      newProofs.splice(index, 1);
      
      const updatedDetails = {
        ...currentDetails,
        [critId]: { ...currentCrit, proofs: newProofs }
      };
      
      // Start the removal process
      (async () => {
        try {
          await handleSave('draft', updatedDetails);
          const sectionMap: Record<string, string> = { 'sec-1': 'I', 'sec-2': 'II', 'sec-3': 'III', 'sec-4': 'IV', 'sec-5': 'V' };
          const sectionId = EVALUATION_DATA.find(s => s.criteria.some(c => c.id === critId))?.id || '';
          const sectionLabel = sectionMap[sectionId] || 'X';
          await drlService.deleteProof(fileName, user?.username || '', critId, selectedPeriod, fullPath, scoreId || '', sectionLabel, sectionId, user?.mssv);
        } catch (err) {
          console.error('Failed to remove proof', err);
        }
      })();

      return updatedDetails;
    });
  }, [user, selectedPeriod, scoreId]);

  const totalScore = useMemo(() => calculateDRLScore(details, EVALUATION_DATA, 'self'), [details]);

  const canViewClassScore = useMemo(() => {
    return ['class_approved', 'bch_approved', 'finalized'].includes(scoreStatus);
  }, [scoreStatus]);
  
  const sectionScores = useMemo(() => {
    const scores: Record<string, number> = {};
    EVALUATION_DATA.forEach(section => {
      scores[section.id] = calculateDRLScore(details, [section], 'self');
    });
    return scores;
  }, [details]);

  const handleImageClick = useCallback((images: string[], index: number, critId: string) => {
    setLightbox({ 
      isOpen: true, 
      images, 
      index, 
      critId 
    });
  }, []);

  const exportPDF = async () => {
    if (!printableRef.current) return;
    
    setExporting(true);
    try {
      await printableRef.current.downloadPDF();
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
          'Tự chấm': calculateDRLScore(details, [section], 'self'),
          'Lớp chấm': calculateDRLScore(details, [section], 'class')
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
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileText size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Phiếu điểm rèn luyện</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học kỳ:</span>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent font-bold text-blue-600 outline-none text-sm cursor-pointer"
              >
                {periods.length > 0 ? (
                  periods.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                ) : (
                  <option value="HK2-2023-2024">Học kỳ 2 - Năm học 2023-2024</option>
                )}
              </select>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-wide">
                <CheckCircle2 size={12} />
                Đã lưu lúc {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button 
            onClick={loadData}
            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          
          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95"
          >
            <Eye size={18} className="text-blue-500" />
            Xem phiếu
          </button>
          
          <button 
            onClick={exportExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} className="text-emerald-500" />}
            Xuất Excel
          </button>
          
          <button 
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            Lưu nháp
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {EVALUATION_DATA.map((section) => (
          <EvaluationSection 
            key={section.id}
            section={section}
            details={details}
            showClassScore={canViewClassScore}
            isExpanded={expandedSections.includes(section.id)}
            onToggle={toggleSection}
            sectionScore={sectionScores[section.id]}
            uploadingId={uploadingId}
            onScoreChange={handleScoreChange}
            onFileUpload={handleFileUpload}
            onRemoveProof={removeProof}
            onImageClick={handleImageClick}
          />
        ))}
      </div>

      <EvaluationSummary 
        totalScore={totalScore}
        saving={saving}
        onSave={handleSave}
        periodStatus={getPeriodStatus()}
      />
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none z-[-1]" style={{ width: '210mm' }} id="printable-scorecard-container">
        <div id="printable-scorecard">
          {user && (
            <PrintableScorecard 
              ref={printableRef}
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
                selfScore: calculateDRLScore(details, EVALUATION_DATA, 'self'),
                classScore: 0,
                bchScore: 0,
                finalScore: 0,
                details: JSON.stringify(details),
                status: scoreStatus
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
                    ref={printableRef}
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
                      selfScore: calculateDRLScore(details, EVALUATION_DATA, 'self'),
                      classScore: 0,
                      bchScore: 0,
                      finalScore: 0,
                      details: JSON.stringify(details),
                      status: scoreStatus
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
