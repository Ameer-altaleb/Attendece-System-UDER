
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Clock, MapPin, User, LogIn, LogOut, CheckCircle2, AlertCircle, ShieldAlert, Smartphone, Wifi, Lock, BellRing, Info, Check, Loader2 } from 'lucide-react';
import { calculateDelay, calculateEarlyDeparture, calculateWorkingHours, getTodayDateString } from '../utils/attendanceLogic';
import { AttendanceRecord, Employee, Notification } from '../types';

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

  const validateAccess = (employee: Employee, center: any): boolean => {
    const currentDeviceId = getDeviceId();
    if (center.authorizedIP && center.authorizedIP !== userIP) {
      setMessage({ 
        text: `يجب الاتصال بشبكة WiFi المركز (${center.name}) لإتمام العملية.`, 
        type: 'security' 
      });
      return false;
    }
    if (employee.deviceId && employee.deviceId !== currentDeviceId) {
      setMessage({ 
        text: 'هذا الحساب مرتبط بجهاز آخر.', 
        type: 'security' 
      });
      return false;
    }
    return true;
  };

  const handleAction = async (type: 'in' | 'out') => {
    if (!selectedEmployeeId || !selectedCenter || isSubmitting) return;
    const employee = selectedEmployee!;

    if (!validateAccess(employee, selectedCenter)) return;

    setIsSubmitting(true);
    try {
      if (!employee.deviceId) {
        await updateEmployee({ ...employee, deviceId: getDeviceId() });
      }

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
          setSelectedEmployeeId('');
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
          setSelectedEmployeeId('');
        }
      }
    } catch (err) {
      setMessage({ text: 'حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة مرة أخرى.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissNotification = () => {
    if (activeNotification && selectedEmployeeId) {
      sessionStorage.setItem(`dismissed_notif_${activeNotification.id}_${selectedEmployeeId}`, 'true');
      setActiveNotification(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-cairo overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative z-10">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100 relative">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-1 leading-tight">
            {settings.systemName || 'بوابة الحضور الذكية'}
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Relief Experts System</p>
          
          <div className="text-5xl font-black text-indigo-600 mt-6 tracking-tighter">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <p className="text-slate-500 text-sm mt-1 font-bold">
            {format(currentTime, 'EEEE، d MMMM yyyy', { locale: ar })}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-100">
               <Wifi className="w-3.5 h-3.5" />
               IP: {userIP || '...'}
             </div>
          </div>
        </div>

        <div className="p-8 space-y-5 bg-white">
          {message && (
            <div className={`p-4 rounded-[1.5rem] flex items-start gap-3 animate-in fade-in slide-in-from-top duration-500 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
              message.type === 'security' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              <div className="shrink-0 mt-1">
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                 message.type === 'security' ? <ShieldAlert className="w-5 h-5" /> : 
                 <AlertCircle className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest">{message.type === 'security' ? 'Security Notice' : 'System'}</p>
                <p className="text-sm font-bold leading-relaxed">{message.text}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="group">
              <label className="text-xs font-black text-slate-400 mr-2 mb-2 block uppercase tracking-tighter">1. اختيار المركز</label>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <select
                  disabled={isSubmitting}
                  value={selectedCenterId}
                  onChange={(e) => { setSelectedCenterId(e.target.value); setSelectedEmployeeId(''); setMessage(null); }}
                  className="w-full h-14 pr-12 pl-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:ring-0 transition-all outline-none bg-slate-50 font-black text-slate-700 appearance-none disabled:opacity-50"
                >
                  <option value="">-- اختر مركز العمل --</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="group">
              <label className="text-xs font-black text-slate-400 mr-2 mb-2 block uppercase tracking-tighter">2. تحديد الموظف</label>
              <div className="relative">
                <User className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <select
                  disabled={!selectedCenterId || isSubmitting}
                  value={selectedEmployeeId}
                  onChange={(e) => { setSelectedEmployeeId(e.target.value); setMessage(null); }}
                  className="w-full h-14 pr-12 pl-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:ring-0 transition-all outline-none bg-slate-50 disabled:opacity-50 font-black text-slate-700 appearance-none"
                >
                  <option value="">-- ابحث عن اسمك --</option>
                  {filteredEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} {e.deviceId ? '🔒' : '🔓'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <button
              onClick={() => handleAction('in')}
              disabled={!selectedEmployeeId || isSubmitting}
              className="h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black flex flex-col items-center justify-center transition-all shadow-xl shadow-indigo-100 active:scale-95 group"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <LogIn className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">دخول</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleAction('out')}
              disabled={!selectedEmployeeId || isSubmitting}
              className="h-20 rounded-[2rem] bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-300 text-white font-black flex flex-col items-center justify-center transition-all shadow-xl shadow-slate-200 active:scale-95 group"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <LogOut className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">خروج</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 text-center bg-slate-50 border-t border-slate-100">
           <div className="flex items-center justify-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-indigo-500" /> Server Sync Active</span>
              <span className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-indigo-500" /> Device Verified</span>
           </div>
        </div>
      </div>

      {activeNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
              <div className="p-8 text-center space-y-6">
                 <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] shadow-inner animate-bounce">
                    <BellRing className="w-10 h-10" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900">{activeNotification.title}</h3>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-right">
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">{activeNotification.message}</p>
                 </div>
                 <button 
                    onClick={handleDismissNotification}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    <Check className="w-6 h-6" /> موافق، متابعة
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePublic;
