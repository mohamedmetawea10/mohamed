import React, { useState } from 'react';
import { DatabaseState, Student, Group, Transaction, UserSession } from '../types';
import { PlusCircle, Wallet, Download, ArrowUpCircle, ArrowDownCircle, Trash2, Check, X, CreditCard } from 'lucide-react';

interface FinanceViewProps {
  db: DatabaseState;
  session: UserSession;
  onUpdateDb: (updated: DatabaseState) => void;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
}

export default function FinanceView({
  db,
  session,
  onUpdateDb,
  lang,
  translate
}: FinanceViewProps) {
  const isAdmin = session.role === 'admin';

  // Active tuition tracker filters
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // General Ledger Form State
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txStudentId, setTxStudentId] = useState('');
  const [txCategory, setTxCategory] = useState('monthly-fees');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');

  // Month and Group lists helper
  const monthLabelsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthLabelsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const groupStudents = db.students.filter(s => s.groupId === selectedGroupId);
  const currentYear = new Date().getFullYear();

  const dispatchPaymentNotification = (student: Student, amount: number) => {
    let parentPhone = student.fatherPhone || student.motherPhone || student.studentPhone || '';
    if (!parentPhone) return;

    const groupObj = db.groups.find(g => g.id === student.groupId);
    const groupName = groupObj ? (lang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';

    const dateStr = new Date().toLocaleDateString();
    const curTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageText = lang === 'ar'
      ? `السلام عليكم ورحمة الله وبركاته، تم بحمد الله استلام مبلغ ${amount} ج.م قيمة اشتراك الرياضيات للطالب/ ${student.name} بمجموعة (${groupName}). نشكركم لتعاونكم وثقتكم بنا.\nأكاديمية Math Zone 💳`
      : `Dear Parent, payment of ${amount} EGP for student ${student.name} in group (${groupName}) received successfully. Thank you for your trust.\nMath Zone Academy 💳`;

    // 1. Add WhatsApp Log
    const newLog = {
      id: 'MSG' + Date.now() + Math.floor(Math.random() * 100),
      studentId: student.id,
      recipient: parentPhone,
      type: 'payment',
      message: messageText,
      date: `${dateStr} ${curTime}`,
      status: 'sent' as const
    };
    db.whatsappLogs = [newLog, ...(db.whatsappLogs || [])];

    // 2. Add Parent Notification (for parent portal)
    const newNotification = {
      id: 'NOT' + Date.now() + Math.floor(Math.random() * 100),
      studentId: student.id,
      type: 'payment',
      title: 'استلام دفعة مالية',
      message: messageText,
      date: `${dateStr} ${curTime}`,
      read: false
    };
    db.parentNotifications = [newNotification, ...(db.parentNotifications || [])];
  };

  const handleTogglePayment = (student: Student, isPaying: boolean, existingTxId?: string) => {
    let updatedTransactions = [...db.transactions];

    if (isPaying) {
      // Record new payment
      const selectedMonthLabel = lang === 'ar' ? monthLabelsAr[selectedMonth] : monthLabelsEn[selectedMonth];
      const newTx: Transaction = {
        id: 'TX' + Date.now() + Math.floor(Math.random() * 100),
        type: 'income',
        amount: student.monthlyFee,
        category: 'monthly-fees',
        date: new Date(currentYear, selectedMonth, 15).toISOString().substring(0, 10), // mid-month date representation
        studentId: student.id,
        desc: lang === 'ar' 
          ? `سداد اشتراك شهر ${selectedMonthLabel} - الطالب ${student.name}` 
          : `Subscription Fee ${selectedMonthLabel} - Student ${student.name}`
      };
      updatedTransactions.unshift(newTx);
      db.transactions = updatedTransactions;
      dispatchPaymentNotification(student, student.monthlyFee);
      alert(lang === 'ar' ? `تم تسجيل دفعة بقيمة ${student.monthlyFee} ج.م للطالب ${student.name}` : `Successfully recorded payment for ${student.name}`);
    } else if (existingTxId) {
      // Cancel payment
      const confirm = window.confirm(lang === 'ar' ? 'هل أنت متأكد من إلغاء دفعة الاشتراك هذه وحذف المعاملة من الدفتر؟' : 'Are you sure you want to cancel this payment?');
      if (!confirm) return;

      updatedTransactions = updatedTransactions.filter(t => t.id !== existingTxId);
      db.transactions = updatedTransactions;
      onUpdateDb({ ...db });
      alert(lang === 'ar' ? 'تم إلغاء الدفعة وحذف المعاملة بنجاح' : 'Payment cancelled successfully');
    }
  };

  const handleAddGeneralTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(txAmount);
    if (!amountVal || !txDesc.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال المبلغ وتفاصيل المعاملة' : 'Please check amount and description fields.');
      return;
    }

    const newTx: Transaction = {
      id: 'TX' + Date.now() + Math.floor(Math.random() * 10),
      type: txType,
      amount: amountVal,
      category: txCategory,
      date: new Date().toISOString().substring(0, 10),
      studentId: txType === 'income' ? txStudentId : '',
      desc: txDesc
    };

    const updatedTransactions = [newTx, ...db.transactions];
    onUpdateDb({
      ...db,
      transactions: updatedTransactions
    });

    alert(lang === 'ar' ? 'تم حفظ المعاملة بنجاح' : 'Transaction logged successfully.');

    // If tuition is recorded manually, dispatch notification
    if (txType === 'income' && txCategory === 'monthly-fees' && txStudentId) {
      const student = db.students.find(s => s.id === txStudentId);
      if (student) dispatchPaymentNotification(student, amountVal);
    }

    // Reset Form
    setTxAmount('');
    setTxDesc('');
    setTxStudentId('');
  };

  const handleDeleteTransaction = (id: string) => {
    const confirm = window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه المعاملة المالية نهائياً؟' : 'Are you sure you want to delete this transaction from the ledger?');
    if (!confirm) return;

    const updatedTransactions = db.transactions.filter(t => t.id !== id);
    onUpdateDb({ ...db, transactions: updatedTransactions });
    alert(lang === 'ar' ? 'تم حذف المعاملة' : 'Transaction entry removed');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {translate('financialSystem')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' ? 'دفاتر المالية اليومية ومتابعة تحصيل الاشتراكات من الطلاب' : 'Ledger logs, expenses and monthly group tuition checks'}
          </p>
        </div>
      </div>

      {/* Grid: Payment Tracker & New Transaction Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tuition Tracker Column (Spans 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span>{lang === 'ar' ? 'دفتر الاشتراكات والتحصيل الشهري' : 'Tuition Fees Status Grid'}</span>
          </h3>

          {/* Month selects */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 block">1. اختر الشهر الدراسي:</label>
            <div className="flex gap-1 overflow-x-auto pb-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl">
              {monthLabelsAr.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMonth(idx)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all ${
                    selectedMonth === idx
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'hover:bg-slate-100 text-slate-600 dark:text-slate-350'
                  }`}
                >
                  {lang === 'ar' ? label : monthLabelsEn[idx]}
                </button>
              ))}
            </div>
          </div>

          {/* Group selects */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 block">2. اختر المجموعة الدراسية:</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {db.groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all ${
                    selectedGroupId === g.id
                      ? 'bg-purple-50 border-purple-300 dark:bg-purple-950/20 dark:border-purple-800 text-purple-600 dark:text-purple-400'
                      : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {lang === 'ar' ? g.nameAr : g.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* List panel */}
          {selectedGroupId && (
            <div className="border-t border-slate-100 dark:border-slate-850 pt-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? 'كشف اشتراكات طلاب المجموعة' : 'Students Fees Collection Sheet:'}
              </h4>

              {groupStudents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  {lang === 'ar' ? 'لا يوجد طلاب مسجلين في هذه المجموعة' : 'No students registered under this group.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-center font-bold text-slate-500">
                        <th className="p-3 text-right">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                        <th className="p-3">{lang === 'ar' ? 'الكود' : 'Student ID'}</th>
                        <th className="p-3">{lang === 'ar' ? 'الرسوم' : 'Amount'}</th>
                        <th className="p-3">{lang === 'ar' ? 'حالة الدفع' : 'Payment status'}</th>
                        <th className="p-3">{lang === 'ar' ? 'الإجراء' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupStudents.map(student => {
                        const paymentTx = db.transactions.find(tx => 
                          tx.type === 'income' && 
                          tx.studentId === student.id && 
                          tx.category === 'monthly-fees' && 
                          new Date(tx.date).getMonth() === selectedMonth && 
                          new Date(tx.date).getFullYear() === currentYear
                        );

                        const isPaid = !!paymentTx;

                        return (
                          <tr key={student.id} className="border-b border-slate-100 dark:border-slate-850 text-center hover:bg-slate-100/20">
                            <td className="p-3 font-extrabold text-slate-800 dark:text-slate-100 text-right">{student.name}</td>
                            <td className="p-3 font-mono text-slate-400">{student.id}</td>
                            <td className="p-3 font-bold text-slate-500">{student.monthlyFee} {translate('currency')}</td>
                            <td className="p-3">
                              {isPaid ? (
                                <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {lang === 'ar' ? 'تم الدفع ✔' : 'Cleared ✔'}
                                </span>
                              ) : (
                                <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {lang === 'ar' ? 'لم يتم الدفع ✖' : 'Unpaid ✖'}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {isPaid ? (
                                <button
                                  onClick={() => handleTogglePayment(student, false, paymentTx.id)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-[10.5px] transition-all"
                                >
                                  {lang === 'ar' ? 'إلغاء الدفع ✖' : 'Cancel cleared'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleTogglePayment(student, true)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[10.5px] shadow-sm transition-all"
                                >
                                  {lang === 'ar' ? 'تسجيل دفع ✔' : 'Mark as paid'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ledger Logging Form (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>📝</span>
            <span>{lang === 'ar' ? 'تسجيل دفعة بالدفتر اليومي' : 'Log Custom Ledger Entry'}</span>
          </h3>

          <form onSubmit={handleAddGeneralTransaction} className="space-y-4">
            
            {/* Transaction Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'نوع المعاملة' : 'Transaction Type'}</label>
              <select
                value={txType}
                onChange={(e) => {
                  const type = e.target.value as 'income' | 'expense';
                  setTxType(type);
                  setTxCategory(type === 'income' ? 'monthly-fees' : 'rent');
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              >
                <option value="income">{translate('income')}</option>
                <option value="expense">{translate('expense')}</option>
              </select>
            </div>

            {/* Student (only visible for manual Income) */}
            {txType === 'income' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'الطالب (اختياري)' : 'Student profile (Optional)'}</label>
                <select
                  value={txStudentId}
                  onChange={(e) => setTxStudentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                >
                  <option value="">{lang === 'ar' ? 'طالب عام' : 'No student / General Income'}</option>
                  {db.students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{translate('category')}</label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              >
                {txType === 'income' ? (
                  <>
                    <option value="monthly-fees">{translate('monthlyFees')}</option>
                    <option value="other">{translate('other')}</option>
                  </>
                ) : (
                  <>
                    <option value="rent">{translate('rent')}</option>
                    <option value="printing">{translate('printing')}</option>
                    <option value="internet">{translate('internet')}</option>
                    <option value="other">{translate('other')}</option>
                  </>
                )}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{translate('amount')}</label>
              <input 
                type="number" 
                required 
                min={1}
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="300"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">{translate('notes')}</label>
              <input 
                type="text" 
                required 
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: سداد إيجار القاعة الرئيسي لشهر يوليو' : 'e.g. Printer inks booklets'}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3 shadow-md shadow-indigo-500/10 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تنزيل بالدفتر المالي' : 'Add to Ledger'}</span>
            </button>
          </form>

        </div>

      </div>

      {/* Ledger lists (Section 2) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            {lang === 'ar' ? 'سجل العمليات المالية والواردات' : 'Historical Ledger Book'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-center font-bold text-slate-500">
                <th className="p-4 text-right">ID</th>
                <th className="p-4">{lang === 'ar' ? 'النوع' : 'Entry Type'}</th>
                <th className="p-4">{translate('amount')}</th>
                <th className="p-4">{translate('category')}</th>
                <th className="p-4">{lang === 'ar' ? 'التاريخ واليوم' : 'Date'}</th>
                <th className="p-4 text-right">{translate('notes')}</th>
                <th className="p-4">{translate('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {db.transactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800 text-center hover:bg-slate-50/50">
                    <td className="p-4 font-mono text-[10.5px] text-slate-400">{tx.id}</td>
                    <td className="p-4">
                      {isIncome ? (
                        <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {translate('income')}
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-450 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {translate('expense')}
                        </span>
                      )}
                    </td>
                    <td className={`p-4 font-extrabold ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isIncome ? '+' : '-'}{tx.amount} {translate('currency')}
                    </td>
                    <td className="p-4 font-bold text-slate-500">{translate(tx.category) || tx.category}</td>
                    <td className="p-4 font-mono text-slate-400">{tx.date}</td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-350 font-medium text-[11.5px] max-w-xs truncate">{tx.desc}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/10 rounded"
                        title={lang === 'ar' ? 'حذف المعاملة' : 'Delete transaction'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {db.transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-semibold">
                    {lang === 'ar' ? 'لا يوجد معاملات مالية مسجلة' : 'Ledger is empty.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
