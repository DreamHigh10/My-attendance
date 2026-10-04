import React from 'react';

interface DreamTeamLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
}

export const DreamTeamLogo: React.FC<DreamTeamLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  animated = true,
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-xs', height: 28 },
    md: { icon: 'w-10 h-10', text: 'text-sm', height: 40 },
    lg: { icon: 'w-14 h-14', text: 'text-base', height: 56 },
    xl: { icon: 'w-20 h-20', text: 'text-xl', height: 80 },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Geodesic Constellation Pyramid Icon */}
      <div className={`relative flex-shrink-0 ${currentSize.icon} flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full drop-shadow-md ${animated ? 'hover:scale-105 transition-transform duration-300' : ''}`}
        >
          <defs>
            {/* Blue to Gold Gradient for wireframe lines */}
            <linearGradient id="dtLineGradient" x1="15%" y1="90%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="35%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="65%" stopColor="#38bdf8" />
              <stop offset="85%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            {/* Vertical Apex gradient */}
            <linearGradient id="dtApexGradient" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            {/* Gold node glow */}
            <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </radialGradient>

            {/* Blue node glow */}
            <radialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#1e40af" />
            </radialGradient>
          </defs>

          {/* Outer Main Triangle Edges */}
          <line x1="50" y1="12" x2="20" y2="78" stroke="url(#dtLineGradient)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="12" x2="80" y2="78" stroke="url(#dtLineGradient)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="20" y1="78" x2="50" y2="90" stroke="url(#dtLineGradient)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="80" y1="78" x2="50" y2="90" stroke="url(#dtLineGradient)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Central Vertical Spine Line */}
          <line x1="50" y1="12" x2="50" y2="90" stroke="url(#dtApexGradient)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Geodesic Cross / Diagonal Lattice Structures */}
          <line x1="50" y1="35" x2="28" y2="58" stroke="url(#dtLineGradient)" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="35" x2="72" y2="58" stroke="url(#dtLineGradient)" strokeWidth="2" strokeLinecap="round" />
          
          <line x1="28" y1="58" x2="50" y2="60" stroke="url(#dtLineGradient)" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="58" x2="50" y2="60" stroke="url(#dtLineGradient)" strokeWidth="2" strokeLinecap="round" />
          
          <line x1="50" y1="35" x2="50" y2="60" stroke="url(#dtLineGradient)" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="58" x2="50" y2="90" stroke="url(#dtLineGradient)" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="58" x2="50" y2="90" stroke="url(#dtLineGradient)" strokeWidth="2" strokeLinecap="round" />

          {/* Additional Intersecting Diamond Lines for 3D depth */}
          <line x1="50" y1="12" x2="28" y2="58" stroke="url(#dtLineGradient)" strokeWidth="1.8" />
          <line x1="50" y1="12" x2="72" y2="58" stroke="url(#dtLineGradient)" strokeWidth="1.8" />
          <line x1="28" y1="58" x2="80" y2="78" stroke="url(#dtLineGradient)" strokeWidth="1.4" strokeDasharray="1 3" opacity="0.6" />
          <line x1="72" y1="58" x2="20" y2="78" stroke="url(#dtLineGradient)" strokeWidth="1.4" strokeDasharray="1 3" opacity="0.6" />

          {/* Nodes (Circles at intersections) */}
          {/* Top Apex Node */}
          <circle cx="50" cy="12" r="4.5" fill="url(#blueGlow)" filter="drop-shadow(0 0 3px #38bdf8)" />
          
          {/* Upper Middle Spine Node */}
          <circle cx="50" cy="35" r="4" fill="url(#blueGlow)" />

          {/* Center Hub Node */}
          <circle cx="50" cy="60" r="4.2" fill="url(#dtLineGradient)" />

          {/* Bottom Center Spine Node */}
          <circle cx="50" cy="90" r="4" fill="url(#dtLineGradient)" />

          {/* Left Mid Node */}
          <circle cx="28" cy="58" r="3.8" fill="url(#blueGlow)" />

          {/* Left Bottom Corner Node */}
          <circle cx="20" cy="78" r="4.2" fill="#1e3a8a" />

          {/* Right Mid Node */}
          <circle cx="72" cy="58" r="3.8" fill="url(#goldGlow)" />

          {/* Right Bottom Corner Node */}
          <circle cx="80" cy="78" r="4.2" fill="url(#goldGlow)" />
        </svg>
      </div>

      {/* Typography from Logo */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-[0.18em] uppercase font-sans text-slate-900 leading-none ${currentSize.text}`}>
            THE DREAM TEAM
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mt-0.5">
            Cohort System
          </span>
        </div>
      )}
    </div>
  );
};
