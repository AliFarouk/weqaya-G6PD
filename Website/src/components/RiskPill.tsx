import React from 'react';
import { getRiskTier, RiskTier } from '@/lib/risk-tier';

interface RiskPillProps {
  hemolysisVotes: number;
  safeVotes: number;
  isConfirmedDanger?: boolean;
  showSublabel?: boolean;
  className?: string;
}

export default function RiskPill({
  hemolysisVotes,
  safeVotes,
  isConfirmedDanger = false,
  showSublabel = false,
  className = '',
}: RiskPillProps) {
  const info = getRiskTier(hemolysisVotes, safeVotes, isConfirmedDanger);

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <span
        style={{
          color: info.textColor,
          backgroundColor: info.bgColor,
          borderColor: info.borderColor,
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors select-none"
      >
        <span>{info.badgeIcon}</span>
        <span>{info.label}</span>
      </span>
      {showSublabel && (
        <span className="text-[11px] text-neutral-muted mt-0.5 ps-1 font-medium">
          {info.sublabel}
        </span>
      )}
    </div>
  );
}
