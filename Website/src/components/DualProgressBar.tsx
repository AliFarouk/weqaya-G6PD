import React from 'react';

interface DualProgressBarProps {
  hemolysisVotes: number;
  safeVotes: number;
  isConfirmedDanger?: boolean;
  className?: string;
  height?: number;
}

export default function DualProgressBar({
  hemolysisVotes,
  safeVotes,
  isConfirmedDanger = false,
  className = '',
  height = 12,
}: DualProgressBarProps) {
  if (isConfirmedDanger) {
    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs font-bold leading-none select-none text-danger">
          <span className="flex items-center gap-1">
            <span>⛔</span>
            <span>100% خطر تكسير مؤكد طبياً</span>
          </span>
          <span className="text-[11px] font-semibold text-danger/85">محظور بالإجماع العلمي</span>
        </div>
        <div
          style={{ height }}
          className="w-full bg-danger rounded-full overflow-hidden shadow-inner relative"
          role="progressbar"
          aria-valuenow={100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="خطر تكسير مؤكد طبياً 100%"
        />
      </div>
    );
  }

  const total = hemolysisVotes + safeVotes;

  if (total === 0) {
    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs text-neutral-muted font-medium">
          <span>كن أول من يشارك بتجربته في هذا الصنف</span>
          <span>0 أصوات</span>
        </div>
        <div
          style={{ height }}
          className="w-full bg-[#E5E9F2] rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="لا توجد أصوات مسجلة بعد"
        />
      </div>
    );
  }

  const hemolysisPercent = Math.round((hemolysisVotes / total) * 1000) / 10;
  const safePercent = Math.round((safeVotes / total) * 1000) / 10;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {/* Numeric Labels Above Bar */}
      <div className="flex items-center justify-between text-xs font-bold leading-none select-none">
        <span className="text-danger flex items-center gap-1">
          <span>⚠️</span>
          <span>{hemolysisPercent}% حصل تكسير ({hemolysisVotes})</span>
        </span>
        <span className="text-safe-text flex items-center gap-1">
          <span>{safePercent}% آمن معي ({safeVotes})</span>
          <span>✅</span>
        </span>
      </div>

      {/* Dual Color Segmented Bar */}
      <div
        style={{ height }}
        className="w-full bg-[#E5E9F2] rounded-full overflow-hidden flex shadow-inner relative"
        role="progressbar"
        aria-label={`نسبة التكسير ${hemolysisPercent}% مقابل نسبة الأمان ${safePercent}%`}
        aria-valuenow={hemolysisPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Red Hemolysis Segment */}
        <div
          style={{
            width: `${hemolysisPercent}%`,
            backgroundColor: '#F5365C',
          }}
          className="h-full transition-all duration-500 ease-out shrink-0"
        />
        {/* Green Safe Segment */}
        <div
          style={{
            width: `${safePercent}%`,
            backgroundColor: '#2DCE89',
          }}
          className="h-full transition-all duration-500 ease-out shrink-0"
        />
      </div>
    </div>
  );
}
