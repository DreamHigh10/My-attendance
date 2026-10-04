import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { DreamTeamLogo } from './DreamTeamLogo';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (email: string, name: string) => void;
  suggestedEmail?: string;
  errorMessage?: string | null;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  suggestedEmail = 'ogungbadekehinde19@gmail.com',
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'europe-west2.run.app';

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentHost);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    onSelectAccount(customEmail.trim(), name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <DreamTeamLogo size="md" showText={false} className="justify-center mb-3" />

        <div className="flex items-center justify-center gap-2 mb-1">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <h3 className="text-xl font-black text-slate-900">Google Sign-in</h3>
        </div>
        <p className="text-xs text-slate-500 font-medium mb-5">
          Select your Google account to access attendance tracking and admin hub:
        </p>

        {/* 1-Click Fast Account Button for Lead Admin / User */}
        <div className="space-y-2 mb-4 text-left">
          <button
            onClick={() => onSelectAccount(suggestedEmail, 'Engr. Kehinde Ogungbade')}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/90 hover:bg-indigo-100 border-2 border-indigo-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                KO
              </div>
              <div className="text-left truncate">
                <p className="text-xs font-black text-slate-900 group-hover:text-indigo-900 truncate">
                  {suggestedEmail}
                </p>
                <p className="text-[10px] text-indigo-700 font-bold truncate">
                  Engr. Kehinde Ogungbade (Admin Facilitator)
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" />
          </button>
        </div>

        {/* Or enter any Google Email */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span className="bg-white px-2 text-slate-400 font-bold uppercase">Or sign in with another email</span>
          </div>
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-3 text-left">
          <div>
            <input
              type="email"
              required
              placeholder="e.g. participant@gmail.com"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Your Full Name (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue with this Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Optional domain helper accordion */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-left">
          <button
            type="button"
            onClick={() => setShowDomainHelp(!showDomainHelp)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>How to authorize this domain in Firebase Console</span>
            </span>
            {showDomainHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDomainHelp && (
            <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-2 animate-fade-in">
              <p>To enable native Google OAuth popups for this preview URL:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium">
                <li>Go to <strong className="text-slate-900">Firebase Console &rarr; Authentication &rarr; Settings</strong>.</li>
                <li>Scroll to <strong className="text-slate-900">Authorized domains</strong> &rarr; Click <strong className="text-indigo-600">Add domain</strong>.</li>
                <li>Add your app domain:
                  <div className="mt-1 flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-300 font-mono text-[10px]">
                    <span className="truncate flex-1">{currentHost}</span>
                    <button
                      onClick={handleCopyDomain}
                      className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                      title="Copy Domain"
                    >
                      {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
