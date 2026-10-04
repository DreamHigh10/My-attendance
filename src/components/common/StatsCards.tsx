import React from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Radio, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ClassSession, Cohort, Student, AttendanceRecord } from '../../types';

interface StatsCardsProps {
  cohort?: Cohort;
  classes: ClassSession[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  cohort,
  classes,
  students,
  attendanceRecords,
}) => {
  const cohortClasses = classes.filter((c) => !cohort || c.cohortId === cohort.id);
  const cohortStudents = students.filter((c) => !cohort || c.cohortId === cohort.id);
  const cohortAttendance = attendanceRecords.filter((a) => !cohort || a.cohortId === cohort.id);

  const activeClass = cohortClasses.find((c) => c.isAttendanceOpen);
  const totalCheckIns = cohortAttendance.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      
      {/* Active Session & Secret Word Card */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-emerald-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-100 flex items-center gap-1.5">
              <Radio className="w-4 h-4 animate-pulse text-emerald-300" />
              Live Class Code
            </span>
            {activeClass && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white backdrop-blur-xs">
                Active
              </span>
            )}
          </div>

          {activeClass ? (
            <div>
              <p className="text-xs font-bold text-indigo-100 truncate mb-1">{activeClass.title}</p>
              <p className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-emerald-300 uppercase">
                {activeClass.code}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-base font-bold text-white">No active class code</p>
              <p className="text-xs text-indigo-100 mt-1">Ready for upcoming class</p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-white/20 text-[11px] text-indigo-100 font-medium">
          {activeClass ? `Instructor: ${activeClass.instructorName}` : 'Schedule next session below'}
        </div>
      </div>

      {/* 55 Registered Cohort Members */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Cohort 2 Members</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900">{cohortStudents.length}</p>
          <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <span>55+ Enrolled participants</span>
          </p>
        </div>
        <span className="text-[11px] text-slate-400 font-medium mt-3 pt-3 border-t border-slate-100">
          Ready for attendance marking
        </span>
      </div>

      {/* Class Sessions Scheduled */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Class Sessions</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900">{cohortClasses.length}</p>
          <p className="text-xs font-medium text-slate-600 mt-1">Total scheduled workshops</p>
        </div>
        <span className="text-[11px] text-slate-400 font-medium mt-3 pt-3 border-t border-slate-100">
          Cohort 2 Masterclasses
        </span>
      </div>

      {/* Total Verified Check-ins */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Recorded Check-Ins</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-emerald-600">{totalCheckIns}</p>
          <p className="text-xs font-medium text-slate-600 mt-1">Verified student logs</p>
        </div>
        <span className="text-[11px] text-slate-400 font-medium mt-3 pt-3 border-t border-slate-100">
          Synchronized in real time
        </span>
      </div>

    </div>
  );
};
