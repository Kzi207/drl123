import React, { useState, useEffect, useRef } from 'react';
import { classService, studentService, drlService, adminService, authService } from '../services/api';
import { ClassGroup, Student, GradingPeriod } from '../types';
import { Plus, Edit2, Trash2, Users, GraduationCap, Calendar, Search, Download, Upload, CheckCircle2, AlertCircle, FileSpreadsheet, Filter, Mail, Database, ShieldAlert, Key } from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { generateStudentEmail } from '../lib/utils';

export default function AdminManagementPage() {
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'periods' | 'system'>('classes');
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [periods, setPeriods] = useState<GradingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [passwordStudent, setPasswordStudent] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<GradingPeriod | null>(null);
  const [studentFormData, setStudentFormData] = useState<Partial<Student>>({});
  const [classFormData, setClassFormData] = useState<Partial<ClassGroup>>({});
  const [periodFormData, setPeriodFormData] = useState<Partial<GradingPeriod>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'student' | 'class' | 'period', name: string } | null>(null);
  const [selectedClassIdForDelete, setSelectedClassIdForDelete] = useState<string>('all');
  const [selectedPeriodIdForDelete, setSelectedPeriodIdForDelete] = useState<string>('all');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes, periodsRes] = await Promise.all([
        classService.getAll(),
        studentService.getAll(),
        drlService.getPeriods()
      ]);
      setClasses(classesRes);
      setStudents(studentsRes);
      setPeriods(periodsRes);
    } catch (err) {
      console.error('Failed to load management data', err);
      showToast('error', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const studentId = editingStudent?.id || studentFormData.id || '';
      const firstName = studentFormData.firstName || '';
      const lastName = studentFormData.lastName || '';
      
      // Auto-generate email if not provided or to ensure format
      const generatedEmail = generateStudentEmail(lastName, firstName, studentId);

      const studentData = {
        id: studentId,
        firstName: firstName,
        lastName: lastName,
        classId: studentFormData.classId || '',
        department: studentFormData.department || null,
        dob: studentFormData.dob || null,
        email: studentFormData.email || generatedEmail,
        major: studentFormData.major || null,
      };

      if (editingStudent) {
        await studentService.update(studentData as Student);
        showToast('success', 'Cập nhật sinh viên thành công');
      } else {
        await studentService.upsert(studentData as Student);
        showToast('success', 'Thêm sinh viên thành công');
      }
      setIsStudentModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Save student failed', err);
      const errorMsg = err.message || '';
      if (errorMsg.includes('foreign key constraint fails')) {
        showToast('error', 'Lỗi: Lớp học không tồn tại. Vui lòng chọn lớp khác.');
      } else {
        showToast('error', 'Lưu sinh viên thất bại');
      }
    }
  };

  const confirmDeleteStudent = (student: Student) => {
    setDeleteConfirm({ id: student.id, type: 'student', name: `${student.lastName} ${student.firstName}` });
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await studentService.delete(id);
      showToast('success', 'Xóa sinh viên thành công');
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      console.error('Delete student failed', err);
      showToast('error', 'Xóa sinh viên thất bại');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordStudent || !newPassword) return;

    try {
      await authService.changePassword(passwordStudent.id, newPassword);
      showToast('success', `Đã đổi mật khẩu cho sinh viên ${passwordStudent.id}`);
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setPasswordStudent(null);
    } catch (err: any) {
      console.error('Change password failed', err);
      showToast('error', err.message || 'Đổi mật khẩu thất bại');
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const classData = {
        id: editingClass?.id || classFormData.id || '',
        name: classFormData.name || '',
        description: classFormData.description || null,
      };

      if (editingClass) {
        await classService.update(classData as ClassGroup);
        showToast('success', 'Cập nhật lớp học thành công');
      } else {
        await classService.create(classData as ClassGroup);
        showToast('success', 'Thêm lớp học thành công');
      }
      setIsClassModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Save class failed', err);
      const errorMsg = err.message || '';
      if (errorMsg.includes('already exists') || errorMsg.includes('Duplicate entry')) {
        showToast('error', 'Lỗi: Mã lớp học đã tồn tại.');
      } else {
        showToast('error', 'Lưu lớp học thất bại');
      }
    }
  };

  const confirmDeleteClass = (cls: ClassGroup) => {
    setDeleteConfirm({ id: cls.id, type: 'class', name: cls.name });
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await classService.delete(id);
      showToast('success', 'Xóa lớp học thành công');
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      console.error('Delete class failed', err);
      const errorMsg = err.message || '';
      if (errorMsg.includes('foreign key constraint fails')) {
        showToast('error', 'Lỗi: Không thể xóa lớp học này vì đang có sinh viên thuộc lớp. Vui lòng chuyển hoặc xóa sinh viên trước.');
      } else {
        showToast('error', 'Xóa lớp học thất bại');
      }
    }
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const periodData = {
        id: editingPeriod?.id || periodFormData.id || `period-${Date.now()}`,
        name: periodFormData.name || '',
        startDate: periodFormData.startDate || '',
        endDate: periodFormData.endDate || '',
      };

      // Use updatePeriod for editing, savePeriod for creating
      if (editingPeriod) {
        await drlService.updatePeriod(periodData as GradingPeriod);
      } else {
        await drlService.savePeriod(periodData as GradingPeriod);
      }
      
      showToast('success', editingPeriod ? 'Cập nhật đợt chấm thành công' : 'Thêm đợt chấm thành công');
      setIsPeriodModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Save period failed', err);
      showToast('error', 'Lưu đợt chấm thất bại');
    }
  };

  const confirmDeletePeriod = (period: GradingPeriod) => {
    setDeleteConfirm({ id: period.id, type: 'period', name: period.name });
  };

  const handleDeletePeriod = async (id: string) => {
    try {
      await drlService.deletePeriod(id);
      showToast('success', 'Xóa đợt chấm thành công');
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      console.error('Delete period failed', err);
      showToast('error', err.message || 'Xóa đợt chấm thất bại');
    }
  };

  const renderClasses = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Quản lý lớp học</h2>
        <button 
          onClick={() => {
            setEditingClass(null);
            setClassFormData({ id: '', name: '', description: '' });
            setIsClassModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Thêm lớp mới
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users size={20} />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setEditingClass(cls);
                    setClassFormData(cls);
                    setIsClassModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => confirmDeleteClass(cls)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-slate-900">{cls.name}</h3>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">{cls.id}</p>
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{cls.description || 'Không có mô tả'}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        console.log(`Importing ${data.length} rows from Excel...`);

        // Refresh classes list first to ensure we have the latest
        const latestClasses = await classService.getAll();
        setClasses(latestClasses);
        const existingClassIds = new Set(latestClasses.map(c => c.id.trim()));

        const newStudents: Student[] = data.map((row, index) => {
          const id = String(row.MSSV || row.id || row['Mã số sinh viên'] || '').trim();
          const lastName = String(row.Họ || row.lastName || row['Họ đệm'] || '').trim();
          const firstName = String(row.Tên || row.firstName || '').trim();
          
          let classId = selectedClassId;
          if (!classId) {
            const rawClass = row.Lớp || row.classId || row['Lớp học'] || '';
            classId = String(rawClass).trim();
          }

          const email = row.Email || row.email || generateStudentEmail(lastName, firstName, id);

          return {
            id,
            lastName,
            firstName,
            classId,
            department: String(row.Khoa || row.department || '').trim(),
            major: String(row.Ngành || row.major || '').trim(),
            dob: String(row['Ngày sinh'] || row.dob || '').trim(),
            email: String(email).trim(),
          };
        }).filter(s => {
          const isValid = s.id && s.firstName && s.classId && 
                        s.classId !== 'undefined' && s.classId !== 'null' && 
                        s.classId.length > 0;
          return isValid;
        });

        if (newStudents.length === 0) {
          showToast('error', 'Không tìm thấy dữ liệu sinh viên hợp lệ trong file (yêu cầu MSSV, Tên và Lớp)');
          return;
        }

        // Auto-create missing classes
        const uniqueClassIds = Array.from(new Set(newStudents.map(s => s.classId)));
        const missingClassIds = uniqueClassIds.filter(id => id && !existingClassIds.has(id));

        if (missingClassIds.length > 0) {
          console.log(`Creating ${missingClassIds.length} missing classes:`, missingClassIds);
          showToast('success', `Đang tạo ${missingClassIds.length} lớp học mới...`);
          
          for (const id of missingClassIds) {
            try {
              await classService.create({ 
                id, 
                name: `Lớp ${id}`, 
                description: 'Tự động tạo từ file Excel' 
              });
              console.log(`Successfully created class: ${id}`);
            } catch (err: any) {
              // If it's already exists, we can ignore
              if (err.message && (err.message.includes('already exists') || err.message.includes('Duplicate entry'))) {
                console.log(`Class ${id} already exists, skipping...`);
              } else {
                console.error(`Failed to create class ${id}:`, err);
                // We might want to stop here if a class can't be created, 
                // because upserting students for this class will fail.
                throw new Error(`Không thể tạo lớp học "${id}". Vui lòng tạo lớp học này thủ công trước khi nhập sinh viên.`);
              }
            }
          }
          
          // Re-verify classes exist after creation loop
          const updatedClasses = await classService.getAll();
          setClasses(updatedClasses);
          const finalClassIds = new Set(updatedClasses.map(c => c.id.trim()));
          
          const stillMissing = uniqueClassIds.filter(id => id && !finalClassIds.has(id));
          if (stillMissing.length > 0) {
            throw new Error(`Lỗi hệ thống: Một số lớp học vẫn chưa được tạo (${stillMissing.join(', ')}). Vui lòng thử lại.`);
          }
        }

        console.log(`Upserting ${newStudents.length} students...`);
        await studentService.upsert(newStudents);
        showToast('success', `Đã nhập thành công ${newStudents.length} sinh viên`);
        loadData();
      } catch (err: any) {
        console.error('Excel import failed', err);
        const errorMsg = err.message || 'Lỗi không xác định';
        if (errorMsg.includes('foreign key constraint fails')) {
          showToast('error', 'Lỗi: Một số lớp học không tồn tại trong cơ sở dữ liệu. Vui lòng kiểm tra cột Lớp trong file Excel.');
        } else {
          showToast('error', `Lỗi khi nhập dữ liệu: ${errorMsg}`);
        }
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  const downloadTemplate = () => {
    const template = [
      { 'MSSV': '20110001', 'Họ': 'Nguyễn Văn', 'Tên': 'A', 'Khoa': 'CNTT', 'Ngành': 'Kỹ thuật phần mềm', 'Ngày sinh': '2002-01-01', 'Email': 'nva@student.edu.vn' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_sinh_vien.xlsx");
  };

  const renderStudents = () => {
    const filteredStudents = students.filter(s => {
      const matchesSearch = s.id.includes(searchTerm) || `${s.lastName} ${s.firstName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = !selectedClassId || s.classId === selectedClassId;
      return matchesSearch && matchesClass;
    });

    return (
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800">Quản lý sinh viên</h2>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm MSSV, tên..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
              >
                <option value="">Tất cả lớp</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={downloadTemplate}
                title="Tải file mẫu"
                className="p-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <FileSpreadsheet size={18} />
                <span className="hidden sm:inline">Nhập Excel</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button 
                onClick={() => {
                  setEditingStudent(null);
                  setStudentFormData({ 
                    id: '', 
                    firstName: '', 
                    lastName: '', 
                    classId: selectedClassId || '', 
                    department: '' 
                  });
                  setIsStudentModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Thêm sinh viên</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">MSSV</th>
                <th className="px-6 py-4 font-bold">Họ tên</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold">Lớp</th>
                <th className="px-6 py-4 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, idx) => (
                  <tr key={`${s.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-blue-600">{s.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{s.lastName} {s.firstName}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{s.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{s.classId}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setPasswordStudent(s);
                            setNewPassword('');
                            setIsPasswordModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                          title="Đổi mật khẩu"
                        >
                          <Key size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingStudent(s);
                            setStudentFormData(s);
                            setIsStudentModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDeleteStudent(s)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                    Không tìm thấy sinh viên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPeriods = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Quản lý đợt chấm điểm</h2>
        <button 
          onClick={() => {
            setEditingPeriod(null);
            setPeriodFormData({ name: '', startDate: '', endDate: '' });
            setIsPeriodModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Tạo đợt mới
        </button>
      </div>
      <div className="space-y-3">
        {periods.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-500">Bắt đầu: {p.startDate} • Kết thúc: {p.endDate}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center">Đang diễn ra</span>
              <button 
                onClick={() => {
                  setEditingPeriod(p);
                  setPeriodFormData(p);
                  setIsPeriodModalOpen(true);
                }}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => confirmDeletePeriod(p)}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const executeDeleteAllProofs = async () => {
    if (deleteConfirmationText !== 'DELETE ALL') {
      toast.error('Xác nhận không khớp. Vui lòng nhập "DELETE ALL".');
      return;
    }

    try {
      setIsDeleting(true);
      const params: any = {};
      if (selectedClassIdForDelete !== 'all') params.classId = selectedClassIdForDelete;
      if (selectedPeriodIdForDelete !== 'all') params.periodId = selectedPeriodIdForDelete;

      const res = await adminService.deleteAllProofs(params);
      if (res.success) {
        toast.success(`Đã xóa thành công ${res.deleted || 0} minh chứng.`);
        setIsDeleteModalOpen(false);
      } else {
        toast.error(res.error || 'Xóa minh chứng thất bại');
      }
    } catch (err: any) {
      console.error('Delete all proofs failed', err);
      toast.error(err.message || 'Có lỗi xảy ra khi xóa minh chứng');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSystem = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Database size={20} className="text-blue-600" />
          Quản lý dữ liệu minh chứng
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">Chọn đợt chấm:</label>
            <select 
              value={selectedPeriodIdForDelete}
              onChange={(e) => setSelectedPeriodIdForDelete(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">Tất cả đợt chấm</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">Chọn lớp:</label>
            <select 
              value={selectedClassIdForDelete}
              onChange={(e) => setSelectedClassIdForDelete(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">Tất cả lớp</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <p className="text-slate-600 mb-6">
          Thao tác này sẽ xóa các tệp minh chứng dựa trên bộ lọc đã chọn. 
          <span className="text-red-600 font-bold block mt-2">Cảnh báo: Hành động này không thể hoàn tác!</span>
        </p>
        
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl border border-red-200 transition-all"
        >
          <Trash2 size={20} />
          Xóa minh chứng theo bộ lọc
        </button>
      </div>

      {/* Custom Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-100"
          >
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <ShieldAlert size={28} />
              <h3 className="text-xl font-bold">Xác nhận xóa minh chứng</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-sm text-red-800">
                <p className="font-bold mb-2">Bạn đang thực hiện xóa minh chứng với bộ lọc:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Đợt chấm: <span className="font-bold">{selectedPeriodIdForDelete === 'all' ? 'Tất cả' : periods.find(p => p.id === selectedPeriodIdForDelete)?.name}</span></li>
                  <li>Lớp: <span className="font-bold">{selectedClassIdForDelete === 'all' ? 'Tất cả' : classes.find(c => c.id === selectedClassIdForDelete)?.name}</span></li>
                </ul>
                <p className="mt-3 font-bold">Hành động này không thể hoàn tác!</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Nhập <span className="font-bold text-red-600">DELETE ALL</span> để xác nhận:
                </label>
                <input 
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Nhập DELETE ALL"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                disabled={isDeleting}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={executeDeleteAllProofs}
                disabled={deleteConfirmationText !== 'DELETE ALL' || isDeleting}
                className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  deleteConfirmationText === 'DELETE ALL' && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xác nhận xóa'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-full mx-auto p-4 md:p-8 px-4 md:px-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Quản lý hệ thống</h1>

      <div className="flex bg-slate-100 p-1 rounded-xl mb-8 w-fit overflow-x-auto max-w-full">
        <button 
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'classes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={16} /> Lớp học
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <GraduationCap size={16} /> Sinh viên
        </button>
        <button 
          onClick={() => setActiveTab('periods')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'periods' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Calendar size={16} /> Đợt chấm
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'system' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Database size={16} /> Dữ liệu
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === 'classes' && renderClasses()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'periods' && renderPeriods()}
        {activeTab === 'system' && renderSystem()}
      </motion.div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Key size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Đổi mật khẩu sinh viên</h2>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Sinh viên:</label>
                <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium">
                  {passwordStudent?.lastName} {passwordStudent?.firstName} ({passwordStudent?.id})
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu mới:</label>
                <input 
                  type="text" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-100"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <div className="p-3 bg-red-50 text-red-600 rounded-xl w-fit mb-4">
              <Trash2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa</h2>
            <p className="text-slate-600 mb-6">
              Bạn có chắc chắn muốn xóa {deleteConfirm.type === 'student' ? 'sinh viên' : 'lớp học'} 
              <span className="font-bold text-slate-900 ml-1">"{deleteConfirm.name}"</span>? 
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  if (deleteConfirm.type === 'student') handleDeleteStudent(deleteConfirm.id);
                  else if (deleteConfirm.type === 'class') handleDeleteClass(deleteConfirm.id);
                  else if (deleteConfirm.type === 'period') handleDeletePeriod(deleteConfirm.id);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {editingStudent ? 'Chỉnh sửa sinh viên' : 'Thêm sinh viên mới'}
            </h2>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">MSSV</label>
                <input 
                  type="text" 
                  value={studentFormData.id || ''}
                  onChange={e => setStudentFormData({...studentFormData, id: e.target.value})}
                  disabled={!!editingStudent}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Họ</label>
                  <input 
                    type="text" 
                    value={studentFormData.lastName || ''}
                    onChange={e => setStudentFormData({...studentFormData, lastName: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên</label>
                  <input 
                    type="text" 
                    value={studentFormData.firstName || ''}
                    onChange={e => setStudentFormData({...studentFormData, firstName: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lớp</label>
                <select 
                  value={studentFormData.classId || ''}
                  onChange={e => setStudentFormData({...studentFormData, classId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn lớp</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Khoa</label>
                <input 
                  type="text" 
                  value={studentFormData.department || ''}
                  onChange={e => setStudentFormData({...studentFormData, department: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email (Tự động tạo nếu để trống)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    value={studentFormData.email || ''}
                    onChange={e => setStudentFormData({...studentFormData, email: e.target.value})}
                    placeholder={generateStudentEmail(studentFormData.lastName || '', studentFormData.firstName || '', studentFormData.id || '')}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Định dạng: chữ cái đầu họ, lót + tên + mssv @student.ctuet.edu.vn
                </p>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
            </h2>
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã lớp</label>
                <input 
                  type="text" 
                  value={classFormData.id || ''}
                  onChange={e => setClassFormData({...classFormData, id: e.target.value})}
                  disabled={!!editingClass}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên lớp</label>
                <input 
                  type="text" 
                  value={classFormData.name || ''}
                  onChange={e => setClassFormData({...classFormData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea 
                  value={classFormData.description || ''}
                  onChange={e => setClassFormData({...classFormData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Period Modal */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {editingPeriod ? 'Chỉnh sửa đợt chấm' : 'Thêm đợt chấm mới'}
            </h2>
            <form onSubmit={handleSavePeriod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đợt (Học kỳ - Năm học)</label>
                <input 
                  type="text" 
                  value={periodFormData.name || ''}
                  onChange={e => setPeriodFormData({...periodFormData, name: e.target.value})}
                  placeholder="VD: HK2-2023-2024"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input 
                    type="date" 
                    value={periodFormData.startDate || ''}
                    onChange={e => setPeriodFormData({...periodFormData, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc</label>
                  <input 
                    type="date" 
                    value={periodFormData.endDate || ''}
                    onChange={e => setPeriodFormData({...periodFormData, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsPeriodModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
