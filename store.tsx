
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Center, Employee, Admin, AttendanceRecord, Holiday, MessageTemplate, SystemSettings, Notification } from './types.ts';
import { INITIAL_TEMPLATES, INITIAL_SETTINGS, INITIAL_ADMINS, INITIAL_CENTERS, INITIAL_EMPLOYEES } from './constants.tsx';
import { supabase, checkSupabaseConnection } from './lib/supabase.ts';

interface AppContextType {
  centers: Center[];
  employees: Employee[];
  admins: Admin[];
  attendance: AttendanceRecord[];
  holidays: Holiday[];
  notifications: Notification[];
  templates: MessageTemplate[];
  settings: SystemSettings;
  currentUser: Admin | null;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  setCurrentUser: (user: Admin | null) => void;
  addCenter: (center: Center) => Promise<void>;
  updateCenter: (center: Center) => Promise<void>;
  deleteCenter: (id: string) => Promise<void>;
  addEmployee: (employee: Employee) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addAttendance: (record: AttendanceRecord) => Promise<void>;
  updateAttendance: (record: AttendanceRecord) => Promise<void>;
  addNotification: (notification: Notification) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updateTemplate: (template: MessageTemplate) => Promise<void>;
  updateSettings: (settings: SystemSettings) => Promise<void>;
  addAdmin: (admin: Admin) => Promise<void>;
  updateAdmin: (admin: Admin) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  addHoliday: (holiday: Holiday) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  importAppData: (data: any) => Promise<void>;
  refreshData: (tableName?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [centers, setCenters] = useState<Center[]>(INITIAL_CENTERS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [admins, setAdmins] = useState<Admin[]>(INITIAL_ADMINS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const fetchTable = async (tableName: string, setter: (data: any) => void, initial: any, options: any = {}) => {
    try {
      if (!checkSupabaseConnection()) {
        setter(initial || []);
        return;
      }
      
      const { data, error } = await supabase.from(tableName).select(options.select || '*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        if (tableName === 'admins') {
          setter(data.map((a: any) => ({ 
            ...a, 
            managedCenterIds: Array.isArray(a.managedCenterIds) ? a.managedCenterIds : [] 
          })));
        } else if (tableName === 'settings') {
          // جلب أول سجل إعدادات (ID=1)
          setter(data[0]);
        } else {
          setter(data);
        }
      } else {
        setter(initial || []);
      }
    } catch (err) {
      console.warn(`Error fetching ${tableName}:`, err);
      setter(initial || []);
    }
  };

  const refreshData = useCallback(async (tableName?: string) => {
    if (!tableName) {
      await Promise.allSettled([
        fetchTable('centers', setCenters, INITIAL_CENTERS),
        fetchTable('employees', setEmployees, INITIAL_EMPLOYEES),
        fetchTable('admins', setAdmins, INITIAL_ADMINS),
        fetchTable('attendance', setAttendance, []),
        fetchTable('holidays', setHolidays, []),
        fetchTable('notifications', setNotifications, []),
        fetchTable('templates', setTemplates, INITIAL_TEMPLATES),
        fetchTable('settings', setSettings, INITIAL_SETTINGS)
      ]);
    } else {
      switch(tableName) {
        case 'centers': await fetchTable('centers', setCenters, INITIAL_CENTERS); break;
        case 'employees': await fetchTable('employees', setEmployees, INITIAL_EMPLOYEES); break;
        case 'attendance': await fetchTable('attendance', setAttendance, []); break;
        case 'admins': await fetchTable('admins', setAdmins, INITIAL_ADMINS); break;
        case 'settings': await fetchTable('settings', setSettings, INITIAL_SETTINGS); break;
      }
    }
  }, []);

  useEffect(() => {
    refreshData();
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public' }, (p) => refreshData(p.table)).subscribe((s) => setIsRealtimeConnected(s === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [refreshData]);

  const addCenter = async (c: Center) => { 
    setCenters(prev => [...prev, c]);
    await supabase.from('centers').insert(c); 
  };
  
  const updateCenter = async (c: Center) => { 
    setCenters(prev => prev.map(item => item.id === c.id ? c : item));
    await supabase.from('centers').update(c).eq('id', c.id); 
  };

  const deleteCenter = async (id: string) => { 
    setCenters(prev => prev.filter(c => c.id !== id));
    await supabase.from('centers').delete().eq('id', id); 
  };

  const addEmployee = async (e: Employee) => { 
    setEmployees(prev => [...prev, e]);
    await supabase.from('employees').insert(e); 
  };

  const updateEmployee = async (e: Employee) => { 
    setEmployees(prev => prev.map(item => item.id === e.id ? e : item));
    await supabase.from('employees').update(e).eq('id', e.id); 
  };

  const deleteEmployee = async (id: string) => { 
    setEmployees(prev => prev.filter(e => e.id !== id));
    await supabase.from('employees').delete().eq('id', id); 
  };

  const addAttendance = async (r: AttendanceRecord) => { 
    setAttendance(prev => [...prev, r]);
    await supabase.from('attendance').insert(r); 
  };

  const updateAttendance = async (r: AttendanceRecord) => { 
    setAttendance(prev => prev.map(item => item.id === r.id ? r : item));
    await supabase.from('attendance').update(r).eq('id', r.id); 
  };

  const addNotification = async (n: Notification) => { 
    setNotifications(prev => [...prev, n]);
    await supabase.from('notifications').insert(n); 
  };

  const deleteNotification = async (id: string) => { 
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id); 
  };

  const updateTemplate = async (t: MessageTemplate) => { 
    setTemplates(prev => prev.map(item => item.id === t.id ? t : item));
    await supabase.from('templates').update(t).eq('id', t.id); 
  };

  const updateSettings = async (s: SystemSettings) => { 
    setSettings(s);
    // تحديث السجل رقم 1 دائماً لضمان المزامنة
    await supabase.from('settings').update({
      systemName: s.systemName,
      logoUrl: s.logoUrl,
      language: s.language,
      timeFormat: s.timeFormat,
      dateFormat: s.dateFormat
    }).eq('id', 1); 
  };

  const addAdmin = async (a: Admin) => { 
    setAdmins(prev => [...prev, a]);
    await supabase.from('admins').insert(a); 
  };

  const updateAdmin = async (a: Admin) => { 
    setAdmins(prev => prev.map(item => item.id === a.id ? a : item));
    await supabase.from('admins').update(a).eq('id', a.id); 
  };

  const deleteAdmin = async (id: string) => { 
    setAdmins(prev => prev.filter(a => a.id !== id));
    await supabase.from('admins').delete().eq('id', id); 
  };

  const addHoliday = async (h: Holiday) => { 
    setHolidays(prev => [...prev, h]);
    await supabase.from('holidays').insert(h); 
  };

  const deleteHoliday = async (id: string) => { 
    setHolidays(prev => prev.filter(h => h.id !== id));
    await supabase.from('holidays').delete().eq('id', id); 
  };

  const importAppData = async (data: any) => { 
    setIsLoading(true);
    try {
      if (data.centers) setCenters(data.centers);
      if (data.employees) setEmployees(data.employees);
      if (data.admins) setAdmins(data.admins);
      if (data.attendance) setAttendance(data.attendance);
      if (data.holidays) setHolidays(data.holidays);
      if (data.notifications) setNotifications(data.notifications);
      if (data.templates) setTemplates(data.templates);
      if (data.settings) setSettings(data.settings);
      console.log('Data injection complete locally.');
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      centers, employees, admins, attendance, holidays, notifications, templates, settings, currentUser, isLoading, isRealtimeConnected,
      setCurrentUser, addCenter, updateCenter, deleteCenter, addEmployee, updateEmployee, deleteEmployee,
      addAttendance, updateAttendance, addNotification, deleteNotification, updateTemplate, updateSettings,
      addAdmin, updateAdmin, deleteAdmin, addHoliday, deleteHoliday, importAppData, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
