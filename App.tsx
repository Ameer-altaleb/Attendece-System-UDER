
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
import { UserRole } from './types.ts';
import { Loader2, ShieldAlert } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, setCurrentUser, admins, isLoading } = useApp();
  const [activePage, setActivePage] = useState('dashboard');
  const [view, setView] = useState<'public' | 'admin' | 'login'>('public');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser && view === 'admin') {
      setView('public');
    }
  }, [currentUser, view]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const normalizedInput = username.trim().toLowerCase();
    const admin = admins.find(a => a.username.trim().toLowerCase() === normalizedInput);
    
    if (admin) {
      if (admin.password === password) {
        setCurrentUser(admin);
        setView('admin');
        setError('');
        setUsername('');
        setPassword('');
      } else {
        setError('كلمة المرور التي أدخلتها غير صحيحة');
      }
    } else {
      setError('اسم المستخدم هذا غير مسجل في النظام');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 font-cairo">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-white font-black text-sm uppercase tracking-widest animate-pulse">جاري جلب بيانات النظام...</p>
      </div>
    );
  }

  if (view === 'login' && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-cairo">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-6 border border-white">
          <div className="text-center">
            <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-3xl mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900">دخول الإدارة</h1>
            <p className="text-slate-400 mt-2 font-bold">استخدم بيانات "المشرف الأعلى" للدخول</p>
          </div>
          
          {error && (
            <div className="text-red-600 text-[11px] font-black text-center bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mr-2 mb-2 uppercase tracking-widest">اسم المستخدم / البريد</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" 
                placeholder="aaltaleb@reliefexperts.org"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mr-2 mb-2 uppercase tracking-widest">كلمة المرور</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 uppercase text-xs tracking-widest">
            تسجيل الدخول
          </button>
          
          <button 
            type="button"
            onClick={() => setView('public')}
            className="w-full text-slate-400 font-bold py-2 hover:text-indigo-600 transition-all text-[11px] uppercase tracking-widest"
          >
            ← العودة لبوابة الحضور العامة
          </button>
        </form>
      </div>
    );
  }

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

  return (
    <>
      <div className="fixed top-6 left-6 z-[100]">
        <button 
          onClick={() => setView('login')}
          className="bg-indigo-600/10 backdrop-blur-md text-indigo-600 px-5 py-2.5 rounded-2xl text-xs font-black border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          لوحة الإدارة
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
