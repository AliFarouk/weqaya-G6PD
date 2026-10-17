'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { TokenPayload } from '@/lib/auth/jwt';

interface HeaderProps {
  user?: TokenPayload | null;
  onOpenAuth?: () => void;
  onOpenAddItem?: () => void;
  onLogout?: () => void;
  onOpenEmergency?: () => void;
}

export default function Header({
  user = null,
  onOpenAuth,
  onOpenAddItem,
  onLogout,
  onOpenEmergency,
}: HeaderProps) {
  return (
    <header className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-neutral-muted/15 shadow-sm">
      <div className="max-w-content mx-auto h-14 sm:h-16 md:h-18 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="shrink-0">
          <Logo variant="compact" />
        </div>

        {/* Left Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Emergency 123 Quick Button */}
          {onOpenEmergency ? (
            <button
              type="button"
              onClick={onOpenEmergency}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-danger-light text-danger-text hover:bg-danger/20 text-[11px] sm:text-xs font-bold border border-danger/30 transition-colors select-none shrink-0"
              title="دليل أعراض التكسير وإسعاف 123"
            >
              <span className="animate-pulse text-xs sm:text-sm">🚨</span>
              <span className="hidden sm:inline">طوارئ</span>
              <span>123</span>
            </button>
          ) : (
            <a
              href="tel:123"
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-danger-light text-danger-text hover:bg-danger/20 text-[11px] sm:text-xs font-bold border border-danger/30 transition-colors select-none shrink-0"
              title="اتصال مباشر بإسعاف مصر 123"
            >
              <span className="animate-pulse text-xs sm:text-sm">🚨</span>
              <span className="hidden sm:inline">طوارئ</span>
              <span>123</span>
            </a>
          )}

          {/* Add Item Action Button */}
          {onOpenAddItem ? (
            <button
              type="button"
              onClick={onOpenAddItem}
              className="touch-target inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-cairo font-bold text-xs sm:text-sm bg-brand text-white hover:bg-brand-hover shadow-sm transition-all active:scale-95 select-none whitespace-nowrap shrink-0"
              title="أضف أكلة أو دواء جديد للدليل"
            >
              <span className="text-xs sm:text-sm font-black">➕</span>
              <span className="hidden sm:inline">أضف أكلة أو دواء</span>
              <span className="sm:hidden">أضف صنف</span>
            </button>
          ) : (
            <Link
              href="/?action=add"
              className="touch-target inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-cairo font-bold text-xs sm:text-sm bg-brand text-white hover:bg-brand-hover shadow-sm transition-all active:scale-95 select-none whitespace-nowrap shrink-0"
              title="أضف أكلة أو دواء جديد للدليل"
            >
              <span className="text-xs sm:text-sm font-black">➕</span>
              <span className="hidden sm:inline">أضف أكلة أو دواء</span>
              <span className="sm:hidden">أضف صنف</span>
            </Link>
          )}

          {/* User Auth Status */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Doctor Portal Quick Access */}
              {user.isDoctor && user.doctorStatus === 'approved' && user.role !== 'admin' && user.role !== 'supervisor' && (
                <Link
                  href="/admin?tab=queue"
                  className="touch-target inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-300 hover:bg-emerald-600 hover:text-white transition-all select-none shadow-xs shrink-0"
                  title="طابور مراجعة واعتماد الأكلات والأدوية"
                >
                  <span>🩺</span>
                  <span className="hidden md:inline">مراجعة الأصناف</span>
                </Link>
              )}

              {/* Admin / Supervisor Quick Access */}
              {(user.role === 'admin' || user.role === 'supervisor') && (
                <Link
                  href="/admin"
                  className="touch-target inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-brand-light text-brand text-xs font-bold border border-brand/30 hover:bg-brand hover:text-white transition-all select-none shadow-xs shrink-0"
                  title="لوحة الإدارة والتحليلات"
                >
                  <span>⚙️</span>
                  <span className="hidden md:inline">لوحة الإدارة</span>
                </Link>
              )}

              {/* User badge */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-neutral-canvas border border-neutral-muted/20 text-xs font-bold text-neutral-title select-none shrink-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-safe animate-pulse shrink-0" />
                <span className="max-w-[65px] sm:max-w-[110px] truncate">{user.name}</span>
                {user.role === 'admin' ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand text-white text-[10px] font-black shrink-0">
                    👑 <span className="hidden sm:inline mr-0.5">مدير</span>
                  </span>
                ) : user.role === 'supervisor' ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand-light text-brand text-[10px] font-black shrink-0">
                    🛡️ <span className="hidden sm:inline mr-0.5">مشرف</span>
                  </span>
                ) : user.isDoctor && user.doctorStatus === 'approved' ? (
                  <span
                    title="طبيب معتمد من النقابة"
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand-light text-brand text-[10px] font-black shrink-0"
                  >
                    🩺 <span className="hidden sm:inline mr-0.5">طبيب معتمد</span>
                  </span>
                ) : user.doctorStatus === 'pending' ? (
                  <span
                    title="كارنيه النقابة قيد المراجعة"
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-caution-light text-caution-text text-[10px] font-black shrink-0"
                  >
                    ⏳ <span className="hidden sm:inline mr-0.5">قيد المراجعة</span>
                  </span>
                ) : null}
              </div>

              {/* Logout button */}
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-neutral-muted hover:text-danger font-bold px-1 sm:px-2 py-1 transition-colors whitespace-nowrap shrink-0"
                title="تسجيل الخروج"
              >
                خروج
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="touch-target inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-cairo font-bold text-xs sm:text-sm text-brand bg-brand-light/60 hover:bg-brand-light border border-brand/20 transition-all select-none whitespace-nowrap shrink-0"
              title="تسجيل الدخول أو إنشاء حساب جديد"
            >
              <span className="text-xs sm:text-sm">👤</span>
              <span className="hidden sm:inline">تسجيل الدخول / حساب جديد</span>
              <span className="sm:hidden">دخول</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
