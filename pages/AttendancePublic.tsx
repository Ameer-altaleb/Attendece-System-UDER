
import React, { useState, useEffect } from 'react';
import { useApp } from '../store.tsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Clock, MapPin, User, LogIn, LogOut, CheckCircle2, AlertCircle, ShieldAlert, Smartphone, Wifi, Lock, BellRing, Check, Loader2, ShieldCheck, WifiOff } from 'lucide-react';
import { calculateDelay, calculateEarlyDeparture, calculateWorkingHours, getTodayDateString } from '../utils/attendanceLogic.ts';
import { AttendanceRecord, Employee, Notification } from '../types.ts';
import { supabase } from '../lib/supabase.ts';

// Generate a unique device fingerprint and store it permanently in the browser
const getDeviceId = () => {
  let id = localStorage.getItem('attendance_device_id');
  if (!id) {
    id = 'dev_secure_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('attendance_device_id', id);
  }
  return id;
};

const AttendancePublic: React.FC = () => {
  const { centers, attendance, addAttendance, updateAttendance, templates, updateEmployee, notifications, settings, refreshData } = useApp();
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'security' } | null>(null);
  const [userIP, setUserIP] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [ipLoading, setIpLoading] = useState(true);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);

  // Fetch employees list separately to ensure it is up to date
  useEffect(() => {
    const fetchEmps = async () => {
      const { data } = await supabase.from('employees').select('*');
      if (data) setEmployeesList(data);
    };
    fetchEmps();
    
    // Subscribe to changes
    const channel = supabase.channel('employees-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, payload => {
        fetchEmps();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

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
  
  const isIpAuthorized = selectedCenter?.authorizedIP 
    ? userIP === selectedCenter.authorizedIP 
    : true;

  // Manage administrative notifications
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
      const currentDeviceId = getDeviceId();
      
      // 1. Check IP (Center WiFi)
      if (selectedCenter.authorizedIP && userIP !== selectedCenter.authorizedIP) {
        setMessage({ 
          text: `فشل التحقق الشبكي: يجب الاتصال بشبكة WiFi المركز (${selectedCenter.name}) حصراً.`, 
          type: 'security' 
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Fetch latest employee data directly from DB to prevent tampering or stale state
      const { data: dbEmployee, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', selectedEmployeeId)
        .single();

      if (empError || !dbEmployee) throw new Error('Employee record missing');

      // 3. Account Lock verification
      if (dbEmployee.deviceId && dbEmployee.deviceId !== currentDeviceId) {
        setMessage({ 
          text: 'خطأ أمني: هذا الحساب مرتبط بجهاز آخر. يرجى استخدام جهازك الشخصي المسجل مسبقاً فقط.', 
          type: 'security' 
        });
        setIsSubmitting(false);
        return;
      }

      // 4. Device Lock verification (prevent multiple accounts on one device)
      const { data: conflictingEmployees, error: conflictError } = await supabase
        .from('employees')
        .select('name')
        .eq('deviceId', currentDeviceId)
        .neq('id', selectedEmployeeId);

      if (conflictError) throw conflictError;

      if (conflictingEmployees && conflictingEmployees.length > 0) {
        setMessage({ 
          text: `فشل الربط: هذا الجهاز مرتبط فعلياً بالموظف (${conflictingEmployees[0].name}). لا يسمح باستخدام نفس الجهاز لأكثر من حساب.`, 
          type: 'security' 
        });
        setIsSubmitting(false);
        return;
      }

      // 5. Link device if not already linked
      if (!dbEmployee.deviceId) {
        const { error: updateError } = await supabase
          .from('employees')
          .update({ deviceId: currentDeviceId })
          .eq('id', selectedEmployeeId);
          
        if (updateError) throw updateError;
        setEmployeesList(prev => prev.map(e => e.id === selectedEmployeeId ? { ...e, deviceId: currentDeviceId } : e));
      }

      // 6. Execute attendance action
      const today = getTodayDateString();
      const { data: existingRecords } = await supabase
        .from('attendance')
        .select('*')
        .eq('employeeId', selectedEmployeeId)
        .eq('date', today);

      const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

      if (type === 'in') {
        if (existing) {
          setMessage({ text: 'لقد سجلت دخولك مسبقاً لهذا اليوم.', type: 'error' });
        } else {
          const delay = calculateDelay(new Date(), selectedCenter.defaultStartTime);
          const record: AttendanceRecord = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId: selectedEmployeeId,
            centerId: dbEmployee.centerId,
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
      
      refreshData('attendance');
      
    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'حدث خطأ تقني في معالجة الطلب، يرجى المحاولة ثانية.', type: 'error' });
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-cairo text-right" dir="rtl">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl backdrop-blur-md">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <span className="text-white font-black tracking-widest uppercase text-sm">بوابة الحضور الرقمية الآمنة</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-white tracking-tighter">
              {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">
              {format(currentTime, 'EEEE، dd MMMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="grid grid-cols-1 gap-6 relative z-10">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">الموقع الميداني / المركز</label>
              <div className="relative group">
                <MapPin className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <select 
                  value={selectedCenterId} 
                  onChange={(e) => { setSelectedCenterId(e.target.value); setSelectedEmployeeId(''); setMessage(null); }}
                  className="w-full pr-14 pl-6 py-5 bg-white/5 border-2 border-white/10 rounded-3xl text-white font-black appearance-none focus:border-indigo-500 focus:bg-white/10 outline-none transition-all"
                >
                  <option value="" className="text-slate-900">-- اختر المركز الميداني --</option>
                  {centers.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className={`space-y-3 transition-all duration-500 ${!selectedCenterId ? 'opacity-30 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
              <label className="block text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">اسم الموظف الثلاثي</label>
              <div className="relative group">
                <User className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <select 
                  value={selectedEmployeeId} 
                  onChange={(e) => { setSelectedEmployeeId(e.target.value); setMessage(null); }}
                  className="w-full pr-14 pl-6 py-5 bg-white/5 border-2 border-white/10 rounded-3xl text-white font-black appearance-none focus:border-indigo-500 focus:bg-white/10 outline-none transition-all"
                >
                  <option value="" className="text-slate-900">-- ابحث عن اسمك في القائمة --</option>
                  {employeesList.filter(e => e.centerId === selectedCenterId).sort((a,b) => a.name.localeCompare(b.name, 'ar')).map(e => (
                    <option key={e.id} value={e.id} className="text-slate-900">{e.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4 relative z-10">
            <button 
              onClick={() => handleAction('in')}
              disabled={!selectedEmployeeId || isSubmitting}
              className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-[2rem] hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex flex-col items-center gap-2 group"
            >
              {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <LogIn className="w-8 h-8 group-hover:scale-110 transition-transform" />}
              <span className="text-xs uppercase tracking-widest">تسجيل دخول</span>
            </button>
            <button 
              onClick={() => handleAction('out')}
              disabled={!selectedEmployeeId || isSubmitting}
              className="flex-1 bg-slate-800 text-white font-black py-6 rounded-[2rem] hover:bg-slate-700 disabled:opacity-30 transition-all shadow-xl active:scale-95 flex flex-col items-center gap-2 group"
            >
              {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <LogOut className="w-8 h-8 group-hover:scale-110 transition-transform" />}
              <span className="text-xs uppercase tracking-widest">تسجيل خروج</span>
            </button>
          </div>

          {message && (
            <div className={`p-6 rounded-3xl border animate-in zoom-in-95 duration-300 relative z-10 ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 
              message.type === 'security' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' :
              'bg-amber-500/10 border-amber-500/50 text-amber-400'
            }`}>
              <div className="flex items-start gap-4">
                {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <ShieldAlert className="w-6 h-6 shrink-0" />}
                <p className="text-sm font-bold leading-relaxed">{message.text}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-8 py-4 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
             <div className={`w-2.5 h-2.5 rounded-full ${ipLoading ? 'bg-slate-500 animate-pulse' : isIpAuthorized ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               {ipLoading ? 'جاري التحقق من الشبكة...' : isIpAuthorized ? 'اتصال آمن (WiFi المركز)' : 'شبكة غير مصرح بها'}
             </p>
          </div>
          <div className="flex items-center gap-2 text-white/20">
             <Smartphone className="w-4 h-4" />
             <span className="text-[9px] font-black uppercase tracking-tighter">{getDeviceId().slice(0, 15)}...</span>
          </div>
        </div>
      </div>

      {activeNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20 text-slate-900 animate-in zoom-in-95 duration-500">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                <BellRing className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">{activeNotification.title}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">إشعار هام من الإدارة</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-slate-600 font-bold leading-relaxed text-right">{activeNotification.message}</p>
              </div>
              <button 
                onClick={handleDismissNotif}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest shadow-xl active:scale-95"
              >
                <Check className="w-5 h-5" /> لقد قرأت التعليمات وأفهمها
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePublic;
