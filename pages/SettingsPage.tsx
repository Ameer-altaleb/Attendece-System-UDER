
import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { Settings, Shield, User, Globe, Calendar, Clock, Save, Lock, Smartphone, Monitor, CheckCircle, AlertCircle, Download, Upload, Database, HardDriveDownload } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, currentUser, updateAdmin, centers, employees, admins, attendance, holidays, notifications, templates, importAppData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // System Settings Local State
  const [sysName, setSysName] = useState(settings.systemName);
  const [lang, setLang] = useState(settings.language);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);
  const [timeFormat, setTimeFormat] = useState(settings.timeFormat);
  
  // Account Settings Local State
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

  // Backup Export Logic
  const handleExportBackup = () => {
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      centers,
      employees,
      admins,
      attendance,
      holidays,
      notifications,
      templates,
      settings
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

  // Backup Import Logic
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('تنبيه هام: استعادة النسخة الاحتياطية سيؤدي إلى استبدال كافة البيانات الحالية في النظام. هل أنت متأكد من الاستمرار؟')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          
          // Basic validation to check if it's our backup file
          if (!data.centers || !data.employees || !data.admins) {
            throw new Error('ملف غير صالح');
          }

          importAppData(data);
          triggerSuccess('تمت استعادة النظام بنجاح');
        } catch (err) {
          alert('عذراً، الملف الذي اخترته غير صالح أو تالف.');
        }
      };
      reader.readAsText(file);
    }
    // Clear input
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
        {/* General System Settings */}
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
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">اسم المؤسسة (يظهر في الواجهة العامة)</label>
                <div className="relative">
                  <Settings className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text" required value={sysName} onChange={(e) => setSysName(e.target.value)}
                    className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                    placeholder="مثال: شركة خبراء الإغاثة"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">لغة الواجهة</label>
                  <div className="relative">
                    <Globe className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <select
                      value={lang} onChange={(e) => setLang(e.target.value)}
                      className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-600 appearance-none"
                    >
                      <option value="Arabic">العربية (الافتراضية)</option>
                      <option value="English">English</option>
                      <option value="Turkish">Türkçe</option>
                    </select>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">تنسيق الوقت</label>
                  <div className="relative">
                    <Clock className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <select
                      value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)}
                      className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-600 appearance-none"
                    >
                      <option value="HH:mm">نظام 24 ساعة (14:30)</option>
                      <option value="hh:mm a">نظام 12 ساعة (02:30 PM)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">تنسيق التاريخ</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <select
                    value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-600 appearance-none"
                  >
                    <option value="YYYY-MM-DD">السنة / الشهر / اليوم</option>
                    <option value="DD/MM/YYYY">اليوم / الشهر / السنة</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={isSavingSystem}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
            >
              {isSavingSystem ? 'جاري الحفظ...' : <><Save className="w-4 h-4" /> حفظ إعدادات النظام</>}
            </button>
          </form>

          {/* Backup & Restore Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5" />
               </div>
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">مركز النسخ الاحتياطي</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button
                 type="button"
                 onClick={handleExportBackup}
                 className="flex flex-col items-center gap-3 p-6 bg-indigo-50 border-2 border-dashed border-indigo-100 rounded-[2rem] hover:bg-indigo-100 hover:border-indigo-200 transition-all group"
               >
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                   <HardDriveDownload className="w-6 h-6" />
                 </div>
                 <div className="text-center">
                   <p className="text-sm font-black text-indigo-900">تصدير نسخة احتياطية</p>
                   <p className="text-[10px] text-indigo-500 font-bold">Download JSON File</p>
                 </div>
               </button>

               <button
                 type="button"
                 onClick={handleImportClick}
                 className="flex flex-col items-center gap-3 p-6 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] hover:bg-slate-100 hover:border-slate-200 transition-all group"
               >
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition-transform">
                   <Upload className="w-6 h-6" />
                 </div>
                 <div className="text-center">
                   <p className="text-sm font-black text-slate-900">استعادة من ملف</p>
                   <p className="text-[10px] text-slate-500 font-bold">Upload JSON Backup</p>
                 </div>
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 accept=".json" 
                 className="hidden" 
               />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-bold leading-relaxed">
                يتم حفظ البيانات حالياً في ذاكرة المتصفح المحلية. يوصى بشدة بتصدير نسخة احتياطية دورياً وحفظها في مكان آمن (مثل Google Drive) لضمان عدم فقدان السجلات.
              </p>
            </div>
          </div>
        </div>

        {/* Account & Security Settings */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4">
             <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
             </div>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">أمان حسابك الشخصي</h3>
          </div>

          <form onSubmit={handleSaveAccount} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">الاسم الكامل (للمدير)</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)}
                    className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">اسم المستخدم / البريد</label>
                <div className="relative">
                  <Smartphone className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text" required value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-slate-800">
                  <Lock className="w-4 h-4 text-indigo-600" /> تحديث كلمة المرور
                </h4>
                <div className="group">
                  <input
                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="اتركها فارغة إذا لم ترد التغيير"
                    className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold">
                   <AlertCircle className="w-3.5 h-3.5" /> يفضل استخدام كلمة مرور معقدة تحتوي على رموز وأرقام.
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={isSavingAccount}
              className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
            >
              {isSavingAccount ? 'جاري التحديث...' : <><Shield className="w-4 h-4" /> تحديث بيانات الأمان</>}
            </button>
          </form>

          {/* Session Info */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">تفاصيل الجلسة الحالية</h4>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-500">رتبة الوصول</span>
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-tighter border border-indigo-100">
                      {currentUser?.role.replace('_', ' ')}
                   </span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-500">تاريخ الدخول</span>
                   <span className="text-xs font-black text-slate-800">اليوم - {new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-500">حالة الربط</span>
                   <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase">
                      <CheckCircle className="w-3.5 h-3.5" /> مؤمنة بالكامل
                   </span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
