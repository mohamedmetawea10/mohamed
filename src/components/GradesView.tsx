import React, { useState } from 'react';
import { DatabaseState, Student, Group, GradeRecord, UserSession } from '../types';
import { PlusCircle, Search, Edit2, Trash2, Calendar, Award, BookOpen, AlertCircle } from 'lucide-react';

interface GradesViewProps {
  db: DatabaseState;
  session: UserSession;
  onUpdateDb: (updated: DatabaseState) => void;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
}

export default function GradesView({
  db,
  session,
  onUpdateDb,
  lang,
  translate
}: GradesViewProps) {
  const isAuthorized = session.role === 'admin' || session.role === 'teacher';

  const [activeTab, setActiveTab] = useState<'log' | 'record'>('log');
  
  // Scoring / Recording State
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<'Quiz' | 'Homework' | 'Exam' | 'Assignment'>('Quiz');
  const [totalMarks, setTotalMarks] = useState<number>(20);
  const [examDate, setExamDate] = useState(new Date().toISOString().substring(0, 10));
  
  // Map of studentId -> score string
  const [studentScores, setStudentScores] = useState<Record<string, string>>({});

  // Filter states
  const [filterGroupId, setFilterGroupId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const groupStudents = db.students.filter(s => s.groupId === selectedGroupId);

  const handleScoreChange = (studentId: string, val: string) => {
    setStudentScores({
      ...studentScores,
      [studentId]: val
    });
  };

  const dispatchGradeNotification = (student: Student, score: number, total: number, title: string) => {
    let parentPhone = student.fatherPhone || student.motherPhone || student.studentPhone || '';
    if (!parentPhone) return;

    const groupObj = db.groups.find(g => g.id === student.groupId);
    const groupName = groupObj ? (lang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';

    const dateStr = new Date().toLocaleDateString();
    const curTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageText = lang === 'ar'
      ? `السلام عليكم ورحمة الله وبركاته، نود مشاركتكم نتيجة اختبار الطالب/ ${student.name} في (${title}) لمادة الرياضيات بمجموعة (${groupName}). حصل الطالب على درجة: ${score} من ${total}. يتمنى له مستر محمد دوام التميز والتفوق 🌟`
      : `Dear Parent, we are pleased to share student ${student.name}'s result in (${title}) for Math class (${groupName}). Score: ${score}/${total}. We wish them continuous excellence 🌟`;

    // 1. Add WhatsApp Log
    const newLog = {
      id: 'MSG' + Date.now() + Math.floor(Math.random() * 100),
      studentId: student.id,
      recipient: parentPhone,
      type: 'grades',
      message: messageText,
      date: `${dateStr} ${curTime}`,
      status: 'sent' as const
    };
    db.whatsappLogs = [newLog, ...(db.whatsappLogs || [])];

    // 2. Add Parent Notification (for parent portal)
    const newNotification = {
      id: 'NOT' + Date.now() + Math.floor(Math.random() * 100),
      studentId: student.id,
      type: 'grades',
      title: 'إعلان درجة اختبار',
      message: messageText,
      date: `${dateStr} ${curTime}`,
      read: false
    };
    db.parentNotifications = [newNotification, ...(db.parentNotifications || [])];
  };

  const handleSubmitGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !examTitle.trim() || !totalMarks) {
      alert(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    let updatedGrades = [...db.grades];
    let gradeCount = 0;

    groupStudents.forEach(student => {
      const scoreRaw = studentScores[student.id];
      if (scoreRaw !== undefined && scoreRaw.trim() !== '') {
        const scoreVal = Number(scoreRaw);
        if (scoreVal > totalMarks) {
          alert(lang === 'ar' 
            ? `درجة الطالب لا يمكن أن تتعدى الدرجة الكلية (${totalMarks})!` 
            : `Score for student cannot exceed max marks of ${totalMarks}`
          );
          return;
        }

        const newGrade: GradeRecord = {
          id: 'g' + Date.now() + Math.floor(Math.random() * 1000),
          studentId: student.id,
          title: examTitle,
          type: examType,
          totalMarks: Number(totalMarks),
          score: scoreVal,
          date: examDate,
          notes: ''
        };
        updatedGrades.unshift(newGrade);
        gradeCount++;

        // Trigger notifications
        dispatchGradeNotification(student, scoreVal, totalMarks, examTitle);
      }
    });

    if (gradeCount === 0) {
      alert(lang === 'ar' ? 'يرجى إدخال درجة واحدة على الأقل لأحد الطلاب' : 'Please input at least one student score.');
      return;
    }

    onUpdateDb({
      ...db,
      grades: updatedGrades
    });

    alert(lang === 'ar' ? 'تم حفظ ورصد جميع الدرجات بنجاح!' : `Successfully recorded ${gradeCount} grades.`);
    
    // Reset form
    setExamTitle('');
    setSelectedGroupId('');
    setStudentScores({});
    setActiveTab('log');
  };

  const handleDeleteGrade = (id: string) => {
    const confirm = window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الدرجة نهائياً؟' : 'Are you sure you want to delete this grade record?');
    if (!confirm) return;

    const updatedGrades = db.grades.filter(g => g.id !== id);
    onUpdateDb({ ...db, grades: updatedGrades });
    alert(lang === 'ar' ? 'تم حذف الدرجة بنجاح' : 'Grade record deleted');
  };

  // Month labels helper
  const monthLabelsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthLabelsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Filter grades logs
  const filteredGradesLogs = db.grades.filter(g => {
    const student = db.students.find(s => s.id === g.studentId);
    if (!student) return false;

    const matchesGroup = !filterGroupId || student.groupId === filterGroupId;
    
    const d = new Date(g.date);
    const matchesMonth = selectedMonth === null || (!isNaN(d.getTime()) && d.getMonth() === selectedMonth);

    return matchesGroup && matchesMonth;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {translate('gradesSystem')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' ? 'رصد درجات امتحانات الطلاب الشهرية والواجبات وإرسالها الفوري لأولياء الأمور' : 'Log exams, quizzes and homework results and keep parents notified'}
          </p>
        </div>
        {isAuthorized && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'log' ? 'bg-purple-600 text-white shadow' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350'}`}
            >
              {lang === 'ar' ? 'سجل الدرجات' : 'Grades Log'}
            </button>
            <button
              onClick={() => setActiveTab('record')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'record' ? 'bg-purple-600 text-white shadow' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350'}`}
            >
              {lang === 'ar' ? 'رصد درجات مجموعة' : 'Record New Marks'}
            </button>
          </div>
        )}
      </div>

      {/* RECORD MARKS PANEL */}
      {activeTab === 'record' && isAuthorized ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            {lang === 'ar' ? 'رصد وتنزيل كشف الدرجات لمجموعة محددة' : 'Log assessment scores for group'}
          </h3>

          <form onSubmit={handleSubmitGrades} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Group */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">{lang === 'ar' ? 'المجموعة الدراسية' : 'Tuition Group'}</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setStudentScores({});
                  }}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                >
                  <option value="">{lang === 'ar' ? 'اختر مجموعة...' : 'Select group...'}</option>
                  {db.groups.map(g => (
                    <option key={g.id} value={g.id}>{lang === 'ar' ? g.nameAr : g.nameEn}</option>
                  ))}
                </select>
              </div>

              {/* Assessment Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">{translate('examTitle')}</label>
                <input 
                  type="text" 
                  required 
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'امتحان شهر أكتوبر...' : 'e.g. Monthly Quiz 1'}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Assessment Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">{translate('examType')}</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                >
                  <option value="Quiz">{translate('quiz')}</option>
                  <option value="Homework">{translate('homework')}</option>
                  <option value="Exam">{translate('exam')}</option>
                  <option value="Assignment">{translate('assignment')}</option>
                </select>
              </div>

              {/* Total Marks */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">{translate('totalMarks')}</label>
                <input 
                  type="number" 
                  required 
                  min={1}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">{lang === 'ar' ? 'تاريخ الامتحان' : 'Assessment Date'}</label>
                <input 
                  type="date" 
                  required 
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none"
                />
              </div>

            </div>

            {/* Students Scores input list */}
            {selectedGroupId && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>{lang === 'ar' ? 'قائمة طلاب المجموعة ورصد الدرجات' : 'Students scores inputs list:'}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({lang === 'ar' ? 'متروك فارغ يعني غياب' : 'Leave empty for absences'})</span>
                </div>

                {groupStudents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    {lang === 'ar' ? 'لا يوجد طلاب مسجلين بهذه المجموعة' : 'No students in selected group.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 text-center">
                          <th className="p-3 text-right">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                          <th className="p-3">{lang === 'ar' ? 'كود الطالب' : 'Student ID'}</th>
                          <th className="p-3">{lang === 'ar' ? 'الدرجة' : 'Obtained Marks'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStudents.map(student => (
                          <tr key={student.id} className="border-b border-slate-100 dark:border-slate-850 text-center hover:bg-slate-100/20">
                            <td className="p-3 font-extrabold text-slate-800 dark:text-slate-100 text-right">{student.name}</td>
                            <td className="p-3 font-mono text-slate-400">{student.id}</td>
                            <td className="p-3 flex justify-center">
                              <input 
                                type="number" 
                                min={0}
                                max={totalMarks}
                                step="0.5"
                                value={studentScores[student.id] || ''}
                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                placeholder="0"
                                className="w-24 bg-white dark:bg-slate-950 text-center text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500 font-bold"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-850 pt-5 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/10 transition-all"
              >
                {lang === 'ar' ? 'حفظ ورصد جميع الدرجات' : 'Record & Publish All Marks'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* LOG VIEW PANEL */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {lang === 'ar' ? 'سجل الدرجات وكشوفات الامتحانات' : 'Assessment Gradebook'}
              </h3>

              {/* Filters */}
              <select
                value={filterGroupId}
                onChange={(e) => setFilterGroupId(e.target.value)}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none"
              >
                <option value="">{lang === 'ar' ? 'كل المجموعات' : 'All Groups'}</option>
                {db.groups.map(g => (
                  <option key={g.id} value={g.id}>{lang === 'ar' ? g.nameAr : g.nameEn}</option>
                ))}
              </select>
            </div>

            {/* Month Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                onClick={() => setSelectedMonth(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedMonth === null
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
                }`}
              >
                {lang === 'ar' ? 'الكل' : 'All Months'}
              </button>
              {monthLabelsAr.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMonth(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedMonth === idx
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
                  }`}
                >
                  {lang === 'ar' ? label : monthLabelsEn[idx]}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-center font-bold text-slate-500">
                  <th className="p-4 text-right">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                  <th className="p-4">{lang === 'ar' ? 'كود الطالب' : 'Student ID'}</th>
                  <th className="p-4">{lang === 'ar' ? 'المجموعة' : 'Group'}</th>
                  <th className="p-4">{lang === 'ar' ? 'الامتحان / الواجب' : 'Assessment description'}</th>
                  <th className="p-4">{translate('examType')}</th>
                  <th className="p-4">{lang === 'ar' ? 'الدرجة' : 'Obtained'}</th>
                  <th className="p-4">{lang === 'ar' ? 'الكلية' : 'Max Score'}</th>
                  <th className="p-4">{lang === 'ar' ? 'الأداء المئوي' : 'Percentage'}</th>
                  <th className="p-4">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  {isAuthorized && <th className="p-4">{translate('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredGradesLogs.map(g => {
                  const student = db.students.find(s => s.id === g.studentId);
                  if (!student) return null;

                  const groupObj = db.groups.find(grp => grp.id === student.groupId);
                  const groupName = groupObj ? (lang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';
                  const pct = Math.round((g.score / g.totalMarks) * 100);

                  return (
                    <tr key={g.id} className="border-b border-slate-100 dark:border-slate-800 text-center hover:bg-slate-50/50">
                      <td className="p-4 text-right font-extrabold text-slate-800 dark:text-slate-100">{student.name}</td>
                      <td className="p-4 font-mono text-slate-400">{student.id}</td>
                      <td className="p-4 font-bold text-slate-500">{groupName}</td>
                      <td className="p-4 font-bold text-purple-600 dark:text-purple-400">{g.title}</td>
                      <td className="p-4 text-slate-500">{g.type}</td>
                      <td className="p-4 font-black text-slate-900 dark:text-white text-xs">{g.score}</td>
                      <td className="p-4 text-slate-400">{g.totalMarks}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pct >= 85 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : (pct >= 50 ? 'bg-orange-50 text-orange-500 dark:bg-orange-950/20 dark:text-orange-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400')}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">{g.date}</td>
                      {isAuthorized && (
                        <td className="p-4">
                          <button
                            onClick={() => handleDeleteGrade(g.id)}
                            className="text-rose-500 hover:text-rose-700 font-bold hover:underline"
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredGradesLogs.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400 font-semibold">
                      {lang === 'ar' ? 'لا يوجد درجات مسجلة مطابقة للبحث' : 'No grade records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
