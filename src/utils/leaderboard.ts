import { AttendanceRecord, ClassSession, Student } from '../types';

export interface LeaderboardUserEntry {
  rank: number;
  email: string;
  name: string;
  phone?: string;
  totalPoints: number;
  totalAttended: number;
  totalClasses: number;
  attendanceRate: number;
  commentPoints: number;
  attendancePoints: number;
  speedPoints: number;
  commentsCount: number;
  speedBonusCount: number;
  lastMarkedAt?: string;
}

export interface PointsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Calculates Greatness Rank points and statistics:
 * 1. Attendance: 10 points per class attended
 * 2. Comment / Feedback: 5 points if student made a comment/takeaway while signing
 * 3. Early Bird Speed: The first 5 students to sign attendance for each class get 5, 4, 3, 2, 1 point(s) respectively.
 */
export function calculateGreatnessLeaderboard(
  students: Student[],
  classes: ClassSession[],
  attendanceRecords: AttendanceRecord[],
  targetCohortId?: string
): LeaderboardUserEntry[] {
  // Filter for target cohort if provided
  const relevantClasses = targetCohortId
    ? classes.filter((c) => c.cohortId === targetCohortId)
    : classes;
  const totalClassesCount = relevantClasses.length;

  const relevantClassIds = new Set(relevantClasses.map((c) => c.id));

  const relevantAttendance = targetCohortId
    ? attendanceRecords.filter((a) => a.cohortId === targetCohortId || relevantClassIds.has(a.classId))
    : attendanceRecords;

  // Group attendance records by classId to determine the first 5 sign-ins for each class
  const classArrivalsMap = new Map<string, AttendanceRecord[]>();
  for (const record of relevantAttendance) {
    if (!classArrivalsMap.has(record.classId)) {
      classArrivalsMap.set(record.classId, []);
    }
    classArrivalsMap.get(record.classId)!.push(record);
  }

  // Pre-calculate speed bonus points awarded per record ID:
  // Sort each class's records by markedAt ascending (first to sign gets highest)
  const recordSpeedPointsMap = new Map<string, number>();
  const speedBonusPoints = [5, 4, 3, 2, 1];

  classArrivalsMap.forEach((records) => {
    // Sort strictly by markedAt ascending
    const sorted = [...records].sort(
      (a, b) => new Date(a.markedAt).getTime() - new Date(b.markedAt).getTime()
    );

    // First 5 get 5, 4, 3, 2, 1 points
    for (let i = 0; i < Math.min(5, sorted.length); i++) {
      recordSpeedPointsMap.set(sorted[i].id, speedBonusPoints[i]);
    }
  });

  // Track map of all student emails
  const studentMap = new Map<string, { name: string; phone?: string; studentObj?: Student }>();
  
  // Seed with registered students
  for (const s of students) {
    if (!targetCohortId || s.cohortId === targetCohortId) {
      studentMap.set(s.email.toLowerCase().trim(), {
        name: s.name,
        phone: s.phone,
        studentObj: s,
      });
    }
  }

  // Also include any attendee who marked attendance even if not registered yet
  for (const a of relevantAttendance) {
    const email = a.studentEmail.toLowerCase().trim();
    if (!studentMap.has(email)) {
      studentMap.set(email, {
        name: a.studentName || 'Participant',
        phone: a.studentPhone,
      });
    }
  }

  // Accumulate points for each student
  const entries: LeaderboardUserEntry[] = [];

  studentMap.forEach((info, email) => {
    const studentRecords = relevantAttendance.filter(
      (a) => a.studentEmail.toLowerCase().trim() === email
    );

    // Distinct attended classes to avoid accidental duplicates
    const attendedClassIds = new Set(studentRecords.map((r) => r.classId));
    const attendedCount = attendedClassIds.size;

    let attendancePoints = attendedCount * 10;
    let commentPoints = 0;
    let commentsCount = 0;
    let speedPoints = 0;
    let speedBonusCount = 0;
    let latestTimestamp: string | undefined;

    // Evaluate each record
    for (const rec of studentRecords) {
      // 5 points for comment/feedback
      const hasComment =
        rec.feedback &&
        rec.feedback.trim().length > 0 &&
        !rec.feedback.includes('Marked present via Admin Manual Override');

      if (hasComment) {
        commentPoints += 5;
        commentsCount += 1;
      }

      // Early bird speed bonus
      const speedBonus = recordSpeedPointsMap.get(rec.id) || 0;
      if (speedBonus > 0) {
        speedPoints += speedBonus;
        speedBonusCount += 1;
      }

      if (!latestTimestamp || new Date(rec.markedAt).getTime() > new Date(latestTimestamp).getTime()) {
        latestTimestamp = rec.markedAt;
      }
    }

    const totalPoints = attendancePoints + commentPoints + speedPoints;
    const attendanceRate = totalClassesCount > 0
      ? Math.round((attendedCount / totalClassesCount) * 100)
      : attendedCount > 0 ? 100 : 0;

    entries.push({
      rank: 0, // Will be set after sorting
      email,
      name: info.name,
      phone: info.phone,
      totalPoints,
      totalAttended: attendedCount,
      totalClasses: totalClassesCount,
      attendanceRate,
      commentPoints,
      attendancePoints,
      speedPoints,
      commentsCount,
      speedBonusCount,
      lastMarkedAt: latestTimestamp,
    });
  });

  // Sort primarily by totalPoints desc, then totalAttended desc, then earlier lastMarkedAt
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.totalAttended !== a.totalAttended) {
      return b.totalAttended - a.totalAttended;
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  // Assign ranks (with tie-handling support)
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return entries;
}
