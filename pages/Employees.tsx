
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { 
  UserPlus, Search, Filter, Edit2, Trash2, RotateCcw, X, 
  ShieldCheck, ShieldAlert, Download, Building2, Clock,
  Power, PowerOff, FileSpreadsheet, Fingerprint, Building
} from 'lucide-react';
import { Employee } from '../types';
import { normalizeArabic } from '../utils/attendanceLogic';

const Employees: React.FC = () => {
  const { employees, centers, addEmployee, updateEmployee, deleteEmployee, settings } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCenterId, setFilterCenterId] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [centerId, setCenterId] = useState('');
  const [workingHours, setWorkingHours] = useState(8);
  const [isActive, setIsActive] = useState(true);

  const handleExport = () => {
    const activeEmps = employees.filter(e => {
        const matchesSearch = normalizeArabic(e.name).includes(normalizeArabic(searchTerm));
        const matchesCenter = filterCenterId === '' || e.centerId === filterCenterId;
        return matchesSearch && matchesCenter;
    });

    const headers = ['Employee Code', 'Name', 'Center', 'Status', 'Daily Hours', 'Joined Date'];
    const rows = activeEmps.map(e => [
      e.code, e.name, centers.find(c => c.id === e.centerId)?.name || 'Unknown',
      e.isActive ? 'Active' : 'Inactive', e.workingHours, e.joinedDate
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null); setName(''); setCode(''); setCenterId(''); setWorkingHours(8); setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp); setName(emp.name); setCode(emp.code || '');
    setCenterId(emp.centerId); setWorkingHours(emp.workingHours); setIsActive(emp.isActive);
    setModalOpen(true);
  };

  const toggleEmployeeStatus = (emp: Employee) => {
    updateEmployee({ ...emp, isActive: !emp.isActive });
  };

  const handleResetDevice = (emp: Employee) => {
    if (confirm(`تحذير أمني: هل أنت متأكد من فك ارتباط الجهاز للموظف (${emp.name})؟\nسيتمكن الموظف من التسجيل من جهاز جديد في المرة القادمة.`)) {
      updateEmployee({ ...emp, deviceId: undefined });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !centerId || !code) return;
    if (editingEmployee) {
      updateEmployee({ ...editingEmployee, name, code, centerId, workingHours, isActive });
    } else {
      addEmployee({
        id: Math.random().toString(36).substr(2, 9),
        code, name, centerId, workingHours,
        joinedDate: new Date().toISOString().split('T')[0],
        isActive
      });
    }
    setModalOpen(false);
  };

  const groupedEmployees = useMemo(() => {
    const filtered = employees.filter(e => {
      const searchNormalized = normalizeArabic(searchTerm);
      const nameNormalized = normalizeArabic(e.name);
      const codeMatches = (e.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameNormalized.includes(searchNormalized) || codeMatches;
      const matchesCenter = filterCenterId === '' || e.centerId === filterCenterId;
      return matchesSearch && matchesCenter;
    });

    const groups: { [key: string]: Employee[] } = {};
    filtered.forEach(emp => {
      if (!groups[emp.centerId]) groups[emp.centerId] = [];
      groups[emp.centerId].push(emp);
    });

    return Object.entries(groups).map(([cId, emps]) => ({
      center: centers.find(c => c.id === cId),
      employees: emps.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
    })).sort((a, b) => (a.center?.name || '').localeCompare(b.center?.name || '', 'ar'));
  }, [employees, centers, searchTerm, filterCenterId]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">سجل القوى الميدانية</h1>
          <p className="text-slate-500 font-bold text-sm">تنظيم الكوادر، إدارة الأمان، وحالة النشاط</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
           <button onClick={handleExport} className="bg-white text-slate-600 px-6 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
             <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> تصدير CSV
           </button>
           <button onClick={handleOpenAdd} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
             <UserPlus className="w-4 h-4" /> إضافة موظف
           </button>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2 group">
          <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text" placeholder="البحث بالاسم أو الرمز..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:bg-white transition-all font-bold text-slate-700 text-sm"
          />
        </div>
        <div className="relative group">
          <Filter className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <select value={filterCenterId} onChange={(e) => setFilterCenterId(e.target.value)}
            className="w-full pr-12 pl-4 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:bg-white transition-all font-black text-slate-600 appearance-none text-sm"
          >
            <option value="">كل المراكز</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-10">
        {groupedEmployees.map(({ center, employees: centerEmps }) => (
          <div key={center?.id} className="space-y-4">
            <div className="flex items-center gap-3 px-2 md:px-6">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
                 <Building2 className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">{center?.name || 'بدون مركز'}</h3>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{centerEmps.length} موظف</p>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-slate-100 mr-4"></div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">حالة الأمان</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الحالة</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ساعات العمل</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {centerEmps.map((emp) => (
                      <tr key={emp.id} className={`hover:bg-slate-50/30 transition-colors group ${!emp.isActive ? 'opacity-50 grayscale' : ''}`}>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 overflow-hidden ${emp.isActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-100 border-slate-200'}`}>
                              {settings.logoUrl ? (
                                <img src={settings.logoUrl} alt="Org Logo" className="w-full h-full object-contain p-1.5" />
                              ) : (
                                <Building className={`w-5 h-5 ${emp.isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-sm leading-none mb-1">{emp.name}</p>
                              <p className="text-[9px] text-indigo-600 font-black uppercase tracking-tighter">الرمز: {emp.code || 'بدون رمز'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          {emp.deviceId ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-100 uppercase">
                              <ShieldCheck className="w-3.5 h-3.5" /> مقترن
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black border border-amber-100 uppercase">
                              <ShieldAlert className="w-3.5 h-3.5" /> غير مقترن
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border uppercase ${emp.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                            {emp.isActive ? 'نشط' : 'متوقف'}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-center">
                           <span className="text-slate-700 font-black text-xs">{emp.workingHours}h</span>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => toggleEmployeeStatus(emp)} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${emp.isActive ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-rose-600 bg-rose-50 hover:bg-rose-100'}`}>
                              {emp.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleResetDevice(emp)} className="w-9 h-9 flex items-center justify-center text-amber-600 bg-amber-50 rounded-xl transition-all hover:bg-amber-100"><RotateCcw className="w-4 h-4" /></button>
                            <button onClick={() => handleOpenEdit(emp)} className="w-9 h-9 flex items-center justify-center text-indigo-600 bg-indigo-50 rounded-xl transition-all hover:bg-indigo-100"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteEmployee(emp.id)} className="w-9 h-9 flex items-center justify-center text-rose-600 bg-rose-50 rounded-xl transition-all hover:bg-rose-100"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden grid grid-cols-1 gap-4">
              {centerEmps.map((emp) => (
                <div key={emp.id} className={`bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4 ${!emp.isActive ? 'grayscale opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border overflow-hidden ${emp.isActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-100 border-slate-200'}`}>
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Org Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building className={`w-4 h-4 ${emp.isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm leading-tight mb-0.5">{emp.name}</p>
                        <p className="text-[9px] text-indigo-600 font-black uppercase tracking-tighter">الرمز: {emp.code}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleOpenEdit(emp)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-rose-600 bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-slate-50 py-3">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">الأمان</p>
                      <span className={`text-[9px] font-black uppercase ${emp.deviceId ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {emp.deviceId ? 'مقترن' : 'مفتوح'}
                      </span>
                    </div>
                    <div className="text-center border-x border-slate-50">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">الحالة</p>
                      <span className={`text-[9px] font-black uppercase ${emp.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {emp.isActive ? 'نشط' : 'متوقف'}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">ساعات</p>
                      <span className="text-slate-700 font-black text-[9px]">{emp.workingHours}h</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => toggleEmployeeStatus(emp)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${emp.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100'}`}>
                      {emp.isActive ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                      {emp.isActive ? 'إيقاف' : 'تفعيل'}
                    </button>
                    <button onClick={() => handleResetDevice(emp)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase border text-amber-700 bg-amber-50 border-amber-100">
                      <RotateCcw className="w-3 h-3" /> تصفير
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20 my-auto">
            <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-black text-slate-900">{editingEmployee ? 'تحديث بيانات الموظف' : 'تسجيل كادر جديد'}</h3>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{settings.systemName}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2">الاسم الثلاثي</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-700" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2">رمز الموظف</label>
                  <div className="relative">
                    <Fingerprint className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-black text-slate-700 uppercase" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2">المركز</label>
                  <select required value={centerId} onChange={(e) => setCenterId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white font-black text-slate-600 appearance-none">
                    <option value="">-- اختر --</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="submit" className="flex-2 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex-grow uppercase text-xs tracking-widest">{editingEmployee ? 'تحديث' : 'تثبيت'}</button>
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
