import React, { useState, useEffect } from 'react';
import { DatabaseState, Student, Group, AttendanceRecord, UserSession } from '../types';
import { QrCode, Search, Check, X, Clock, HelpCircle, CheckCircle, Smartphone } from 'lucide-react';

interface AttendanceViewProps {
  db: DatabaseState;
  session: UserSession;
  onUpdateDb: (updated: DatabaseState) => void;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
}

export default function AttendanceView({
  db,
  session,
  onUpdateDb,
  lang,
  translate
}: AttendanceViewProps) {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().substring(0, 10));

  // Simulation State
  const [simStudentId, setSimStudentId] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Attendance log filters
  const [logDate, setLogDate] = useState(new Date().toISOString().substring(0, 10));
  const [logGroupId, setLogGroupId] = useState('');

  // Fetch active students for selected group
  const groupStudents = db.students.filter(s => s.groupId === selectedGroupId);

  // Trigger automatic Parent Notifications & WhatsApp simulated dispatches
  const dispatchAttendanceNotification = (student: Student, status: 'present' | 'absent' | 'late', timeStr: string) => {
    let parentPhone = student.fatherPhone || student.motherPhone || student.studentPhone || '';
    if (!parentPhone) return;

    const groupObj = db.groups.find(g => g.id === student.groupId);
    const groupName = groupObj ? (lang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';

    let messageText = '';
    const dateStr = new Date().toLocaleDateString();
    const curTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (status === 'present' || status === 'late') {
      messageText = lang === 'ar'
        ? `السلام عليكم ورحمة الله وبركاته، نود إعلامكم بأن ابننا الطالب/ ${student.name} قد حضر اليوم حصة (${groupName}) بنجاح في تمام الساعة ${timeStr || curTime}. نتمنى له دوام التوفيق والتميز.\nأكاديمية Math Zone 🌹`
        : `Dear Parent, we would like to inform you that student ${student.name} attended today's session (${groupName}) successfully at ${timeStr || curTime}. We wish them continued success.\nMath Zone Academy 🌹`;
    } else if (status === 'absent') {
      messageText = lang === 'ar'
        ? `السلام عليكم ورحمة الله وبركاته، نود إحاطتكم علماً بغياب الطالب/ ${student.name} عن حصة (${groupName}) المقررة اليوم. يرجى المتابعة والحرص على تعويض الدرس.\nمع تحيات أكاديمية Math Zone 🌹`
        : `Dear Parent, we regret to inform you that student ${student.name} was absent from today's session (${groupName}). Please follow up to ensure they catch up.\nBest regards, Math Zone Academy 🌹`;
    }

    // 1. Add WhatsApp Log
    const newLog = {
      id: 'MSG' + Date.now() + Math.floor(Math.random() * 100),
      studentId: student.id,
      recipient: parentPhone,
      type: 'attendance',
      message: messageText,
      date: `${dateStr} ${curTime}`,
      status: 'sent' as const
    };
    const updatedLogs = [newLog, ...(db.whatsappLogs || [])];

    // 2. Add Parent Notification (for parent portal)
    const newNotification = {
      id: 'NOT' + Date.now() + Math.floor(Math.random() * 100),
      studentId: student.id,
      type: status,
      title: status === 'present' ? 'تسجيل حضور' : (status === 'late' ? 'تسجيل تأخير' : 'تسجيل غياب'),
      message: messageText,
      date: `${dateStr} ${curTime}`,
      read: false
    };
    const updatedNotifications = [newNotification, ...(db.parentNotifications || [])];

    onUpdateDb({
      ...db,
      whatsappLogs: updatedLogs,
      parentNotifications: updatedNotifications
    });
  };

  const handleSetAttendanceStatus = (student: Student, status: 'present' | 'absent' | 'late', method = 'Manual') => {
    const timeStr = status === 'absent' ? '' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    // Check if record already exists for today/selected date
    const existingIdx = db.attendance.findIndex(a => a.studentId === student.id && a.date === attendanceDate);

    let updatedAttendance = [...db.attendance];

    if (existingIdx !== -1) {
      updatedAttendance[existingIdx] = {
        ...updatedAttendance[existingIdx],
        status,
        time: timeStr,
        scanMethod: method
      };
    } else {
      const newRecord: AttendanceRecord = {
        id: 'ATT' + Date.now() + Math.floor(Math.random() * 10),
        studentId: student.id,
        groupId: student.groupId,
        date: attendanceDate,
        time: timeStr,
        status,
        scanMethod: method
      };
      updatedAttendance.push(newRecord);
    }

    // Plays beep standard if enabled
    if (db.settings.attendanceBeep && status === 'present') {
      try {
        const audioBeep = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
        audioBeep.play().catch(() => {});
      } catch (e) {}
    }

    // Save database and then fire notifications
    db.attendance = updatedAttendance;
    dispatchAttendanceNotification(student, status, timeStr);
  };

  const handleSimulateScan = (method: 'QR Code' | 'Barcode') => {
    if (!simStudentId) {
      alert(lang === 'ar' ? 'يرجى اختيار طالب أولاً للمحاكاة' : 'Please select a student to simulate.');
      return;
    }
    const student = db.students.find(s => s.id === simStudentId);
    if (student) {
      handleSetAttendanceStatus(student, 'present', method);
      setSimStudentId('');
      alert(lang === 'ar' ? `تم تسجيل حضور الطالب ${student.name} بنجاح عبر محاكاة ${method}` : `Attendance logged for ${student.name} via ${method}`);
    }
  };

  const handleBarcodeInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = barcodeInput.trim();
    if (!term) return;

    // Search by barcode ID or student unique system ID
    const student = db.students.find(s => s.barcode === term || s.id.toLowerCase() === term.toLowerCase());
    if (student) {
      handleSetAttendanceStatus(student, 'present', 'Barcode Reader');
      setBarcodeInput('');
      alert(lang === 'ar' ? `تم تسجيل حضور: ${student.name}` : `Attendance registered: ${student.name}`);
    } else {
      alert(lang === 'ar' ? 'رمز الباركود غير مسجل بالنظام' : 'Barcode or Student ID not found in system directory.');
    }
  };

  // Group schedules active today info card helper
  const renderScheduleInfo = () => {
    const d = new Date(attendanceDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = dayNames[d.getDay()];

    const dayNameAr: Record<string, string> = {
      'Sat': 'السبت', 'Sun': 'الأحد', 'Mon': 'الإثنين', 'Tue': 'الثلاثاء', 'Wed': 'الأربعاء', 'Thu': 'الخميس', 'Fri': 'الجمعة'
    };

    const activeGroups = db.groups.filter(g => g.timeSlot.includes(currentDay));

    if (activeGroups.length > 0) {
      const listNames = activeGroups.map(g => lang === 'ar' ? g.nameAr : g.nameEn).join(' ، ');
      return (
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100/50 p-4 rounded-2xl text-xs font-bold text-purple-600 dark:text-purple-400">
          📆 {lang === 'ar' ? `مجموعات يوم ${dayNameAr[currentDay] || currentDay}: ${listNames}` : `Active groups scheduled for today: ${listNames}`}
        </div>
      );
    } else {
      return (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100/50 p-4 rounded-2xl text-xs font-bold text-rose-500">
          ⚠️ {lang === 'ar' ? `لا توجد مجموعات مجدولة ليوم ${dayNameAr[currentDay] || currentDay}` : `No groups scheduled for today.`}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
          {translate('attendanceSystem')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'ar' ? 'تسجيل حضور وغياب الطلاب وتنبيه أولياء الأمور فوراً بالرسائل' : 'Check-in tuition groups and dispatch automated notifications to parents'}
        </p>
      </div>

      {/* Schedule Info */}
      {renderScheduleInfo()}

      {/* Section 1: Check-in panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick grid selector (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
            <span>📋</span>
            <span>{lang === 'ar' ? 'رصد حضور وغياب الطلاب اليومي' : 'Daily Group Attendance Grid'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'المجموعة الدراسية' : 'Tuition Group'}</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              >
                <option value="">{lang === 'ar' ? 'اختر مجموعة...' : 'Select study group...'}</option>
                {db.groups.map(g => (
                  <option key={g.id} value={g.id}>{lang === 'ar' ? g.nameAr : g.nameEn}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'تاريخ الحصة' : 'Session Date'}</label>
              <input 
                type="date" 
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* List panel */}
          {selectedGroupId && (
            <div className="border-t border-slate-100 dark:border-slate-850 pt-5 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>{lang === 'ar' ? 'أسماء الطلاب المسجلين' : 'Students Roster'}</span>
                <span className="bg-purple-100 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 px-2.5 py-0.5 rounded-full text-[10.5px]">
                  {groupStudents.length} {translate('student')}
                </span>
              </div>

              {groupStudents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  {lang === 'ar' ? 'لا يوجد طلاب مسجلين بهذه المجموعة' : 'No students registered under this group.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {groupStudents.map(student => {
                    const record = db.attendance.find(a => a.studentId === student.id && a.date === attendanceDate);
                    const status = record?.status;

                    let indicatorBg = 'bg-slate-300';
                    if (status === 'present') indicatorBg = 'bg-emerald-500';
                    if (status === 'absent') indicatorBg = 'bg-rose-500';
                    if (status === 'late') indicatorBg = 'bg-orange-400';

                    return (
                      <div 
                        key={student.id}
                        className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`w-2.5 h-2.5 rounded-full ${indicatorBg} shrink-0`} />
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">{student.name}</span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSetAttendanceStatus(student, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold ${status === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                          >
                            {translate('present')}
                          </button>
                          <button
                            onClick={() => handleSetAttendanceStatus(student, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold ${status === 'late' ? 'bg-orange-400 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                          >
                            {translate('late')}
                          </button>
                          <button
                            onClick={() => handleSetAttendanceStatus(student, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold ${status === 'absent' ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                          >
                            {translate('absent')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barcode/Hardware simulator (Right panel, 1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          
          {/* Hardware simulator input box */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-500" />
              <span>{lang === 'ar' ? 'قارئ الباركود / الكارنيهات' : 'Barcode Reader Check-in'}</span>
            </h3>

            <form onSubmit={handleBarcodeInputSubmit} className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 block">{lang === 'ar' ? 'امسح الباركود أو اكتب كود الطالب يدوياً:' : 'Type barcode or unique Student ID:'}</label>
              <div className="flex gap-1.5">
                <input 
                  type="text" 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="s00001 / s00002"
                  className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-4 py-2 shrink-0 shadow-md shadow-indigo-500/10"
                >
                  Enter
                </button>
              </div>
            </form>
          </div>

          <hr className="border-slate-100 dark:border-slate-850" />

          {/* Quick simulator */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'ar' ? 'محاكي المسح الضوئي الذكي' : 'Simulator Interface'}</span>
            </h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400">{lang === 'ar' ? 'اختر طالباً لمحاكاة الحضور:' : 'Select student for simulated scan:'}</label>
                <select
                  value={simStudentId}
                  onChange={(e) => setSimStudentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                >
                  <option value="">{lang === 'ar' ? 'اختر طالباً...' : 'Select student...'}</option>
                  {db.students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSimulateScan('QR Code')}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold py-2 rounded-xl text-[10.5px] transition-all"
                >
                  Simulate QR
                </button>
                <button
                  onClick={() => handleSimulateScan('Barcode')}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold py-2 rounded-xl text-[10.5px] transition-all"
                >
                  Simulate Barcode
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Section 2: Log Sheet Filter List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/20">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            {lang === 'ar' ? 'سجل وكشوفات الحضور التفصيلية' : 'Attendance Log History'}
          </h3>

          <div className="flex gap-2 flex-wrap">
            <input 
              type="date" 
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none"
            />

            <select
              value={logGroupId}
              onChange={(e) => setLogGroupId(e.target.value)}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none"
            >
              <option value="">{lang === 'ar' ? 'كل المجموعات' : 'All Groups'}</option>
              {db.groups.map(g => (
                <option key={g.id} value={g.id}>{lang === 'ar' ? g.nameAr : g.nameEn}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-center">
                <th className="p-4 text-right">{translate('fullName')}</th>
                <th className="p-4">{translate('assignedGroup')}</th>
                <th className="p-4">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="p-4">{lang === 'ar' ? 'الوقت' : 'Check-in Time'}</th>
                <th className="p-4">{translate('attendanceStatus')}</th>
                <th className="p-4">{lang === 'ar' ? 'طريقة التحضير' : 'Check-in Method'}</th>
                <th className="p-4">{translate('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {db.students
                .filter(s => !logGroupId || s.groupId === logGroupId)
                .map(student => {
                  const record = db.attendance.find(a => a.studentId === student.id && a.date === logDate);
                  const status = record?.status || 'absent';
                  const time = record?.time || '-';
                  const method = record?.scanMethod || '-';

                  const groupObj = db.groups.find(g => g.id === student.groupId);
                  const groupName = groupObj ? (lang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';

                  let badgeColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
                  if (status === 'present') badgeColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
                  if (status === 'late') badgeColor = 'bg-orange-50 text-orange-500 dark:bg-orange-950/20 dark:text-orange-400';

                  return (
                    <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800 text-center hover:bg-slate-50/50">
                      <td className="p-4 text-right font-extrabold text-slate-800 dark:text-slate-100">{student.name}</td>
                      <td className="p-4 font-bold text-slate-500">{groupName}</td>
                      <td className="p-4 font-mono text-slate-400">{logDate}</td>
                      <td className="p-4 font-mono font-bold">{time}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                          {translate(status)}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-semibold">{method}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleSetAttendanceStatus(student, 'present')}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-800 px-2 py-1 rounded font-bold text-[10px] text-slate-700 dark:text-slate-200"
                          >
                            {translate('present')}
                          </button>
                          <button
                            onClick={() => handleSetAttendanceStatus(student, 'absent')}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-800 px-2 py-1 rounded font-bold text-[10px] text-slate-700 dark:text-slate-200"
                          >
                            {translate('absent')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
