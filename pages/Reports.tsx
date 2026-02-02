
import React, { useState, useMemo } from 'react';
import { useApp } from '../store.tsx';
import { 
  FileSpreadsheet, Printer, Clock, Activity, Zap, 
  CheckCircle2, AlertTriangle, Copy, Check, Loader2, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const { attendance, employees, centers } = useApp();

  const [dateFrom, setDateFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterCenter, setFilterCenter] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [copying, setCopying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const activeCenterIds = useMemo(() => centers.filter(c => c.isActive).map(c => c.id), [centers]);

  const filteredData = useMemo(() => {
    return attendance.filter(record => {
      const matchesDate = record.date >= dateFrom && record.date <= dateTo;
      const matchesCenter = filterCenter === '' 
        ? activeCenterIds.includes(record.centerId) 
        : record.centerId === filterCenter;
      const matchesEmployee = filterEmployee === '' || record.employeeId === filterEmployee;
      return matchesDate && matchesCenter && matchesEmployee;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, dateFrom, dateTo, filterCenter, filterEmployee, activeCenterIds]);

  const stats = useMemo(() => {
    const totalRecords = filteredData.length;
    if (totalRecords === 0) return { disciplineRate: 0, totalHours: 0, criticalDelays: 0, activeRecords: 0 };

    const onTimeCount = filteredData.filter(r => r.status === 'present').length;
    const totalHours = filteredData.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
    const criticalDelays = filteredData.filter(r => r.delayMinutes > 30).length;

    return {
      disciplineRate: ((onTimeCount / totalRecords) * 100).toFixed(1),
      totalHours: totalHours.toFixed(1),
      criticalDelays,
      activeRecords: totalRecords
    };
  }, [filteredData]);

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('لا توجد بيانات لتصديرها في الفترة المحددة.');
      return;
    }

    setIsExporting(true);

    try {
      const headers = [
        'اسم الموظف',
        'رمز الموظف',
        'اسم المركز',
        'التاريخ',
        'الدخول المطلوب',
        'الدخول الفعلي',
        'الخروج المطلوب',
        'الخروج الفعلي',
        'دقائق التأخير',
        'دقائق الخروج المبكر',
        'مجموع ساعات الدوام',
        'ملاحظات الحالة'
      ];

      const rows = filteredData.map(record => {
        const emp = employees.find(e => e.id === record.employeeId);
        const center = centers.find(c => c.id === record.centerId);
        const formatTime = (iso?: string) => iso ? format(new Date(iso), 'HH:mm') : '-';
        
        let note = '';
        if (record.delayMinutes > 0) note += `تأخير ${record.delayMinutes}د. `;
        if (record.earlyDepartureMinutes > 0) note += `خروج مبكر ${record.earlyDepartureMinutes}د. `;
        if (record.status === 'present' && record.delayMinutes === 0) note = 'منضبط';

        return [
          emp?.name || 'غير معروف',
          emp?.code || 'N/A',
          center?.name || 'غير معروف',
          record.date,
          center?.defaultStartTime || '-',
          formatTime(record.checkIn),
          center?.defaultEndTime || '-',
          formatTime(record.checkOut),
          record.delayMinutes || 0,
          record.earlyDepartureMinutes || 0,
          record.workingHours || 0,
          note
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      if (!ws['!props']) ws['!props'] = {};
      ws['!margin'] = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "تقرير الحضور");
      XLSX.writeFile(wb, `Relief_Report_${dateFrom}_to_${dateTo}.xlsx`);

    } catch (error) {
      console.error('Export failed:', error);
      alert('فشل تصدير الملف، يرجى المحاولة مرة أخرى.');
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTable = () => {
    const text = filteredData.map(record => {
      const emp = employees.find(e => e.id === record.employeeId);
      return `${emp?.name}\t${record.date}\t${record.workingHours}h`;
    }).join('\n');
    
    navigator.clipboard.writeText(text);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-right">التقارير التحليلية</h1>
          <p className="text-slate-500 font-bold text-sm">استخراج البيانات الميدانية وتحليل مستويات الانضباط</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button 
            onClick={handleCopyTable}
            className="flex-1 sm:flex-none bg-white text-slate-600 px-4 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            {copying ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copying ? 'تم النسخ' : 'نسخ سريع'}</span>
          </button>
          <button 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            تصدير Excel
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95"
          >
            <Printer className="w-4 h-4" /> طباعة
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">من تاريخ</label>
            <input 
              type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 md:px-6 py-3 md:py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 font-bold text-slate-700 text-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">إلى تاريخ</label>
            <input 
              type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 md:px-6 py-3 md:py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 font-bold text-slate-700 text-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">اختيار المركز</label>
            <select 
              value={filterCenter} onChange={(e) => setFilterCenter(e.target.value)}
              className="w-full px-4 md:px-6 py-3 md:py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 font-black text-slate-600 appearance-none cursor-pointer text-sm"
            >
              <option value="">جميع المراكز النشطة</option>
              {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">موظف محدد</label>
            <select 
              value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full px-4 md:px-6 py-3 md:py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/10 font-black text-slate-600 appearance-none cursor-pointer text-sm"
            >
              <option value="">كل الموظفين</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Decision Support Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'معدل الانضباط', value: `${stats.disciplineRate}%`, icon: CheckCircle2, color: 'indigo', detail: 'الحضور في الموعد' },
          { label: 'ساعات العمل', value: `${stats.totalHours}h`, icon: Zap, color: 'amber', detail: 'ساعة محققة' },
          { label: 'إجمالي السجلات', value: stats.activeRecords, icon: Activity, color: 'emerald', detail: 'سجل حضور' },
          { label: 'تأخيرات حرجة', value: stats.criticalDelays, icon: AlertTriangle, color: 'rose', detail: 'تتطلب مراجعة', critical: stats.criticalDelays > 0 }
        ].map((item, i) => (
          <div key={i} className={`${item.critical ? 'bg-rose-600 text-white' : 'bg-white text-slate-900'} p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group`}>
            <div className="relative z-10">
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${item.critical ? 'text-rose-100' : 'text-slate-400'}`}>{item.label}</p>
              <h3 className="text-3xl font-black">{item.value}</h3>
              <div className={`mt-3 flex items-center gap-2 text-[9px] font-black uppercase ${item.critical ? 'text-rose-100' : 'text-slate-500'}`}>
                <item.icon className="w-3.5 h-3.5" /> {item.detail}
              </div>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full ${item.critical ? 'bg-white/10' : 'bg-slate-50'}`}></div>
          </div>
        ))}
      </div>

      {/* Main Data Table View for Desktop / Card View for Mobile */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none">
        <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">سجل البيانات التفصيلي</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">عرض {filteredData.length} سجل للفترة المحددة</p>
          </div>
          <div className="hidden sm:block text-left text-[10px] font-black text-slate-400 uppercase italic">
             Relief Experts Personnel Management
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-right min-w-[1250px] border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف / المركز</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التاريخ</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الحضور (مطلوب/فعلي)</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الانصراف (مطلوب/فعلي)</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">تأخير / مبكر</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الساعات</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ملاحظات الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((record) => {
                const employee = employees.find(e => e.id === record.employeeId);
                const center = centers.find(c => c.id === record.centerId);
                return (
                  <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-[10px]">
                          {employee?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-xs leading-none mb-1">{employee?.name}</p>
                          <p className="text-[9px] text-indigo-600 font-black uppercase tracking-tighter">{center?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-slate-700">{record.date}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 font-bold">مطلوب: {center?.defaultStartTime}</span>
                        <span className={`text-xs font-black ${record.delayMinutes > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '--:--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 font-bold">مطلوب: {center?.defaultEndTime}</span>
                        <span className={`text-xs font-black ${record.earlyDepartureMinutes > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                          {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '--:--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                         <div className="text-center">
                            <p className={`text-xs font-black ${record.delayMinutes > 0 ? 'text-rose-600' : 'text-slate-300'}`}>{record.delayMinutes || 0}د</p>
                            <p className="text-[8px] text-slate-400 font-black uppercase">تأخير</p>
                         </div>
                         <div className="w-px h-6 bg-slate-100"></div>
                         <div className="text-center">
                            <p className={`text-xs font-black ${record.earlyDepartureMinutes > 0 ? 'text-rose-600' : 'text-slate-300'}`}>{record.earlyDepartureMinutes || 0}د</p>
                            <p className="text-[8px] text-slate-400 font-black uppercase">مبكر</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                         <Clock className="w-3 h-3 text-indigo-500" />
                         <span className="text-xs font-black text-slate-700">{record.workingHours}h</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black border uppercase ${
                        record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        record.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {record.status === 'present' ? 'منضبط' : record.status === 'late' ? 'تأخير حضور' : 'سجل معلق'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredData.map((record) => {
            const employee = employees.find(e => e.id === record.employeeId);
            const center = centers.find(c => c.id === record.centerId);
            return (
              <div key={record.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                      {employee?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm leading-tight">{employee?.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-2.5 h-2.5 text-slate-300" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{record.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[8px] font-black border uppercase ${
                    record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    record.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {record.status === 'present' ? 'منضبط' : record.status === 'late' ? 'تأخير' : 'معلق'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest text-right">الحضور</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400">مطلوب: {center?.defaultStartTime}</span>
                      <span className={`text-xs font-black ${record.delayMinutes > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '--:--'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest text-right">الانصراف</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400">مطلوب: {center?.defaultEndTime}</span>
                      <span className={`text-xs font-black ${record.earlyDepartureMinutes > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '--:--'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                       <span className="text-[8px] text-slate-400 font-black uppercase">التأخير</span>
                       <span className={`text-xs font-black ${record.delayMinutes > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{record.delayMinutes || 0}د</span>
                    </div>
                    <div className="w-px h-6 bg-slate-100"></div>
                    <div className="flex flex-col">
                       <span className="text-[8px] text-slate-400 font-black uppercase">خروج مبكر</span>
                       <span className={`text-xs font-black ${record.earlyDepartureMinutes > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{record.earlyDepartureMinutes || 0}د</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-xl text-indigo-600 font-black text-[10px]">
                    <Clock className="w-3.5 h-3.5" /> {record.workingHours}h
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="py-24 text-center text-slate-300 font-bold italic">لا توجد سجلات مطابقة في الفترة المختارة</div>
        )}
      </div>
      
      <style>{`
        @media print {
          body { background: white !important; padding: 0 !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          aside, header, nav, .fixed, button { display: none !important; }
          main, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          .bg-white { border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border: 1px solid #e2e8f0 !important; font-size: 10px !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; text-align: right !important; }
          th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
          @page { size: landscape; margin: 10mm; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
