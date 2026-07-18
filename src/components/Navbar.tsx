import React from 'react';
import { UserSession, DatabaseState } from '../types';
import { Menu, Sun, Moon, LogOut, Heart, Home } from 'lucide-react';

interface NavbarProps {
  session: UserSession;
  db: DatabaseState;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  translate: (key: string) => string;
  toggleSidebarMobile: () => void;
}

export default function Navbar({
  session,
  db,
  activeView,
  setActiveView,
  onLogout,
  lang,
  setLang,
  theme,
  toggleTheme,
  translate,
  toggleSidebarMobile
}: NavbarProps) {
  const isParent = session.role === 'parent';

  // Get active user full display details
  const getBadgeDetails = () => {
    if (session.role === 'admin') {
      const match = db.admins?.find(a => a.username === session.username) || db.admins?.[0];
      return {
        name: match?.name || 'أ. محمد مطاوع',
        avatar: db.siteSettings.teacherAvatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80',
        roleKey: 'loginRoleAdmin'
      };
    } else if (session.role === 'teacher') {
      const match = db.teachers?.find(t => t.id === session.username) || db.teachers?.[0];
      return {
        name: lang === 'ar' ? (match?.nameAr || '') : (match?.nameEn || ''),
        avatar: match?.avatar || db.siteSettings.teacherAvatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80',
        roleKey: 'loginRoleTeacher'
      };
    } else {
      const match = db.parents?.find(p => p.id === session.username) || db.parents?.[0];
      return {
        name: match?.name || 'ولي أمر',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        roleKey: 'loginRoleParent'
      };
    }
  };

  const userBadge = getBadgeDetails();

  return (
    <header className="h-[74px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-40 transition-colors duration-300">
      
      {/* Left side: hamburger trigger & dynamic name */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebarMobile} 
          className="lg:hidden p-2 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-purple-500/20">
            ∑
          </div>
          <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 hidden sm:inline-block tracking-tight">
            {lang === 'ar' ? db.siteSettings.centerNameAr : db.siteSettings.centerNameEn}
          </span>
        </div>
      </div>

      {/* Right side: quick shortcuts, toggles & profile */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        
        {/* Parent Portal Tab Buttons */}
        {isParent && (
          <div className="flex items-center gap-1.5 border-r dark:border-slate-800 border-slate-200 pr-3 mr-1">
            <button
              onClick={() => setActiveView('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                activeView === 'home'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{translate('navHome')}</span>
            </button>
            <button
              onClick={() => setActiveView('parent-portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                activeView === 'parent-portal'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{translate('navParentPortal')}</span>
            </button>
          </div>
        )}

        {/* Translation Switcher */}
        <button 
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all font-bold text-xs shadow-sm border border-slate-100 dark:border-slate-850"
        >
          {lang === 'ar' ? 'EN' : 'AR'}
        </button>

        {/* Dark/Light mode toggle */}
        <button 
          onClick={toggleTheme} 
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-850"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Exit portal */}
        <button 
          onClick={onLogout} 
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 text-rose-500 rounded-xl transition-all shadow-sm border border-rose-100/10"
          title={translate('logout')}
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* User badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800 ltr:border-l rtl:border-r rtl:border-l-0 ltr:pl-3 ltr:ml-1 rtl:pr-3 rtl:mr-1">
          <img 
            src={userBadge.avatar} 
            alt="Profile Avatar" 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-purple-100 dark:border-purple-900 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div className="text-right rtl:text-right ltr:text-left hidden md:block">
            <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-tight">
              {userBadge.name}
            </h5>
            <span className="text-[9px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-extrabold px-1.5 py-0.5 rounded mt-0.5 inline-block border border-purple-100/10">
              {translate(userBadge.roleKey)}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
