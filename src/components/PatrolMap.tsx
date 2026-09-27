import React from 'react';
import { PatrolCheckpoint } from '../types/dutyon';

interface PatrolMapProps {
  checkpoints: PatrolCheckpoint[];
  currentCheckpointIndex: number;
  siteName?: string;
}

export const PatrolMap: React.FC<PatrolMapProps> = ({ 
  checkpoints, 
  currentCheckpointIndex,
  siteName = 'Provincial Office'
}) => {
  // Generate dynamic path through checkpoints
  const pathData = checkpoints.length > 0
    ? `M ${checkpoints.map((c) => `${c.x} ${c.y}`).join(' L ')} ${checkpoints.length > 2 ? 'Z' : ''}`
    : 'M 70 40 L 200 55 L 235 120 L 110 130 Z';

  const currentCP = checkpoints[currentCheckpointIndex];

  return (
    <div className="relative h-[185px] rounded-2xl overflow-hidden border border-[#203a4c] bg-[#101b24] shadow-inner">
      {/* Top HUD overlay */}
      <div className="absolute top-2.5 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-[#0b1620]/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 text-[9.5px] font-mono-code text-[#3FC9E9]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3FC9E9] animate-ping" />
          <span>GPS RTK: ±1.8m · HDOP 0.8</span>
        </div>
        <div className="bg-[#0b1620]/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 text-[9.5px] font-mono-code text-[#8598A8]">
          Gqeberha S.A.
        </div>
      </div>

      <svg 
        viewBox="0 0 320 185" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="tacticalBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#192834" />
            <stop offset="100%" stopColor="#0e171f" />
          </linearGradient>

          <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#253846" strokeWidth="0.5" opacity="0.4" />
          </pattern>

          <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3FC9E9" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#3FC9E9" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3FC9E9" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Background */}
        <rect width="320" height="185" fill="url(#tacticalBg)" />
        <rect width="320" height="185" fill="url(#gridPattern)" />

        {/* Faint perimeter fence line */}
        <rect x="25" y="18" width="270" height="150" rx="10" fill="none" stroke="#334756" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
        
        {/* Major Site Structural Outlines */}
        <g stroke="#2c3e4c" strokeWidth="1.5" opacity="0.8" fill="#14212b">
          <rect x="50" y="32" width="75" height="45" rx="3" />
          <rect x="155" y="35" width="110" height="65" rx="3" />
          <rect x="80" y="105" width="125" height="48" rx="3" />
        </g>

        {/* Dynamic Route Path (Dashed glowing line) */}
        <path 
          d={pathData} 
          fill="none" 
          stroke="#1FA6C9" 
          strokeWidth="2.8" 
          strokeDasharray="6 4" 
          opacity="0.85" 
        />

        {/* Officer Active Breadcrumb Trail to Current Checkpoint */}
        {currentCP && (
          <g>
            <circle cx={currentCP.x} cy={currentCP.y} r="22" fill="url(#radarSweep)">
              <animate attributeName="r" values="14;28;14" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Checkpoint Nodes */}
        {checkpoints.map((cp, idx) => {
          const isDone = cp.scanned;
          const isCurrent = idx === currentCheckpointIndex;
          const color = isDone ? '#5BCB80' : isCurrent ? '#3FC9E9' : '#8598A8';
          const label = isDone ? '✓' : cp.code ? cp.code.replace('CP-', '') : String(cp.id);

          return (
            <g key={cp.id} className="transition-all duration-300">
              {/* Outer halo */}
              <circle 
                cx={cp.x} 
                cy={cp.y} 
                r={isCurrent ? 14 : isDone ? 11 : 9} 
                fill={color} 
                opacity={isCurrent ? 0.35 : 0.15}
              />

              {/* Main Node */}
              <circle 
                cx={cp.x} 
                cy={cp.y} 
                r={isCurrent ? 10 : 8} 
                fill={isDone ? '#5BCB80' : isCurrent ? '#04222c' : '#1a2834'}
                stroke={color}
                strokeWidth={isCurrent ? 2.5 : 1.5}
              />

              {/* Text Label */}
              <text 
                x={cp.x} 
                y={cp.y + 3.2} 
                textAnchor="middle" 
                fontSize={isDone ? '10' : '8.5'} 
                fontFamily="IBM Plex Mono, monospace" 
                fontWeight="700" 
                fill={isDone ? '#04222c' : isCurrent ? '#3FC9E9' : '#c3ccd4'}
              >
                {label}
              </text>

              {/* Name Tag tooltip */}
              <text
                x={cp.x}
                y={cp.y > 140 ? cp.y - 12 : cp.y + 16}
                textAnchor="middle"
                fontSize="7.5"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="600"
                fill={isCurrent ? '#ffffff' : '#8598A8'}
                opacity={isCurrent ? 1 : 0.75}
              >
                {cp.name.length > 16 ? cp.name.slice(0, 15) + '…' : cp.name}
              </text>
            </g>
          );
        })}

        {/* Compass indicator */}
        <g transform="translate(295, 160)" opacity="0.6">
          <circle r="9" fill="#0b1620" stroke="#334756" strokeWidth="1" />
          <path d="M 0 -7 L 3 0 L 0 2 L -3 0 Z" fill="#E0574B" />
          <path d="M 0 7 L 3 0 L 0 2 L -3 0 Z" fill="#c3ccd4" />
          <text y="-8.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#E0574B">N</text>
        </g>
      </svg>

      {/* Bottom overlay */}
      <div className="absolute bottom-2 left-3 z-10 text-[9.5px] font-mono-code text-[#8598A8] bg-[#0b1620]/80 px-2 py-0.5 rounded border border-white/5">
        {siteName}
      </div>
    </div>
  );
};
