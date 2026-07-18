import React from 'react';
import { UserSession, DatabaseState } from '../types';
import { 
  Home, 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  HeartHandshake, 
  ShieldCheck, 
  BookOpen, 
  QrCode, 
  Award, 
  Wallet, 
  MessageSquare, 
  Heart, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  session: UserSession;
  db: DatabaseState;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  translate: (key: string) => string;
}

export default function Sidebar({
  session,
  db,
  activeView,
  setActiveView,
  onLogout,
  translate
}: SidebarProps) {
  const role = session.role;

  const menuItems = [
    { id: 'home', labelKey: 'navHome', icon: Home, visible: true },
    { id: 'dashboard', labelKey: 'navDashboard', icon: LayoutDashboard, visible: role === 'admin' || role === 'teacher' },
    { id: 'students', labelKey: 'navStudents', icon: Users, visible: role === 'admin' || role === 'teacher' },
    { id: 'teachers-mgmt', labelKey: 'navTeachersMgmt', icon: GraduationCap, visible: role === 'admin' },
    { id: 'parents-mgmt', labelKey: 'navParentsMgmt', icon: HeartHandshake, visible: role === 'admin' },
    { id: 'admins-mgmt', labelKey: 'navAdminsMgmt', icon: ShieldCheck, visible: role === 'admin' },
    { id: 'groups', labelKey: 'navGroups', icon: BookOpen, visible: role === 'admin' || role === 'teacher' },
    { id: 'attendance', labelKey: 'navAttendance', icon: QrCode, visible: role === 'admin' || role === 'teacher' },
    { id: 'grades', labelKey: 'navGrades', icon: Award, visible: role === 'admin' || role === 'teacher' },
    { id: 'finance', labelKey: 'navFinance', icon: Wallet, visible: role === 'admin' },
    { id: 'whatsapp', labelKey: 'navNotifications', icon: MessageSquare, visible: role === 'admin' || role === 'teacher' },
    { id: 'parent-portal', labelKey: 'navParentPortal', icon: Heart, visible: role === 'parent' },
    { id: 'settings', labelKey: 'navSettings', icon: Settings, visible: true },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r dark:border-slate-800 border-slate-200 flex flex-col h-screen fixed top-0 transition-all duration-300 z-50 ltr:left-0 rtl:right-0">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xl font-extrabold shadow-md shadow-purple-500/20">
          ∑
        </div>
        <div className="text-right rtl:text-right ltr:text-left">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
            {db.settings.language === 'ar' ? db.siteSettings.centerNameAr : db.siteSettings.centerNameEn}
          </h3>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            {translate('appName')}
          </p>
        </div>
      </div>

      {/* Teacher Profile Brand Card */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/10 dark:to-indigo-950/10 border border-purple-100/50 dark:border-purple-900/10 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <img 
            src={db.siteSettings.teacherAvatar || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80"} 
            alt="Teacher" 
            className="w-12 h-12 rounded-full object-cover border-2 border-purple-400 p-[1.5px] bg-white dark:bg-slate-950 shadow-md shadow-purple-400/20"
            referrerPolicy="no-referrer"
          />
          <div className="text-right rtl:text-right ltr:text-left overflow-hidden">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">
              {db.siteSettings.teacherName}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
              {db.siteSettings.teacherTitle}
            </p>
            <span className="text-[9.5px] font-mono text-purple-600 dark:text-purple-400 font-semibold block mt-1">
              {db.siteSettings.teacherPhone}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links Scrollable list */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 py-1">
        {menuItems
          .filter((item) => item.visible)
          .map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 shadow-sm border border-purple-100/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <IconComponent className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 text-purple-600 dark:text-purple-400' : ''}`} />
                <span className="truncate">{translate(item.labelKey)}</span>
              </button>
            );
          })}
      </nav>

      {/* Sidebar Footer Log-out trigger */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 text-slate-600 dark:text-slate-400 hover:text-rose-500 text-xs font-bold transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>{translate('logout')}</span>
        </button>
      </div>

    </aside>
  );
}
