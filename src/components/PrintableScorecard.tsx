import React, { useImperativeHandle, useState, useEffect, useRef } from 'react';
import { Student, DRLScore, DRLDetails } from '../types';
import { EVALUATION_DATA } from '../constants';
import { parseDRLDetails, calculateDRLScore } from '../lib/utils';

export interface PrintableScorecardRef {
  downloadPDF: () => Promise<void>;
}

interface PrintableScorecardProps {
  student: Student;
  score?: DRLScore;
}

const logoCache: { [key: string]: string } = {};

export const PrintableScorecard = React.forwardRef<PrintableScorecardRef, PrintableScorecardProps>(
  ({ student, score }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const [logoBase64, setLogoBase64] = useState<string | null>(null);

    const details: DRLDetails = score ? parseDRLDetails(score.details) : {};
    const totalSelf = calculateDRLScore(details, EVALUATION_DATA, 'self');
    const totalClass = calculateDRLScore(details, EVALUATION_DATA, 'class');

    const displayScore = (value: unknown) => {
      const n = Number(value);
      return n === 0 || Number.isNaN(n) ? '' : n;
    };

    useEffect(() => {
      const logoUrl = 'https://pub-a3070670d3f6440188958284fa449261.r2.dev/pasted-1775135109395.png';
      const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(logoUrl.replace(/^https?:\/\//, ''))}`;
      
      if (logoCache[logoUrl]) {
        setLogoBase64(logoCache[logoUrl]);
        return;
      }

      const loadLogo = async () => {
        try {
          // Try first proxy
          let response = await fetch(proxiedUrl);
          
          // If first proxy fails, try second proxy
          if (!response.ok) {
            const fallbackProxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(logoUrl)}`;
            response = await fetch(fallbackProxiedUrl);
          }

          if (!response.ok) throw new Error('All proxies failed');
          
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            logoCache[logoUrl] = base64;
            setLogoBase64(base64);
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error('Failed to pre-load logo for PDF via all proxies', err);
          // Fallback to direct URL if all proxies fail
          setLogoBase64(logoUrl);
        }
      };
      loadLogo();
    }, []);

    useImperativeHandle(ref, () => ({
      downloadPDF: async () => {
        if (!innerRef.current) return;
        
        try {
          // @ts-ignore
          const html2pdf = (await import('html2pdf.js')).default;
          const opt = {
            margin: 10,
            filename: `PhieuDiemRL_${student.id}_${score?.semester || 'unknown'}.pdf`,
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
          await html2pdf().set(opt).from(innerRef.current).save();
        } catch (err) {
          console.error('Failed to export PDF', err);
          throw err;
        }
      }
    }));

    const getRank = (points: number) => {
      if (points >= 90) return 'Xuất sắc';
      if (points >= 80) return 'Giỏi';
      if (points >= 65) return 'Khá';
      if (points >= 50) return 'Trung bình';
      return 'Yếu';
    };

    const numberToWords = (n: number) => {
      const words = [
        'không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười',
        'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín',
        'hai mươi', 'hai mươi mốt', 'hai mươi hai', 'hai mươi ba', 'hai mươi bốn', 'hai mươi lăm', 'hai mươi sáu', 'hai mươi bảy', 'hai mươi tám', 'hai mươi chín',
        'ba mươi', 'ba mươi mốt', 'ba mươi hai', 'ba mươi ba', 'ba mươi bốn', 'ba mươi lăm', 'ba mươi sáu', 'ba mươi bảy', 'ba mươi tám', 'ba mươi chín',
        'bốn mươi', 'bốn mươi mốt', 'bốn mươi hai', 'bốn mươi ba', 'bốn mươi bốn', 'bốn mươi lăm', 'bốn mươi sáu', 'bốn mươi bảy', 'bốn mươi tám', 'bốn mươi chín',
        'năm mươi', 'năm mươi mốt', 'năm mươi hai', 'năm mươi ba', 'năm mươi bốn', 'năm mươi lăm', 'năm mươi sáu', 'năm mươi bảy', 'năm mươi tám', 'năm mươi chín',
        'sáu mươi', 'sáu mươi mốt', 'sáu mươi hai', 'sáu mươi ba', 'sáu mươi bốn', 'sáu mươi lăm', 'sáu mươi sáu', 'sáu mươi bảy', 'sáu mươi tám', 'sáu mươi chín',
        'bảy mươi', 'bảy mươi mốt', 'bảy mươi hai', 'bảy mươi ba', 'bảy mươi bốn', 'bảy mươi lăm', 'bảy mươi sáu', 'bảy mươi bảy', 'bảy mươi tám', 'bảy mươi chín',
        'tám mươi', 'tám mươi mốt', 'tám mươi hai', 'tám mươi ba', 'tám mươi bốn', 'tám mươi lăm', 'tám mươi sáu', 'tám mươi bảy', 'tám mươi tám', 'tám mươi chín',
        'chín mươi', 'chín mươi mốt', 'chín mươi hai', 'chín mươi ba', 'chín mươi bốn', 'chín mươi lăm', 'chín mươi sáu', 'chín mươi bảy', 'chín mươi tám', 'chín mươi chín',
        'một trăm'
      ];
      return words[n] || String(n);
    };

    return (
      <div ref={innerRef} className="p-[15mm] font-serif text-[12px] leading-normal printable-scorecard" style={{ backgroundColor: '#ffffff', color: '#000000', width: '210mm', margin: '0 auto', boxSizing: 'border-box', position: 'relative' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .printable-scorecard { 
            font-family: "Times New Roman", Times, serif !important;
            --tw-ring-color: transparent !important;
            --tw-ring-offset-color: transparent !important;
            --tw-shadow: 0 0 #0000 !important;
            --tw-shadow-colored: 0 0 #0000 !important;
          }
          /* Override Tailwind 4 oklch variables with hex fallbacks */
          .printable-scorecard, .printable-scorecard * {
            --color-white: #ffffff !important;
            --color-black: #000000 !important;
            --color-gray-50: #f9fafb !important;
            --color-gray-100: #f3f4f6 !important;
            --color-gray-200: #e5e7eb !important;
            --color-gray-300: #d1d5db !important;
            --color-gray-400: #9ca3af !important;
            --color-gray-500: #6b7280 !important;
            --color-gray-600: #4b5563 !important;
            --color-gray-700: #374151 !important;
            --color-gray-800: #1f2937 !important;
            --color-gray-900: #111827 !important;
            --color-blue-50: #eff6ff !important;
            --color-blue-100: #dbeafe !important;
            --color-blue-200: #bfdbfe !important;
            --color-blue-300: #93c5fd !important;
            --color-blue-400: #60a5fa !important;
            --color-blue-500: #3b82f6 !important;
            --color-blue-600: #2563eb !important;
            --color-blue-700: #1d4ed8 !important;
            --color-blue-800: #1e40af !important;
            --color-blue-900: #1e3a8a !important;
            --color-slate-50: #f8fafc !important;
            --color-slate-100: #f1f5f9 !important;
            --color-slate-200: #e2e8f0 !important;
            --color-slate-300: #cbd5e1 !important;
            --color-slate-400: #94a3b8 !important;
            --color-slate-500: #64748b !important;
            --color-slate-600: #475569 !important;
            --color-slate-700: #334155 !important;
            --color-slate-800: #1e293b !important;
            --color-slate-900: #0f172a !important;
            --color-red-700: #b91c1c !important;
            
            /* Reset any oklch-based properties */
            border-color: currentColor;
          }
          .printable-scorecard .text-gray-900 { color: #111827 !important; }
          .printable-scorecard .text-gray-700 { color: #374151 !important; }
          .printable-scorecard .bg-gray-50 { background-color: #f9fafb !important; }
          .printable-scorecard .bg-slate-50 { background-color: #f8fafc !important; }
          .printable-scorecard .text-blue-600 { color: #2563eb !important; }
          .printable-scorecard .border-gray-300 { border-color: #d1d5db !important; }
          .printable-scorecard .border-gray-400 { border-color: #9ca3af !important; }
          .printable-scorecard .border-black { border-color: #000000 !important; }
          .printable-scorecard .border-b { border-bottom-width: 1px !important; }
          .printable-scorecard .border-2 { border-width: 2px !important; }
          .printable-scorecard .bg-white { background-color: #ffffff !important; }
          
          @media print {
            .printable-scorecard {
              width: 210mm !important;
              height: auto !important;
              padding: 15mm !important;
              margin: 0 !important;
            }
            tr { page-break-inside: avoid !important; }
          }
        `}} />
        {/* Official Header */}
        <div className="flex justify-between mb-8 items-start">
          <div className="text-center w-[48%]">
            <p className="font-bold uppercase text-[11px] leading-tight">TRƯỜNG ĐẠI HỌC KỸ THUẬT - CÔNG NGHỆ CẦN THƠ</p>
            <p className="font-bold uppercase text-[11px] leading-tight">KHOA KỸ THUẬT CƠ KHÍ</p>
            <div className="mt-1 flex justify-center">
              <div className="w-12 border-b border-black"></div>
            </div>
            <div className="mt-3 flex justify-center">
              <img 
                src={logoBase64 || "https://pub-a3070670d3f6440188958284fa449261.r2.dev/pasted-1775135109395.png"} 
                alt="Logo" 
                className="w-14 h-14 object-contain" 
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </div>
          </div>
          <div className="text-center w-[48%]">
            <p className="font-bold text-[12px] uppercase leading-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold text-[12px] leading-tight">Độc lập - Tự do - Hạnh phúc</p>
            <div className="mt-1 flex justify-center">
              <div className="w-24 border-b border-black"></div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-[20px] font-bold uppercase mb-1 tracking-wide">PHIẾU ĐÁNH GIÁ ĐIỂM RÈN LUYỆN SINH VIÊN</h1>
          <div className="flex justify-center gap-8 font-bold text-[14px] italic">
            <p>Học kỳ: {score?.semester?.split('-')?.[0] || 'I'}</p>
            <p>Năm học: {score?.semester?.split('-')?.slice(1).join(' - ') || '2025 - 2026'}</p>
          </div>
        </div>

        {/* Student Info Section */}
        <div className="mb-6 border border-black p-5 relative">
          <div className="absolute -top-3 left-6 bg-white px-2 font-bold uppercase text-[12px]" style={{ backgroundColor: '#ffffff' }}>Thông tin sinh viên</div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2">
            <div className="flex items-center">
              <span className="font-bold w-24 shrink-0">Họ và tên:</span>
              <span className="border-b border-dotted border-black flex-grow pb-0.5">{student.lastName} {student.firstName}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-24 shrink-0">MSSV:</span>
              <span className="border-b border-dotted border-black flex-grow font-mono pb-0.5">{student.id}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-24 shrink-0">Lớp:</span>
              <span className="border-b border-dotted border-black flex-grow pb-0.5">{student.classId}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-24 shrink-0">Khóa:</span>
              <span className="border-b border-dotted border-black flex-grow pb-0.5">{student.id.substring(4, 8) || '2025'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-24 shrink-0">Ngày sinh:</span>
              <span className="border-b border-dotted border-black flex-grow pb-0.5">{student.dob || '22/11/2007'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-24 shrink-0">Điện thoại:</span>
              <span className="border-b border-dotted border-black flex-grow pb-0.5">{student.phone || '.........................'}</span>
            </div>
          </div>
        </div>

        {/* Evaluation Table */}
        <table className="w-full border-collapse mb-8 text-[11px]" style={{ border: '2px solid #000000' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th className="p-3 font-bold text-center uppercase" style={{ border: '1px solid #000000', width: '45%' }}>Nội dung đánh giá</th>
              <th className="p-3 font-bold text-center uppercase" style={{ border: '1px solid #000000', width: '11%' }}>Điểm tối đa</th>
              <th className="p-3 font-bold text-center uppercase" style={{ border: '1px solid #000000', width: '11%' }}>Điểm trừ</th>
              <th className="p-3 font-bold text-center uppercase" style={{ border: '1px solid #000000', width: '11%' }}>SV tự chấm</th>
              <th className="p-3 font-bold text-center uppercase" style={{ border: '1px solid #000000', width: '11%' }}>Lớp chấm</th>
              <th className="p-3 font-bold text-center uppercase" style={{ border: '1px solid #000000', width: '11%' }}>Khoa chấm</th>
            </tr>
          </thead>
          <tbody>
            {EVALUATION_DATA.map((section, sIdx) => {
              const sectionSelf = calculateDRLScore(details, [section], 'self');
              const sectionClass = calculateDRLScore(details, [section], 'class');

              return (
                <React.Fragment key={section.id}>
                  <tr className="font-bold" style={{ backgroundColor: '#f9fafb' }}>
                    <td colSpan={6} className="p-2.5 uppercase text-[12px]" style={{ border: '1px solid #000000' }}>
                      {section.title}
                    </td>
                  </tr>
                  {section.criteria.map((crit) => (
                    <tr key={crit.id}>
                      <td className="p-2.5 px-4 leading-snug" style={{ border: '1px solid #000000' }}>{crit.content}</td>
                      <td className="p-2.5 text-center font-medium" style={{ border: '1px solid #000000' }}>{crit.maxPoints}</td>
                      <td className="p-2.5 text-center" style={{ border: '1px solid #000000' }}></td>
                      <td className="p-2.5 text-center font-bold" style={{ border: '1px solid #000000', color: '#374151' }}>{displayScore(details[crit.id]?.self)}</td>
                      <td className="p-2.5 text-center font-bold" style={{ border: '1px solid #000000', color: '#374151' }}>{displayScore(details[crit.id]?.class)}</td>
                      <td className="p-2.5 text-center" style={{ border: '1px solid #000000' }}></td>
                    </tr>
                  ))}
                  <tr className="font-bold" style={{ backgroundColor: 'rgba(239, 246, 255, 0.4)' }}>
                    <td className="p-2.5 px-4 text-right uppercase italic" style={{ border: '1px solid #000000' }}>
                      Cộng mục {section.id.split('-')[1]}:
                    </td>
                    <td className="p-2.5 text-center" style={{ border: '1px solid #000000' }}>{section.maxPoints}</td>
                    <td className="p-2.5 text-center" style={{ border: '1px solid #000000' }}></td>
                    <td className="p-2.5 text-center font-bold" style={{ border: '1px solid #000000', color: '#1e40af' }}>{sectionSelf}</td>
                    <td className="p-2.5 text-center font-bold" style={{ border: '1px solid #000000', color: '#1e40af' }}>{sectionClass}</td>
                    <td className="p-2.5 text-center" style={{ border: '1px solid #000000' }}></td>
                  </tr>
                </React.Fragment>
              );
            })}
            {/* Total Row */}
            <tr className="font-bold text-[14px]" style={{ backgroundColor: '#e5e7eb' }}>
              <td className="p-4 text-right uppercase tracking-wider" style={{ border: '2px solid #000000' }}>Tổng cộng điểm rèn luyện:</td>
              <td className="p-4 text-center" style={{ border: '2px solid #000000' }}>100</td>
              <td className="p-4 text-center" style={{ border: '2px solid #000000' }}></td>
              <td className="p-4 text-center font-bold" style={{ border: '2px solid #000000', color: '#1e3a8a' }}>{totalSelf}</td>
              <td className="p-4 text-center font-bold" style={{ border: '2px solid #000000', color: '#1e3a8a' }}>{totalClass}</td>
              <td className="p-4 text-center" style={{ border: '2px solid #000000' }}></td>
            </tr>
          </tbody>
        </table>

        {/* Conclusion Section */}
        <div className="mb-10 flex justify-start">
          <div className="w-[60%] border border-black p-4 rounded-sm" style={{ backgroundColor: 'rgba(249, 246, 255, 0.3)' }}>
            <p className="font-bold uppercase mb-3 text-[12px] border-b border-black pb-1">Kết quả đánh giá chung:</p>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="font-bold">Tổng điểm:</span>
                <span className="font-bold" style={{ color: '#1e3a8a' }}>{totalClass} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Xếp loại:</span>
                <span className="font-bold uppercase" style={{ color: '#b91c1c' }}>{getRank(totalClass)}</span>
              </div>
              <div className="pt-1 border-t" style={{ borderColor: '#d1d5db' }}>
                <span className="font-bold">Bằng chữ:</span>
                <span className="italic capitalize ml-2">{numberToWords(totalClass)} điểm.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page break before signature section */}
        <div style={{ pageBreakAfter: 'always' }}></div>

        {/* Signature Section */}
        <div className="mt-12">
          <div className="text-right italic text-[12px] mb-4 pr-10">
            <p>Cần Thơ, ngày ..... tháng ..... năm 202...</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 text-center font-bold text-[12px] mb-16">
            <div className="flex flex-col h-32">
              <p className="uppercase leading-tight">Ban chấp hành Chi đoàn</p>
              <p className="font-normal italic text-[11px] mb-auto">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 border-b border-dotted mx-4" style={{ borderColor: '#9ca3af' }}></div>
            </div>
            <div className="flex flex-col h-32">
              <p className="uppercase leading-tight">Ban cán sự lớp</p>
              <p className="font-normal italic text-[11px] mb-auto">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 border-b border-dotted mx-4" style={{ borderColor: '#9ca3af' }}></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 text-center font-bold text-[12px]">
            <div className="flex flex-col h-32">
              <p className="uppercase leading-tight">BCH đoàn Khoa</p>
              <p className="font-normal italic text-[11px] mb-auto">(Ký và ghi rõ họ tên)</p>
              <div className="h-20 border-b border-dotted mx-8" style={{ borderColor: '#9ca3af' }}></div>
            </div>
            <div className="flex flex-col h-32">
              <p className="uppercase leading-tight">Cố vấn học tập</p>
              <p className="font-normal italic text-[11px] mb-auto">(Ký và ghi rõ họ tên)</p>
              <div className="h-20 border-b border-dotted mx-8" style={{ borderColor: '#9ca3af' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PrintableScorecard.displayName = 'PrintableScorecard';
