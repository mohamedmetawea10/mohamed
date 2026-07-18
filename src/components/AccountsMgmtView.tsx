import React, { useState } from 'react';
import { DatabaseState, Admin, Teacher, Parent, Student } from '../types';
import { 
  User, CheckCircle, ShieldAlert, KeyRound, Mail, Phone, Plus, 
  Trash, Edit2, Shield, UserCheck, Eye, EyeOff, Sparkles 
} from 'lucide-react';

interface AccountsMgmtViewProps {
  db: DatabaseState;
  onUpdateDb: (updated: DatabaseState) => void;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
  type: 'teachers' | 'parents' | 'admins';
}

export default function AccountsMgmtView({
  db,
  onUpdateDb,
  lang,
  translate,
  type
}: AccountsMgmtViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Common Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [active, setActive] = useState(true);

  // Teacher specific
  const [subjectAr, setSubjectAr] = useState('');
  const [subjectEn, setSubjectEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');

  // Parent specific student codes
  const [parentStudentIds, setParentStudentIds] = useState<string[]>(['']);

  // Reset form helper
  const resetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
    setPhone('');
    setEmail('');
    setActive(true);
    setSubjectAr('');
    setSubjectEn('');
    setNameAr('');
    setNameEn('');
    setParentStudentIds(['']);
    setShowAddForm(false);
    setEditingId(null);
  };

  // Status Toggles
  const handleToggleStatus = (id: string, current: boolean) => {
    let updatedDb = { ...db };
    if (type === 'admins') {
      updatedDb.admins = (db.admins || []).map(a => a.id === id ? { ...a, active: !current } : a);
    } else if (type === 'teachers') {
      updatedDb.teachers = (db.teachers || []).map(t => t.id === id ? { ...t, active: !current } : t);
    } else if (type === 'parents') {
      updatedDb.parents = (db.parents || []).map(p => p.id === id ? { ...p, active: !current } : p);
    }
    onUpdateDb(updatedDb);
  };

  // Approve Pending Parent Registration Request
  const handleApproveParent = (parent: Parent) => {
    const parentPass = 'motawea_' + parent.phone.slice(-4);
    const parentUser = parent.phone;

    const updatedParents = (db.parents || []).map(p => {
      if (p.id === parent.id) {
        return {
          ...p,
          username: parentUser,
          password: parentPass,
          active: true,
          pendingApproval: false
        };
      }
      return p;
    });

    // Automatically send a simulated approval notice in logs
    const msg = `أهلاً بك يا أ. ${parent.name}، تم تفعيل حسابك بنجاح في نظام متابعة مستر محمد مطاوع.\nبيانات دخولك الآمنة هي:\nاسم المستخدم: ${parentUser}\nكلمة المرور: ${parentPass}\nيمكنك الآن تسجيل الدخول والمتابعة الحية 🌹`;
    
    const newLog = {
      id: 'MSG' + Date.now().toString().substring(8),
      studentId: parent.studentIds[0] || '',
      recipient: parent.phone,
      type: 'payments',
      message: msg,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'sent' as const
    };

    onUpdateDb({
      ...db,
      parents: updatedParents,
      whatsappLogs: [newLog, ...(db.whatsappLogs || [])]
    });

    alert(lang === 'ar' 
      ? `تم تفعيل حساب ولي الأمر بنجاح!\nاسم المستخدم: ${parentUser}\nكلمة المرور: ${parentPass}\nتم تزويده برسالة تأكيد آلية عبر بوابة الواتساب.` 
      : `Account approved!\nUsername: ${parentUser}\nPassword: ${parentPass}`
    );
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert(lang === 'ar' ? 'يرجى ملء البيانات بشكل صحيح' : 'Please fill details properly');
      return;
    }

    let updatedDb = { ...db };

    if (type === 'admins') {
      if (editingId) {
        updatedDb.admins = (db.admins || []).map(a => a.id === editingId ? {
          ...a, name, username, password, phone, email, active
        } : a);
      } else {
        const newAdmin: Admin = {
          id: 'A' + Date.now().toString().substring(9),
          name, username, password, phone, email, active
        };
        updatedDb.admins = [...(db.admins || []), newAdmin];
      }
    } else if (type === 'teachers') {
      if (editingId) {
        updatedDb.teachers = (db.teachers || []).map(t => t.id === editingId ? {
          ...t, username, password, nameEn, nameAr, subjectEn, subjectAr, phone, email, active
        } : t);
      } else {
        const newTeacher: Teacher = {
          id: 'T' + Date.now().toString().substring(9),
          username, password, nameEn, nameAr, subjectEn, subjectAr, phone, email, active,
          groups: [], avatar: '', introEn: '', introAr: ''
        };
        updatedDb.teachers = [...(db.teachers || []), newTeacher];
      }
    } else if (type === 'parents') {
      const cleanIds = parentStudentIds.map(s => s.trim()).filter(Boolean);
      if (editingId) {
        updatedDb.parents = (db.parents || []).map(p => p.id === editingId ? {
          ...p, name, username, password, phone, email, active, studentIds: cleanIds
        } : p);
      } else {
        const newParent: Parent = {
          id: 'P' + Date.now().toString().substring(9),
          name, username, password, phone, email, active, studentIds: cleanIds
        };
        updatedDb.parents = [...(db.parents || []), newParent];
      }
    }

    onUpdateDb(updatedDb);
    resetForm();
  };

  // Delete Account helper
  const handleDelete = (id: string) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذه الخطوة.' : 'Are you sure you want to delete this account?')) return;
    let updatedDb = { ...db };
    if (type === 'admins') {
      updatedDb.admins = (db.admins || []).filter(a => a.id !== id);
    } else if (type === 'teachers') {
      updatedDb.teachers = (db.teachers || []).filter(t => t.id !== id);
    } else if (type === 'parents') {
      updatedDb.parents = (db.parents || []).filter(p => p.id !== id);
    }
    onUpdateDb(updatedDb);
  };

  // Load editing state
  const handleEditStart = (item: any) => {
    setEditingId(item.id);
    setShowAddForm(true);
    setUsername(item.username);
    setPassword(item.password);
    setPhone(item.phone || '');
    setEmail(item.email || '');
    setActive(item.active);

    if (type === 'admins') {
      setName(item.name);
    } else if (type === 'teachers') {
      setNameAr(item.nameAr || '');
      setNameEn(item.nameEn || '');
      setSubjectAr(item.subjectAr || '');
      setSubjectEn(item.subjectEn || '');
    } else if (type === 'parents') {
      setName(item.name);
      setParentStudentIds(item.studentIds || ['']);
    }
  };

  // Render accounts list depending on type
  const listItems = type === 'admins' ? (db.admins || []) : (type === 'teachers' ? (db.teachers || []) : (db.parents || []));

  return (
    <div className="space-y-6">
      
      {/* View Header with Add Account button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {type === 'admins' ? translate('navAdminsMgmt') : (type === 'teachers' ? translate('navTeachersMgmt') : translate('navParentsMgmt'))}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {type === 'admins' ? 'تعديل مديري لوحة التحكم وصلاحيات النظام المالي والإداري' : 'إدارة بيانات الطاقم وإرسال التقارير التفاعلية والتحصيلات الآمنة'}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 self-start shadow shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>{type === 'admins' ? translate('addAdmin') : (type === 'teachers' ? translate('addTeacher') : translate('addParent'))}</span>
        </button>
      </div>

      {/* Add / Edit Overlay Form Card */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-850">
            {editingId ? (lang === 'ar' ? 'تعديل بيانات الحساب' : 'Edit Account Info') : (lang === 'ar' ? 'إضافة حساب مستخدم جديد' : 'Add New Account Profile')}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Account Fields for Teachers */}
              {type === 'teachers' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-500">{lang === 'ar' ? 'الاسم بالعربية' : 'Name in Arabic'}</label>
                    <input 
                      type="text" required value={nameAr} onChange={(e) => setNameAr(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-500">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name in English'}</label>
                    <input 
                      type="text" required value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-500">{lang === 'ar' ? 'المادة (عربي)' : 'Subject (Ar)'}</label>
                    <input 
                      type="text" required value={subjectAr} onChange={(e) => setSubjectAr(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-500">{lang === 'ar' ? 'المادة (إنجليزي)' : 'Subject (En)'}</label>
                    <input 
                      type="text" required value={subjectEn} onChange={(e) => setSubjectEn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10.5px] font-bold text-slate-500">{lang === 'ar' ? 'الاسم بالكامل' : 'Full Display Name'}</label>
                  <input 
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {/* Username & Password */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-500">{lang === 'ar' ? 'اسم المستخدم للدخول' : 'Username'}</label>
                <input 
                  type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-500">{translate('password')}</label>
                <input 
                  type="text" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Phone & Email */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-500">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                <input 
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-500">{translate('email')}</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

            </div>

            {/* Parent specific: students link */}
            {type === 'parents' && (
              <div className="border-t border-dashed border-slate-100 dark:border-slate-850 pt-4 mt-2">
                <label className="text-[11px] font-extrabold text-purple-600 block mb-2">{lang === 'ar' ? 'أكواد الطلاب التابعين لولي الأمر' : 'Linked Children IDs'}</label>
                <div className="space-y-2">
                  {parentStudentIds.map((val, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        type="text" required value={val} 
                        onChange={(e) => {
                          const updated = [...parentStudentIds];
                          updated[idx] = e.target.value;
                          setParentStudentIds(updated);
                        }}
                        placeholder="e.g. s00001"
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                      {parentStudentIds.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = [...parentStudentIds];
                            updated.splice(idx, 1);
                            setParentStudentIds(updated);
                          }}
                          className="p-2 bg-rose-50 text-rose-500 dark:bg-rose-950/20 rounded-xl text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setParentStudentIds([...parentStudentIds, ''])}
                    className="text-xs text-purple-600 font-bold hover:underline"
                  >
                    + {lang === 'ar' ? 'إضافة كود ابن إضافي' : 'Link Another Child'}
                  </button>
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-end gap-2 pt-3">
              <button 
                type="button" onClick={resetForm}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow shadow-purple-500/10"
              >
                {lang === 'ar' ? 'حفظ الحساب' : 'Save Profile'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Pending parent registration approval alerts (ONLY for type === parents) */}
      {type === 'parents' && (db.parents || []).some(p => p.pendingApproval) && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-amber-200">
              {lang === 'ar' ? 'طلبات تسجيل حسابات أولياء أمور معلقة بالمراجعة' : 'Pending Parent Accounts Requests'}
            </h3>
          </div>
          <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {lang === 'ar' ? 'هناك أولياء أمور قاموا بالتسجيل للتو عبر بوابة الدخول، يرجى مراجعة الكود الدراسي وتنشيط حساباتهم وتأكيد المتابعة.' : 'New parent sign-ups await administrator approval below.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {(db.parents || []).filter(p => p.pendingApproval).map(pendingParent => {
              const studentMatches = pendingParent.studentIds.map(id => db.students.find(s => s.id === id)).filter(Boolean);
              return (
                <div key={pendingParent.id} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 p-4 rounded-xl flex justify-between items-start">
                  <div className="space-y-1">
                    <strong className="text-xs font-bold block text-slate-800 dark:text-slate-200">{pendingParent.name}</strong>
                    <span className="text-[10px] text-slate-500 font-mono block">📞 {pendingParent.phone}</span>
                    <div className="pt-1 flex gap-1 items-center flex-wrap">
                      <span className="text-[9px] text-slate-400 font-bold">{lang === 'ar' ? 'الأبناء:' : 'Children:'}</span>
                      {studentMatches.map(s => (
                        <span key={s?.id} className="text-[9px] bg-purple-50 dark:bg-purple-950/45 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-black border border-purple-100/10">
                          {s?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApproveParent(pendingParent)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-[10.5px] font-extrabold flex items-center gap-1 shrink-0"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'قبول وتنشيط' : 'Activate'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified Accounts Listing table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-55/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-black">
                <th className="p-4 text-right">{lang === 'ar' ? 'الاسم والبيانات' : 'Account profile'}</th>
                <th className="p-4">{lang === 'ar' ? 'اسم المستخدم للدخول' : 'Username'}</th>
                <th className="p-4">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</th>
                {type === 'teachers' && <th className="p-4">{lang === 'ar' ? 'المادة الدراسية' : 'Subject'}</th>}
                {type === 'parents' && <th className="p-4">{lang === 'ar' ? 'الأبناء التابعين' : 'Linked student codes'}</th>}
                <th className="p-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-4 text-center">{translate('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(listItems as any[]).filter(item => !item.pendingApproval).map((item: any) => {
                const displayName = type === 'teachers' 
                  ? (lang === 'ar' ? item.nameAr : item.nameEn)
                  : item.name;
                const displaySubject = type === 'teachers'
                  ? (lang === 'ar' ? item.subjectAr : item.subjectEn)
                  : '';

                return (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50">
                    
                    {/* Name & Contact card */}
                    <td className="p-4 text-right">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="text-right">
                          <strong className="text-slate-800 dark:text-slate-100 font-extrabold text-xs leading-tight block">{displayName}</strong>
                          <span className="text-[10px] text-slate-400 block font-mono">{item.phone || item.email || '-'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="p-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {item.username}
                    </td>

                    {/* Password */}
                    <td className="p-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {item.password}
                    </td>

                    {/* Subject (For Teacher) */}
                    {type === 'teachers' && (
                      <td className="p-4 text-center">
                        <span className="bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded text-[10px] border border-slate-100 dark:border-slate-850 font-bold text-slate-500">
                          {displaySubject}
                        </span>
                      </td>
                    )}

                    {/* Children Codes (For Parent) */}
                    {type === 'parents' && (
                      <td className="p-4 text-center">
                        <div className="flex gap-1 justify-center flex-wrap max-w-xs mx-auto">
                          {(item.studentIds || []).map((sId: string) => {
                            const child = db.students.find(s => s.id === sId);
                            return (
                              <span key={sId} className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-[6px] text-[10px] font-black border border-purple-100/10">
                                {child ? child.name : sId}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    )}

                    {/* Status Toggle */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(item.id, item.active)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/15' : 'bg-slate-50 text-slate-400 dark:bg-slate-950'}`}
                      >
                        {item.active ? translate('active') : translate('inactive')}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditStart(item)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 dark:hover:bg-rose-950/20 rounded"
                          title="Delete"
                        >
                          <Trash className="w-3.5 h-3.5" />
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
