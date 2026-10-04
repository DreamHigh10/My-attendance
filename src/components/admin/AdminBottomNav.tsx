import React from 'react';
import { 
  Radio, 
  CheckCircle2, 
  Mail, 
  Users, 
  Settings,
  Sparkles
} from 'lucide-react';

export type AdminTabType = 'classes' | 'attendance' | 'emails' | 'roster' | 'cohorts';

interface AdminBottomNavProps {
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
  attendanceCount?: number;
  rosterCount?: number;
  activeClassCount?: number;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({
  activeTab,
  onTabChange,
  attendanceCount = 0,
  rosterCount = 55,
  activeClassCount = 1,
}) => {
  const navItems = [
    {
      id: 'classes' as AdminTabType,
      label: 'Classes',
      icon: Radio,
      badge: activeClassCount > 0 ? 'Live' : undefined,
      badgeColor: 'bg-emerald-500',
    },
    {
      id: 'attendance' as AdminTabType,
      label: 'Register',
      icon: CheckCircle2,
      badge: attendanceCount > 0 ? String(attendanceCount) : undefined,
      badgeColor: 'bg-indigo-600',
    },
    {
      id: 'emails' as AdminTabType,
      label: 'AI Mail',
      icon: Mail,
      badge: 'AI',
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'roster' as AdminTabType,
      label: 'Roster',
      icon: Users,
      badge: String(rosterCount),
      badgeColor: 'bg-blue-600',
    },
    {
      id: 'cohorts' as AdminTabType,
      label: 'Config',
      icon: Settings,
    },
  ];

  return (
    <nav aria-label="Admin Navigation" className="fixed bottom-3 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-2xl border-2 border-slate-200/90 shadow-2xl rounded-3xl p-1.5 pointer-events-auto flex items-center justify-around gap-1 ring-1 ring-black/5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-indigo-50 to-indigo-100/70 text-indigo-700 font-black scale-[1.04] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 font-bold'
              }`}
            >
              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center mb-1">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-indigo-600' : 'text-slate-500'}`} />
                
                {item.badge && (
                  <span className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-black text-white ${item.badgeColor} shadow-2xs leading-tight`}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Text Label Below Icon */}
              <span className={`text-[11px] tracking-tight leading-none ${isActive ? 'text-indigo-900 font-black' : 'text-slate-600 font-bold'}`}>
                {item.label}
              </span>

              {/* Active Dot Indicator */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
