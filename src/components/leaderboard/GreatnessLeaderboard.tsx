import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Flame, 
  HelpCircle, 
  Search, 
  CheckCircle2, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  User, 
  Medal,
  ChevronRight,
  Sparkles,
  Crown
} from 'lucide-react';
import { LeaderboardUserEntry } from '../../utils/leaderboard';
import { PointsBreakdownModal } from '../common/PointsBreakdownModal';

interface GreatnessLeaderboardProps {
  entries: LeaderboardUserEntry[];
  cohortName?: string;
  userEmail?: string;
  onSelectStudentEmail?: (email: string) => void;
}

export const GreatnessLeaderboard: React.FC<GreatnessLeaderboardProps> = ({
  entries,
  cohortName = 'Cohort 2',
  userEmail,
  onSelectStudentEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'top10'>('all');

  const normalizedUserEmail = (userEmail || '').trim().toLowerCase();
  const currentUserEntry = entries.find(
    (e) => e.email.toLowerCase() === normalizedUserEmail
  );

  // Filter entries
  const filtered = entries.filter((entry) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.email.toLowerCase().includes(q) ||
      (entry.phone && entry.phone.includes(q))
    );
  });

  const displayEntries = filterMode === 'top10' ? filtered.slice(0, 10) : filtered;

  // Find max attended / points for relative bar widths
  const maxPoints = Math.max(...entries.map((e) => e.totalPoints), 10);
  const maxAttended = Math.max(...entries.map((e) => e.totalAttended), 1);

  // Top 3 Podium
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];

  return (
    <div id="greatness-leaderboard" className="w-full bg-white border-2 border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
      
      {/* Top Gradient Banner */}
      <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-amber-400 via-indigo-600 to-emerald-500" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 flex-shrink-0">
            <Trophy className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                Official Leaderboard
              </span>
              <span className="text-xs font-bold text-slate-500">
                {cohortName} Consistency Standings
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <span>The Greatness Rank</span>
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* How points are calculated button */}
          <button
            onClick={() => setIsPointsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-2xs"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>How Points Are Awarded?</span>
          </button>

          {/* Filter toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setFilterMode('top10')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMode === 'top10'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 10
            </button>
          </div>
        </div>
      </div>

      {/* PERSONAL RANK CALLOUT: Shown prominently when user email is supplied or detected */}
      {currentUserEntry && (
        <div className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none transform translate-x-16 -translate-y-16" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl text-white border border-white/30 shadow-inner">
                #{currentUserEntry.rank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                    Your Greatness Rank
                  </span>
                  <span className="text-xs text-indigo-100">
                    {currentUserEntry.email}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {currentUserEntry.name}
                </h3>
              </div>
            </div>

            {/* User Stat Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center">
                <span className="text-[10px] text-indigo-100 block uppercase font-bold">Total Points</span>
                <span className="text-lg font-black text-white">{currentUserEntry.totalPoints} pts</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center">
                <span className="text-[10px] text-indigo-100 block uppercase font-bold">Classes Attended</span>
                <span className="text-lg font-black text-white">{currentUserEntry.totalAttended}</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center">
                <span className="text-[10px] text-indigo-100 block uppercase font-bold">Attendance Rate</span>
                <span className="text-lg font-black text-emerald-300">{currentUserEntry.attendanceRate}%</span>
              </div>
            </div>
          </div>

          {/* Sub-breakdown badges */}
          <div className="mt-3 pt-3 border-t border-white/15 flex flex-wrap items-center gap-3 text-xs text-indigo-100">
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Attendance: {currentUserEntry.attendancePoints} pts ({currentUserEntry.totalAttended} classes)
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-semibold">
              <MessageSquare className="w-3.5 h-3.5 text-sky-300" /> Comments: {currentUserEntry.commentPoints} pts ({currentUserEntry.commentsCount} comments)
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-300" /> Speed Bonus: {currentUserEntry.speedPoints} pts ({currentUserEntry.speedBonusCount} times in first 5)
            </span>
          </div>
        </div>
      )}

      {/* TOP 3 PODIUM (Visible on desktop & tablet) */}
      {entries.length >= 3 && !searchQuery && (
        <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* 2nd Place */}
          {top2 && (
            <div 
              onClick={() => onSelectStudentEmail?.(top2.email)}
              className="bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-200 rounded-2xl p-4 text-center transition-all hover:scale-[1.01] cursor-pointer relative"
            >
              <div className="w-9 h-9 rounded-full bg-slate-300 text-slate-800 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-xs">
                #2
              </div>
              <Medal className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="font-black text-slate-900 text-sm truncate">{top2.name}</p>
              <p className="text-[11px] text-slate-500 truncate mb-2">{top2.email}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-200/80 text-slate-800 text-xs font-black">
                {top2.totalPoints} pts &bull; {top2.totalAttended} classes
              </div>
            </div>
          )}

          {/* 1st Place (Champion) */}
          {top1 && (
            <div 
              onClick={() => onSelectStudentEmail?.(top1.email)}
              className="bg-gradient-to-b from-amber-50 to-amber-100/60 hover:from-amber-100 hover:to-amber-200/60 border-2 border-amber-300 rounded-2xl p-4 text-center transition-all hover:scale-[1.02] cursor-pointer relative shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-black text-base flex items-center justify-center mx-auto mb-1 shadow-md shadow-amber-500/30">
                #1
              </div>
              <Crown className="w-6 h-6 text-amber-500 mx-auto mb-1 fill-amber-400" />
              <p className="font-black text-slate-900 text-base truncate">{top1.name}</p>
              <p className="text-[11px] text-slate-600 truncate mb-2">{top1.email}</p>
              <div className="inline-block px-3.5 py-1.5 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs">
                {top1.totalPoints} pts &bull; {top1.totalAttended} classes
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div 
              onClick={() => onSelectStudentEmail?.(top3.email)}
              className="bg-amber-50/50 hover:bg-amber-100/50 border-2 border-amber-200/70 rounded-2xl p-4 text-center transition-all hover:scale-[1.01] cursor-pointer relative"
            >
              <div className="w-9 h-9 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-xs">
                #3
              </div>
              <Medal className="w-6 h-6 text-amber-700 mx-auto mb-1" />
              <p className="font-black text-slate-900 text-sm truncate">{top3.name}</p>
              <p className="text-[11px] text-slate-500 truncate mb-2">{top3.email}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                {top3.totalPoints} pts &bull; {top3.totalAttended} classes
              </div>
            </div>
          )}

        </div>
      )}

      {/* Search Input */}
      <div className="my-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search leaderboard by name, email, or rank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 pl-10"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* LEADERBOARD TABLE WITH VISUAL BAR CHARTS */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
              <th className="py-3 px-3 sm:px-4 text-center w-14">Rank</th>
              <th className="py-3 px-3 sm:px-4">Member</th>
              <th className="py-3 px-3 sm:px-4 min-w-[200px]">Attendance Level &amp; Visual Chart</th>
              <th className="py-3 px-3 sm:px-4 text-center">Score Breakdown</th>
              <th className="py-3 px-3 sm:px-4 text-right">Total Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {displayEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                  No participants matched your search criteria.
                </td>
              </tr>
            ) : (
              displayEntries.map((entry) => {
                const isCurrentUser =
                  normalizedUserEmail &&
                  entry.email.toLowerCase() === normalizedUserEmail;

                // Relative bar percentages
                const attendanceBarPercent = Math.min(
                  100,
                  Math.round((entry.totalAttended / Math.max(1, entry.totalClasses || maxAttended)) * 100)
                );

                const pointsBarPercent = Math.min(
                  100,
                  Math.round((entry.totalPoints / maxPoints) * 100)
                );

                return (
                  <tr
                    key={entry.email}
                    onClick={() => onSelectStudentEmail?.(entry.email)}
                    className={`transition-colors cursor-pointer group ${
                      isCurrentUser
                        ? 'bg-indigo-50/80 hover:bg-indigo-100/80 font-bold border-l-4 border-l-indigo-600'
                        : entry.rank <= 3
                        ? 'bg-amber-50/20 hover:bg-amber-50/50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Rank Medal / Badge */}
                    <td className="py-3 px-3 sm:px-4 text-center font-black">
                      {entry.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500 text-white shadow-xs">
                          🥇
                        </span>
                      ) : entry.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300 text-slate-800 shadow-xs">
                          🥈
                        </span>
                      ) : entry.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700 text-white shadow-xs">
                          🥉
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold">
                          #{entry.rank}
                        </span>
                      )}
                    </td>

                    {/* Member Info */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate flex items-center gap-1.5">
                            <span>{entry.name}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.2 rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{entry.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Bar Chart showing Attendance Level */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-bold">
                            {entry.totalAttended} of {entry.totalClasses} classes attended
                          </span>
                          <span className="font-black text-emerald-600">
                            {entry.attendanceRate}%
                          </span>
                        </div>
                        
                        {/* Attendance Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex shadow-inner">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              entry.attendanceRate >= 80
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : entry.attendanceRate >= 50
                                ? 'bg-gradient-to-r from-amber-500 to-indigo-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${attendanceBarPercent}%` }}
                          />
                        </div>

                        {/* Relative Points Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${pointsBarPercent}%` }}
                            title={`Overall Points Weight: ${entry.totalPoints} pts`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Breakdown Badges */}
                    <td className="py-3 px-3 sm:px-4 text-center">
                      <div className="inline-flex items-center gap-1 text-[10px]">
                        <span 
                          className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200" 
                          title={`${entry.totalAttended} classes attended x 10 pts = ${entry.attendancePoints} pts`}
                        >
                          {entry.attendancePoints}a
                        </span>
                        <span 
                          className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"
                          title={`${entry.commentsCount} comments submitted x 5 pts = ${entry.commentPoints} pts`}
                        >
                          {entry.commentPoints}c
                        </span>
                        <span 
                          className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200"
                          title={`${entry.speedBonusCount} speed bonuses = ${entry.speedPoints} pts`}
                        >
                          +{entry.speedPoints}s
                        </span>
                      </div>
                    </td>

                    {/* Total Points */}
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <div className="inline-block text-right">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {entry.totalPoints}
                        </span>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          pts
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Attendance (10 pts/class)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Note / Comment (5 pts)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>First 5 Sign-in Speed (+5..+1 pts)</span>
          </span>
        </div>

        <button
          onClick={() => setIsPointsModalOpen(true)}
          className="text-indigo-600 hover:text-indigo-700 font-bold underline cursor-pointer text-xs"
        >
          View detailed scoring rules popup &rarr;
        </button>
      </div>

      {/* Popup Modal */}
      <PointsBreakdownModal
        isOpen={isPointsModalOpen}
        onClose={() => setIsPointsModalOpen(false)}
      />

    </div>
  );
};
