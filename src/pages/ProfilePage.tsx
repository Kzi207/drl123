import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, studentService } from '../services/api';
import { User, Key, Save, GraduationCap, Building } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [mssv, setMssv] = useState(user?.username || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // In a real app, we'd update the student record in the DB
      await studentService.update({
        id: user?.username || '',
        firstName: name?.split(' ').pop() || '',
        lastName: name?.split(' ').slice(0, -1).join(' ') || '',
        department: department || null,
        classId: user?.classId || '',
        dob: null,
        email: null,
        major: null,
      });
      updateUser({ name, department });
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Cập nhật thất bại' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await authService.changePassword(user?.username || '', newPassword);
      setNewPassword('');
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Đổi mật khẩu thất bại' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Thông tin cá nhân</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <User size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Cập nhật hồ sơ</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã số sinh viên</label>
              <input
                type="text"
                disabled
                value={mssv}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập họ tên đầy đủ"
                />
                <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Khoa / Viện</label>
              <div className="relative">
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập tên khoa"
                />
                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              <Save size={18} />
              Lưu thay đổi
            </button>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Key size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Đổi mật khẩu</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <p className="text-xs text-slate-500">Mật khẩu nên chứa ít nhất 6 ký tự bao gồm chữ và số.</p>

            <button
              type="submit"
              disabled={loading || !newPassword}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Key size={18} />
              Cập nhật mật khẩu
            </button>
          </form>
        </motion.div>
      </div>

      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}
        >
          {message.text}
        </motion.div>
      )}
    </div>
  );
}
