
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Center, Employee, Admin, AttendanceRecord, Holiday, MessageTemplate, SystemSettings, Notification } from './types';
import { INITIAL_TEMPLATES, INITIAL_SETTINGS, INITIAL_ADMINS, INITIAL_CENTERS, INITIAL_EMPLOYEES } from './constants';
import { supabase } from './lib/supabase';

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
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: c, error: errC }, 
        { data: e }, 
        { data: a }, 
        { data: att }, 
        { data: h }, 
        { data: n }, 
        { data: t }, 
        { data: s }
      ] = await Promise.all([
        supabase.from('centers').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('admins').select('*'),
        supabase.from('attendance').select('*').order('date', { ascending: false }),
        supabase.from('holidays').select('*'),
        supabase.from('notifications').select('*').order('sentAt', { ascending: false }),
        supabase.from('templates').select('*'),
        supabase.from('settings').select('*').single()
      ]);

      if (errC) throw errC;

      if (!a || a.length === 0) {
        await supabase.from('admins').insert(INITIAL_ADMINS);
        setAdmins(INITIAL_ADMINS);
      } else {
        setAdmins(a);
      }

      if (c && c.length > 0) setCenters(c);
      else {
         await supabase.from('centers').insert(INITIAL_CENTERS);
         setCenters(INITIAL_CENTERS);
      }

      if (e) setEmployees(e);
      if (att) setAttendance(att);
      if (h) setHolidays(h);
      if (n) setNotifications(n);
      if (t && t.length > 0) setTemplates(t);
      if (s) setSettings(s);
      else {
        await supabase.from('settings').insert([{ id: 1, ...INITIAL_SETTINGS }]);
        setSettings(INITIAL_SETTINGS);
      }
      
    } catch (error: any) {
      console.error('Database connection error:', error.message);
      // Fallback to local constants for preview
      setAdmins(INITIAL_ADMINS);
      setCenters(INITIAL_CENTERS);
      setEmployees(INITIAL_EMPLOYEES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addCenter = async (c: Center) => {
    const { error } = await supabase.from('centers').insert(c);
    if (error) {
      alert(`فشل إضافة المركز: ${error.message}`);
    } else {
      setCenters([...centers, c]);
    }
  };

  const updateCenter = async (c: Center) => {
    const { error } = await supabase.from('centers').update(c).eq('id', c.id);
    if (error) {
      alert(`فشل تحديث المركز: ${error.message}`);
    } else {
      setCenters(centers.map(item => item.id === c.id ? c : item));
    }
  };

  const deleteCenter = async (id: string) => {
    const { error } = await supabase.from('centers').delete().eq('id', id);
    if (error) {
      alert(`فشل حذف المركز: ${error.message}`);
    } else {
      setCenters(centers.filter(item => item.id !== id));
    }
  };

  const addEmployee = async (e: Employee) => {
    const { error } = await supabase.from('employees').insert(e);
    if (error) alert(`خطأ: ${error.message}`);
    else setEmployees([...employees, e]);
  };

  const updateEmployee = async (e: Employee) => {
    const { error } = await supabase.from('employees').update(e).eq('id', e.id);
    if (error) alert(`خطأ: ${error.message}`);
    else setEmployees(employees.map(item => item.id === e.id ? e : item));
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert(`خطأ: ${error.message}`);
    else setEmployees(employees.filter(item => item.id !== id));
  };

  const addAttendance = async (r: AttendanceRecord) => {
    const { error } = await supabase.from('attendance').insert(r);
    if (error) alert(`فشل تسجيل الحضور: ${error.message}`);
    else setAttendance([r, ...attendance]);
  };

  const updateAttendance = async (r: AttendanceRecord) => {
    const { error } = await supabase.from('attendance').update(r).eq('id', r.id);
    if (error) alert(`فشل التحديث: ${error.message}`);
    else setAttendance(attendance.map(item => item.id === r.id ? r : item));
  };

  const addNotification = async (n: Notification) => {
    const { error } = await supabase.from('notifications').insert(n);
    if (error) alert(error.message);
    else setNotifications([n, ...notifications]);
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) alert(error.message);
    else setNotifications(notifications.filter(n => n.id !== id));
  };

  const updateTemplate = async (t: MessageTemplate) => {
    const { error } = await supabase.from('templates').update(t).eq('id', t.id);
    if (error) alert(error.message);
    else setTemplates(templates.map(item => item.id === t.id ? t : item));
  };

  const updateSettings = async (s: SystemSettings) => {
    const { error } = await supabase.from('settings').update(s).eq('id', 1);
    if (error) alert(error.message);
    else setSettings(s);
  };

  const addAdmin = async (a: Admin) => {
    const { error } = await supabase.from('admins').insert(a);
    if (error) alert(error.message);
    else setAdmins([...admins, a]);
  };

  const updateAdmin = async (a: Admin) => {
    const { error } = await supabase.from('admins').update(a).eq('id', a.id);
    if (error) {
      alert(error.message);
    } else {
      setAdmins(admins.map(item => item.id === a.id ? a : item));
      if (currentUser?.id === a.id) setCurrentUser(a);
    }
  };

  const deleteAdmin = async (id: string) => {
    const { error } = await supabase.from('admins').delete().eq('id', id);
    if (error) alert(error.message);
    else setAdmins(admins.filter(item => item.id !== id));
  };

  const addHoliday = async (h: Holiday) => {
    const { error } = await supabase.from('holidays').insert(h);
    if (error) alert(error.message);
    else setHolidays([...holidays, h]);
  };

  const deleteHoliday = async (id: string) => {
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (error) alert(error.message);
    else setHolidays(holidays.filter(item => item.id !== id));
  };

  const importAppData = async (data: any) => {
    setIsLoading(true);
    try {
      // Logic for importing full data sets to Supabase could be added here
      if (data.centers) setCenters(data.centers);
      if (data.employees) setEmployees(data.employees);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      centers, employees, admins, attendance, holidays, notifications, templates, settings, currentUser, isLoading, setCurrentUser,
      addCenter, updateCenter, deleteCenter,
      addEmployee, updateEmployee, deleteEmployee,
      addAttendance, updateAttendance,
      addNotification, deleteNotification,
      updateTemplate, updateSettings,
      addAdmin, updateAdmin, deleteAdmin,
      addHoliday, deleteHoliday,
      importAppData,
      refreshData
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
