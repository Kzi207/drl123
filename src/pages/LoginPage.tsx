import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, adminAuthService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LogIn, User as UserIcon, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
const appLogo = 'https://pub-a3070670d3f6440188958284fa449261.r2.dev/Tên Dự án 14.png';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const u = username.trim();
      const p = password.trim();

      if (isAdmin) {
        const res = await adminAuthService.login(u, p);
        if (res.success) {
          login({ username: res.username || u, role: 'admin' }, res.token);
          navigate('/admin');
        } else {
          setError(res.error || 'Đăng nhập admin thất bại');
        }
      } else {
        const user = await authService.login(u, p);
        login(user, (user as any).token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-2">
            <img 
              src={appLogo}
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-[13px] sm:text-sm font-semibold text-slate-600 uppercase tracking-widest mb-1.5">Trường Đại học Kỹ thuật - Công nghệ Cần Thơ</h2>
          <h1 className="text-lg sm:text-xl font-bold text-[#1a4b92] uppercase tracking-wide pb-5 border-b border-slate-200/80 mb-5">Khoa Kỹ thuật cơ khí</h1>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 uppercase tracking-tight">Cổng chấm điểm rèn luyện</h2>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setIsAdmin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isAdmin ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserIcon size={16} className="inline mr-2" />
            Sinh viên
          </button>
          <button
            onClick={() => setIsAdmin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isAdmin ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck size={16} className="inline mr-2" />
            Quản trị viên
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập / MSSV</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Nhập tên đăng nhập"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Nhập mật khẩu"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
