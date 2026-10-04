import { Cohort, ClassSession, AttendanceRecord, Student, EmailCampaign, ImportedFileLog } from '../types';

export const DEFAULT_55_STUDENTS: Student[] = [];

export const DEFAULT_COHORTS: Cohort[] = [
  {
    id: 'dtp-cohort-2',
    name: 'Dream Team Project: Cohort 2',
    codePrefix: 'DTP2',
    description: 'Active Cohort Track',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
    meetingLinkDefault: '',
  }
];

export const DEFAULT_CLASSES: ClassSession[] = [];

export const DEFAULT_ATTENDANCE: AttendanceRecord[] = [];

export const DEFAULT_IMPORTED_FILES: ImportedFileLog[] = [];

interface PersistentSchema {
  cohorts: Cohort[];
  classes: ClassSession[];
  students: Student[];
  attendance: AttendanceRecord[];
  campaigns: EmailCampaign[];
  importedFiles: ImportedFileLog[];
  version: number;
}

const STORAGE_KEY = 'dtp_clean_prod_v5';

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
      // Purge all legacy test datasets
      localStorage.removeItem('dtp_cloud_persistent_db_v1');
      localStorage.removeItem('dtp_cloud_persistent_db_v2');
      localStorage.removeItem('dtp_cloud_persistent_db_v3_prod');

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          cohorts: parsed.cohorts?.length ? parsed.cohorts : DEFAULT_COHORTS,
          classes: parsed.classes || [],
          students: parsed.students || [],
          attendance: parsed.attendance || [],
          campaigns: parsed.campaigns || [],
          importedFiles: parsed.importedFiles || [],
          version: parsed.version || 5,
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
      classes: [],
      students: [],
      attendance: [],
      campaigns: [],
      importedFiles: [],
      version: 5,
    };
  }

  public resetAllData(): PersistentSchema {
    const defaults = this.getDefaults();
    this.data = defaults;
    this.saveToStorage(defaults);
    return defaults;
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
      meetingUrl: classData.meetingUrl || '',
      notes: classData.notes || '',
      createdAt: new Date().toISOString(),
    };

    this.data.classes.unshift(newClass);
    this.saveToStorage(this.data);
    return newClass;
  }

  public deleteClass(id: string): boolean {
    const index = this.data.classes.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.data.classes.splice(index, 1);
    this.saveToStorage(this.data);
    return true;
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
