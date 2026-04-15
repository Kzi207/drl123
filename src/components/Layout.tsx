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
const appLogo = 'https://pub-a3070670d3f6440188958284fa449261.r2.dev/Tên Dự án 14.png';

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
        
        {/* Desktop Header */}
        <div className="hidden md:flex max-w-full mx-auto px-12 h-20 items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={appLogo}
              alt="Logo" 
              className="w-14 h-14 object-contain"
            />
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">
                Trường Đại học Kỹ thuật - Công nghệ Cần Thơ
              </p>
              <h1 className="font-bold text-[#1a4b92] uppercase tracking-wide text-base leading-none">
                Khoa Kỹ thuật Cơ khí
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-1">
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
            <div className="text-right">
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
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden max-w-full mx-auto px-4 h-16 flex items-center">
          <button 
            className="p-2 pl-0 text-slate-500 mr-2"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={26} />
          </button>

          <div className="flex items-center gap-2">
            <img 
              src={appLogo}
              alt="Logo" 
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col justify-center">
              <p className="text-[7.5px] sm:text-[9px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-0.5">
                Trường Đại học Kỹ thuật - Công nghệ Cần Thơ
              </p>
              <h1 className="font-bold text-[#1a4b92] uppercase tracking-wide text-[11.5px] sm:text-[13px] leading-none">
                Khoa Kỹ thuật Cơ khí
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Left Sidebar) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="md:hidden fixed inset-y-0 left-0 w-[280px] bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img 
                    src={appLogo}
                    alt="Logo" 
                    className="w-10 h-10 object-contain"
                  />
                  <div className="flex flex-col justify-center">
                    <p className="text-[7.5px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-0.5">
                      Trường Đại học Kỹ thuật - Công nghệ Cần Thơ
                    </p>
                    <h1 className="font-bold text-[#1a4b92] uppercase tracking-wide text-[11.5px] leading-none">
                      Khoa Kỹ thuật Cơ khí
                    </h1>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full px-4 py-3.5 rounded-xl text-sm font-bold flex items-center gap-3 ${
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

              <div className="p-5 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user?.name || user?.username}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{user?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Đăng xuất"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 relative max-w-full overflow-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-full mx-auto px-4 text-center">
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
