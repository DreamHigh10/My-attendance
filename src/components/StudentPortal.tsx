import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  KeyRound, 
  Mail, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle, 
  Award, 
  RefreshCw, 
  ExternalLink,
  Zap,
  Layers,
  ShieldCheck,
  UserCheck,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { firebaseAuth } from '../services/firebase';
import { Cohort, ClassSession, Student, StudentLookupResponse } from '../types';
import { UpcomingClassesSection } from './common/UpcomingClassesSection';
import { DreamTeamLogo } from './common/DreamTeamLogo';

interface StudentPortalProps {
  cohorts: Cohort[];
  selectedCohortId: string;
  onSelectCohort: (id: string) => void;
  currentUser?: { email: string; name: string } | null;
  onGoogleSignIn?: (email: string, name: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  cohorts,
  selectedCohortId,
  onSelectCohort,
  currentUser,
  onGoogleSignIn,
}) => {
  // Input fields
  const [emailInput, setEmailInput] = useState<string>(() => {
    return currentUser?.email || localStorage.getItem('dtp_student_email') || '';
  });
  const [code, setCode] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  // Lookup & Match State
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [matchedStudentData, setMatchedStudentData] = useState<StudentLookupResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Verification & Submission states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [markedSuccessData, setMarkedSuccessData] = useState<{
    message: string;
    record: any;
    classSession: ClassSession;
    studentStats?: any;
  } | null>(null);

  // Active Classes
  const [activeClasses, setActiveClasses] = useState<ClassSession[]>([]);

  useEffect(() => {
    loadActiveClasses();
  }, [selectedCohortId]);

  useEffect(() => {
    if (emailInput.trim() && emailInput.includes('@')) {
      handleLookupStudent(emailInput.trim());
    }
  }, [selectedCohortId]);

  const loadActiveClasses = async () => {
    try {
      const classes = await api.getClasses(selectedCohortId);
      const active = classes.filter((c) => c.isAttendanceOpen);
      setActiveClasses(active);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  // Instant lookup of student email in registered cohort roster
  const handleLookupStudent = async (targetEmail: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setMatchedStudentData(null);
      setLookupError(null);
      return;
    }

    setIsLookingUp(true);
    setLookupError(null);

    try {
      const res = await api.lookupStudent(cleanEmail, selectedCohortId);
      if (res.found && res.student) {
        setMatchedStudentData(res);
        setLookupError(null);
        localStorage.setItem('dtp_student_email', cleanEmail);
      } else {
        setMatchedStudentData(null);
        setLookupError(res.message || 'This email is not registered in the cohort roster.');
      }
    } catch (err: any) {
      setMatchedStudentData(null);
      setLookupError(err.message || 'This email is not registered in the cohort roster. Please contact the administrator.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Real Firebase Google Sign-In helper
  const handleFirebaseGoogleSignIn = async () => {
    setIsLookingUp(true);
    setLookupError(null);
    try {
      const user = await firebaseAuth.signInWithGoogle();
      if (user && user.email) {
        setEmailInput(user.email);
        await handleLookupStudent(user.email);
        if (onGoogleSignIn) {
          onGoogleSignIn(user.email, user.displayName || 'Cohort Member');
        }
      }
    } catch (err: any) {
      console.error('Firebase sign in failed:', err);
      // Fallback to quick email lookup
      if (currentUser?.email) {
        setEmailInput(currentUser.email);
        handleLookupStudent(currentUser.email);
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  // Submit attendance code
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailInput.trim() || !matchedStudentData?.student) {
      setErrorMessage('Please enter your registered email address first.');
      return;
    }

    if (!code.trim()) {
      setErrorMessage('Please enter the secret attendance code given in class.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await api.markAttendance({
        code: code.trim().toUpperCase(),
        studentEmail: matchedStudentData.student.email,
        studentName: matchedStudentData.student.name,
        studentPhone: matchedStudentData.student.phone,
        feedback: feedback.trim(),
      });

      if (res.success) {
        setMarkedSuccessData({
          message: res.message,
          record: res.record,
          classSession: res.classSession || (activeClasses[0] || {}),
          studentStats: res.studentStats,
        });

        // Trigger confetti celebration
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
          });
        } catch (e) {
          // ignore
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not mark attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setCode('');
    setMarkedSuccessData(null);
    setErrorMessage(null);
    setFeedback('');
    loadActiveClasses();
    if (emailInput) handleLookupStudent(emailInput);
  };

  const currentCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      
      {/* Radiant Top Hero Header with Logo */}
      <div className="text-center mb-8 sm:mb-12">
        <DreamTeamLogo size="lg" showText={false} className="justify-center mb-4" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 via-indigo-100 to-emerald-100 border border-indigo-200/60 text-indigo-900 text-xs sm:text-sm font-extrabold mb-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{currentCohort?.name || 'Dream Team Project Cohort 2'} Attendance</span>
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Mark Your Daily Class <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">Attendance</span>
        </h2>
        <p className="mt-3 text-base sm:text-lg font-medium text-slate-600 max-w-xl mx-auto">
          Sign in or enter your registered email to bring out your profile, then input the secret class code shared by the facilitator.
        </p>
      </div>

      {/* SUCCESS CONFIRMATION STATE */}
      {markedSuccessData ? (
        <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-500/10 text-center relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500" />
          
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50 shadow-inner">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>

          <span className="inline-block px-3.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black rounded-full uppercase tracking-wider mb-3">
            ✓ Attendance Verified &amp; Recorded
          </span>

          <h3 className="text-2xl sm:text-4xl font-black text-slate-900 mb-2">
            You&apos;ve marked your attendance for today&apos;s class! 🎉
          </h3>
          <p className="text-slate-600 text-base sm:text-lg max-w-lg mx-auto mb-8 font-medium">
            Welcome, <strong className="text-slate-900">{markedSuccessData.record.studentName}</strong>! Your attendance is confirmed and synchronized with the admin dashboard.
          </p>

          {/* Record Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8 text-left">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Participant</span>
              <p className="text-sm font-black text-slate-900 truncate">{markedSuccessData.record.studentName}</p>
              <p className="text-xs text-indigo-600 font-semibold truncate">{markedSuccessData.record.studentEmail}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Time Recorded</span>
              <p className="text-sm font-black text-slate-900">
                {new Date(markedSuccessData.record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {new Date(markedSuccessData.record.markedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Secret Word Used</span>
              <p className="text-base font-mono font-black text-emerald-600 uppercase">
                {markedSuccessData.record.classCodeUsed}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Status: Present
              </span>
            </div>
          </div>

          {/* Attendance Track Record Banner */}
          {markedSuccessData.studentStats && (
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-4.5 max-w-xl mx-auto mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Cohort Attendance Record</h4>
                  <p className="text-xs font-medium text-slate-600">
                    {markedSuccessData.studentStats.totalAttended} of {markedSuccessData.studentStats.totalCohortClasses} classes attended
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600">
                  {markedSuccessData.studentStats.attendanceRate}%
                </span>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Overall Score</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleResetForAnother}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold transition-all border border-slate-200"
            >
              Mark for Another Class
            </button>
            {markedSuccessData.classSession?.meetingUrl && (
              <a
                href={markedSuccessData.classSession.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold transition-all shadow-lg shadow-indigo-600/25"
              >
                <span>Return to Live Class Room</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      ) : (

        /* MAIN ATTENDANCE CARD */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
          
          {/* Active Class Live Banner */}
          {activeClasses.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-xs text-emerald-900 font-bold">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                <span>Class Session in Progress: <strong className="text-slate-900 font-black">{activeClasses[0].title}</strong></span>
              </div>
              <div className="text-xs font-semibold text-emerald-700">
                Facilitator: {activeClasses[0].instructorName}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Verification Notice</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleMarkAttendance} className="space-y-6">
            
            {/* STEP 1: EMAIL ADDRESS / GOOGLE SIGN IN */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>Step 1: Your Registered Cohort Email <span className="text-rose-500">*</span></span>
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  Matches your registration
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email address"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (e.target.value.includes('@')) {
                        handleLookupStudent(e.target.value);
                      }
                    }}
                    onBlur={() => {
                      if (emailInput.trim()) {
                        handleLookupStudent(emailInput.trim());
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 placeholder-slate-400 transition-all pl-11"
                  />
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
                </div>

                <button
                  type="button"
                  onClick={handleFirebaseGoogleSignIn}
                  className="px-4 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google Sign In</span>
                </button>
              </div>

              {/* Lookup Error / Not Registered alert */}
              {lookupError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Email Not Found in Cohort 2 Roster</span>
                    <span>{lookupError} Only enrolled members uploaded to the platform can mark attendance.</span>
                  </div>
                </div>
              )}
            </div>

            {/* VERIFIED PARTICIPANT DETAILS CARD (Brought out immediately upon email match) */}
            {matchedStudentData && matchedStudentData.student && (
              <div className="bg-gradient-to-br from-indigo-50/80 via-white to-emerald-50/80 border-2 border-indigo-200/80 rounded-2xl p-5 sm:p-6 shadow-md animate-fade-in space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Verified Member of {currentCohort?.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-700">
                    Status: Active Member
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Name</span>
                    <p className="font-black text-slate-900 text-sm">{matchedStudentData.student.name}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Phone Number</span>
                    <p className="font-bold text-slate-800 text-xs font-mono">{matchedStudentData.student.phone || 'Provided on registration'}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email Address</span>
                    <p className="font-bold text-indigo-600 text-xs truncate">{matchedStudentData.student.email}</p>
                  </div>
                </div>

                {/* Previous Attendance Stats Streak */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Previous Classes Attended: <strong className="text-slate-900">{matchedStudentData.totalAttended ?? 0}</strong>
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {matchedStudentData.attendanceRate ?? 100}% Rate
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: SECRET ATTENDANCE WORD / CODE INPUT */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Step 2: Enter Today&apos;s Secret Class Attendance Code <span className="text-rose-500">*</span></span>
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  Sent by facilitator during class
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Type secret word (e.g. CATALYST, VELOCITY, DREAMER)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-4 py-4 text-lg sm:text-2xl font-mono font-black tracking-widest text-slate-900 placeholder-slate-400 transition-all uppercase text-center"
                />
              </div>
            </div>

            {/* Optional Feedback */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Quick Class Note / Takeaway (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Understood today's full stack architecture!"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* MARK ATTENDANCE BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting || !matchedStudentData?.student || !code.trim()}
              className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base sm:text-lg shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Validating Code &amp; Marking Attendance...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                  <span>Mark My Attendance for Today</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

          </form>

        </div>
      )}

      {/* UPCOMING CLASSES SCHEDULE & PREPARATION */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <UpcomingClassesSection
          classes={activeClasses}
          cohort={currentCohort}
          isAdminView={false}
          onSelectClassForAttendance={(cls) => {
            setCode(cls.code);
            window.scrollTo({ top: 120, behavior: 'smooth' });
          }}
        />
      </div>

      {/* Cohort Help Footer */}
      <div className="mt-10 text-center text-xs font-medium text-slate-500">
        <p>
          Dream Team Project Cohort 2 &bull; Facilitated by Engr. Kehinde Ogungbade &amp; Team
        </p>
      </div>

    </div>
  );
};
