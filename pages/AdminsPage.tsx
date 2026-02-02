
import React, { useState } from 'react';
import { useApp } from '../store';
import { UserCog, Plus, Edit2, Trash2, X, Shield, Key, Mail, User, ShieldCheck, Lock, Building2, Check } from 'lucide-react';
import { Admin, UserRole } from '../types';

const AdminsPage: React.FC = () => {
  const { admins, addAdmin, updateAdmin, deleteAdmin, currentUser, centers } = useApp();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CENTER_MANAGER);
  const [managedCenterIds, setManagedCenterIds] = useState<string[]>([]);

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setName(''); setUsername(''); setPassword(''); setRole(UserRole.CENTER_MANAGER); setManagedCenterIds([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setUsername(admin.username);
    setPassword(admin.password || '');
    setRole(admin.role);
    setManagedCenterIds(admin.managedCenterIds || []);
    setModalOpen(true);
  };

  const toggleCenter = (id: string) => {
    setManagedCenterIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) return;

    const adminData: Admin = {
      id: editingAdmin?.id || Math.random().toString(36).substr(2, 9),
      name,
      username,
      password,
      role,
      managedCenterIds: role === UserRole.SUPER_ADMIN ? [] : managedCenterIds
    };

    if (editingAdmin) {
      updateAdmin(adminData);
    } else {
      addAdmin(adminData);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">صلاحيات الوصول</h1>
          <p className="text-slate-500 font-bold">إدارة الحسابات المصرح لها بدخول لوحة الإدارة والتحكم في النظام</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> إضافة حساب جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {admins.map((admin) => (
          <div key={admin.id} className={`bg-white rounded-[2.5rem] shadow-sm border transition-all group overflow-hidden ${
            admin.id === currentUser?.id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-100'
          }`}>
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:rotate-6 ${
                   admin.id === currentUser?.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <Shield className="w-7 h-7" />
                </div>
                <div className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button onClick={() => handleOpenEdit(admin)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {admin.id !== currentUser?.id && (
                    <button onClick={() => deleteAdmin(admin.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-900">{admin.name}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> {admin.username}
                </p>
                <div className="mt-2">
                  <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase border border-slate-200">
                    {admin.role === UserRole.SUPER_ADMIN ? 'Super Admin' : admin.role === UserRole.GENERAL_MANAGER ? 'General Manager' : 'Center Manager'}
                  </span>
                </div>
              </div>

              {admin.role !== UserRole.SUPER_ADMIN && (
                <div className="space-y-3">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المراكز المسؤولة ({admin.managedCenterIds?.length || 0})</p>
                   <div className="flex flex-wrap gap-1">
                      {admin.managedCenterIds?.map(cid => (
                        <span key={cid} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg border border-indigo-100 flex items-center gap-1">
                           <Building2 className="w-2.5 h-2.5" /> {centers.find(c => c.id === cid)?.name || 'Unknown'}
                        </span>
                      ))}
                      {(!admin.managedCenterIds || admin.managedCenterIds.length === 0) && (
                        <span className="text-[10px] text-slate-400 font-bold italic">لا يوجد مراكز مخصصة</span>
                      )}
                   </div>
                </div>
              )}
            </div>

            <div className={`px-8 py-4 ${admin.id === currentUser?.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {admin.id === currentUser?.id ? 'Your Active Session' : 'Administrative Access'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">{editingAdmin ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Access Credentials</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">الاسم بالكامل</label>
                    <div className="relative">
                      <User className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="text" required value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                        placeholder="اسم صاحب الصلاحية"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">اسم المستخدم / البريد</label>
                    <div className="relative">
                      <Mail className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                        className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700 text-left"
                        dir="ltr"
                        placeholder="username / email"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">كلمة السر</label>
                    <div className="relative">
                      <Key className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="text" required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                        placeholder="كلمة مرور الدخول"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">نوع الحساب</label>
                    <select
                      value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-600 appearance-none"
                    >
                      <option value={UserRole.SUPER_ADMIN}>مشرف أعلى (Full Access)</option>
                      <option value={UserRole.GENERAL_MANAGER}>مدير عام (Region Manager)</option>
                      <option value={UserRole.CENTER_MANAGER}>مدير مركز (Site Manager)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">المراكز المخصصة للتحكم</label>
                  <div className={`p-4 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-2 max-h-[300px] overflow-y-auto ${role === UserRole.SUPER_ADMIN ? 'opacity-40 pointer-events-none' : ''}`}>
                    {role === UserRole.SUPER_ADMIN ? (
                      <p className="text-[10px] font-black text-slate-400 italic text-center py-10 uppercase">Super Admins have access to all centers automatically</p>
                    ) : (
                      centers.map(center => (
                        <button
                          key={center.id}
                          type="button"
                          onClick={() => toggleCenter(center.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                            managedCenterIds.includes(center.id) 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className={`w-4 h-4 ${managedCenterIds.includes(center.id) ? 'text-white' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold">{center.name}</span>
                          </div>
                          {managedCenterIds.includes(center.id) && <Check className="w-4 h-4" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <button type="submit" className="flex-2 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex-grow uppercase text-xs tracking-widest">
                  {editingAdmin ? 'تحديث الصلاحية' : 'إضافة الصلاحية'}
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

export default AdminsPage;