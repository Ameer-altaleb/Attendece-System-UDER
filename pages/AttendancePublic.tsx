
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store.tsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  LogIn, LogOut, CheckCircle2, ShieldAlert, Smartphone, 
  BellRing, Check, Loader2, ShieldCheck, MapPin, User, Clock, Globe, AlertTriangle
} from 'lucide-react';
import { calculateDelay, calculateEarlyDeparture, calculateWorkingHours, getTodayDateString } from '../utils/attendanceLogic.ts';
import { AttendanceRecord, Employee, Notification } from '../types.ts';
import { supabase } from '../lib/supabase.ts';

const getDeviceId = () => {
  let id = localStorage.getItem('attendance_device_id');
  if (!id) {
    id = 'dev_auth_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('attendance_device_id', id);
  }
  return id;
};

const AttendancePublic: React.FC = () => {
  const { centers, attendance, addAttendance, updateAttendance, templates, notifications, refreshData } = useApp();
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
  // Time Synchronization State (Target: Syria/Turkey GMT+3)
  const [timeOffset, setTimeOffset] = useState(0);
  const [isTimeSynced, setIsTimeSynced] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'security' } | null>(null);
  const [userIP, setUserIP] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [ipLoading, setIpLoading] = useState(true);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);

  const activeCenters = useMemo(() => centers.filter(c => c.isActive), [centers]);

  // Network Time Sync Logic targeting Syria/Turkey Time
  const syncWithNetworkTime = async () => {
    // We target Istanbul/Damascus as they share the same time zone (GMT+3)
    const timeAPIs = [
      'https://timeapi.io/api/Time/current/zone?timeZone=Europe/Istanbul',
      'https://worldtimeapi.org/api/timezone/Europe/Istanbul',
      'https://worldtimeapi.org/api/timezone/Asia/Damascus'
    ];

    for (const apiUrl of timeAPIs) {
      try {
        const start = Date.now();
        const response = await fetch(apiUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('API Response Error');
        
        const data = await response.json();
        // TimeAPI.io (dateTime), WorldTimeAPI (datetime)
        const remoteDateStr = data.dateTime || data.datetime;
        const networkTime = new Date(remoteDateStr).getTime();
        
        const end = Date.now();
        const latency = (end - start) / 2;
        
        const correctedNetworkTime = networkTime + latency;
        const localDeviceTime = Date.now();
        
        // Offset is the difference between forced Regional Time and Local Device Time
        setTimeOffset(correctedNetworkTime - localDeviceTime);
        setIsTimeSynced(true);
        setSyncError(false);
        console.log(`Time synced with Regional Server (GMT+3) via ${apiUrl}. Offset: ${correctedNetworkTime - localDeviceTime}ms`);
        return; 
      } catch (err) {
        console.warn(`Failed to sync with ${apiUrl}:`, err);
      }
    }

    setIsTimeSynced(false);
    setSyncError(true);
  };

  useEffect(() => {
    syncWithNetworkTime();
    const syncInterval = setInterval(syncWithNetworkTime, 300000); // Re-sync every 5 min
    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    const fetchEmps = async () => {
      const { data } = await supabase.from('employees').select('*');
      if (data) setEmployeesList(data);
    };
    fetchEmps();
    
    const channel = supabase.channel('realtime-employees')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        fetchEmps();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      // The current time is always local device time + the calculated offset to Regional GMT+3
      const syncedDate = new Date(Date.now() + timeOffset);
      setCurrentTime(syncedDate);
    }, 1000);
    
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
  }, [timeOffset]);

  const selectedCenter = useMemo(() => centers.find(c => c.id === selectedCenterId), [centers, selectedCenterId]);
  
  const isIpAuthorized = useMemo(() => {
    if (!selectedCenter?.authorizedIP) return true;
    return userIP === selectedCenter.authorizedIP;
  }, [selectedCenter, userIP]);

  useEffect(() => {
    if (selectedEmployeeId) {
      const relevantNotif = notifications.find(n => 
        n.targetType === 'all' || 
        (n.targetType === 'center' && n.targetId === selectedCenterId) ||
        (n.targetType === 'employee' && n.targetId === selectedEmployeeId)
      );
      
      if (relevantNotif) {
        const dismissed = sessionStorage.getItem(`notif_seen_${relevantNotif.id}_${selectedEmployeeId}`);
        if (!dismissed) setActiveNotification(relevantNotif);
      }
    }
  }, [selectedEmployeeId, selectedCenterId, notifications]);

  const handleAction = async (type: 'in' | 'out') => {
    if (!selectedEmployeeId || !selectedCenter || isSubmitting) return;
    
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Crucial: Use currentSyncedTime which is GMT+3 from network
      const currentSyncedTime = new Date(Date.now() + timeOffset);
      const currentDeviceId = getDeviceId();
      
      if (selectedCenter.authorizedIP && userIP !== selectedCenter.authorizedIP) {
        setMessage({ 
          text: `فشل التحقق الشبكي: يجب الاتصال بشبكة WiFi المركز (${selectedCenter.name}) حصراً.`, 
          type: 'security' 
        });
        setIsSubmitting(false);
        return;
      }

      const { data: dbEmployee, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', selectedEmployeeId)
        .single();

      if (empError || !dbEmployee) throw new Error('Employee record missing');

      if (dbEmployee.deviceId && dbEmployee.deviceId !== currentDeviceId) {
        setMessage({ 
          text: 'خطأ أمني: حسابك مرتبط بجهاز آخر. لا يسمح بتسجيل الدخول إلا من جهازك الشخصي المسجل.', 
          type: 'security' 
        });
        setIsSubmitting(false);
        return;
      }

      const { data: conflicts } = await supabase
        .from('employees')
        .select('name')
        .eq('deviceId', currentDeviceId)
        .neq('id', selectedEmployeeId);

      if (conflicts && conflicts.length > 0) {
        setMessage({ 
          text: `هذا الجهاز مستخدم بالفعل من قبل موظف آخر (${conflicts[0].name}). يمنع تعدد الحسابات على جهاز واحد.`, 
          type: 'security' 
        });
        setIsSubmitting(false);
        return;
      }

      if (!dbEmployee.deviceId) {
        await supabase.from('employees').update({ deviceId: currentDeviceId }).eq('id', selectedEmployeeId);
      }

      const today = format(currentSyncedTime, 'yyyy-MM-dd');
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employeeId', selectedEmployeeId)
        .eq('date', today)
        .maybeSingle();

      if (type === 'in') {
        if (attendanceData) {
          setMessage({ text: 'لقد سجلت دخولك مسبقاً لهذا اليوم.', type: 'error' });
        } else {
          const delay = calculateDelay(currentSyncedTime, selectedCenter.defaultStartTime, selectedCenter.checkInGracePeriod);
          const record: AttendanceRecord = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId: selectedEmployeeId,
            centerId: dbEmployee.centerId,
            date: today,
            checkIn: currentSyncedTime.toISOString(),
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
        if (!attendanceData) {
          setMessage({ text: 'يرجى تسجيل الدخول أولاً.', type: 'error' });
        } else if (attendanceData.checkOut) {
          setMessage({ text: 'لقد سجلت خروجك مسبقاً.', type: 'error' });
        } else {
          const now = currentSyncedTime;
          const early = calculateEarlyDeparture(now, selectedCenter.defaultEndTime, selectedCenter.checkOutGracePeriod);
          const hours = calculateWorkingHours(new Date(attendanceData.checkIn!), now);
          await updateAttendance({
            ...attendanceData,
            checkOut: now.toISOString(),
            earlyDepartureMinutes: early,
            workingHours: hours
          });
          const template = templates.find(t => t.type === (early > 0 ? 'early_check_out' : 'check_out'));
          setMessage({ text: template?.content.replace('{minutes}', early.toString()) || 'تم تسجيل الخروج بنجاح', type: 'success' });
        }
      }
      refreshData('attendance');
    } catch (err) {
      console.error(err);
      setMessage({ text: 'حدث خطأ في النظام، يرجى إعادة المحاولة.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissNotif = () => {
    if (activeNotification && selectedEmployeeId) {
      sessionStorage.setItem(`notif_seen_${activeNotification.id}_${selectedEmployeeId}`, 'true');
      setActiveNotification(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-cairo text-right relative overflow-hidden" dir="rtl">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-600/5 -skew-y-6 -translate-y-48"></div>
      
      <div className="w-full max-w-xl space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative z-10">
        <div className="text-center space-y-6 md:space-y-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-4 md:gap-8 px-6 py-4 md:px-10 md:py-6 bg-white border-2 md:border-4 border-indigo-600/10 rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.15)] transform hover:scale-[1.01] transition-all duration-500">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-400/30 shrink-0">
              <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div className="text-right">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tight">Relief Experts</h2>
              <div className="h-1 w-full bg-indigo-600/20 rounded-full my-1.5"></div>
              <p className="text-lg md:text-xl font-black text-indigo-600 tracking-tight">خبراء الإغاثة</p>
            </div>
          </div>
          
          <div className="space-y-1 relative">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter flex items-center justify-center gap-3">
              <span className="bg-slate-100/80 px-4 py-1.5 md:px-6 md:py-2 rounded-3xl shadow-inner border border-slate-200/50">
                {format(currentTime, 'HH:mm')}
              </span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <p className="text-slate-400 font-bold text-[11px] md:text-xs uppercase tracking-wider">
                {format(currentTime, 'EEEE، dd MMMM yyyy', { locale: ar })}
              </p>
              
              {isTimeSynced ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full" title="تمت المزامنة بنجاح مع توقيت (سوريا/تركيا) الرسمي">
                  <Globe className="w-3 h-3 text-emerald-500" />
                  <span className="text-[8px] font-black text-emerald-600 uppercase">GMT+3 Sync Active</span>
                </div>
              ) : syncError ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-full cursor-help" title="فشل الاتصال بمزود الوقت الإقليمي. تم استخدام توقيت الجهاز المحلي مؤقتاً.">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span className="text-[8px] font-black text-rose-600 uppercase">Device Time Mode</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-full" title="جاري جلب التوقيت الرسمي لسوريا وتركيا عبر الشبكة...">
                  <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                  <span className="text-[8px] font-black text-amber-600 uppercase">Syncing Regional Time...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(15,23,42,0.1)] border border-slate-100 space-y-6 md:space-y-8 relative overflow-hidden">
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <div className="space-y-2 md:space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase mr-5 tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3" /> موقع العمل
              </label>
              <div className="relative group">
                <select 
                  value={selectedCenterId} 
                  onChange={(e) => { setSelectedCenterId(e.target.value); setSelectedEmployeeId(''); setMessage(null); }}
                  className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-3xl text-slate-900 font-black appearance-none focus:border-indigo-600 focus:bg-white outline-none transition-all cursor-pointer text-sm md:text-base"
                >
                  <option value="">اختر المركز الميداني...</option>
                  {activeCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className={`space-y-2 md:space-y-3 transition-all duration-700 ${!selectedCenterId ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
              <label className="block text-[10px] font-black text-slate-400 uppercase mr-5 tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> هوية الموظف
              </label>
              <div className="relative group">
                <select 
                  value={selectedEmployeeId} 
                  onChange={(e) => { setSelectedEmployeeId(e.target.value); setMessage(null); }}
                  className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-3xl text-slate-900 font-black appearance-none focus:border-indigo-600 focus:bg-white outline-none transition-all cursor-pointer text-sm md:text-base"
                >
                  <option value="">ابحث عن اسمك هنا...</option>
                  {employeesList
                    .filter(e => e.centerId === selectedCenterId && e.isActive)
                    .sort((a,b) => a.name.localeCompare(b.name, 'ar'))
                    .map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 md:gap-4 pt-2 md:pt-4">
            <button 
              onClick={() => handleAction('in')}
              disabled={!selectedEmployeeId || isSubmitting || !isIpAuthorized}
              className="flex-1 bg-emerald-600 text-white font-black py-5 md:py-7 rounded-2xl md:rounded-[2.5rem] hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 disabled:opacity-20 transition-all active:scale-95 flex flex-col items-center gap-1.5 md:gap-2 group"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" /> : <LogIn className="w-6 h-6 md:w-8 md:h-8" />}
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-black">تسجيل حضور</span>
            </button>
            <button 
              onClick={() => handleAction('out')}
              disabled={!selectedEmployeeId || isSubmitting || !isIpAuthorized}
              className="flex-1 bg-indigo-600 text-white font-black py-5 md:py-7 rounded-2xl md:rounded-[2.5rem] hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 disabled:opacity-20 transition-all active:scale-95 flex flex-col items-center gap-1.5 md:gap-2 group"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" /> : <LogOut className="w-6 h-6 md:w-8 md:h-8" />}
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-black">تسجيل انصراف</span>
            </button>
          </div>

          {message && (
            <div className={`p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] border-2 animate-in zoom-in-95 duration-500 ${
              message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
              message.type === 'security' ? 'bg-rose-50 border-rose-100 text-rose-700' :
              'bg-amber-50 border-amber-100 text-amber-700'
            }`}>
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white shadow-sm shrink-0 ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" />}
                </div>
                <p className="text-xs md:text-sm font-black leading-relaxed">{message.text}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 md:px-10 md:py-5 bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2.5 md:gap-3">
             <div className={`w-2.5 h-2.5 rounded-full ${ipLoading ? 'bg-slate-300 animate-pulse' : isIpAuthorized ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]'}`}></div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               {ipLoading ? 'جاري التحقق...' : isIpAuthorized ? 'اتصال آمن وموثق' : 'خارج النطاق المسموح'}
             </p>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
             <Globe className={`w-4 h-4 ${isTimeSynced ? 'text-indigo-400' : 'text-slate-300'}`} />
             <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">{isTimeSynced ? 'Regional Time Protection: GMT+3' : syncError ? 'Security Guard: Offline Sync' : 'Syncing Regional Protection...'}</span>
          </div>
        </div>
      </div>

      {activeNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-700">
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] w-full max-w-lg shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 md:p-12 text-center space-y-6 md:space-y-8">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <BellRing className="w-10 h-10 md:w-12 md:h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{activeNotification.title}</h3>
                <p className="text-[9px] md:text-[10px] text-indigo-600 font-black uppercase tracking-[0.3em]">إدارة شؤون الموظفين</p>
              </div>
              <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-inner">
                <p className="text-slate-600 font-bold leading-loose text-base md:text-lg">{activeNotification.message}</p>
              </div>
              <button 
                onClick={handleDismissNotif}
                className="w-full bg-slate-900 text-white font-black py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] hover:bg-black transition-all flex items-center justify-center gap-3 uppercase text-[10px] md:text-xs tracking-widest active:scale-95 shadow-xl shadow-slate-900/20"
              >
                <Check className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" /> قرأت وأوافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePublic;
