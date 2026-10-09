import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  FileSpreadsheet,
  UserX,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { AttendanceRecord, ClassSession, Cohort, Student } from '../../types';
import { api } from '../../services/api';

interface LiveAttendanceViewProps {
  cohorts: Cohort[];
  selectedCohortId: string;
  classes: ClassSession[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  initialSelectedClassId?: string;
  onRefresh: () => void;
}

export const LiveAttendanceView: React.FC<LiveAttendanceViewProps> = ({
  cohorts,
  selectedCohortId,
  classes,
  students,
  attendanceRecords,
  initialSelectedClassId,
  onRefresh,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialSelectedClassId || classes[0]?.id || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);
  const [isBatchUpdating, setIsBatchUpdating] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync selectedClassId when classes load or initialSelectedClassId changes
  useEffect(() => {
    if (initialSelectedClassId) {
      setSelectedClassId(initialSelectedClassId);
    } else if (selectedClassId === 'all' && classes.length > 0) {
      // Auto-select first class session to provide immediate actionable context
      setSelectedClassId(classes[0].id);
    }
  }, [initialSelectedClassId, classes]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Filter attendance records for Present view
  const filteredRecords = attendanceRecords.filter((rec) => {
    if (selectedCohortId && rec.cohortId !== selectedCohortId) return false;
    if (selectedClassId !== 'all' && rec.classId !== selectedClassId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.studentName.toLowerCase().includes(q);
      const matchEmail = rec.studentEmail.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    return true;
  });

  // Calculate missing/absent students for selected class
  const absentStudents = (selectedClassId !== 'all' && selectedClass)
    ? students
        .filter((s) => !selectedCohortId || s.cohortId === selectedCohortId || s.cohortId === selectedClass.cohortId)
        .filter((s) => !attendanceRecords.some((a) => a.classId === selectedClassId && a.studentEmail.toLowerCase() === s.email.toLowerCase()))
    : (selectedClassId === 'all' && classes.length > 0)
    ? students.filter((s) => !attendanceRecords.some((a) => a.studentEmail.toLowerCase() === s.email.toLowerCase()))
    : [];

  // Filter absent students with search query
  const searchedAbsentStudents = absentStudents.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = s.name.toLowerCase().includes(q);
    const matchEmail = s.email.toLowerCase().includes(q);
    return matchName || matchEmail;
  });

  const handleExportExcel = () => {
    const dataToExport = filteredRecords.map((r, i) => {
      const cls = classes.find((c) => c.id === r.classId);
      return {
        '#': i + 1,
        'Member Name': r.studentName,
        'Email Address': r.studentEmail,
        'Phone Number': r.studentPhone || 'N/A',
        'Class Session': cls?.title || 'Class',
        'Date': cls?.date || 'N/A',
        'Secret Code Used': r.classCodeUsed,
        'Status': 'PRESENT',
        'Marked At': new Date(r.markedAt).toLocaleString(),
        'Feedback/Takeaway': r.feedback || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance_Register');
    
    const filename = `Dream_Team_Attendance_${selectedClass ? selectedClass.code : 'Cohort'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleManualStatusChange = async (
    studentEmail: string, 
    studentName: string, 
    newStatus: 'present' | 'absent',
    targetClassId?: string,
    studentPhone?: string
  ) => {
    const classIdToUse = targetClassId || (selectedClassId !== 'all' ? selectedClassId : classes[0]?.id);
    if (!classIdToUse || classIdToUse === 'all') {
      setFeedbackNotice({
        type: 'error',
        text: 'Please choose a specific class session from the dropdown above to mark attendance.',
      });
      return;
    }

    setUpdatingEmail(studentEmail);
    setFeedbackNotice(null);

    try {
      await api.manualUpdateAttendance({
        classId: classIdToUse,
        studentEmail,
        studentName,
        studentPhone,
        status: newStatus,
      });

      const targetClass = classes.find((c) => c.id === classIdToUse);
      const actionText = newStatus === 'present' ? 'marked Present' : 'marked Absent';
      setFeedbackNotice({
        type: 'success',
        text: `Successfully ${actionText}: ${studentName} (${studentEmail}) for "${targetClass?.title || 'Class Session'}" (Code: ${targetClass?.code || 'DT'}). Data synced across all devices and Cloud Firestore.`,
      });

      // Trigger parent refresh to update numbers across all views
      onRefresh();
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        text: err.message || 'Could not update manual attendance status. Please try again.',
      });
    } finally {
      setUpdatingEmail(null);
    }
  };

  const handleBatchMarkAllAbsentPresent = async () => {
    if (!selectedClass || selectedClassId === 'all') {
      alert('Please select a specific class session first.');
      return;
    }

    if (searchedAbsentStudents.length === 0) return;

    const confirmMsg = `Are you sure you want to manually mark all ${searchedAbsentStudents.length} absent students as PRESENT for "${selectedClass.title}"?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBatchUpdating(true);
    setFeedbackNotice(null);

    try {
      let count = 0;
      for (const student of searchedAbsentStudents) {
        await api.manualUpdateAttendance({
          classId: selectedClass.id,
          studentEmail: student.email,
          studentName: student.name,
          studentPhone: student.phone,
          status: 'present',
        });
        count++;
      }

      setFeedbackNotice({
        type: 'success',
        text: `Successfully marked ${count} students as Present for "${selectedClass.title}". Multi-device sync complete.`,
      });

      onRefresh();
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        text: err.message || 'Batch update encountered an issue.',
      });
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const totalCohortStudents = students.filter((s) => !selectedCohortId || s.cohortId === selectedCohortId).length;

  return (
    <div className="space-y-6">
      
      {/* Feedback Banner */}
      {feedbackNotice && (
        <div 
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all shadow-sm ${
            feedbackNotice.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedbackNotice.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live Class Register
              </span>
              <span className="text-xs font-bold text-slate-500">
                {totalCohortStudents} Total Enrolled Members in Cohort
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Real-Time Attendance Audit &amp; Check-In Logs</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live feedback showing participants who marked their attendance with secret code, plus manual override tools for facilitators.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Class selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Select Class Session</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              {classes.length === 0 && <option value="all">No Classes Available</option>}
              {classes
                .filter((c) => !selectedCohortId || c.cohortId === selectedCohortId)
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.title} (Code: {cls.code})
                  </option>
                ))}
              <option value="all">All Sessions Combined ({attendanceRecords.length} check-ins)</option>
            </select>
          </div>

          {/* Search bar */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Search Member Name / Email</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search member name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 pl-9 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-semibold"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Present vs Absent Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">View Attendance State</label>
            <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Present ({filteredRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('absent')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  statusFilter === 'absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                Absent ({searchedAbsentStudents.length})
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-md shadow-slate-100">
        
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {statusFilter === 'absent' 
                ? `${searchedAbsentStudents.length} Absent Students (Out of ${totalCohortStudents} Cohort Members)`
                : `${filteredRecords.length} Verified Check-Ins (Out of ${totalCohortStudents} Cohort Members)`}
            </span>
            {statusFilter === 'absent' && (
              <span className="text-[11px] font-bold text-slate-500">
                &bull; Use &ldquo;Mark Present&rdquo; button to manually override
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedClass && (
              <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                Secret Word: {selectedClass.code}
              </span>
            )}

            {statusFilter === 'absent' && searchedAbsentStudents.length > 0 && selectedClass && (
              <button
                type="button"
                onClick={handleBatchMarkAllAbsentPresent}
                disabled={isBatchUpdating}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isBatchUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating All...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark All Present</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {statusFilter === 'absent' ? (
          /* ABSENT LIST */
          <div className="p-4">
            {selectedClassId === 'all' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Viewing across all sessions. Select a specific class session to mark attendance overrides:</span>
                </div>
                <div className="flex gap-1.5">
                  {classes.slice(0, 3).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClassId(c.id)}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 rounded-lg border border-amber-300 font-bold text-[11px] cursor-pointer"
                    >
                      {c.title.slice(0, 15)}...
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchedAbsentStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <strong className="text-slate-900 text-sm block">
                  {absentStudents.length === 0 ? '100% Attendance Reached!' : 'No absent students match search query'}
                </strong>
                {absentStudents.length === 0 
                  ? 'Every enrolled member marked attendance for this session.'
                  : 'Try clearing your search query above.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Enrolled Member</th>
                      <th className="p-3.5">Contact Phone</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Manual Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {searchedAbsentStudents.map((s) => {
                      const isThisUpdating = updatingEmail === s.email;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5">
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-[11px] text-slate-500">{s.email}</p>
                          </td>
                          <td className="p-3.5 text-slate-700 font-mono">{s.phone || 'N/A'}</td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Absent (Not Marked)
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleManualStatusChange(s.email, s.name, 'present', selectedClassId !== 'all' ? selectedClassId : undefined, s.phone)}
                              disabled={isThisUpdating || isBatchUpdating}
                              title="Manually override and mark this student as present for this class"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all cursor-pointer shadow-sm hover:shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-wait"
                            >
                              {isThisUpdating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Marking...</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
                                  <span>Mark Present</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* PRESENT LIST */
          <div className="overflow-x-auto">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                No attendance records recorded yet for this filter.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Participant</th>
                    <th className="p-4">Class Session</th>
                    <th className="p-4">Time Recorded</th>
                    <th className="p-4">Code Used</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r) => {
                    const cls = classes.find((c) => c.id === r.classId);
                    const isThisUpdating = updatingEmail === r.studentEmail;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
                              {r.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{r.studentName}</p>
                              <p className="text-[11px] text-indigo-600 font-medium">{r.studentEmail}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-slate-700">
                          <p className="font-bold text-slate-900 truncate max-w-xs">{cls?.title || 'Class'}</p>
                          <p className="text-[11px] text-slate-500">{cls?.date || ''}</p>
                        </td>

                        <td className="p-4 text-slate-700 font-mono">
                          <span className="font-bold text-slate-900 block">
                            {new Date(r.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(r.markedAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 uppercase">
                            {r.classCodeUsed}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Present
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleManualStatusChange(r.studentEmail, r.studentName, 'absent', r.classId, r.studentPhone)}
                            disabled={isThisUpdating}
                            title="Revert back to absent status"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isThisUpdating ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Mark Absent</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
