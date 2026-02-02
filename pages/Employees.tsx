
import React, { useState } from 'react';
import { useApp } from '../store';
import { UserPlus, Search, Filter, Edit2, Trash2, RotateCcw, X, ShieldCheck, ShieldAlert, Download, Building2, Clock } from 'lucide-react';
import { Employee } from '../types';
import { normalizeArabic } from '../utils/attendanceLogic';

const Employees: React.FC = () => {
  const { employees, centers, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCenterId, setFilterCenterId] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [name, setName] = useState('');
  const [centerId, setCenterId] = useState('');
  const [workingHours, setWorkingHours] = useState(8);

  const filteredEmployees = employees
    .filter(e => {
      const searchNormalized = normalizeArabic(searchTerm);
      const nameNormalized = normalizeArabic(e.name);
      return nameNormalized.includes(searchNormalized);
    })
    .filter(e => filterCenterId === '' || e.centerId === filterCenterId)
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setName('');
    setCenterId('');
    setWorkingHours(8);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setCenterId(emp.centerId);
    setWorkingHours(emp.workingHours);
    setModalOpen(true);
  };

  const handleResetDevice = (emp: Employee) => {
    if (confirm(`تحذير أمني: هل أنت متأكد من فك ارتباط الجهاز للموظف (${emp.name})؟\nسيتمكن الموظف من التسجيل من جهاز جديد في المرة القادمة.`)) {
      updateEmployee({ ...emp, deviceId: undefined });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !centerId) return;
    if (editingEmployee) {
      updateEmployee({ ...editingEmployee, name, centerId, workingHours });
    } else {
      addEmployee({
        id: Math.random().toString(36).substr(2, 9),
        name, centerId, workingHours,
        joinedDate: new Date().toISOString().split('T')[0]
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">سجل الموظفين المعتمدين</h1>
          <p className="text-slate-500 font-bold">إدارة بيانات الكوادر والتحكم في صلاحيات الوصول المرتبطة بالأجهزة</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-white text-slate-600 px-6 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
             <Download className="w-4 h-4" /> تصدير البيانات
           </button>
           <button
             onClick={handleOpenAdd}
             className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
           >
             <UserPlus className="w-4 h-4" /> إضافة موظف جديد
           </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2 group">
          <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="البحث بالاسم (مثال: احمد او أحمد)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:bg-white transition-all font-bold text-slate-700"
          />
        </div>
        <div className="relative group">
          <Filter className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <select
            value={filterCenterId}
            onChange={(e) => setFilterCenterId(e.target.value)}
            className="w-full pr-12 pl-4 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:bg-white transition-all font-black text-slate-600 appearance-none"
          >
            <option value="">جميع المراكز التشغيلية</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">مركز العمل</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">حالة الأمان والربط</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المعدل اليومي</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => {
                const center = centers.find(c => c.id === emp.centerId);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100 group-hover:scale-105 transition-transform">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm leading-none mb-1">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {emp.id.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-600 font-bold text-xs">{center?.name || 'مركز غير معروف'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center">
                        {emp.deviceId ? (
                          <div className="flex flex-col items-center gap-1 group/badge cursor-help">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 uppercase">
                              <ShieldCheck className="w-3.5 h-3.5" /> الجهاز مقفل
                            </span>
                            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">Identity Binding Active</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black border border-amber-100 uppercase">
                              <ShieldAlert className="w-3.5 h-3.5" /> بانتظار التحقق
                            </span>
                            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">Device Not Registered</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-black text-xs">{emp.workingHours} ساعة</span>
                        <div className="w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                           <div className="h-full bg-indigo-600 rounded-full" style={{width: `${(emp.workingHours/12)*100}%`}}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        {emp.deviceId && (
                          <button onClick={() => handleResetDevice(emp)} className="w-9 h-9 flex items-center justify-center text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all" title="فك ارتباط الجهاز">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleOpenEdit(emp)} className="w-9 h-9 flex items-center justify-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all" title="تعديل البيانات">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteEmployee(emp.id)} className="w-9 h-9 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">{editingEmployee ? 'تحديث السجل' : 'إضافة موظف جديد'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Employee Data Entry</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">اسم الموظف الكامل</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                    placeholder="الاسم الثلاثي كما في الهوية"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">تعيين المركز الميداني</label>
                  <select
                    required
                    value={centerId}
                    onChange={(e) => setCenterId(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-600 appearance-none"
                  >
                    <option value="">-- اختر مركز العمل --</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">الساعات التعاقدية (يومياً)</label>
                  <div className="relative">
                     <Clock className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                     <input
                      type="number"
                      required
                      min="1" max="24"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(Number(e.target.value))}
                      className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-700"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-2 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex-grow uppercase text-xs tracking-widest">
                  {editingEmployee ? 'تحديث البيانات' : 'تسجيل الموظف'}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
