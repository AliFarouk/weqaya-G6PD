'use client';

import React from 'react';

export type CategoryFilter = 'all' | 'supermarket' | 'restaurant' | 'medication' | 'home' | 'danger' | 'safe';

interface FilterChipsProps {
  activeFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
  className?: string;
}

const FILTERS: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'الكل', icon: '🌟' },
  { id: 'supermarket', label: 'سوبر ماركت وسناكس', icon: '🛒' },
  { id: 'restaurant', label: 'مطاعم وأكل جاهز', icon: '🍽️' },
  { id: 'medication', label: 'أدوية وصيدلية', icon: '💊' },
  { id: 'home', label: 'أكل بيتي', icon: '🍲' },
  { id: 'danger', label: 'الأكثر تكسيراً', icon: '⚠️' },
  { id: 'safe', label: 'الأكثر أماناً', icon: '✅' },
];

export default function FilterChips({
  activeFilter,
  onFilterChange,
  className = '',
}: FilterChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="تصفية الأصناف حسب الفئة"
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1.5 px-0.5 select-none sm:flex-wrap ${className}`}
    >
      {FILTERS.map((chip) => {
        const isActive = activeFilter === chip.id;
        return (
          <button
            key={chip.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(chip.id)}
            className={`shrink-0 touch-target h-10 px-4 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
              isActive
                ? 'bg-brand text-white shadow-md shadow-brand/25 ring-2 ring-brand/20'
                : 'bg-white text-neutral-body border border-neutral-muted/30 hover:border-brand/40 hover:text-brand hover:bg-brand/5'
            }`}
          >
            <span className="text-sm sm:text-base">{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}
