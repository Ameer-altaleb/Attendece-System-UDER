
import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { Settings, Shield, User, Globe, Calendar, Clock, Save, Lock, Smartphone, Monitor, CheckCircle, AlertCircle, Download, Upload, Database, HardDriveDownload } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, currentUser, updateAdmin, centers, employees, admins, attendance, holidays, notifications, templates, importAppData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sysName, setSysName] = useState(settings.systemName);
  const [lang, setLang] = useState(settings.language);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);
  const [timeFormat, setTimeFormat] = useState(settings.timeFormat);
  
  const [adminName, setAdminName] = useState(currentUser?.name || '');
  const [adminUsername, setAdminUsername] = useState(currentUser?.username || '');
  const [newPassword, setNewPassword] = useState('');
  
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSystem(true);
    setTimeout(() => {
      updateSettings({
        systemName: sysName,
        language: lang,
        dateFormat: dateFormat,
        timeFormat: timeFormat
      });
      setIsSavingSystem(false);
      triggerSuccess('تم حفظ إعدادات النظام بنجاح');
    }, 800);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingAccount(true);
    setTimeout(() => {
      updateAdmin({
        ...currentUser,
        name: adminName,
        username: adminUsername,
        password: newPassword || currentUser.password
      });
      setIsSavingAccount(false);
      setNewPassword('');
      triggerSuccess('تم تحديث بيانات الحساب والأمان');
    }, 800);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      centers, employees, admins, attendance, holidays, notifications, templates, settings
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerSuccess('تم تصدير النسخة الاحتياطية بنجاح');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (confirm('استعادة النسخة الاحتياطية ستبدل البيانات الحالية. هل أنت متأكد؟')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          if (!data.centers || !data.employees) throw new Error('Invalid file');
          importAppData(data);
          triggerSuccess('تمت استعادة النظام بنجاح');
        } catch (err) { alert('الملف غير صالح.'); }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const triggerSuccess = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إعدادات النظام</h1>
          <p className="text-slate-500 font-bold">تخصيص البيئة التشغيلية وإدارة أمان حسابك الشخصي</p>
        </div>
      </div>

      {saveStatus && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 font-black text-sm">
          <CheckCircle className="w-5 h-5" /> {saveStatus}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Monitor className="w-5 h-5" />
             </div>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">التخصيص العام للنظام</h3>
          </div>
          
          <form onSubmit={handleSaveSystem} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">اسم المؤسسة</label>
                <div className="relative">
                  <Settings className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text" required value={sysName} onChange={(e) => setSysName(e.target.value)}
                    className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">لغة الواجهة</label>
                  <select
                    value={lang} onChange={(e) => setLang(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-600 appearance-none"
                  >
                    <option value="Arabic">العربية</option>
                    <option value="English">English</option>
                  </select>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">تنسيق الوقت</label>
                  <select
                    value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-600 appearance-none"
                  >
                    <option value="HH:mm">نظام 24 ساعة</option>
                    <option value="hh:mm a">نظام 12 ساعة</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSavingSystem} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50">
              {isSavingSystem ? 'جاري الحفظ...' : <><Save className="w-4 h-4" /> حفظ إعدادات النظام</>}
            </button>
          </form>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">النسخ الاحتياطي</h3>
            <div className="grid grid-cols-2 gap-4">
               <button onClick={handleExportBackup} className="flex flex-col items-center gap-2 p-6 bg-indigo-50 border-2 border-dashed border-indigo-100 rounded-[2rem] hover:bg-indigo-100 transition-all">
                 <HardDriveDownload className="w-6 h-6 text-indigo-600" />
                 <span className="text-xs font-black text-indigo-900">تصدير بيانات</span>
               </button>
               <button onClick={handleImportClick} className="flex flex-col items-center gap-2 p-6 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] hover:bg-slate-100 transition-all">
                 <Upload className="w-6 h-6 text-slate-600" />
                 <span className="text-xs font-black text-slate-900">استيراد من ملف</span>
               </button>
               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4">
             <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
             </div>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">أمان حسابك</h3>
          </div>

          <form onSubmit={handleSaveAccount} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">الاسم</label>
                <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold text-slate-700" />
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">اسم المستخدم</label>
                <input type="text" required value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold text-slate-700 text-left" dir="ltr" />
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">كلمة مرور جديدة</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="اتركها فارغة لعدم التغيير" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold text-slate-700" />
              </div>
            </div>
            <button type="submit" disabled={isSavingAccount} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50">
              {isSavingAccount ? 'جاري التحديث...' : <><Shield className="w-4 h-4" /> تحديث الحساب</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
