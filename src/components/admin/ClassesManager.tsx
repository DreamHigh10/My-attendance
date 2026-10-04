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
  Sparkles
} from 'lucide-react';
import { ClassSession, Cohort, AttendanceRecord } from '../../types';
import { api } from '../../services/api';
import { ClassCodePresentationModal } from './ClassCodePresentationModal';

interface ClassesManagerProps {
  cohorts: Cohort[];
  selectedCohortId: string;
  classes: ClassSession[];
  attendanceRecords: AttendanceRecord[];
  onRefresh: () => void;
  onNavigateToTab: (tab: 'attendance' | 'emails' | 'roster', extraState?: any) => void;
}

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
  const [attendanceWindowMinutes, setAttendanceWindowMinutes] = useState(120);
  const [meetingUrl, setMeetingUrl] = useState(selectedCohort?.meetingLinkDefault || 'https://meet.google.com/dtp-cohort2-live');
  const [notes, setNotes] = useState('');

  const handleCopyCode = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(codeToCopy);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleAttendance = async (classSession: ClassSession) => {
    try {
      await api.toggleClassAttendance(classSession.id, !classSession.isAttendanceOpen);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance window');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !code.trim()) {
      setError('Please provide class title, date, and secret attendance word.');
      return;
    }

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
        attendanceWindowMinutes,
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

  const handleUpdateClassCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    setIsSubmitting(true);
    try {
      await api.updateClass(editingClass.id, {
        code: editingClass.code.trim().toUpperCase(),
        title: editingClass.title,
        instructorName: editingClass.instructorName,
      });
      setEditingClass(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update code');
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
            <span>Class Sessions &amp; Secret Attendance Codes</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create class sessions, type your secret attendance words (e.g. <strong className="text-slate-800">CATALYST, VELOCITY</strong>), and control live check-in windows.
          </p>
        </div>

        <button
          onClick={() => {
            setFormCohortId(selectedCohortId);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Class &amp; Set Secret Code</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {filteredClasses.map((cls) => {
          const classAttendees = attendanceRecords.filter((a) => a.classId === cls.id);
          const cohort = cohorts.find((c) => c.id === cls.cohortId);

          return (
            <div
              key={cls.id}
              className={`bg-white border-2 rounded-3xl p-6 transition-all shadow-md flex flex-col justify-between ${
                cls.isAttendanceOpen
                  ? 'border-indigo-500/40 shadow-indigo-500/5 ring-4 ring-indigo-50/50'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {cohort?.name || 'Cohort 2'}
                  </span>

                  {/* Toggle Attendance Switch */}
                  <button
                    onClick={() => handleToggleAttendance(cls)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                      cls.isAttendanceOpen
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cls.isAttendanceOpen ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                    <span>{cls.isAttendanceOpen ? 'Attendance Live' : 'Closed'}</span>
                  </button>
                </div>

                <h4 className="text-base sm:text-lg font-black text-slate-900 mb-2 leading-snug">
                  {cls.title}
                </h4>

                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600 mb-4">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    {new Date(cls.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    {cls.time}
                  </span>
                  <span className="flex items-center gap-1.5 col-span-2 font-medium">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    Facilitator: <strong className="text-slate-900 font-bold">{cls.instructorName}</strong>
                  </span>
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
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      {copiedCode === cls.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === cls.code ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      title="Edit Code Word"
                      onClick={() => setEditingClass(cls)}
                      className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:text-indigo-600 transition-all shadow-2xs"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-xs"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Project Screen</span>
                  </button>

                  <button
                    onClick={() => onNavigateToTab('attendance', { classId: cls.id })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                  >
                    <span>View Logs</span>
                  </button>

                  <button
                    onClick={() => onNavigateToTab('emails', { classTitle: cls.title, classCode: cls.code })}
                    title="Broadcast Code via AI Email"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-indigo-600 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE NEW CLASS MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                <span>Schedule Class &amp; Type Secret Code</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-sm font-bold">✕</button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl mb-4 font-semibold">
                {error}
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
                  placeholder="e.g. Tuesday Masterclass: System Design & APIs"
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
                  <label className="block text-slate-700 font-bold mb-1">Time Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. 18:00 - 20:30 WAT"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
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
                  placeholder="e.g. CATALYST, VELOCITY, HORIZON, DISCOVERY"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-violet-50 border-2 border-indigo-400 focus:border-indigo-600 rounded-2xl px-4 py-3 text-base font-mono font-black text-indigo-900 uppercase tracking-wider"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  You will type this code out and share it during class for students to mark their attendance.
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
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? 'Saving...' : 'Set Code & Schedule Class'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT CODE MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900">Change Secret Attendance Word</h3>
              <button onClick={() => setEditingClass(null)} className="text-slate-400 hover:text-slate-900">✕</button>
            </div>

            <form onSubmit={handleUpdateClassCode} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Class Title</label>
                <input
                  type="text"
                  value={editingClass.title}
                  onChange={(e) => setEditingClass({ ...editingClass, title: e.target.value })}
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? 'Updating...' : 'Save New Code'}
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
        />
      )}

    </div>
  );
};
