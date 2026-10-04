import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Calendar, 
  Clock, 
  Users, 
  Radio
} from 'lucide-react';
import { ClassSession, Cohort } from '../../types';
import { DreamTeamLogo } from '../common/DreamTeamLogo';

interface ClassCodePresentationModalProps {
  classSession: ClassSession;
  cohort?: Cohort;
  onClose: () => void;
  attendeeCount: number;
}

export const ClassCodePresentationModal: React.FC<ClassCodePresentationModalProps> = ({
  classSession,
  cohort,
  onClose,
  attendeeCount,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(classSession.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border-2 border-indigo-200 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Live Badge */}
        <div className="flex flex-col items-center justify-center mb-5">
          <DreamTeamLogo size="lg" showText={false} className="mb-2" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-black uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse text-emerald-600" />
            <span>Live Class Session &bull; Attendance Window Open</span>
          </div>
        </div>

        {/* Title */}
        <p className="text-xs sm:text-sm font-black text-indigo-600 uppercase tracking-wider mb-1">
          {cohort?.name || 'Dream Team Project'}
        </p>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4 max-w-lg mx-auto">
          {classSession.title}
        </h2>

        {/* Session details */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm text-slate-600 mb-8">
          <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
            <Calendar className="w-4 h-4 text-indigo-600" />
            {new Date(classSession.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
            <Clock className="w-4 h-4 text-indigo-600" />
            {classSession.time}
          </span>
          <span className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800 font-bold">
            <Users className="w-4 h-4 text-emerald-600" />
            <strong>{attendeeCount}</strong> Logged In
          </span>
        </div>

        {/* GIANT ATTENDANCE SECRET WORD CODE BOX */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-emerald-600 rounded-3xl p-6 sm:p-10 shadow-xl text-white mb-6">
          <p className="text-xs text-indigo-100 font-black uppercase tracking-widest mb-3">
            Today&apos;s Secret Attendance Code
          </p>
          
          <div className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-widest text-emerald-300 drop-shadow-md select-all uppercase">
            {classSession.code}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-black shadow-lg transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Word for Chat'}</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 max-w-lg mx-auto mb-6 text-left">
          <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Instructions for Participants:
          </p>
          <ol className="list-decimal list-inside space-y-1 font-medium text-slate-700">
            <li>Go to the Dream Team Attendance platform on your phone/laptop</li>
            <li>Enter your registered email address</li>
            <li>Input the secret word <strong className="text-indigo-600 font-mono">{classSession.code}</strong></li>
            <li>Click <strong>Mark Attendance</strong> to record your check-in</li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black transition-all cursor-pointer"
        >
          Close Presentation Screen
        </button>

      </div>
    </div>
  );
};
