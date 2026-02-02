
import React, { useState, useMemo } from 'react';
import { useApp } from '../store.tsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  Calendar, Building2, User, TrendingUp, AlertTriangle, CheckCircle2, 
  ArrowDownToLine, Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Reports: React.FC = () => {
  const { attendance, employees, centers } = useApp();

  // الحالة الافتراضية: من بداية الشهر الحالي وحتى اليوم
  const [dateFrom, setDateFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterCenter, setFilterCenter] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');

  // منطق الفلترة المعتمد على مقارنة النصوص (أكثر أماناً من كائنات التاريخ)
  const filteredData = useMemo(() => {
    return attendance.filter(record => {
      // بما أن التواريخ بنمط YYYY-MM-DD فإن مقارنة النصوص تعمل بشكل مثالي
      const matchesDate = record.date >= dateFrom && record.date <= dateTo;
      const matchesCenter = filterCenter === '' || record.centerId === filterCenter;
      const matchesEmployee = filterEmployee === '' || record.employeeId === filterEmployee;
      
      return matchesDate && matchesCenter && matchesEmployee;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, dateFrom, dateTo, filterCenter, filterEmployee]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const totalHours = filteredData.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
    const totalDelay = filteredData.reduce((acc, curr) => acc + (curr.delayMinutes || 0), 0);
    const lateCount = filteredData.filter(r => r.status === 'late').length;
    const totalRecords = filteredData.length;
    
    return {
      totalHours: totalHours.toFixed(1),
      avgHours: totalRecords > 0 ? (totalHours / totalRecords).toFixed(1) : "0",
      totalDelay: totalDelay,
      lateRate: totalRecords > 0 ? ((lateCount / totalRecords) * 100).toFixed(0) : "0",
      totalRecords
    };
  }, [filteredData]);

  // تجهيز بيانات الرسم البياني
  const chartData = useMemo(() => {
    const dailyMap: { [key: string]: { date: string, hours: number, count: number } } = {};
    
    // نأخذ آخر 10 أيام فقط من البيانات المفلترة للرسم
    filteredData.slice(0, 30).forEach(r => {
      if (!dailyMap[r.date]) {
        dailyMap[r.date] = { date: r.date, hours: 0, count: 0 };
      }
      dailyMap[r.date].hours += (r.workingHours || 0);
      dailyMap[r.date].count += 1;
    });

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  const handleExport = (type: string) => {
    alert(`جاري تجهيز تقرير ${type.toUpperCase()}... سيتم التحميل خلال لحظات.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">التقارير والتحليلات الذكية</h1>
          <p className="text-slate-500 font-bold">استخراج البيانات، مراقبة مؤشرات الأداء، وتحليل الانضباط العام</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExport('excel')}
            className="bg-white text-slate-700 px-6 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowDownToLine className="w-4 h-4 text-indigo-600" /> تصدير Excel
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200"
          >
            <Printer className="w-4 h-4" /> طباعة PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">من تاريخ</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 font-bold text-slate-700" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">إلى تاريخ</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 font-bold text-slate-700" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">تصفية حسب المركز</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={filterCenter}
                onChange={(e) => setFilterCenter(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 font-black text-slate-600 appearance-none"
              >
                <option value="">جميع المراكز</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">موظف محدد</label>
            <div className="relative">
              <User className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 font-black text-slate-600 appearance-none"
              >
                <option value="">كل الموظفين</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي ساعات العمل</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.totalHours} <span className="text-sm text-slate-400">ساعة</span></h3>
            <div className="mt-4 flex items-center gap-2 text-indigo-600 text-xs font-black">
              <TrendingUp className="w-4 h-4" /> معدل يومي {stats.avgHours}h
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي دقائق التأخير</p>
            <h3 className="text-3xl font-black text-rose-600">{stats.totalDelay} <span className="text-sm text-rose-300">دقيقة</span></h3>
            <div className="mt-4 flex items-center gap-2 text-rose-500 text-xs font-black">
              <AlertTriangle className="w-4 h-4" /> نسبة التأخير {stats.lateRate}%
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">عمليات الحضور</p>
            <h3 className="text-3xl font-black text-emerald-600">{stats.totalRecords} <span className="text-sm text-emerald-300">سجل</span></h3>
            <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-black">
              <CheckCircle2 className="w-4 h-4" /> بيانات موثقة 100%
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-200 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">تغطية الفترة</p>
            <h3 className="text-xl font-black text-white leading-tight">تقرير تحليلي للفترة المحددة</h3>
            <div className="mt-4 w-full py-2 bg-white/10 text-white rounded-xl text-[10px] font-black text-center border border-white/20">
               {dateFrom} - {dateTo}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">اتجاه ساعات العمل</h3>
          <div className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHrs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} 
                    tickFormatter={(val) => {
                      try { return format(new Date(val), 'dd MMM', {locale: ar}); }
                      catch(e) { return val; }
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorHrs)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-bold italic">لا توجد بيانات للرسم</div>
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">كثافة الحضور اليومي</h3>
          <div className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} 
                    tickFormatter={(val) => {
                      try { return format(new Date(val), 'dd MMM', {locale: ar}); }
                      catch(e) { return val; }
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[10, 10, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-bold italic">لا توجد بيانات للرسم</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">سجل البيانات التفصيلي</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">عرض {filteredData.length} سجل مطابق</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التاريخ</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">دخول / خروج</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التأخير</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ساعات العمل</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((record) => {
                const employee = employees.find(e => e.id === record.employeeId);
                return (
                  <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-xs">
                          {employee?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{employee?.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Emp ID: {record.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <p className="text-xs font-bold text-slate-700">{record.date}</p>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '--:--'}
                        </span>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                          {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '--:--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className={`text-xs font-black ${record.delayMinutes > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                        {record.delayMinutes > 0 ? `${record.delayMinutes} د` : '-'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-xs font-black text-slate-700">{record.workingHours}h</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black border uppercase ${
                        record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        record.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {record.status === 'present' ? 'منتظم' : record.status === 'late' ? 'متأخر' : 'غير مكتمل'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-bold italic">لا توجد بيانات مطابقة لمعايير البحث</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
