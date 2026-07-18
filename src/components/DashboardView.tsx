import React, { useState } from 'react';
import { DatabaseState, UserSession } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, Award, BookOpen, DollarSign, Calendar, Wallet, TrendingUp, TrendingDown, PiggyBank, Eye, HelpCircle 
} from 'lucide-react';

interface DashboardViewProps {
  db: DatabaseState;
  session: UserSession;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
}

export default function DashboardView({
  db,
  session,
  lang,
  translate
}: DashboardViewProps) {
  const isAdmin = session.role === 'admin';

  // Active month index for monthly breakdown (0 = Jan, 11 = Dec)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  // Modals state for details
  const [detailModalType, setDetailModalOpen] = useState<string | null>(null);

  const studentsCount = db.students.length;
  const teachersCount = db.teachers.length;
  const groupsCount = db.groups.length;

  const todayStr = new Date().toISOString().substring(0, 10);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const currentYear = new Date().getFullYear();
  const currentMonthStr = new Date().toISOString().substring(0, 7);

  // Financial calculations
  let dailyIncome = 0;
  let weeklyIncome = 0;
  let monthlyIncome = 0;
  let annualIncome = 0;
  let totalExpenses = 0;

  db.transactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    const isCurrentYear = txDate.getFullYear() === currentYear;

    if (tx.type === 'income') {
      if (tx.date === todayStr) dailyIncome += tx.amount;
      if (txDate >= oneWeekAgo) weeklyIncome += tx.amount;
      if (tx.date.substring(0, 7) === currentMonthStr) monthlyIncome += tx.amount;
      if (isCurrentYear) annualIncome += tx.amount;
    } else {
      if (isCurrentYear) totalExpenses += tx.amount;
    }
  });

  const netProfit = annualIncome - totalExpenses;

  // Monthly stats calculations for selectedMonth
  let selectedMonthIncome = 0;
  let selectedMonthExpense = 0;
  db.transactions.forEach(tx => {
    const d = new Date(tx.date);
    if (d.getFullYear() === currentYear && d.getMonth() === selectedMonth) {
      if (tx.type === 'income') {
        selectedMonthIncome += tx.amount;
      } else {
        selectedMonthExpense += tx.amount;
      }
    }
  });

  const selectedMonthProfit = selectedMonthIncome - selectedMonthExpense;

  // Attendance rate for selectedMonth
  let presentCount = 0;
  let totalAttendance = 0;
  db.attendance.forEach(att => {
    const d = new Date(att.date);
    if (d.getFullYear() === currentYear && d.getMonth() === selectedMonth) {
      totalAttendance++;
      if (att.status === 'present' || att.status === 'late') {
        presentCount++;
      }
    }
  });
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

  // Billing/Collection rate for selectedMonth
  let paidStudentsCount = 0;
  db.students.forEach(s => {
    const hasPaid = db.transactions.some(tx => 
      tx.type === 'income' && 
      tx.studentId === s.id && 
      tx.category === 'monthly-fees' && 
      new Date(tx.date).getMonth() === selectedMonth && 
      new Date(tx.date).getFullYear() === currentYear
    );
    if (hasPaid) paidStudentsCount++;
  });
  const billingRate = db.students.length > 0 ? Math.round((paidStudentsCount / db.students.length) * 100) : 100;

  // Annual Recharts comparison data (12 Months)
  const monthLabelsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthLabelsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const annualChartData = Array.from({ length: 12 }).map((_, idx) => {
    const name = lang === 'ar' ? monthLabelsAr[idx] : monthLabelsEn[idx];
    let income = 0;
    let expense = 0;

    db.transactions.forEach(tx => {
      const d = new Date(tx.date);
      if (d.getFullYear() === currentYear && d.getMonth() === idx) {
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
      }
    });

    return {
      name,
      [lang === 'ar' ? 'الإيرادات' : 'Income']: income,
      [lang === 'ar' ? 'المصروفات' : 'Expenses']: expense
    };
  });

  return (
    <div className="space-y-8 animate-fadeInView">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
          {translate('navDashboard')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'ar' ? 'لوحة المتابعة التحليلية والمالية الشاملة للسنتر' : 'Comprehensive ERP financial and registration analytics'}
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">{translate('statTotalStudents')}</span>
            <span className="text-xl font-black text-slate-800 dark:text-white block">{studentsCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">{translate('statTotalTeachers')}</span>
            <span className="text-xl font-black text-slate-800 dark:text-white block">{teachersCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Total Groups (Clickable details) */}
        <div 
          onClick={() => setDetailModalOpen('groups')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block group-hover:text-purple-500 transition-colors">{translate('statTotalGroups')}</span>
            <span className="text-xl font-black text-slate-800 dark:text-white block">{groupsCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-500 dark:text-purple-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Daily Income (Clickable details, Admin only) */}
        {isAdmin && (
          <div 
            onClick={() => setDetailModalOpen('daily')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer group transition-all"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block group-hover:text-emerald-500 transition-colors">{translate('statDailyIncome')}</span>
              <span className="text-sm font-black text-slate-800 dark:text-white block">{dailyIncome} {translate('currency')}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Weekly Income (Clickable details, Admin only) */}
        {isAdmin && (
          <div 
            onClick={() => setDetailModalOpen('weekly')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer group transition-all"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block group-hover:text-blue-500 transition-colors">{translate('statWeeklyIncome')}</span>
              <span className="text-sm font-black text-slate-800 dark:text-white block">{weeklyIncome} {translate('currency')}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Monthly Income (Admin only) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">{translate('statMonthlyIncome')}</span>
              <span className="text-sm font-black text-slate-800 dark:text-white block">{monthlyIncome} {translate('currency')}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-500 dark:text-purple-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Annual Income (Admin only) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">{translate('statAnnualIncome')}</span>
              <span className="text-sm font-black text-slate-800 dark:text-white block">{annualIncome} {translate('currency')}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Annual Expenses (Clickable details, Admin only) */}
        {isAdmin && (
          <div 
            onClick={() => setDetailModalOpen('expenses')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer group transition-all"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block group-hover:text-rose-500 transition-colors">{translate('statTotalExpenses')}</span>
              <span className="text-sm font-black text-slate-800 dark:text-white block">{totalExpenses} {translate('currency')}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Annual Net Profit (Admin only, Spans 2 cols on wide) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between md:col-span-2 lg:col-span-2 xl:col-span-2">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">{translate('statNetProfit')}</span>
              <span className={`text-sm sm:text-base font-black block ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {netProfit} {translate('currency')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
        )}

      </div>

      {/* Month Breakdown Selection Tabs */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span>📅</span>
          <span>{lang === 'ar' ? 'تفاصيل الأداء لشهر دراسي محدد' : 'Performances per Academic Month'}</span>
        </h3>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex gap-1.5 overflow-x-auto">
          {monthLabelsAr.map((label, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedMonth(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedMonth === idx
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'ar' ? label : monthLabelsEn[idx]}
            </button>
          ))}
        </div>

        {/* Selected Month Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{lang === 'ar' ? 'إيرادات الشهر' : 'Month Income'}</span>
            <strong className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1 block">{selectedMonthIncome} {translate('currency')}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{lang === 'ar' ? 'مصروفات الشهر' : 'Month Expenses'}</span>
            <strong className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1 block text-rose-500">{selectedMonthExpense} {translate('currency')}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{lang === 'ar' ? 'صافي الربح' : 'Month Net Profit'}</span>
            <strong className={`text-base sm:text-lg font-black mt-1 block ${selectedMonthProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{selectedMonthProfit} {translate('currency')}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{lang === 'ar' ? 'نسبة حضور الطلاب' : 'Attendance Rate'}</span>
            <strong className="text-base sm:text-lg font-black text-purple-600 mt-1 block">{attendanceRate}%</strong>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{lang === 'ar' ? 'تحصيل الرسوم' : 'Fee Billing Success'}</span>
            <strong className="text-base sm:text-lg font-black text-indigo-500 mt-1 block">{billingRate}%</strong>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex justify-between items-center">
          <span>📈 {translate('revenueComparison')}</span>
          <span className="text-[10px] font-semibold text-slate-400">({currentYear})</span>
        </h3>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={annualChartData}
              margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar 
                dataKey={lang === 'ar' ? 'الإيرادات' : 'Income'} 
                fill="#a855f7" 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey={lang === 'ar' ? 'المصروفات' : 'Expenses'} 
                fill="#f43f5e" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DYNAMIC METRIC DETAILS MODALS */}
      {detailModalType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[700px] max-h-[85vh] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-zoomIn flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                {detailModalType === 'groups' && (lang === 'ar' ? 'بيان توزيع الطلاب على المجموعات' : 'Groups Students Capacity')}
                {detailModalType === 'daily' && (lang === 'ar' ? 'تفاصيل إيرادات اليوم' : 'Daily Income Log')}
                {detailModalType === 'weekly' && (lang === 'ar' ? 'تفاصيل إيرادات الأسبوع المنقضي' : 'Weekly Income Log')}
                {detailModalType === 'expenses' && (lang === 'ar' ? 'كشف المصروفات السنوي بالتفصيل' : 'Annual Expense Ledger')}
              </h3>
              <button 
                onClick={() => setDetailModalOpen(null)}
                className="text-slate-400 hover:text-rose-500 rounded p-1 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* GROUPS DETAILS */}
              {detailModalType === 'groups' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3 text-right">{lang === 'ar' ? 'اسم المجموعة' : 'Group Name'}</th>
                        <th className="p-3">{lang === 'ar' ? 'المرحلة' : 'Level'}</th>
                        <th className="p-3">{lang === 'ar' ? 'الموعد' : 'Time slot'}</th>
                        <th className="p-3">{lang === 'ar' ? 'سعر الاشتراك' : 'Subscription Fee'}</th>
                        <th className="p-3">{lang === 'ar' ? 'السعة' : 'Max Limit'}</th>
                        <th className="p-3">{lang === 'ar' ? 'المسجلون فعلياً' : 'Enrolled'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.groups.map(g => {
                        const enrolled = db.students.filter(s => s.groupId === g.id).length;
                        return (
                          <tr key={g.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-100 text-right">{lang === 'ar' ? g.nameAr : g.nameEn}</td>
                            <td className="p-3"><span className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 px-2 py-0.5 rounded text-[10px] font-bold">{g.level.join(', ')}</span></td>
                            <td className="p-3 font-mono text-[10.5px]">{g.timeSlot}</td>
                            <td className="p-3 font-extrabold">{g.fee} {translate('currency')}</td>
                            <td className="p-3 text-slate-400">{g.maxStudents}</td>
                            <td className={`p-3 font-black ${enrolled >= g.maxStudents ? 'text-rose-500' : 'text-emerald-500'}`}>{enrolled} / {g.maxStudents}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* DAILY INCOME DETAILS */}
              {detailModalType === 'daily' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3 text-right">{lang === 'ar' ? 'الطالب' : 'Student Name'}</th>
                        <th className="p-3">{lang === 'ar' ? 'المجموعة' : 'Group'}</th>
                        <th className="p-3">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                        <th className="p-3">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.transactions
                        .filter(tx => tx.type === 'income' && tx.date === todayStr)
                        .map(tx => {
                          const student = db.students.find(s => s.id === tx.studentId);
                          const group = student ? db.groups.find(g => g.id === student.groupId) : null;
                          return (
                            <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-100 text-right">{student?.name || (lang === 'ar' ? 'طالب عام' : 'Bulk/Guest Payment')}</td>
                              <td className="p-3">{group ? (lang === 'ar' ? group.nameAr : group.nameEn) : '-'}</td>
                              <td className="p-3 text-slate-500">{tx.desc}</td>
                              <td className="p-3 font-extrabold text-emerald-500">+{tx.amount} {translate('currency')}</td>
                            </tr>
                          );
                        })}
                      {db.transactions.filter(tx => tx.type === 'income' && tx.date === todayStr).length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">{lang === 'ar' ? 'لا يوجد إيرادات مسجلة اليوم' : 'No income transactions logged today.'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* WEEKLY INCOME DETAILS */}
              {detailModalType === 'weekly' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3 text-right">{lang === 'ar' ? 'الطالب' : 'Student Name'}</th>
                        <th className="p-3">{lang === 'ar' ? 'البيان / الوصف' : 'Description'}</th>
                        <th className="p-3">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                        <th className="p-3">{lang === 'ar' ? 'التاريخ واليوم' : 'Date / Weekday'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.transactions
                        .filter(tx => tx.type === 'income' && new Date(tx.date) >= oneWeekAgo)
                        .map(tx => {
                          const student = db.students.find(s => s.id === tx.studentId);
                          const dayName = new Date(tx.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
                          return (
                            <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-100 text-right">{student?.name || (lang === 'ar' ? 'طالب عام' : 'Bulk/Guest Payment')}</td>
                              <td className="p-3 text-slate-500 text-[11.5px]">{tx.desc}</td>
                              <td className="p-3 font-extrabold text-emerald-500">+{tx.amount} {translate('currency')}</td>
                              <td className="p-3 font-mono text-[10.5px] text-slate-400">{tx.date} ({dayName})</td>
                            </tr>
                          );
                        })}
                      {db.transactions.filter(tx => tx.type === 'income' && new Date(tx.date) >= oneWeekAgo).length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">{lang === 'ar' ? 'لا يوجد إيرادات مسجلة هذا الأسبوع' : 'No income transactions logged this week.'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* EXPENSES DETAILS */}
              {detailModalType === 'expenses' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3 text-right">{lang === 'ar' ? 'البيان / الوصف' : 'Description'}</th>
                        <th className="p-3">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                        <th className="p-3">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                        <th className="p-3">{lang === 'ar' ? 'التاريخ واليوم' : 'Date'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.transactions
                        .filter(tx => tx.type === 'expense')
                        .map(tx => {
                          const dayName = new Date(tx.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
                          return (
                            <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-100 text-right">{tx.desc}</td>
                              <td className="p-3"><span className="bg-rose-50 dark:bg-rose-950/20 text-rose-500 px-2 py-0.5 rounded text-[10px] font-bold">{translate(tx.category) || tx.category}</span></td>
                              <td className="p-3 font-extrabold text-rose-500">-{tx.amount} {translate('currency')}</td>
                              <td className="p-3 font-mono text-[10.5px] text-slate-400">{tx.date} ({dayName})</td>
                            </tr>
                          );
                        })}
                      {db.transactions.filter(tx => tx.type === 'expense').length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">{lang === 'ar' ? 'لا يوجد مصروفات مسجلة' : 'No outgoings logged in the ledger yet.'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-950/20">
              <button
                onClick={() => setDetailModalOpen(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
