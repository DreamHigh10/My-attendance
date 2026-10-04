import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  Check, 
  Trash2, 
  FileSpreadsheet, 
  Sparkles, 
  Phone,
  Mail,
  Award
} from 'lucide-react';
import { Cohort, Student } from '../../types';
import { api } from '../../services/api';
import { firebaseStorage } from '../../services/firebase';

interface RosterManagerProps {
  cohorts: Cohort[];
  selectedCohortId: string;
  students: Student[];
  onRefresh: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  cohorts,
  selectedCohortId,
  students,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single Add form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Bulk Upload state
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (selectedCohortId && s.cohortId !== selectedCohortId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchPhone = (s.phone || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide student full name and registered email.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await api.addStudent({
        cohortId: selectedCohortId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });

      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const mapped = rawJson.map((row) => {
          const keys = Object.keys(row);
          const nameKey = keys.find((k) => /name/i.test(k)) || keys[0];
          const emailKey = keys.find((k) => /email|mail/i.test(k)) || keys[1];
          const phoneKey = keys.find((k) => /phone|mobile|tel|contact/i.test(k));

          return {
            name: String(row[nameKey || ''] || '').trim(),
            email: String(row[emailKey || ''] || '').trim().toLowerCase(),
            phone: phoneKey ? String(row[phoneKey]).trim() : '',
          };
        }).filter((item) => item.name && item.email && item.email.includes('@'));

        setParsedRows(mapped);
      } catch (err: any) {
        alert('Could not parse file. Please upload a valid CSV or Excel (.xlsx) file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommitBulkImport = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.bulkImportStudents(selectedCohortId, parsedRows);
      
      // Store upload log in Firebase
      await firebaseStorage.uploadRosterFileLog({
        fileName: 'Cohort_Roster_Upload.xlsx',
        fileSize: parsedRows.length * 128,
        recordsCount: parsedRows.length,
        uploadedBy: 'Admin',
        students: parsedRows,
      });

      setUploadSuccessMessage(res.message + ' (Synced to Firebase)');
      setParsedRows([]);
      setTimeout(() => {
        setIsImportModalOpen(false);
        setUploadSuccessMessage(null);
      }, 1500);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportRoster = () => {
    const data = filteredStudents.map((s, idx) => ({
      '#': idx + 1,
      'Full Name': s.name,
      'Email Address': s.email,
      'Phone Number': s.phone || 'N/A',
      'Cohort': selectedCohort?.name || 'Dream Team Project',
      'Attendance Score (%)': `${(s as any).attendanceRate ?? 100}%`,
      'Classes Attended': `${(s as any).attendanceCount ?? 0} / ${(s as any).totalClasses ?? 0}`,
      'Status': s.status.toUpperCase(),
      'Registration Date': s.registeredAt,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cohort_Roster');
    XLSX.writeFile(wb, `Dream_Team_Cohort_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (confirm(`Are you sure you want to remove ${student.name} from the registered cohort list?`)) {
      try {
        await api.deleteStudent(student.id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to remove member');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                Registered Member Roster
              </span>
              <span className="text-xs font-bold text-slate-500">
                {filteredStudents.length} Members Uploaded
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Cohort Member Roster &amp; Authorized Email List</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Only participants with their emails registered in this list can access and mark attendance on the platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Upload CSV / Excel</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>

            <button
              onClick={handleExportRoster}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Roster</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Search member by full name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 pl-9 focus:outline-none focus:border-indigo-600 font-semibold"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-md shadow-slate-100">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
            {filteredStudents.length} Registered Members in {selectedCohort?.name}
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              No members found in this roster.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4">Member Name &amp; Email</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Attendance Score</th>
                  <th className="p-4">Enrollment Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => {
                  const rate = (s as any).attendanceRate ?? 100;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-400 font-mono font-semibold">{idx + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{s.name}</p>
                            <p className="text-[11px] text-indigo-600 font-medium">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-700 font-mono">
                        {s.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {s.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="font-black font-mono text-slate-900 text-xs">{rate}%</span>
                          <span className="text-[10px] text-slate-500">({(s as any).attendanceCount ?? 0} classes)</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ACTIVE MEMBER
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteStudent(s)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SINGLE ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Add Member to {selectedCohort?.name}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900">✕</button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSingleStudent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chioma Okafor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. chioma.okafor@dreamteam.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. +234 812 987 6543"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT EXCEL / CSV MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>Upload Excel / CSV Members List</span>
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-900">✕</button>
            </div>

            {uploadSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-4 flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-600 rounded-3xl p-6 text-center transition-all bg-slate-50">
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="font-bold text-slate-900 text-sm mb-1">
                  Upload Excel (.xlsx, .xls) or CSV file
                </p>
                <p className="text-[11px] text-slate-500 mb-3 font-medium">
                  File columns: <strong>Name, Email, Phone</strong>
                </p>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
              </div>

              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block">
                    Parsed {parsedRows.length} Members Ready to Import:
                  </span>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl bg-white p-2">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.slice(0, 15).map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold text-slate-900">{r.name}</td>
                            <td className="p-2 text-indigo-600">{r.email}</td>
                            <td className="p-2 text-slate-600">{r.phone || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={parsedRows.length === 0 || isSubmitting}
                  onClick={handleCommitBulkImport}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {isSubmitting ? 'Importing...' : `Import ${parsedRows.length} Members to Cohort`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
