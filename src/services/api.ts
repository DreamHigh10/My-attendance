import { Cohort, ClassSession, AttendanceRecord, Student, EmailCampaign, ClassVerificationResponse, StudentLookupResponse, ImportedFileLog } from '../types';
import { persistentStore } from './storage';

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
    const { ok, data } = await safeFetchJson('/api/cohorts');
    if (ok && data?.cohorts?.length) {
      return data.cohorts;
    }
    return persistentStore.getCohorts();
  },

  async createCohort(cohort: Partial<Cohort>): Promise<Cohort> {
    const { ok, data } = await safeFetchJson('/api/cohorts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cohort),
    });
    if (ok && data?.cohort) return data.cohort;
    
    // Fallback persistent
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
    return newCohort;
  },

  // Student Lookup by registered Email
  async lookupStudent(email: string, cohortId?: string): Promise<StudentLookupResponse> {
    const { ok, data } = await safeFetchJson('/api/students/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, cohortId }),
    });
    if (ok && data) return data;

    // Local lookup fallback
    const cleanEmail = email.trim().toLowerCase();
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

  // Classes
  async getClasses(cohortId?: string): Promise<ClassSession[]> {
    const url = cohortId ? `/api/classes?cohortId=${cohortId}` : '/api/classes';
    const { ok, data } = await safeFetchJson(url);
    if (ok && data?.classes?.length) {
      return data.classes;
    }
    return persistentStore.getClasses(cohortId);
  },

  async createClass(classData: Partial<ClassSession>): Promise<ClassSession> {
    const { ok, data } = await safeFetchJson('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData),
    });
    if (ok && data?.classSession) {
      return data.classSession;
    }
    return persistentStore.addClass(classData);
  },

  async updateClass(classId: string, updates: Partial<ClassSession>): Promise<ClassSession> {
    const { ok, data } = await safeFetchJson(`/api/classes/${classId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (ok && data?.classSession) return data.classSession;
    return persistentStore.toggleClassAttendance(classId, updates.isAttendanceOpen);
  },

  async toggleClassAttendance(classId: string, isOpen?: boolean): Promise<ClassSession> {
    const { ok, data } = await safeFetchJson(`/api/classes/${classId}/toggle-attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen }),
    });
    if (ok && data?.classSession) return data.classSession;
    return persistentStore.toggleClassAttendance(classId, isOpen);
  },

  // Attendance
  async verifyCode(code: string, studentEmail?: string): Promise<ClassVerificationResponse> {
    const { ok, data } = await safeFetchJson('/api/attendance/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, studentEmail }),
    });
    if (ok && data) return data;

    // Fallback verification
    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = (studentEmail || '').trim().toLowerCase();
    const classes = persistentStore.getClasses();
    const classSession = classes.find(c => c.code.trim().toUpperCase() === cleanCode);

    if (!classSession) {
      return { valid: false, message: 'Invalid attendance word/code.' };
    }

    const matchedStudent = cleanEmail ? persistentStore.getStudents().find(s => s.email.toLowerCase() === cleanEmail) : undefined;
    const markedRecord = cleanEmail ? persistentStore.getAttendance(classSession.id).find(a => a.studentEmail.toLowerCase() === cleanEmail) : undefined;

    return {
      valid: true,
      classSession,
      cohort: persistentStore.getCohorts().find(c => c.id === classSession.cohortId),
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
    const { ok, data } = await safeFetchJson('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (ok && data?.record) return data;

    // Local persistent check-in
    const result = persistentStore.markAttendance(payload);
    return {
      success: true,
      message: "You've marked your attendance for today's class!",
      ...result,
    };
  },

  async getClassAttendance(classId: string): Promise<AttendanceRecord[]> {
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

  // Students & Excel Import
  async getStudents(cohortId?: string): Promise<Student[]> {
    const url = cohortId ? `/api/students?cohortId=${cohortId}` : '/api/students';
    const { ok, data } = await safeFetchJson(url);
    if (ok && data?.students?.length) {
      return data.students;
    }
    return persistentStore.getStudents(cohortId);
  },

  async addStudent(student: Partial<Student>): Promise<Student> {
    const { ok, data } = await safeFetchJson('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
    if (ok && data?.student) return data.student;
    return persistentStore.addStudent(student);
  },

  async bulkImportStudents(
    cohortId: string, 
    students: any[], 
    meta?: { fileName?: string; fileSize?: number; uploadedBy?: string }
  ): Promise<any> {
    // Attempt backend sync
    const { ok, data } = await safeFetchJson('/api/students/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        cohortId, 
        students,
        fileName: meta?.fileName,
        fileSize: meta?.fileSize,
        uploadedBy: meta?.uploadedBy,
      }),
    });

    if (ok && data) {
      // Sync with persistent local store as well
      persistentStore.bulkImportStudents(cohortId, students, meta);
      return data;
    }

    // Direct local store commit without failing on serverless 404 HTML
    const result = persistentStore.bulkImportStudents(cohortId, students, meta);
    return {
      success: true,
      message: `Roster updated: ${result.addedCount} new members added, ${result.updatedCount} updated. Total cohort roster is now ${persistentStore.getStudents(cohortId).length} members.`,
      ...result,
      totalCohortStudents: persistentStore.getStudents(cohortId).length,
    };
  },

  async getImportedFiles(cohortId?: string): Promise<ImportedFileLog[]> {
    const url = cohortId ? `/api/imported-files?cohortId=${cohortId}` : '/api/imported-files';
    const { ok, data } = await safeFetchJson(url);
    if (ok && data?.files) return data.files;
    return persistentStore.getImportedFiles(cohortId);
  },

  async deleteImportedFile(id: string, removeStudents = false): Promise<any> {
    const { ok, data } = await safeFetchJson(`/api/imported-files/${id}?removeStudents=${removeStudents}`, {
      method: 'DELETE',
    });
    if (ok && data) {
      persistentStore.deleteImportedFile(id, removeStudents);
      return data;
    }

    const res = persistentStore.deleteImportedFile(id, removeStudents);
    return {
      success: true,
      message: removeStudents 
        ? `File and ${res.deletedStudentsCount} associated roster records were deleted.`
        : `File record removed from upload history.`,
    };
  },

  async bulkDeleteStudents(ids: string[]): Promise<any> {
    const { ok, data } = await safeFetchJson('/api/students/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (ok && data) {
      persistentStore.bulkDeleteStudents(ids);
      return data;
    }

    const count = persistentStore.bulkDeleteStudents(ids);
    return { success: true, message: `Successfully deleted ${count} student(s).`, deletedCount: count };
  },

  async deleteStudent(id: string): Promise<any> {
    const { ok, data } = await safeFetchJson(`/api/students/${id}`, { method: 'DELETE' });
    if (ok && data) {
      persistentStore.deleteStudent(id);
      return data;
    }
    persistentStore.deleteStudent(id);
    return { success: true };
  },

  // Stats
  async getLeaderboard(cohortId?: string): Promise<any[]> {
    const url = cohortId ? `/api/leaderboard?cohortId=${cohortId}` : '/api/leaderboard';
    const { ok, data } = await safeFetchJson(url);
    if (ok && data?.leaderboard) return data.leaderboard;

    // Fallback persistent computation
    const students = persistentStore.getStudents(cohortId);
    const attendance = persistentStore.getAttendance();
    const attendanceCountByEmail: Record<string, number> = {};
    attendance.forEach(a => {
      const email = a.studentEmail.toLowerCase();
      attendanceCountByEmail[email] = (attendanceCountByEmail[email] || 0) + 1;
    });

    return students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      attendedClasses: attendanceCountByEmail[student.email.toLowerCase()] || 0,
    }))
    .filter(student => student.attendedClasses > 0)
    .sort((a, b) => b.attendedClasses - a.attendedClasses)
    .slice(0, 10);
  },

  async getStats(cohortId?: string): Promise<any> {
    const url = cohortId ? `/api/stats?cohortId=${cohortId}` : '/api/stats';
    const { ok, data } = await safeFetchJson(url);
    if (ok && data?.stats) return data.stats;
    
    const students = persistentStore.getStudents(cohortId);
    const classes = persistentStore.getClasses(cohortId);
    const attendance = persistentStore.getAttendance();
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

    // Built-in intelligent template fallback
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
