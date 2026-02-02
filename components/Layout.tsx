
import React, { useState } from 'react';
import { useApp } from '../store.tsx';
import { UserRole } from '../types.ts';
import { 
  Building2, Users, UserCog, BarChart3, 
  Calendar, Bell, MessageSquare, Settings, 
  LogOut, Menu, X, LayoutDashboard, ChevronLeft, ShieldCheck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const { currentUser, setCurrentUser } = useApp();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) return null;

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.GENERAL_MANAGER, UserRole.CENTER_MANAGER] },
    { id: 'centers', label: 'المراكز الميدانية', icon: Building2, roles: [UserRole.SUPER_ADMIN] },
    { id: 'employees', label: 'إدارة الموظفين', icon: Users, roles: [UserRole.SUPER_ADMIN, UserRole.GENERAL_MANAGER, UserRole.CENTER_MANAGER] },
    { id: 'admins', label: 'صلاحيات المدراء', icon: UserCog, roles: [UserRole.SUPER_ADMIN] },
    { id: 'reports', label: 'التقارير الذكية', icon: BarChart3, roles: [UserRole.SUPER_ADMIN, UserRole.GENERAL_MANAGER, UserRole.CENTER_MANAGER] },
    { id: 'holidays', label: 'العطل الرسمية', icon: Calendar, roles: [UserRole.SUPER_ADMIN] },
    { id: 'notifications', label: 'مركز الإشعارات', icon: Bell, roles: [UserRole.SUPER_ADMIN, UserRole.GENERAL_MANAGER, UserRole.CENTER_MANAGER] },
    { id: 'messages', label: 'قوالب الرسائل', icon: MessageSquare, roles: [UserRole.SUPER_ADMIN] },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings, roles: [UserRole.SUPER_ADMIN, UserRole.GENERAL_MANAGER, UserRole.CENTER_MANAGER] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-cairo overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`fixed inset-y-0 right-0 z-[70] w-72 bg-slate-900 text-white transform transition-all duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none">Relief Experts</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Management System</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${
                  activePage === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl translate-x-[-4px]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activePage === item.id ? 'text-white' : 'text-slate-500'}`} />
                <span className="font-bold text-sm">{item.label}</span>
                {activePage === item.id && <ChevronLeft className="w-4 h-4 mr-auto opacity-50" />}
              </button>
            ))}
          </nav>

          <div className="p-4 bg-slate-950/50 border-t border-slate-800/50">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-bold truncate">{currentUser.username}</p>
              </div>
              <button 
                onClick={() => setCurrentUser(null)}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pr-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-[50]">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 bg-slate-100 rounded-xl">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {menuItems.find(i => i.id === activePage)?.label || 'الرئيسية'}
              </h2>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
