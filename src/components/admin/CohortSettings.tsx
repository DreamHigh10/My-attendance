import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Calendar, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Cohort } from '../../types';
import { api } from '../../services/api';

interface CohortSettingsProps {
  cohorts: Cohort[];
  selectedCohortId: string;
  onSelectCohort: (id: string) => void;
  onRefresh: () => void;
}

export const CohortSettings: React.FC<CohortSettingsProps> = ({
  cohorts,
  selectedCohortId,
  onSelectCohort,
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [codePrefix, setCodePrefix] = useState('DTP3');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [meetingLinkDefault, setMeetingLinkDefault] = useState('https://meet.google.com/dtp-cohort3-live');

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !codePrefix.trim()) {
      setError('Cohort name and unique code prefix are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const newCohort = await api.createCohort({
        name: name.trim(),
        codePrefix: codePrefix.trim().toUpperCase(),
        description: description.trim(),
        startDate,
        endDate,
        meetingLinkDefault: meetingLinkDefault.trim(),
        isActive: true,
      });

      setIsAddModalOpen(false);
      setName('');
      setCodePrefix('DTP4');
      setDescription('');
      onRefresh();
      onSelectCohort(newCohort.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create cohort');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Cohort Management &amp; Future Cohorts Scaling</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Switch active cohort or initialize new upcoming cohorts (Cohort 3, Cohort 4, etc.).
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Cohort</span>
        </button>
      </div>

      {/* Cohorts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cohorts.map((cohort) => {
          const isSelected = cohort.id === selectedCohortId;

          return (
            <div
              key={cohort.id}
              className={`bg-white border-2 rounded-3xl p-6 shadow-md transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 ring-4 ring-indigo-50'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Prefix: {cohort.codePrefix}
                  </span>

                  {cohort.isActive ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Active In-Session
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Upcoming / Planning
                    </span>
                  )}
                </div>

                <h4 className="text-xl font-black text-slate-900 mb-2">{cohort.name}</h4>
                <p className="text-xs font-medium text-slate-600 mb-4">{cohort.description || 'Dream Team Project training cohort.'}</p>

                {cohort.meetingLinkDefault && (
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 truncate mb-4">
                    <ExternalLink className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">Meeting: {cohort.meetingLinkDefault}</span>
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {cohort.startDate ? `Starts: ${cohort.startDate}` : 'Ongoing'}
                </span>

                <button
                  onClick={() => onSelectCohort(cohort.id)}
                  disabled={isSelected}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-black'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold'
                  }`}
                >
                  {isSelected ? '✓ Selected Active Cohort' : 'Switch to this Cohort'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Initialize Upcoming Cohort</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900">✕</button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCohort} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Cohort Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dream Team Project - Cohort 3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Code Prefix *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DTP3"
                  value={codePrefix}
                  onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Talent cohort launching in 2027"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? 'Creating...' : 'Initialize Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
