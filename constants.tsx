
import { UserRole, Center, Employee, Admin, MessageTemplate, SystemSettings } from './types.ts';

export const INITIAL_CENTERS: Center[] = [
  { id: 'c1', name: 'مركز الرياض الرئيسي', defaultStartTime: '08:00', defaultEndTime: '16:00' },
  { id: 'c2', name: 'فرع جدة - الشمال', defaultStartTime: '09:00', defaultEndTime: '17:00' },
  { id: 'c3', name: 'فرع الدمام', defaultStartTime: '08:00', defaultEndTime: '16:00' },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'أحمد محمد علي', centerId: 'c1', workingHours: 8, joinedDate: '2023-01-15' },
  { id: 'e2', name: 'سارة خالد العتيبي', centerId: 'c1', workingHours: 8, joinedDate: '2023-02-20' },
  { id: 'e3', name: 'محمد فهد القحطاني', centerId: 'c2', workingHours: 8, joinedDate: '2023-03-10' },
  { id: 'e4', name: 'نورة إبراهيم السديري', centerId: 'c2', workingHours: 8, joinedDate: '2023-04-05' },
  { id: 'e5', name: 'عبدالله صالح الزهراني', centerId: 'c3', workingHours: 8, joinedDate: '2023-05-12' },
];

export const INITIAL_ADMINS: Admin[] = [
  { 
    id: 'a1', 
    name: 'المشرف الأعلى', 
    username: 'aaltaleb@reliefexperts.org', 
    password: 'Ameer1997', 
    role: UserRole.SUPER_ADMIN, 
    managedCenterIds: [] 
  },
  { 
    id: 'a2', 
    name: 'مدير منطقة الغربية', 
    username: 'manager_west', 
    password: '123', 
    role: UserRole.GENERAL_MANAGER, 
    managedCenterIds: ['c2'] 
  },
  { 
    id: 'a3', 
    name: 'مدير مركز الرياض', 
    username: 'manager_c1', 
    password: '123', 
    role: UserRole.CENTER_MANAGER, 
    managedCenterIds: ['c1'] 
  },
];

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  { id: 't1', type: 'check_in', content: 'تم تسجيل دخولك بنجاح في الوقت المحدد. نتمنى لك يوماً سعيداً!' },
  { id: 't2', type: 'late_check_in', content: 'تم تسجيل دخولك. نلاحظ تأخراً عن الموعد المحدد بـ {minutes} دقيقة.' },
  { id: 't3', type: 'check_out', content: 'تم تسجيل خروجك بنجاح. شكراً لجهودك اليوم.' },
  { id: 't4', type: 'early_check_out', content: 'تم تسجيل خروجك قبل الموعد بـ {minutes} دقيقة.' },
];

export const INITIAL_SETTINGS: SystemSettings = {
  systemName: 'نظام حضور الموظفين',
  language: 'Arabic',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
};
