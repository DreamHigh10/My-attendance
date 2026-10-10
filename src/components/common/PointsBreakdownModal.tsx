import React from 'react';
import { 
  X, 
  Award, 
  CheckCircle2, 
  MessageSquare, 
  Zap, 
  Trophy, 
  Sparkles, 
  Info,
  Clock,
  Flame,
  ShieldCheck
} from 'lucide-react';

interface PointsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PointsBreakdownModal: React.FC<PointsBreakdownModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white border-2 border-slate-200/90 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-scale-in text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-amber-400 via-indigo-600 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Points System modal"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center ring-4 ring-amber-50">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Scoring System
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              The Greatness Rank
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 mb-6">
          Points are automatically calculated in real-time to celebrate members who show exemplary consistency, participation, and punctuality:
        </p>

        {/* Rules Cards */}
        <div className="space-y-3.5 mb-6">
          
          {/* Rule 1: Attendance */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">Class Attendance</h4>
                <span className="text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                  +10 Points
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Earned for every class session you attend and successfully mark your attendance.
              </p>
            </div>
          </div>

          {/* Rule 2: Comment */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">Class Note / Comment</h4>
                <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                  +5 Points
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Earned whenever you share a key takeaway, reflection, or comment while signing your attendance.
              </p>
            </div>
          </div>

          {/* Rule 3: Speed bonus */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">Punctuality Speed Bonus</h4>
                <span className="text-xs font-black text-amber-700 bg-white px-2 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
                  +1 to +5 Points
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Rewarded to the very first 5 participants who mark their attendance for each session:
              </p>

              {/* Badges for the first 5 */}
              <div className="grid grid-cols-5 gap-1.5 mt-2.5 text-center">
                <div className="bg-white p-1.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 block">1st</span>
                  <span className="text-xs font-black text-amber-600">+5 pts</span>
                </div>
                <div className="bg-white p-1.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 block">2nd</span>
                  <span className="text-xs font-black text-amber-600">+4 pts</span>
                </div>
                <div className="bg-white p-1.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 block">3rd</span>
                  <span className="text-xs font-black text-amber-600">+3 pts</span>
                </div>
                <div className="bg-white p-1.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 block">4th</span>
                  <span className="text-xs font-black text-amber-600">+2 pts</span>
                </div>
                <div className="bg-white p-1.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 block">5th</span>
                  <span className="text-xs font-black text-amber-600">+1 pt</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Example Callout */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-6 flex items-center gap-3 text-xs text-slate-700">
          <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <span>
            <strong>Pro Tip:</strong> By signing first (+5 pts) and adding your key learning comment (+5 pts) in addition to attending (+10 pts), you can maximize up to <strong>20 points</strong> in a single class!
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition-all shadow-md cursor-pointer text-center"
        >
          Got it! View Leaderboard
        </button>

      </div>
    </div>
  );
};
