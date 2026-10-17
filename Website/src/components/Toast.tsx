'use client';

import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-bold animate-in slide-in-from-bottom-5 duration-200 select-none ${
            toast.type === 'success'
              ? 'bg-[#161640] text-white border border-safe/40'
              : toast.type === 'error'
              ? 'bg-danger text-white'
              : 'bg-neutral-title text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span>{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-white/70 hover:text-white ps-2 font-black text-xs"
            aria-label="إغلاق التنبيه"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
