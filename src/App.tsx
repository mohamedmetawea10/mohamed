import React, { useState, useEffect } from 'react';
import { DatabaseState, UserSession } from './types';
import { getStoredData, saveStoredData, resetData } from './lib/storage';
import { TRANSLATIONS } from './lib/translations';

// Import Views
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import DashboardView from './components/DashboardView';
import StudentsView from './components/StudentsView';
import GroupsView from './components/GroupsView';
import AttendanceView from './components/AttendanceView';
import GradesView from './components/GradesView';
import FinanceView from './components/FinanceView';
import WhatsAppView from './components/WhatsAppView';
import ParentPortalView from './components/ParentPortalView';
import AccountsMgmtView from './components/AccountsMgmtView';

// Icons for Settings tab
import { 
  Settings, Save, RotateCcw, Download, Upload, Shield, 
  ToggleLeft, ToggleRight, Info, Languages, Monitor 
} from 'lucide-react';

export default function App() {
  // Global Database State
  const [db, setDb] = useState<DatabaseState>(() => getStoredData());

  // User Session state
  const [session, setSession] = useState<UserSession | null>(() => {
    const raw = sessionStorage.getItem('motawea_math_session');
    if (raw) {
      try { return JSON.parse(raw) as UserSession; } catch (e) { return null; }
    }
    return null;
  });

  // Active Navigation View state
  const [activeView, setActiveView] = useState<string>(() => {
    if (session) {
      return session.role === 'parent' ? 'parent-portal' : 'home';
    }
    return 'home';
  });

  // Mobile sidebar visible state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Localization and Visual Theme state (mirrored from database config)
  const [lang, setLang] = useState<'ar' | 'en'>(() => db.settings.language || 'ar');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => db.settings.theme || 'light');

  // Trigger effect to synchronize HTML class and RTL direction on language/theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save theme to settings
    const updated = { ...db };
    updated.settings.theme = theme;
    setDb(updated);
    saveStoredData(updated);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', lang);

    // Save language to settings
    const updated = { ...db };
    updated.settings.language = lang;
    setDb(updated);
    saveStoredData(updated);
  }, [lang]);

  // Synchronize state changes from child components and write directly to localStorage
  const handleUpdateDb = (updated: DatabaseState) => {
    setDb(updated);
    saveStoredData(updated);
  };

  // Translation Helper
  const translate = (key: string): string => {
    const dict = TRANSLATIONS[lang];
    if (dict && (dict as any)[key]) {
      return (dict as any)[key];
    }
    // Fallback if missing
    return key;
  };

  // Handle Login Successful session
  const handleLogin = (newSession: UserSession) => {
    sessionStorage.setItem('motawea_math_session', JSON.stringify(newSession));
    setSession(newSession);
    
    // Autoroute depending on role
    if (newSession.role === 'parent') {
      setActiveView('parent-portal');
    } else {
      setActiveView('home');
    }
  };

  // Handle Log out clean-up
  const handleLogout = () => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من تسجيل الخروج الآمن؟' : 'Are you sure you want to log out securely?')) {
      sessionStorage.removeItem('motawea_math_session');
      setSession(null);
    }
  };

  // Toggle Theme switcher
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Toggle mobile sidebar
  const toggleSidebarMobile = () => {
    setMobileSidebarOpen(prev => !prev);
  };

  // JSON backup configuration export handler
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `motawea_math_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON backup restoration handler
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        if (event.target?.result) {
          try {
            const parsed = JSON.parse(event.target.result as string) as DatabaseState;
            if (parsed.students && parsed.groups && parsed.attendance && parsed.grades) {
              handleUpdateDb(parsed);
              alert(lang === 'ar' ? 'تم استعادة قاعدة البيانات بنجاح!' : 'Database restored successfully!');
              window.location.reload();
            } else {
              alert(lang === 'ar' ? 'ملف النسخة الاحتياطية غير صالح أو ناقص البنية الأساسية.' : 'Invalid backup file structure.');
            }
          } catch (err) {
            alert(lang === 'ar' ? 'حدث خطأ أثناء قراءة الملف.' : 'Error reading JSON backup file.');
          }
        }
      };
    }
  };

  // ERP System Reset to original initial factory variables
  const handleFactoryReset = () => {
    if (window.confirm(lang === 'ar' ? '⚠️ تحذير خطير: سيؤدي هذا إلى حذف كافة الطلاب والمسجلين والعمليات المالية والعودة للمصنع الافتراضي! هل أنت متأكد؟' : '⚠️ WARNING: This will permanently erase all custom student logs, grades, and financials. Proceed?')) {
      const fresh = resetData();
      setDb(fresh);
      alert(lang === 'ar' ? 'تمت إعادة تعيين النظام بالكامل بنجاح!' : 'ERP reset successfully!');
      window.location.reload();
    }
  };

  // Render Content routing switcher depending on selected navigation tab
  const renderViewContent = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomeView 
            db={db} 
            session={session!} 
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
          />
        );
      
      case 'dashboard':
        return (
          <DashboardView 
            db={db} 
            session={session!} 
            lang={lang} 
            translate={translate} 
          />
        );

      case 'students':
        return (
          <StudentsView 
            db={db} 
            session={session!}
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
          />
        );

      case 'groups':
        return (
          <GroupsView 
            db={db} 
            session={session!}
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
          />
        );

      case 'attendance':
        return (
          <AttendanceView 
            db={db} 
            session={session!}
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
          />
        );

      case 'grades':
        return (
          <GradesView 
            db={db} 
            session={session!}
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
          />
        );

      case 'finance':
        return (
          <FinanceView 
            db={db} 
            session={session!}
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
          />
        );

      case 'whatsapp':
        return (
          <WhatsAppView 
            db={db} 
            session={session!}
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
          />
        );

      case 'parent-portal':
        return (
          <ParentPortalView 
            db={db} 
            session={session!} 
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
          />
        );

      case 'teachers-mgmt':
        return (
          <AccountsMgmtView 
            db={db} 
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
            type="teachers"
          />
        );

      case 'parents-mgmt':
        return (
          <AccountsMgmtView 
            db={db} 
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
            type="parents"
          />
        );

      case 'admins-mgmt':
        return (
          <AccountsMgmtView 
            db={db} 
            onUpdateDb={handleUpdateDb} 
            lang={lang} 
            translate={translate} 
            type="admins"
          />
        );

      case 'settings':
        return (
          <div className="space-y-6">
            
            {/* Settings Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {translate('navSettings')}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? 'تهيئة متغيرات النظام، وإجراء النسخ الاحتياطي السنوي لبيانات الطلاب' : 'Configure default system values, sound alerts and database backups'}
              </p>
            </div>

            {/* General ERP Variables & UI Settings Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <Languages className="w-4 h-4 text-purple-600" />
                  <span>{lang === 'ar' ? 'إعدادات اللغة والواجهة العامة' : 'General UI & Language Settings'}</span>
                </h3>

                <div className="space-y-4">
                  
                  {/* Language */}
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{translate('systemLanguage')}</strong>
                      <span className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'تغيير اتجاه العرض بالكامل وتوطين المفردات' : 'Switch dashboard text and layout direction'}</span>
                    </div>
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value as 'ar' | 'en')}
                      className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                    >
                      <option value="ar">{translate('arabic')}</option>
                      <option value="en">{translate('english')}</option>
                    </select>
                  </div>

                  {/* Dark Mode Theme */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{translate('systemTheme')}</strong>
                      <span className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'تعديل تدرج ألوان الكانفاس لتخفيف إجهاد العين' : 'Switch between clean light or slate dark pallets'}</span>
                    </div>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                      className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                    >
                      <option value="light">{translate('lightMode')}</option>
                      <option value="dark">{translate('darkMode')}</option>
                    </select>
                  </div>

                  {/* Sound on barcode scan */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{lang === 'ar' ? 'تنبيه التحضير الذكي الصوتي' : 'Attendance Audio Alert'}</strong>
                      <span className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'إطلاق صوت بيب عند نجاح رصد الحضور بالباركود' : 'Trigger a beep sound upon successful smart check-ins'}</span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = { ...db };
                        updated.settings.attendanceBeep = !db.settings.attendanceBeep;
                        handleUpdateDb(updated);
                      }}
                      className="text-slate-600 dark:text-slate-300"
                    >
                      {db.settings.attendanceBeep ? (
                        <ToggleRight className="w-8 h-8 text-purple-600 cursor-pointer" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-400 cursor-pointer" />
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {/* Site Details configuration */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <Info className="w-4 h-4 text-purple-600" />
                  <span>{lang === 'ar' ? 'إعدادات الملف التعريفي والمركز' : 'Center Profiles & Contacts'}</span>
                </h3>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  alert(translate('saveSettings'));
                }} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">{lang === 'ar' ? 'اسم الأكاديمية (عربي)' : 'Center Name (Ar)'}</label>
                      <input 
                        type="text" value={db.siteSettings.centerNameAr}
                        onChange={(e) => {
                          const updated = { ...db };
                          updated.siteSettings.centerNameAr = e.target.value;
                          handleUpdateDb(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">{lang === 'ar' ? 'اسم الأكاديمية (إنجليزي)' : 'Center Name (En)'}</label>
                      <input 
                        type="text" value={db.siteSettings.centerNameEn}
                        onChange={(e) => {
                          const updated = { ...db };
                          updated.siteSettings.centerNameEn = e.target.value;
                          handleUpdateDb(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">{lang === 'ar' ? 'اسم المعلم بالعربي' : 'Teacher Name (Ar)'}</label>
                      <input 
                        type="text" value={db.siteSettings.teacherName}
                        onChange={(e) => {
                          const updated = { ...db };
                          updated.siteSettings.teacherName = e.target.value;
                          handleUpdateDb(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">{lang === 'ar' ? 'هاتف التواصل المباشر' : 'Contact Phone'}</label>
                      <input 
                        type="tel" value={db.siteSettings.teacherPhone}
                        onChange={(e) => {
                          const updated = { ...db };
                          updated.siteSettings.teacherPhone = e.target.value;
                          handleUpdateDb(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{lang === 'ar' ? 'السيرة الذاتية المهنية والمقدمة' : 'Professional Biography'}</label>
                    <textarea 
                      rows={3} value={db.siteSettings.teacherBio}
                      onChange={(e) => {
                        const updated = { ...db };
                        updated.siteSettings.teacherBio = e.target.value;
                        handleUpdateDb(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Teacher Profile Photo Custom Uploader */}
                  <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-3 space-y-3">
                    <label className="font-bold text-slate-500 block">
                      {lang === 'ar' ? 'صورة الملف الشخصي للمعلم' : 'Teacher Profile Photo'}
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40">
                      <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-purple-500 shadow-md">
                        <img 
                          src={db.siteSettings.teacherAvatar || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80"} 
                          alt="Teacher Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex gap-2">
                          <label className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold text-center cursor-pointer transition shadow-sm">
                            <span>{lang === 'ar' ? 'تحميل صورتك الشخصية' : 'Upload Your Photo'}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      const updated = { ...db };
                                      updated.siteSettings.teacherAvatar = event.target.result as string;
                                      handleUpdateDb(updated);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                              className="hidden" 
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...db };
                              updated.siteSettings.teacherAvatar = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80';
                              handleUpdateDb(updated);
                            }}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold transition border border-slate-300/10"
                          >
                            {lang === 'ar' ? 'إعادة الافتراضي' : 'Reset to Default'}
                          </button>
                        </div>
                        <input 
                          type="text" 
                          placeholder={lang === 'ar' ? 'أو الصق رابط الصورة المباشر هنا...' : 'Or paste direct image URL here...'}
                          value={db.siteSettings.teacherAvatar?.startsWith('data:') ? '' : (db.siteSettings.teacherAvatar || '')}
                          onChange={(e) => {
                            const updated = { ...db };
                            updated.siteSettings.teacherAvatar = e.target.value;
                            handleUpdateDb(updated);
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

            </div>

            {/* Database Security, Backup & Factory Reset Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
                <Shield className="w-4 h-4 text-rose-600" />
                <span>{translate('backupRestore')}</span>
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                {lang === 'ar' 
                  ? 'يرجى تنزيل نسخة احتياطية بشكل دوري للحفاظ على سجلات درجات وحضور الطلاب. يتيح لك الاستيراد استعادة كافة السجلات على أي كمبيوتر أو متصفح آخر في ثوانٍ.' 
                  : 'Maintain regular offline copies of student scoresheets, financial invoices, and check-in logs. The database backup runs inside standard encrypted JSON format for quick restores.'
                }
              </p>

              <div className="flex gap-3 flex-wrap pt-2">
                
                {/* Export anchor */}
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>{translate('createBackup')}</span>
                </button>

                {/* Import trigger */}
                <label className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>{translate('restoreBackup')}</span>
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportBackup} 
                    className="hidden" 
                  />
                </label>

                {/* Factory Reset */}
                <button
                  onClick={handleFactoryReset}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border border-rose-100/10"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تهيئة وإعادة تعيين المصنع للمتغيرات' : 'ERP Factory Reset'}</span>
                </button>

              </div>
            </div>

          </div>
        );

      default:
        return (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border rounded-2xl">
            <p className="text-xs text-slate-400 font-bold">This section is being re-engineered.</p>
          </div>
        );
    }
  };

  // If user session is empty, show Login View
  if (!session) {
    return (
      <LoginView 
        db={db}
        onLogin={handleLogin}
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
        translate={translate}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-300`}>
      
      {/* 1. Sidebar Panel (Left for English, Right for Arabic RTL) */}
      <div className="hidden lg:block w-72 shrink-0">
        <Sidebar 
          session={session}
          db={db}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
          translate={translate}
        />
      </div>

      {/* Mobile drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-50 transition-opacity" onClick={() => setMobileSidebarOpen(false)}>
          <div className="w-72 bg-white dark:bg-slate-900 h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar 
              session={session}
              db={db}
              activeView={activeView}
              setActiveView={(view) => {
                setActiveView(view);
                setMobileSidebarOpen(false);
              }}
              onLogout={() => {
                handleLogout();
                setMobileSidebarOpen(false);
              }}
              translate={translate}
            />
          </div>
        </div>
      )}

      {/* 2. Main Content Board */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Dynamic Glassmorphic Navigation Bar */}
        <Navbar 
          session={session}
          db={db}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
          lang={lang}
          setLang={setLang}
          theme={theme}
          toggleTheme={toggleTheme}
          translate={translate}
          toggleSidebarMobile={toggleSidebarMobile}
        />

        {/* Dynamic View Panel Stage */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-[1440px] w-full mx-auto">
          {renderViewContent()}
        </main>
      </div>

    </div>
  );
}
