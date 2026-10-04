import React from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  ExternalLink, 
  Sparkles, 
  Radio, 
  BellRing,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { ClassSession, Cohort } from '../../types';

interface UpcomingClassesSectionProps {
  classes: ClassSession[];
  cohort?: Cohort;
  isAdminView?: boolean;
  onSendReminderEmail?: (classSession: ClassSession) => void;
  onSelectClassForAttendance?: (classSession: ClassSession) => void;
}

export const UpcomingClassesSection: React.FC<UpcomingClassesSectionProps> = ({
  classes,
  cohort,
  isAdminView,
  onSendReminderEmail,
  onSelectClassForAttendance,
}) => {
  // Sort classes by date ascending (or next scheduled)
  const sortedClasses = [...classes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getRelativeDayText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    return 'Completed';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Upcoming Classes &amp; Masterclass Schedule</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {isAdminView 
              ? 'Preview scheduled sessions and dispatch instant reminder broadcasts to cohort members.' 
              : 'Stay up to date with scheduled classes and prepare ahead of live sessions.'}
          </p>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{sortedClasses.length} Scheduled</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedClasses.map((cls) => {
          const relativeText = getRelativeDayText(cls.date);
          const isToday = relativeText === 'Today';

          return (
            <div
              key={cls.id}
              className={`bg-white border-2 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-100 flex flex-col justify-between transition-all hover:scale-[1.01] ${
                cls.isAttendanceOpen 
                  ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-indigo-500/10' 
                  : isToday 
                  ? 'border-amber-400 bg-amber-50/20' 
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header Chips */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    isToday
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {relativeText}
                  </span>

                  {cls.isAttendanceOpen ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                      Live Window Open
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">
                      Scheduled
                    </span>
                  )}
                </div>

                <h4 className="text-base font-black text-slate-900 mb-2 leading-snug">
                  {cls.title}
                </h4>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>{new Date(cls.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>{cls.time}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>Facilitator: <strong className="text-slate-800 font-bold">{cls.instructorName}</strong></span>
                  </div>
                </div>

                {cls.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-4 line-clamp-2">
                    &ldquo;{cls.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {cls.meetingUrl && (
                  <a
                    href={cls.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <span>Meeting Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {isAdminView && onSendReminderEmail && (
                  <button
                    onClick={() => onSendReminderEmail(cls)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer ml-auto"
                  >
                    <BellRing className="w-3.5 h-3.5 text-amber-300" />
                    <span>Send Reminder Email</span>
                  </button>
                )}

                {!isAdminView && cls.isAttendanceOpen && onSelectClassForAttendance && (
                  <button
                    onClick={() => onSelectClassForAttendance(cls)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer ml-auto"
                  >
                    <span>Enter Code &bull; Mark Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
