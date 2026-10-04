import { Cohort, ClassSession, AttendanceRecord, Student, EmailCampaign, ClassVerificationResponse, StudentLookupResponse } from '../types';

export const api = {
  // Cohorts
  async getCohorts(): Promise<Cohort[]> {
    const res = await fetch('/api/cohorts');
    const data = await res.json();
    return data.cohorts || [];
  },

  async createCohort(cohort: Partial<Cohort>): Promise<Cohort> {
    const res = await fetch('/api/cohorts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cohort),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create cohort');
    return data.cohort;
  },

  // Student Lookup by registered Email
  async lookupStudent(email: string, cohortId?: string): Promise<StudentLookupResponse> {
    const res = await fetch('/api/students/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, cohortId }),
    });
    const data = await res.json();
    return data;
  },

  // Classes
  async getClasses(cohortId?: string): Promise<ClassSession[]> {
    const url = cohortId ? `/api/classes?cohortId=${cohortId}` : '/api/classes';
    const res = await fetch(url);
    const data = await res.json();
    return data.classes || [];
  },

  async createClass(classData: Partial<ClassSession>): Promise<ClassSession> {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create class');
    return data.classSession;
  },

  async updateClass(classId: string, updates: Partial<ClassSession>): Promise<ClassSession> {
    const res = await fetch(`/api/classes/${classId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update class');
    return data.classSession;
  },

  async toggleClassAttendance(classId: string, isOpen?: boolean): Promise<ClassSession> {
    const res = await fetch(`/api/classes/${classId}/toggle-attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle attendance');
    return data.classSession;
  },

  // Attendance
  async verifyCode(code: string, studentEmail?: string): Promise<ClassVerificationResponse> {
    const res = await fetch('/api/attendance/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, studentEmail }),
    });
    const data = await res.json();
    return data;
  },

  async markAttendance(payload: {
    code: string;
    studentEmail: string;
    studentName?: string;
    studentPhone?: string;
    feedback?: string;
  }): Promise<{ success: boolean; message: string; record: AttendanceRecord; classSession?: ClassSession; studentStats?: any }> {
    const res = await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to mark attendance');
    return data;
  },

  async getClassAttendance(classId: string): Promise<AttendanceRecord[]> {
    const res = await fetch(`/api/attendance/class/${classId}`);
    const data = await res.json();
    return data.records || [];
  },

  async manualUpdateAttendance(payload: {
    classId: string;
    studentEmail: string;
    studentName?: string;
    status: 'present' | 'late' | 'excused' | 'absent';
  }): Promise<any> {
    const res = await fetch('/api/attendance/manual-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update attendance');
    return data;
  },

  // Students
  async getStudents(cohortId?: string): Promise<Student[]> {
    const url = cohortId ? `/api/students?cohortId=${cohortId}` : '/api/students';
    const res = await fetch(url);
    const data = await res.json();
    return data.students || [];
  },

  async addStudent(student: Partial<Student>): Promise<Student> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add student');
    return data.student;
  },

  async bulkImportStudents(cohortId: string, students: any[]): Promise<any> {
    const res = await fetch('/api/students/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cohortId, students }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to bulk import students');
    return data;
  },

  async deleteStudent(id: string): Promise<any> {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data;
  },

  // Stats
  async getStats(cohortId?: string): Promise<any> {
    const url = cohortId ? `/api/stats?cohortId=${cohortId}` : '/api/stats';
    const res = await fetch(url);
    const data = await res.json();
    return data.stats || {};
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
    const res = await fetch('/api/ai/draft-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok && !data.fallbackSubject) throw new Error(data.error || 'AI generation failed');
    return {
      subject: data.subject || data.fallbackSubject,
      body: data.body || data.fallbackBody,
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
    const res = await fetch('/api/email/send-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send broadcast');
    return data;
  },

  async getCampaigns(): Promise<EmailCampaign[]> {
    const res = await fetch('/api/email/campaigns');
    const data = await res.json();
    return data.campaigns || [];
  },
};
