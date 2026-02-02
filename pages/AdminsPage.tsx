
import React, { useState } from 'react';
import { useApp } from '../store';
import { UserCog, Plus, Edit2, Trash2, X, Shield, Key, Mail, User, ShieldCheck, Lock } from 'lucide-react';
import { Admin, UserRole } from '../types';

const AdminsPage: React.FC = () => {
  const { admins, addAdmin, updateAdmin, deleteAdmin, currentUser } = useApp();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setName(''); setUsername(''); setPassword('');
    setModalOpen(true);
  };

  const handleOpenEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setUsername(admin.username);
    setPassword(admin.password || '');
    setModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert("لا يمكن حذف الحساب الذي تستخدمه حالياً لتجنب الخروج من النظام.");
      return;
    }
    if (confirm(`هل أنت متأكد من سحب صلاحية الدخول من: ${name}؟`)) {
      deleteAdmin(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) return;

    const adminData: Admin = {
      id: editingAdmin?.id || Math.random().toString(36).substr(2, 9),
      name,
      username,
      password,
      role: editingAdmin?.role || UserRole.GENERAL_MANAGER,
      managedCenterIds: editingAdmin?.managedCenterIds || []
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
                    <button onClick={() => handleDelete(admin.id, admin.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {admin.id === currentUser?.id && (
                    <div className="p-2 text-indigo-600 bg-white rounded-xl shadow-sm" title="حسابك الحالي">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{admin.name}</h3>
                  {admin.id === currentUser?.id && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black rounded uppercase">أنت</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> {admin.username}
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Key className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Login Credentials</p>
                  <p className="text-xs font-black text-slate-700 tracking-wider">••••••••</p>
                </div>
              </div>
            </div>

            <div className={`px-8 py-4 ${admin.id === currentUser?.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {admin.id === currentUser?.id ? 'Your Active Session' : 'Administrative Access'}
                  </span>
                  {admin.id === currentUser?.id ? (
                    <Lock className="w-3 h-3 text-white/50" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">{editingAdmin ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Access Credentials</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">اسم المستخدم أو البريد الإلكتروني</label>
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
              </div>

              <div className="flex gap-4 pt-4">
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
