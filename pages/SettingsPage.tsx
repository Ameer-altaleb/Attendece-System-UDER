
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../store.tsx';
import { 
  Settings, Shield, User, Globe, Clock, Save, Lock, 
  Smartphone, Monitor, CheckCircle, Upload, Database, HardDriveDownload, 
  RotateCcw, Trash2, ShieldCheck, ShieldAlert, Zap, Activity, ImageIcon, X
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { 
    settings, updateSettings, currentUser, updateAdmin, 
    centers, employees, admins, attendance, holidays, 
    notifications, templates, importAppData, updateEmployee,
    attendance: allAttendance
  } = useApp();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [sysName, setSysName] = useState(settings.systemName);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [lang, setLang] = useState(settings.language);
  const [timeFormat, setTimeFormat] = useState(settings.timeFormat);
  
  const [adminName, setAdminName] = useState(currentUser?.name || '');
  const [adminUsername, setAdminUsername] = useState(currentUser?.username || '');
  const [newPassword, setNewPassword] = useState('');
  
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const systemStats = useMemo(() => ({
    totalRecords: allAttendance.length,
    activeEmployees: employees.filter(e => e.isActive).length,
    linkedDevices: employees.filter(e => !!e.deviceId).length,
    dbSizeEstimate: (JSON.stringify({centers, employees, attendance}).length / 1024).toFixed(2)
  }), [allAttendance, employees, centers, attendance]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSystem(true);
    setTimeout(() => {
      updateSettings({ ...settings, systemName: sysName, logoUrl, language: lang, timeFormat });
      setIsSavingSystem(false);
      triggerSuccess('تم حفظ إعدادات النظام بنجاح');
    }, 800);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingAccount(true);
    setTimeout(() => {
      updateAdmin({ ...currentUser, name: adminName, username: adminUsername, password: newPassword || currentUser.password });
      setIsSavingAccount(false);
      setNewPassword('');
      triggerSuccess('تم تحديث بيانات الحساب والأمان');
    }, 800);
  };

  const handleExportBackup = () => {
    const backupData = {
      appName: "Relief Experts Management System",
      version: "2.0",
      timestamp: new Date().toISOString(),
      data: { centers, employees, admins, attendance, holidays, notifications, templates, settings }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `System_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    triggerSuccess('تم إنشاء النسخة الاحتياطية بنجاح');
  };

  const triggerSuccess = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {saveStatus && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-8 py-4 rounded-3xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-500 font-black text-sm border border-white/20">
          <CheckCircle className="w-5 h-5" /> {saveStatus}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
            <Zap className="w-3.5 h-3.5 text-indigo-600 fill-current" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">System Control Center</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">إعدادات النظام الذكي</h1>
          <p className="text-slate-500 font-bold">إدارة الهوية، النسخ الاحتياطي، والأدوات الإدارية المتقدمة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center">
                 <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">هوية وتخصيص النظام</h3>
                <p className="text-xs text-slate-400 font-bold">تغيير المسمى العام وتنسيقات الوقت واللغة والشعار</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveSystem} className="space-y-8">
              <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">شعار المنظمة المعتمد</label>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                      {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" /> : <ImageIcon className="w-10 h-10 text-slate-300" />}
                    </div>
                    {logoUrl && <button type="button" onClick={() => setLogoUrl('')} className="absolute -top-2 -left-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg"><X className="w-4 h-4" /></button>}
                  </div>
                  <div className="flex-1 space-y-3">
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-xs text-slate-600 hover:border-indigo-600 transition-all shadow-sm">
                      <Upload className="w-4 h-4 inline-block ml-2" /> رفع شعار جديد
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">يفضل استخدام صورة مربعة بخلفية شفافة (PNG).</p>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mr-4 tracking-widest">اسم المنظمة / النظام</label>
                  <input type="text" required value={sysName} onChange={(e) => setSysName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-700" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mr-4 tracking-widest">لغة الواجهة الرئيسية</label>
                  <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 font-black text-slate-600">
                    <option value="Arabic">العربية (الأصيلة)</option>
                    <option value="English">English (Global)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mr-4 tracking-widest">تنسيق عرض الوقت</label>
                  <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 font-black text-slate-600">
                    <option value="HH:mm">نظام 24 ساعة (عسكري)</option>
                    <option value="hh:mm a">نظام 12 ساعة (صباحاً/مساءً)</option>
                  </select>
                </div>
                <div className="flex items-end">
                   <button type="submit" disabled={isSavingSystem} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50">
                    {isSavingSystem ? 'جاري الحفظ...' : <><Save className="w-4 h-4" /> حفظ التغييرات</>}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-[1.25rem] flex items-center justify-center">
                 <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">أمان وخصوصية الحساب</h3>
                <p className="text-xs text-slate-400 font-bold">إدارة بيانات الدخول الخاصة بك كمدير للنظام</p>
              </div>
            </div>
            <form onSubmit={handleSaveAccount} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">الاسم</label><input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700" /></div>
                <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">البريد</label><input type="text" required dir="ltr" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 text-left" /></div>
                <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">كلمة سر جديدة</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="اختياري" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700" /></div>
                <div className="flex items-end"><button type="submit" disabled={isSavingAccount} className="w-full bg-rose-600 text-white font-black py-4 rounded-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50">تحديث الأمان</button></div>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <Database className="w-12 h-12" />
              <div className="space-y-2"><h3 className="text-2xl font-black tracking-tight">النسخ الاحتياطي</h3><p className="text-xs text-indigo-100 font-bold leading-relaxed">قم بإنشاء نسخة كاملة من النظام لاستعادتها في أي وقت.</p></div>
              <button onClick={handleExportBackup} className="w-full flex items-center justify-center gap-3 bg-white text-indigo-600 font-black py-5 rounded-[1.75rem] hover:bg-indigo-50 transition-all shadow-lg active:scale-95"><HardDriveDownload className="w-6 h-6" /> تصدير نسخة شاملة</button>
            </div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between"><h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">إحصائيات</h3><Activity className="w-4 h-4 text-emerald-500" /></div>
            <div className="space-y-6">
               <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600">السجلات</span><span className="text-sm font-black text-slate-900">{systemStats.totalRecords}</span></div>
               <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600">الأجهزة المرتبطة</span><span className="text-sm font-black text-slate-900">{systemStats.linkedDevices}</span></div>
               <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600">حجم الملف</span><span className="text-sm font-black text-indigo-600">{systemStats.dbSizeEstimate} KB</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
