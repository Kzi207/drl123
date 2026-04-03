import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService, classService, drlService } from '../services/api';
import { Users, FileCheck, Calendar, BarChart3, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { adminToken } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('HK2-2023-2024');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      const [statsRes, classesRes, scoresRes, periodsRes] = await Promise.all([
        adminService.getStats(adminToken || ''),
        classService.getAll(),
        drlService.getScores(),
        drlService.getPeriods()
      ]);
      setStats(statsRes.data);
      setClasses(classesRes);
      setScores(scoresRes.filter((s: any) => s.semester === selectedPeriod));
      setPeriods(periodsRes);
      
      if (periodsRes.length > 0 && !periodsRes.find((p: any) => p.name === selectedPeriod)) {
        if (selectedPeriod === 'HK2-2023-2024' && periodsRes[0].name !== 'HK2-2023-2024') {
          setSelectedPeriod(periodsRes[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  const currentPeriod = periods.find(p => p.name === selectedPeriod) || (periods.length > 0 ? periods[0] : null);
  const totalStudents = stats?.totalUsers || 0;
  const submittedCount = scores.filter(s => s.status !== 'draft').length;
  const pendingCount = totalStudents - submittedCount;

  return (
    <div className="max-w-full mx-auto p-4 md:p-8 px-4 md:px-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Bảng điều khiển quản trị</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Đợt chấm:</p>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-blue-600 shadow-sm"
          >
            {periods.length > 0 ? (
              periods.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
            ) : (
              <option value="HK2-2023-2024">HK2-2023-2024</option>
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Users className="text-blue-600" />} 
          label="Tổng sinh viên" 
          value={totalStudents} 
          color="bg-blue-50" 
        />
        <StatCard 
          icon={<FileCheck className="text-green-600" />} 
          label="Đã nộp phiếu" 
          value={submittedCount} 
          color="bg-green-50" 
        />
        <StatCard 
          icon={<Clock className="text-amber-600" />} 
          label="Chưa nộp phiếu" 
          value={pendingCount} 
          color="bg-amber-50" 
        />
        <StatCard 
          icon={<BarChart3 className="text-purple-600" />} 
          label="Tổng số lớp" 
          value={classes.length} 
          color="bg-purple-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Thông tin đợt chấm điểm
            </h2>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-900">{currentPeriod ? currentPeriod.name : 'Học kỳ 2 - Năm học 2023-2024'}</p>
                <p className="text-sm text-blue-700">
                  Thời hạn: {currentPeriod ? `${new Date(currentPeriod.startDate).toLocaleDateString('vi-VN')} - ${new Date(currentPeriod.endDate).toLocaleDateString('vi-VN')}` : '01/03/2024 - 30/04/2024'}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full uppercase">
                {currentPeriod ? 'Đang diễn ra' : 'Đang mở'}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Thống kê theo lớp</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-sm border-b border-slate-100">
                    <th className="pb-3 font-medium">Tên lớp</th>
                    <th className="pb-3 font-medium">Sĩ số</th>
                    <th className="pb-3 font-medium">Đã nộp</th>
                    <th className="pb-3 font-medium">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {classes.slice(0, 5).map(cls => {
                    const classScores = scores.filter(s => s.status !== 'draft'); // This would need student mapping in real app
                    return (
                      <tr key={cls.id} className="text-slate-700">
                        <td className="py-3 font-medium">{cls.name}</td>
                        <td className="py-3">45</td>
                        <td className="py-3">32</td>
                        <td className="py-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '71%' }}></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Hoạt động gần đây</h2>
            <div className="space-y-4">
              {scores.slice(0, 5).map((score, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className={`mt-1 p-1.5 rounded-full ${score.status === 'submitted' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {score.status === 'submitted' ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      SV <span className="text-blue-600">{score.studentId}</span> {score.status === 'submitted' ? 'vừa nộp phiếu' : 'đã được duyệt'}
                    </p>
                    <p className="text-xs text-slate-400">Vừa xong</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold mb-2">Mẹo quản trị</h3>
            <p className="text-sm text-blue-100 mb-4">Bạn có thể duyệt nhanh tất cả phiếu điểm của một lớp bằng nút "Duyệt tất cả" trong trang chi tiết lớp.</p>
            <button className="text-xs font-bold uppercase tracking-wider bg-white/20 hover:bg-white/30 px-3 py-2 rounded transition-colors">Tìm hiểu thêm</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number | string, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4"
    >
      <div className={`p-4 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </motion.div>
  );
}
