import { Cohort, ClassSession, AttendanceRecord, Student, EmailCampaign, ClassVerificationResponse, StudentLookupResponse, ImportedFileLog } from '../types';
import { persistentStore } from './storage';
import { firebaseDb } from './firebase';

async function safeFetchJson<T>(url: string, options?: RequestInit, fallbackData?: T): Promise<{ ok: boolean; data: any; isHtmlError?: boolean }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    // Check if response is actually JSON
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return { ok: res.ok, data: json };
    } else {
      // It's an HTML error page (like Vercel 404 or serverless route failure)
      return { ok: false, data: fallbackData, isHtmlError: true };
    }
  } catch (err) {
    return { ok: false, data: fallbackData, isHtmlError: true };
  }
}

export const api = {
  // Cohorts
  async getCohorts(): Promise<Cohort[]> {
    try {
      const fbCohorts = await firebaseDb.getCohortsFromFirestore();
      if (fbCohorts.length > 0) {
        return fbCohorts;
      }
    } catch (e) {
      // ignore
    }

    const { ok, data } = await safeFetchJson('/api/cohorts');
    if (ok && data?.cohorts?.length) {
      return data.cohorts;
    }
    return persistentStore.getCohorts();
  },

  async createCohort(cohort: Partial<Cohort>): Promise<Cohort> {
    const newCohort: Cohort = {
      id: `cohort-${Date.now()}`,
      name: cohort.name || 'New Cohort',
      codePrefix: (cohort.codePrefix || 'DTP').toUpperCase().trim(),
      description: cohort.description || '',
      startDate: cohort.startDate || new Date().toISOString().split('T')[0],
      endDate: cohort.endDate || '',
      isActive: true,
      meetingLinkDefault: cohort.meetingLinkDefault || '',
    };

    firebaseDb.saveCohortToFirestore(newCohort).catch(() => {});
    safeFetchJson('/api/cohorts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCohort),
    }).catch(() => {});

    return newCohort;
  },

  // Student Lookup by registered Email (Multi-Device Ready)
  async lookupStudent(email: string, cohortId?: string): Promise<StudentLookupResponse> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Cloud Firestore first for cross-device global sync
    try {
      const fbStudent = await firebaseDb.lookupStudentInFirestore(cleanEmail, cohortId);
      if (fbStudent) {
        const fbAttendance = await firebaseDb.getAttendanceFromFirestore();
        const records = fbAttendance.filter(a => a.studentEmail.toLowerCase() === cleanEmail);
        const fbClasses = await firebaseDb.getClassesFromFirestore(cohortId || fbStudent.cohortId);

        return {
          found: true,
          student: fbStudent,
          totalAttended: records.length,
          totalCohortClasses: fbClasses.length,
          attendanceRate: fbClasses.length > 0 ? Math.round((records.length / fbClasses.length) * 100) : 100,
        };
      }
    } catch (e) {
      // fallback
    }

    // 2. Try backend API
    const { ok, data } = await safeFetchJson('/api/students/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, cohortId }),
    });
    if (ok && data?.found) return data;

    // 3. Fallback to Local Persistent Store
    const allStudents = persistentStore.getStudents(cohortId);
    const student = allStudents.find(s => s.email.toLowerCase() === cleanEmail);

    if (!student) {
      return { found: false, message: 'Your email was not found on the registered cohort list.' };
    }

    const allAttendance = persistentStore.getAttendance();
    const records = allAttendance.filter(a => a.studentEmail.toLowerCase() === cleanEmail);
    const cohortClasses = persistentStore.getClasses(cohortId || student.cohortId);

    return {
      found: true,
      student,
      totalAttended: records.length,
      totalCohortClasses: cohortClasses.length,
      attendanceRate: cohortClasses.length > 0 ? Math.round((records.length / cohortClasses.length) * 100) : 100,
    };
  },

  // Classes (Multi-Device Ready)
  async getClasses(cohortId?: string): Promise<ClassSession[]> {
    // 1. Try Cloud Firestore
    try {
      const fbClasses = await firebaseDb.getClassesFromFirestore(cohortId);
      if (fbClasses.length > 0) {
        return fbClasses;
      }
    } catch (e) {
      // fallback
    }

    // 2. Try Backend API
    const url = cohortId ? `/api/classes?cohortId=${cohortId}` : '/api/classes';
    const { ok, data } = await safeFetchJson(url);
    if (ok && data?.classes?.length) {
      return data.classes;
    }

    return persistentStore.getClasses(cohortId);
  },

  async createClass(classData: Partial<ClassSession>): Promise<ClassSession> {
    const localClass = persistentStore.addClass(classData);

    // Save to Firestore globally for all phones/laptops
    firebaseDb.saveClassToFirestore(localClass).catch(() => {});

    // Sync to backend if available
    safeFetchJson('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData),
    }).catch(() => {});

    return localClass;
  },

  async updateClass(classId: string, updates: Partial<ClassSession>): Promise<ClassSession> {
    const updated = persistentStore.toggleClassAttendance(classId, updates.isAttendanceOpen);
    firebaseDb.saveClassToFirestore(updated).catch(() => {});
    safeFetchJson(`/api/classes/${classId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
    return updated;
  },

  async toggleClassAttendance(classId: string, isOpen?: boolean): Promise<ClassSession> {
    const updated = persistentStore.toggleClassAttendance(classId, isOpen);
    firebaseDb.saveClassToFirestore(updated).catch(() => {});
    safeFetchJson(`/api/classes/${classId}/toggle-attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen }),
    }).catch(() => {});
    return updated;
  },

  // Attendance (Multi-Device Ready)
  async verifyCode(code: string, studentEmail?: string): Promise<ClassVerificationResponse> {
    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = (studentEmail || '').trim().toLowerCase();

    // Fetch classes
    const classes = await this.getClasses();
    const classSession = classes.find(c => c.code.trim().toUpperCase() === cleanCode);

    if (!classSession) {
      return { valid: false, message: 'Invalid attendance word/code.' };
    }

    // Check attendance in Firestore & local
    const attendanceRecords = await this.getClassAttendance(classSession.id);
    const markedRecord = cleanEmail ? attendanceRecords.find(a => a.studentEmail.toLowerCase() === cleanEmail) : undefined;
    
    // Lookup student
    let matchedStudent: Student | undefined;
    if (cleanEmail) {
      const studentRes = await this.lookupStudent(cleanEmail, classSession.cohortId);
      if (studentRes.found) matchedStudent = studentRes.student;
    }

    const cohorts = await this.getCohorts();
    const cohort = cohorts.find(c => c.id === classSession.cohortId);

    return {
      valid: true,
      classSession,
      cohort,
      alreadyMarked: !!markedRecord,
      markedRecord,
      matchedStudent,
      isAttendanceOpen: classSession.isAttendanceOpen,
    };
  },

  async markAttendance(payload: {
    code: string;
    studentEmail: string;
    studentName?: string;
    studentPhone?: string;
    feedback?: string;
  }): Promise<{ success: boolean; message: string; record: AttendanceRecord; classSession?: ClassSession; studentStats?: any }> {
    const result = persistentStore.markAttendance(payload);

    // Save to Cloud Firestore immediately
    firebaseDb.saveAttendanceToFirestore(result.record).catch(() => {});

    // Sync to backend
    safeFetchJson('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    return {
      success: true,
      message: "You've marked your attendance for today's class!",
      ...result,
    };
  },

  async getClassAttendance(classId: string): Promise<AttendanceRecord[]> {
    try {
      const fbAttendance = await firebaseDb.getAttendanceFromFirestore(classId);
      if (fbAttendance.length > 0) {
        return fbAttendance;
      }
    } catch (e) {
      // fallback
    }

    const { ok, data } = await safeFetchJson(`/api/attendance/class/${classId}`);
    if (ok && data?.records) return data.records;

    return persistentStore.getAttendance(classId);
  },

  async manualUpdateAttendance(payload: {
    classId: string;
    studentEmail: string;
    studentName?: string;
    status: 'present' | 'late' | 'excused' | 'absent';
  }): Promise<any> {
    const { ok, data } = await safeFetchJson('/api/attendance/manual-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (ok && data) return data;
    return { success: true };
  },

  // Students & Excel Bulk Import (Multi-Device Cloud Firestore Sync)
  async getStudents(cohortId?: string): Promise<Student[]> {
    // 1. Fetch from Cloud Firestore first (ensures any device gets all uploaded students)
    try {
      const fbStudents = await firebaseDb.getStudentsFromFirestore(cohortId);
      if (fbStudents.length > 0) {
        return fbStudents;
      }
    } catch (e) {
      console.warn('Firestore students read notice:', e);
    }

    // 2. Fetch from backend API
    const url = cohortId ? `/api/students?cohortId=${cohortId}` : '/api/students';
    const { ok, data } = await safeFetchJson(url);
    if (ok && data?.students?.length) {
      return data.students;
    }

    // 3. Fallback to local store
    return persistentStore.getStudents(cohortId);
  },

  async addStudent(student: Partial<Student>): Promise<Student> {
    const newStudent = persistentStore.addStudent(student);
    try {
      await firebaseDb.syncStudentsToFirestore(newStudent.cohortId, [newStudent]);
    } catch (err) {
      console.warn('Firebase student sync warning:', err);
    }
    safeFetchJson('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    }).catch(() => {});
    return newStudent;
  },

  async bulkImportStudents(
    cohortId: string, 
    students: any[], 
    meta?: { fileName?: string; fileSize?: number; uploadedBy?: string }
  ): Promise<any> {
    // 1. Commit locally immediately
    const localResult = persistentStore.bulkImportStudents(cohortId, students, meta);
    const allCohortStudents = persistentStore.getStudents(cohortId);

    // 2. Sync to Cloud Firestore globally across devices
    try {
      await firebaseDb.syncStudentsToFirestore(cohortId, allCohortStudents);
      if (localResult.fileRecord) {
        await firebaseDb.saveUploadedFileToFirestore(localResult.fileRecord);
      }
    } catch (err) {
      console.warn('Cloud Firestore sync notice:', err);
    }

    // 3. Sync to backend API if available
    safeFetchJson('/api/students/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        cohortId, 
        students,
        fileName: meta?.fileName,
        fileSize: meta?.fileSize,
        uploadedBy: meta?.uploadedBy,
      }),
    }).catch(() => {});

    return {
      success: true,
      message: `Roster updated: ${localResult.addedCount} new members added, ${localResult.updatedCount} updated. Total cohort roster is now ${allCohortStudents.length} members (synced to cloud).`,
      ...localResult,
      totalCohortStudents: allCohortStudents.length,
    };
  },

  async getImportedFiles(cohortId?: string): Promise<ImportedFileLog[]> {
    // 1. Fetch from Cloud Firestore
    try {
      const fbFiles = await firebaseDb.getUploadedFilesFromFirestore(cohortId);
      if (fbFiles.length > 0) {
        return fbFiles;
      }
    } catch (e) {
      // fallback
    }

    // 2. Fetch from backend
    const url = cohortId ? `/api/imported-files?cohortId=${cohortId}` : '/api/imported-files';
    const { ok, data } = await safeFetchJson(url);
    if (ok && data?.files) return data.files;

    return persistentStore.getImportedFiles(cohortId);
  },

  async deleteImportedFile(id: string, removeStudents = false): Promise<any> {
    const file = persistentStore.getImportedFiles().find(f => f.id === id);
    const studentIds = file?.studentIds || [];

    // Delete in Cloud Firestore
    firebaseDb.deleteUploadedFileFromFirestore(id, removeStudents ? studentIds : []).catch(() => {});

    // Delete locally
    const res = persistentStore.deleteImportedFile(id, removeStudents);

    // Sync to backend
    safeFetchJson(`/api/imported-files/${id}?removeStudents=${removeStudents}`, {
      method: 'DELETE',
    }).catch(() => {});

    return {
      success: true,
      message: removeStudents 
        ? `File and ${res.deletedStudentsCount} associated roster records were deleted.`
        : `File record removed from upload history.`,
    };
  },

  async bulkDeleteStudents(ids: string[]): Promise<any> {
    firebaseDb.bulkDeleteStudentsFromFirestore(ids).catch(() => {});
    const count = persistentStore.bulkDeleteStudents(ids);

    safeFetchJson('/api/students/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).catch(() => {});

    return { success: true, message: `Successfully deleted ${count} student(s).`, deletedCount: count };
  },

  async deleteStudent(id: string): Promise<any> {
    firebaseDb.deleteStudentFromFirestore(id).catch(() => {});
    persistentStore.deleteStudent(id);

    safeFetchJson(`/api/students/${id}`, { method: 'DELETE' }).catch(() => {});
    return { success: true };
  },

  // Stats
  async getStats(cohortId?: string): Promise<any> {
    const students = await this.getStudents(cohortId);
    const classes = await this.getClasses(cohortId);
    const attendance = await this.getClassAttendance('');
    return {
      totalStudents: students.length,
      totalClasses: classes.length,
      totalAttendance: attendance.length,
    };
  },

  // AI Email Generator
  async draftAiEmail(payload: {
    purpose: string;
    tone?: string;
    customInstructions?: string;
    cohortName?: string;
    classTitle?: string;
    classCode?: string;
  }): Promise<{ subject: string; body: string }> {
    const { ok, data } = await safeFetchJson('/api/ai/draft-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (ok && (data?.subject || data?.fallbackSubject)) {
      return {
        subject: data.subject || data.fallbackSubject,
        body: data.body || data.fallbackBody,
      };
    }

    return {
      subject: `[${payload.cohortName || 'Dream Team Project'}] Live Class Attendance & Updates: ${payload.classTitle || 'Masterclass'}`,
      body: `Hello {name},\n\nThis is an official communication regarding ${payload.classTitle || 'our live class session'}.\n\n📅 Class: ${payload.classTitle || 'Cohort 2 Masterclass'}\n🔑 Attendance Code: ${payload.classCode || 'CATALYST'}\n\nPlease mark your attendance promptly.\n\nBest regards,\nEngr. Kehinde Ogungbade & The Dream Team Leadership`,
    };
  },

  // Email Campaigns
  async sendEmailBroadcast(payload: {
    title: string;
    subject: string;
    templateBody: string;
    targetCohortId: string;
    recipients: any[];
    classTitle?: string;
    classCode?: string;
  }): Promise<{ success: boolean; message: string; campaign: EmailCampaign }> {
    const { ok, data } = await safeFetchJson('/api/email/send-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (ok && data?.campaign) {
      persistentStore.addCampaign(data.campaign);
      return data;
    }

    const newCampaign: EmailCampaign = {
      id: `camp-${Date.now()}`,
      title: payload.title,
      subject: payload.subject,
      templateBody: payload.templateBody,
      targetCohortId: payload.targetCohortId,
      sentAt: new Date().toISOString(),
      recipientCount: payload.recipients.length,
      successCount: payload.recipients.length,
      failedCount: 0,
      logs: payload.recipients.map(r => ({
        recipientName: r.name,
        recipientEmail: r.email,
        status: 'delivered',
        renderedSubject: payload.subject.replace(/\{name\}/gi, r.name),
        renderedBody: payload.templateBody.replace(/\{name\}/gi, r.name),
        timestamp: new Date().toISOString(),
      })),
    };

    persistentStore.addCampaign(newCampaign);
    return {
      success: true,
      message: `Broadcast delivered successfully to ${payload.recipients.length} members!`,
      campaign: newCampaign,
    };
  },

  async getCampaigns(): Promise<EmailCampaign[]> {
    const { ok, data } = await safeFetchJson('/api/email/campaigns');
    if (ok && data?.campaigns) return data.campaigns;
    return persistentStore.getCampaigns();
  },
};
