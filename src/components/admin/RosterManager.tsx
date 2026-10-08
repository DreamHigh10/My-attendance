import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
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
  Award,
  Clock,
  CheckSquare,
  Square,
  AlertTriangle,
  FileText,
  RefreshCw,
  FolderArchive,
  Layers,
  Info
} from 'lucide-react';
import { Cohort, Student, ImportedFileLog } from '../../types';
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
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Imported Files Logs & Management
  const [importedFiles, setImportedFiles] = useState<ImportedFileLog[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ImportedFileLog | null>(null);
  const [deleteWithStudents, setDeleteWithStudents] = useState(true);

  // Batch Multi-Select for Deletion
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];

  // Load imported files logs
  const loadImportedFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await api.getImportedFiles(selectedCohortId);
      setImportedFiles(files);
    } catch (err) {
      console.warn('Could not load imported files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadImportedFiles();
    setSelectedStudentIds(new Set());
  }, [selectedCohortId]);

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

  const processFile = (file: File) => {
    setUploadedFileMeta({ name: file.name, size: file.size });
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setError('The uploaded sheet is empty. Please check your file.');
          setParsedRows([]);
          return;
        }

        const mapped = rawJson.map((row) => {
          const keys = Object.keys(row);
          
          // Check for separate first and last name columns
          const firstNameKey = keys.find((k) => /first.*name|fname/i.test(k));
          const lastNameKey = keys.find((k) => /last.*name|surname|lname/i.test(k));
          const nameKey = keys.find((k) => /^(full_?)?name|student|participant|member/i.test(k)) || keys[0];

          let rawName = '';
          if (firstNameKey && lastNameKey) {
            rawName = `${row[firstNameKey] || ''} ${row[lastNameKey] || ''}`.trim();
          } else {
            rawName = String(row[nameKey || ''] || '').trim();
          }

          const emailKey = keys.find((k) => /email|e-?mail|contact.*email/i.test(k)) || keys.find((k) => String(row[k]).includes('@')) || keys[1];
          const phoneKey = keys.find((k) => /phone|mobile|tel|whatsapp|contact.*num/i.test(k));

          const rawEmail = String(row[emailKey || ''] || '').trim().toLowerCase();
          const rawPhone = phoneKey ? String(row[phoneKey]).trim() : '';

          return {
            name: rawName || rawEmail.split('@')[0],
            email: rawEmail,
            phone: rawPhone,
          };
        }).filter((item) => item.name && item.email && item.email.includes('@'));

        if (mapped.length === 0) {
          setError('No valid rows containing names and email addresses found. Ensure your columns include "Name" and "Email".');
          setParsedRows([]);
          return;
        }

        setParsedRows(mapped);
      } catch (err: any) {
        setError('Could not parse file. Please upload a valid CSV, TSV, or Excel (.xlsx / .xls) file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCommitBulkImport = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    const fileName = uploadedFileMeta?.name || 'Cohort_Roster_Import.xlsx';
    const fileSize = uploadedFileMeta?.size || parsedRows.length * 128;

    try {
      const res = await api.bulkImportStudents(selectedCohortId, parsedRows, {
        fileName,
        fileSize,
        uploadedBy: 'Admin Facilitator',
      });

      setUploadSuccessMessage(res.message);
      setParsedRows([]);
      setUploadedFileMeta(null);
      await loadImportedFiles();
      onRefresh();

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#8b5cf6'],
      });

      setTimeout(() => {
        setIsImportModalOpen(false);
        setUploadSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImportedFile = async () => {
    if (!fileToDelete) return;
    setIsSubmitting(true);

    try {
      await api.deleteImportedFile(fileToDelete.id, deleteWithStudents);
      setFileToDelete(null);
      await loadImportedFiles();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete imported file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedStudentIds.size === 0) return;
    const count = selectedStudentIds.size;
    if (!confirm(`Are you sure you want to permanently delete ${count} selected student(s) from the roster?`)) {
      return;
    }

    setIsDeletingBulk(true);
    try {
      await api.bulkDeleteStudents(Array.from(selectedStudentIds));
      setSelectedStudentIds(new Set());
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete selected students');
    } finally {
      setIsDeletingBulk(false);
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
    if (confirm(`Are you sure you want to remove ${student.name} (${student.email}) from the registered cohort list?`)) {
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
                {selectedCohort?.name} &bull; {filteredStudents.length} Active Participants
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Cohort Roster &amp; File Management
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportRoster}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Roster (Excel)</span>
            </button>

            <button
              onClick={() => {
                setError(null);
                setParsedRows([]);
                setUploadedFileMeta(null);
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Import Excel / CSV</span>
            </button>

            <button
              onClick={() => {
                setError(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Search & Bulk Selection Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by participant name, registered email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600 pl-10"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {selectedStudentIds.size > 0 && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-2xl animate-fade-in">
              <span className="text-xs font-bold text-rose-800">
                {selectedStudentIds.size} Selected
              </span>
              <button
                onClick={handleBulkDeleteSelected}
                disabled={isDeletingBulk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files & Import History Drawer */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900">
              Uploaded Files &amp; Import History
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
              {importedFiles.length} {importedFiles.length === 1 ? 'File' : 'Files'}
            </span>
          </div>

          <button
            onClick={loadImportedFiles}
            title="Refresh Files"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {importedFiles.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No files uploaded yet. Click <strong>"Import Excel / CSV"</strong> above to upload student rosters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {importedFiles.map((file) => (
              <div 
                key={file.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 truncate">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs font-black text-slate-900 truncate" title={file.fileName}>
                        {file.fileName}
                      </span>
                    </div>
                    <button
                      onClick={() => setFileToDelete(file)}
                      title="Delete Imported File"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500">
                    <p className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span><strong>{file.recordsCount}</strong> roster records</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Uploaded {new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                  <button
                    onClick={() => setFileToDelete(file)}
                    className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    Delete File &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Participant Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Phone</th>
                <th className="p-4 text-center">Attendance Rate</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    No registered participants match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudentIds.has(s.id);
                  const rate = (s as any).attendanceRate ?? 100;
                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-indigo-50/40 transition-colors ${isSelected ? 'bg-indigo-50/60' : ''}`}
                    >
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleSelectStudent(s.id)}
                          className="text-slate-500 hover:text-indigo-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                            {s.name.charAt(0)}
                          </div>
                          <span>{s.name}</span>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-600">
                        {s.email}
                      </td>

                      <td className="p-4 text-slate-500">
                        {s.phone || '—'}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                          rate >= 75 ? 'bg-emerald-100 text-emerald-800' : rate >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {rate}%
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                          {s.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteStudent(s)}
                          title="Delete participant"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete File Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              Delete Uploaded File?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              You are deleting the file record: <strong className="text-slate-900">{fileToDelete.fileName}</strong> ({fileToDelete.recordsCount} records).
            </p>

            {/* Option Checkbox */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteWithStudents}
                  onChange={(e) => setDeleteWithStudents(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Also remove all {fileToDelete.recordsCount} imported members from roster
                  </span>
                  <span className="text-[11px] text-slate-500">
                    If checked, the students imported with this specific file will be deleted from the active cohort roster.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteImportedFile}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Excel/CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-black text-slate-900">
                  Import Cohort Roster (Excel / CSV)
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {error}
              </div>
            )}

            {uploadSuccessMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            {/* Drag and drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                isDragging ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                Click to browse or drag and drop your spreadsheet here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports Excel (.xlsx, .xls) and CSV (.csv, .tsv). Headers like <strong>Name</strong>, <strong>Email</strong>, and <strong>Phone</strong> are automatically recognized.
              </p>
            </div>

            {/* Parsed Rows Preview */}
            {parsedRows.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    Preview: {parsedRows.length} Valid Records Ready to Import
                  </span>
                  {uploadedFileMeta && (
                    <span className="text-[11px] font-mono text-slate-500">
                      {uploadedFileMeta.name} ({(uploadedFileMeta.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 15).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-800">{row.name}</td>
                          <td className="p-2.5 font-mono text-slate-600">{row.email}</td>
                          <td className="p-2.5 text-slate-500">{row.phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 15 && (
                  <p className="text-[11px] text-slate-400 text-center font-medium">
                    + {parsedRows.length - 15} more participants in this file
                  </p>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCommitBulkImport}
                disabled={parsedRows.length === 0 || isSubmitting}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing Roster...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Import {parsedRows.length} Participants</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Single Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              Add New Participant
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a single student to {selectedCohort?.name}.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSingleStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john.doe@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. +234 803 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="mt-6 pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
