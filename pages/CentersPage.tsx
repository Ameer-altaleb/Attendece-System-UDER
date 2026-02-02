
import React, { useState } from 'react';
import { useApp } from '../store';
// Added missing icon Users to the imports list
import { Building2, Plus, Edit2, Trash2, X, Clock, ShieldCheck, Wifi, MapPin, Users } from 'lucide-react';
import { Center } from '../types';

const CentersPage: React.FC = () => {
  const { centers, employees, addCenter, updateCenter, deleteCenter } = useApp();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);

  const [name, setName] = useState('');
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('16:00');
  const [ip, setIp] = useState('');

  const handleOpenAdd = () => {
    setEditingCenter(null);
    setName(''); setStart('08:00'); setEnd('16:00'); setIp('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Center) => {
    setEditingCenter(c);
    setName(c.name); setStart(c.defaultStartTime); setEnd(c.defaultEndTime); setIp(c.authorizedIP || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (editingCenter) {
      updateCenter({ ...editingCenter, name, defaultStartTime: start, defaultEndTime: end, authorizedIP: ip });
    } else {
      addCenter({
        id: Math.random().toString(36).substr(2, 9),
        name, defaultStartTime: start, defaultEndTime: end, authorizedIP: ip
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة المراكز الميدانية</h1>
          <p className="text-slate-500 font-bold">تحديد مواقع التشغيل، قيود الشبكة، والمواعيد الرسمية لكل فرع</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> إضافة مركز تشغيل
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {centers.map((center) => {
          const activeEmps = employees.filter(e => e.centerId === center.id).length;
          return (
            <div key={center.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:translate-y-[-4px] transition-all group overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-2xl">
                    <button onClick={() => handleOpenEdit(center)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCenter(center.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-1">{center.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-8">
                  <MapPin className="w-3 h-3 text-indigo-500" /> Authorized Operational Unit
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Clock className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Shift Window</p>
                        <p className="text-xs font-black text-slate-800 tracking-widest">{center.defaultStartTime} - {center.defaultEndTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Network Restriction</p>
                        <p className="text-xs font-black text-slate-800 truncate max-w-[150px]">{center.authorizedIP || 'No Restriction'}</p>
                      </div>
                    </div>
                    {center.authorizedIP && (
                       <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded uppercase">IP Locked</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Users className="w-4 h-4 text-slate-400" />
                   <span className="text-xs font-black text-slate-600">{activeEmps} موظف نشط</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">{editingCenter ? 'تعديل بيانات المركز' : 'فتح وحدة تشغيل جديدة'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Operational Center Settings</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">مسمى المركز</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                    placeholder="اسم المركز أو الفرع"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">وقت بدء العمل</label>
                    <input
                      type="time"
                      required
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-700"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">وقت نهاية العمل</label>
                    <input
                      type="time"
                      required
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-700"
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">تقييد الشبكة (IP Address)</label>
                  <div className="relative">
                     <Wifi className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                     <input
                      type="text"
                      placeholder="اتركه فارغاً لفتح الوصول"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-700 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-2 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex-grow uppercase text-xs tracking-widest">
                  Save Center Data
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentersPage;
