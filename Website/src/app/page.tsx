'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmergencyModal from '@/components/EmergencyModal';
import FilterChips, { CategoryFilter } from '@/components/FilterChips';
import ItemCard from '@/components/ItemCard';
import AuthModal from '@/components/AuthModal';
import AddItemModal from '@/components/AddItemModal';
import Toast, { ToastMessage } from '@/components/Toast';
import { ItemRow } from '@/lib/db';
import { TokenPayload } from '@/lib/auth/jwt';

export default function HomePage() {
  // 1. Core State
  const [items, setItems] = useState<ItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [currentUser, setCurrentUser] = useState<TokenPayload | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ itemId: number; voteType: 'hemolysis' | 'safe'; itemName?: string } | null>(null);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 2. Initial Auth Verification & Cross-Tab Real-time Sync (Like Facebook)
  useEffect(() => {
    const syncAuth = (token: string | null) => {
      if (token) {
        setAuthToken(token);
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              setCurrentUser(data.user);
            } else {
              localStorage.removeItem('weqaya_token');
              document.cookie = 'weqaya_token=; path=/; max-age=0';
              setAuthToken(null);
              setCurrentUser(null);
            }
          })
          .catch(() => {});
      } else {
        setAuthToken(null);
        setCurrentUser(null);
      }
    };

    // Initial check from localStorage or cookie
    const storedToken = localStorage.getItem('weqaya_token');
    syncAuth(storedToken);

    // Cross-tab real-time listener: syncs signin/signout across all open tabs instantly
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'weqaya_token') {
        syncAuth(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Check pending vote from sessionStorage per §6.2
    const savedPending = sessionStorage.getItem('weqaya_pending_vote');
    if (savedPending) {
      try {
        setPendingVote(JSON.parse(savedPending));
      } catch {}
    }

    // Handle action=add URL parameter from header on other pages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
      const token = localStorage.getItem('weqaya_token');
      if (token) {
        setIsAddOpen(true);
      } else {
        setIsAuthOpen(true);
      }
      window.history.replaceState({}, '', '/');
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 3. Fetch Items with Debounce & AbortController per §6.1
  const fetchItems = useCallback(async (q: string, category: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const token = localStorage.getItem('weqaya_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (category !== 'all') params.set('category', category);
      params.set('limit', '50');

      const res = await fetch(`/api/items?${params.toString()}`, {
        headers,
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Fetch items error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search trigger (150ms per §6.1)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems(searchQuery, activeFilter);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, fetchItems]);

  // 4. One-Tap Voting with Optimistic UI & Guest Intercept (§6.2)
  const handleVote = async (itemId: number, voteType: 'hemolysis' | 'safe') => {
    const targetItem = items.find((i) => i.id === itemId);

    // Guest Intercept: open 10-second fast auth modal and persist pending vote
    if (!currentUser || !authToken) {
      const pending = { itemId, voteType, itemName: targetItem?.name };
      setPendingVote(pending);
      sessionStorage.setItem('weqaya_pending_vote', JSON.stringify(pending));
      setIsAuthOpen(true);
      return;
    }

    // Optimistic Update
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const prevVote = it.user_vote;
        let dH = 0;
        let dS = 0;

        if (!prevVote) {
          if (voteType === 'hemolysis') dH = 1;
          else dS = 1;
        } else if (prevVote !== voteType) {
          if (voteType === 'hemolysis') {
            dH = 1;
            dS = -1;
          } else {
            dH = -1;
            dS = 1;
          }
        }

        const newH = Math.max(0, it.hemolysis_votes + dH);
        const newS = Math.max(0, it.safe_votes + dS);
        const newTotal = newH + newS;

        return {
          ...it,
          user_vote: voteType,
          hemolysis_votes: newH,
          safe_votes: newS,
          total_votes: newTotal,
          hemolysis_percent: newTotal > 0 ? Math.round((newH / newTotal) * 1000) / 10 : 0,
          safe_percent: newTotal > 0 ? Math.round((newS / newTotal) * 1000) / 10 : 0,
        };
      })
    );

    // Submit to Server
    try {
      const res = await fetch(`/api/items/${itemId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error?.message || 'تعذر تسجيل الصوت', 'error');
        // Rollback
        fetchItems(searchQuery, activeFilter);
        return;
      }

      showToast(`تم تسجيل صوتك على «${targetItem?.name || 'الصنف'}» بنجاح ✅`, 'success');
    } catch {
      showToast('خطأ في الاتصال بالشبكة', 'error');
      fetchItems(searchQuery, activeFilter);
    }
  };

  // 5. Automatic Execution of Pending Vote after Auth (§6.2 & doc 07)
  const handleAuthSuccess = async (user: TokenPayload, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('weqaya_token', token);
    document.cookie = `weqaya_token=${token}; path=/; max-age=604800; SameSite=Lax`;

    if (pendingVote) {
      const { itemId, voteType } = pendingVote;
      sessionStorage.removeItem('weqaya_pending_vote');
      setPendingVote(null);

      // Execute pending vote automatically without requiring second tap!
      setTimeout(() => {
        handleVote(itemId, voteType);
      }, 100);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('weqaya_token');
    document.cookie = 'weqaya_token=; path=/; max-age=0; SameSite=Lax';
    sessionStorage.removeItem('weqaya_pending_vote');
    setCurrentUser(null);
    setAuthToken(null);
    showToast('تم تسجيل الخروج بنجاح', 'info');
    fetchItems(searchQuery, activeFilter);
  };

  // Report handler
  const handleReport = async (itemId: number) => {
    if (!currentUser || !authToken) {
      showToast('يجب تسجيل الدخول للإبلاغ عن صنف', 'error');
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/items/${itemId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: 'إبلاغ مجتمعي عن صنف غير مطابق' }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('تم استلام البلاغ، شكراً لحرصك على أمان المجتمع 🛡️', 'success');
        if (data.is_hidden) {
          setItems((prev) => prev.filter((i) => i.id !== itemId));
        }
      }
    } catch {
      showToast('تعذر إرسال البلاغ', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-canvas">
      {/* 1. App Header with Logo, 🚨 طوارئ 123, ➕ أضف صنف, and User */}
      <Header
        user={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAddItem={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setIsAddOpen(true);
          }
        }}
        onLogout={handleLogout}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
      />

      <main className="flex-1 w-full">
        {/* Doctor & Staff Quick Notification Banner */}
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor' || (currentUser.isDoctor && currentUser.doctorStatus === 'approved')) && (
          <div className="bg-emerald-700 text-white py-2.5 px-4 shadow-sm border-b border-emerald-800">
            <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold">
              <div className="flex items-center gap-2 text-center sm:text-right">
                <span className="text-base">🩺</span>
                <span>
                  مرحباً د. {currentUser.name}! يوجد أطعمة وأدوية جديدة أضافها الأعضاء بانتظار مراجعتك واعتمادك لسلامة المرضى.
                </span>
              </div>
              <a
                href="/admin?tab=queue"
                className="touch-target px-4 py-1.5 rounded-full bg-white text-emerald-800 hover:bg-emerald-50 transition-all font-black text-xs shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <span>طابور المراجعة الطبية</span>
                <span>←</span>
              </a>
            </div>
          </div>
        )}

        {/* 2. Direct, Simple & Focused Search Section (Front & Center) */}
        <section className="bg-white border-b border-neutral-muted/15 py-4 sm:py-6 px-4 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Friendly direct headline */}
            <div className="text-center">
              <h1 className="font-cairo font-black text-xl sm:text-2xl text-neutral-title leading-snug">
                ابحث عن أي <span className="text-brand">أكلة أو دواء</span> لمعرفة نسبة أمانها
              </h1>
              <p className="text-xs text-neutral-muted mt-0.5">
                دليل مجتمعي لمرضى أنيميا الفول بالأسماء المتداولة في السوق المصري
              </p>
            </div>

            {/* Prominent Instant Search Bar */}
            <div className="relative flex items-center bg-neutral-canvas rounded-full p-1.5 shadow-search transition-all focus-within:shadow-search-focus focus-within:bg-white border border-neutral-muted/25">
              <div className="pe-2.5 ps-3.5 text-brand flex items-center justify-center">
                <span className="text-xl">🔍</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم التجاري.. مثال: لانشون، ريفو، طعمية، كتاكيتو، شيبسي..."
                className="w-full bg-transparent border-0 focus:outline-none text-neutral-title font-tajawal text-sm sm:text-base placeholder:text-neutral-muted"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-7 h-7 rounded-full bg-neutral-muted/20 text-neutral-body flex items-center justify-center text-xs me-2 hover:bg-neutral-muted/30 transition-colors"
                  aria-label="مسح البحث"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchItems(searchQuery, activeFilter)}
                className="touch-target px-5 py-2 rounded-full bg-brand text-white font-cairo font-bold text-xs sm:text-sm hover:bg-brand-hover transition-colors shadow-sm select-none"
              >
                بحث
              </button>
            </div>

            {/* Quick Category Filter Chips */}
            <div className="flex justify-center pt-1">
              <FilterChips
                activeFilter={activeFilter}
                onFilterChange={(f) => setActiveFilter(f)}
              />
            </div>
          </div>
        </section>

        {/* 3. Core Feed: Starts Immediately under Search */}
        <section className="max-w-content mx-auto px-4 md:px-8 py-5 md:py-8">
          {/* Feed Header */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h2 className="font-cairo font-bold text-lg md:text-xl text-neutral-title">
                {searchQuery ? `نتائج البحث عن «${searchQuery}»` : 'دليل الأغذية والأدوية المسجلة'}
              </h2>
            </div>
            <span className="text-xs text-neutral-muted font-bold">
              {items.length} صنف متوفر
            </span>
          </div>

          {/* Skeleton Loader */}
          {isLoading && items.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="card-level-1 p-5 space-y-4 animate-pulse">
                  <div className="h-6 bg-neutral-canvas rounded-md w-1/3" />
                  <div className="h-8 bg-neutral-canvas rounded-md w-3/4" />
                  <div className="h-4 bg-neutral-canvas rounded-full w-full" />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-10 bg-neutral-canvas rounded-md" />
                    <div className="h-10 bg-neutral-canvas rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            /* Empty State with Immediate CTA */
            <div className="card-level-1 p-10 text-center max-w-lg mx-auto space-y-4">
              <span className="text-5xl block">🔍</span>
              <h3 className="font-cairo font-bold text-xl text-neutral-title">
                لم نجد صنفاً بهذا الاسم في الدليل
              </h3>
              <p className="text-sm text-neutral-body">
                كن أول من يضيف هذا الصنف ليتمكن أهالي مرضى أنيميا الفول من التصويت عليه!
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) setIsAuthOpen(true);
                  else setIsAddOpen(true);
                }}
                className="touch-target inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-brand text-white font-cairo font-bold text-sm hover:bg-brand-hover shadow-md transition-all active:scale-95"
              >
                <span>➕ أضف «{searchQuery || 'هذا الصنف'}» الآن</span>
              </button>
            </div>
          ) : (
            /* Item Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onVote={handleVote}
                  onReport={handleReport}
                  onShowToast={showToast}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 4. Modals */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingVote(null);
          sessionStorage.removeItem('weqaya_pending_vote');
        }}
        onSuccess={handleAuthSuccess}
        onShowToast={showToast}
        pendingVoteItemName={pendingVote?.itemName}
      />

      <AddItemModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onItemAdded={(newItem) => {
          setItems((prev) => [newItem, ...prev]);
        }}
        onShowToast={showToast}
        existingItems={items}
        token={authToken}
        onSelectExistingItem={(existing) => {
          setSearchQuery(existing.name);
          setActiveFilter('all');
          showToast(`تم فتح الصنف «${existing.name}» في الدليل للتصويت عليه 🎯`, 'info');
          // Smooth scroll to feed
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
      />

      {/* 5. Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
