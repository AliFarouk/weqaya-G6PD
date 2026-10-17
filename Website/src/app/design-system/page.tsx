'use client';

import React, { useState } from 'react';
import Logo from '@/components/Logo';
import RiskPill from '@/components/RiskPill';
import DualProgressBar from '@/components/DualProgressBar';
import VoteButtons from '@/components/VoteButtons';
import FilterChips, { CategoryFilter } from '@/components/FilterChips';
import EmergencyBanner from '@/components/EmergencyBanner';

export default function DesignSystemPage() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [demoVote, setDemoVote] = useState<'hemolysis' | 'safe' | null>('safe');
  const [searchValue, setSearchValue] = useState('طعمية سخنة');

  return (
    <div className="min-h-screen bg-neutral-canvas pb-20">
      <EmergencyBanner />

      <header className="bg-white border-b border-neutral-muted/20 py-4 px-6 shadow-sm sticky top-0 z-20">
        <div className="max-w-content mx-auto flex items-center justify-between">
          <Logo variant="compact" />
          <div className="flex items-center gap-3">
            <span className="text-xs bg-brand-light text-brand font-bold px-3 py-1 rounded-full border border-brand/20">
              معرض النظام البصري (Dev-Only)
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-content mx-auto px-4 md:px-8 pt-8 space-y-12">
        {/* Title */}
        <div>
          <h1 className="font-cairo font-black text-3xl text-neutral-title">
            نظام تصميم وقاية (Weqaya Design System)
          </h1>
          <p className="text-sm text-neutral-body mt-1">
            مرجع المكونات البصرية ولوحة الألوان ومستويات الظلال ونظام الطباعة العربي لمرضى أنيميا الفول.
          </p>
        </div>

        {/* 1. Brand Palette */}
        <section className="card-level-1 p-6 space-y-4">
          <h2 className="font-cairo font-bold text-xl text-neutral-title border-b pb-2">
            1. لوحة الألوان المعتمدة (Brand Colors Palette)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="p-4 rounded-md bg-[#5E72E4] text-white flex flex-col justify-between h-28 shadow-sm">
              <span className="font-bold text-xs">Brand Primary</span>
              <span className="text-[11px] font-mono opacity-90">#5E72E4</span>
            </div>
            <div className="p-4 rounded-md bg-[#3C51C2] text-white flex flex-col justify-between h-28 shadow-sm">
              <span className="font-bold text-xs">Primary Text (AA)</span>
              <span className="text-[11px] font-mono opacity-90">#3C51C2</span>
            </div>
            <div className="p-4 rounded-md bg-[#2DCE89] text-white flex flex-col justify-between h-28 shadow-sm">
              <span className="font-bold text-xs">Safe Green</span>
              <span className="text-[11px] font-mono opacity-90">#2DCE89</span>
            </div>
            <div className="p-4 rounded-md bg-[#139E69] text-white flex flex-col justify-between h-28 shadow-sm">
              <span className="font-bold text-xs">Safe Text (AA)</span>
              <span className="text-[11px] font-mono opacity-90">#139E69</span>
            </div>
            <div className="p-4 rounded-md bg-[#F5365C] text-white flex flex-col justify-between h-28 shadow-sm">
              <span className="font-bold text-xs">Danger Red</span>
              <span className="text-[11px] font-mono opacity-90">#F5365C</span>
            </div>
            <div className="p-4 rounded-md bg-[#FB6340] text-white flex flex-col justify-between h-28 shadow-sm">
              <span className="font-bold text-xs">Caution Orange</span>
              <span className="text-[11px] font-mono opacity-90">#FB6340</span>
            </div>
          </div>
        </section>

        {/* 2. Logo Variants */}
        <section className="card-level-1 p-6 space-y-4">
          <h2 className="font-cairo font-bold text-xl text-neutral-title border-b pb-2">
            2. متغيرات الشعار (Logo Variants)
          </h2>
          <div className="flex flex-wrap items-center gap-8 bg-neutral-canvas p-6 rounded-xl border border-neutral-muted/20">
            <div>
              <span className="text-xs text-neutral-muted block mb-2 font-medium">Emblem Svg:</span>
              <Logo variant="emblem" />
            </div>
            <div>
              <span className="text-xs text-neutral-muted block mb-2 font-medium">Compact Variant (Header):</span>
              <Logo variant="compact" />
            </div>
            <div>
              <span className="text-xs text-neutral-muted block mb-2 font-medium">Full Lockup Variant (Hero/Footer):</span>
              <Logo variant="full" />
            </div>
          </div>
        </section>

        {/* 3. Buttons (Primary, Danger, Safe, Ghost) */}
        <section className="card-level-1 p-6 space-y-4">
          <h2 className="font-cairo font-bold text-xl text-neutral-title border-b pb-2">
            3. أزرار النظام (Buttons System - Min 44px Touch Target)
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <button className="touch-target px-6 py-2.5 rounded-md bg-brand text-white font-cairo font-bold hover:bg-brand-hover transition-colors shadow-sm active:scale-95">
              زر رئيسي (Primary)
            </button>
            <button className="touch-target px-6 py-2.5 rounded-md bg-danger text-white font-cairo font-bold hover:bg-danger-hover transition-colors shadow-sm active:scale-95">
              زر تحذير (Danger)
            </button>
            <button className="touch-target px-6 py-2.5 rounded-md bg-safe text-white font-cairo font-bold hover:bg-safe-hover transition-colors shadow-sm active:scale-95">
              زر تأكيد (Safe)
            </button>
            <button className="touch-target px-6 py-2.5 rounded-md bg-transparent text-neutral-title border border-neutral-muted/40 font-cairo font-bold hover:bg-neutral-canvas transition-colors active:scale-95">
              زر ثانوي (Ghost)
            </button>
          </div>
        </section>

        {/* 4. Risk Tiers Pills */}
        <section className="card-level-1 p-6 space-y-4">
          <h2 className="font-cairo font-bold text-xl text-neutral-title border-b pb-2">
            4. شارات تصنيف الخطورة الطبية (Risk Tier Pills)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-neutral-muted/20">
              <span className="text-xs text-neutral-muted block mb-1">Tier 1: خطر تكسير</span>
              <RiskPill hemolysisVotes={90} safeVotes={10} showSublabel />
            </div>
            <div className="p-4 bg-white rounded-xl border border-neutral-muted/20">
              <span className="text-xs text-neutral-muted block mb-1">Tier 2: بحذر وتحت إشراف</span>
              <RiskPill hemolysisVotes={30} safeVotes={70} showSublabel />
            </div>
            <div className="p-4 bg-white rounded-xl border border-neutral-muted/20">
              <span className="text-xs text-neutral-muted block mb-1">Tier 3: آمن لأغلب المصوتين</span>
              <RiskPill hemolysisVotes={5} safeVotes={120} showSublabel />
            </div>
            <div className="p-4 bg-white rounded-xl border border-neutral-muted/20">
              <span className="text-xs text-neutral-muted block mb-1">Tier 4: بيانات غير كافية</span>
              <RiskPill hemolysisVotes={1} safeVotes={2} showSublabel />
            </div>
          </div>
        </section>

        {/* 5. Dual-Color Progress Bar */}
        <section className="card-level-1 p-6 space-y-4">
          <h2 className="font-cairo font-bold text-xl text-neutral-title border-b pb-2">
            5. شريط الأمان المزدوج (Dual-Color Progress Bar)
          </h2>
          <div className="space-y-6 max-w-xl">
            <div>
              <span className="text-xs text-neutral-muted block mb-2">صنف به تكسير عالي:</span>
              <DualProgressBar hemolysisVotes={188} safeVotes={12} />
            </div>
            <div>
              <span className="text-xs text-neutral-muted block mb-2">صنف آمن بنسبة عالية:</span>
              <DualProgressBar hemolysisVotes={8} safeVotes={192} />
            </div>
            <div>
              <span className="text-xs text-neutral-muted block mb-2">صنف بدون أي أصوات (الحالة الصفرية):</span>
              <DualProgressBar hemolysisVotes={0} safeVotes={0} />
            </div>
          </div>
        </section>

        {/* 6. Item Card Anatomy with 4px Edge Strip */}
        <section className="card-level-1 p-6 space-y-4">
          <h2 className="font-cairo font-bold text-xl text-neutral-title border-b pb-2">
            6. بطاقة الصنف النموذجية (Item Card with 4px RTL Edge Strip)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Card 1: Food Danger */}
            <div className="card-level-1 relative p-5 overflow-hidden flex flex-col justify-between gap-4">
              {/* 4px Right-Edge Indicator Strip (RTL) */}
              <div className="absolute top-0 end-0 bottom-0 w-1.5 bg-danger" />

              <div className="flex items-start justify-between gap-3 pe-2">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF6E5] text-brand border border-brand/20 mb-1.5">
                    🍔 أكل وسناكس
                  </span>
                  <h3 className="font-cairo font-bold text-lg text-neutral-title leading-tight">
                    طعمية سخنة / فلافل مقلية
                  </h3>
                  <span className="text-xs text-neutral-muted font-medium">فول مقلي ومحمص بالزيت</span>
                </div>
                <RiskPill hemolysisVotes={142} safeVotes={8} />
              </div>

              <DualProgressBar hemolysisVotes={142} safeVotes={8} />

              <VoteButtons
                currentVote={demoVote}
                onVote={(type) => setDemoVote(type)}
              />

              <div className="flex items-center justify-between text-[11px] text-neutral-muted pt-2 border-t border-neutral-muted/15">
                <span>تجارب مجتمعية استرشادية</span>
                <span className="font-bold">١٥٠ صوّتوا</span>
              </div>
            </div>

            {/* Card 2: Safe Medication */}
            <div className="card-level-1 relative p-5 overflow-hidden flex flex-col justify-between gap-4">
              <div className="absolute top-0 end-0 bottom-0 w-1.5 bg-safe" />

              <div className="flex items-start justify-between gap-3 pe-2">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-canvas text-neutral-body border border-neutral-muted/20 mb-1.5">
                    💊 دواء وصيدلية
                  </span>
                  <h3 className="font-cairo font-bold text-lg text-neutral-title leading-tight">
                    بنادول أزرق سادة (باراسيتامول 500)
                  </h3>
                  <span className="text-xs text-neutral-muted font-medium">مسكن وخافض حرارة شائع</span>
                </div>
                <RiskPill hemolysisVotes={6} safeVotes={230} />
              </div>

              <DualProgressBar hemolysisVotes={6} safeVotes={230} />

              <VoteButtons
                currentVote={null}
                onVote={(type) => alert(`تم اختيار: ${type}`)}
              />

              <div className="flex items-center justify-between text-[11px] text-neutral-muted pt-2 border-t border-neutral-muted/15">
                <span>تجارب مجتمعية استرشادية</span>
                <span className="font-bold">٢٣٦ صوّتوا</span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Search Bar & Filter Chips */}
        <section className="card-level-1 p-6 space-y-4">
          <h2 className="font-cairo font-bold text-xl text-neutral-title border-b pb-2">
            7. حقل البحث وكبسولات التصفية (Search & Filter Chips)
          </h2>
          <div className="space-y-4 max-w-2xl">
            <div className="relative flex items-center bg-white rounded-full p-1.5 shadow-search transition-all focus-within:shadow-search-focus border border-neutral-muted/20">
              <div className="pe-3 ps-4 text-brand flex items-center justify-center">
                <span className="text-xl">🔍</span>
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="ابحث بالاسم التجاري.. مثال: لانشون، ريفو، كتاكيتو..."
                className="w-full bg-transparent border-0 focus:outline-none text-neutral-title font-tajawal text-sm placeholder:text-neutral-muted"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  className="w-7 h-7 rounded-full bg-neutral-canvas text-neutral-body flex items-center justify-center text-xs me-2 hover:bg-neutral-muted/20"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                className="touch-target px-5 py-2 rounded-full bg-brand text-white font-cairo font-bold text-sm hover:bg-brand-hover transition-colors shadow-sm"
              >
                بحث
              </button>
            </div>

            <FilterChips
              activeFilter={activeFilter}
              onFilterChange={(f) => setActiveFilter(f)}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
