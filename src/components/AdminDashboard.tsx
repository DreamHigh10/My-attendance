import React, { useState } from 'react';
import { 
  Radio, 
  Users, 
  Mail, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Settings, 
  ShieldCheck,
  Calendar,
  BellRing
} from 'lucide-react';
import { Cohort, ClassSession, Student, AttendanceRecord, EmailCampaign } from '../types';
import { StatsCards } from './common/StatsCards';
import { UpcomingClassesSection } from './common/UpcomingClassesSection';
import { ClassesManager } from './admin/ClassesManager';
import { LiveAttendanceView } from './admin/LiveAttendanceView';
import { RosterManager } from './admin/RosterManager';
import { EmailAutomationHub } from './admin/EmailAutomationHub';
import { CohortSettings } from './admin/CohortSettings';
import { AdminBottomNav, AdminTabType } from './admin/AdminBottomNav';
import { DreamTeamLogo } from './common/DreamTeamLogo';

interface AdminDashboardProps {
  cohorts: Cohort[];
  selectedCohortId: string;
  onSelectCohort: (id: string) => void;
  classes: ClassSession[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  campaigns: EmailCampaign[];
  currentUser?: { email: string; name: string; photoURL?: string } | null;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  cohorts,
  selectedCohortId,
  onSelectCohort,
  classes,
  students,
  attendanceRecords,
  campaigns,
  currentUser,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabType>('classes');
  const [tabExtraState, setTabExtraState] = useState<any>(null);

  const handleNavigateToTab = (tab: AdminTabType, extraState?: any) => {
    setTabExtraState(extraState || null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];

  const handleSendReminderForClass = (cls: ClassSession) => {
    handleNavigateToTab('emails', {
      classTitle: cls.title,
      classCode: cls.code,
      templateType: 'reminder',
    });
  };

  const cohortAttendance = attendanceRecords.filter((a) => !selectedCohortId || a.cohortId === selectedCohortId);
  const cohortStudents = students.filter((s) => !selectedCohortId || s.cohortId === selectedCohortId);
  const activeClassCount = classes.filter((c) => (!selectedCohortId || c.cohortId === selectedCohortId) && c.isAttendanceOpen).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6 pb-28">
      
      {/* Top Banner with Logo & KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-100">
        <div className="flex items-start gap-3.5">
          <DreamTeamLogo size="lg" showText={false} className="hidden sm:flex mt-1" />
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin Command Center</span>
              </span>

              {currentUser && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
                  Logged in: <strong>{currentUser.email}</strong>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {selectedCohort?.name || 'Dream Team Project'}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 max-w-2xl">
              Type secret attendance words, track check-ins in real time against the <strong className="text-slate-800 font-bold">{cohortStudents.length} registered members</strong>, and send personalized email broadcasts.
            </p>
          </div>
        </div>

        {/* Cohort Switcher */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200 flex-shrink-0">
          <Layers className="w-5 h-5 text-indigo-600" />
          <div className="text-left">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Cohort</span>
            <select
              aria-label="Switch Active Cohort"
              value={selectedCohortId}
              onChange={(e) => onSelectCohort(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-black text-slate-900 focus:outline-none cursor-pointer pr-2"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <StatsCards
        cohort={selectedCohort}
        classes={classes}
        students={students}
        attendanceRecords={attendanceRecords}
      />

      {/* ACTIVE TAB CONTENT */}
      {activeTab === 'classes' && (
        <div className="space-y-8">
          <ClassesManager
            cohorts={cohorts}
            selectedCohortId={selectedCohortId}
            classes={classes}
            attendanceRecords={attendanceRecords}
            onRefresh={onRefresh}
            onNavigateToTab={handleNavigateToTab}
          />

          {/* UPCOMING CLASSES SCHEDULE & QUICK REMINDER DISPATCH */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-100">
            <UpcomingClassesSection
              classes={classes.filter((c) => !selectedCohortId || c.cohortId === selectedCohortId)}
              cohort={selectedCohort}
              isAdminView={true}
              onSendReminderEmail={handleSendReminderForClass}
            />
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <LiveAttendanceView
          cohorts={cohorts}
          selectedCohortId={selectedCohortId}
          classes={classes}
          students={students}
          attendanceRecords={attendanceRecords}
          initialSelectedClassId={tabExtraState?.classId}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === 'emails' && (
        <EmailAutomationHub
          cohorts={cohorts}
          selectedCohortId={selectedCohortId}
          classes={classes}
          students={students}
          campaigns={campaigns}
          initialClassTitle={tabExtraState?.classTitle}
          initialClassCode={tabExtraState?.classCode}
          initialTemplateType={tabExtraState?.templateType}
          currentUser={currentUser}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === 'roster' && (
        <RosterManager
          cohorts={cohorts}
          selectedCohortId={selectedCohortId}
          students={students}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === 'cohorts' && (
        <CohortSettings
          cohorts={cohorts}
          selectedCohortId={selectedCohortId}
          onSelectCohort={onSelectCohort}
          onRefresh={onRefresh}
        />
      )}

      {/* DOCKED APP BOTTOM NAVIGATION BAR (Icons on top, text below) */}
      <AdminBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setTabExtraState(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        attendanceCount={cohortAttendance.length}
        rosterCount={cohortStudents.length}
        activeClassCount={activeClassCount}
      />

    </div>
  );
};
