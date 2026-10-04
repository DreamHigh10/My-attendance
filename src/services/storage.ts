import { Cohort, ClassSession, AttendanceRecord, Student, EmailCampaign, ImportedFileLog } from '../types';

export const DEFAULT_55_STUDENTS: Student[] = [
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
  { id: 'stu-15', cohortId: 'dtp-cohort-2', name: 'Victor Okonkwo', email: 'victor.okonkwo@dreamteam.org', phone: '+234 817 666 7788', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-16', cohortId: 'dtp-cohort-2', name: 'Precious Alabi', email: 'precious.alabi@dreamteam.org', phone: '+234 705 888 9900', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-17', cohortId: 'dtp-cohort-2', name: 'Ibrahim Danjuma', email: 'ibrahim.danjuma@dreamteam.org', phone: '+234 808 123 7890', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-18', cohortId: 'dtp-cohort-2', name: 'Grace Bassey', email: 'grace.bassey@dreamteam.org', phone: '+234 818 456 1234', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-19', cohortId: 'dtp-cohort-2', name: 'Femi Oladipo', email: 'femi.oladipo@dreamteam.org', phone: '+234 909 654 3210', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-20', cohortId: 'dtp-cohort-2', name: 'Hadiza Sanusi', email: 'hadiza.sanusi@dreamteam.org', phone: '+234 702 333 4455', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-21', cohortId: 'dtp-cohort-2', name: 'Chinedu Obi', email: 'chinedu.obi@dreamteam.org', phone: '+234 811 777 8899', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-22', cohortId: 'dtp-cohort-2', name: 'Maryam Usman', email: 'maryam.usman@dreamteam.org', phone: '+234 804 999 1122', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-23', cohortId: 'dtp-cohort-2', name: 'Ayomide Adeleke', email: 'ayomide.adeleke@dreamteam.org', phone: '+234 816 222 3344', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-24', cohortId: 'dtp-cohort-2', name: 'Joy Kenneth', email: 'joy.kenneth@dreamteam.org', phone: '+234 704 555 6677', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-25', cohortId: 'dtp-cohort-2', name: 'Mustapha Garba', email: 'mustapha.garba@dreamteam.org', phone: '+234 903 888 9900', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-26', cohortId: 'dtp-cohort-2', name: 'Rita Nnamdi', email: 'rita.nnamdi@dreamteam.org', phone: '+234 807 111 2233', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-27', cohortId: 'dtp-cohort-2', name: 'Kayode Ajayi', email: 'kayode.ajayi@dreamteam.org', phone: '+234 810 444 5566', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-28', cohortId: 'dtp-cohort-2', name: 'Halima Yakubu', email: 'halima.yakubu@dreamteam.org', phone: '+234 706 777 8899', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-29', cohortId: 'dtp-cohort-2', name: 'Obinna Umeh', email: 'obinna.umeh@dreamteam.org', phone: '+234 905 000 1122', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-30', cohortId: 'dtp-cohort-2', name: 'Esther Peters', email: 'esther.peters@dreamteam.org', phone: '+234 809 222 3344', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-31', cohortId: 'dtp-cohort-2', name: 'Usman Shehu', email: 'usman.shehu@dreamteam.org', phone: '+234 813 666 7788', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-32', cohortId: 'dtp-cohort-2', name: 'Yetunde Williams', email: 'yetunde.williams@dreamteam.org', phone: '+234 708 888 9900', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-33', cohortId: 'dtp-cohort-2', name: 'Gabriel Kalu', email: 'gabriel.kalu@dreamteam.org', phone: '+234 907 123 4567', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-34', cohortId: 'dtp-cohort-2', name: 'Bilikisu Lawal', email: 'bilikisu.lawal@dreamteam.org', phone: '+234 802 456 7890', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-35', cohortId: 'dtp-cohort-2', name: 'Segun Ogundipe', email: 'segun.ogundipe@dreamteam.org', phone: '+234 815 789 0123', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-36', cohortId: 'dtp-cohort-2', name: 'Ifunanya Okeke', email: 'ifunanya.okeke@dreamteam.org', phone: '+234 701 999 8877', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-37', cohortId: 'dtp-cohort-2', name: 'Kabiru Idris', email: 'kabiru.idris@dreamteam.org', phone: '+234 808 333 4455', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-38', cohortId: 'dtp-cohort-2', name: 'Tolulope Afolabi', email: 'tolulope.afolabi@dreamteam.org', phone: '+234 812 555 6677', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-39', cohortId: 'dtp-cohort-2', name: 'Chukwuma Ani', email: 'chukwuma.ani@dreamteam.org', phone: '+234 902 111 2233', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-40', cohortId: 'dtp-cohort-2', name: 'Khadijah Gidado', email: 'khadijah.gidado@dreamteam.org', phone: '+234 703 444 5566', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-41', cohortId: 'dtp-cohort-2', name: 'Dapo Soyinka', email: 'dapo.soyinka@dreamteam.org', phone: '+234 805 777 8899', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-42', cohortId: 'dtp-cohort-2', name: 'Uchechi Nwosu', email: 'uchechi.nwosu@dreamteam.org', phone: '+234 814 000 1122', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-43', cohortId: 'dtp-cohort-2', name: 'Aliyu Balarabe', email: 'aliyu.balarabe@dreamteam.org', phone: '+234 901 333 4455', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-44', cohortId: 'dtp-cohort-2', name: 'Busayo Ogunleye', email: 'busayo.ogunleye@dreamteam.org', phone: '+234 705 666 7788', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-45', cohortId: 'dtp-cohort-2', name: 'Nonso Ikechukwu', email: 'nonso.ikechukwu@dreamteam.org', phone: '+234 818 999 0011', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-46', cohortId: 'dtp-cohort-2', name: 'Zubaida Tahir', email: 'zubaida.tahir@dreamteam.org', phone: '+234 803 222 3344', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-47', cohortId: 'dtp-cohort-2', name: 'Sunday Akpan', email: 'sunday.akpan@dreamteam.org', phone: '+234 816 555 6677', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-48', cohortId: 'dtp-cohort-2', name: 'Eniola Shonibare', email: 'eniola.shonibare@dreamteam.org', phone: '+234 908 888 9900', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-49', cohortId: 'dtp-cohort-2', name: 'Godwin Onyeka', email: 'godwin.onyeka@dreamteam.org', phone: '+234 709 111 2233', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-50', cohortId: 'dtp-cohort-2', name: 'Rabiya Dahiru', email: 'rabiya.dahiru@dreamteam.org', phone: '+234 807 444 5566', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-51', cohortId: 'dtp-cohort-2', name: 'Adewale Johnson', email: 'adewale.johnson@dreamteam.org', phone: '+234 811 000 1122', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-52', cohortId: 'dtp-cohort-2', name: 'Adaobi Mbah', email: 'adaobi.mbah@dreamteam.org', phone: '+234 904 333 4455', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-53', cohortId: 'dtp-cohort-2', name: 'Salisu Mukhtar', email: 'salisu.mukhtar@dreamteam.org', phone: '+234 707 666 7788', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-54', cohortId: 'dtp-cohort-2', name: 'Funmilayo Adesina', email: 'funmilayo.adesina@dreamteam.org', phone: '+234 819 999 0011', status: 'active', registeredAt: '2026-09-01' },
  { id: 'stu-55', cohortId: 'dtp-cohort-2', name: 'Chukwuebuka Madu', email: 'ebuka.madu@dreamteam.org', phone: '+234 801 222 3344', status: 'active', registeredAt: '2026-09-01' },
];

export const DEFAULT_COHORTS: Cohort[] = [
  {
    id: 'dtp-cohort-2',
    name: 'Dream Team Project: Cohort 2',
    codePrefix: 'DTP2',
    description: 'Premier leadership, engineering and high performance track (55 Enrolled)',
    startDate: '2026-09-01',
    endDate: '2026-12-15',
    isActive: true,
    meetingLinkDefault: 'https://meet.google.com/dtp-cohort2-live',
  },
  {
    id: 'dtp-cohort-1',
    name: 'Dream Team Project: Cohort 1 (Alumni)',
    codePrefix: 'DTP1',
    description: 'Inaugural cohort graduated with excellence',
    startDate: '2026-01-10',
    endDate: '2026-05-30',
    isActive: false,
    meetingLinkDefault: '',
  }
];

export const DEFAULT_CLASSES: ClassSession[] = [
  {
    id: 'cls-201',
    cohortId: 'dtp-cohort-2',
    title: 'Advanced System Architecture & Cloud Scale',
    instructorName: 'Engr. Kehinde Ogungbade',
    date: '2026-10-04',
    time: '18:00 - 20:00 WAT',
    code: 'CATALYST', // Live Secret Word
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
    code: 'VELOCITY',
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
];

export const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-200-01',
    classId: 'cls-200',
    cohortId: 'dtp-cohort-2',
    studentEmail: 'emmanuel.adeyemi@dreamteam.org',
    studentName: 'Emmanuel Adeyemi',
    studentPhone: '+234 803 123 4567',
    status: 'present',
    markedAt: '2026-09-08T17:05:12.000Z',
    classCodeUsed: 'HORIZON',
  },
  {
    id: 'att-200-02',
    classId: 'cls-200',
    cohortId: 'dtp-cohort-2',
    studentEmail: 'ogungbadekehinde19@gmail.com',
    studentName: 'Engr. Kehinde Ogungbade',
    studentPhone: '+234 800 000 0000',
    status: 'present',
    markedAt: '2026-09-08T17:02:10.000Z',
    classCodeUsed: 'HORIZON',
  },
];

export const DEFAULT_IMPORTED_FILES: ImportedFileLog[] = [
  {
    id: 'file-init-01',
    fileName: 'DreamTeam_Cohort2_Master_Roster_55.xlsx',
    fileSize: 45200,
    recordsCount: 55,
    cohortId: 'dtp-cohort-2',
    uploadedAt: '2026-09-01T09:00:00.000Z',
    uploadedBy: 'Engr. Kehinde Ogungbade',
    studentIds: DEFAULT_55_STUDENTS.map(s => s.id),
  }
];

interface PersistentSchema {
  cohorts: Cohort[];
  classes: ClassSession[];
  students: Student[];
  attendance: AttendanceRecord[];
  campaigns: EmailCampaign[];
  importedFiles: ImportedFileLog[];
  version: number;
}

const STORAGE_KEY = 'dtp_cloud_persistent_db_v2';

export class PersistentDataStore {
  private static instance: PersistentDataStore;
  private data: PersistentSchema;

  private constructor() {
    this.data = this.loadFromStorage();
  }

  public static getInstance(): PersistentDataStore {
    if (!PersistentDataStore.instance) {
      PersistentDataStore.instance = new PersistentDataStore();
    }
    return PersistentDataStore.instance;
  }

  private loadFromStorage(): PersistentSchema {
    if (typeof window === 'undefined') {
      return this.getDefaults();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure arrays exist
        return {
          cohorts: parsed.cohorts?.length ? parsed.cohorts : DEFAULT_COHORTS,
          classes: parsed.classes?.length ? parsed.classes : DEFAULT_CLASSES,
          students: parsed.students?.length ? parsed.students : DEFAULT_55_STUDENTS,
          attendance: parsed.attendance || DEFAULT_ATTENDANCE,
          campaigns: parsed.campaigns || [],
          importedFiles: parsed.importedFiles || DEFAULT_IMPORTED_FILES,
          version: parsed.version || 2,
        };
      }
    } catch (e) {
      console.warn('Persistent storage parse warning:', e);
    }

    const defaults = this.getDefaults();
    this.saveToStorage(defaults);
    return defaults;
  }

  private getDefaults(): PersistentSchema {
    return {
      cohorts: DEFAULT_COHORTS,
      classes: DEFAULT_CLASSES,
      students: DEFAULT_55_STUDENTS,
      attendance: DEFAULT_ATTENDANCE,
      campaigns: [],
      importedFiles: DEFAULT_IMPORTED_FILES,
      version: 2,
    };
  }

  private saveToStorage(data: PersistentSchema) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // --- Read Methods ---
  public getCohorts(): Cohort[] {
    return this.data.cohorts;
  }

  public getClasses(cohortId?: string): ClassSession[] {
    if (cohortId) {
      return this.data.classes.filter(c => c.cohortId === cohortId);
    }
    return this.data.classes;
  }

  public getStudents(cohortId?: string): Student[] {
    let students = this.data.students;
    if (cohortId) {
      students = students.filter(s => s.cohortId === cohortId);
    }

    const cohortClasses = this.data.classes.filter(c => !cohortId || c.cohortId === cohortId);
    const totalClasses = cohortClasses.length;

    return students.map(student => {
      const studentRecords = this.data.attendance.filter(a => a.studentEmail.toLowerCase() === student.email.toLowerCase());
      const attendanceCount = studentRecords.length;
      const rate = totalClasses > 0 ? Math.round((attendanceCount / totalClasses) * 100) : 100;
      return {
        ...student,
        attendanceCount,
        totalClasses,
        attendanceRate: rate,
      } as any;
    });
  }

  public getAttendance(classId?: string): AttendanceRecord[] {
    if (classId) {
      return this.data.attendance.filter(a => a.classId === classId);
    }
    return this.data.attendance;
  }

  public getImportedFiles(cohortId?: string): ImportedFileLog[] {
    if (cohortId) {
      return this.data.importedFiles.filter(f => f.cohortId === cohortId);
    }
    return this.data.importedFiles;
  }

  public getCampaigns(): EmailCampaign[] {
    return this.data.campaigns;
  }

  // --- Mutation Methods ---
  public addStudent(student: Partial<Student>): Student {
    const cleanEmail = String(student.email).toLowerCase().trim();
    const existingIndex = this.data.students.findIndex(s => s.email.toLowerCase() === cleanEmail && s.cohortId === student.cohortId);
    
    if (existingIndex >= 0) {
      throw new Error('Student with this email already exists in this cohort roster.');
    }

    const newStudent: Student = {
      id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      cohortId: student.cohortId || 'dtp-cohort-2',
      name: String(student.name).trim(),
      email: cleanEmail,
      phone: student.phone?.trim() || '',
      status: student.status || 'active',
      registeredAt: new Date().toISOString().split('T')[0],
      notes: student.notes || '',
    };

    this.data.students.push(newStudent);
    this.saveToStorage(this.data);
    return newStudent;
  }

  public bulkImportStudents(cohortId: string, incomingStudents: any[], meta?: { fileName?: string; fileSize?: number; uploadedBy?: string }): { addedCount: number; updatedCount: number; fileRecord: ImportedFileLog } {
    let addedCount = 0;
    let updatedCount = 0;
    const processedStudentIds: string[] = [];
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    for (const s of incomingStudents) {
      if (!s.email || !s.name) continue;
      const cleanEmail = String(s.email).toLowerCase().trim();
      const cleanName = String(s.name).trim();
      const cleanPhone = s.phone ? String(s.phone).trim() : '';

      const existingIndex = this.data.students.findIndex(x => x.email.toLowerCase() === cleanEmail && x.cohortId === cohortId);
      if (existingIndex >= 0) {
        this.data.students[existingIndex].name = cleanName;
        if (cleanPhone) this.data.students[existingIndex].phone = cleanPhone;
        processedStudentIds.push(this.data.students[existingIndex].id);
        updatedCount++;
      } else {
        const newId = `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.data.students.push({
          id: newId,
          cohortId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          status: 'active',
          registeredAt: new Date().toISOString().split('T')[0],
          notes: s.notes || `Imported from ${meta?.fileName || 'Spreadsheet'}`,
        });
        processedStudentIds.push(newId);
        addedCount++;
      }
    }

    const newFileRecord: ImportedFileLog = {
      id: fileId,
      fileName: meta?.fileName || `Roster_Import_${new Date().toISOString().split('T')[0]}.xlsx`,
      fileSize: meta?.fileSize || incomingStudents.length * 128,
      recordsCount: incomingStudents.length,
      cohortId,
      uploadedAt: new Date().toISOString(),
      uploadedBy: meta?.uploadedBy || 'Admin Facilitator',
      studentIds: processedStudentIds,
    };

    this.data.importedFiles.unshift(newFileRecord);
    this.saveToStorage(this.data);

    return { addedCount, updatedCount, fileRecord: newFileRecord };
  }

  public deleteImportedFile(fileId: string, removeStudents = false): { removedFile: ImportedFileLog | null; deletedStudentsCount: number } {
    const fileIndex = this.data.importedFiles.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return { removedFile: null, deletedStudentsCount: 0 };

    const removedFile = this.data.importedFiles.splice(fileIndex, 1)[0];
    let deletedStudentsCount = 0;

    if (removeStudents && removedFile.studentIds && removedFile.studentIds.length > 0) {
      const idsSet = new Set(removedFile.studentIds);
      const initialCount = this.data.students.length;
      this.data.students = this.data.students.filter(s => !idsSet.has(s.id));
      deletedStudentsCount = initialCount - this.data.students.length;
    }

    this.saveToStorage(this.data);
    return { removedFile, deletedStudentsCount };
  }

  public deleteStudent(id: string): boolean {
    const index = this.data.students.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.data.students.splice(index, 1);
    this.saveToStorage(this.data);
    return true;
  }

  public bulkDeleteStudents(ids: string[]): number {
    const idsSet = new Set(ids);
    const initialCount = this.data.students.length;
    this.data.students = this.data.students.filter(s => !idsSet.has(s.id));
    this.saveToStorage(this.data);
    return initialCount - this.data.students.length;
  }

  public addClass(classData: Partial<ClassSession>): ClassSession {
    const newClass: ClassSession = {
      id: `cls-${Date.now()}`,
      cohortId: classData.cohortId || 'dtp-cohort-2',
      title: classData.title || 'Live Class Session',
      instructorName: classData.instructorName || 'Facilitator',
      date: classData.date || new Date().toISOString().split('T')[0],
      time: classData.time || '18:00 - 20:00 WAT',
      code: (classData.code || 'CATALYST').toUpperCase().trim(),
      isAttendanceOpen: classData.isAttendanceOpen !== undefined ? classData.isAttendanceOpen : true,
      attendanceWindowMinutes: classData.attendanceWindowMinutes || 120,
      meetingUrl: classData.meetingUrl || 'https://meet.google.com/dtp-cohort2-live',
      notes: classData.notes || '',
      createdAt: new Date().toISOString(),
    };

    this.data.classes.unshift(newClass);
    this.saveToStorage(this.data);
    return newClass;
  }

  public toggleClassAttendance(classId: string, isOpen?: boolean): ClassSession {
    const cls = this.data.classes.find(c => c.id === classId);
    if (!cls) throw new Error('Class session not found');

    cls.isAttendanceOpen = isOpen !== undefined ? isOpen : !cls.isAttendanceOpen;
    this.saveToStorage(this.data);
    return cls;
  }

  public markAttendance(payload: { code: string; studentEmail: string; studentName?: string; studentPhone?: string; feedback?: string }): { record: AttendanceRecord; classSession: ClassSession; studentStats: any } {
    const cleanCode = payload.code.trim().toUpperCase();
    const cleanEmail = payload.studentEmail.trim().toLowerCase();

    const classSession = this.data.classes.find(c => c.code.trim().toUpperCase() === cleanCode);
    if (!classSession) {
      throw new Error('Invalid attendance word/code.');
    }

    if (!classSession.isAttendanceOpen) {
      throw new Error('Attendance window for this class is currently closed by the administrator.');
    }

    // Check duplicate
    const existing = this.data.attendance.find(a => a.classId === classSession.id && a.studentEmail.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`You have already marked your attendance for today's class on ${new Date(existing.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    }

    const student = this.data.students.find(s => s.email.toLowerCase() === cleanEmail);

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: classSession.id,
      cohortId: classSession.cohortId,
      studentEmail: cleanEmail,
      studentName: student?.name || payload.studentName || 'Participant',
      studentPhone: student?.phone || payload.studentPhone || '',
      status: 'present',
      markedAt: new Date().toISOString(),
      classCodeUsed: cleanCode,
      feedback: payload.feedback || '',
    };

    this.data.attendance.push(newRecord);
    this.saveToStorage(this.data);

    const studentTotalAttended = this.data.attendance.filter(a => a.studentEmail.toLowerCase() === cleanEmail).length;
    const cohortTotalClasses = this.data.classes.filter(c => c.cohortId === classSession.cohortId).length;

    return {
      record: newRecord,
      classSession,
      studentStats: {
        totalAttended: studentTotalAttended,
        totalCohortClasses: cohortTotalClasses,
        attendanceRate: Math.round((studentTotalAttended / (cohortTotalClasses || 1)) * 100),
      }
    };
  }

  public addCampaign(campaign: EmailCampaign) {
    this.data.campaigns.unshift(campaign);
    this.saveToStorage(this.data);
  }
}

export const persistentStore = PersistentDataStore.getInstance();
