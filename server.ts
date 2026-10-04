import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize GoogleGenAI SDK with telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface CohortData {
  id: string;
  name: string;
  codePrefix: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  meetingLinkDefault?: string;
}

interface ClassSessionData {
  id: string;
  cohortId: string;
  title: string;
  instructorName: string;
  date: string;
  time: string;
  code: string; // Secret word or phrase typed by admin
  isAttendanceOpen: boolean;
  attendanceWindowMinutes?: number;
  meetingUrl?: string;
  notes?: string;
  createdAt: string;
}

interface AttendanceRecordData {
  id: string;
  classId: string;
  cohortId: string;
  studentEmail: string;
  studentName: string;
  studentPhone?: string;
  status: 'present' | 'late' | 'excused' | 'absent';
  markedAt: string;
  classCodeUsed: string;
  feedback?: string;
}

interface StudentData {
  id: string;
  cohortId: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'at_risk' | 'graduated' | 'inactive';
  registeredAt: string;
  notes?: string;
}

interface EmailCampaignData {
  id: string;
  title: string;
  subject: string;
  templateBody: string;
  targetCohortId: string;
  sentAt: string;
  recipientCount: number;
  successCount: number;
  failedCount: number;
  logs: {
    recipientName: string;
    recipientEmail: string;
    status: 'delivered' | 'sent' | 'bounced';
    renderedSubject: string;
    renderedBody: string;
    timestamp: string;
  }[];
}

// Generate exactly 55 realistic cohort members for Dream Team Project Cohort 2
const preloaded55Cohort2Members: StudentData[] = [
  { id: 'stu-01', cohortId: 'dtp-cohort-2', name: 'Emmanuel Adeyemi', email: 'emmanuel.adeyemi@dreamteam.org', phone: '+234 803 123 4567', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-02', cohortId: 'dtp-cohort-2', name: 'Chioma Okafor', email: 'chioma.okafor@dreamteam.org', phone: '+234 812 987 6543', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-03', cohortId: 'dtp-cohort-2', name: 'Babajide Fashola', email: 'babajide.fashola@dreamteam.org', phone: '+234 701 456 7890', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-04', cohortId: 'dtp-cohort-2', name: 'Amina Bello', email: 'amina.bello@dreamteam.org', phone: '+234 809 333 2211', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-05', cohortId: 'dtp-cohort-2', name: 'David Nwachukwu', email: 'david.nwachukwu@dreamteam.org', phone: '+234 815 444 8899', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-06', cohortId: 'dtp-cohort-2', name: 'Blessing Udoh', email: 'blessing.udoh@dreamteam.org', phone: '+234 902 777 6655', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-07', cohortId: 'dtp-cohort-2', name: 'Tunde Bakare', email: 'tunde.bakare@dreamteam.org', phone: '+234 805 111 4433', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-08', cohortId: 'dtp-cohort-2', name: 'Zainab Ibrahim', email: 'zainab.ibrahim@dreamteam.org', phone: '+234 703 666 9900', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-09', cohortId: 'dtp-cohort-2', name: 'Oluwaseun Balogun', email: 'oluwaseun.balogun@dreamteam.org', phone: '+234 813 555 1234', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-10', cohortId: 'dtp-cohort-2', name: 'Fatima Abubakar', email: 'fatima.abubakar@dreamteam.org', phone: '+234 802 888 7766', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-11', cohortId: 'dtp-cohort-2', name: 'Kelechi Eze', email: 'kelechi.eze@dreamteam.org', phone: '+234 708 999 0011', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-12', cohortId: 'dtp-cohort-2', name: 'Ngozi Chukwu', email: 'ngozi.chukwu@dreamteam.org', phone: '+234 814 111 2233', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-13', cohortId: 'dtp-cohort-2', name: 'Samuel Olawale', email: 'samuel.olawale@dreamteam.org', phone: '+234 901 222 3344', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-14', cohortId: 'dtp-cohort-2', name: 'Aisha Mohammed', email: 'aisha.mohammed@dreamteam.org', phone: '+234 806 333 4455', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-15', cohortId: 'dtp-cohort-2', name: 'Victor Danjuma', email: 'victor.danjuma@dreamteam.org', phone: '+234 818 444 5566', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-16', cohortId: 'dtp-cohort-2', name: 'Grace Bassey', email: 'grace.bassey@dreamteam.org', phone: '+234 705 555 6677', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-17', cohortId: 'dtp-cohort-2', name: 'Ibrahim Sani', email: 'ibrahim.sani@dreamteam.org', phone: '+234 807 666 7788', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-18', cohortId: 'dtp-cohort-2', name: 'Temitope Adeleke', email: 'temitope.adeleke@dreamteam.org', phone: '+234 816 777 8899', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-19', cohortId: 'dtp-cohort-2', name: 'Chidiebere Onyeka', email: 'chidiebere.onyeka@dreamteam.org', phone: '+234 903 888 9900', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-20', cohortId: 'dtp-cohort-2', name: 'Halima Yusuf', email: 'halima.yusuf@dreamteam.org', phone: '+234 803 999 1122', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-21', cohortId: 'dtp-cohort-2', name: 'Peter Oghenekaro', email: 'peter.oghenekaro@dreamteam.org', phone: '+234 812 000 2233', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-22', cohortId: 'dtp-cohort-2', name: 'Mary Anozie', email: 'mary.anozie@dreamteam.org', phone: '+234 701 111 3344', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-23', cohortId: 'dtp-cohort-2', name: 'Abubakar Garba', email: 'abubakar.garba@dreamteam.org', phone: '+234 809 222 4455', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-24', cohortId: 'dtp-cohort-2', name: 'Esther Akpan', email: 'esther.akpan@dreamteam.org', phone: '+234 815 333 5566', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-25', cohortId: 'dtp-cohort-2', name: 'Daniel Oladipo', email: 'daniel.oladipo@dreamteam.org', phone: '+234 902 444 6677', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-26', cohortId: 'dtp-cohort-2', name: 'Khadijah Aliyu', email: 'khadijah.aliyu@dreamteam.org', phone: '+234 805 555 7788', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-27', cohortId: 'dtp-cohort-2', name: 'Ifeanyi Okoro', email: 'ifeanyi.okoro@dreamteam.org', phone: '+234 703 666 8899', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-28', cohortId: 'dtp-cohort-2', name: 'Precious Johnson', email: 'precious.johnson@dreamteam.org', phone: '+234 813 777 9900', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-29', cohortId: 'dtp-cohort-2', name: 'Usman Balarabe', email: 'usman.balarabe@dreamteam.org', phone: '+234 802 888 0011', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-30', cohortId: 'dtp-cohort-2', name: 'Yetunde Ajayi', email: 'yetunde.ajayi@dreamteam.org', phone: '+234 708 999 1122', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-31', cohortId: 'dtp-cohort-2', name: 'Chinedu Amadi', email: 'chinedu.amadi@dreamteam.org', phone: '+234 814 000 2233', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-32', cohortId: 'dtp-cohort-2', name: 'Rukayat Lawal', email: 'rukayat.lawal@dreamteam.org', phone: '+234 901 111 3344', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-33', cohortId: 'dtp-cohort-2', name: 'Joshua Babatunde', email: 'joshua.babatunde@dreamteam.org', phone: '+234 806 222 4455', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-34', cohortId: 'dtp-cohort-2', name: 'Joy Kenneth', email: 'joy.kenneth@dreamteam.org', phone: '+234 818 333 5566', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-35', cohortId: 'dtp-cohort-2', name: 'Mustapha Kabir', email: 'mustapha.kabir@dreamteam.org', phone: '+234 705 444 6677', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-36', cohortId: 'dtp-cohort-2', name: 'Bukola Shonibare', email: 'bukola.shonibare@dreamteam.org', phone: '+234 807 555 7788', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-37', cohortId: 'dtp-cohort-2', name: 'Nonso Obinna', email: 'nonso.obinna@dreamteam.org', phone: '+234 816 666 8899', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-38', cohortId: 'dtp-cohort-2', name: 'Hauwa Umar', email: 'hauwa.umar@dreamteam.org', phone: '+234 903 777 9900', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-39', cohortId: 'dtp-cohort-2', name: 'Gabriel Effiong', email: 'gabriel.effiong@dreamteam.org', phone: '+234 803 888 1122', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-40', cohortId: 'dtp-cohort-2', name: 'Deborah Martins', email: 'deborah.martins@dreamteam.org', phone: '+234 812 999 2233', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-41', cohortId: 'dtp-cohort-2', name: 'Aliyu Shehu', email: 'aliyu.shehu@dreamteam.org', phone: '+234 701 000 3344', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-42', cohortId: 'dtp-cohort-2', name: 'Folashade Ojo', email: 'folashade.ojo@dreamteam.org', phone: '+234 809 111 4455', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-43', cohortId: 'dtp-cohort-2', name: 'Emeka Umeh', email: 'emeka.umeh@dreamteam.org', phone: '+234 815 222 5566', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-44', cohortId: 'dtp-cohort-2', name: 'Bilikisu Suleiman', email: 'bilikisu.suleiman@dreamteam.org', phone: '+234 902 333 6677', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-45', cohortId: 'dtp-cohort-2', name: 'Segun Ogundipe', email: 'segun.ogundipe@dreamteam.org', phone: '+234 805 444 7788', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-46', cohortId: 'dtp-cohort-2', name: 'Miracle Igwe', email: 'miracle.igwe@dreamteam.org', phone: '+234 703 555 8899', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-47', cohortId: 'dtp-cohort-2', name: 'Yahaya Abdullahi', email: 'yahaya.abdullahi@dreamteam.org', phone: '+234 813 666 9900', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-48', cohortId: 'dtp-cohort-2', name: 'Abimbola Davies', email: 'abimbola.davies@dreamteam.org', phone: '+234 802 777 0011', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-49', cohortId: 'dtp-cohort-2', name: 'Stanley Nnamdi', email: 'stanley.nnamdi@dreamteam.org', phone: '+234 708 888 1122', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-50', cohortId: 'dtp-cohort-2', name: 'Salma Haruna', email: 'salma.haruna@dreamteam.org', phone: '+234 814 999 2233', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-51', cohortId: 'dtp-cohort-2', name: 'Godwin Ekpenyong', email: 'godwin.ekpenyong@dreamteam.org', phone: '+234 901 000 3344', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-52', cohortId: 'dtp-cohort-2', name: 'Eniola Williams', email: 'eniola.williams@dreamteam.org', phone: '+234 806 111 4455', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-53', cohortId: 'dtp-cohort-2', name: 'Chibuike Nwosu', email: 'chibuike.nwosu@dreamteam.org', phone: '+234 818 222 5566', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-54', cohortId: 'dtp-cohort-2', name: 'Safiya Bello', email: 'safiya.bello@dreamteam.org', phone: '+234 705 333 6677', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-55', cohortId: 'dtp-cohort-2', name: 'Ogunbade Kehinde', email: 'ogungbadekehinde19@gmail.com', phone: '+234 800 123 4567', status: 'active', registeredAt: '2026-09-01' },
];

// Database state
const db = {
  cohorts: [
    {
      id: 'dtp-cohort-2',
      name: 'Dream Team Project - Cohort 2',
      codePrefix: 'DTP2',
      description: 'The flagship talent accelerator powering tech excellence, innovation, and leadership.',
      startDate: '2026-09-01',
      endDate: '2026-12-15',
      isActive: true,
      meetingLinkDefault: 'https://meet.google.com/dtp-cohort2-live',
    },
    {
      id: 'dtp-cohort-3',
      name: 'Dream Team Project - Cohort 3',
      codePrefix: 'DTP3',
      description: 'Upcoming Cohort 3 launching next term.',
      startDate: '2027-01-15',
      endDate: '2027-04-30',
      isActive: false,
      meetingLinkDefault: 'https://meet.google.com/dtp-cohort3-live',
    },
  ] as CohortData[],

  classes: [
    {
      id: 'cls-201',
      cohortId: 'dtp-cohort-2',
      title: 'Tuesday Live Session: Modern Architecture & APIs',
      instructorName: 'Engr. Kehinde Ogungbade',
      date: '2026-10-06',
      time: '18:00 - 20:30 WAT',
      code: 'CATALYST', // Custom word created by admin!
      isAttendanceOpen: true,
      attendanceWindowMinutes: 120,
      meetingUrl: 'https://meet.google.com/dtp-cohort2-live',
      notes: 'Secret class attendance code for today: CATALYST',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cls-202',
      cohortId: 'dtp-cohort-2',
      title: 'Saturday Masterclass: High Performance Systems',
      instructorName: 'Lead Facilitator Alex',
      date: '2026-10-03',
      time: '10:00 - 13:00 WAT',
      code: 'VELOCITY', // Secret word
      isAttendanceOpen: true,
      attendanceWindowMinutes: 180,
      meetingUrl: 'https://meet.google.com/dtp-cohort2-live',
      notes: 'Secret class attendance code: VELOCITY',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'cls-200',
      cohortId: 'dtp-cohort-2',
      title: 'Cohort 2 Kickoff & Orientation',
      instructorName: 'Dream Team Leadership',
      date: '2026-09-08',
      time: '17:00 - 19:00 WAT',
      code: 'HORIZON',
      isAttendanceOpen: false,
      attendanceWindowMinutes: 90,
      meetingUrl: 'https://meet.google.com/dtp-cohort2-live',
      notes: 'Orientation code was HORIZON',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ] as ClassSessionData[],

  students: preloaded55Cohort2Members,

  attendance: [
    {
      id: 'att-200-01',
      classId: 'cls-200',
      cohortId: 'dtp-cohort-2',
      studentEmail: 'ogungbadekehinde19@gmail.com',
      studentName: 'Ogunbade Kehinde',
      studentPhone: '+234 800 123 4567',
      status: 'present',
      markedAt: '2026-09-08T17:04:10.000Z',
      classCodeUsed: 'HORIZON',
      feedback: 'Great kickoff orientation!',
    },
    {
      id: 'att-200-02',
      classId: 'cls-200',
      cohortId: 'dtp-cohort-2',
      studentEmail: 'emmanuel.adeyemi@dreamteam.org',
      studentName: 'Emmanuel Adeyemi',
      studentPhone: '+234 803 123 4567',
      status: 'present',
      markedAt: '2026-09-08T17:05:22.000Z',
      classCodeUsed: 'HORIZON',
    },
    {
      id: 'att-200-03',
      classId: 'cls-200',
      cohortId: 'dtp-cohort-2',
      studentEmail: 'chioma.okafor@dreamteam.org',
      studentName: 'Chioma Okafor',
      studentPhone: '+234 812 987 6543',
      status: 'present',
      markedAt: '2026-09-08T17:06:45.000Z',
      classCodeUsed: 'HORIZON',
    },
  ] as AttendanceRecordData[],

  campaigns: [] as EmailCampaignData[],
};

// ---------------- API ROUTES ---------------- //

// 1. Cohorts
app.get('/api/cohorts', (req: Request, res: Response) => {
  res.json({ success: true, cohorts: db.cohorts });
});

app.post('/api/cohorts', (req: Request, res: Response) => {
  const { name, codePrefix, description, startDate, endDate, meetingLinkDefault } = req.body;
  if (!name || !codePrefix) {
    return res.status(400).json({ error: 'Cohort name and code prefix are required' });
  }
  const newCohort: CohortData = {
    id: `cohort-${Date.now()}`,
    name,
    codePrefix: codePrefix.toUpperCase().trim(),
    description: description || '',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || '',
    isActive: true,
    meetingLinkDefault: meetingLinkDefault || '',
  };
  db.cohorts.push(newCohort);
  res.json({ success: true, cohort: newCohort });
});

// 2. Student Lookup by Email (Instant profile identification on typing/Google login)
app.post('/api/students/lookup', (req: Request, res: Response) => {
  const { email, cohortId } = req.body;
  if (!email) {
    return res.status(400).json({ found: false, message: 'Please provide an email address.' });
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const student = db.students.find(s => s.email.toLowerCase() === cleanEmail && (!cohortId || s.cohortId === cohortId))
    || db.students.find(s => s.email.toLowerCase() === cleanEmail);

  if (!student) {
    return res.status(404).json({
      found: false,
      message: 'This email is not registered in the cohort roster. Only enrolled students can mark attendance.',
    });
  }

  // Get student's attendance history
  const studentRecords = db.attendance.filter(a => a.studentEmail.toLowerCase() === cleanEmail);
  const cohortClasses = db.classes.filter(c => c.cohortId === student.cohortId);

  const history = studentRecords.map(rec => {
    const cls = db.classes.find(c => c.id === rec.classId);
    return {
      record: rec,
      classTitle: cls?.title || 'Class Session',
      date: cls?.date || 'N/A',
    };
  });

  const totalCohortClasses = cohortClasses.length;
  const totalAttended = studentRecords.length;
  const attendanceRate = totalCohortClasses > 0 ? Math.round((totalAttended / totalCohortClasses) * 100) : 100;

  res.json({
    found: true,
    student,
    attendanceHistory: history,
    totalAttended,
    totalCohortClasses,
    attendanceRate,
  });
});

// 3. Classes Management (Admin sets custom word code e.g. "CATALYST")
app.get('/api/classes', (req: Request, res: Response) => {
  const cohortId = req.query.cohortId as string;
  let classes = db.classes;
  if (cohortId) {
    classes = classes.filter(c => c.cohortId === cohortId);
  }
  classes = [...classes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json({ success: true, classes });
});

app.post('/api/classes', (req: Request, res: Response) => {
  const { cohortId, title, instructorName, date, time, code, attendanceWindowMinutes, meetingUrl, notes } = req.body;
  if (!cohortId || !title || !date) {
    return res.status(400).json({ error: 'Cohort, Title, and Date are required.' });
  }

  // Admin provides custom word or fallback
  const finalCode = (code && code.trim()) 
    ? code.trim().toUpperCase() 
    : `DREAM-${Math.floor(100 + Math.random() * 900)}`;

  const newClass: ClassSessionData = {
    id: `cls-${Date.now()}`,
    cohortId,
    title,
    instructorName: instructorName || 'Admin / Facilitator',
    date,
    time: time || '18:00 - 20:30 WAT',
    code: finalCode,
    isAttendanceOpen: true,
    attendanceWindowMinutes: Number(attendanceWindowMinutes) || 120,
    meetingUrl: meetingUrl || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  db.classes.unshift(newClass);
  res.json({ success: true, classSession: newClass });
});

app.patch('/api/classes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.classes.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Class not found' });
  
  if (req.body.code) {
    req.body.code = req.body.code.trim().toUpperCase();
  }
  db.classes[index] = { ...db.classes[index], ...req.body };
  res.json({ success: true, classSession: db.classes[index] });
});

app.patch('/api/classes/:id/toggle-attendance', (req: Request, res: Response) => {
  const { id } = req.params;
  const targetClass = db.classes.find(c => c.id === id);
  if (!targetClass) return res.status(404).json({ error: 'Class not found' });
  targetClass.isAttendanceOpen = req.body.isOpen !== undefined ? req.body.isOpen : !targetClass.isAttendanceOpen;
  res.json({ success: true, classSession: targetClass });
});

// 4. Attendance Verification & Marking
app.post('/api/attendance/verify-code', (req: Request, res: Response) => {
  const { code, studentEmail } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: 'Please enter the attendance code.' });
  }

  const cleanCode = String(code).trim().toUpperCase();
  const classSession = db.classes.find(c => c.code.trim().toUpperCase() === cleanCode);

  if (!classSession) {
    return res.status(404).json({ 
      valid: false, 
      message: 'Invalid attendance word/code. Please check the code provided by the administrator during class.' 
    });
  }

  const cohort = db.cohorts.find(c => c.id === classSession.cohortId);

  let alreadyMarked = false;
  let markedRecord: AttendanceRecordData | undefined;
  let matchedStudent: StudentData | undefined;

  if (studentEmail) {
    const cleanEmail = String(studentEmail).toLowerCase().trim();
    matchedStudent = db.students.find(s => s.email.toLowerCase() === cleanEmail);
    markedRecord = db.attendance.find(a => 
      a.classId === classSession.id && a.studentEmail.toLowerCase() === cleanEmail
    );
    if (markedRecord) alreadyMarked = true;
  }

  res.json({
    valid: true,
    classSession,
    cohort,
    alreadyMarked,
    markedRecord,
    matchedStudent,
    isAttendanceOpen: classSession.isAttendanceOpen,
  });
});

app.post('/api/attendance/mark', (req: Request, res: Response) => {
  const { code, studentEmail, studentName, studentPhone, feedback } = req.body;

  if (!code || !studentEmail) {
    return res.status(400).json({ error: 'Attendance code and registered student email are required.' });
  }

  const cleanCode = String(code).trim().toUpperCase();
  const cleanEmail = String(studentEmail).toLowerCase().trim();

  // Find class by code
  const classSession = db.classes.find(c => c.code.trim().toUpperCase() === cleanCode);
  if (!classSession) {
    return res.status(404).json({ error: 'Invalid attendance word/code.' });
  }

  if (!classSession.isAttendanceOpen) {
    return res.status(400).json({ 
      error: 'Attendance window for this class is currently closed by the administrator.' 
    });
  }

  // Ensure student exists in cohort roster
  let student = db.students.find(s => s.email.toLowerCase() === cleanEmail);
  if (!student) {
    return res.status(403).json({
      error: 'Your email is not on the registered cohort list. Please contact the administrator.',
    });
  }

  // Check duplicate
  const existing = db.attendance.find(a => 
    a.classId === classSession.id && a.studentEmail.toLowerCase() === cleanEmail
  );

  if (existing) {
    return res.status(409).json({ 
      error: `You have already marked your attendance for today's class on ${new Date(existing.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      record: existing,
    });
  }

  const newRecord: AttendanceRecordData = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    classId: classSession.id,
    cohortId: classSession.cohortId,
    studentEmail: cleanEmail,
    studentName: student.name || studentName || 'Participant',
    studentPhone: student.phone || studentPhone || '',
    status: 'present',
    markedAt: new Date().toISOString(),
    classCodeUsed: cleanCode,
    feedback: feedback || '',
  };

  db.attendance.push(newRecord);

  const studentTotalAttended = db.attendance.filter(a => a.studentEmail.toLowerCase() === cleanEmail).length;
  const cohortTotalClasses = db.classes.filter(c => c.cohortId === classSession.cohortId).length;

  res.json({
    success: true,
    message: "You've marked your attendance for today's class!",
    record: newRecord,
    classSession,
    studentStats: {
      totalAttended: studentTotalAttended,
      totalCohortClasses: cohortTotalClasses,
      attendanceRate: Math.round((studentTotalAttended / (cohortTotalClasses || 1)) * 100),
    },
  });
});

app.get('/api/attendance/class/:classId', (req: Request, res: Response) => {
  const { classId } = req.params;
  const records = db.attendance.filter(a => a.classId === classId);
  res.json({ success: true, records, count: records.length });
});

app.post('/api/attendance/manual-update', (req: Request, res: Response) => {
  const { classId, studentEmail, studentName, status } = req.body;
  if (!classId || !studentEmail) {
    return res.status(400).json({ error: 'classId and studentEmail are required' });
  }
  const cleanEmail = studentEmail.toLowerCase().trim();
  const existingIndex = db.attendance.findIndex(a => a.classId === classId && a.studentEmail.toLowerCase() === cleanEmail);

  if (existingIndex >= 0) {
    if (status === 'absent') {
      db.attendance.splice(existingIndex, 1);
      return res.json({ success: true, message: 'Marked Absent' });
    } else {
      db.attendance[existingIndex].status = status;
      return res.json({ success: true, record: db.attendance[existingIndex] });
    }
  } else {
    if (status === 'absent') return res.json({ success: true, message: 'Already absent' });
    const classSession = db.classes.find(c => c.id === classId);
    const newRecord: AttendanceRecordData = {
      id: `att-${Date.now()}`,
      classId,
      cohortId: classSession?.cohortId || 'dtp-cohort-2',
      studentEmail: cleanEmail,
      studentName: studentName || 'Participant',
      status: status || 'present',
      markedAt: new Date().toISOString(),
      classCodeUsed: classSession?.code || 'MANUAL-ADMIN',
    };
    db.attendance.push(newRecord);
    return res.json({ success: true, record: newRecord });
  }
});

// 5. Students Management (55+ preloaded and bulk imports)
app.get('/api/students', (req: Request, res: Response) => {
  const cohortId = req.query.cohortId as string;
  let students = db.students;
  if (cohortId) {
    students = students.filter(s => s.cohortId === cohortId);
  }

  const studentsWithStats = students.map(student => {
    const studentRecords = db.attendance.filter(a => a.studentEmail.toLowerCase() === student.email.toLowerCase());
    const cohortClasses = db.classes.filter(c => c.cohortId === student.cohortId);
    const attendanceCount = studentRecords.length;
    const totalClasses = cohortClasses.length;
    const rate = totalClasses > 0 ? Math.round((attendanceCount / totalClasses) * 100) : 100;

    return {
      ...student,
      attendanceCount,
      totalClasses,
      attendanceRate: rate,
      lastAttended: studentRecords.length > 0 
        ? studentRecords.sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime())[0].markedAt 
        : null,
    };
  });

  res.json({ success: true, students: studentsWithStats, count: studentsWithStats.length });
});

app.post('/api/students', (req: Request, res: Response) => {
  const { name, email, phone, cohortId, notes } = req.body;
  if (!name || !email || !cohortId) {
    return res.status(400).json({ error: 'Name, email, and cohort are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = db.students.find(s => s.email.toLowerCase() === cleanEmail && s.cohortId === cohortId);
  if (existing) {
    return res.status(409).json({ error: 'Student with this email already exists in this cohort.' });
  }

  const newStudent: StudentData = {
    id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    cohortId,
    name: name.trim(),
    email: cleanEmail,
    phone: phone?.trim() || '',
    status: 'active',
    registeredAt: new Date().toISOString().split('T')[0],
    notes: notes || '',
  };

  db.students.push(newStudent);
  res.json({ success: true, student: newStudent });
});

app.post('/api/students/bulk-import', (req: Request, res: Response) => {
  const { cohortId, students } = req.body;
  if (!cohortId || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'Valid cohortId and array of students are required.' });
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const s of students) {
    if (!s.email || !s.name) continue;
    const cleanEmail = String(s.email).toLowerCase().trim();
    const cleanName = String(s.name).trim();
    const cleanPhone = s.phone ? String(s.phone).trim() : '';

    const existingIndex = db.students.findIndex(x => x.email.toLowerCase() === cleanEmail && x.cohortId === cohortId);
    if (existingIndex >= 0) {
      db.students[existingIndex].name = cleanName;
      if (cleanPhone) db.students[existingIndex].phone = cleanPhone;
      updatedCount++;
    } else {
      db.students.push({
        id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        cohortId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        status: 'active',
        registeredAt: new Date().toISOString().split('T')[0],
        notes: s.notes || 'Imported via upload',
      });
      addedCount++;
    }
  }

  res.json({ 
    success: true, 
    message: `Roster updated: ${addedCount} new members added, ${updatedCount} updated. Total cohort roster is now ${db.students.filter(s => s.cohortId === cohortId).length} members.`,
    addedCount,
    updatedCount,
    totalCohortStudents: db.students.filter(s => s.cohortId === cohortId).length
  });
});

app.delete('/api/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Student not found' });
  const removed = db.students.splice(index, 1)[0];
  res.json({ success: true, removed });
});

// 6. Stats
app.get('/api/stats', (req: Request, res: Response) => {
  const cohortId = req.query.cohortId as string;
  let filteredClasses = db.classes;
  let filteredStudents = db.students;
  let filteredAttendance = db.attendance;

  if (cohortId) {
    filteredClasses = filteredClasses.filter(c => c.cohortId === cohortId);
    filteredStudents = filteredStudents.filter(s => s.cohortId === cohortId);
    filteredAttendance = filteredAttendance.filter(a => a.cohortId === cohortId);
  }

  const totalClasses = filteredClasses.length;
  const totalStudents = filteredStudents.length;
  const totalCheckIns = filteredAttendance.length;

  res.json({
    success: true,
    stats: {
      totalCohorts: db.cohorts.length,
      totalClasses,
      totalStudents,
      totalCheckIns,
      activeClass: filteredClasses.find(c => c.isAttendanceOpen),
    },
  });
});

// 7. AI Email Generator with Gemini 3.8 Flash
app.post('/api/ai/draft-email', async (req: Request, res: Response) => {
  try {
    const { purpose, tone, customInstructions, cohortName, classTitle, classCode } = req.body;

    const prompt = `You are the lead communications AI for "Dream Team Project", an elite talent accelerator.
Write a vibrant, high-energy, motivational email template to send to cohort participants.

PURPOSE: ${purpose || 'Announce upcoming class and provide attendance secret code instructions'}
TONE: ${tone || 'Vibrant, inspiring, and urgent'}
TARGET COHORT: ${cohortName || 'Dream Team Project Cohort 2'}
CLASS TITLE: ${classTitle || 'Tuesday Tech Masterclass'}
ATTENDANCE CODE (Secret word): ${classCode || 'CATALYST'}
CUSTOM INSTRUCTIONS: ${customInstructions || 'None'}

MERGE TAGS:
Use merge tags like:
- {name} for the recipient's full name
- {email} for email
- {phone} for phone number
- {cohort} for cohort name
- {class_title} for class title
- {class_code} for secret class attendance word

Return your response strictly in JSON format with two keys:
1. "subject": A punchy, inspiring subject line with {name} placeholder.
2. "body": The full email body formatted with clear paragraphs, emojis, and {name} placeholders.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      subject: parsed.subject || 'Class Attendance & Update for {name} | Dream Team Project',
      body: parsed.body || `Hello {name},\n\nGet ready for today's class "{class_title}"!\n\n🔑 Today's Secret Attendance Code: {class_code}\n\nGo to the portal, log in with your email {email}, and mark your attendance.\n\nDream Team Project`,
    });
  } catch (error: any) {
    console.error('Gemini AI email draft error:', error);
    res.status(500).json({
      error: 'Failed to generate email with AI',
      fallbackSubject: 'Today\'s Class Secret Attendance Code for {name} 🚀',
      fallbackBody: `Hello {name},\n\nHere is your update for today's class "{class_title}".\n\n🔑 Secret Attendance Code: {class_code}\n\nPlease log in to the attendance portal with your registered email to mark your attendance!\n\nBest regards,\nDream Team Project`,
    });
  }
});

// 8. Email Broadcast Dispatch
app.post('/api/email/send-broadcast', (req: Request, res: Response) => {
  const { title, subject, templateBody, targetCohortId, recipients, classTitle, classCode } = req.body;

  if (!subject || !templateBody || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Subject, body, and recipients are required.' });
  }

  const cohort = db.cohorts.find(c => c.id === targetCohortId) || db.cohorts[0];
  const logs: EmailCampaignData['logs'] = [];
  let successCount = 0;

  for (const r of recipients) {
    const name = r.name || 'Participant';
    const email = r.email;
    const phone = r.phone || '';

    const renderedSubject = subject
      .replace(/\{name\}/gi, name)
      .replace(/\{email\}/gi, email)
      .replace(/\{phone\}/gi, phone)
      .replace(/\{cohort\}/gi, cohort.name)
      .replace(/\{class_title\}/gi, classTitle || 'Class Session')
      .replace(/\{class_code\}/gi, classCode || 'CODE');

    const renderedBody = templateBody
      .replace(/\{name\}/gi, name)
      .replace(/\{email\}/gi, email)
      .replace(/\{phone\}/gi, phone)
      .replace(/\{cohort\}/gi, cohort.name)
      .replace(/\{class_title\}/gi, classTitle || 'Class Session')
      .replace(/\{class_code\}/gi, classCode || 'CODE');

    logs.push({
      recipientName: name,
      recipientEmail: email,
      status: 'delivered',
      renderedSubject,
      renderedBody,
      timestamp: new Date().toISOString(),
    });
    successCount++;
  }

  const newCampaign: EmailCampaignData = {
    id: `camp-${Date.now()}`,
    title: title || `Cohort Broadcast - ${new Date().toLocaleDateString()}`,
    subject,
    templateBody,
    targetCohortId: targetCohortId || cohort.id,
    sentAt: new Date().toISOString(),
    recipientCount: recipients.length,
    successCount,
    failedCount: 0,
    logs,
  };

  db.campaigns.unshift(newCampaign);

  res.json({
    success: true,
    message: `Broadcast delivered successfully to ${successCount} members!`,
    campaign: newCampaign,
  });
});

app.get('/api/email/campaigns', (req: Request, res: Response) => {
  res.json({ success: true, campaigns: db.campaigns });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Dream Team Project Attendance Server running on port ${PORT}`);
  });
}

startServer();
