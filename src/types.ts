export interface SystemSettings {
  language: 'ar' | 'en';
  theme: 'light' | 'dark';
  whatsappEnabled: boolean;
  whatsappApiKey: string;
  academicYear: string;
  attendanceBeep: boolean;
  notificationTypes: {
    attendance: boolean;
    absence: boolean;
    grades: boolean;
    payments: boolean;
    announcements: boolean;
  };
}

export interface SiteSettings {
  centerNameAr: string;
  centerNameEn: string;
  teacherName: string;
  teacherTitle: string;
  teacherBio: string;
  teacherPhone: string;
  teacherEmail: string;
  teacherAvatar?: string;
  academicYear?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
}

export interface Admin {
  id: string;
  name: string;
  username: string;
  password?: string;
  phone?: string;
  email?: string;
  active: boolean;
}

export interface Teacher {
  id: string;
  username: string;
  password?: string;
  nameEn: string;
  nameAr: string;
  subjectEn: string;
  subjectAr: string;
  phone: string;
  email: string;
  avatar?: string;
  introEn: string;
  introAr: string;
  active: boolean;
  groups: string[];
}

export interface Parent {
  id: string;
  username: string;
  password?: string;
  name: string;
  phone: string;
  email?: string;
  studentIds: string[];
  active: boolean;
  pendingApproval?: boolean;
}

export interface Group {
  id: string;
  nameAr: string;
  nameEn: string;
  level: string[]; // Academic levels this group serves
  subject: string;
  teacherId: string;
  maxStudents: number;
  timeSlot: string;
  fee: number;
  sessionCount: number;
}

export interface Student {
  id: string;
  barcode: string;
  name: string;
  dob?: string;
  gender: 'male' | 'female';
  school?: string;
  academicLevel: string;
  subject: string;
  groupId: string;
  sessionCount: number;
  subscriptionType: 'monthly' | 'per-session';
  monthlyFee: number;
  registrationDate: string;
  studentPhone?: string;
  fatherPhone?: string;
  motherPhone?: string;
  parentPhone?: string; // fallback matching legacy code
  address?: string;
  notes?: string;
  awards?: string[];
  achievements?: string[];
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  groupId: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'late';
  scanMethod: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  title: string;
  type: 'Quiz' | 'Homework' | 'Exam' | 'Assignment';
  totalMarks: number;
  score: number;
  date: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  studentId?: string;
  desc: string;
  time?: string;
}

export interface WhatsAppLog {
  id: string;
  studentId: string;
  recipient: string;
  type: string;
  message: string;
  date: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface ParentNotification {
  id: string;
  studentId: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface DatabaseState {
  settings: SystemSettings;
  siteSettings: SiteSettings;
  posts: Post[];
  admins: Admin[];
  teachers: Teacher[];
  parents: Parent[];
  groups: Group[];
  students: Student[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  transactions: Transaction[];
  whatsappLogs: WhatsAppLog[];
  parentNotifications?: ParentNotification[];
}

export interface UserSession {
  username: string;
  role: 'admin' | 'teacher' | 'parent';
  adminId?: string;
  studentId?: string; // first child ID for parents
}
