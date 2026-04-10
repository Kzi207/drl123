import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowUp,
  FileText, 
  User, 
  LogOut, 
  ShieldCheck, 
  Settings, 
  CheckSquare,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'admin' ? [
    { path: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/admin/approve', label: 'Duyệt phiếu', icon: CheckSquare },
    { path: '/admin/manage', label: 'Quản lý', icon: Settings },
  ] : [
    { path: '/', label: 'Phiếu điểm', icon: FileText },
    { path: '/profile', label: 'Cá nhân', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://pub-a3070670d3f6440188958284fa449261.r2.dev/pasted-1775135109395.png" 
              alt="Logo" 
              className="w-14 h-14 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="font-black text-slate-900 leading-tight text-lg">Đoàn Khoa Kỹ Thuật Cơ Khí</h1>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  location.pathname === item.path 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-900">{user?.name || user?.username}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{user?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
            <button 
              className="md:hidden p-2 text-slate-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 ${
                    location.pathname === item.path 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-full mx-auto px-4 md:px-12 text-center">
          <p className="text-sm text-slate-400">© 2025 Đoàn Khoa Kỹ Thuật Cơ Khí. Phát triển bởi Khánh Duy.</p>
        </div>
      </footer>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed right-5 bottom-24 z-50 p-3 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          title="Quay lại đầu trang"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
