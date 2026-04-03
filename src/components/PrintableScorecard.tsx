import React from 'react';
import { Student, DRLScore, DRLDetails } from '../types';
import { EVALUATION_DATA } from '../constants';
import { parseDRLDetails, calculateDRLScore } from '../lib/utils';

interface PrintableScorecardProps {
  student: Student;
  score?: DRLScore;
}

export const PrintableScorecard = React.forwardRef<HTMLDivElement, PrintableScorecardProps>(
  ({ student, score }, ref) => {
    const details: DRLDetails = score ? parseDRLDetails(score.details) : {};
    const totalSelf = calculateDRLScore(details, EVALUATION_DATA, 'self');
    const totalClass = calculateDRLScore(details, EVALUATION_DATA, 'class');

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
      <div ref={ref} className="p-[15mm] font-serif text-[11px] leading-tight printable-scorecard" style={{ backgroundColor: '#ffffff', color: '#000000', width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
          .printable-scorecard { font-family: "Times New Roman", Times, serif !important; }
          .printable-scorecard table { border-collapse: collapse !important; width: 100% !important; border: 1px solid black !important; }
          .printable-scorecard th, .printable-scorecard td { border: 1px solid black !important; padding: 4px !important; }
          .printable-scorecard .no-border { border: none !important; }
          .printable-scorecard .text-center { text-align: center !important; }
          .printable-scorecard .text-right { text-align: right !important; }
          .printable-scorecard .font-bold { font-weight: bold !important; }
          .printable-scorecard .uppercase { text-transform: uppercase !important; }
          .printable-scorecard .italic { font-style: italic !important; }
          .printable-scorecard .underline { text-decoration: underline !important; }
          .printable-scorecard .border-b-dotted { border-bottom: 1px dotted black !important; }
        `}} />
        
        {/* Header Section */}
        <div className="flex justify-between mb-2 items-start no-border">
          <div className="text-center w-[45%] no-border">
            <p className="font-bold text-[10px]">KHOA KỸ THUẬT CƠ KHÍ</p>
            <p className="font-bold text-[10px] underline">TRƯỜNG ĐẠI HỌC KỸ THUẬT - CÔNG NGHỆ CẦN THƠ</p>
          </div>
          <div className="text-center w-[50%] no-border">
            <p className="font-bold text-[11px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold text-[11px] underline">Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-4 no-border">
          <div className="w-16 h-16 relative flex items-center justify-center no-border">
            <div className="absolute inset-0 border-2 border-[#1e40af] rounded-full no-border"></div>
            <div className="text-center z-10 no-border">
              <div className="text-[5px] font-bold text-[#1e40af] leading-none no-border">TRƯỜNG ĐẠI HỌC</div>
              <div className="text-[5px] font-bold text-[#1e40af] leading-none no-border">KỸ THUẬT - CÔNG NGHỆ</div>
              <div className="text-[5px] font-bold text-[#1e40af] leading-none no-border">CẦN THƠ</div>
              <div className="w-8 h-8 mx-auto my-0.5 border border-[#1e40af] rounded-full flex items-center justify-center bg-white no-border">
                <span className="text-[8px] font-bold text-[#1e40af] no-border">CTUT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6 no-border">
          <h1 className="text-[20px] font-bold uppercase mb-1">PHIẾU ĐÁNH GIÁ ĐIỂM RÈN LUYỆN SINH VIÊN</h1>
          <div className="flex justify-center gap-8 font-bold italic text-[13px]">
            <p>Học kỳ: {score?.semester?.split('-')?.[0] || 'I'}</p>
            <p>Năm học: {score?.semester?.split('-')?.slice(1).join(' - ') || '2025 - 2026'}</p>
          </div>
        </div>

        {/* Student Info Section */}
        <div className="mb-6 border border-black p-4 relative" style={{ border: '1.5px solid black' }}>
          <div className="absolute -top-3 left-4 bg-white px-2 font-bold text-[11px]">THÔNG TIN SINH VIÊN</div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 no-border">
            <div className="flex items-baseline gap-1 no-border">
              <span className="font-bold whitespace-nowrap">Họ và tên:</span>
              <span className="border-b-dotted flex-grow pb-0.5">{student.lastName} {student.firstName}</span>
            </div>
            <div className="flex items-baseline gap-1 no-border">
              <span className="font-bold whitespace-nowrap">MSSV:</span>
              <span className="border-b-dotted flex-grow pb-0.5">{student.id}</span>
            </div>
            <div className="flex items-baseline gap-1 no-border">
              <span className="font-bold whitespace-nowrap">Lớp:</span>
              <span className="border-b-dotted flex-grow pb-0.5">{student.classId}</span>
            </div>
            <div className="flex items-baseline gap-1 no-border">
              <span className="font-bold whitespace-nowrap">Khóa:</span>
              <span className="border-b-dotted flex-grow pb-0.5">{student.id.substring(4, 8) || '2025'}</span>
            </div>
            <div className="flex items-baseline gap-1 no-border">
              <span className="font-bold whitespace-nowrap">Ngày sinh:</span>
              <span className="border-b-dotted flex-grow pb-0.5">{student.dob || '22/11/2007'}</span>
            </div>
            <div className="flex items-baseline gap-1 no-border">
              <span className="font-bold whitespace-nowrap">Điện thoại:</span>
              <span className="border-b-dotted flex-grow pb-0.5">0939042183</span>
            </div>
          </div>
        </div>

        {/* Evaluation Table */}
        <table className="w-full mb-6 text-[10px]">
          <thead>
            <tr className="font-bold text-center uppercase">
              <th style={{ width: '45%' }}>NỘI DUNG ĐÁNH GIÁ</th>
              <th style={{ width: '11%' }}>ĐIỂM TỐI ĐA</th>
              <th style={{ width: '11%' }}>ĐIỂM TRỪ</th>
              <th style={{ width: '11%' }}>SV TỰ CHẤM</th>
              <th style={{ width: '11%' }}>LỚP CHẤM</th>
              <th style={{ width: '11%' }}>KHOA CHẤM</th>
            </tr>
          </thead>
          <tbody>
            {EVALUATION_DATA.map((section, sIdx) => {
              const sectionSelf = calculateDRLScore(details, [section], 'self');
              const sectionClass = calculateDRLScore(details, [section], 'class');

              return (
                <React.Fragment key={section.id}>
                  <tr className="font-bold">
                    <td colSpan={6} className="p-2 uppercase">
                      {section.id.split('-')[1]}. {section.title} (ĐIỂM TỐI ĐA LÀ {section.maxPoints} ĐIỂM)
                    </td>
                  </tr>
                  {section.criteria.map((crit, cIdx) => (
                    <tr key={crit.id}>
                      <td className="p-1 px-2">{cIdx + 1}. {crit.content}</td>
                      <td className="text-center">{crit.maxPoints}</td>
                      <td className="text-center"></td>
                      <td className="text-center font-bold">{details[crit.id]?.self || 0}</td>
                      <td className="text-center font-bold">{details[crit.id]?.class || 0}</td>
                      <td className="text-center"></td>
                    </tr>
                  ))}
                  <tr className="font-bold italic">
                    <td className="text-right uppercase p-1">CỘNG MỤC {section.id.split('-')[1]}:</td>
                    <td className="text-center">{section.maxPoints}</td>
                    <td className="text-center"></td>
                    <td className="text-center font-bold" style={{ color: '#0000FF' }}>{sectionSelf}</td>
                    <td className="text-center font-bold" style={{ color: '#0000FF' }}>{sectionClass}</td>
                    <td className="text-center"></td>
                  </tr>
                </React.Fragment>
              );
            })}
            <tr className="font-bold text-[12px]">
              <td className="p-2 text-right uppercase">TỔNG CỘNG ĐIỂM RÈN LUYỆN:</td>
              <td className="text-center">100</td>
              <td className="text-center"></td>
              <td className="text-center font-bold" style={{ color: '#0000FF' }}>{totalSelf}</td>
              <td className="text-center font-bold" style={{ color: '#0000FF' }}>{totalClass}</td>
              <td className="text-center"></td>
            </tr>
          </tbody>
        </table>

        {/* Conclusion Section */}
        <div className="mb-6 border border-black p-3 w-[250px]" style={{ border: '1px solid black' }}>
          <p className="font-bold uppercase mb-2 text-[11px] underline">KẾT QUẢ ĐÁNH GIÁ CHUNG:</p>
          <div className="space-y-1 text-[11px] no-border">
            <div className="flex justify-between no-border">
              <span className="font-bold">Tổng điểm:</span>
              <span className="font-bold" style={{ color: '#0000FF' }}>{totalClass} / 100</span>
            </div>
            <div className="flex justify-between no-border">
              <span className="font-bold">Xếp loại:</span>
              <span className="font-bold uppercase" style={{ color: '#FF0000' }}>{getRank(totalClass)}</span>
            </div>
            <div className="no-border">
              <span className="font-bold italic">Bằng chữ:</span>
              <span className="italic ml-1">{numberToWords(totalClass)} điểm.</span>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-2 gap-y-24 text-center font-bold text-[11px] no-border">
          <div className="no-border">
            <p className="uppercase">BAN CHẤP HÀNH CHI ĐOÀN</p>
            <p className="font-normal italic text-[10px]">(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="no-border">
            <p className="uppercase">BAN CÁN SỰ LỚP</p>
            <p className="font-normal italic text-[10px]">(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="no-border">
            <p className="uppercase">BCH ĐOÀN KHOA</p>
            <p className="font-normal italic text-[10px]">(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="no-border">
            <p className="uppercase">CỐ VẤN HỌC TẬP</p>
            <p className="font-normal italic text-[10px]">(Ký và ghi rõ họ tên)</p>
          </div>
        </div>

        <div className="text-right italic text-[11px] mt-8 no-border">
          <p>Cần Thơ, ngày ..... tháng ..... năm 202...</p>
        </div>

        <div className="page-break-after" style={{ pageBreakAfter: 'always' }}></div>
      </div>
    );
  }
);

PrintableScorecard.displayName = 'PrintableScorecard';
