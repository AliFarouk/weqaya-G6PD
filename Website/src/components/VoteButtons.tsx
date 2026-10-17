'use client';

import React from 'react';

interface VoteButtonsProps {
  currentVote?: 'hemolysis' | 'safe' | null;
  onVote: (type: 'hemolysis' | 'safe') => void;
  disabled?: boolean;
  className?: string;
}

export default function VoteButtons({
  currentVote = null,
  onVote,
  disabled = false,
  className = '',
}: VoteButtonsProps) {
  const handleVoteClick = (type: 'hemolysis' | 'safe') => {
    if (disabled) return;
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore vibration errors
      }
    }
    onVote(type);
  };

  const isHemolysis = currentVote === 'hemolysis';
  const isSafe = currentVote === 'safe';

  return (
    <div className={`grid grid-cols-2 gap-2.5 w-full ${className}`}>
      {/* 1. Hemolysis Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleVoteClick('hemolysis')}
        aria-pressed={isHemolysis}
        className={`touch-target flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-bold transition-all active:scale-[0.98] border select-none ${
          isHemolysis
            ? 'bg-danger text-white border-danger shadow-md'
            : 'bg-danger-light text-danger-text border-danger/30 hover:bg-danger/20 hover:border-danger/50'
        }`}
      >
        <span>⚠️</span>
        <span>حصل تكسير</span>
      </button>

      {/* 2. Safe Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleVoteClick('safe')}
        aria-pressed={isSafe}
        className={`touch-target flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-bold transition-all active:scale-[0.98] border select-none ${
          isSafe
            ? 'bg-safe text-white border-safe shadow-md'
            : 'bg-safe-light text-safe-text border-safe/30 hover:bg-safe/20 hover:border-safe/50'
        }`}
      >
        <span>✅</span>
        <span>آمن معي</span>
      </button>
    </div>
  );
}
