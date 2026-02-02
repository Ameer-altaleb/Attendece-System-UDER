
import { UserRole, Center, Employee, Admin, MessageTemplate, SystemSettings } from './types.ts';

export const INITIAL_CENTERS: Center[] = [
  { id: 'c1', name: 'مركز الرياض الرئيسي', defaultStartTime: '08:00', defaultEndTime: '16:00', checkInGracePeriod: 15, checkOutGracePeriod: 15, isActive: true },
  { id: 'c2', name: 'فرع جدة - الشمال', defaultStartTime: '09:00', defaultEndTime: '17:00', checkInGracePeriod: 15, checkOutGracePeriod: 15, isActive: true },
  { id: 'c3', name: 'فرع الدمام', defaultStartTime: '08:00', defaultEndTime: '16:00', checkInGracePeriod: 15, checkOutGracePeriod: 15, isActive: true },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', code: 'RE-001', name: 'أحمد محمد علي', centerId: 'c1', workingHours: 8, joinedDate: '2023-01-15', isActive: true },
  { id: 'e2', code: 'RE-002', name: 'سارة خالد العتيبي', centerId: 'c1', workingHours: 8, joinedDate: '2023-02-20', isActive: true },
  { id: 'e3', code: 'RE-003', name: 'محمد فهد القحطاني', centerId: 'c2', workingHours: 8, joinedDate: '2023-03-10', isActive: true },
  { id: 'e4', code: 'RE-004', name: 'نورة إبراهيم السديري', centerId: 'c2', workingHours: 8, joinedDate: '2023-04-05', isActive: true },
  { id: 'e5', code: 'RE-005', name: 'عبدالله صالح الزهراني', centerId: 'c3', workingHours: 8, joinedDate: '2023-05-12', isActive: true },
];

export const INITIAL_ADMINS: Admin[] = [
  { 
    id: 'a1', 
    name: 'المشرف الأعلى', 
    username: 'aaltaleb@reliefexperts.org', 
    password: 'Ameer1997', 
    role: UserRole.SUPER_ADMIN, 
    managedCenterIds: [],
    isBlocked: false
  },
  { 
    id: 'a2', 
    name: 'مدير 1', 
    username: 'manager_west', 
    password: '123', 
    role: UserRole.GENERAL_MANAGER, 
    managedCenterIds: ['c2'],
    isBlocked: false
  },
  { 
    id: 'a3', 
    name: 'مدير 2', 
    username: 'manager_c1', 
    password: '123', 
    role: UserRole.CENTER_MANAGER, 
    managedCenterIds: ['c1'],
    isBlocked: false
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
  logoUrl: '',
  language: 'Arabic',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
};
