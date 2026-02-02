
import React, { useState, useEffect } from 'react';
import { useApp } from '../store.tsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Clock, MapPin, User, LogIn, LogOut, CheckCircle2, AlertCircle, ShieldAlert, Smartphone, Wifi, Lock, BellRing, Info, Check, Loader2, ShieldCheck, WifiOff } from 'lucide-react';
import { calculateDelay, calculateEarlyDeparture, calculateWorkingHours, getTodayDateString } from '../utils/attendanceLogic.ts';
import { AttendanceRecord, Employee, Notification } from '../types.ts';
import { supabase } from '../lib/supabase.ts';

// توليد بصمة فريدة للجهاز وتخزينها بشكل دائم في المتصفح
const getDeviceId = () => {
  let id = localStorage.getItem('attendance_device_id');
  if (!id) {
    // نستخدم تركيبة من التاريخ وعامل عشوائي لضمان عدم التكرار
    id = 'dev_secure_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('attendance_device_id', id);
  }
  return id;
};

const AttendancePublic: React.FC = () => {
  const { centers, employees, attendance, addAttendance, updateAttendance, templates, updateEmployee, notifications, settings, refreshData } = useApp();
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'security' } | null>(null);
  const [userIP, setUserIP] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [ipLoading, setIpLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    setIpLoading(true);
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setUserIP(data.ip);
        setIpLoading(false);
      })
      .catch(() => {
        setUserIP('0.0.0.0');
        setIpLoading(false);
      });
    return () => clearInterval(timer);
  }, []);

  const selectedCenter = centers.find(c => c.id === selectedCenterId);
  const filteredEmployees = employees
    .filter(e => e.centerId === selectedCenterId)
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const isIpAuthorized = selectedCenter?.authorizedIP 
    ? userIP === selectedCenter.authorizedIP 
    : true;

  // إدارة الإشعارات الإدارية
  useEffect(() => {
    if (selectedEmployeeId) {
      const relevantNotif = notifications.find(n => 
        n.targetType === 'all' || 
        (n.targetType === 'center' && n.targetId === selectedCenterId) ||
        (n.targetType === 'employee' && n.targetId === selectedEmployeeId)
      );
      
      if (relevantNotif) {
        const dismissed = sessionStorage.getItem(`dismissed_notif_${relevantNotif.id}_${selectedEmployeeId}`);
        if (!dismissed) setActiveNotification(relevantNotif);
      }
    }
  }, [selectedEmployeeId, selectedCenterId, notifications]);

  const handleAction = async (type: 'in' | 'out') => {
    if (!selectedEmployeeId || !selectedCenter || isSubmitting) return;
    
    setIsSubmitting(true);
    setMessage(null);

    try {
      // 1. تحديث البيانات محلياً لضمان التحقق من أحدث حالة للارتباطات
      await refreshData('employees');
      
      const currentDeviceId = getDeviceId();
      // جلب الموظف الحالي من القائمة المحدثة
      const employee = employees.find(e => e.id === selectedEmployeeId)!;

      // 2. التحقق من الـ IP (واي فاي المركز)
      if (selectedCenter.authorizedIP && userIP !== selectedCenter.authorizedIP) {
        setMessage({ 
          text: `فشل التحقق الشبكي: يجب الاتصال بشبكة WiFi المركز (${selectedCenter.name}) حصراً.`, 
          type: 'security' 
        });
        setIsSubmitting(false);
        return;
      }

      // 3. منطق ربط الجهاز الصارم (Strict Device Binding)
      
      // الحالة أ: الموظف لديه جهاز مسجل بالفعل
      if (employee.deviceId) {
        if (employee.deviceId !== currentDeviceId) {
          setMessage({ 
            text: 'خطأ أمني: عذراً، حسابك مرتبط بجهاز آخر. لا يمكنك تسجيل الحضور إلا من جهازك المسجل حصراً.', 
            type: 'security' 
          });
          setIsSubmitting(false);
          return;
        }
      } 
      // الحالة ب: الموظف يسجل لأول مرة (محاولة ربط جهاز جديد)
      else {
        // نتحقق إذا كان هذا الجهاز (currentDeviceId) مرتبطاً أصلاً بموظف آخر في النظام
        const otherEmployeeWithSameDevice = employees.find(e => e.deviceId === currentDeviceId);
        
        if (otherEmployeeWithSameDevice) {
          setMessage({ 
            text: `فشل الربط: هذا الجهاز مرتبط فعلياً بالموظف (${otherEmployeeWithSameDevice.name}). لا يسمح باستخدام الجهاز لأكثر من حساب.`, 
            type: 'security' 
          });
          setIsSubmitting(false);
          return;
        }

        // إذا كان الجهاز شاغراً، نقوم بربطه بالموظف الآن
        await updateEmployee({ ...employee, deviceId: currentDeviceId });
      }

      // 4. تنفيذ عملية الحضور/الانصراف بعد اجتياز الفحص الأمني
      const today = getTodayDateString();
      const existing = attendance.find(a => a.employeeId === selectedEmployeeId && a.date === today);

      if (type === 'in') {
        if (existing) {
          setMessage({ text: 'لقد سجلت دخولك مسبقاً لهذا اليوم.', type: 'error' });
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
          setMessage({ text: 'لقد سجلت خروجك مسبقاً.', type: 'error' });
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
    } catch (err) {
      setMessage({ text: 'حدث خطأ في معالجة الطلب، يرجى المحاولة ثانية.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissNotif = () => {
    if (activeNotification && selectedEmployeeId) {
      sessionStorage.setItem(`dismissed_notif_${activeNotification.id}_${selectedEmployeeId}`, 'true');
      setActiveNotification(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-cairo overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative z-10">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100 relative">
          <div className="absolute top-4 right-8 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${ipLoading ? 'bg-slate-300 animate-pulse' : 'bg-emerald-500 shadow-lg shadow-emerald-500/50'}`}></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security System Active</span>
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 mb-1">{settings.systemName}</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">التحقق من الهوية والأجهزة</p>
          
          <div className="text-5xl font-black text-indigo-600 mt-6 tracking-tighter">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
            {format(currentTime, 'EEEE، dd MMMM yyyy', { locale: ar })}
          </p>
        </div>

        <div className="p-8 space-y-5 bg-white">
          {/* IP Status */}
          {selectedCenter && (
            <div className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
              isIpAuthorized ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                  isIpAuthorized ? 'bg-white text-emerald-600' : 'bg-white text-rose-600'
                }`}>
                  {isIpAuthorized ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tighter opacity-70">مركز التحقق الشبكي</p>
                  <p className="text-xs font-black">{isIpAuthorized ? 'متصل بشبكة المركز' : 'الشبكة غير معتمدة'}</p>
                </div>
              </div>
              {isIpAuthorized ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5 animate-pulse" />}
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className={`p-4 rounded-2xl animate-in slide-in-from-top duration-300 flex items-start gap-3 border ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
              message.type === 'security' ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xl shadow-rose-100 ring-2 ring-rose-500/20' :
              'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              <div className="mt-0.5 shrink-0">
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                 message.type === 'security' ? <ShieldAlert className="w-6 h-6" /> :
                 <AlertCircle className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black leading-relaxed">{message.text}</p>
                {message.type === 'security' && <p className="text-[9px] uppercase font-bold opacity-60 italic">Conflict: Unauthorized Device Access</p>}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="relative group">
              <MapPin className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <select
                disabled={isSubmitting}
                value={selectedCenterId}
                onChange={(e) => { setSelectedCenterId(e.target.value); setSelectedEmployeeId(''); setMessage(null); }}
                className="w-full h-14 pr-14 pl-6 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-700 appearance-none bg-slate-50/50"
              >
                <option value="">-- اختر مركز العمل --</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="relative group">
              <User className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <select
                disabled={!selectedCenterId || isSubmitting}
                value={selectedEmployeeId}
                onChange={(e) => { setSelectedEmployeeId(e.target.value); setMessage(null); }}
                className="w-full h-14 pr-14 pl-6 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-700 appearance-none bg-slate-50/50 disabled:opacity-50"
              >
                <option value="">-- اختر اسمك من القائمة --</option>
                {filteredEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => handleAction('in')}
              disabled={!selectedEmployeeId || isSubmitting || !isIpAuthorized}
              className="group h-20 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 disabled:grayscale relative overflow-hidden"
            >
              <div className="flex flex-col items-center justify-center gap-1 relative z-10">
                <LogIn className="w-6 h-6" />
                <span className="text-xs uppercase tracking-widest">تسجيل دخول</span>
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>
            
            <button
              onClick={() => handleAction('out')}
              disabled={!selectedEmployeeId || isSubmitting || !isIpAuthorized}
              className="group h-20 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-black active:scale-95 transition-all disabled:opacity-40 disabled:grayscale relative overflow-hidden"
            >
              <div className="flex flex-col items-center justify-center gap-1 relative z-10">
                <LogOut className="w-6 h-6" />
                <span className="text-xs uppercase tracking-widest">تسجيل خروج</span>
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>
          </div>

          <div className="pt-6 flex flex-col items-center gap-4 border-t border-slate-50">
             <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/50 rounded-full border border-indigo-100">
               <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Device-Employee Lock Activated</p>
               <Lock className="w-3.5 h-3.5 text-emerald-500" />
             </div>
             <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center leading-relaxed">
               يمنع النظام استخدام هذا الجهاز لأكثر من حساب<br/>ويمنع حسابك من الدخول عبر أجهزة أخرى
             </p>
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      {activeNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
            <div className="p-8 text-center bg-indigo-600 text-white relative">
              <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-white/20">
                <BellRing className="w-10 h-10 text-white animate-bounce" />
              </div>
              <h3 className="text-xl font-black">{activeNotification.title}</h3>
              <div className="absolute top-4 left-4 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-200">
                <ShieldCheck className="w-3 h-3" /> تعميم إداري
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 text-center">
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {activeNotification.message}
                </p>
              </div>
              <button
                onClick={handleDismissNotif}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> قرأت وفهمت التعليمات
              </button>
            </div>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="fixed inset-0 z-[110] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">تحقق أمني صارم جاري...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePublic;
