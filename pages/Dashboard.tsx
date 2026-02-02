
import React from 'react';
import { useApp } from '../store.tsx';
import { Users, Building2, Clock, CheckCircle, AlertCircle, TrendingUp, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getTodayDateString } from '../utils/attendanceLogic.ts';

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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <stat.icon className="w-7 h-7 mb-4 text-indigo-600" />
            <p className="text-xs font-black text-slate-400 uppercase mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
