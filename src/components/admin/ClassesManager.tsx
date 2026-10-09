import React, { useState } from 'react';
import { 
  Plus, 
  Copy, 
  Check, 
  Radio, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  Tv, 
  Mail, 
  Edit3,
  KeyRound,
  ExternalLink,
  Sparkles,
  Lock,
  PlusCircle,
  Hourglass,
  RotateCcw,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Timer
} from 'lucide-react';
import { ClassSession, Cohort, AttendanceRecord } from '../../types';
import { api } from '../../services/api';
import { ClassCodePresentationModal } from './ClassCodePresentationModal';
import { AttendanceCountdown } from '../common/AttendanceCountdown';

interface ClassesManagerProps {
  cohorts: Cohort[];
  selectedCohortId: string;
  classes: ClassSession[];
  attendanceRecords: AttendanceRecord[];
  onRefresh: () => void;
  onNavigateToTab: (tab: 'attendance' | 'emails' | 'roster', extraState?: any) => void;
}

// Helper to format ISO to datetime-local string
const toDatetimeLocal = (dateOrIso?: string): string => {
  const d = dateOrIso ? new Date(dateOrIso) : new Date();
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ClassesManager: React.FC<ClassesManagerProps> = ({
  cohorts,
  selectedCohortId,
  classes,
  attendanceRecords,
  onRefresh,
  onNavigateToTab,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [presentingClass, setPresentingClass] = useState<ClassSession | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Class Form State
  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];
  const [formCohortId, setFormCohortId] = useState(selectedCohortId);
  const [title, setTitle] = useState('');
  const [instructorName, setInstructorName] = useState('Engr. Kehinde Ogungbade');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00 - 20:30 WAT');
  const [code, setCode] = useState('CATALYST');
  const [attendanceWindowMinutes, setAttendanceWindowMinutes] = useState(30);

  // Default start to current time, end to current time + 30 mins
  const [attendanceStartTime, setAttendanceStartTime] = useState(() => toDatetimeLocal());
  const [attendanceEndTime, setAttendanceEndTime] = useState(() => {
    const end = new Date(Date.now() + 30 * 60000);
    return toDatetimeLocal(end.toISOString());
  });

  const [meetingUrl, setMeetingUrl] = useState(selectedCohort?.meetingLinkDefault || 'https://meet.google.com/dtp-cohort2-live');
  const [notes, setNotes] = useState('');

  // Edit Class Form State
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editIsOpen, setEditIsOpen] = useState(true);

  const handleOpenCreateModal = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60000);
    setAttendanceStartTime(toDatetimeLocal(now.toISOString()));
    setAttendanceEndTime(toDatetimeLocal(end.toISOString()));
    setAttendanceWindowMinutes(30);
    setFormCohortId(selectedCohortId);
    setError(null);
    setIsCreateModalOpen(true);
  };

  const handleSetDurationPreset = (minutes: number) => {
    setAttendanceWindowMinutes(minutes);
    const start = attendanceStartTime ? new Date(attendanceStartTime) : new Date();
    const end = new Date(start.getTime() + minutes * 60000);
    setAttendanceEndTime(toDatetimeLocal(end.toISOString()));
  };

  const handleCopyCode = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(codeToCopy);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleAttendance = async (classSession: ClassSession) => {
    try {
      await api.toggleClassAttendance(classSession.id, !classSession.isAttendanceOpen, classSession.attendanceWindowMinutes || 30);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance window');
    }
  };

  const handleExtendMinutes = async (classSession: ClassSession, additionalMinutes: number) => {
    try {
      await api.updateClassWindow(classSession.id, { additionalMinutes });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to extend attendance window');
    }
  };

  const handleStartWindowNow = async (classSession: ClassSession, minutes: number = 30) => {
    try {
      const now = new Date();
      const end = new Date(now.getTime() + minutes * 60000);
      await api.updateClass(classSession.id, {
        isAttendanceOpen: true,
        attendanceStartTime: now.toISOString(),
        attendanceEndTime: end.toISOString(),
        attendanceWindowMinutes: minutes,
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to open attendance window');
    }
  };

  const handleLockWindowNow = async (classSession: ClassSession) => {
    if (!confirm(`Lock attendance window now for "${classSession.title}"? No further submissions will be allowed.`)) return;
    try {
      const now = new Date();
      await api.updateClass(classSession.id, {
        isAttendanceOpen: false,
        attendanceEndTime: now.toISOString(),
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to lock attendance window');
    }
  };

  const handleDeleteClass = async (classSession: ClassSession) => {
    if (!confirm(`Are you sure you want to delete "${classSession.title}"?`)) return;
    try {
      await api.deleteClass(classSession.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete class session');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !code.trim()) {
      setError('Please provide class title, date, and secret attendance word.');
      return;
    }

    if (!attendanceStartTime || !attendanceEndTime) {
      setError('Please specify both attendance start time and end time.');
      return;
    }

    const startDate = new Date(attendanceStartTime);
    const endDate = new Date(attendanceEndTime);

    if (endDate <= startDate) {
      setError('Attendance end time must be after the start time.');
      return;
    }

    const durationMins = Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 60000), 1);

    setError(null);
    setIsSubmitting(true);

    try {
      await api.createClass({
        cohortId: formCohortId,
        title: title.trim(),
        instructorName: instructorName.trim(),
        date,
        time,
        code: code.trim().toUpperCase(),
        attendanceWindowMinutes: durationMins,
        attendanceStartTime: startDate.toISOString(),
        attendanceEndTime: endDate.toISOString(),
        isAttendanceOpen: true,
        meetingUrl: meetingUrl.trim(),
        notes: notes.trim(),
      });

      setIsCreateModalOpen(false);
      setTitle('');
      setCode('DREAMER');
      setNotes('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create class session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditClass = (cls: ClassSession) => {
    setEditingClass(cls);
    setEditStartTime(toDatetimeLocal(cls.attendanceStartTime));
    setEditEndTime(toDatetimeLocal(cls.attendanceEndTime));
    setEditIsOpen(cls.isAttendanceOpen);
  };

  const handleSaveEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const startDate = editStartTime ? new Date(editStartTime) : new Date();
    const endDate = editEndTime ? new Date(editEndTime) : new Date(startDate.getTime() + 30 * 60000);

    if (endDate <= startDate) {
      alert('Attendance end time must be after the start time.');
      return;
    }

    const durationMins = Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 60000), 1);

    setIsSubmitting(true);
    try {
      await api.updateClass(editingClass.id, {
        code: editingClass.code.trim().toUpperCase(),
        title: editingClass.title.trim(),
        instructorName: editingClass.instructorName.trim(),
        attendanceStartTime: startDate.toISOString(),
        attendanceEndTime: endDate.toISOString(),
        attendanceWindowMinutes: durationMins,
        isAttendanceOpen: editIsOpen,
      });
      setEditingClass(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update class details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClasses = classes.filter((c) => !selectedCohortId || c.cohortId === selectedCohortId);

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            <span>Class Sessions, Secret Codes &amp; Timed Attendance</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Schedule live sessions, configure precise attendance <strong className="text-slate-800">start &amp; end times</strong> with visible student countdowns, and type secret codes.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Class &amp; Set Countdown Window</span>
        </button>
      </div>

      {/* Classes Grid or Clean Empty State */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">
            No Classes Scheduled Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            Your schedule is clean and ready. Click below to schedule your first live class session, configure its attendance start and end times, and set today&apos;s secret attendance code.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule First Class</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {filteredClasses.map((cls) => {
            const classAttendees = attendanceRecords.filter((a) => a.classId === cls.id);
            const cohort = cohorts.find((c) => c.id === cls.cohortId);

            const isElapsed = cls.attendanceEndTime 
              ? Date.now() > new Date(cls.attendanceEndTime).getTime()
              : false;

            const isNotStarted = cls.attendanceStartTime
              ? Date.now() < new Date(cls.attendanceStartTime).getTime()
              : false;

            const isWindowActive = cls.isAttendanceOpen && !isElapsed && !isNotStarted;

            return (
              <div
                key={cls.id}
                className={`bg-white border-2 rounded-3xl p-6 transition-all shadow-md flex flex-col justify-between ${
                  isWindowActive
                    ? 'border-indigo-500 shadow-indigo-500/10 ring-4 ring-indigo-50'
                    : isElapsed
                    ? 'border-slate-200 opacity-95'
                    : 'border-amber-200 bg-amber-50/10'
                }`}
              >
                {/* Header Row */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {cohort?.name || 'Cohort 2'}
                    </span>

                    {/* Window Status Pill & Toggle */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                        isWindowActive
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isNotStarted
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          isWindowActive ? 'bg-emerald-600 animate-ping' : isNotStarted ? 'bg-amber-500 animate-pulse' : 'bg-rose-600'
                        }`} />
                        <span>
                          {isWindowActive ? 'Countdown Active' : isNotStarted ? 'Scheduled' : 'Window Elapsed'}
                        </span>
                      </span>

                      <button
                        onClick={() => handleToggleAttendance(cls)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                          cls.isAttendanceOpen
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title={cls.isAttendanceOpen ? 'Close attendance window' : 'Reopen attendance window'}
                      >
                        {cls.isAttendanceOpen ? 'Lock' : 'Reopen'}
                      </button>
                    </div>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-slate-900 mb-2 leading-snug">
                    {cls.title}
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      {new Date(cls.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {cls.time}
                    </span>
                    <span className="flex items-center gap-1.5 col-span-2">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      Facilitator: <strong className="text-slate-900 font-bold">{cls.instructorName}</strong>
                    </span>
                  </div>

                  {/* VISIBLE COUNTDOWN WIDGET ON CARD */}
                  <div className="mb-4">
                    <AttendanceCountdown
                      startTime={cls.attendanceStartTime}
                      endTime={cls.attendanceEndTime}
                      isOpen={cls.isAttendanceOpen && !isElapsed}
                      size="md"
                      title={cls.title}
                    />
                  </div>

                  {/* ATTENDANCE TIMING WINDOW DETAILS */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1 font-bold">
                        <Timer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Attendance Window:</span>
                      </span>
                      <span className="font-semibold text-slate-900">
                        {cls.attendanceStartTime 
                          ? new Date(cls.attendanceStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Not set'
                        }
                        {' &rarr; '}
                        {cls.attendanceEndTime 
                          ? new Date(cls.attendanceEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Not set'
                        }
                      </span>
                    </div>

                    {/* Quick Facilitator Extension Controls */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500">Extend Countdown:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleExtendMinutes(cls, 5)}
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[11px] border border-indigo-200 transition-all cursor-pointer"
                        >
                          +5m
                        </button>
                        <button
                          onClick={() => handleExtendMinutes(cls, 15)}
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[11px] border border-indigo-200 transition-all cursor-pointer"
                        >
                          +15m
                        </button>
                        <button
                          onClick={() => handleExtendMinutes(cls, 30)}
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[11px] border border-indigo-200 transition-all cursor-pointer"
                        >
                          +30m
                        </button>
                        {!isWindowActive && (
                          <button
                            onClick={() => handleStartWindowNow(cls, 30)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition-all shadow-xs cursor-pointer"
                          >
                            Start Now (30m)
                          </button>
                        )}
                        {isWindowActive && (
                          <button
                            onClick={() => handleLockWindowNow(cls)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] transition-all shadow-xs cursor-pointer"
                          >
                            Lock Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECRET WORD CODE DISPLAY BOX */}
                  <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Secret Class Word (Attendance Code)
                      </span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-indigo-700 tracking-wider uppercase">
                        {cls.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        title="Copy Code"
                        onClick={() => handleCopyCode(cls.code)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        {copiedCode === cls.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode === cls.code ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        title="Edit Code Word & Attendance Window"
                        onClick={() => handleStartEditClass(cls)}
                        className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:text-indigo-600 transition-all shadow-2xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{classAttendees.length} checked in today</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPresentingClass(cls)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Project Screen</span>
                    </button>

                    <button
                      onClick={() => onNavigateToTab('attendance', { classId: cls.id })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>View Logs</span>
                    </button>

                    <button
                      onClick={() => onNavigateToTab('emails', { classTitle: cls.title, classCode: cls.code })}
                      title="Broadcast Code via AI Email"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-indigo-600 transition-all cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteClass(cls)}
                      title="Delete Class"
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW CLASS MODAL WITH PRECISE ATTENDANCE START & END TIME */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-600" />
                  <span>Schedule Class &amp; Set Countdown Window</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set the start time, end time, and live countdown for when attendance stops.
                </p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="text-slate-400 hover:text-slate-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl mb-4 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Cohort</label>
                <select
                  value={formCohortId}
                  onChange={(e) => setFormCohortId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                >
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Class Topic / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuesday Masterclass: System Architecture & APIs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Facilitator / Instructor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Engr. Kehinde Ogungbade"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Class Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Time Schedule (Display)</label>
                  <input
                    type="text"
                    placeholder="e.g. 18:00 - 20:30 WAT"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>
              </div>

              {/* DEDICATED ATTENDANCE WINDOW SECTION */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-emerald-50/70 border-2 border-indigo-200 rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Attendance Window &amp; Countdown Timer
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        When countdown elapses to 00:00, submissions are strictly locked.
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    Timed Access
                  </span>
                </div>

                {/* Duration Presets */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">
                    Quick Duration Presets:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[15, 30, 45, 60, 120].map((mins) => (
                      <button
                        type="button"
                        key={mins}
                        onClick={() => handleSetDurationPreset(mins)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          attendanceWindowMinutes === mins
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {mins} Mins
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start and End Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-black text-xs mb-1">
                      Attendance Starts At *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={attendanceStartTime}
                      onChange={(e) => setAttendanceStartTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Submissions open at this time
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-black text-xs mb-1">
                      Attendance Stops At (Deadline) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={attendanceEndTime}
                      onChange={(e) => setAttendanceEndTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                    <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                      Countdown hits 00:00 &bull; Submissions locked
                    </span>
                  </div>
                </div>

                {/* Real-Time Window Summary Box */}
                <div className="bg-white/90 rounded-xl p-3 border border-indigo-100 flex items-center justify-between text-xs font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>
                      Active Window: <strong className="text-slate-900">{new Date(attendanceStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> to <strong className="text-slate-900">{new Date(attendanceEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    </span>
                  </div>
                  <span className="font-bold text-indigo-700">
                    Visible live timer to students
                  </span>
                </div>
              </div>

              {/* SECRET WORD CODE (ADMIN TYPES IT) */}
              <div>
                <label className="block text-slate-900 font-black mb-1">
                  Type Secret Word / Attendance Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CATALYST, VELOCITY, HORIZON, DREAMER"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-violet-50 border-2 border-indigo-400 focus:border-indigo-600 rounded-2xl px-4 py-3 text-base font-mono font-black text-indigo-900 uppercase tracking-wider"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  You will project or share this code with students to submit before the countdown stops.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Meeting Room Link (Zoom / Google Meet)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Set Countdown & Schedule Class'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT CLASS & ATTENDANCE WINDOW MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>Edit Attendance Window &amp; Secret Code</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update timings, extend countdown, or change the secret attendance word.
                </p>
              </div>
              <button 
                onClick={() => setEditingClass(null)} 
                className="text-slate-400 hover:text-slate-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditClass} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Class Title</label>
                <input
                  type="text"
                  required
                  value={editingClass.title}
                  onChange={(e) => setEditingClass({ ...editingClass, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Facilitator</label>
                <input
                  type="text"
                  value={editingClass.instructorName}
                  onChange={(e) => setEditingClass({ ...editingClass, instructorName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Secret Word Code</label>
                <input
                  type="text"
                  required
                  value={editingClass.code}
                  onChange={(e) => setEditingClass({ ...editingClass, code: e.target.value.toUpperCase() })}
                  className="w-full bg-violet-50 border-2 border-indigo-400 rounded-xl px-3 py-2.5 text-base font-mono font-black text-indigo-900 uppercase tracking-wider"
                />
              </div>

              {/* TIMING CONTROLS */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-indigo-600" />
                    <span>Attendance Window Timings</span>
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsOpen}
                      onChange={(e) => setEditIsOpen(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-bold text-slate-700">Open Window</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Stop Time (Elapsed)</label>
                    <input
                      type="datetime-local"
                      required
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-medium"
                    />
                  </div>
                </div>

                {/* Quick Add Presets in Edit Modal */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500">Add to Deadline:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = editEndTime ? new Date(editEndTime) : new Date();
                      setEditEndTime(toDatetimeLocal(new Date(cur.getTime() + 15 * 60000).toISOString()));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = editEndTime ? new Date(editEndTime) : new Date();
                      setEditEndTime(toDatetimeLocal(new Date(cur.getTime() + 30 * 60000).toISOString()));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer"
                  >
                    +30m
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRESENTATION MODAL */}
      {presentingClass && (
        <ClassCodePresentationModal
          classSession={presentingClass}
          cohort={cohorts.find((c) => c.id === presentingClass.cohortId)}
          onClose={() => setPresentingClass(null)}
          attendeeCount={attendanceRecords.filter((a) => a.classId === presentingClass.id).length}
          onRefresh={onRefresh}
        />
      )}

    </div>
  );
};
