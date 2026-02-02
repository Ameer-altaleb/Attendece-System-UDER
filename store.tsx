
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Center, Employee, Admin, AttendanceRecord, Holiday, MessageTemplate, SystemSettings, Notification } from './types.ts';
import { 
  INITIAL_TEMPLATES, 
  INITIAL_SETTINGS, 
  INITIAL_ADMINS, 
  INITIAL_CENTERS, 
  INITIAL_EMPLOYEES,
  INITIAL_HOLIDAYS,
  INITIAL_NOTIFICATIONS
} from './constants.tsx';
import { supabase } from './lib/supabase.ts';

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
  dbStatus: { [key: string]: 'online' | 'offline' | 'checking' };
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
  testConnection: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [centers, setCenters] = useState<Center[]>(INITIAL_CENTERS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [admins, setAdmins] = useState<Admin[]>(INITIAL_ADMINS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>(INITIAL_HOLIDAYS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [templates, setTemplates] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ [key: string]: 'online' | 'offline' | 'checking' }>({});

  const fetchTable = async (tableName: string, setter: (data: any) => void, initial: any) => {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      
      if (error) {
        const isTableMissing = error.code === 'PGRST116' || error.code === '42P01' || error.message?.toLowerCase().includes('schema cache');
        if (isTableMissing) {
          setDbStatus(prev => ({ ...prev, [tableName]: 'offline' }));
          setter(initial || []);
        } else {
          setter(initial || []);
        }
        return;
      }

      setDbStatus(prev => ({ ...prev, [tableName]: 'online' }));
      if (data && data.length > 0) {
        if (tableName === 'settings') setter(data[0]);
        else setter(data);
      } else {
        setter(initial || []);
      }
    } catch (err) {
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
        fetchTable('holidays', setHolidays, INITIAL_HOLIDAYS),
        fetchTable('notifications', setNotifications, INITIAL_NOTIFICATIONS),
        fetchTable('templates', setTemplates, INITIAL_TEMPLATES),
        fetchTable('settings', setSettings, INITIAL_SETTINGS)
      ]);
    } else {
      const map: any = {
        'centers': () => fetchTable('centers', setCenters, INITIAL_CENTERS),
        'employees': () => fetchTable('employees', setEmployees, INITIAL_EMPLOYEES),
        'attendance': () => fetchTable('attendance', setAttendance, []),
        'settings': () => fetchTable('settings', setSettings, INITIAL_SETTINGS),
        'admins': () => fetchTable('admins', setAdmins, INITIAL_ADMINS),
        'holidays': () => fetchTable('holidays', setHolidays, INITIAL_HOLIDAYS),
        'notifications': () => fetchTable('notifications', setNotifications, INITIAL_NOTIFICATIONS),
        'templates': () => fetchTable('templates', setTemplates, INITIAL_TEMPLATES)
      };
      if (map[tableName]) await map[tableName]();
    }
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    await refreshData();
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        refreshData(payload.table);
      })
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, [refreshData]);

  // Operations
  const addCenter = async (c: Center) => { await supabase.from('centers').insert(c); };
  const updateCenter = async (c: Center) => { await supabase.from('centers').update(c).eq('id', c.id); };
  const deleteCenter = async (id: string) => { await supabase.from('centers').delete().eq('id', id); };
  const addEmployee = async (e: Employee) => { await supabase.from('employees').insert(e); };
  const updateEmployee = async (e: Employee) => { await supabase.from('employees').update(e).eq('id', e.id); };
  const deleteEmployee = async (id: string) => { await supabase.from('employees').delete().eq('id', id); };
  const addAttendance = async (r: AttendanceRecord) => { await supabase.from('attendance').insert(r); };
  const updateAttendance = async (r: AttendanceRecord) => { await supabase.from('attendance').update(r).eq('id', r.id); };
  const addNotification = async (n: Notification) => { await supabase.from('notifications').insert(n); };
  const deleteNotification = async (id: string) => { await supabase.from('notifications').delete().eq('id', id); };
  const updateTemplate = async (t: MessageTemplate) => { await supabase.from('templates').update(t).eq('id', t.id); };
  const updateSettings = async (s: SystemSettings) => { 
    setSettings(s);
    await supabase.from('settings').upsert({ id: 1, ...s }); 
  };
  const addAdmin = async (a: Admin) => { await supabase.from('admins').insert(a); };
  const updateAdmin = async (a: Admin) => { await supabase.from('admins').update(a).eq('id', a.id); };
  const deleteAdmin = async (id: string) => { await supabase.from('admins').delete().eq('id', id); };
  const addHoliday = async (h: Holiday) => { await supabase.from('holidays').insert(h); };
  const deleteHoliday = async (id: string) => { await supabase.from('holidays').delete().eq('id', id); };

  const importAppData = async (data: any) => { setIsLoading(true); setIsLoading(false); };

  return (
    <AppContext.Provider value={{
      centers, employees, admins, attendance, holidays, notifications, templates, settings, currentUser, isLoading, isRealtimeConnected, dbStatus,
      setCurrentUser, addCenter, updateCenter, deleteCenter, addEmployee, updateEmployee, deleteEmployee,
      addAttendance, updateAttendance, addNotification, deleteNotification, updateTemplate, updateSettings,
      addAdmin, updateAdmin, deleteAdmin, addHoliday, deleteHoliday, importAppData, refreshData, testConnection
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
