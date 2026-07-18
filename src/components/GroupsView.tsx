import React, { useState } from 'react';
import { DatabaseState, Group, Teacher, UserSession } from '../types';
import { PlusCircle, Edit2, Trash2, X, Users, DollarSign, Calendar } from 'lucide-react';

interface GroupsViewProps {
  db: DatabaseState;
  session: UserSession;
  onUpdateDb: (updated: DatabaseState) => void;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
}

export default function GroupsView({
  db,
  session,
  onUpdateDb,
  lang,
  translate
}: GroupsViewProps) {
  const isAdmin = session.role === 'admin';

  const academicLevels = [
    'KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'الأول إعدادي', 'الثاني إعدادي', 'الثالث إعدادي', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [teacherId, setTeacherId] = useState('');
  const [maxStudents, setMaxStudents] = useState(40);
  const [timeSlot, setTimeSlot] = useState('');
  const [fee, setFee] = useState(300);
  const [sessionCount, setSessionCount] = useState(8);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const handleOpenAddForm = () => {
    setEditingGroupId(null);
    setNameAr('');
    setNameEn('');
    setSubject('Mathematics');
    setTeacherId(db.teachers?.[0]?.id || '');
    setMaxStudents(40);
    setTimeSlot('');
    setFee(300);
    setSessionCount(8);
    setSelectedLevels([]);
    setModalOpen(true);
  };

  const handleOpenEditForm = (g: Group) => {
    setEditingGroupId(g.id);
    setNameAr(g.nameAr);
    setNameEn(g.nameEn);
    setSubject(g.subject);
    setTeacherId(g.teacherId);
    setMaxStudents(g.maxStudents);
    setTimeSlot(g.timeSlot);
    setFee(g.fee);
    setSessionCount(g.sessionCount);
    setSelectedLevels(g.level);
    setModalOpen(true);
  };

  const handleDeleteGroup = (id: string) => {
    const confirm = window.confirm(lang === 'ar' ? 'تحذير: حذف المجموعة سيؤدي إلى إلغاء تعيينها لكل طلابها. هل أنت متأكد؟' : 'Warning: Deleting group will unassign all its current students. Are you sure?');
    if (!confirm) return;

    const updatedGroups = db.groups.filter(g => g.id !== id);
    const updatedStudents = db.students.map(s => {
      if (s.groupId === id) {
        return { ...s, groupId: '' }; // Unassign
      }
      return s;
    });

    onUpdateDb({
      ...db,
      groups: updatedGroups,
      students: updatedStudents
    });
    alert(lang === 'ar' ? 'تم حذف المجموعة بنجاح' : 'Group deleted');
  };

  const handleToggleLevelCheckbox = (lvl: string) => {
    if (selectedLevels.includes(lvl)) {
      setSelectedLevels(selectedLevels.filter(x => x !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !nameEn.trim() || selectedLevels.length === 0 || !teacherId) {
      alert(lang === 'ar' ? 'يرجى كتابة اسم المجموعة واختيار مستوى أكاديمي ومدرس مسؤل' : 'Please check required fields, levels and teacher assignment.');
      return;
    }

    let updatedGroups = [...db.groups];

    if (editingGroupId) {
      // Edit mode
      updatedGroups = updatedGroups.map(g => {
        if (g.id === editingGroupId) {
          return {
            ...g,
            nameAr,
            nameEn,
            level: selectedLevels,
            subject,
            teacherId,
            maxStudents: Number(maxStudents),
            timeSlot,
            fee: Number(fee),
            sessionCount: Number(sessionCount)
          };
        }
        return g;
      });
      alert(lang === 'ar' ? 'تم تحديث بيانات المجموعة بنجاح' : 'Group details updated');
    } else {
      // Add mode
      const generatedId = 'G-' + nameEn.substring(0, 3).toUpperCase().replace(/\s/g, '') + Math.floor(100 + Math.random() * 900);
      const newGroup: Group = {
        id: generatedId,
        nameAr,
        nameEn,
        level: selectedLevels,
        subject,
        teacherId,
        maxStudents: Number(maxStudents),
        timeSlot,
        fee: Number(fee),
        sessionCount: Number(sessionCount)
      };
      updatedGroups.push(newGroup);
      alert(lang === 'ar' ? 'تم إضافة المجموعة بنجاح' : 'New study group added successfully');
    }

    onUpdateDb({ ...db, groups: updatedGroups });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {translate('groupManagement')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' ? 'تأسيس المجموعات الدراسية وحجز مواعيد الحصص الأسبوعية' : 'Configure tuition groups and specify session timeslots'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/10 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{translate('addGroup')}</span>
          </button>
        )}
      </div>

      {/* Grid listing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 text-right">{translate('groupName')}</th>
                <th className="p-4 text-center">{translate('academicLevel')}</th>
                <th className="p-4 text-center">{translate('subject')}</th>
                <th className="p-4 text-center">{translate('sessionTime')}</th>
                <th className="p-4 text-center">{translate('monthlyFee')}</th>
                <th className="p-4 text-center">{translate('maxStudents')}</th>
                <th className="p-4 text-center">{translate('enrolledStudents')}</th>
                {isAdmin && <th className="p-4 text-center">{translate('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {db.groups.map(g => {
                const enrolled = db.students.filter(s => s.groupId === g.id).length;
                const teacherObj = db.teachers?.find(t => t.id === g.teacherId);
                const teacherLabel = teacherObj ? (lang === 'ar' ? teacherObj.nameAr : teacherObj.nameEn) : '-';
                return (
                  <tr key={g.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                    <td className="p-4 text-right">
                      <div className="space-y-0.5">
                        <strong className="text-slate-800 dark:text-slate-100 font-extrabold text-[12.5px] sm:text-xs">
                          {lang === 'ar' ? g.nameAr : g.nameEn}
                        </strong>
                        <p className="text-[10px] text-slate-400 font-medium">({lang === 'ar' ? `المعلم المسؤول: ${teacherLabel}` : `Teacher: ${teacherLabel}`})</p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold">
                        {g.level.join(', ')}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-500 font-semibold">{g.subject}</td>
                    <td className="p-4 text-center font-mono text-slate-500">{g.timeSlot || '-'}</td>
                    <td className="p-4 text-center font-black text-slate-800 dark:text-slate-100">{g.fee} {translate('currency')}</td>
                    <td className="p-4 text-center text-slate-400 font-medium">{g.maxStudents}</td>
                    <td className="p-4 text-center font-bold">
                      <span className={enrolled >= g.maxStudents ? 'text-rose-500' : 'text-emerald-500'}>
                        {enrolled} / {g.maxStudents}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditForm(g)}
                            className="p-1 text-slate-500 hover:text-purple-600 hover:bg-slate-50 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(g.id)}
                            className="p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {db.groups.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                    {lang === 'ar' ? 'لا يوجد مجموعات حالياً' : 'No study groups created.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT GROUP MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[550px] max-h-[85vh] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-zoomIn flex flex-col">
            
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                {editingGroupId ? (lang === 'ar' ? 'تعديل بيانات المجموعة' : 'Edit Study Group') : (lang === 'ar' ? 'إضافة مجموعة جديدة' : 'Add New Group')}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 rounded p-1 transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Name Arabic */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">اسم المجموعة بالعربية *</label>
                    <input 
                      type="text" 
                      required 
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      placeholder="مثال: الأول الثانوي - هندسة أ"
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Name English */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Group Name (English) *</label>
                    <input 
                      type="text" 
                      required 
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="e.g. 1st Sec - Geometry A"
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('subject')}</label>
                    <input 
                      type="text" 
                      required 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Teacher Responsible */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">المعلم المسؤول *</label>
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    >
                      {db.teachers?.map(t => (
                        <option key={t.id} value={t.id}>{lang === 'ar' ? t.nameAr : t.nameEn}</option>
                      ))}
                    </select>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('maxStudents')}</label>
                    <input 
                      type="number" 
                      required 
                      min={1}
                      value={maxStudents}
                      onChange={(e) => setMaxStudents(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Time slot */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('sessionTime')}</label>
                    <input 
                      type="text" 
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      placeholder="e.g. Sat, Wed - 04:00 PM"
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Fee */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('monthlyFee')} ({translate('currency')})</label>
                    <input 
                      type="number" 
                      required 
                      min={0}
                      value={fee}
                      onChange={(e) => setFee(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Monthly sessions count */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('monthlySessions')}</label>
                    <input 
                      type="number" 
                      required 
                      min={1}
                      value={sessionCount}
                      onChange={(e) => setSessionCount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                </div>

                {/* Level list checkbox triggers */}
                <div className="space-y-2 mt-4">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">المستويات الأكاديمية التابعة (حدد مستوى أو أكثر) *</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950">
                    {academicLevels.map(lvl => (
                      <label key={lvl} className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700 dark:text-slate-200 select-none">
                        <input 
                          type="checkbox"
                          checked={selectedLevels.includes(lvl)}
                          onChange={() => handleToggleLevelCheckbox(lvl)}
                          className="rounded text-purple-600 focus:ring-purple-500/20 shrink-0"
                        />
                        <span>{lvl}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/10 transition-all"
                >
                  {lang === 'ar' ? 'حفظ المجموعة' : 'Save Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
