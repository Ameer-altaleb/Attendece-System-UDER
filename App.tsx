
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
import { ShieldAlert, Settings as SettingsIcon, Lock } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, setCurrentUser, admins } = useApp();
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
      if (admin.isBlocked) {
        setError('عذراً، هذا الحساب معطل حالياً من قبل الإدارة العليا.');
        return;
      }
      
      if (admin.password === password) {
        setCurrentUser(admin);
        setView('admin');
        setError('');
        setUsername('');
        setPassword('');
      } else {
        setError('كلمة المرور غير صحيحة');
      }
    } else {
      setError('المستخدم غير موجود');
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-cairo">
        <div className="w-full max-w-md space-y-6">
          <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-900">دخول الإدارة</h1>
              <p className="text-slate-400 mt-2 font-bold text-xs uppercase tracking-widest">Admin Control Panel</p>
            </div>
            
            {error && (
              <div className={`text-[11px] font-black text-center p-4 rounded-2xl border flex items-center justify-center gap-2 animate-bounce ${
                error.includes('معطل') ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-red-50 text-red-600 border-red-100'
              }`}>
                {error.includes('معطل') ? <Lock className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />} {error}
              </div>
            )}
            
            <div className="space-y-4">
              <input 
                type="email" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-600 transition-all text-left" 
                dir="ltr"
                placeholder="البريد الإلكتروني"
              />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-indigo-600 transition-all text-left" 
                dir="ltr"
                placeholder="كلمة المرور"
              />
            </div>

            <button className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 uppercase text-xs tracking-widest">
              دخول النظام
            </button>
            
            <button type="button" onClick={() => setView('public')} className="w-full text-slate-400 font-bold py-2 text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors">
              ← عودة لبوابة الحضور
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-8 left-8 z-[100]">
        <button 
          onClick={() => setView('login')}
          className="w-12 h-12 bg-white/10 backdrop-blur-md text-slate-400 rounded-2xl border border-slate-200 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-lg group bg-white shadow-xl"
          title="إعدادات النظام"
        >
          <SettingsIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
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
