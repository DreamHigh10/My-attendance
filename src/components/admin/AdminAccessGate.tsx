import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Mail, 
  ArrowLeft,
  UserCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { AUTHORIZED_ADMIN_EMAILS, isAuthorizedAdmin } from '../../constants/admins';
import { DreamTeamLogo } from '../common/DreamTeamLogo';
import { firebaseAuth } from '../../services/firebase';

interface AdminAccessGateProps {
  currentUser?: { email: string; name: string } | null;
  onAdminAuthenticated: (email: string, name: string) => void;
  onReturnToStudentView: () => void;
}

export const AdminAccessGate: React.FC<AdminAccessGateProps> = ({
  currentUser,
  onAdminAuthenticated,
  onReturnToStudentView,
}) => {
  const [inputEmail, setInputEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const user = await firebaseAuth.signInWithGoogle();
      if (user && user.email) {
        if (isAuthorizedAdmin(user.email)) {
          onAdminAuthenticated(user.email, user.displayName || 'Dream Team Admin');
        } else {
          setError(`Access denied. The account (${user.email}) is not on the authorized administrator whitelist.`);
        }
      }
    } catch (err: any) {
      setError('Google Sign-In was cancelled or failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = inputEmail.trim().toLowerCase();

    if (!trimmed) {
      setError('Please enter your administrator email.');
      return;
    }

    if (isAuthorizedAdmin(trimmed)) {
      // Find human-readable label
      const name = trimmed.includes('ogungbade')
        ? 'Engr. Kehinde Ogungbade'
        : trimmed.includes('aduoluwaseyi')
        ? 'Adu Oluwaseyi'
        : trimmed.includes('paulstanley')
        ? 'Paul Stanley Tobechukwu'
        : 'Chiemela B.';
      onAdminAuthenticated(trimmed, name);
    } else {
      setError(`Access Restricted: "${trimmed}" is not authorized to access the Admin Hub.`);
    }
  };

  const handleQuickSelectAdmin = (adminEmail: string) => {
    const name = adminEmail.includes('ogungbade')
      ? 'Engr. Kehinde Ogungbade'
      : adminEmail.includes('aduoluwaseyi')
      ? 'Adu Oluwaseyi'
      : adminEmail.includes('paulstanley')
      ? 'Paul Stanley Tobechukwu'
      : 'Chiemela B.';
    onAdminAuthenticated(adminEmail, name);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-14 animate-fade-in">
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md text-center">
        
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500" />

        <DreamTeamLogo size="lg" showText={false} className="justify-center mb-4" />

        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 ring-8 ring-amber-50">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>

        <span className="inline-block px-3.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-black rounded-full uppercase tracking-wider mb-2">
          Restricted Area &bull; Role-Based Access
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Admin Command Center
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 mb-6 max-w-md mx-auto">
          Access to class secret code management, student registers, and AI email broadcasting is strictly restricted to authorized facilitators.
        </p>

        {currentUser && !isAuthorizedAdmin(currentUser.email) && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left font-medium">
            <p className="font-bold flex items-center gap-1.5 text-rose-900 mb-1">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Current Account Not Authorized:</span>
            </p>
            <p className="font-mono">{currentUser.email}</p>
            <p className="mt-1 text-slate-600">
              Please sign in with one of the authorized facilitator accounts below.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action: Google Login */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold border-2 border-slate-300 shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] cursor-pointer mb-5"
        >
          {isSigningIn ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Verifying Google Credentials...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Authorized Google Account</span>
            </>
          )}
        </button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400 font-bold uppercase">Or verify by email</span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleManualEmailSubmit} className="space-y-3 text-left mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Authorized Admin Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="e.g. Ogungbadekehinde19@gmail.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-600 pl-10"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Verify &amp; Unlock Admin Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Authorized Facilitator Quick Badges */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
            Authorized Facilitator Accounts (Click to quick-auth):
          </span>
          <div className="space-y-1.5">
            {AUTHORIZED_ADMIN_EMAILS.map((email) => (
              <button
                key={email}
                type="button"
                onClick={() => handleQuickSelectAdmin(email)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs font-bold text-slate-800 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate font-mono">{email}</span>
                </div>
                <span className="text-[10px] text-indigo-600 font-extrabold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  Select &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Return Button */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onReturnToStudentView}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Student Attendance Portal</span>
          </button>
        </div>

      </div>
    </div>
  );
};
