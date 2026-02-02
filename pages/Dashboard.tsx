
import React from 'react';
import { useApp } from '../store';
import { Users, Building2, Clock, CheckCircle, AlertCircle, TrendingUp, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getTodayDateString } from '../utils/attendanceLogic';

const Dashboard: React.FC = () => {
  const { employees, centers, attendance } = useApp();
  const today = getTodayDateString();
  const todayRecords = attendance.filter(a => a.date === today);

  const stats = [
    { label: 'القوى العاملة', value: employees.length, icon: Users, color: 'indigo', change: '+2.5%' },
    { label: 'المراكز النشطة', value: centers.length, icon: Building2, color: 'emerald', change: 'Steady' },
    { label: 'سجلات الحضور اليوم', value: todayRecords.length, icon: CheckCircle, color: 'blue', change: 'Live' },
    { label: 'حالات التأخير', value: todayRecords.filter(a => a.status === 'late').length, icon: Clock, color: 'amber', change: '-4%' },
  ];

  const attendanceRate = employees.length > 0 
    ? Math.round((todayRecords.length / employees.length) * 100) 
    : 0;

  // Mock data for attendance trend
  const trendData = [
    { name: 'الأحد', count: 45, hours: 320 },
    { name: 'الأثنين', count: 52, hours: 410 },
    { name: 'الثلاثاء', count: 48, hours: 380 },
    { name: 'الأربعاء', count: 61, hours: 450 },
    { name: 'الخميس', count: 55, hours: 420 },
    { name: 'الجمعة', count: 10, hours: 80 },
    { name: 'السبت', count: 15, hours: 120 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
              <Zap className="w-3 h-3" /> Real-time Analytics
            </div>
            <h1 className="text-4xl font-black tracking-tighter">مرحباً بك في لوحة التحكم، أمير</h1>
            <p className="text-slate-400 font-bold max-w-lg leading-relaxed">
              تتم مراقبة {centers.length} مراكز عمل حالياً. نسبة الانضباط اليوم وصلت إلى {attendanceRate}% عبر جميع الفروع.
            </p>
          </div>
          <div className="flex items-center gap-6 bg-white/5 backdrop-blur-lg p-6 rounded-[2rem] border border-white/10">
             <div className="text-center">
               <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Attendance Rate</p>
               <div className="text-3xl font-black text-emerald-400">{attendanceRate}%</div>
             </div>
             <div className="w-px h-10 bg-white/10"></div>
             <div className="text-center">
               <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Total Hours</p>
               <div className="text-3xl font-black text-indigo-400">
                 {todayRecords.reduce((acc, curr) => acc + curr.workingHours, 0).toFixed(0)}h
               </div>
             </div>
          </div>
        </div>
        {/* Background blobs */}
        <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-50%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:translate-y-[-4px] transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${stat.change.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'} uppercase`}>
                {stat.change}
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">تحليلات الأداء الأسبوعي</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">تتبع ساعات العمل وكثافة الحضور الميداني</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black text-slate-600 outline-none">
              <option>آخر 7 أيام</option>
              <option>آخر 30 يوم</option>
            </select>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">النشاط المباشر</h3>
            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black animate-pulse uppercase">Live</div>
          </div>
          <div className="space-y-6">
            {todayRecords.slice(0, 6).map((record) => {
              const employee = employees.find(e => e.id === record.employeeId);
              return (
                <div key={record.id} className="flex items-center gap-4 group p-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm relative ${
                    record.status === 'late' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {employee?.name.charAt(0)}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{employee?.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{record.status === 'late' ? 'تأخير' : 'في الوقت'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-700">{new Date(record.checkIn!).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</p>
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">Verified</p>
                  </div>
                </div>
              );
            })}
            {todayRecords.length === 0 && (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm text-slate-400 font-bold">لا توجد عمليات حضور حتى الآن</p>
              </div>
            )}
          </div>
          <button className="w-full mt-10 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 font-black text-xs transition-colors uppercase tracking-widest">
            View All Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
