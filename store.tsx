
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
  const [centers, setCenters] = useState<Center[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const refreshData = useCallback(async (tableName?: string) => {
    if (!checkSupabaseConnection()) {
      if (!tableName) {
        setAdmins(INITIAL_ADMINS);
        setCenters(INITIAL_CENTERS);
        setEmployees(INITIAL_EMPLOYEES);
        setTemplates(INITIAL_TEMPLATES);
      }
      setIsLoading(false);
      return;
    }

    try {
      if (!tableName || tableName === 'centers') {
        const { data } = await supabase.from('centers').select('*');
        if (data && data.length > 0) setCenters(data);
        else if (!tableName) setCenters(INITIAL_CENTERS);
      }
      if (!tableName || tableName === 'employees') {
        const { data } = await supabase.from('employees').select('*');
        if (data && data.length > 0) setEmployees(data);
        else if (!tableName) setEmployees(INITIAL_EMPLOYEES);
      }
      if (!tableName || tableName === 'admins') {
        const { data } = await supabase.from('admins').select('*');
        if (data && data.length > 0) {
          const processedAdmins = data.map(admin => ({
            ...admin,
            managedCenterIds: Array.isArray(admin.managedCenterIds) ? admin.managedCenterIds : []
          }));
          setAdmins(processedAdmins);
        } else {
          // إذا كان الجدول فارغاً، نستخدم الحسابات الافتراضية لضمان الدخول
          setAdmins(INITIAL_ADMINS);
        }
      }
      if (!tableName || tableName === 'attendance') {
        const { data } = await supabase.from('attendance').select('*').order('date', { ascending: false });
        if (data) setAttendance(data);
      }
      if (!tableName || tableName === 'holidays') {
        const { data } = await supabase.from('holidays').select('*');
        if (data) setHolidays(data);
      }
      if (!tableName || tableName === 'notifications') {
        const { data } = await supabase.from('notifications').select('*').order('sentAt', { ascending: false });
        if (data) setNotifications(data);
      }
      if (!tableName || tableName === 'templates') {
        const { data } = await supabase.from('templates').select('*');
        if (data && data.length > 0) setTemplates(data);
        else if (!tableName) setTemplates(INITIAL_TEMPLATES);
      }
      if (!tableName || tableName === 'settings') {
        const { data } = await supabase.from('settings').select('*').single();
        if (data) setSettings(data);
      }
    } catch (error) {
      console.error(`Error refreshing ${tableName || 'all'}:`, error);
    } finally {
      if (!tableName) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    if (checkSupabaseConnection()) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            refreshData(payload.table);
          }
        )
        .subscribe((status) => {
          setIsRealtimeConnected(status === 'SUBSCRIBED');
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [refreshData]);

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
  const updateSettings = async (s: SystemSettings) => { await supabase.from('settings').update(s).eq('id', 1); };

  const addAdmin = async (a: Admin) => { await supabase.from('admins').insert(a); };
  const updateAdmin = async (a: Admin) => { await supabase.from('admins').update(a).eq('id', a.id); };
  const deleteAdmin = async (id: string) => { await supabase.from('admins').delete().eq('id', id); };

  const addHoliday = async (h: Holiday) => { await supabase.from('holidays').insert(h); };
  const deleteHoliday = async (id: string) => { await supabase.from('holidays').delete().eq('id', id); };

  const importAppData = async (data: any) => { refreshData(); };

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
