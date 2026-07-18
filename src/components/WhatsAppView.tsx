import React, { useState } from 'react';
import { DatabaseState, Student, Group, WhatsAppLog, UserSession } from '../types';
import { Send, Smartphone, Search, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface WhatsAppViewProps {
  db: DatabaseState;
  session: UserSession;
  onUpdateDb: (updated: DatabaseState) => void;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
}

export default function WhatsAppView({
  db,
  session,
  onUpdateDb,
  lang,
  translate
}: WhatsAppViewProps) {
  const isAuthorized = session.role === 'admin' || session.role === 'teacher';

  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Direct Dispatch State
  const [recipient, setRecipient] = useState('');
  const [customBody, setCustomBody] = useState('');

  // Template engine helper state
  const [selectedTemplate, setSelectedTemplate] = useState('attendance');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const templates = [
    {
      id: 'attendance',
      nameAr: 'إخطار حضور يومي',
      nameEn: 'Daily Attendance check',
      bodyAr: 'السلام عليكم ورحمة الله وبركاته، نود إعلامكم بأن ابننا الطالب/ {student} قد حضر اليوم حصة ({group}) بنجاح في تمام الساعة {time}. نتمنى له دوام التوفيق والتميز.\nأكاديمية Math Zone 🌹',
      bodyEn: 'Dear Parent, we would like to inform you that student {student} attended today\'s session ({group}) successfully at {time}. We wish them continued success.\nMath Zone Academy 🌹'
    },
    {
      id: 'absent',
      nameAr: 'إخطار غياب عن الحصة',
      nameEn: 'Absence notification',
      bodyAr: 'السلام عليكم ورحمة الله وبركاته، نود إحاطتكم علماً بغياب الطالب/ {student} عن حصة ({group}) المقررة اليوم. يرجى المتابعة والحرص على تعويض الدرس.\nمع تحيات أكاديمية Math Zone 🌹',
      bodyEn: 'Dear Parent, we regret to inform you that student {student} was absent from today\'s session ({group}). Please follow up to ensure they catch up.\nBest regards, Math Zone Academy 🌹'
    },
    {
      id: 'grade',
      nameAr: 'إعلان نتيجة اختبار',
      nameEn: 'Exam Result publish',
      bodyAr: 'السلام عليكم ورحمة الله وبركاته، نود مشاركتكم نتيجة اختبار الطالب/ {student} في (اختبار التفوق) لمادة الرياضيات بمجموعة ({group}). حصل الطالب على درجة: {grade} من {total}. يتمنى له مستر محمد دوام التميز والتفوق 🌟',
      bodyEn: 'Dear Parent, we are pleased to share student {student}\'s result in (Championship Quiz) for Math class ({group}). Score: {grade}/{total}. We wish them continuous excellence 🌟'
    },
    {
      id: 'fees',
      nameAr: 'طلب سداد رسوم',
      nameEn: 'Tuition fees overdue request',
      bodyAr: 'السلام عليكم ورحمة الله وبركاته، نود تذكيركم بموعد سداد الرسوم الشهرية للاشتراك الخاص بالطالب/ {student} في مجموعة ({group}) وقيمتها {fee} ج.م. شاكرين حسن تعاونكم معنا.\nإدارة أكاديمية Math Zone 💳',
      bodyEn: 'Dear Parent, we kindly remind you of the outstanding monthly tuition fee for student {student} in group ({group}) of amount {fee} EGP. Thank you for your continued support.\nMath Zone Academy 💳'
    }
  ];

  const handleApplyTemplate = () => {
    if (!selectedStudentId) {
      alert(lang === 'ar' ? 'يرجى تحديد طالب لتجميع بياناته داخل القالب' : 'Please select a student to compile tag placeholders.');
      return;
    }

    const student = db.students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const group = db.groups.find(g => g.id === student.groupId);
    const groupLabel = group ? (lang === 'ar' ? group.nameAr : group.nameEn) : 'Unassigned';

    const tpl = templates.find(t => t.id === selectedTemplate);
    if (!tpl) return;

    let body = lang === 'ar' ? tpl.bodyAr : tpl.bodyEn;

    // Replace tags
    body = body
      .replace(/{student}/g, student.name)
      .replace(/{group}/g, groupLabel)
      .replace(/{time}/g, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      .replace(/{grade}/g, '18') // dummy placeholders if no recent exam
      .replace(/{total}/g, '20')
      .replace(/{fee}/g, student.monthlyFee.toString());

    setRecipient(student.fatherPhone || student.motherPhone || student.studentPhone || '');
    setCustomBody(body);
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !customBody.trim()) {
      alert(lang === 'ar' ? 'يرجى كتابة رقم المستلم ومحتوى الرسالة' : 'Recipient number and message body are required.');
      return;
    }

    const dStr = new Date().toLocaleDateString();
    const tStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Create simulated dispatch logs
    const newLog: WhatsAppLog = {
      id: 'MSG' + Date.now() + Math.floor(Math.random() * 10),
      studentId: selectedStudentId || '',
      recipient: recipient.trim(),
      type: 'custom',
      message: customBody,
      date: `${dStr} ${tStr}`,
      status: 'sent' as const
    };

    onUpdateDb({
      ...db,
      whatsappLogs: [newLog, ...(db.whatsappLogs || [])]
    });

    alert(lang === 'ar' ? 'تم رصد وإرسال رسالة المحاكاة بنجاح عبر بوابة WhatsApp!' : 'Simulated message successfully dispatched via WhatsApp Gateway API.');
    setRecipient('');
    setCustomBody('');
    setSelectedStudentId('');
  };

  const handleResendMessage = (log: WhatsAppLog) => {
    const dStr = new Date().toLocaleDateString();
    const tStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      ...log,
      id: 'MSG_RE' + Date.now() + Math.floor(Math.random() * 10),
      date: `${dStr} ${tStr}`,
      status: 'sent' as const
    };

    onUpdateDb({
      ...db,
      whatsappLogs: [newLog, ...(db.whatsappLogs || [])]
    });
    alert(lang === 'ar' ? 'تم إعادة إرسال الرسالة!' : 'Simulated resend successfully completed.');
  };

  // Filter logs list
  const filteredLogs = (db.whatsappLogs || []).filter(log => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const student = db.students.find(s => s.id === log.studentId);
    const matchesName = student && student.name.toLowerCase().includes(q);

    return log.recipient.includes(q) || log.message.toLowerCase().includes(q) || matchesName;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
          {translate('whatsappGateway')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'ar' ? 'بوابة إرسال الإشعارات التلقائية والرسائل لأولياء الأمور بنظام المحاكاة' : 'Simulated bulk broadcast gateway to parents and students via WhatsApp APIs'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bulk Dispatch / Template Compiler Column (Spans 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <span>{lang === 'ar' ? 'محرر وتجميع قوالب الرسائل الذكية' : 'Intelligent Tags Template Compiler'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Choose template */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'قالب الإشعار الجاهز' : 'Pre-built Template'}</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{lang === 'ar' ? t.nameAr : t.nameEn}</option>
                ))}
              </select>
            </div>

            {/* Select Target Student for info fetch */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'سحب بيانات الطالب:' : 'Populate with student data:'}</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              >
                <option value="">{lang === 'ar' ? 'اختر طالباً لتجميع البيانات...' : 'Select student profile...'}</option>
                {db.students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyTemplate}
            className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm"
          >
            {lang === 'ar' ? 'تطبيق وتجميع القالب ⚙' : 'Compile Template Tags ⚙'}
          </button>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-5 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">رموز التخصيص المتاحة (Tags):</span>
            <div className="flex gap-2 flex-wrap text-[10px] text-purple-600 dark:text-purple-400 font-mono">
              <span>{`{student}`}</span>
              <span>{`{group}`}</span>
              <span>{`{time}`}</span>
              <span>{`{grade}`}</span>
              <span>{`{total}`}</span>
              <span>{`{fee}`}</span>
            </div>
          </div>

        </div>

        {/* Custom manual / Direct Dispatch column (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-500" />
            <span>{lang === 'ar' ? 'إرسال رسالة مخصصة فوراً' : 'Manual Push Dispatcher'}</span>
          </h3>

          <form onSubmit={handleSendCustomMessage} className="space-y-4">
            {/* Recipient Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'رقم هاتف المستلم' : 'Recipient Phone Number'}</label>
              <input 
                type="tel" 
                required 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'محتوى نص الرسالة' : 'Message Body'}</label>
              <textarea 
                rows={5}
                required 
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل تفاصيل الإعلان العام لأولياء الأمور...' : 'Type message detail...'}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3 shadow-md shadow-indigo-500/10 transition-all text-xs flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إرسال محاكاة' : 'Simulate Send'}</span>
            </button>
          </form>

        </div>

      </div>

      {/* Historical Dispatched Logs Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/20">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            {lang === 'ar' ? 'سجل العمليات والرسائل الصادرة' : 'Simulated Gateway Logs'}
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:right-3 ltr:left-3" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث باسم الطالب أو الرقم...' : 'Search student or number...'}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl pr-9 pl-3 ltr:pl-9 ltr:pr-3 py-1.5 text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-center font-bold text-slate-500">
                <th className="p-4 text-right">Message ID</th>
                <th className="p-4">{lang === 'ar' ? 'الطالب المعني' : 'Student'}</th>
                <th className="p-4">{lang === 'ar' ? 'رقم المستلم' : 'Recipient'}</th>
                <th className="p-4 text-right">{lang === 'ar' ? 'محتوى نص الرسالة' : 'Dispatched Message'}</th>
                <th className="p-4">{lang === 'ar' ? 'تاريخ الإرسال' : 'Sent date'}</th>
                <th className="p-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-4">{lang === 'ar' ? 'الإجراء' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const student = db.students.find(s => s.id === log.studentId);
                const sName = student ? student.name : '-';
                return (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 text-center hover:bg-slate-50/50">
                    <td className="p-4 font-mono text-[10.5px] text-slate-400">{log.id}</td>
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">{sName}</td>
                    <td className="p-4 font-mono text-slate-500 font-bold">{log.recipient}</td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-350 max-w-sm font-semibold truncate leading-relaxed">{log.message}</td>
                    <td className="p-4 font-mono text-slate-400">{log.date}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 w-20 mx-auto">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Sent</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleResendMessage(log)}
                        className="text-purple-600 hover:text-purple-700 font-bold flex items-center justify-center gap-1 hover:underline mx-auto"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-semibold">
                    {lang === 'ar' ? 'سجل الإرسال فارغ حالياً' : 'Dispatches history is empty.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
