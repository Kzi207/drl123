import { Section } from './types';

export const EVALUATION_DATA: Section[] = [
  {
    id: 'sec-1',
    title: 'I. Đánh giá về ý thức tham gia học tập (Điểm tối đa là 20 điểm)',
    maxPoints: 20,
    criteria: [
      {
        id: '1.1',
        content: '1. Sinh viên có điểm trung bình học tập tích lũy với thang điểm 4',
        maxPoints: 20,
        guide: 'Căn cứ vào điểm trung bình học kỳ (thang 4): \n- Loại Trung bình: 2.0 - 2.49 (2đ)\n- Loại Khá: 2.5 - 3.19 (3đ)\n- Loại Giỏi: 3.2 - 3.59 (4đ)\n- Loại Xuất sắc: 3.6 - 4.0 (5đ)',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '1.2',
        content: '2. Có giấy chứng nhận tham gia học các lớp chuyên đề kỹ năng học tập trong và ngoài Trường',
        maxPoints: 20,
        guide: 'Có minh chứng (giấy xác nhận, giấy chứng nhận, giấy khen, bằng khen...). Cộng 3đ/học kỳ.',
        type: 'boolean'
      },
      {
        id: '1.3',
        content: '3. Hội thảo hoặc Tọa đàm do Khoa hoặc Trường tổ chức',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham gia trực tiếp: 3đ/lần\n- Tham gia trực tuyến: 1đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '1.4',
        content: '4. Các cuộc thi học thuật cấp Khoa hoặc Trường tổ chức trực tiếp hoặc trực tuyến',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham dự/Cổ vũ: 1đ/lần\n- Ban tổ chức: 2đ/lần\n- Tham gia: 3đ/lần\n- Đạt giải Khuyến khích, giải phụ: 4đ/lần\n- Đạt giải Nhì, Ba: 5đ/lần\n- Đạt giải Nhất: 6đ/lần\n- Đạt giải Đặc biệt: 7đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '1.5',
        content: '5. Các cuộc thi học thuật do các đơn vị bên ngoài trường tổ chức',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham dự/Cổ vũ: 2đ/lần\n- Ban tổ chức: 3đ/lần\n- Tham gia: 4đ/lần\n- Đạt giải Khuyến khích, giải phụ: 5đ/lần\n- Đạt giải Nhì, Ba: 6đ/lần\n- Đạt giải Nhất: 7đ/lần\n- Đạt giải Đặc biệt: 8đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '1.6',
        content: '6. Báo cáo khoa học cấp Khoa',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Đề tài đạt loại Trung bình: 3đ/lần\n- Đề tài đạt loại Khá: 4đ/lần\n- Đề tài đạt loại Tốt: 6đ/lần\n- Đề tài đạt loại Xuất sắc: 8đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '1.7',
        content: '7. Tham gia đề tài NCKH Trường (không tính bài tập, tiểu luận, đồ án...)',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Đề tài đạt loại Trung bình: 5đ/lần\n- Đề tài đạt loại Khá: 6đ/lần\n- Đề tài đạt loại Tốt: 8đ/lần\n- Đề tài đạt loại Xuất sắc: 10đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '1.8',
        content: '8. Viết bài báo khoa học trong và ngoài Trường',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Được đăng trên kỷ yếu, bản tin: 5đ/lần\n- Được đăng trên tạp chí khoa học: 8đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '1.9',
        content: '9. Các cuộc thi khởi nghiệp do Trường tổ chức',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham dự/Cổ vũ: 1đ/lần\n- Ban tổ chức: 2đ/lần\n- Tham gia: 3đ/lần\n- Đạt giải Khuyến khích, giải phụ: 4đ/lần\n- Đạt giải Nhì, Ba: 5đ/lần\n- Đạt giải Nhất: 6đ/lần\n- Đạt giải Đặc biệt: 7đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '1.10',
        content: '10. Các cuộc thi khởi nghiệp do đơn vị ngoài Trường tổ chức',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham dự/Cổ vũ: 2đ/lần\n- Ban tổ chức: 3đ/lần\n- Tham gia: 4đ/lần\n- Đạt giải Khuyến khích, giải phụ: 5đ/lần\n- Đạt giải Nhì, Ba: 6đ/lần\n- Đạt giải Nhất: 7đ/lần\n- Đạt giải Đặc biệt: 8đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '1.11',
        content: '11. Thành viên các câu lạc bộ học thuật cấp Khoa, Trường',
        maxPoints: 20,
        guide: 'Có minh chứng. Cộng 2đ/học kỳ.',
        type: 'boolean'
      },
      {
        id: '1.12',
        content: '12. Các hoạt động khác',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham gia trực tiếp: 3đ/lần\n- Tham gia trực tuyến: 1đ/lần',
        type: 'number',
        unit: 'điểm'
      }
    ]
  },
  {
    id: 'sec-2',
    title: 'II. Đánh giá về ý thức chấp hành nội quy, quy chế và các quy định của Nhà trường (Điểm tối đa là 25 điểm)',
    maxPoints: 25,
    criteria: [
      {
        id: '2.1',
        content: '1. Sinh viên có ý thức, thái độ trong học tập',
        maxPoints: 25,
        guide: 'Đi học đầy đủ, đúng giờ, nghiêm túc trong giờ học. \n- Mỗi buổi nghỉ không phép: -3đ\n- Đi muộn (3 lần): -1đ\n- Bỏ tiết (3 lần): -1đ\n- Bị cấm thi: -5đ',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '2.2',
        content: '2. Sinh viên có ý thức chấp hành tốt, đầy đủ các nội quy, quy chế và các quy định của Nhà trường',
        maxPoints: 25,
        guide: 'Điểm cộng: 5đ. Điểm trừ: -5đ khi có quyết định kỷ luật.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '2.3',
        content: '3. Sinh viên thực tốt quy chế khi tham gia các kỳ thi, cuộc thi',
        maxPoints: 25,
        guide: 'Điểm cộng: 5đ. Điểm trừ: -5đ khi có quyết định kỷ luật.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '2.4',
        content: '4. Chấp hành quy định của thư viện',
        maxPoints: 25,
        guide: 'Điểm cộng: 5đ. Điểm trừ: -5đ khi có quyết định kỷ luật.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '2.5',
        content: '5. Chấp hành quy định của phòng học, phòng máy, phòng thực hành',
        maxPoints: 25,
        guide: 'Điểm cộng: 5đ. Điểm trừ: -5đ khi có quyết định kỷ luật.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '2.6',
        content: '6. Thực hiện đăng ký ngoại trú',
        maxPoints: 25,
        guide: 'Điểm cộng: 5đ. Điểm trừ: -5đ khi có quyết định kỷ luật.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '2.7',
        content: '7. Mặc đồng phục đúng quy định',
        maxPoints: 25,
        guide: 'Điểm cộng: 5đ. Điểm trừ: -5đ khi có quyết định kỷ luật.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '2.8',
        content: '8. Sinh hoạt lớp với CVHT',
        maxPoints: 25,
        guide: 'Điểm cộng: 5đ. Điểm trừ: -5đ khi không sinh hoạt lớp không lý do.',
        type: 'number',
        unit: 'điểm'
      }
    ]
  },
  {
    id: 'sec-3',
    title: 'III. Đánh giá về ý thức tham gia các hoạt động chính trị, xã hội, văn hóa, văn nghệ, thể thao... (Điểm tối đa là 20 điểm)',
    maxPoints: 20,
    criteria: [
      {
        id: '3.1',
        content: '1. Hoạt động bắt buộc do Khoa hoặc Trường tổ chức',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham gia: 3đ/lần\n- Vắng không lý do: -3đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '3.2',
        content: '2. Đại hội Chi Đoàn/Chi Hội; sinh hoạt Chi Đoàn/Chi Hội',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham gia: 3đ/lần\n- Vắng không lý do: -3đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '3.3',
        content: '3. Báo cáo chuyên đề do Trường tổ chức trực tiếp hoặc trực tuyến',
        maxPoints: 20,
        guide: 'Có minh chứng. Cộng 4đ/lần.',
        type: 'boolean'
      },
      {
        id: '3.4',
        content: '4. Hoạt động ngoại khóa hoặc các cuộc thi do các CLB, Khoa, Trường hoặc đơn vị ngoài Trường tổ chức trực tiếp hoặc trực tuyến',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham dự/Cổ vũ: 1đ/lần\n- Ban tổ chức: 2đ/lần\n- Tham gia: 3đ/lần\n- Giải Khuyến khích/Phụ: 4đ/lần\n- Giải Nhì/Ba: 5đ/lần\n- Giải Nhất: 6đ/lần\n- Giải Đặc biệt: 7đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '3.5',
        content: '5. Hoạt động ngoại khóa hoặc các cuộc thi từ cấp Thành phố trở lên',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham dự/Cổ vũ: 1đ/lần\n- Ban tổ chức: 3đ/lần\n- Tham gia: 4đ/lần\n- Giải Khuyến khích/Phụ: 5đ/lần\n- Giải Nhì/Ba: 6đ/lần\n- Giải Nhất: 7đ/lần\n- Giải Đặc biệt: 8đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '3.6',
        content: '6. Được kết nạp Đoàn',
        maxPoints: 20,
        guide: 'Chỉ được cộng một lần vào học kỳ kết nạp. Cộng 5đ.',
        type: 'boolean'
      },
      {
        id: '3.7',
        content: '7. Được kết nạp Đảng',
        maxPoints: 20,
        guide: 'Chỉ được cộng một lần vào học kỳ kết nạp. Cộng 8đ.',
        type: 'boolean'
      },
      {
        id: '3.8',
        content: '8. Các hoạt động, phong trào do các đơn vị, Đoàn, Hội điều động',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham gia: 2đ/lần\n- Ban tổ chức: 4đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '3.9',
        content: '9. Thành viên các Câu lạc bộ, đội, nhóm thuộc Đoàn Thanh niên, Hội Sinh viên',
        maxPoints: 20,
        guide: 'Có minh chứng. Cộng 2đ/học kỳ.',
        type: 'boolean'
      },
      {
        id: '3.10',
        content: '10. Hoạt động "Học tập các bài lý luận chính trị"',
        maxPoints: 20,
        guide: 'Có minh chứng. Cộng 4đ/lần.',
        type: 'boolean'
      },
      {
        id: '3.11',
        content: '11. Hoạt động đền ơn đáp nghĩa, Thắp nến tri ân',
        maxPoints: 20,
        guide: 'Có minh chứng. Cộng 3đ/lần.',
        type: 'boolean'
      },
      {
        id: '3.12',
        content: '12. Hoạt động lao động tình nguyện tại Trường',
        maxPoints: 20,
        guide: 'Có minh chứng. Cộng 3đ/lần.',
        type: 'boolean'
      },
      {
        id: '3.13',
        content: '13. Được khen thưởng trong các hoạt động phong trào',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Giấy khen hoặc tương đương: 5đ/lần\n- Bằng khen hoặc tương đương: 7đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '3.14',
        content: '14. Tập thể được khen thưởng trong các hoạt động phong trào',
        maxPoints: 20,
        guide: 'Mỗi SV trong tập thể được 1 điểm khi có giấy khen tập thể. Cộng 1đ/lần.',
        type: 'boolean'
      },
      {
        id: '3.15',
        content: '15. Các hoạt động khác',
        maxPoints: 20,
        guide: 'Có minh chứng. \n- Tham gia trực tiếp: 3đ/lần\n- Tham gia trực tuyến: 1đ/lần',
        type: 'number',
        unit: 'điểm'
      }
    ]
  },
  {
    id: 'sec-4',
    title: 'IV. Đánh giá về ý thức công dân trong quan hệ cộng đồng (Điểm tối đa là 25 điểm)',
    maxPoints: 25,
    criteria: [
      {
        id: '4.1',
        content: '1. Sinh viên chấp hành luật pháp, các quy định của Nhà nước và không có thông báo do công an hoặc các đơn vị khác gửi về Trường',
        maxPoints: 25,
        guide: 'Điểm cộng: 10đ/lần. Điểm trừ: -5đ/lần khi có hành vi chưa tốt có văn bản thông báo.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.2',
        content: '2. Sinh viên có hành vi tốt, có tinh thần sẻ chia, giúp đỡ người yếu thế được ghi nhận bằng văn bản',
        maxPoints: 25,
        guide: 'Có minh chứng (giấy khen, giấy chứng nhận...). Cộng 5đ/lần.',
        type: 'boolean'
      },
      {
        id: '4.3',
        content: '3. Sinh viên được biểu dương, khen thưởng về tham gia các hoạt động xã hội và cộng đồng ngoài trường',
        maxPoints: 25,
        guide: 'Có minh chứng bằng văn bản. Cộng 5đ/lần.',
        type: 'boolean'
      },
      {
        id: '4.4',
        content: '4. Giao lưu chương trình "Giao lưu các câu lạc bộ, đội, nhóm trực thuộc"',
        maxPoints: 25,
        guide: 'Có minh chứng. \n- Tham gia: 3đ/lần\n- Ban tổ chức: 5đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.5',
        content: '5. Chương trình "Tư vấn tuyển sinh"',
        maxPoints: 25,
        guide: 'Có minh chứng. Cộng 5đ/lần.',
        type: 'boolean'
      },
      {
        id: '4.6',
        content: '6. Công tác nhập học',
        maxPoints: 25,
        guide: 'Có minh chứng. Cộng 5đ/lần.',
        type: 'boolean'
      },
      {
        id: '4.7',
        content: '7. Công tác khám sức khỏe sinh viên đầu khóa',
        maxPoints: 25,
        guide: 'Có minh chứng. Cộng 5đ/lần.',
        type: 'boolean'
      },
      {
        id: '4.8',
        content: '8. Công tác Ngày hội việc làm',
        maxPoints: 25,
        guide: 'Có minh chứng. Cộng 5đ/lần.',
        type: 'boolean'
      },
      {
        id: '4.9',
        content: '9. Công tác tổ chức Lễ Tốt nghiệp',
        maxPoints: 25,
        guide: 'Có minh chứng. Cộng 5đ/lần.',
        type: 'boolean'
      },
      {
        id: '4.10',
        content: '10. Công tác kiểm tra hồ sơ sinh viên',
        maxPoints: 25,
        guide: 'Có minh chứng. Cộng 5đ/lần.',
        type: 'boolean'
      },
      {
        id: '4.11',
        content: '11. Tham gia các phiên giao dịch việc làm',
        maxPoints: 25,
        guide: 'Có minh chứng. \n- Tư vấn tại góc việc làm, cà phê việc làm: 1đ/lần\n- Cà phê việc làm tại TT DVVL: 2đ/lần\n- Phiên giao dịch việc làm khu vực: 3đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.12',
        content: '12. Hiến máu tình nguyện',
        maxPoints: 25,
        guide: 'Có minh chứng. \n- Tham gia: 10đ/lần\n- Ban tổ chức: 5đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.13',
        content: '13. Chương trình "Xuân tình nguyện"',
        maxPoints: 25,
        guide: 'Có minh chứng. \n- Tham gia: 4đ/lần\n- Ban tổ chức: 5đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.14',
        content: '14. Chiến dịch tình nguyện "Mùa hè xanh"',
        maxPoints: 25,
        guide: 'Có minh chứng. \n- Tham gia: 5đ/lần\n- Ban tổ chức: 7đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.15',
        content: '15. Chương trình "Ngày Chủ nhật xanh"',
        maxPoints: 25,
        guide: 'Có minh chứng. \n- Tham gia: 3đ/lần\n- Ban tổ chức: 5đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.16',
        content: '16. Chương trình "Thứ Bảy tình nguyện"',
        maxPoints: 25,
        guide: 'Có minh chứng. \n- Tham gia: 3đ/lần\n- Ban tổ chức: 5đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.17',
        content: '17. Chương trình "Chào đón tân sinh viên"',
        maxPoints: 25,
        guide: 'Có minh chứng. \n- Tham gia: 3đ/lần\n- Ban tổ chức: 5đ/lần',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.18',
        content: '18. Tham gia các hoạt động thực hiện trách nhiệm xã hội và phát triển bền vững',
        maxPoints: 25,
        guide: 'Có minh chứng. \n- Tham gia trực tiếp: 3đ/lần\n- Tham gia trực tuyến: 1đ/lần',
        type: 'number',
        unit: 'điểm'
      }
    ]
  },
  {
    id: 'sec-5',
    title: 'V. Đánh giá về ý thức và kết quả khi tham gia công tác cán bộ lớp, các đoàn thể... (Điểm tối đa là 10 điểm)',
    maxPoints: 10,
    criteria: [
      {
        id: '5.1',
        content: '1. Tham gia tích cực vào phong trào của Lớp, Đoàn, Hội sinh viên và các công tác đoàn thể xã hội khác',
        maxPoints: 10,
        guide: 'Cộng 1đ/hoạt động. Được 3đ (điểm tối đa). Có xác nhận của Đoàn, Hội cấp trên hoặc xác nhận của CVHT.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '5.2',
        content: '2. Phát huy vai trò và hoàn thành tốt nhiệm vụ người cán bộ Chi đoàn, Lớp, Câu lạc bộ, đội, nhóm',
        maxPoints: 10,
        guide: 'Có xác nhận của Đoàn, Hội cấp trên hoặc xác nhận của CVHT. \n- UVBCH Đoàn Trường; UVBCH Hội SV; Chủ nhiệm CLB; lớp trưởng: 5đ/học kỳ\n- Phó chủ nhiệm CLB; Đội trưởng; Đội phó các Đội, Nhóm thuộc Nhà trường: 4đ/học kỳ\n- UVBCH chi đoàn, UV Chi hội sinh viên cấp khoa hoặc là thành viên Đội tự quản, CLB: 3đ/học kỳ',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '5.3',
        content: '3. Sinh viên đạt giải về học tập, NCKH',
        maxPoints: 10,
        guide: 'Có minh chứng. \n- Cấp Thành phố, Khu vực: Khuyến khích (3đ), Ba (4đ), Nhì (5đ), Nhất (6đ)\n- Cấp Toàn quốc: Khuyến khích (4đ), Ba (5đ), Nhì (6đ), Nhất (7đ)',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '5.4',
        content: '4. Sinh viên được tặng Bằng khen của UBND Tỉnh, Thành phố (hoặc tương đương) về các hoạt động chính trị, văn hóa - xã hội...',
        maxPoints: 10,
        guide: 'Có văn bản xác nhận. Cộng 5đ/lần.',
        type: 'boolean'
      },
      {
        id: '5.5',
        content: '5. Sinh viên đạt danh hiệu sinh viên 5 tốt cấp Trường, Đoàn viên tiêu biểu, Thanh niên tiên tiến làm theo lời Bác...',
        maxPoints: 10,
        guide: 'Có minh chứng. Cộng 6đ/lần.',
        type: 'boolean'
      },
      {
        id: '5.6',
        content: '6. Sinh viên đạt danh hiệu sinh viên 5 tốt cấp Thành, Trung ương, giải thưởng Sao tháng giêng',
        maxPoints: 10,
        guide: 'Có minh chứng. Cộng 10đ/lần.',
        type: 'boolean'
      },
      {
        id: '5.7',
        content: '7. Đạt danh hiệu Đoàn viên ưu tú',
        maxPoints: 10,
        guide: 'Cộng 6đ/lần.',
        type: 'boolean'
      },
      {
        id: '5.8',
        content: '8. Giấy khen tập thể của Đoàn được trao cho những tập thể có thành tích xuất sắc',
        maxPoints: 10,
        guide: 'Mỗi SV trong tập thể được 2 điểm. Cộng 2đ/SV.',
        type: 'boolean'
      }
    ]
  }
];
