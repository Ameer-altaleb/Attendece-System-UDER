
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Loader2, MessageSquareText, TrendingUp, BarChart } from 'lucide-react';
import { useApp } from '../store.tsx';
import { GoogleGenAI } from "@google/genai";

const GeminiAssistant: React.FC = () => {
  const { employees, attendance, centers, holidays } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'مرحباً! أنا مساعدك الذكي من Gemini. كيف يمكنني مساعدتك في تحليل بيانات الموظفين والمراكز اليوم؟' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateContext = () => {
    return {
      appName: "نظام إدارة الحضور والانصراف - Relief Experts",
      currentDate: new Date().toLocaleDateString('ar-SA'),
      stats: {
        totalEmployees: employees.length,
        totalCenters: centers.length,
        centersNames: centers.map(c => c.name),
        todayAttendanceCount: attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length,
        lateTodayCount: attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'late').length,
        holidaysCount: holidays.length
      },
      sampleData: attendance.slice(0, 10).map(a => ({
        employee: employees.find(e => e.id === a.employeeId)?.name,
        center: centers.find(c => c.id === a.centerId)?.name,
        status: a.status,
        delay: a.delayMinutes
      }))
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = generateContext();
      
      const prompt = `
        أنت مساعد ذكي خبير في تحليل البيانات لنظام إدارة حضور وانصراف موظفي Relief Experts.
        سياق البيانات الحالي: ${JSON.stringify(context)}
        سؤال المستخدم: ${userMessage}
        
        تعليمات:
        1. أجب باللغة العربية بأسلوب مهني ومختصر.
        2. استخدم البيانات المقدمة في السياق للإجابة بدقة.
        3. إذا طُلب منك إحصائيات، قم بحسابها بناءً على المعلومات المتاحة.
        4. إذا سألك عن شيء غير موجود في البيانات، أخبره بلطف أنك مبرمج لتحليل بيانات الحضور فقط.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      const botResponse = response.text || "عذراً، لم أتمكن من معالجة الطلب حالياً.";
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: 'حدث خطأ أثناء الاتصال بـ Gemini. يرجى التأكد من إعدادات الربط.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-[200] font-cairo" dir="rtl">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 left-0 w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500 origin-bottom-left">
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black">مساعد Gemini الذكي</h3>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">AI Data Analyst</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-white border-slate-100 text-slate-700' 
                    : 'bg-indigo-600 border-indigo-500 text-white font-bold'
                }`}>
                  <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-black uppercase">
                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    {msg.role === 'user' ? 'أنت' : 'Gemini'}
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-xs font-black text-indigo-600">جاري التحليل...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اسأل عن إحصائيات اليوم أو الموظفين..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5 mr-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button - Modified for Icon Only and Left Position */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'
        }`}
        title={isOpen ? 'إغلاق المساعد' : 'اسأل Gemini'}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          isOpen ? 'bg-white/20' : 'bg-indigo-600'
        }`}>
          {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 animate-pulse" />}
        </div>
        
        {!isOpen && (
          <div className="absolute -top-1 -left-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-indigo-500 border-2 border-white"></span>
          </div>
        )}
      </button>
    </div>
  );
};

export default GeminiAssistant;
