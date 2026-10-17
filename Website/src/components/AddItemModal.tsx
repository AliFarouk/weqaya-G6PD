'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ItemRow } from '@/lib/db';
import { findItemSuggestions, MatchSuggestion } from '@/lib/arabic-normalize';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: ItemRow) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  existingItems?: ItemRow[];
  token: string | null;
  onSelectExistingItem?: (item: ItemRow) => void;
}

export default function AddItemModal({
  isOpen,
  onClose,
  onItemAdded,
  onShowToast,
  existingItems = [],
  token,
  onSelectExistingItem,
}: AddItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'food' | 'medication'>('food');
  const [origin, setOrigin] = useState<'supermarket' | 'restaurant' | 'pharmacy' | 'home'>('supermarket');
  const [initialVote, setInitialVote] = useState<'hemolysis' | 'safe' | null>(null);
  const [serverItems, setServerItems] = useState<ItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-switch origin when category changes
  const handleCategoryChange = (cat: 'food' | 'medication') => {
    setCategory(cat);
    if (cat === 'medication') {
      setOrigin('pharmacy');
    } else if (origin === 'pharmacy') {
      setOrigin('supermarket');
    }
  };

  // Combined pool of candidate items
  const candidatePool = useMemo(() => {
    const map = new Map<number, ItemRow>();
    existingItems.forEach((it) => map.set(it.id, it));
    serverItems.forEach((it) => map.set(it.id, it));
    return Array.from(map.values());
  }, [existingItems, serverItems]);

  // Real-time suggestions on every keystroke
  const suggestions: MatchSuggestion<ItemRow>[] = useMemo(() => {
    if (!name.trim()) return [];
    return findItemSuggestions(name, candidatePool);
  }, [name, candidatePool]);

  // Check for 100% exact match (block duplicate submission)
  const exactMatch = useMemo(() => {
    return suggestions.find((s) => s.isExactMatch)?.item || null;
  }, [suggestions]);

  // Fetch broader server database matches with 150ms debounce
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setServerItems([]);
      return;
    }

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items?q=${encodeURIComponent(trimmed)}&limit=10`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setServerItems(data.data);
        }
      } catch {
        // Silently ignore background lookup errors
      }
    }, 150);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [name]);

  // Reset state when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setCategory('food');
      setOrigin('supermarket');
      setInitialVote(null);
      setErrorMsg('');
      setServerItems([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onShowToast('يجب تسجيل الدخول أولاً', 'error');
      return;
    }

    if (exactMatch) {
      setErrorMsg(`الصنف «${exactMatch.name}» مسجل بالفعل في الدليل (تطابق 100%). لا يمكن تكرار إضافته.`);
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          category,
          origin,
          initial_vote: initialVote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error?.message || 'حدث خطأ أثناء إضافة الصنف');
        return;
      }

      if (data.is_pending) {
        onShowToast(data.message || 'تم إرسال الصنف للمراجعة الطبية وسيتوفر بالدليل فور اعتماده 🩺', 'info');
      } else {
        onItemAdded(data.data);
        onShowToast(`تمت إضافة «${data.data.name}» إلى الدليل فوراً 🚀`, 'success');
      }

      setName('');
      setInitialVote(null);
      onClose();
    } catch {
      setErrorMsg('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExisting = (item: ItemRow) => {
    if (onSelectExistingItem) {
      onSelectExistingItem(item);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto text-start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-muted/15">
          <div className="flex items-center gap-2">
            <span className="text-2xl">➕</span>
            <div>
              <h2 id="add-modal-title" className="font-cairo font-bold text-lg text-neutral-title">
                إضافة صنف جديد للدليل
              </h2>
              <span className="text-xs text-neutral-muted">
                اكتب الاسم المتداول بالسوق المصري لمساعدة الأهالي
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-canvas text-neutral-body flex items-center justify-center font-bold hover:bg-neutral-muted/20"
            aria-label="إغلاق النافذة"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 my-3 bg-danger-light text-danger-text text-xs font-bold rounded-xl border border-danger/20">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 100% Exact Duplicate Match Alert -> BLOCKS DUPLICATE */}
        {exactMatch ? (
          <div className="p-3.5 my-3 bg-danger-light border-2 border-danger/40 rounded-xl text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-black text-danger-text text-sm">
              <span>🚫 صنف مسجل بالفعل (تطابق 100%)</span>
            </div>
            <p className="text-neutral-title font-bold text-sm">
              «{exactMatch.name}»
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-body">
              <span className="px-2 py-0.5 rounded-full bg-white border border-neutral-muted/20 font-bold">
                {exactMatch.category === 'food' ? '🍔 أكل / سناك' : '💊 دواء'}
              </span>
              <span>{exactMatch.total_votes} أصوات مسجلة</span>
            </div>
            <p className="text-[11px] text-danger-text/90 font-medium">
              هذا الصنف موجود بالفعل في قاعدة البيانات، لا يمكن تكرار إضافته لمنع تشتيت أصوات الأهالي.
            </p>
            <button
              type="button"
              onClick={() => handleSelectExisting(exactMatch)}
              className="w-full mt-2 py-2.5 px-3 bg-brand text-white rounded-lg font-cairo font-bold text-xs hover:bg-brand-hover transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>🔍 الانتقال لهذا الصنف والتصويت عليه الآن</span>
            </button>
          </div>
        ) : suggestions.length > 0 ? (
          /* Similar Items Suggestions (Threshold >= 70% or word token matches) */
          <div className="p-3 my-3 bg-[#FFF8E7] border border-caution/40 rounded-xl text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-caution-text font-black">
              <span className="flex items-center gap-1.5">
                <span>⚠️</span>
                <span>هل تقصد أحد هذه الأصناف المسجلة؟ ({suggestions.length})</span>
              </span>
              <span className="text-[10px] bg-caution/15 px-2 py-0.5 rounded-full font-bold">
                شبه {Math.round(suggestions[0].similarity * 100)}%
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto divide-y divide-caution/20 pe-1">
              {suggestions.slice(0, 3).map(({ item, similarity }) => (
                <div key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-neutral-title text-xs truncate">
                      «{item.name}»
                    </p>
                    <span className="text-[11px] text-neutral-muted">
                      {item.category === 'food' ? '🍔 أكل' : '💊 دواء'} — {item.total_votes} أصوات
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectExisting(item)}
                    className="px-2.5 py-1 text-[11px] font-bold text-brand bg-white hover:bg-brand-light rounded border border-brand/30 transition-colors whitespace-nowrap shadow-xs"
                  >
                    اختيار هذا الصنف
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-neutral-body pt-1">
              يمكنك التصويت على الصنف المسجل، أو المتابعة إذا كان صنفك مختلفاً أو علامة تجارية جديدة.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Trade Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-neutral-title">
                اسم الصنف بالسوق المصري *
              </label>
              {name.trim() && (
                <span className="text-[11px] text-neutral-muted">
                  {name.trim().length} حرف
                </span>
              )}
            </div>
            <input
              type="text"
              required
              minLength={2}
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب الاسم.. مثال: فول، ريفو، طعمية، كتاكيتو..."
              className={`w-full h-11 px-3.5 rounded-md border text-sm transition-all focus:outline-none ${
                exactMatch
                  ? 'border-danger bg-danger-light/30 focus:ring-1 focus:ring-danger text-danger-text'
                  : suggestions.length > 0
                  ? 'border-caution/60 bg-caution-light/30 focus:ring-1 focus:ring-caution'
                  : 'border-neutral-muted/30 focus:border-brand focus:ring-1 focus:ring-brand bg-neutral-canvas/50'
              }`}
              autoFocus
            />
          </div>

          {/* Category Toggle */}
          <div>
            <label className="block text-xs font-bold text-neutral-title mb-1.5">
              نوع الصنف *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleCategoryChange('food')}
                className={`py-3 px-3 rounded-md border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  category === 'food'
                    ? 'border-brand bg-brand-light text-brand shadow-sm font-black'
                    : 'border-neutral-muted/30 bg-white text-neutral-body hover:bg-neutral-canvas'
                }`}
              >
                <span className="text-lg">🍔</span>
                <span>أكل أو سناك</span>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('medication')}
                className={`py-3 px-3 rounded-md border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  category === 'medication'
                    ? 'border-brand bg-brand-light text-brand shadow-sm font-black'
                    : 'border-neutral-muted/30 bg-white text-neutral-body hover:bg-neutral-canvas'
                }`}
              >
                <span className="text-lg">💊</span>
                <span>دواء أو مسكن</span>
              </button>
            </div>
          </div>

          {/* Origin / Source Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-title mb-1.5">
              مصدر الصنف أو مكانه *
            </label>
            {category === 'food' ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrigin('supermarket')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                    origin === 'supermarket'
                      ? 'border-brand bg-brand-light text-brand shadow-xs font-black'
                      : 'border-neutral-muted/20 bg-neutral-canvas text-neutral-body hover:bg-neutral-muted/20'
                  }`}
                >
                  🛒 سوبر ماركت
                </button>
                <button
                  type="button"
                  onClick={() => setOrigin('restaurant')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                    origin === 'restaurant'
                      ? 'border-brand bg-brand-light text-brand shadow-xs font-black'
                      : 'border-neutral-muted/20 bg-neutral-canvas text-neutral-body hover:bg-neutral-muted/20'
                  }`}
                >
                  🍽️ أكل مطاعم
                </button>
                <button
                  type="button"
                  onClick={() => setOrigin('home')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                    origin === 'home'
                      ? 'border-brand bg-brand-light text-brand shadow-xs font-black'
                      : 'border-neutral-muted/20 bg-neutral-canvas text-neutral-body hover:bg-neutral-muted/20'
                  }`}
                >
                  🍲 أكل بيتي
                </button>
              </div>
            ) : (
              <div className="py-2 px-3 rounded-lg bg-neutral-canvas border border-neutral-muted/20 text-xs text-brand font-bold flex items-center gap-2">
                <span>💊 صيدلية وعلاجات طبية</span>
              </div>
            )}
          </div>

          {/* Initial Personal Vote */}
          <div>
            <label className="block text-xs font-bold text-neutral-title mb-1.5">
              ما هي تجربتك الشخصية مع هذا الصنف؟ (اختياري)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInitialVote(initialVote === 'hemolysis' ? null : 'hemolysis')}
                className={`py-2 px-2.5 rounded-md border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  initialVote === 'hemolysis'
                    ? 'bg-danger text-white border-danger shadow-sm'
                    : 'bg-danger-light text-danger-text border-danger/30 hover:bg-danger/20'
                }`}
              >
                <span>⚠️</span>
                <span>سبب تكسيراً</span>
              </button>
              <button
                type="button"
                onClick={() => setInitialVote(initialVote === 'safe' ? null : 'safe')}
                className={`py-2 px-2.5 rounded-md border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  initialVote === 'safe'
                    ? 'bg-safe text-white border-safe shadow-sm'
                    : 'bg-safe-light text-safe-text border-safe/30 hover:bg-safe/20'
                }`}
              >
                <span>✅</span>
                <span>كان آمناً معي</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || name.trim().length < 2 || Boolean(exactMatch)}
            className={`touch-target w-full font-cairo font-bold py-3.5 rounded-md transition-all shadow-md mt-4 flex items-center justify-center gap-2 select-none ${
              exactMatch
                ? 'bg-neutral-muted/40 text-neutral-body cursor-not-allowed border border-neutral-muted/30'
                : 'bg-brand hover:bg-brand-hover text-white active:scale-[0.99] disabled:opacity-50'
            }`}
          >
            {isLoading ? (
              <span>جاري النشر...</span>
            ) : exactMatch ? (
              <span>🚫 الصنف مسجل بالفعل (ممنوع التكرار)</span>
            ) : (
              <span>نشر الصنف في الدليل فوراً 🚀</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
