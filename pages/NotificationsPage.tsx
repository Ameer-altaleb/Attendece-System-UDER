
import React, { useState } from 'react';
import { useApp } from '../store';
import { Send, Bell, User, Building2, Users, Search, Filter, X, CheckCircle, Clock, LayoutGrid, Trash2, Info } from 'lucide-react';
import { Notification } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const NotificationsPage: React.FC = () => {
  const { notifications, addNotification, deleteNotification, employees, centers, currentUser } = useApp();
  const [isModalOpen, setModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'center' | 'employee'>('all');
  const [targetId, setTargetId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || (targetType !== 'all' && !targetId)) return;

    setIsSending(true);

    // Simulate Processing
    setTimeout(() => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        message,
        targetType,
        targetId,
        senderName: currentUser?.name || 'الإدارة',
        sentAt: new Date().toISOString()
      };

      addNotification(newNotification);
      setIsSending(false);
      setModalOpen(false);
      // Reset
      setTitle(''); setMessage(''); setTargetType('all'); setTargetId('');
    }, 800);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التنبيه؟ لن يظهر للموظفين بعد الآن.')) {
      deleteNotification(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة التنبيهات المنبثقة</h1>
          <p className="text-slate-500 font-bold">إنشاء تعاميم تظهر للموظفين فور فتحهم لنظام تسجيل الحضور</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Bell className="w-4 h-4" /> إضافة تنبيه جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Notification History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest text-right">الإشعارات النشطة حالياً</h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">{notifications.length} إشعار نظامي</span>
          </div>

          <div className="space-y-4">
            {notifications.map((notif) => (
              <div key={notif.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex items-start gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    notif.targetType === 'all' ? 'bg-indigo-50 text-indigo-600' :
                    notif.targetType === 'center' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {notif.targetType === 'all' ? <Users className="w-6 h-6" /> :
                     notif.targetType === 'center' ? <Building2 className="w-6 h-6" /> :
                     <User className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-black text-slate-900 text-lg">{notif.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase">بواسطة: {notif.senderName}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">
                            {format(new Date(notif.sentAt), 'hh:mm a • dd MMM', { locale: ar })}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(notif.id)}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="حذف التنبيه"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
                       <p className="text-sm text-slate-600 font-bold leading-relaxed">{notif.message}</p>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        notif.targetType === 'all' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        notif.targetType === 'center' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        المستهدف: {notif.targetType === 'all' ? 'كافة الموظفين' : notif.targetType === 'center' ? 'مركز محدد' : 'موظف محدد'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" /> يظهر حالياً في النظام
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <LayoutGrid className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-slate-400 font-bold">لا توجد تنبيهات منبثقة نشطة</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Pop-up notifications will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Usage Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
             <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black">كيف يعمل النظام؟</h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed">
                  عند إضافة تنبيه، سيظهر فوراً كـ "نافذة منبثقة" للموظف المستهدف بمجرد اختياره لاسمه في صفحة الحضور. لا يمكن للموظف إتمام تسجيل الحضور إلا بعد الضغط على "فهمت".
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[10px] font-black text-indigo-400">
                    <div className="w-1 h-1 bg-indigo-400 rounded-full"></div> تنبيهات فورية
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-black text-indigo-400">
                    <div className="w-1 h-1 bg-indigo-400 rounded-full"></div> ضمان القراءة
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-black text-indigo-400">
                    <div className="w-1 h-1 bg-indigo-400 rounded-full"></div> حذف تلقائي من الإدارة
                  </li>
                </ul>
             </div>
             <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all"></div>
          </div>

          <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 shadow-sm space-y-4">
             <div className="flex items-center gap-3 text-amber-700">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-black text-sm">ملاحظة الحذف</h4>
             </div>
             <p className="text-xs text-amber-800/70 font-bold leading-relaxed">
                بمجرد قيامك بحذف التنبيه من هذه اللوحة، سيتوقف ظهوره فوراً لجميع الموظفين.
             </p>
          </div>
        </div>
      </div>

      {/* Add Notification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">إنشاء تنبيه منبثق جديد</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Create Internal Alert</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">عنوان التنبيه</label>
                  <input
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                    placeholder="مثال: تعليمات جديدة بخصوص السلامة"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">الظهور لـ</label>
                    <select
                      value={targetType} onChange={(e) => { setTargetType(e.target.value as any); setTargetId(''); }}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-600 appearance-none"
                    >
                      <option value="all">كافة الموظفين</option>
                      <option value="center">مركز محدد</option>
                      <option value="employee">موظف محدد</option>
                    </select>
                  </div>
                  
                  {targetType !== 'all' && (
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">
                        {targetType === 'center' ? 'تحديد المركز' : 'تحديد الموظف'}
                      </label>
                      <select
                        required value={targetId} onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-slate-600 appearance-none"
                      >
                        <option value="">-- اختر --</option>
                        {targetType === 'center' 
                          ? centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                          : employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                        }
                      </select>
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">محتوى التنبيه (يظهر للموظف)</label>
                  <textarea
                    required rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700 resize-none"
                    placeholder="اكتب التعليمات أو الإشعار الذي يجب على الموظف قراءته..."
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={isSending}
                  className="flex-2 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex-grow uppercase text-xs tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? 'جاري النشر...' : <><Bell className="w-4 h-4" /> نشر التنبيه في النظام</>}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
