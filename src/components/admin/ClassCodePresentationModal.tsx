import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Calendar, 
  Clock, 
  Users, 
  Radio,
  PlusCircle,
  Lock,
  Hourglass
} from 'lucide-react';
import { ClassSession, Cohort } from '../../types';
import { DreamTeamLogo } from '../common/DreamTeamLogo';
import { AttendanceCountdown } from '../common/AttendanceCountdown';
import { api } from '../../services/api';

interface ClassCodePresentationModalProps {
  classSession: ClassSession;
  cohort?: Cohort;
  onClose: () => void;
  attendeeCount: number;
  onRefresh?: () => void;
}

export const ClassCodePresentationModal: React.FC<ClassCodePresentationModalProps> = ({
  classSession: initialClassSession,
  cohort,
  onClose,
  attendeeCount,
  onRefresh,
}) => {
  const [currentSession, setCurrentSession] = useState<ClassSession>(initialClassSession);
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setCurrentSession(initialClassSession);
  }, [initialClassSession]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSession.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddMinutes = async (additionalMinutes: number) => {
    setIsUpdating(true);
    try {
      const updated = await api.updateClassWindow(currentSession.id, {
        additionalMinutes,
      });
      setCurrentSession(updated);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to extend time');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseAttendanceNow = async () => {
    if (!confirm('Close the attendance window right now for this class session?')) return;
    setIsUpdating(true);
    try {
      const updated = await api.toggleClassAttendance(currentSession.id, false);
      setCurrentSession(updated);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to close window');
    } finally {
      setIsUpdating(false);
    }
  };

  const isWindowElapsed = currentSession.attendanceEndTime 
    ? Date.now() > new Date(currentSession.attendanceEndTime).getTime()
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border-2 border-indigo-200 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden text-center my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Live Badge */}
        <div className="flex flex-col items-center justify-center mb-4">
          <DreamTeamLogo size="lg" showText={false} className="mb-2" />
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider ${
            isWindowElapsed || !currentSession.isAttendanceOpen
              ? 'bg-rose-100 border border-rose-300 text-rose-800'
              : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
          }`}>
            <Radio className={`w-4 h-4 ${isWindowElapsed ? '' : 'animate-pulse text-emerald-600'}`} />
            <span>
              {isWindowElapsed || !currentSession.isAttendanceOpen 
                ? 'Attendance Window Closed (Time Elapsed)' 
                : 'Live Class Session &bull; Attendance Window Open'}
            </span>
          </div>
        </div>

        {/* Title */}
        <p className="text-xs sm:text-sm font-black text-indigo-600 uppercase tracking-wider mb-1">
          {cohort?.name || 'Dream Team Project'}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4 max-w-lg mx-auto">
          {currentSession.title}
        </h2>

        {/* Live Countdown Clock Widget */}
        <div className="mb-5 max-w-lg mx-auto text-left">
          <AttendanceCountdown
            startTime={currentSession.attendanceStartTime}
            endTime={currentSession.attendanceEndTime}
            isOpen={currentSession.isAttendanceOpen && !isWindowElapsed}
            size="lg"
            onElapsed={() => {
              setCurrentSession(prev => ({ ...prev, isAttendanceOpen: false }));
            }}
          />
        </div>

        {/* Quick Time Extension Bar for Admin */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Facilitator Timer Controls:</span>
          <button
            onClick={() => handleAddMinutes(5)}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+5 Mins</span>
          </button>
          <button
            onClick={() => handleAddMinutes(15)}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+15 Mins</span>
          </button>
          {currentSession.isAttendanceOpen && !isWindowElapsed && (
            <button
              onClick={handleCloseAttendanceNow}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Now</span>
            </button>
          )}
        </div>

        {/* GIANT ATTENDANCE SECRET WORD CODE BOX */}
        <div className={`rounded-3xl p-6 sm:p-9 shadow-xl text-white mb-6 transition-all ${
          isWindowElapsed || !currentSession.isAttendanceOpen
            ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600'
            : 'bg-gradient-to-br from-violet-600 via-indigo-600 to-emerald-600'
        }`}>
          <p className="text-xs text-indigo-100 font-black uppercase tracking-widest mb-2">
            Today&apos;s Secret Attendance Code
          </p>
          
          <div className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-widest text-emerald-300 drop-shadow-md select-all uppercase">
            {currentSession.code}
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
            <li>Go to the attendance website on your phone or computer</li>
            <li>Enter your registered email address</li>
            <li>Input the secret word <strong className="text-indigo-600 font-mono">{currentSession.code}</strong> before the countdown expires</li>
            <li>Once the timer hits 00:00, submissions are strictly locked</li>
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
