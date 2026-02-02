
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store.tsx';
import Layout from './components/Layout.tsx';
import AttendancePublic from './pages/AttendancePublic.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Employees from './pages/Employees.tsx';
import CentersPage from './pages/CentersPage.tsx';
import AdminsPage from './pages/AdminsPage.tsx';
import Reports from './pages/Reports.tsx';
import HolidaysPage from './pages/HolidaysPage.tsx';
import NotificationsPage from './pages/NotificationsPage.tsx';
import MessagesPage from './pages/MessagesPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import { ShieldAlert, Settings as SettingsIcon, Lock, Info, UserCheck } from 'lucide-react';
import { INITIAL_ADMINS } from './constants.tsx';

const MainApp: React.FC = () => {
  const { currentUser, setCurrentUser, admins = [] } = useApp();
  const [activePage, setActivePage] = useState('dashboard');
  const [view, setView] = useState<'public' | 'admin' | 'login'>('public');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!currentUser && view === 'admin') {
      setView('public');
    }
  }, [currentUser, view]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const normalizedInput = username.trim().toLowerCase();
    
    // البحث في القائمة الحالية (قاعدة البيانات + الافتراضية)
    let admin = admins.find(a => a.username?.trim().toLowerCase() === normalizedInput);
    
    // خطة بديلة: إذا لم يجد المستخدم في القائمة المحملة، ابحث في الثوابت الافتراضية
    if (!admin) {
      admin = INITIAL_ADMINS.find(a => a.username.toLowerCase() === normalizedInput);
    }
    
    if (admin) {
      if (admin.isBlocked) {
        setError('عذراً، هذا الحساب معطل حالياً من قبل الإدارة العليا.');
        return;
      }
      
      // التحقق من كلمة المرور (مع دعم كلمة المرور الافتراضية '123' كـ fallback للمشرف)
      const isValidPassword = admin.password === password || (admin.username === 'aaltaleb@reliefexperts.org' && password === '123');
      
      if (isValidPassword) {
        setCurrentUser(admin);
        setView('admin');
        setError('');
        setUsername('');
        setPassword('');
      } else {
        setError('كلمة المرور غير صحيحة');
      }
    } else {
      setError('المستخدم غير موجود في سجلات النظام');
    }
  };

  if (view === 'admin' && currentUser) {
    const renderPage = () => {
      switch(activePage) {
        case 'dashboard': return <Dashboard />;
        case 'employees': return <Employees />;
        case 'centers': return <CentersPage />;
        case 'admins': return <AdminsPage />;
        case 'reports': return <Reports />;
        case 'holidays': return <HolidaysPage />;
        case 'notifications': return <NotificationsPage />;
        case 'messages': return <MessagesPage />;
        case 'settings': return <SettingsPage />;
        default: return <Dashboard />;
      }
    };

    return (
      <Layout activePage={activePage} onNavigate={setActivePage}>
        {renderPage()}
      </Layout>
    );
  }

  if (view === 'login' && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-cairo overflow-hidden relative">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/5 -skew-y-12 translate-y-[-50%]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-indigo-600/5 skew-y-12 translate-y-[50%]"></div>

        <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-700">
          <form onSubmit={handleLogin} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] space-y-8 border border-slate-100">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 mb-6">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">دخول الإدارة</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Relief Experts Secure Access</p>
            </div>
            
            {error && (
              <div className={`text-[11px] font-black text-center p-4 rounded-2xl border flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300 ${
                error.includes('معطل') ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mr-5 tracking-widest">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] outline-none font-bold text-slate-700 focus:border-indigo-600 focus:bg-white transition-all text-left" 
                  dir="ltr"
                  placeholder="admin@reliefexperts.org"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mr-5 tracking-widest">كلمة المرور</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] outline-none font-bold text-slate-700 focus:border-indigo-600 focus:bg-white transition-all text-left" 
                  dir="ltr"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.75rem] hover:bg-black transition-all shadow-2xl shadow-slate-200 uppercase text-xs tracking-widest active:scale-95 flex items-center justify-center gap-3">
                <UserCheck className="w-5 h-5" /> دخول النظام
              </button>
              
              <button type="button" onClick={() => setView('public')} className="w-full text-slate-400 font-bold py-2 text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                ← عودة لبوابة الحضور
              </button>
            </div>

            {/* Hint Section */}
            <div className="pt-6 border-t border-slate-50">
               <button 
                 type="button"
                 onClick={() => setShowHint(!showHint)}
                 className="w-full flex items-center justify-center gap-2 text-indigo-600/40 hover:text-indigo-600 font-black text-[10px] uppercase transition-colors"
               >
                 <Info className="w-3.5 h-3.5" /> هل نسيت بيانات الدخول الافتراضية؟
               </button>
               {showHint && (
                 <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                   <p className="text-[10px] font-bold text-indigo-900 leading-relaxed text-center">
                     المستخدم: <span className="font-black select-all">aaltaleb@reliefexperts.org</span><br/>
                     كلمة المرور: <span className="font-black select-all">123</span>
                   </p>
                 </div>
               )}
            </div>
          </form>
          
          <p className="text-center text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] opacity-40">Protected by RELIEF EXPERTS SECURITY</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-8 left-8 z-[100]">
        <button 
          onClick={() => setView('login')}
          className="w-14 h-14 bg-white text-slate-900 rounded-2xl border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.1)] group active:scale-90"
          title="إدارة النظام"
        >
          <SettingsIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-700" />
        </button>
      </div>
      <AttendancePublic />
    </>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <MainApp />
  </AppProvider>
);

export default App;
