'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import AddItemModal from '@/components/AddItemModal';
import EmergencyModal from '@/components/EmergencyModal';
import Toast, { ToastMessage } from '@/components/Toast';
import { ItemRow, UserRow } from '@/lib/db';
import { TokenPayload } from '@/lib/auth/jwt';

export type AdminTab = 'analytics' | 'users' | 'queue' | 'doctors' | 'csv';

interface AdminStats {
  items: {
    total: number;
    published: number;
    pending: number;
    hidden: number;
    foods: number;
    medications: number;
    byOrigin: {
      supermarket: number;
      restaurant: number;
      pharmacy: number;
      home: number;
      general: number;
    };
    safety: {
      safe: number;
      danger: number;
      mixed: number;
    };
  };
  votes: {
    total: number;
    safe: number;
    hemolysis: number;
  };
  users: {
    total: number;
    active: number;
    suspended: number;
    verifiedDoctors: number;
    pendingDoctors: number;
    supervisors: number;
    admins: number;
    byRelation: Array<{ patient_relation: string; count: number }>;
  };
  topVotedItems: ItemRow[];
  reportsCount: number;
}

interface AdminUserItem extends UserRow {
  votes_count: number;
  items_count: number;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<TokenPayload | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  // Analytics state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null);
  const [userToEditRole, setUserToEditRole] = useState<AdminUserItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<'user' | 'doctor' | 'supervisor' | 'admin'>('user');

  // Queue state
  const [queueSubTab, setQueueSubTab] = useState<'pending' | 'reviewed'>('pending');
  const [pendingItems, setPendingItems] = useState<ItemRow[]>([]);
  const [reviewedItems, setReviewedItems] = useState<ItemRow[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: number; name: string; category: 'food' | 'medication'; origin: string } | null>(null);

  // Doctors state
  const [pendingDoctors, setPendingDoctors] = useState<UserRow[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPastedText, setCsvPastedText] = useState('');
  const [isCsvUploading, setIsCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ inserted: number; skipped: number; message: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
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

  // Cross-tab and initial Auth fetch
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
              setCurrentUser(null);
              setAuthToken(null);
            }
          })
          .catch(() => {});
      } else {
        setCurrentUser(null);
        setAuthToken(null);
      }
    };

    const token = localStorage.getItem('weqaya_token');
    syncAuth(token);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'weqaya_token') {
        syncAuth(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch Stats
  const loadStats = useCallback(async (token: string) => {
    setIsStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch Users
  const loadUsers = useCallback(async (token: string, q = '', role = 'all', status = 'all') => {
    setIsUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (role !== 'all') params.set('role', role);
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  // Check URL tab parameter or default to 'queue' for doctors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as AdminTab | null;
      if (tabParam && ['analytics', 'users', 'queue', 'doctors', 'csv'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (currentUser?.role === 'doctor' || (currentUser?.isDoctor && currentUser?.doctorStatus === 'approved')) {
        setActiveTab('queue');
      }
    }
  }, [currentUser]);

  // Fetch Pending Items
  const loadPendingItems = useCallback(async (token: string) => {
    setIsQueueLoading(true);
    try {
      const res = await fetch('/api/doctor/queue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPendingItems(data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsQueueLoading(false);
    }
  }, []);

  // Fetch Reviewed Items History
  const loadReviewedItems = useCallback(async (token: string) => {
    setIsQueueLoading(true);
    try {
      const res = await fetch('/api/doctor/queue?type=reviewed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReviewedItems(data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsQueueLoading(false);
    }
  }, []);

  // Claim Item Action
  const handleClaimItem = async (itemId: number) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/doctor/items/${itemId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: 'claim' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'info');
        loadPendingItems(authToken);
      } else {
        showToast(data.error?.message || 'تعذر بدء المراجعة', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    }
  };

  // Fetch Pending Doctors
  const loadPendingDoctors = useCallback(async (token: string) => {
    setIsDoctorsLoading(true);
    try {
      const res = await fetch('/api/admin/doctors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPendingDoctors(data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsDoctorsLoading(false);
    }
  }, []);

  // Auto load data on tab change or auth
  useEffect(() => {
    if (!authToken || !currentUser) return;
    const isStaff = currentUser.role === 'admin' || currentUser.role === 'supervisor' || (currentUser.isDoctor && currentUser.doctorStatus === 'approved');
    if (!isStaff) return;

    if (activeTab === 'analytics') {
      loadStats(authToken);
    } else if (activeTab === 'users') {
      loadUsers(authToken, userSearch, userRoleFilter, userStatusFilter);
    } else if (activeTab === 'queue') {
      if (queueSubTab === 'pending') {
        loadPendingItems(authToken);
      } else {
        loadReviewedItems(authToken);
      }
    } else if (activeTab === 'doctors') {
      loadPendingDoctors(authToken);
    }
  }, [authToken, currentUser, activeTab, queueSubTab, loadStats, loadUsers, loadPendingItems, loadReviewedItems, loadPendingDoctors, userSearch, userRoleFilter, userStatusFilter]);

  // Toggle user suspension
  const handleToggleSuspension = async (user: AdminUserItem) => {
    if (!authToken) return;
    const newSuspension = !user.is_suspended;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          is_suspended: newSuspension,
          reason: newSuspension ? 'مخالفة معايير الأمان الطبية في المنصة' : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_suspended: newSuspension } : u))
        );
        if (stats) loadStats(authToken);
      } else {
        showToast(data.error?.message || 'تعذر تعديل حالة المستخدم', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    }
  };

  // Change user role
  const handleSaveRole = async () => {
    if (!authToken || !userToEditRole) return;
    try {
      const res = await fetch(`/api/admin/users/${userToEditRole.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          role: selectedNewRole,
          is_doctor: selectedNewRole === 'doctor',
          doctor_status: selectedNewRole === 'doctor' ? 'approved' : 'none',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === userToEditRole.id
              ? { ...u, role: selectedNewRole, is_doctor: selectedNewRole === 'doctor', doctor_status: selectedNewRole === 'doctor' ? 'approved' : 'none' }
              : u
          )
        );
        setUserToEditRole(null);
        if (stats) loadStats(authToken);
      } else {
        showToast(data.error?.message || 'تعذر تغيير الدور', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!authToken || !userToDelete) return;
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
        if (stats) loadStats(authToken);
      } else {
        showToast(data.error?.message || 'تعذر حذف المستخدم', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    }
  };

  // Review item action (Approve or Reject)
  const handleReviewItem = async (itemId: number, action: 'approve' | 'reject') => {
    if (!authToken) return;
    try {
      const payload: any = { action };
      if (action === 'approve' && editingItem && editingItem.id === itemId) {
        payload.name = editingItem.name;
        payload.category = editingItem.category;
        payload.origin = editingItem.origin;
      }

      const res = await fetch(`/api/doctor/items/${itemId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, action === 'approve' ? 'success' : 'info');
        setPendingItems((prev) => prev.filter((i) => i.id !== itemId));
        setEditingItem(null);
        if (stats) loadStats(authToken);
      } else {
        showToast(data.error?.message || 'حدث خطأ أثناء المراجعة', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    }
  };

  // Verify doctor action
  const handleVerifyDoctor = async (userId: number, approved: boolean) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/admin/doctors/${userId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ approved }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, approved ? 'success' : 'info');
        setPendingDoctors((prev) => prev.filter((u) => u.id !== userId));
        if (stats) loadStats(authToken);
      } else {
        showToast(data.error?.message || 'حدث خطأ', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    }
  };

  // CSV Submit
  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    if (!csvFile && !csvPastedText.trim()) {
      showToast('يرجى اختيار ملف CSV أو لصق محتواه', 'error');
      return;
    }

    setIsCsvUploading(true);
    setCsvResult(null);

    try {
      let res: Response;
      if (csvFile) {
        const formData = new FormData();
        formData.append('file', csvFile);
        res = await fetch('/api/admin/csv-import', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData,
        });
      } else {
        res = await fetch('/api/admin/csv-import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ csvText: csvPastedText }),
        });
      }

      const data = await res.json();
      if (data.success) {
        setCsvResult({
          inserted: data.inserted,
          skipped: data.skipped,
          message: data.message,
        });
        showToast(data.message, 'success');
        setCsvFile(null);
        setCsvPastedText('');
        if (stats) loadStats(authToken);
      } else {
        showToast(data.error?.message || 'حدث خطأ أثناء معالجة ملف CSV', 'error');
      }
    } catch {
      showToast('تعذر رفع ومعالجة الملف', 'error');
    } finally {
      setIsCsvUploading(false);
    }
  };

  const isStaff =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'supervisor' ||
    (currentUser?.isDoctor && currentUser?.doctorStatus === 'approved');

  const isAdminOrSupervisor = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-canvas">
      {/* App Header */}
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
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onLogout={() => {
          localStorage.removeItem('weqaya_token');
          document.cookie = 'weqaya_token=; path=/; max-age=0';
          setCurrentUser(null);
          setAuthToken(null);
          showToast('تم تسجيل الخروج', 'info');
        }}
      />

      <main className="flex-1 max-w-content w-full mx-auto px-4 md:px-8 py-6">
        {/* Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-muted/15">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xs text-brand font-bold hover:underline">
                ← العودة للدليل الرئيسي
              </Link>
              <span className="text-xs text-neutral-muted">/</span>
              <span className="text-xs text-neutral-muted font-bold">لوحة الإدارة والتحليلات</span>
            </div>
            <h1 className="font-cairo font-black text-2xl md:text-3xl text-neutral-title mt-1">
              لوحة الإدارة والتحليلات الشاملة 🛡️
            </h1>
          </div>

          {/* Current role status pill */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-neutral-muted/20 shadow-xs">
              <span className="text-lg">
                {currentUser.role === 'admin' ? '👑' : currentUser.role === 'supervisor' ? '🛡️' : '🩺'}
              </span>
              <div>
                <span className="font-bold text-xs text-neutral-title block">{currentUser.name}</span>
                <span className="text-[11px] font-black text-brand">
                  {currentUser.role === 'admin'
                    ? 'مدير النظام (Admin)'
                    : currentUser.role === 'supervisor'
                    ? 'مشرف المحتوى (Supervisor)'
                    : 'طبيب معتمد (Doctor)'}
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="touch-target px-4 py-2 rounded-lg bg-brand text-white font-bold text-xs hover:bg-brand-hover shadow-sm"
            >
              تسجيل الدخول كمدير أو مشرف أو طبيب
            </button>
          )}
        </div>

        {/* Access Guard */}
        {!isStaff ? (
          <div className="p-8 my-8 bg-white rounded-2xl border border-neutral-muted/20 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <span className="text-5xl block">🔒</span>
            <h2 className="font-cairo font-bold text-xl text-neutral-title">
              قسم خاص بالأطباء والمشرفين والمديرين
            </h2>
            <p className="text-xs text-neutral-muted leading-relaxed">
              يرجى تسجيل الدخول بحساب مدير أو مشرف أو طبيب معتمد للاطلاع على الرسوم البيانية وطابور مراجعة الأصناف وإدارة الحسابات.
            </p>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="touch-target px-6 py-2.5 rounded-lg bg-brand text-white font-bold text-xs hover:bg-brand-hover shadow-sm"
            >
              تسجيل الدخول بالحسابات الجاهزة 🔑
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-neutral-muted/20 pb-1 overflow-x-auto no-scrollbar scrollbar-none">
              {/* 1. Analytics Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`py-2.5 px-4 rounded-lg font-cairo font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'analytics'
                    ? 'bg-brand text-white shadow-sm font-black'
                    : 'text-neutral-body hover:bg-neutral-canvas'
                }`}
              >
                <span>📊</span>
                <span>المؤشرات والرسوم البيانية</span>
              </button>

              {/* 2. Users Management Tab (Admin/Supervisor) */}
              {isAdminOrSupervisor && (
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`py-2.5 px-4 rounded-lg font-cairo font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'users'
                      ? 'bg-brand text-white shadow-sm font-black'
                      : 'text-neutral-body hover:bg-neutral-canvas'
                  }`}
                >
                  <span>👥</span>
                  <span>إدارة المستخدمين والحسابات</span>
                </button>
              )}

              {/* 3. Items Review Queue */}
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className={`py-2.5 px-4 rounded-lg font-cairo font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'queue'
                    ? 'bg-brand text-white shadow-sm font-black'
                    : 'text-neutral-body hover:bg-neutral-canvas'
                }`}
              >
                <span>📋</span>
                <span>طابور المراجعة الطبية</span>
                {pendingItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[11px] font-black">
                    {pendingItems.length}
                  </span>
                )}
              </button>

              {/* 4. Doctors Verification (Admin/Supervisor) */}
              {isAdminOrSupervisor && (
                <button
                  type="button"
                  onClick={() => setActiveTab('doctors')}
                  className={`py-2.5 px-4 rounded-lg font-cairo font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'doctors'
                      ? 'bg-brand text-white shadow-sm font-black'
                      : 'text-neutral-body hover:bg-neutral-canvas'
                  }`}
                >
                  <span>🩺</span>
                  <span>توثيق الأطباء الجدد</span>
                  {pendingDoctors.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-caution text-white text-[11px] font-black">
                      {pendingDoctors.length}
                    </span>
                  )}
                </button>
              )}

              {/* 5. CSV Import (Admin/Supervisor) */}
              {isAdminOrSupervisor && (
                <button
                  type="button"
                  onClick={() => setActiveTab('csv')}
                  className={`py-2.5 px-4 rounded-lg font-cairo font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'csv'
                      ? 'bg-brand text-white shadow-sm font-black'
                      : 'text-neutral-body hover:bg-neutral-canvas'
                  }`}
                >
                  <span>📁</span>
                  <span>استيراد وتصدير CSV</span>
                </button>
              )}
            </div>

            {/* TAB 1: ANALYTICS & GRAPHS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {isStatsLoading && !stats ? (
                  <div className="py-16 text-center text-neutral-muted">
                    <div className="inline-block w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-bold">جاري تحميل المؤشرات والرسوم البيانية...</p>
                  </div>
                ) : stats ? (
                  <>
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Total Items */}
                      <div className="bg-white p-5 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-muted font-bold">إجمالي الأصناف</span>
                          <span className="p-2 rounded-xl bg-brand/10 text-brand text-base">🍲</span>
                        </div>
                        <div className="font-cairo font-black text-3xl text-neutral-title">
                          {stats.items.total.toLocaleString('ar-EG')}
                        </div>
                        <div className="text-[11px] text-neutral-muted flex gap-2">
                          <span className="text-safe font-bold">{stats.items.foods} طعام</span>
                          <span>•</span>
                          <span className="text-brand font-bold">{stats.items.medications} دواء</span>
                        </div>
                      </div>

                      {/* Total Users */}
                      <div className="bg-white p-5 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-muted font-bold">المستخدمين المسجلين</span>
                          <span className="p-2 rounded-xl bg-safe/10 text-safe text-base">👥</span>
                        </div>
                        <div className="font-cairo font-black text-3xl text-neutral-title">
                          {stats.users.total.toLocaleString('ar-EG')}
                        </div>
                        <div className="text-[11px] text-neutral-muted flex gap-2">
                          <span className="text-safe font-bold">{stats.users.active} نشط</span>
                          {stats.users.suspended > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-danger font-bold">{stats.users.suspended} موقوف</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Total Votes */}
                      <div className="bg-white p-5 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-muted font-bold">إجمالي تصويتات المجتمع</span>
                          <span className="p-2 rounded-xl bg-caution/10 text-caution text-base">🗳️</span>
                        </div>
                        <div className="font-cairo font-black text-3xl text-neutral-title">
                          {stats.votes.total.toLocaleString('ar-EG')}
                        </div>
                        <div className="text-[11px] text-neutral-muted flex gap-2">
                          <span className="text-safe font-bold">{stats.votes.safe} آمن</span>
                          <span>•</span>
                          <span className="text-danger font-bold">{stats.votes.hemolysis} تكسير</span>
                        </div>
                      </div>

                      {/* Doctors & Verification */}
                      <div className="bg-white p-5 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-muted font-bold">الأطباء والمتخصصين</span>
                          <span className="p-2 rounded-xl bg-purple-50 text-purple-600 text-base">🩺</span>
                        </div>
                        <div className="font-cairo font-black text-3xl text-neutral-title">
                          {(stats.users.verifiedDoctors + stats.users.pendingDoctors).toLocaleString('ar-EG')}
                        </div>
                        <div className="text-[11px] text-neutral-muted flex gap-2">
                          <span className="text-safe font-bold">{stats.users.verifiedDoctors} معتمد</span>
                          <span>•</span>
                          <span className="text-caution font-bold">{stats.users.pendingDoctors} قيد المراجعة</span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Chart 1: Safety Distribution (Gauge / Progress) */}
                      <div className="bg-white p-6 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-cairo font-bold text-base text-neutral-title flex items-center gap-2">
                            <span>🛡️</span>
                            <span>توزيع أمان الأصناف المنشورة</span>
                          </h3>
                          <span className="text-xs text-neutral-muted">{stats.items.published} صنف معتمد</span>
                        </div>

                        {/* Visual Progress Bar */}
                        {(() => {
                          const total = stats.items.published || 1;
                          const safePct = Math.round((stats.items.safety.safe / total) * 100);
                          const dangerPct = Math.round((stats.items.safety.danger / total) * 100);
                          const mixedPct = Math.max(0, 100 - safePct - dangerPct);

                          return (
                            <div className="space-y-4">
                              <div className="h-4 w-full bg-neutral-canvas rounded-full overflow-hidden flex shadow-inner">
                                <div style={{ width: `${safePct}%` }} className="bg-safe transition-all duration-500" title={`آمن: ${safePct}%`} />
                                <div style={{ width: `${mixedPct}%` }} className="bg-amber-400 transition-all duration-500" title={`يحتاج تصويت: ${mixedPct}%`} />
                                <div style={{ width: `${dangerPct}%` }} className="bg-danger transition-all duration-500" title={`ممنوع/تكسير: ${dangerPct}%`} />
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                                <div className="p-3 rounded-xl bg-safe/10 border border-safe/20">
                                  <span className="block text-safe font-cairo font-black text-xl">{safePct}%</span>
                                  <span className="text-[11px] text-neutral-body font-bold">آمن للمرضى ({stats.items.safety.safe})</span>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                                  <span className="block text-amber-600 font-cairo font-black text-xl">{mixedPct}%</span>
                                  <span className="text-[11px] text-neutral-body font-bold">قيد التقييم ({stats.items.safety.mixed})</span>
                                </div>
                                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20">
                                  <span className="block text-danger font-cairo font-black text-xl">{dangerPct}%</span>
                                  <span className="text-[11px] text-neutral-body font-bold">ممنوع ومحذور ({stats.items.safety.danger})</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Chart 2: Items by Origin Breakdown */}
                      <div className="bg-white p-6 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-cairo font-bold text-base text-neutral-title flex items-center gap-2">
                            <span>🛒</span>
                            <span>توزيع الأصناف حسب المصدر</span>
                          </h3>
                          <span className="text-xs text-neutral-muted">سوبر ماركت، مطاعم، صيدلية</span>
                        </div>

                        <div className="space-y-3">
                          {[
                            { label: 'سوبر ماركت وسناكس', count: stats.items.byOrigin.supermarket, icon: '🛒', color: 'bg-indigo-500' },
                            { label: 'مطاعم وأكل جاهز', count: stats.items.byOrigin.restaurant, icon: '🍽️', color: 'bg-emerald-500' },
                            { label: 'أدوية وصيدلية', count: stats.items.byOrigin.pharmacy, icon: '💊', color: 'bg-rose-500' },
                            { label: 'أكل بيتي وطبيعي', count: stats.items.byOrigin.home, icon: '🍲', color: 'bg-amber-500' },
                          ].map((cat) => {
                            const max = Math.max(1, stats.items.total);
                            const pct = Math.round((cat.count / max) * 100);
                            return (
                              <div key={cat.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                  </span>
                                  <span className="text-neutral-muted font-mono">{cat.count} ({pct}%)</span>
                                </div>
                                <div className="h-2.5 w-full bg-neutral-canvas rounded-full overflow-hidden">
                                  <div style={{ width: `${pct}%` }} className={`h-full ${cat.color} rounded-full transition-all duration-500`} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Chart 3: G6PD Family Relations Breakdown */}
                      <div className="bg-white p-6 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-cairo font-bold text-base text-neutral-title flex items-center gap-2">
                            <span>👨‍👩‍👧‍👦</span>
                            <span>صلة القرابة لمريض أنيميا الفول</span>
                          </h3>
                          <span className="text-xs text-neutral-muted">المسجلة في الحسابات</span>
                        </div>

                        {stats.users.byRelation.length === 0 ? (
                          <p className="text-xs text-neutral-muted py-6 text-center">لا توجد بيانات صلة قرابة مسجلة بعد</p>
                        ) : (
                          <div className="space-y-2.5">
                            {stats.users.byRelation.map((rel) => {
                              const totalWithRel = stats.users.byRelation.reduce((acc, r) => acc + r.count, 0) || 1;
                              const pct = Math.round((rel.count / totalWithRel) * 100);
                              return (
                                <div key={rel.patient_relation} className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-neutral-body w-20 shrink-0">
                                    {rel.patient_relation}
                                  </span>
                                  <div className="flex-1 h-3 bg-neutral-canvas rounded-full overflow-hidden">
                                    <div style={{ width: `${pct}%` }} className="h-full bg-brand rounded-full transition-all duration-500" />
                                  </div>
                                  <span className="text-xs font-mono font-bold text-neutral-muted w-14 text-left shrink-0">
                                    {rel.count} ({pct}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Chart 4: Top 5 Most Voted Items in Community */}
                      <div className="bg-white p-6 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-cairo font-bold text-base text-neutral-title flex items-center gap-2">
                            <span>🔥</span>
                            <span>أكثر 5 أصناف نشاطاً وتصويتاً</span>
                          </h3>
                          <span className="text-xs text-neutral-muted">تصويتات المجتمع</span>
                        </div>

                        <div className="space-y-3">
                          {stats.topVotedItems.map((item, idx) => {
                            const safePct = item.total_votes > 0 ? Math.round((item.safe_votes / item.total_votes) * 100) : 0;
                            return (
                              <div key={item.id} className="p-2.5 rounded-xl bg-neutral-canvas/50 border border-neutral-muted/15 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-full bg-brand/10 text-brand font-black text-xs flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="truncate">
                                    <span className="text-xs font-bold text-neutral-title block truncate">{item.name}</span>
                                    <span className="text-[10px] text-neutral-muted">
                                      {item.category === 'food' ? 'طعام' : 'دواء'} • {item.total_votes} صوت
                                    </span>
                                  </div>
                                </div>
                                <div className="text-left shrink-0">
                                  <span className={`text-xs font-black font-cairo px-2 py-0.5 rounded-md ${
                                    safePct >= 70 ? 'bg-safe/10 text-safe' : safePct <= 30 ? 'bg-danger/10 text-danger' : 'bg-caution/10 text-caution'
                                  }`}>
                                    {safePct}% أمان
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* TAB 2: USERS MANAGEMENT */}
            {activeTab === 'users' && isAdminOrSupervisor && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-neutral-muted/20 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="w-full md:w-80 relative">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="ابحث بالاسم، البريد، أو رقم الهاتف..."
                      className="w-full h-10 pr-9 pl-4 rounded-xl border border-neutral-muted/30 text-xs focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-neutral-muted text-sm">🔍</span>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {/* Role Filter */}
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-neutral-muted/30 text-xs font-bold text-neutral-body bg-white outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="all">كل الأدوار</option>
                      <option value="user">أعضاء عاديون</option>
                      <option value="doctor">أطباء وصيادلة</option>
                      <option value="supervisor">مشرفون</option>
                      <option value="admin">مديرون (Admins)</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-neutral-muted/30 text-xs font-bold text-neutral-body bg-white outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="all">كل الحالات</option>
                      <option value="active">🟢 نشط</option>
                      <option value="suspended">🔴 موقوف / مجمد</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => authToken && loadUsers(authToken, userSearch, userRoleFilter, userStatusFilter)}
                      className="touch-target h-10 px-4 rounded-xl bg-brand text-white font-bold text-xs hover:bg-brand-hover shadow-sm flex items-center gap-1.5 shrink-0"
                    >
                      <span>تحديث</span>
                      <span>🔄</span>
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-neutral-muted/20 shadow-xs overflow-hidden">
                  {isUsersLoading ? (
                    <div className="py-16 text-center text-neutral-muted">
                      <div className="inline-block w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-xs font-bold">جاري تحميل المستخدمين...</p>
                    </div>
                  ) : usersList.length === 0 ? (
                    <div className="py-16 text-center text-neutral-muted space-y-2">
                      <span className="text-4xl block">👥</span>
                      <p className="text-xs font-bold">لم يتم العثور على أي مستخدمين مطابقين للبحث</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-neutral-canvas/60 border-b border-neutral-muted/15 text-[11px] font-bold text-neutral-muted">
                            <th className="py-3 px-4">المستخدم</th>
                            <th className="py-3 px-4">بيانات الاتصال</th>
                            <th className="py-3 px-4">القرابة</th>
                            <th className="py-3 px-4">الدور</th>
                            <th className="py-3 px-4">الحالة</th>
                            <th className="py-3 px-4 text-center">الإجراءات والتحكم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-muted/10 text-xs">
                          {usersList.map((u) => {
                            const isSuspended = Boolean(u.is_suspended);
                            const isMainAdmin = u.id === 1;

                            return (
                              <tr key={u.id} className={`hover:bg-neutral-canvas/30 transition-colors ${isSuspended ? 'bg-rose-50/40' : ''}`}>
                                {/* User Info */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-black text-xs flex items-center justify-center shrink-0">
                                      {u.name.slice(0, 1)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-neutral-title block">{u.name}</span>
                                      <span className="text-[10px] text-neutral-muted">
                                        انضم: {new Date(u.created_at).toLocaleDateString('ar-EG')}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Contact info */}
                                <td className="py-3.5 px-4 font-mono text-neutral-body">
                                  <div>{u.identifier}</div>
                                  {u.phone && (
                                    <div className="text-[11px] text-neutral-muted">📱 {u.phone}</div>
                                  )}
                                </td>

                                {/* Relation */}
                                <td className="py-3.5 px-4">
                                  {u.patient_relation ? (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold">
                                      {u.patient_relation}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-muted text-[11px]">—</span>
                                  )}
                                </td>

                                {/* Role Badge */}
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    u.role === 'admin'
                                      ? 'bg-amber-100 text-amber-800'
                                      : u.role === 'supervisor'
                                      ? 'bg-blue-100 text-blue-800'
                                      : u.role === 'doctor'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-neutral-canvas text-neutral-body'
                                  }`}>
                                    <span>
                                      {u.role === 'admin' ? '👑 مدير' : u.role === 'supervisor' ? '🛡️ مشرف' : u.role === 'doctor' ? '🩺 طبيب' : 'عضو'}
                                    </span>
                                  </span>
                                </td>

                                {/* Status */}
                                <td className="py-3.5 px-4">
                                  {isSuspended ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[11px] font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                                      <span>موقوف</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-safe/10 text-safe text-[11px] font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-safe" />
                                      <span>نشط</span>
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* Suspend / Unsuspend button */}
                                    {!isMainAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSuspension(u)}
                                        className={`touch-target px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                          isSuspended
                                            ? 'bg-safe text-white hover:bg-safe/90'
                                            : 'bg-danger/10 text-danger hover:bg-danger hover:text-white'
                                        }`}
                                        title={isSuspended ? 'إلغاء التجميد وتنشيط الحساب' : 'وقف وتجميد الحساب'}
                                      >
                                        {isSuspended ? 'تنشيط ✅' : 'وقف الحساب ⛔'}
                                      </button>
                                    )}

                                    {/* Role edit button (Admin only) */}
                                    {currentUser?.role === 'admin' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUserToEditRole(u);
                                          setSelectedNewRole(u.role);
                                        }}
                                        className="touch-target px-2.5 py-1 rounded-lg bg-neutral-canvas text-neutral-title hover:bg-brand hover:text-white text-xs font-bold transition-all border border-neutral-muted/20"
                                        title="تغيير صلاحيات ودور المستخدم"
                                      >
                                        تغيير الدور 🔄
                                      </button>
                                    )}

                                    {/* Delete button (Admin only) */}
                                    {currentUser?.role === 'admin' && !isMainAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => setUserToDelete(u)}
                                        className="touch-target p-1.5 rounded-lg text-neutral-muted hover:text-danger hover:bg-danger/10 text-xs transition-all"
                                        title="حذف المستخدم نهائياً"
                                      >
                                        🗑️
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: QUEUE */}
            {activeTab === 'queue' && (
              <div className="space-y-4">
                {/* Queue Sub-tabs and refresh */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-muted/15">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQueueSubTab('pending')}
                      className={`touch-target px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        queueSubTab === 'pending'
                          ? 'bg-brand text-white shadow-xs font-black'
                          : 'bg-white text-neutral-body border border-neutral-muted/20 hover:bg-neutral-canvas'
                      }`}
                    >
                      <span>📋 أصناف تنتظر الاعتماد</span>
                      {pendingItems.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[10px] font-black">
                          {pendingItems.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQueueSubTab('reviewed');
                        if (authToken) loadReviewedItems(authToken);
                      }}
                      className={`touch-target px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        queueSubTab === 'reviewed'
                          ? 'bg-brand text-white shadow-xs font-black'
                          : 'bg-white text-neutral-body border border-neutral-muted/20 hover:bg-neutral-canvas'
                      }`}
                    >
                      <span>🔒 سجل الأصناف المحسومة والمعتمدة</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (authToken) {
                        if (queueSubTab === 'pending') loadPendingItems(authToken);
                        else loadReviewedItems(authToken);
                      }
                    }}
                    className="touch-target px-3.5 py-1.5 rounded-xl bg-white border border-neutral-muted/30 text-xs font-bold text-brand hover:bg-brand/5 shadow-xs flex items-center gap-1.5 self-end sm:self-auto"
                  >
                    <span>تحديث القائمة</span>
                    <span>🔄</span>
                  </button>
                </div>

                {isQueueLoading ? (
                  <div className="py-16 text-center text-neutral-muted">
                    <div className="inline-block w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-bold">جاري تحميل الأصناف...</p>
                  </div>
                ) : queueSubTab === 'pending' ? (
                  /* PENDING ITEMS LIST */
                  pendingItems.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-neutral-muted/20 space-y-2">
                      <span className="text-4xl block">✨</span>
                      <h3 className="font-cairo font-bold text-base text-neutral-title">
                        طابور المراجعة فارغ تماماً
                      </h3>
                      <p className="text-xs text-neutral-muted">
                        تمت مراجعة واعتماد جميع الأصناف المقدمة من الأعضاء بنجاح.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingItems.map((item) => {
                        const isEditing = editingItem?.id === item.id;
                        const isLockedByOther =
                          Boolean(item.reviewed_by) &&
                          item.reviewed_by !== currentUser?.userId &&
                          currentUser?.role !== 'admin' &&
                          currentUser?.role !== 'supervisor';
                        const isClaimedByMe = item.reviewed_by === currentUser?.userId;

                        return (
                          <div
                            key={item.id}
                            className={`bg-white p-5 rounded-2xl border shadow-xs space-y-4 ${
                              isLockedByOther ? 'border-amber-300 bg-amber-50/20' : 'border-neutral-muted/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">
                                  {item.category === 'food' ? '🍲' : '💊'}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-base text-neutral-title block">
                                      {item.name}
                                    </span>
                                    {isClaimedByMe && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                        🔒 محجوز لك
                                      </span>
                                    )}
                                    {isLockedByOther && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                        🔒 مقفل لدكتور آخر
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-neutral-muted block">
                                    أضافه العضو: <strong>{item.creator_name || 'عضو مجهول'}</strong> • بتاريخ {new Date(item.created_at).toLocaleDateString('ar-EG')}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] px-2.5 py-1 rounded-full bg-neutral-canvas text-neutral-muted font-bold shrink-0">
                                {item.origin === 'supermarket'
                                  ? '🛒 سوبر ماركت'
                                  : item.origin === 'restaurant'
                                  ? '🍽️ أكل مطاعم'
                                  : item.origin === 'pharmacy'
                                  ? '💊 صيدلية'
                                  : item.origin === 'home'
                                  ? '🍲 أكل بيتي'
                                  : 'عام'}
                              </span>
                            </div>

                            {/* Lock Warning if claimed by another doctor */}
                            {isLockedByOther ? (
                              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span>🔒</span>
                                  <span>
                                    بدأ مراجعة هذا الصنف د. {item.reviewer_name || 'طبيب متخصص'}
                                  </span>
                                </div>
                                <p className="text-[11px] font-normal text-amber-700">
                                  تم قفل الصنف على الطبيب الذي بدأ مراجعته أولاً لمنع تضارب القرارات الطبية. لا يمكن لطبيب آخر التدخل فيه.
                                </p>
                              </div>
                            ) : null}

                            {/* Quick Edit Form for Doctors */}
                            {isEditing ? (
                              <div className="p-3 rounded-xl bg-neutral-canvas border border-neutral-muted/30 space-y-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-neutral-body mb-1">
                                    الاسم الدقيق للصنف:
                                  </label>
                                  <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={(e) =>
                                      setEditingItem({ ...editingItem, name: e.target.value })
                                    }
                                    className="w-full h-9 px-3 rounded-lg border border-neutral-muted/40 text-xs focus:border-brand outline-none"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-bold text-neutral-body mb-1">
                                      النوع:
                                    </label>
                                    <select
                                      value={editingItem.category}
                                      onChange={(e) =>
                                        setEditingItem({
                                          ...editingItem,
                                          category: e.target.value as 'food' | 'medication',
                                        })
                                      }
                                      className="w-full h-8 px-2 rounded-lg border border-neutral-muted/40 text-xs"
                                    >
                                      <option value="food">طعام</option>
                                      <option value="medication">دواء</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-neutral-body mb-1">
                                      المصدر:
                                    </label>
                                    <select
                                      value={editingItem.origin}
                                      onChange={(e) =>
                                        setEditingItem({ ...editingItem, origin: e.target.value })
                                      }
                                      className="w-full h-8 px-2 rounded-lg border border-neutral-muted/40 text-xs"
                                    >
                                      <option value="supermarket">🛒 سوبر ماركت</option>
                                      <option value="restaurant">🍽️ مطاعم</option>
                                      <option value="pharmacy">💊 صيدلية</option>
                                      <option value="home">🍲 أكل بيتي</option>
                                      <option value="general">عام</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {/* Action Buttons (Disabled if locked by another doctor) */}
                            {!isLockedByOther && (
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-muted/15">
                                {!isEditing ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingItem({
                                        id: item.id,
                                        name: item.name,
                                        category: item.category,
                                        origin: item.origin,
                                      });
                                      handleClaimItem(item.id);
                                    }}
                                    className="touch-target px-3 py-1.5 rounded-lg border border-neutral-muted/30 text-neutral-body text-xs font-bold hover:bg-neutral-canvas"
                                  >
                                    تعديل بيانات الصنف ✏️
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditingItem(null)}
                                    className="touch-target px-3 py-1.5 rounded-lg text-neutral-muted text-xs font-bold hover:underline"
                                  >
                                    إلغاء التعديل
                                  </button>
                                )}

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleReviewItem(item.id, 'reject')}
                                    className="touch-target px-3 py-1.5 rounded-lg border border-danger/30 text-danger text-xs font-bold hover:bg-danger/10"
                                  >
                                    رفض الصنف ✕
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewItem(item.id, 'approve')}
                                    className="touch-target px-4 py-1.5 rounded-lg bg-safe text-white text-xs font-bold hover:bg-safe/90 shadow-sm"
                                  >
                                    اعتماد ونشر الصنف ✓
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* REVIEWED / DECIDED ITEMS HISTORY */
                  reviewedItems.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-neutral-muted/20 space-y-2">
                      <span className="text-4xl block">📋</span>
                      <h3 className="font-cairo font-bold text-base text-neutral-title">
                        لا توجد أصناف محسومة في السجل بعد
                      </h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reviewedItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-5 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">
                                {item.category === 'food' ? '🍲' : '💊'}
                              </span>
                              <div>
                                <span className="font-bold text-base text-neutral-title block">
                                  {item.name}
                                </span>
                                <span className="text-[11px] text-neutral-muted">
                                  {item.origin === 'supermarket'
                                    ? '🛒 سوبر ماركت'
                                    : item.origin === 'restaurant'
                                    ? '🍽️ أكل مطاعم'
                                    : item.origin === 'pharmacy'
                                    ? '💊 صيدلية'
                                    : 'عام'}
                                </span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              item.status === 'published'
                                ? 'bg-safe/10 text-safe'
                                : 'bg-danger/10 text-danger'
                            }`}>
                              {item.status === 'published' ? '✅ معتمد ومنشور' : '❌ صنف مرفوض'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-neutral-canvas/70 border border-neutral-muted/15 text-xs text-neutral-body flex items-center justify-between">
                            <div>
                              <span className="text-neutral-muted block text-[10px]">المراجع الطبي:</span>
                              <span className="font-bold text-neutral-title">د. {item.reviewer_name || 'طبيب متخصص'}</span>
                            </div>
                            <span className="text-[11px] font-bold text-neutral-muted">
                              🔒 قرار طبي نهائي ومقفل
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* TAB 4: DOCTORS VERIFICATION */}
            {activeTab === 'doctors' && isAdminOrSupervisor && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-cairo font-bold text-lg text-neutral-title">
                    طلبات توثيق الأطباء الجدد (مراجعة كارنيه النقابة) 🩺
                  </h2>
                  <button
                    type="button"
                    onClick={() => authToken && loadPendingDoctors(authToken)}
                    className="touch-target px-3 py-1.5 rounded-lg bg-white border border-neutral-muted/30 text-xs font-bold text-brand hover:bg-brand/5 shadow-xs flex items-center gap-1.5"
                  >
                    <span>تحديث القائمة</span>
                    <span>🔄</span>
                  </button>
                </div>

                {isDoctorsLoading ? (
                  <div className="py-16 text-center text-neutral-muted">
                    <div className="inline-block w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-bold">جاري تحميل طلبات الأطباء...</p>
                  </div>
                ) : pendingDoctors.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-neutral-muted/20 space-y-2">
                    <span className="text-4xl block">🎉</span>
                    <h3 className="font-cairo font-bold text-base text-neutral-title">
                      لا توجد طلبات توثيق أطباء معلقة
                    </h3>
                    <p className="text-xs text-neutral-muted">
                      تمت مراجعة واعتماد جميع كارنيهات النقابة المسجلة في النظام.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white p-5 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-black text-brand">طبيب / صيدلي جديد</span>
                            <h3 className="font-cairo font-bold text-lg text-neutral-title">
                              {doc.name}
                            </h3>
                            <div className="text-xs text-neutral-muted space-y-0.5 mt-1 font-mono">
                              <div>📧 {doc.identifier}</div>
                              {doc.phone && <div>📱 {doc.phone}</div>}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-caution/15 text-caution font-bold text-xs">
                            بانتظار التحقق ⏳
                          </span>
                        </div>

                        {/* Syndicate Card Image preview */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-neutral-title block">
                            صورة كارنيه النقابة المرفوع:
                          </span>
                          {doc.syndicate_card_url ? (
                            <div className="relative group rounded-xl overflow-hidden border border-neutral-muted/30 bg-neutral-canvas">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={doc.syndicate_card_url}
                                alt={`كارنيه نقابة ${doc.name}`}
                                className="w-full h-44 object-contain bg-black/5"
                              />
                              <a
                                href={doc.syndicate_card_url}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute bottom-2 left-2 px-3 py-1 rounded-lg bg-black/75 text-white text-[11px] font-bold hover:bg-black transition-all"
                              >
                                تكبير الصورة في نافذة جديدة ↗
                              </a>
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-neutral-canvas text-center text-xs text-neutral-muted">
                              لم يتم رفع صورة الكارنيه
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-muted/15">
                          <button
                            type="button"
                            onClick={() => handleVerifyDoctor(doc.id, false)}
                            className="touch-target px-4 py-2 rounded-lg border border-danger/30 text-danger text-xs font-bold hover:bg-danger/10"
                          >
                            رفض الطلب ✕
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyDoctor(doc.id, true)}
                            className="touch-target px-5 py-2 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-sm"
                          >
                            اعتماد الطبيب وتوثيقه 🩺✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: CSV OPERATIONS */}
            {activeTab === 'csv' && isAdminOrSupervisor && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-neutral-muted/20 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-muted/15">
                    <div>
                      <h2 className="font-cairo font-bold text-lg text-neutral-title">
                        استيراد الأصناف عبر ملف CSV دفعة واحدة 📊
                      </h2>
                      <p className="text-xs text-neutral-muted mt-0.5">
                        أضف مئات الأكلات والأدوية إلى النظام دفعة واحدة لملء الدليل بسرعة وبدون أخطاء.
                      </p>
                    </div>

                    <a
                      href="/api/admin/csv-import"
                      download="weqaya_items_template.csv"
                      className="touch-target px-4 py-2 rounded-xl bg-brand/10 text-brand font-bold text-xs hover:bg-brand hover:text-white transition-all flex items-center gap-2 shrink-0 border border-brand/20 shadow-xs"
                    >
                      <span>تحميل نموذج CSV جاهز للتعبئة 📥</span>
                    </a>
                  </div>

                  <form onSubmit={handleCsvSubmit} className="space-y-4">
                    {/* File upload box */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-title mb-2">
                        1. اختر ملف الـ CSV من جهازك:
                      </label>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setCsvFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-neutral-body file:touch-target file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand/10 file:text-brand hover:file:bg-brand hover:file:text-white file:transition-all cursor-pointer"
                      />
                    </div>

                    {/* Or paste directly */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-title mb-1">
                        أو 2. الصق نصوص أسطر الـ CSV هنا مباشرة:
                      </label>
                      <textarea
                        rows={5}
                        value={csvPastedText}
                        onChange={(e) => setCsvPastedText(e.target.value)}
                        placeholder="الاسم,النوع,المصدر,التصويت_الافتراضي,نسبة_التكسير,نسبة_الأمان,إجمالي_التصويتات&#10;فول سوداني محمص,food,supermarket,safe,5,95,100"
                        className="w-full p-3 rounded-xl border border-neutral-muted/30 text-xs font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isCsvUploading}
                        className="touch-target px-6 py-2.5 rounded-xl bg-brand text-white font-bold text-xs hover:bg-brand-hover shadow-md disabled:opacity-50 flex items-center gap-2"
                      >
                        {isCsvUploading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>جاري الفحص والإدخال الذري...</span>
                          </>
                        ) : (
                          <>
                            <span>رفع وإدخال الأصناف الآن 🚀</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* CSV Import Result Box */}
                  {csvResult && (
                    <div className="mt-4 p-4 rounded-xl bg-safe/10 border border-safe/30 text-safe space-y-1">
                      <h4 className="font-bold text-xs flex items-center gap-1.5">
                        <span>✓</span>
                        <span>{csvResult.message}</span>
                      </h4>
                      <div className="text-[11px] text-neutral-body">
                        تم إدخال <strong>{csvResult.inserted}</strong> صنف جديد، وتخطي <strong>{csvResult.skipped}</strong> أصناف موجودة مسبقاً لمنع التكرار.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Role Change Modal */}
      {userToEditRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-neutral-muted/20">
            <h3 className="font-cairo font-bold text-base text-neutral-title">
              تغيير صلاحيات: {userToEditRole.name}
            </h3>
            <div>
              <label className="block text-xs font-bold text-neutral-body mb-2">
                اختر الدور الجديد:
              </label>
              <select
                value={selectedNewRole}
                onChange={(e) => setSelectedNewRole(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-neutral-muted/30 text-xs font-bold outline-none focus:border-brand"
              >
                <option value="user">عضو عادي (User)</option>
                <option value="doctor">طبيب / صيدلي معتمد (Doctor)</option>
                <option value="supervisor">مشرف محتوى (Supervisor)</option>
                <option value="admin">مدير النظام (Admin)</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToEditRole(null)}
                className="touch-target px-4 py-2 rounded-xl border border-neutral-muted/30 text-xs font-bold hover:bg-neutral-canvas"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="touch-target px-5 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-sm"
              >
                حفظ التغيير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-neutral-muted/20">
            <span className="text-4xl block text-center">⚠️</span>
            <div className="text-center space-y-1">
              <h3 className="font-cairo font-bold text-base text-neutral-title">
                تأكيد حذف الحساب نهائياً
              </h3>
              <p className="text-xs text-neutral-muted leading-relaxed">
                هل أنت متأكد من رغبتك في حذف حساب <strong>{userToDelete.name}</strong> ({userToDelete.identifier})؟ لن يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="touch-target px-4 py-2 rounded-xl border border-neutral-muted/30 text-xs font-bold hover:bg-neutral-canvas"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="touch-target px-5 py-2 rounded-xl bg-danger text-white text-xs font-bold hover:bg-danger/90 shadow-sm"
              >
                تأكيد الحذف 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user, token) => {
          setCurrentUser(user);
          setAuthToken(token);
          localStorage.setItem('weqaya_token', token);
          document.cookie = `weqaya_token=${token}; path=/; max-age=604800; SameSite=Lax`;
          setIsAuthOpen(false);
          showToast(`أهلاً بك يا ${user.name}`, 'success');
        }}
        onShowToast={showToast}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onItemAdded={(newItem) => {
          setIsAddOpen(false);
          showToast(`تمت إضافة «${newItem.name}» بنجاح وهو الآن في طابور المراجعة 🎉`, 'success');
          if (authToken) {
            if (activeTab === 'queue') loadPendingItems(authToken);
            if (stats) loadStats(authToken);
          }
        }}
        onShowToast={showToast}
        token={authToken}
      />

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
