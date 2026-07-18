import React, { useState, useEffect } from 'react';
import { DatabaseState, Student, Group, UserSession } from '../types';
import { 
  PlusCircle, Search, Download, Edit2, Trash2, Printer, X, Eye, 
  MapPin, Phone, School, Calendar, Award, Trophy, UserPlus 
} from 'lucide-react';

interface StudentsViewProps {
  db: DatabaseState;
  session: UserSession;
  onUpdateDb: (updated: DatabaseState) => void;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
}

export default function StudentsView({
  db,
  session,
  onUpdateDb,
  lang,
  translate
}: StudentsViewProps) {
  const isAuthorized = session.role === 'admin' || session.role === 'teacher';

  const academicLevels = [
    'KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'الأول إعدادي', 'الثاني إعدادي', 'الثالث إعدادي', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'
  ];

  const [activeLevel, setActiveLevel] = useState<string>('register');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('');

  // Selected Student Details Modal State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form registration state
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [dob, setDob] = useState('');
  const [school, setSchool] = useState('');
  const [level, setLevel] = useState(academicLevels[0]);
  const [groupId, setGroupId] = useState('');
  const [sessionCount, setSessionCount] = useState(8);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'per-session'>('monthly');
  const [monthlyFee, setMonthlyFee] = useState(300);
  const [barcode, setBarcode] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [awardsInput, setAwardsInput] = useState('');
  const [achievementsInput, setAchievementsInput] = useState('');
  const [avatar, setAvatar] = useState('');

  // Automatically update group dropdown when level changes
  const filteredGroupsForLevel = db.groups.filter(g => g.level.includes(level));

  useEffect(() => {
    if (filteredGroupsForLevel.length > 0 && !groupId) {
      setGroupId(filteredGroupsForLevel[0].id);
    }
  }, [level, filteredGroupsForLevel, groupId]);

  // Handle auto-barcode and fees defaults on fresh adds
  const handleOpenAddForm = () => {
    setIsEditing(false);
    setEditingStudentId(null);
    setName('');
    setGender('male');
    setDob('');
    setSchool('');
    setLevel(academicLevels[0]);
    setGroupId(db.groups.find(g => g.level.includes(academicLevels[0]))?.id || '');
    setSessionCount(8);
    setSubscriptionType('monthly');
    setMonthlyFee(300);
    setBarcode(Math.floor(100000 + Math.random() * 900000).toString());
    setStudentPhone('');
    setFatherPhone('');
    setMotherPhone('');
    setAddress('');
    setNotes('');
    setAwardsInput('');
    setAchievementsInput('');
    setAvatar('');
    setActiveLevel('register');
  };

  const handleEditStudent = (student: Student) => {
    setIsEditing(true);
    setEditingStudentId(student.id);
    setName(student.name);
    setGender(student.gender);
    setDob(student.dob || '');
    setSchool(student.school || '');
    setLevel(student.academicLevel);
    setGroupId(student.groupId);
    setSessionCount(student.sessionCount);
    setSubscriptionType(student.subscriptionType);
    setMonthlyFee(student.monthlyFee);
    setBarcode(student.barcode);
    setStudentPhone(student.studentPhone || '');
    setFatherPhone(student.fatherPhone || student.parentPhone || '');
    setMotherPhone(student.motherPhone || '');
    setAddress(student.address || '');
    setNotes(student.notes || '');
    setAwardsInput(student.awards?.join(', ') || '');
    setAchievementsInput(student.achievements?.join(', ') || '');
    setAvatar(student.avatar || '');
    setActiveLevel('register');
  };

  const handleDeleteStudent = (id: string) => {
    const confirm = window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف حساب هذا الطالب وكل سجلاته نهائياً؟' : 'Are you sure you want to delete this student profile and all records?');
    if (!confirm) return;

    const updatedStudents = db.students.filter(s => s.id !== id);
    const updatedGrades = db.grades.filter(g => g.studentId !== id);
    const updatedAttendance = db.attendance.filter(a => a.studentId !== id);
    const updatedTransactions = db.transactions.filter(t => t.studentId !== id);

    const updatedDb = {
      ...db,
      students: updatedStudents,
      grades: updatedGrades,
      attendance: updatedAttendance,
      transactions: updatedTransactions
    };

    onUpdateDb(updatedDb);
    setSelectedStudent(null);
    alert(lang === 'ar' ? 'تم حذف الطالب بنجاح' : 'Student profile deleted');
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !groupId) {
      alert(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const currentAwards = awardsInput ? awardsInput.split(',').map(x => x.trim()).filter(Boolean) : [];
    const currentAchievements = achievementsInput ? achievementsInput.split(',').map(x => x.trim()).filter(Boolean) : [];

    let updatedStudents = [...db.students];

    if (isEditing && editingStudentId) {
      // Edit
      updatedStudents = updatedStudents.map(s => {
        if (s.id === editingStudentId) {
          return {
            ...s,
            name,
            gender,
            dob,
            school,
            academicLevel: level,
            groupId,
            sessionCount,
            subscriptionType,
            monthlyFee: Number(monthlyFee),
            barcode,
            studentPhone,
            fatherPhone,
            motherPhone,
            address,
            notes,
            awards: currentAwards,
            achievements: currentAchievements,
            avatar: avatar || s.avatar
          };
        }
        return s;
      });
      alert(lang === 'ar' ? 'تم تعديل ملف الطالب بنجاح' : 'Student details updated');
    } else {
      // Add
      const uniqueId = 'ST' + Math.floor(10000 + Math.random() * 90000);
      const newStudent: Student = {
        id: uniqueId,
        barcode: barcode || Math.floor(100000 + Math.random() * 900000).toString(),
        name,
        gender,
        dob,
        school,
        academicLevel: level,
        subject: level.includes('إعدادي') || level.includes('الثانوي') ? 'Mathematics' : 'Math',
        groupId,
        sessionCount,
        subscriptionType,
        monthlyFee: Number(monthlyFee),
        registrationDate: new Date().toISOString().substring(0, 10),
        studentPhone,
        fatherPhone,
        motherPhone,
        address,
        notes,
        awards: currentAwards,
        achievements: currentAchievements,
        avatar: avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
      };
      updatedStudents.push(newStudent);
      alert(lang === 'ar' ? 'تم إضافة الطالب بنجاح' : 'New student registered successfully');
    }

    onUpdateDb({ ...db, students: updatedStudents });
    handleOpenAddForm();
    setActiveLevel(level); // auto-route to student's level list
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setAvatar(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'ID,Name,Barcode,Level,Group,Phone,Father Phone,Fee\n';
    
    db.students.forEach(s => {
      const groupObj = db.groups.find(g => g.id === s.groupId);
      const groupName = groupObj ? groupObj.nameEn : 'Unassigned';
      csvContent += `"${s.id}","${s.name}","${s.barcode}","${s.academicLevel}","${groupName}","${s.studentPhone || ''}","${s.fatherPhone || ''}","${s.monthlyFee}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintCard = (student: Student) => {
    const group = db.groups.find(g => g.id === student.groupId);
    const gName = group ? (lang === 'ar' ? group.nameAr : group.nameEn) : 'Unassigned';
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(student.id)}`;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Student Smart Card - ${student.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&family=Outfit:wght@400;700&display=swap');
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #ffffff;
              direction: rtl;
              font-family: 'Cairo', 'Outfit', sans-serif;
            }
            .student-id-card {
              width: 320px;
              height: 480px;
              background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%);
              border-radius: 20px;
              border: 4px solid #ffffff;
              box-shadow: 0 10px 25px rgba(0,0,0,0.15);
              overflow: hidden;
              position: relative;
              display: flex;
              flex-direction: column;
              color: #ffffff;
            }
            .student-id-card-pattern {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: radial-gradient(circle, #ffffff 1px, transparent 1px);
              background-size: 15px 15px;
              opacity: 0.08;
              z-index: 1;
            }
            .student-id-card-header {
              height: 60px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 20px;
              z-index: 2;
            }
            .id-header-logo {
              font-size: 13px;
              font-weight: 800;
            }
            .id-header-title {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.9;
            }
            .student-id-card-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
              z-index: 2;
            }
            .student-id-card-body img.avatar {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #ffffff;
              margin-bottom: 10px;
            }
            .student-id-name {
              font-size: 15px;
              font-weight: 800;
              margin: 0 0 4px 0;
            }
            .student-id-level {
              font-size: 11px;
              color: #1e3a8a;
              background: #ffffff;
              padding: 3px 12px;
              border-radius: 99px;
              font-weight: 700;
              margin-bottom: 12px;
            }
            .student-id-details {
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 4px;
              font-size: 11px;
              opacity: 0.9;
              border-top: 1px dashed rgba(255, 255, 255, 0.2);
              padding-top: 10px;
              margin-bottom: 12px;
            }
            .student-id-details div {
              display: flex;
              justify-content: space-between;
            }
            .student-id-qr {
              margin-top: auto;
              background: #ffffff;
              padding: 6px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 90px;
              height: 90px;
            }
            .student-id-qr img {
              width: 80px;
              height: 80px;
            }
            .student-id-card-footer {
              height: 45px;
              background: rgba(0, 0, 0, 0.15);
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 20px;
              font-size: 10px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              z-index: 2;
            }
          </style>
        </head>
        <body>
          <div class="student-id-card">
            <div class="student-id-card-pattern"></div>
            <div class="student-id-card-header">
              <span class="id-header-logo">${db.siteSettings.centerNameAr}</span>
              <span class="id-header-title">Student Card</span>
            </div>
            <div class="student-id-card-body">
              <img class="avatar" src="${student.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'}" alt="Student Photo">
              <h4 class="student-id-name">${student.name}</h4>
              <span class="student-id-level">${student.academicLevel}</span>
              <div class="student-id-details">
                <div><strong>ID:</strong> <span>${student.id}</span></div>
                <div><strong>Group:</strong> <span>${gName}</span></div>
                <div><strong>Phone:</strong> <span>${student.studentPhone || student.fatherPhone || '-'}</span></div>
                <div><strong>Barcode:</strong> <span>${student.barcode}</span></div>
              </div>
              <div class="student-id-qr">
                <img src="${qrUrl}" alt="QR">
              </div>
            </div>
            <div class="student-id-card-footer">
              <span>${db.siteSettings.teacherName}</span>
              <span>📞 ${db.siteSettings.teacherPhone}</span>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter students based on search input and level
  const studentsListFiltered = db.students.filter(student => {
    const matchesLevel = activeLevel === 'register' || student.academicLevel === activeLevel;
    const matchesGroup = !selectedGroupFilter || student.groupId === selectedGroupFilter;
    
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchLower || 
      student.name.toLowerCase().includes(searchLower) ||
      student.id.toLowerCase().includes(searchLower) ||
      student.barcode.toLowerCase().includes(searchLower) ||
      (student.studentPhone && student.studentPhone.includes(searchLower)) ||
      (student.fatherPhone && student.fatherPhone.includes(searchLower)) ||
      (student.motherPhone && student.motherPhone.includes(searchLower));

    return matchesLevel && matchesGroup && matchesSearch;
  });

  // Sort alphabetically by Arabic friendly string comparison
  studentsListFiltered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {translate('studentDb')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' ? 'تسجيل الطلاب الجدد ومتابعة الملفات الأكاديمية وصور الكارنيهات' : 'Manage academic cards and students registrations'}
          </p>
        </div>
        {activeLevel !== 'register' && isAuthorized && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/10 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{translate('addStudent')}</span>
          </button>
        )}
      </div>

      {/* Academic Level tabs switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex gap-1.5 overflow-x-auto shadow-sm">
        {isAuthorized && (
          <button
            onClick={() => setActiveLevel('register')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeLevel === 'register'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>{lang === 'ar' ? 'تسجيل طالب جديد' : 'New Registration'}</span>
          </button>
        )}
        {academicLevels.map((lvl) => (
          <button
            key={lvl}
            onClick={() => {
              setActiveLevel(lvl);
              setSelectedGroupFilter('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              activeLevel === lvl
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* PANEL A: NEW STUDENT REGISTRATION FORM */}
      {activeLevel === 'register' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
            {isEditing ? (lang === 'ar' ? `تعديل ملف الطالب: ${name}` : 'Edit Student Profile') : (lang === 'ar' ? 'تسجيل ملف طالب جديد' : 'Register New Student Profile')}
          </h3>

          <form onSubmit={handleSaveStudent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('fullName')} *</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: أحمد محمود علي...' : 'e.g. Ahmed Mahmoud'}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* DOB */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('dob')}</label>
                <input 
                  type="date" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('gender')}</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                >
                  <option value="male">{translate('male')}</option>
                  <option value="female">{translate('female')}</option>
                </select>
              </div>

              {/* School Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('schoolName')}</label>
                <input 
                  type="text" 
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder={lang === 'ar' ? 'مدرسة المتفوقين الثانوية...' : 'e.g. Modern School'}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Academic Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('academicLevel')} *</label>
                <select 
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setGroupId(''); // reset group, trigger re-evaluation
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                >
                  {academicLevels.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              {/* Assigned Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('assignedGroup')} *</label>
                <select 
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                >
                  <option value="">{lang === 'ar' ? 'اختر مجموعة الدراسية...' : 'Select group...'}</option>
                  {filteredGroupsForLevel.map(g => (
                    <option key={g.id} value={g.id}>{lang === 'ar' ? g.nameAr : g.nameEn}</option>
                  ))}
                </select>
              </div>

              {/* Sessions Count */}
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

              {/* Subscription Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('subscriptionType')}</label>
                <select 
                  value={subscriptionType}
                  onChange={(e) => setSubscriptionType(e.target.value as 'monthly' | 'per-session')}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                >
                  <option value="monthly">{translate('monthly')}</option>
                  <option value="per-session">{translate('perSession')}</option>
                </select>
              </div>

              {/* Tuition Fees */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('monthlyFee')} ({translate('currency')})</label>
                <input 
                  type="number" 
                  required 
                  min={0}
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Barcode ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('barcodeId')} *</label>
                <input 
                  type="text" 
                  required 
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Student Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('studentPhone')}</label>
                <input 
                  type="tel" 
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Father Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('fatherPhone')}</label>
                <input 
                  type="tel" 
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Mother Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('motherPhone')}</label>
                <input 
                  type="tel" 
                  value={motherPhone}
                  onChange={(e) => setMotherPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('address')}</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={lang === 'ar' ? 'طنطا، بجوار الاستاد الرياضي...' : 'e.g. Cairo, Nasr City'}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Student avatar photo uploads */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {lang === 'ar' ? 'تحميل صورة شخصية للطالب (اختياري)' : 'Student Portrait Photo (Optional)'}
                </label>
                <div className="flex items-center gap-4">
                  <label 
                    htmlFor="student-avatar-upload" 
                    className="border border-dashed border-purple-300 dark:border-purple-900 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-purple-50/20 dark:hover:bg-purple-950/10 transition-all text-purple-600 dark:text-purple-400 font-bold text-xs"
                  >
                    {lang === 'ar' ? 'اختر صورة الكارنيه' : 'Upload Card Portrait'}
                  </label>
                  <input 
                    type="file" 
                    id="student-avatar-upload" 
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleAvatarFile}
                  />
                  {avatar && (
                    <div className="flex items-center gap-2">
                      <img 
                        src={avatar} 
                        alt="Avatar Preview" 
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                      />
                      <button 
                        type="button" 
                        onClick={() => setAvatar('')}
                        className="text-rose-500 text-xs font-bold hover:underline"
                      >
                        {lang === 'ar' ? 'حذف' : 'Remove'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Awards list */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('awards')} (مفصولة بفاصلة)</label>
                <input 
                  type="text" 
                  value={awardsInput}
                  onChange={(e) => setAwardsInput(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: كأس العبقري لشهر مارس، شهادة تقدير الواجب...' : 'e.g. Genius Trophy, Homework badge'}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Achievements list */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('achievements')} (مفصولة بفاصلة)</label>
                <input 
                  type="text" 
                  value={achievementsInput}
                  onChange={(e) => setAchievementsInput(e.target.value)}
                  placeholder={lang === 'ar' ? 'المركز الأول في اختبار نصف العام، نسبة تميز 98%...' : 'e.g. 1st in Mid-term Exam'}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{translate('notes')}</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'سلوك الطالب، مستواه، تركيزه...' : 'e.g. Excellent participation...'}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex justify-end gap-3.5">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
                >
                  {lang === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/10 transition-all"
              >
                {lang === 'ar' ? 'حفظ ملف الطالب' : 'Save Student Details'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* PANEL B: ACTIVE CLASS STUDENT LIST DIRECTORY */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-1 gap-3 flex-col sm:flex-row">
              {/* Directory Filter Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 rtl:right-3.5 ltr:left-3.5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={translate('searchPlaceholder')}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 ltr:pl-10 ltr:pr-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Group Filter */}
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
              >
                <option value="">{translate('filterGroup')}</option>
                {db.groups
                  .filter(g => g.level.includes(activeLevel))
                  .map(g => (
                    <option key={g.id} value={g.id}>{lang === 'ar' ? g.nameAr : g.nameEn}</option>
                  ))
                }
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{translate('exportData')}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-right">{translate('fullName')}</th>
                  <th className="p-4 text-center">{translate('assignedGroup')}</th>
                  <th className="p-4 text-center">{translate('studentId')}</th>
                  <th className="p-4 text-center">{translate('barcodeId')}</th>
                  {isAuthorized && <th className="p-4 text-center">{translate('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {studentsListFiltered.map((student) => {
                  const groupObj = db.groups.find(g => g.id === student.groupId);
                  const groupName = groupObj ? (lang === 'ar' ? groupObj.nameAr : groupObj.nameEn) : 'Unassigned';
                  return (
                    <tr 
                      key={student.id} 
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100 text-right flex items-center gap-3">
                        <img 
                          src={student.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100'} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                        />
                        <span>{student.name}</span>
                      </td>
                      <td className="p-4 text-center font-bold">{groupName}</td>
                      <td className="p-4 text-center font-mono text-[10.5px] text-slate-500">{student.id}</td>
                      <td className="p-4 text-center font-mono text-[10.5px] text-slate-500">{student.barcode}</td>
                      {isAuthorized && (
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="p-1.5 text-slate-500 hover:text-purple-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                              title={lang === 'ar' ? 'عرض الكارنيه والتفاصيل' : 'Details'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                              title={translate('editStudent')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all"
                              title={translate('deleteStudent')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {studentsListFiltered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-semibold">
                      {lang === 'ar' ? 'لا يوجد نتائج مطابقة للبحث' : 'No student profiles matching query.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDENT DETAILS & DIGITAL SMART CARD DIALOG */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[650px] max-h-[85vh] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-zoomIn flex flex-col">
            
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                {lang === 'ar' ? 'ملف الطالب والتفاصيل الأكاديمية' : 'Student Academic Portfolio'}
              </h3>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-rose-500 rounded p-1 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-right rtl:text-right ltr:text-left">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block">{translate('fullName')}</span>
                  <strong className="text-slate-800 dark:text-slate-100 mt-1 block">{selectedStudent.name}</strong>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block">{translate('studentId')}</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-mono mt-1 block">{selectedStudent.id}</strong>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block">{translate('academicLevel')}</span>
                  <strong className="text-purple-600 mt-1 block">{selectedStudent.academicLevel}</strong>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block">{translate('assignedGroup')}</span>
                  <strong className="text-slate-800 dark:text-slate-100 mt-1 block">
                    {db.groups.find(g => g.id === selectedStudent.groupId)?.nameAr || 'Unassigned'}
                  </strong>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block">{translate('subscriptionType')}</span>
                  <strong className="text-slate-800 dark:text-slate-100 mt-1 block">
                    {selectedStudent.subscriptionType === 'monthly' ? translate('monthly') : translate('perSession')} - {selectedStudent.monthlyFee} ج.م
                  </strong>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block">{translate('studentPhone')}</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-mono mt-1 block">{selectedStudent.studentPhone || '-'}</strong>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block">{translate('fatherPhone')}</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-mono mt-1 block">{selectedStudent.fatherPhone || '-'}</strong>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block">{translate('motherPhone')}</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-mono mt-1 block">{selectedStudent.motherPhone || '-'}</strong>
                </div>
                {selectedStudent.school && (
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-[10px] text-slate-400 font-bold block">{translate('schoolName')}</span>
                    <strong className="text-slate-800 dark:text-slate-100 mt-1 block">{selectedStudent.school}</strong>
                  </div>
                )}
                {selectedStudent.address && (
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-[10px] text-slate-400 font-bold block">{translate('address')}</span>
                    <strong className="text-slate-800 dark:text-slate-100 mt-1 block">{selectedStudent.address}</strong>
                  </div>
                )}
              </div>

              {/* Awards list */}
              {selectedStudent.awards && selectedStudent.awards.length > 0 && (
                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 p-4 rounded-2xl flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-600 block">{translate('awards')}</span>
                    <p className="text-xs text-slate-700 dark:text-slate-200">{selectedStudent.awards.join(' • ')}</p>
                  </div>
                </div>
              )}

              {/* Achievements list */}
              {selectedStudent.achievements && selectedStudent.achievements.length > 0 && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 p-4 rounded-2xl flex items-start gap-3">
                  <Award className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-600 block">{translate('achievements')}</span>
                    <p className="text-xs text-slate-700 dark:text-slate-200">{selectedStudent.achievements.join(' • ')}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedStudent.notes && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">{translate('notes')}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">"{selectedStudent.notes}"</p>
                </div>
              )}

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* ID Badge Preview inside modal */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 justify-center">
                  <span>📇</span>
                  <span>{lang === 'ar' ? 'معاينة بطاقة الطالب الذكية للكارنيه' : 'Smart Badge Card Preview'}</span>
                </h4>
                
                <div className="flex justify-center bg-slate-50 dark:bg-slate-950 p-6 border border-slate-200 dark:border-slate-850 rounded-2xl">
                  {/* Badge UI */}
                  <div className="w-80 h-[480px] bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl border-[4px] border-white dark:border-slate-800 flex flex-col justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none opacity-20" />
                    
                    {/* Header */}
                    <div className="w-full flex justify-between items-center z-10 border-b border-white/20 pb-2">
                      <span className="text-xs font-black tracking-tight">{db.siteSettings.centerNameAr}</span>
                      <span className="text-[10px] font-mono tracking-widest uppercase opacity-85">STUDENT CARD</span>
                    </div>

                    {/* Portrait Photo */}
                    <div className="flex flex-col items-center gap-3 z-10 mt-3 text-center">
                      <img 
                        src={selectedStudent.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'} 
                        alt="Badge portrait" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md shadow-black/10"
                      />
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm leading-tight text-white">{selectedStudent.name}</h4>
                        <span className="text-[10px] bg-white text-blue-900 font-extrabold px-3 py-0.5 rounded-full inline-block">
                          {selectedStudent.academicLevel}
                        </span>
                      </div>

                      {/* Card fields */}
                      <div className="w-full text-[10.5px] opacity-90 text-right space-y-1 border-t border-dashed border-white/20 pt-3 mt-2 min-w-[240px]">
                        <div className="flex justify-between"><strong>ID:</strong> <span className="font-mono">{selectedStudent.id}</span></div>
                        <div className="flex justify-between"><strong>Group:</strong> <span className="font-bold">{db.groups.find(g => g.id === selectedStudent.groupId)?.nameEn || '-'}</span></div>
                        <div className="flex justify-between"><strong>Phone:</strong> <span className="font-mono">{selectedStudent.studentPhone || selectedStudent.fatherPhone || '-'}</span></div>
                        <div className="flex justify-between"><strong>Barcode:</strong> <span className="font-mono">{selectedStudent.barcode}</span></div>
                      </div>

                      {/* Barcode image representation */}
                      <div className="bg-white p-1.5 rounded-lg flex items-center justify-center mt-3 shadow-md w-24 h-24">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(selectedStudent.id)}`} 
                          alt="QR Code" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="w-full flex justify-between items-center text-[10px] border-t border-white/20 pt-2.5 z-10 shrink-0 opacity-80">
                      <span>{db.siteSettings.teacherName}</span>
                      <span>📞 {db.siteSettings.teacherPhone}</span>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    handleEditStudent(selectedStudent);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
                >
                  {translate('editStudent')}
                </button>
                <button
                  onClick={() => handleDeleteStudent(selectedStudent.id)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 font-bold rounded-xl text-xs transition-all"
                >
                  {translate('deleteStudent')}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintCard(selectedStudent)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'طباعة الكارنيه' : 'Print Card'}</span>
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
