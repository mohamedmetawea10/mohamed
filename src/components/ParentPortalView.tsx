import React, { useState } from 'react';
import { DatabaseState, Student, Group, AttendanceRecord, GradeRecord, Transaction, ParentNotification, UserSession } from '../types';
import { 
  Award, Calendar, CreditCard, Bell, Printer, Smartphone, User, 
  TrendingUp, CheckCircle, ShieldAlert, Sparkles, BookOpen 
} from 'lucide-react';

interface ParentPortalViewProps {
  db: DatabaseState;
  session: UserSession;
  onUpdateDb: (updated: DatabaseState) => void;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
}

export default function ParentPortalView({
  db,
  session,
  onUpdateDb,
  lang,
  translate
}: ParentPortalViewProps) {
  // Find Parent profile matching parent ID (which is session.username)
  const parentProfile = db.parents.find(p => p.id === session.username);
  
  // Linked student IDs
  const linkedStudentIds = parentProfile?.studentIds || (session.studentId ? [session.studentId] : []);
  
  // Set first child as active default
  const [activeChildId, setActiveChildId] = useState<string>(linkedStudentIds[0] || '');

  // Get active student profile
  const activeStudent = db.students.find(s => s.id === activeChildId);

  // Group Details
  const groupObj = activeStudent ? db.groups.find(g => g.id === activeStudent.groupId) : null;
  const groupName = groupObj ? (lang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';

  // Attendance Records for child
  const childAttendance = db.attendance.filter(a => a.studentId === activeChildId);
  const totalCheckedSessions = childAttendance.length;
  const attendedSessions = childAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = totalCheckedSessions > 0 ? Math.round((attendedSessions / totalCheckedSessions) * 100) : 100;

  // Grade Records for child
  const childGrades = db.grades.filter(g => g.studentId === activeChildId);

  // Fee payments transactions for child
  const childPayments = db.transactions.filter(t => t.studentId === activeChildId && t.category === 'monthly-fees');

  // Filter Parent notifications for child
  const childNotifications = (db.parentNotifications || []).filter(n => n.studentId === activeChildId);

  const handleMarkAllRead = () => {
    const updatedNotifications = (db.parentNotifications || []).map(n => {
      if (n.studentId === activeChildId) {
        return { ...n, read: true };
      }
      return n;
    });

    onUpdateDb({
      ...db,
      parentNotifications: updatedNotifications
    });
  };

  const handlePrintCard = (student: Student) => {
    const group = db.groups.find(g => g.id === student.groupId);
    const gName = group ? (lang === 'ar' ? group.nameAr : group.nameEn) : 'Unassigned';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(student.id)}`;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Student Smart Card - ${student.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&family=Outfit:wght@400;700&display=swap');
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #ffffff;
              direction: rtl;
              font-family: 'Cairo', 'Outfit', sans-serif;
            }
            .student-id-card {
              width: 320px;
              height: 480px;
              background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%);
              border-radius: 20px;
              border: 4px solid #ffffff;
              box-shadow: 0 10px 25px rgba(0,0,0,0.15);
              overflow: hidden;
              position: relative;
              display: flex;
              flex-direction: column;
              color: #ffffff;
            }
            .student-id-card-pattern {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: radial-gradient(circle, #ffffff 1px, transparent 1px);
              background-size: 15px 15px;
              opacity: 0.08;
              z-index: 1;
            }
            .student-id-card-header {
              height: 60px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 20px;
              z-index: 2;
            }
            .id-header-logo {
              font-size: 13px;
              font-weight: 800;
            }
            .id-header-title {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.9;
            }
            .student-id-card-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
              z-index: 2;
            }
            .student-id-card-body img.avatar {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #ffffff;
              margin-bottom: 10px;
            }
            .student-id-name {
              font-size: 15px;
              font-weight: 800;
              margin: 0 0 4px 0;
            }
            .student-id-level {
              font-size: 11px;
              color: #1e3a8a;
              background: #ffffff;
              padding: 3px 12px;
              border-radius: 99px;
              font-weight: 700;
              margin-bottom: 12px;
            }
            .student-id-details {
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 4px;
              font-size: 11px;
              opacity: 0.9;
              border-top: 1px dashed rgba(255, 255, 255, 0.2);
              padding-top: 10px;
              margin-bottom: 12px;
            }
            .student-id-details div {
              display: flex;
              justify-content: space-between;
            }
            .student-id-qr {
              margin-top: auto;
              background: #ffffff;
              padding: 6px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 90px;
              height: 90px;
            }
            .student-id-qr img {
              width: 80px;
              height: 80px;
            }
            .student-id-card-footer {
              height: 45px;
              background: rgba(0, 0, 0, 0.15);
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 20px;
              font-size: 10px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              z-index: 2;
            }
          </style>
        </head>
        <body>
          <div class="student-id-card">
            <div class="student-id-card-pattern"></div>
            <div class="student-id-card-header">
              <span class="id-header-logo">${db.siteSettings.centerNameAr}</span>
              <span class="id-header-title">Student Card</span>
            </div>
            <div class="student-id-card-body">
              <img class="avatar" src="${student.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'}" alt="Student Photo">
              <h4 class="student-id-name">${student.name}</h4>
              <span class="student-id-level">${student.academicLevel}</span>
              <div class="student-id-details">
                <div><strong>ID:</strong> <span>${student.id}</span></div>
                <div><strong>Group:</strong> <span>${gName}</span></div>
                <div><strong>Phone:</strong> <span>${student.studentPhone || student.fatherPhone || '-'}</span></div>
                <div><strong>Barcode:</strong> <span>${student.barcode}</span></div>
              </div>
              <div class="student-id-qr">
                <img src="${qrUrl}" alt="QR">
              </div>
            </div>
            <div class="student-id-card-footer">
              <span>${db.siteSettings.teacherName}</span>
              <span>📞 ${db.siteSettings.teacherPhone}</span>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!activeStudent) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center rounded-2xl">
        <p className="text-sm text-slate-400 font-bold">
          {lang === 'ar' ? 'لم يتم العثور على أي كود طالب مرتبط بملفك الشخصي.' : 'No linked student profiles found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls with Child Selector switcher if multiple are linked */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {lang === 'ar' ? `بوابة ولي الأمر: أ. ${parentProfile?.name || ''}` : `Parent Hub: Mr/Ms. ${parentProfile?.name || ''}`}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' ? 'متابعة أداء حضور وغياب واختبارات أبنائكم بالتفصيل والتقارير الشهرية' : 'View report cards, track grades, check-in history and fee statuses'}
          </p>
        </div>

        {linkedStudentIds.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">{lang === 'ar' ? 'تغيير الابن:' : 'Switch Child:'}</span>
            <select
              value={activeChildId}
              onChange={(e) => setActiveChildId(e.target.value)}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
            >
              {linkedStudentIds.map(stId => {
                const child = db.students.find(s => s.id === stId);
                return (
                  <option key={stId} value={stId}>{child ? child.name : stId}</option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Child Profile Showcase Card Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-violet-600/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right rtl:sm:text-right ltr:sm:text-left z-10">
          <img 
            src={activeStudent.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'} 
            alt="Child Photo" 
            className="w-20 h-20 rounded-full object-cover border-4 border-slate-700/50 shadow-md"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              <strong className="text-lg font-black">{activeStudent.name}</strong>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Level: <span className="text-purple-400 font-bold">{activeStudent.academicLevel}</span> • Group: <span className="text-purple-400 font-bold">{groupName}</span>
            </p>
            <p className="text-[10.5px] text-slate-400 font-mono">Student ID: {activeStudent.id}</p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 z-10">
          <button
            onClick={() => handlePrintCard(activeStudent)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow shadow-purple-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طباعة بطاقة الكارنيه' : 'Download Smart Card'}</span>
          </button>
        </div>
      </div>

      {/* Metric Rings / Bento box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Attendance Percentage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10.5px] font-bold text-slate-400 block">{lang === 'ar' ? 'معدل الحضور والانضباط' : 'Attendance Rate'}</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{attendanceRate}%</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${attendanceRate >= 85 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-500'}`}>
              {attendanceRate >= 85 ? (lang === 'ar' ? 'ممتاز' : 'Excellent') : (lang === 'ar' ? 'ضعيف' : 'Needs Focus')}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full" style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>

        {/* Checked sessions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10.5px] font-bold text-slate-400 block">{lang === 'ar' ? 'إجمالي الحصص المسجلة' : 'Sessions Tracked'}</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {attendedSessions} <span className="text-xs text-slate-400 font-medium">/ {totalCheckedSessions}</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold">
            {lang === 'ar' ? `الغياب: ${totalCheckedSessions - attendedSessions} حصة` : `Absence logs: ${totalCheckedSessions - attendedSessions}`}
          </p>
        </div>

        {/* Exams Attempted */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10.5px] font-bold text-slate-400 block">{lang === 'ar' ? 'الاختبارات والتقييمات' : 'Assessments Solved'}</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {childGrades.length} <span className="text-xs text-slate-400 font-semibold">{lang === 'ar' ? 'اختبار' : 'exams'}</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold">
            {lang === 'ar' ? 'تغطية كاملة للمنهج الدراسي' : 'Complete curriculum syllabus coverage'}
          </p>
        </div>

        {/* Subscription state */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10.5px] font-bold text-slate-400 block">{lang === 'ar' ? 'الرسوم والاشتراك المالي' : 'Tuition Billing'}</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {activeStudent.monthlyFee} ج.م <span className="text-[10px] text-slate-400 font-medium">/{activeStudent.subscriptionType === 'monthly' ? translate('monthly') : translate('perSession')}</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold">
            {lang === 'ar' ? 'نظام تحصيل وتأمين الكتروني' : 'Secure instant receipt ledger'}
          </p>
        </div>

      </div>

      {/* Grid: Details sheets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Grades & Attendance (Spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* GRADES CARD LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3 mb-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>{lang === 'ar' ? 'الدرجات ونتائج الاختبارات المفصلة' : 'Detailed Examination Scoresheet'}</span>
            </h3>

            {childGrades.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs font-medium">
                {lang === 'ar' ? 'لا يوجد درجات مسجلة لهذا الطالب بعد' : 'No examinations records posted yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-center font-bold text-slate-500">
                      <th className="p-3 text-right">{lang === 'ar' ? 'عنوان الاختبار' : 'Exam description'}</th>
                      <th className="p-3">{translate('examType')}</th>
                      <th className="p-3">{lang === 'ar' ? 'الدرجة المحصلة' : 'Your Score'}</th>
                      <th className="p-3">{lang === 'ar' ? 'الدرجة الكلية' : 'Total'}</th>
                      <th className="p-3">{lang === 'ar' ? 'الأداء' : 'Grade rating'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childGrades.map(g => {
                      const pct = Math.round((g.score / g.totalMarks) * 100);
                      return (
                        <tr key={g.id} className="border-b border-slate-55 dark:border-slate-850 text-center hover:bg-slate-50/50">
                          <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-100">{g.title}</td>
                          <td className="p-3 text-slate-400">{g.type}</td>
                          <td className="p-3 font-black text-slate-900 dark:text-white">{g.score}</td>
                          <td className="p-3 text-slate-400">{g.totalMarks}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${pct >= 85 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : (pct >= 50 ? 'bg-orange-50 text-orange-500 dark:bg-orange-950/20 dark:text-orange-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450')}`}>
                              {pct >= 85 ? (lang === 'ar' ? 'ممتاز' : 'Excellent') : (pct >= 50 ? (lang === 'ar' ? 'جيد' : 'Good') : (lang === 'ar' ? 'يحتاج تحسين' : 'Weak'))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ATTENDANCE TIMELINE HISTORY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3 mb-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{lang === 'ar' ? 'سجل حضور وغياب الطالب التفصيلي' : 'Complete Attendance History'}</span>
            </h3>

            {childAttendance.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs font-medium">
                {lang === 'ar' ? 'لا يوجد سجلات حضور مسجلة بعد' : 'No attendance check-ins logged yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-center font-bold text-slate-500">
                      <th className="p-3 text-right">{lang === 'ar' ? 'تاريخ الحصة' : 'Date'}</th>
                      <th className="p-3">{lang === 'ar' ? 'توقيت الحضور' : 'Time'}</th>
                      <th className="p-3">{translate('attendanceStatus')}</th>
                      <th className="p-3">{lang === 'ar' ? 'طريقة الرصد' : 'Check-in Mode'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childAttendance.map(a => {
                      let badge = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20';
                      if (a.status === 'present') badge = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20';
                      if (a.status === 'late') badge = 'bg-orange-50 text-orange-500 dark:bg-orange-950/20';
                      return (
                        <tr key={a.id} className="border-b border-slate-55 dark:border-slate-850 text-center hover:bg-slate-50/50">
                          <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300 font-bold">{a.date}</td>
                          <td className="p-3 font-mono font-extrabold text-slate-800 dark:text-slate-100">{a.time || '-'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge}`}>
                              {translate(a.status)}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 font-semibold">{a.scanMethod}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Parent Notifications feed & Billing (1 col) */}
        <div className="space-y-6">
          
          {/* PARENT ALERT NOTIFICATIONS FEED */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3 mb-2">
              <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>{lang === 'ar' ? 'صندوق تنبيهات ابننا' : 'Child Bulletins Feed'}</span>
              </h3>
              {childNotifications.some(n => !n.read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold"
                >
                  {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                </button>
              )}
            </div>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {childNotifications.map(n => (
                <div 
                  key={n.id}
                  className={`border rounded-2xl p-3.5 transition-all space-y-1.5 ${
                    n.read 
                      ? 'bg-slate-50/40 border-slate-100 dark:bg-slate-950/10 dark:border-slate-850' 
                      : 'bg-purple-50/30 border-purple-100 dark:bg-purple-950/10 dark:border-purple-950/30'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>{n.title}</span>
                    <span className="font-mono">{n.date}</span>
                  </div>
                  <p className="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    {n.message}
                  </p>
                </div>
              ))}
              {childNotifications.length === 0 && (
                <p className="text-center py-10 text-slate-400 text-xs font-semibold">
                  {lang === 'ar' ? 'صندوق الوارد فارغ ولا توجد تنبيهات بعد.' : 'Bulletin inbox is clean.'}
                </p>
              )}
            </div>
          </div>

          {/* BILLING LEDGER CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3 mb-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'ar' ? 'دفتر وإيصالات السداد المالي' : 'Cleared Payments Receipts'}</span>
            </h3>

            {childPayments.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs font-medium">
                {lang === 'ar' ? 'لا يوجد أي معاملات مالية مسجلة بعد' : 'No payments cleared yet.'}
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {childPayments.map(p => (
                  <div key={p.id} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 p-3.5 rounded-2xl flex justify-between items-center">
                    <div className="space-y-0.5 text-right rtl:text-right ltr:text-left">
                      <strong className="text-slate-800 dark:text-slate-100 text-xs font-bold leading-none block">{p.desc}</strong>
                      <span className="text-[10px] font-mono text-slate-400 block">{p.date} • Code: {p.id}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-xl">
                      +{p.amount} ج.م
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
