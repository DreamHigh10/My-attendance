import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, Lock, Hourglass, ShieldAlert, CheckCircle2, Flame } from 'lucide-react';

interface AttendanceCountdownProps {
  startTime?: string;
  endTime?: string;
  isOpen: boolean;
  onElapsed?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showProgressBar?: boolean;
  title?: string;
  className?: string;
}

export const AttendanceCountdown: React.FC<AttendanceCountdownProps> = ({
  startTime,
  endTime,
  isOpen,
  onElapsed,
  size = 'md',
  showProgressBar = true,
  title,
  className = '',
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [isElapsed, setIsElapsed] = useState<boolean>(false);
  const [isNotStarted, setIsNotStarted] = useState<boolean>(false);
  const [totalDurationMs, setTotalDurationMs] = useState<number>(0);
  const onElapsedCalledRef = useRef<boolean>(false);

  useEffect(() => {
    onElapsedCalledRef.current = false;
  }, [endTime]);

  useEffect(() => {
    if (!isOpen || !endTime) {
      setTimeLeftMs(0);
      setIsElapsed(true);
      return;
    }

    const calculateTime = () => {
      const now = Date.now();
      const end = new Date(endTime).getTime();
      const start = startTime ? new Date(startTime).getTime() : now - 30 * 60000;
      const total = Math.max(end - start, 1000);
      setTotalDurationMs(total);

      if (start && now < start) {
        setIsNotStarted(true);
        setIsElapsed(false);
        setTimeLeftMs(start - now);
        return;
      } else {
        setIsNotStarted(false);
      }

      const diff = end - now;
      if (diff <= 0) {
        setTimeLeftMs(0);
        setIsElapsed(true);
        if (!onElapsedCalledRef.current) {
          onElapsedCalledRef.current = true;
          if (onElapsed) onElapsed();
        }
      } else {
        setIsElapsed(false);
        setTimeLeftMs(diff);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime, isOpen, onElapsed]);

  const formattedStartTime = startTime
    ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Session start';

  const formattedEndTime = endTime
    ? new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Deadline';

  // --- STATE 1: CLOSED BY FACILITATOR ---
  if (!isOpen) {
    if (size === 'sm') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 ${className}`}>
          <Lock className="w-3 h-3 text-slate-500" />
          <span>Attendance Closed</span>
        </span>
      );
    }
    return (
      <div className={`p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
            <Lock className="w-4.5 h-4.5" />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-800">Attendance Window Closed</h5>
            <p className="text-xs text-slate-500">Check-in submissions are currently locked by the facilitator.</p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          CLOSED
        </span>
      </div>
    );
  }

  // --- STATE 2: NOT STARTED YET (Starts in future) ---
  if (isNotStarted && startTime) {
    const totalSecs = Math.floor(timeLeftMs / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const timeUntilStart = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    if (size === 'sm') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-black animate-pulse ${className}`}>
          <Hourglass className="w-3 h-3 text-amber-600" />
          <span>Starts in {timeUntilStart} (at {formattedStartTime})</span>
        </span>
      );
    }

    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-900 shadow-sm ${className}`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-950">
              Attendance Window Scheduled
            </span>
          </div>
          <div className="font-mono text-sm sm:text-base font-black text-amber-900 flex items-center gap-1.5 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300">
            <Hourglass className="w-4 h-4 text-amber-700 animate-pulse" />
            <span>Opens in {timeUntilStart}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-amber-800">
          <span>Starts at: <strong className="font-bold text-amber-950">{formattedStartTime}</strong></span>
          <span>Stops at: <strong className="font-bold text-amber-950">{formattedEndTime}</strong></span>
        </div>
      </div>
    );
  }

  // --- STATE 3: TIME ELAPSED (COUNTDOWN REACHED 00:00) ---
  if (isElapsed) {
    if (size === 'sm') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs font-black ${className}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>00:00 &bull; Window Elapsed</span>
        </span>
      );
    }

    return (
      <div className={`p-4.5 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-100/60 to-red-50 border-2 border-rose-400 text-rose-950 shadow-md ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-200/90 text-rose-700 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black uppercase px-2 py-0.5 rounded-md bg-rose-600 text-white tracking-widest">
                  00:00 &bull; ELAPSED
                </span>
                <strong className="text-sm font-black text-rose-900">Attendance Submissions Strictly Locked</strong>
              </div>
              <p className="text-xs text-rose-800 mt-0.5">
                The attendance marking countdown has stopped (closed at {formattedEndTime}). No further check-ins can be accepted.
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[11px] font-bold text-rose-700 block">Closed at</span>
            <span className="text-xs font-mono font-black text-rose-900">{formattedEndTime}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- STATE 4: ACTIVE COUNTDOWN RUNNING ---
  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = totalSeconds < 300; // < 5 mins
  const isCritical = totalSeconds < 60; // < 1 min

  // Percentage remaining
  const percentage = totalDurationMs > 0 ? Math.min(Math.max((timeLeftMs / totalDurationMs) * 100, 0), 100) : 100;

  const formattedDigits = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Small Badge
  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
        isCritical 
          ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
          : isUrgent 
          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
      } ${className}`}>
        <Clock className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-600 animate-spin' : isUrgent ? 'text-amber-600' : 'text-emerald-600'}`} />
        <span className="font-mono tracking-tight">{formattedDigits} left</span>
      </span>
    );
  }

  // Large Hero Widget (For StudentPortal & Presentations)
  if (size === 'lg') {
    return (
      <div className={`rounded-3xl p-5 sm:p-7 border-2 transition-all shadow-xl relative overflow-hidden ${
        isCritical
          ? 'bg-gradient-to-br from-rose-50 via-rose-100/90 to-red-100 border-rose-400 ring-4 ring-rose-200/60 shadow-rose-200/50'
          : isUrgent
          ? 'bg-gradient-to-br from-amber-50 via-amber-100/80 to-yellow-50 border-amber-400 ring-4 ring-amber-200/60 shadow-amber-200/50'
          : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50 border-emerald-400/80 ring-4 ring-emerald-100/60 shadow-emerald-200/40'
      } ${className}`}>
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-3 w-3 rounded-full ${
              isCritical ? 'bg-rose-500 animate-ping' : isUrgent ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'
            }`} />
            <span className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
              isCritical ? 'text-rose-900' : isUrgent ? 'text-amber-900' : 'text-emerald-900'
            }`}>
              {isCritical ? '⚡ Final Seconds! Window Closing Fast!' : isUrgent ? '⚠️ Attendance Window Closing Soon!' : '🟢 Attendance Window Open & Live'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
              isCritical ? 'bg-rose-200 text-rose-900' : isUrgent ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
            }`}>
              Live Countdown
            </span>
          </div>
        </div>

        {/* Big Numerals Display */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/80 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Time Remaining to Mark Attendance
            </span>
            <div className={`font-mono text-4xl sm:text-5xl md:text-6xl font-black tracking-widest flex items-center gap-3 ${
              isCritical ? 'text-rose-600 animate-pulse' : isUrgent ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              <Clock className={`w-8 h-8 sm:w-10 sm:h-10 ${isCritical ? 'animate-spin text-rose-600' : 'text-emerald-600'}`} />
              <span>{formattedDigits}</span>
            </div>
          </div>

          {/* Start and Stop Times */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto text-center sm:text-right">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Marking Started</span>
              <span className="text-xs sm:text-sm font-black text-slate-800">{formattedStartTime}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Marking Stops At</span>
              <span className="text-xs sm:text-sm font-black text-rose-700">{formattedEndTime}</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        {showProgressBar && (
          <div className="space-y-1.5">
            <div className="w-full bg-slate-200/90 rounded-full h-2.5 overflow-hidden p-0.5">
              <div 
                className={`h-full transition-all duration-1000 rounded-full ${
                  isCritical ? 'bg-rose-600' : isUrgent ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>{Math.round(percentage)}% of attendance window remaining</span>
              <span className="font-bold text-slate-700">Submissions close promptly at {formattedEndTime}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Medium Widget (For Cards)
  return (
    <div className={`rounded-2xl p-4 border transition-all ${
      isCritical
        ? 'bg-rose-50/90 border-rose-300 shadow-md shadow-rose-100 ring-2 ring-rose-200'
        : isUrgent
        ? 'bg-amber-50/90 border-amber-300 shadow-md shadow-amber-100'
        : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-xs'
    } ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`flex h-2.5 w-2.5 rounded-full ${
            isCritical ? 'bg-rose-500 animate-ping' : isUrgent ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'
          }`} />
          <span className={`text-xs font-black uppercase tracking-wider ${
            isCritical ? 'text-rose-900' : isUrgent ? 'text-amber-900' : 'text-emerald-900'
          }`}>
            {title || (isCritical ? 'Final Seconds Remaining!' : isUrgent ? 'Closing Soon!' : 'Attendance Window Open')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-base sm:text-lg font-black tracking-wider">
          <Clock className={`w-4 h-4 ${isCritical ? 'text-rose-600 animate-bounce' : isUrgent ? 'text-amber-600' : 'text-emerald-600'}`} />
          <span className={isCritical ? 'text-rose-700' : isUrgent ? 'text-amber-800' : 'text-emerald-700'}>
            {formattedDigits}
          </span>
        </div>
      </div>

      {showProgressBar && (
        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden mb-2">
          <div 
            className={`h-full transition-all duration-1000 rounded-full ${
              isCritical ? 'bg-rose-600' : isUrgent ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>
          Started: <strong className="text-slate-700">{formattedStartTime}</strong>
        </span>
        <span>
          Stops at: <strong className="text-slate-900">{formattedEndTime}</strong>
        </span>
      </div>
    </div>
  );
};
