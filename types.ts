
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  CENTER_MANAGER = 'CENTER_MANAGER'
}

export interface Center {
  id: string;
  name: string;
  defaultStartTime: string; // HH:mm
  defaultEndTime: string;   // HH:mm
  authorizedIP?: string;    // عنوان الـ IP المسموح به للمركز (WiFi المركز)
}

export interface Employee {
  id: string;
  name: string;
  centerId: string;
  workingHours: number;
  joinedDate: string;
  deviceId?: string;        // بصمة الجهاز الفريدة المرتبطة بالموظف
}

export interface Admin {
  id: string;
  name: string;
  username: string;
  password?: string;        // كلمة المرور المسجلة
  role: UserRole;
  managedCenterIds: string[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  centerId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; 
  checkOut?: string;
  status: 'present' | 'late' | 'absent' | 'holiday' | 'not_logged_out';
  delayMinutes: number;
  earlyDepartureMinutes: number;
  workingHours: number;
  ipAddress?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  targetType: 'all' | 'center' | 'employee';
  targetId?: string;
  senderName: string;
  sentAt: string;
}

export interface MessageTemplate {
  id: string;
  type: 'check_in' | 'late_check_in' | 'check_out' | 'early_check_out';
  content: string;
}

export interface SystemSettings {
  systemName: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
}
