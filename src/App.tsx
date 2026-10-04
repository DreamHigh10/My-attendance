import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { Cohort, ClassSession, Student, AttendanceRecord, EmailCampaign } from './types';
import { api } from './services/api';
import { firebaseAuth } from './services/firebase';
import { ArchitecturalBackground } from './components/common/ArchitecturalBackground';
import { RefreshCw, GraduationCap, Sparkles } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('dtp-cohort-2');
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; photoURL?: string; isGoogleAuth?: boolean } | null>(null);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setCurrentUser({
          email: user.email,
          name: user.displayName || 'Cohort Member',
          photoURL: user.photoURL || undefined,
          isGoogleAuth: true,
        });
        localStorage.setItem('dtp_student_email', user.email);
      } else {
        const savedEmail = localStorage.getItem('dtp_student_email');
        if (savedEmail) {
          setCurrentUser({ email: savedEmail, name: 'Cohort Member', isGoogleAuth: false });
        } else {
          setCurrentUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [fetchedCohorts, fetchedClasses, fetchedStudents, fetchedCampaigns] = await Promise.all([
        api.getCohorts(),
        api.getClasses(),
        api.getStudents(),
        api.getCampaigns(),
      ]);

      setCohorts(fetchedCohorts);
      if (fetchedCohorts.length > 0 && !selectedCohortId) {
        setSelectedCohortId(fetchedCohorts[0].id);
      }
      setClasses(fetchedClasses);
      setStudents(fetchedStudents);
      setCampaigns(fetchedCampaigns);

      // Fetch all attendance records across classes
      const attendancePromises = fetchedClasses.map((c) => api.getClassAttendance(c.id));
      const allAttendance = await Promise.all(attendancePromises);
      const flatAttendance = allAttendance.flat();
      setAttendanceRecords(flatAttendance);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCohortId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const user = await firebaseAuth.signInWithGoogle();
      if (user && user.email) {
        setCurrentUser({
          email: user.email,
          name: user.displayName || 'Cohort Member',
          photoURL: user.photoURL || undefined,
          isGoogleAuth: true,
        });
        localStorage.setItem('dtp_student_email', user.email);
      }
    } catch (err) {
      console.error('Google login failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseAuth.signOut();
    } catch (e) {
      console.warn('Sign out:', e);
    }
    setCurrentUser(null);
    localStorage.removeItem('dtp_student_email');
  };

  const activeClasses = classes.filter((c) => c.isAttendanceOpen);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 p-0.5 shadow-2xl mb-4 animate-pulse">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <p className="text-sm font-black text-slate-800 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          Loading Dream Team Project Attendance Hub...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      
      {/* Moving Architectural Geometry Canvas Background */}
      <ArchitecturalBackground />

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        cohorts={cohorts}
        selectedCohortId={selectedCohortId}
        onSelectCohort={setSelectedCohortId}
        activeClassCount={activeClasses.length}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onGoogleSignInClick={handleGoogleSignIn}
        isSigningIn={isSigningIn}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'student' ? (
          <StudentPortal
            cohorts={cohorts}
            selectedCohortId={selectedCohortId}
            onSelectCohort={setSelectedCohortId}
            currentUser={currentUser}
            onGoogleSignIn={handleGoogleSignIn}
          />
        ) : (
          <AdminDashboard
            cohorts={cohorts}
            selectedCohortId={selectedCohortId}
            onSelectCohort={setSelectedCohortId}
            classes={classes}
            students={students}
            attendanceRecords={attendanceRecords}
            campaigns={campaigns}
            currentUser={currentUser}
            onAdminAuthenticated={(email, name) => {
              setCurrentUser({ email, name, isGoogleAuth: true });
              localStorage.setItem('dtp_student_email', email);
            }}
            onReturnToStudentView={() => setCurrentView('student')}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-800">Dream Team Project</span>
            <span className="text-slate-300">&bull;</span>
            <span className="font-semibold text-slate-600">Cohort 2 Attendance &amp; AI Communication System</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              55 Enrolled Members Live
            </span>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setCurrentView(currentView === 'student' ? 'admin' : 'student')}
              className="text-indigo-600 hover:text-indigo-700 font-black underline cursor-pointer"
            >
              Switch to {currentView === 'student' ? 'Admin Command Center' : 'Mark Attendance View'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
