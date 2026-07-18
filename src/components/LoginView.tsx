import React, { useState, useEffect } from 'react';
import { DatabaseState, UserSession } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserPlus, KeyRound, Award, Sparkles, TrendingUp, Sun, Moon } from 'lucide-react';

interface LoginViewProps {
  db: DatabaseState;
  onLogin: (session: UserSession) => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  translate: (key: string) => string;
}

export default function LoginView({
  db,
  onLogin,
  lang,
  setLang,
  theme,
  toggleTheme,
  translate
}: LoginViewProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Parent Registration Form State
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentIdsInput, setStudentIdsInput] = useState<string[]>(['']);

  // Floating math symbols
  const [floatingSymbols, setFloatingSymbols] = useState<Array<{ id: number; char: string; color: string; left: string; top: string; size: number; delay: string; duration: string; floatX: string; floatY: string; floatRot: string }>>([]);

  useEffect(() => {
    const symbols = ['∑', '∫', 'π', '√', '∞', 'x²', 'y', 'z', 'Δ', 'α', 'β', 'θ', 'sin', 'cos', 'tan', 'log', 'lim', 'f(x)', 'a²+b²=c²', 'λ', 'Ω'];
    const colors = ['text-purple-400', 'text-indigo-400', 'text-teal-400', 'text-orange-400', 'text-pink-400', 'text-blue-400'];
    const generated = Array.from({ length: 30 }).map((_, i) => {
      const floatX = (Math.random() * 200 - 100) + 'px';
      const floatY = (Math.random() * 200 - 100) + 'px';
      const floatRot = (Math.random() * 360 - 180) + 'deg';
      return {
        id: i,
        char: symbols[Math.floor(Math.random() * symbols.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 95 + '%',
        top: Math.random() * 95 + '%',
        size: Math.floor(Math.random() * 18 + 14),
        delay: Math.random() * 5 + 's',
        duration: (Math.random() * 15 + 15) + 's',
        floatX,
        floatY,
        floatRot
      };
    });
    setFloatingSymbols(generated);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const cleanPassword = password;

    // 1. Scan Admins
    const matchedAdmin = db.admins?.find(
      (a) => a.username === trimmedUsername && a.password === cleanPassword
    );

    if (matchedAdmin) {
      if (!matchedAdmin.active) {
        alert(lang === 'ar' ? 'الحساب معطل حالياً' : 'Account deactivated');
        return;
      }
      onLogin({ username: matchedAdmin.username, role: 'admin', adminId: matchedAdmin.id });
      return;
    }

    // 2. Scan Teachers
    const matchedTeacher = db.teachers?.find(
      (t) => (t.username === trimmedUsername || t.id === trimmedUsername) && t.password === cleanPassword
    );

    if (matchedTeacher) {
      if (!matchedTeacher.active) {
        alert(lang === 'ar' ? 'الحساب معطل حالياً' : 'Account deactivated');
        return;
      }
      onLogin({ username: matchedTeacher.id, role: 'teacher' });
      return;
    }

    // 3. Scan Parents
    const matchedParent = db.parents?.find(
      (p) => (p.username === trimmedUsername || p.id === trimmedUsername) && p.password === cleanPassword
    );

    if (matchedParent) {
      if (matchedParent.pendingApproval) {
        alert(lang === 'ar' ? 'الحساب بانتظار تأكيد الإدارة وتفعيل الحساب' : 'Account is pending administrator activation');
        return;
      }
      if (!matchedParent.active) {
        alert(lang === 'ar' ? 'الحساب معطل حالياً' : 'Account deactivated');
        return;
      }
      const sIds = matchedParent.studentIds || [];
      onLogin({ username: matchedParent.id, role: 'parent', studentId: sIds[0] });
      return;
    }

    alert(lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Incorrect username or password');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = parentName.trim();
    const cleanPhone = parentPhone.trim();

    if (!cleanName || !cleanPhone) {
      alert(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    // Verify linked students exist
    const linkedIds: string[] = [];
    for (const stId of studentIdsInput) {
      const trimmed = stId.trim();
      if (!trimmed) continue;
      
      const found = db.students.find(s => s.id.toLowerCase() === trimmed.toLowerCase());
      if (!found) {
        alert(lang === 'ar' 
          ? `كود الطالب "${trimmed}" غير موجود بالنظام. يرجى مراجعة الكود الصحيح ببطاقة الطالب.` 
          : `Student ID "${trimmed}" not found in the system.`
        );
        return;
      }
      linkedIds.push(found.id);
    }

    if (linkedIds.length === 0) {
      alert(lang === 'ar' ? 'يرجى إدخال كود طالب واحد على الأقل' : 'Please enter at least one student code');
      return;
    }

    // Check duplicate phone
    const phoneDuplicate = db.parents.find(p => p.phone === cleanPhone);
    if (phoneDuplicate) {
      if (phoneDuplicate.pendingApproval) {
        alert(lang === 'ar' ? 'تم تقديم طلب بهذا الرقم بالفعل وبانتظار موافقة الإدارة' : 'A request for this phone number is already pending review');
      } else {
        alert(lang === 'ar' ? 'رقم الهاتف مسجل بالفعل مسبقاً' : 'This phone number is already registered');
      }
      return;
    }

    // Create pending approval parent account
    const newParentObj = {
      id: 'PR' + Date.now().toString().substring(8),
      username: '',
      password: '',
      name: cleanName,
      phone: cleanPhone,
      studentIds: linkedIds,
      active: false,
      pendingApproval: true
    };

    db.parents.push(newParentObj);
    localStorage.setItem('motawea_math_erp_db', JSON.stringify(db));

    alert(lang === 'ar' 
      ? `تم تقديم طلبك بنجاح يا أ. ${cleanName}!\nسيقوم مستر محمد مطاوع بمراجعة طلبك وتفعيله قريباً وتزويدك ببيانات الدخول.` 
      : `Registration request submitted successfully, Mr. ${cleanName}! We will verify and activate your parent account shortly.`
    );

    // Reset fields
    setParentName('');
    setParentPhone('');
    setStudentIdsInput(['']);
    setIsRegistering(false);
  };

  const addStudentIdRow = () => {
    setStudentIdsInput([...studentIdsInput, '']);
  };

  const removeStudentIdRow = (index: number) => {
    const updated = [...studentIdsInput];
    updated.splice(index, 1);
    setStudentIdsInput(updated);
  };

  const handleStudentIdChange = (index: number, value: string) => {
    const updated = [...studentIdsInput];
    updated[index] = value;
    setStudentIdsInput(updated);
  };

  return (
    <div className="flex min-h-screen w-full select-none overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      
      {/* Background Floating Decor */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10 dark:opacity-20">
        {floatingSymbols.map((sym) => (
          <span
            key={sym.id}
            className={`absolute font-bold drop-shadow ${sym.color}`}
            style={{
              left: sym.left,
              top: sym.top,
              fontSize: sym.size + 'px',
              animation: `floatAround ${sym.duration} infinite ease-in-out alternate`,
              animationDelay: sym.delay,
              transform: `translate(${sym.floatX}, ${sym.floatY}) rotate(${sym.floatRot})`
            }}
          >
            {sym.char}
          </span>
        ))}
      </div>

      {/* Showcase Panel (Left Desk, hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-slate-900 dark:bg-black text-white p-12 border-r border-slate-200 dark:border-slate-800 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-radial from-violet-950/20 to-transparent blur-3xl pointer-events-none" />
        
        <div className="text-center max-w-md space-y-6 z-10">
          {/* Polaroid Angle Photo Border Showcase */}
          <div className="relative w-64 h-64 mx-auto border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-xl rotate-[-3deg] hover:rotate-0 hover:scale-105 transition-all duration-300 overflow-hidden">
            {/* Fallback elegant math themed portrait or blank avatar */}
            <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
              <span className="absolute top-3 right-3 bg-purple-600/80 text-white font-mono text-[10px] px-2 py-0.5 rounded-full z-20">f(x)</span>
              <img 
                src={db.siteSettings.teacherAvatar || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80"} 
                alt="Teacher Portrait" 
                className="w-full h-full object-cover z-10"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {db.siteSettings.teacherName}
          </h2>
          <p className="text-sm text-slate-400">
            {db.siteSettings.teacherTitle}
          </p>

          <div className="flex justify-center gap-4 flex-wrap pt-2">
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-slate-200">
              <Award className="w-4 h-4 text-orange-400" />
              <span>10+ {lang === 'ar' ? 'سنوات خبرة' : 'Years Experience'}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-slate-200">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>{lang === 'ar' ? 'تأسيس وتميز' : 'Rigorous Concept Prep'}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-slate-200">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span>{lang === 'ar' ? 'درجات نهائية' : 'Excellence Scores'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Authentication Card Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Quick Language & Theme toggles */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
            className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:text-purple-600 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 font-bold text-xs"
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>
          <button 
            onClick={toggleTheme} 
            className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:text-purple-600 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!isRegistering ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 dark:border-slate-850"
            >
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold mx-auto shadow-md mb-4">
                  ∑
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {translate('loginTitle')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {db.siteSettings.centerNameAr} - {db.siteSettings.teacherName}
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {translate('loginUsername')}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin / teacher1 / parent1"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {translate('loginPassword')}
                    </label>
                    <button 
                      type="button" 
                      onClick={() => alert(lang === 'ar' ? 'يرجى مراجعة إدارة الأكاديمية لإعادة تعيين كلمة المرور.' : 'Please consult with system administrators to reset your password.')}
                      className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
                    >
                      {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                    </button>
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/15 active:scale-95 transition-all text-sm"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{translate('loginButton')}</span>
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <button 
                  onClick={() => setIsRegistering(true)}
                  className="text-purple-600 dark:text-purple-400 font-bold hover:text-purple-700 hover:underline text-xs flex items-center justify-center gap-1.5 mx-auto"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'سجل حساباً جديداً كولي أمر' : 'Register New Parent Account'}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="register"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[500px] bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 dark:border-slate-850"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold mx-auto shadow-md mb-3">
                  +
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'تسجيل حساب ولي أمر جديد' : 'New Parent Registration'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'ar' ? 'أكاديمية Math Zone - بوابة المتابعة الذكية' : 'Math Zone Academy Parent Hub'}
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'اسم ولي الأمر بالكامل' : 'Full Name'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder={lang === 'ar' ? 'أحمد محمود عبد الله...' : 'e.g. Mahmoud Ali'}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'رقم الهاتف المحمول (لتلقي رسائل الواتساب)' : 'Active Mobile Number'}
                  </label>
                  <input 
                    type="tel" 
                    required 
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-2">
                    {lang === 'ar' ? 'أبنائي الطلاب المراد متابعتهم:' : 'Linked Student Codes:'}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed mb-3">
                    {lang === 'ar' 
                      ? '📌 أدخل كود الطالب المطبوع في الكارنيه (مثل: s00001) ليرتبط الحساب تلقائياً للتقرير الشهري.' 
                      : '📌 Enter student unique system codes (e.g. s00001) to link academic reports.'
                    }
                  </p>

                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {studentIdsInput.map((val, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          required 
                          value={val}
                          onChange={(e) => handleStudentIdChange(idx, e.target.value)}
                          placeholder={lang === 'ar' ? 'كود الطالب (مثال: s00001)' : 'Student Code (e.g. s00001)'}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition-all"
                        />
                        {studentIdsInput.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeStudentIdRow(idx)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 p-2 rounded-xl text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={addStudentIdRow}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-bold text-xs flex items-center gap-1 mt-2.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إضافة ابن آخر' : 'Link Another Child'}</span>
                  </button>
                </div>

                <div className="flex gap-3 pt-3 flex-col sm:flex-row">
                  <button 
                    type="button" 
                    onClick={() => setIsRegistering(false)}
                    className="flex-1 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl py-2.5 text-xs text-center"
                  >
                    {lang === 'ar' ? 'رجوع للدخول' : 'Back to Login'}
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl py-2.5 text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10 active:scale-95 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تقديم الطلب الآن' : 'Submit Registration'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
