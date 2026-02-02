
import React, { useState, useEffect } from 'react';
import { useApp } from '../store.tsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Clock, MapPin, User, LogIn, LogOut, CheckCircle2, AlertCircle, ShieldAlert, Smartphone, Wifi, Lock, BellRing, Info, Check, Loader2 } from 'lucide-react';
import { calculateDelay, calculateEarlyDeparture, calculateWorkingHours, getTodayDateString } from '../utils/attendanceLogic.ts';
import { AttendanceRecord, Employee, Notification } from '../types.ts';

const getDeviceId = () => {
  let id = localStorage.getItem('attendance_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('attendance_device_id', id);
  }
  return id;
};

const AttendancePublic: React.FC = () => {
  const { centers, employees, attendance, addAttendance, updateAttendance, templates, updateEmployee, notifications, settings } = useApp();
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'security' } | null>(null);
  const [userIP, setUserIP] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIP(data.ip))
      .catch(() => setUserIP('0.0.0.0'));
    return () => clearInterval(timer);
  }, []);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const selectedCenter = centers.find(c => c.id === selectedCenterId);

  const filteredEmployees = employees
    .filter(e => e.centerId === selectedCenterId)
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  useEffect(() => {
    if (selectedEmployeeId) {
      const relevantNotif = notifications.find(n => 
        n.targetType === 'all' || 
        (n.targetType === 'center' && n.targetId === selectedCenterId) ||
        (n.targetType === 'employee' && n.targetId === selectedEmployeeId)
      );
      
      if (relevantNotif) {
        const dismissed = sessionStorage.getItem(`dismissed_notif_${relevantNotif.id}_${selectedEmployeeId}`);
        if (!dismissed) {
          setActiveNotification(relevantNotif);
        }
      }
    }
  }, [selectedEmployeeId, selectedCenterId, notifications]);

  const handleAction = async (type: 'in' | 'out') => {
    if (!selectedEmployeeId || !selectedCenter || isSubmitting) return;
    const employee = selectedEmployee!;

    setIsSubmitting(true);
    try {
      const today = getTodayDateString();
      const existing = attendance.find(a => a.employeeId === selectedEmployeeId && a.date === today);

      if (type === 'in') {
        if (existing) {
          setMessage({ text: 'لقد قمت بتسجيل الدخول مسبقاً اليوم.', type: 'error' });
        } else {
          const delay = calculateDelay(new Date(), selectedCenter.defaultStartTime);
          const record: AttendanceRecord = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId: selectedEmployeeId,
            centerId: employee.centerId,
            date: today,
            checkIn: new Date().toISOString(),
            status: delay > 0 ? 'late' : 'present',
            delayMinutes: delay,
            earlyDepartureMinutes: 0,
            workingHours: 0,
            ipAddress: userIP
          };
          await addAttendance(record);
          const template = templates.find(t => t.type === (delay > 0 ? 'late_check_in' : 'check_in'));
          setMessage({ text: template?.content.replace('{minutes}', delay.toString()) || 'تم تسجيل الدخول بنجاح', type: 'success' });
        }
      } else {
        if (!existing) {
          setMessage({ text: 'يرجى تسجيل الدخول أولاً.', type: 'error' });
        } else if (existing.checkOut) {
          setMessage({ text: 'لقد سجلت خروجك مسبقاً اليوم.', type: 'error' });
        } else {
          const now = new Date();
          const early = calculateEarlyDeparture(now, selectedCenter.defaultEndTime);
          const hours = calculateWorkingHours(new Date(existing.checkIn!), now);
          await updateAttendance({
            ...existing,
            checkOut: now.toISOString(),
            earlyDepartureMinutes: early,
            workingHours: hours
          });
          const template = templates.find(t => t.type === (early > 0 ? 'early_check_out' : 'check_out'));
          setMessage({ text: template?.content.replace('{minutes}', early.toString()) || 'تم تسجيل الخروج بنجاح', type: 'success' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-cairo overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative z-10">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100 relative">
          <h1 className="text-2xl font-black text-slate-800 mb-1">{settings.systemName || 'بوابة الحضور'}</h1>
          <div className="text-5xl font-black text-indigo-600 mt-6 tracking-tighter">
            {format(currentTime, 'HH:mm:ss')}
          </div>
        </div>
        <div className="p-8 space-y-5 bg-white">
          {message && (
            <div className={`p-4 rounded-2xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {message.text}
            </div>
          )}
          <select
            disabled={isSubmitting}
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="w-full h-14 pr-4 rounded-2xl border-2 border-slate-100 font-black text-slate-700 appearance-none outline-none"
          >
            <option value="">-- اختر المركز --</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            disabled={!selectedCenterId || isSubmitting}
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full h-14 pr-4 rounded-2xl border-2 border-slate-100 font-black text-slate-700 appearance-none outline-none"
          >
            <option value="">-- اختر الموظف --</option>
            {filteredEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button onClick={() => handleAction('in')} disabled={!selectedEmployeeId || isSubmitting} className="h-16 bg-indigo-600 text-white rounded-2xl font-black">دخول</button>
            <button onClick={() => handleAction('out')} disabled={!selectedEmployeeId || isSubmitting} className="h-16 bg-slate-900 text-white rounded-2xl font-black">خروج</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePublic;
