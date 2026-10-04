import React from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  LogOut,
  Flame,
  Radio
} from 'lucide-react';
import { Cohort } from '../types';
import { DreamTeamLogo } from './common/DreamTeamLogo';

interface NavbarProps {
  currentView: 'student' | 'admin';
  onViewChange: (view: 'student' | 'admin') => void;
  cohorts: Cohort[];
  selectedCohortId: string;
  onSelectCohort: (cohortId: string) => void;
  activeClassCount: number;
  currentUser?: { email: string; name: string; photoURL?: string; isGoogleAuth?: boolean } | null;
  onSignOut?: () => void;
  onGoogleSignInClick?: () => void;
  isSigningIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  cohorts,
  selectedCohortId,
  onSelectCohort,
  activeClassCount,
  currentUser,
  onSignOut,
  onGoogleSignInClick,
  isSigningIn,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-2xl shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Authentic Dream Team Logo */}
          <div className="flex items-center gap-3">
            <DreamTeamLogo size="md" showText={true} />
            
            <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Firebase Cloud Live
            </span>
          </div>

          {/* Controls & Nav */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Cohort Selector */}
            <div className="hidden md:flex items-center gap-2 bg-slate-100/90 border border-slate-200 rounded-2xl px-3 py-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <select
                aria-label="Select Cohort"
                value={selectedCohortId}
                onChange={(e) => onSelectCohort(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id} className="text-slate-800">
                    {cohort.name} {cohort.isActive ? '(Active)' : ''}
                  </option>
                ))}
              </select>
              {activeClassCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Live
                </span>
              )}
            </div>

            {/* Google / Account Status */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-2xl px-3 py-1.5">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="text-left text-xs max-w-[120px] truncate hidden sm:block">
                  <p className="font-bold text-slate-800 truncate leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                </div>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    title="Sign Out"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors ml-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : onGoogleSignInClick ? (
              <button
                onClick={onGoogleSignInClick}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="hidden xs:inline">{isSigningIn ? 'Connecting...' : 'Google Login'}</span>
              </button>
            ) : null}

            {/* View Switcher Button */}
            <nav aria-label="Portal Mode" className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => onViewChange('student')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'student'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Student</span>
              </button>

              <button
                onClick={() => onViewChange('admin')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin Hub</span>
              </button>
            </nav>

          </div>

        </div>
      </div>
    </header>
  );
};
