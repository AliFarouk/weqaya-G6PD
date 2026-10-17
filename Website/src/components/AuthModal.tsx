'use client';

import React, { useState } from 'react';
import { TokenPayload } from '@/lib/auth/jwt';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: TokenPayload, token: string) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  pendingVoteItemName?: string | null;
}

const PATIENT_RELATION_OPTIONS = [
  { value: 'انا', label: '👤 أنا' },
  { value: 'ابنى', label: '👦 ابني' },
  { value: 'بنتى', label: '👧 بنتي' },
  { value: 'اخى', label: '🧑 أخي' },
  { value: 'اختى', label: '👩 أختي' },
  { value: 'ابى', label: '👴 أبي' },
  { value: 'امى', label: '👵 أمي' },
  { value: 'اخر', label: '✨ آخر' },
];

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
  pendingVoteItemName,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [patientRelation, setPatientRelation] = useState('');
  const [password, setPassword] = useState('');
  const [isDoctor, setIsDoctor] = useState(false);
  const [syndicateCardUrl, setSyndicateCardUrl] = useState('');
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Handle syndicate card upload
  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCard(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSyndicateCardUrl(data.url);
        onShowToast('تم رفع صورة كارنيه النقابة بنجاح ✅', 'success');
      } else {
        setErrorMsg('تعذر رفع الصورة، يرجى المحاولة بصيغة JPG أو PNG');
      }
    } catch {
      setErrorMsg('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploadingCard(false);
    }
  };

  const handleFillDemo = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setMode('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'register' && isDoctor && !syndicateCardUrl) {
      setErrorMsg('يرجى إرفاق صورة كارنيه النقابة للتحقق من صفتك الطبية');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register'
          ? {
              name,
              identifier,
              phone: phone.trim() || undefined,
              patient_relation: patientRelation || undefined,
              password,
              is_doctor: isDoctor,
              syndicate_card_url: syndicateCardUrl || undefined,
            }
          : { identifier, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error?.message || 'حدث خطأ أثناء المصادقة');
        return;
      }

      onSuccess(data.user, data.token);

      if (mode === 'register') {
        if (isDoctor) {
          onShowToast('تم إنشاء الحساب! كارنيه النقابة قيد المراجعة من المشرفين 🩺', 'info');
        } else {
          onShowToast('تم إنشاء حسابك وتأكيد صوتك بنجاح! 🛡️', 'success');
        }
      } else {
        onShowToast(`أهلاً بك مجدداً يا ${data.user.name} ✅`, 'success');
      }

      onClose();
    } catch {
      setErrorMsg('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
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
            <span className="text-2xl">🛡️</span>
            <div>
              <h2 id="auth-modal-title" className="font-cairo font-bold text-lg text-neutral-title leading-tight">
                {pendingVoteItemName
                  ? `صوتك يحمي غيرك!`
                  : mode === 'register'
                  ? 'إنشاء حساب جديد في 10 ثوانٍ'
                  : 'تسجيل الدخول'}
              </h2>
              {pendingVoteItemName && (
                <span className="text-xs text-brand font-bold block mt-0.5">
                  سجل لتأكيد صوتك على: «{pendingVoteItemName}»
                </span>
              )}
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-neutral-canvas p-1 rounded-xl my-4 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-brand shadow-sm font-black'
                : 'text-neutral-body hover:text-neutral-title'
            }`}
          >
            حساب جديد 🚀
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-brand shadow-sm font-black'
                : 'text-neutral-body hover:text-neutral-title'
            }`}
          >
            تسجيل الدخول 🔑
          </button>
        </div>

        {/* Demo Fast Login Buttons */}
        {mode === 'login' && (
          <div className="p-3 mb-4 bg-brand-light/50 border border-brand/20 rounded-xl space-y-2 text-xs">
            <span className="font-black text-brand block">⚡ حسابات جاهزة لتجربة الصلاحيات:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@weqaya.org', 'Admin@123456')}
                className="px-2.5 py-1 bg-white hover:bg-brand hover:text-white rounded-md border border-brand/30 text-neutral-title text-[11px] font-bold transition-colors"
              >
                👑 مدير المنصة (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('supervisor@weqaya.org', 'Super@123456')}
                className="px-2.5 py-1 bg-white hover:bg-brand hover:text-white rounded-md border border-brand/30 text-neutral-title text-[11px] font-bold transition-colors"
              >
                🛡️ مشرف (Supervisor)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('doctor@weqaya.org', 'Doctor@123456')}
                className="px-2.5 py-1 bg-white hover:bg-brand hover:text-white rounded-md border border-brand/30 text-neutral-title text-[11px] font-bold transition-colors"
              >
                🩺 طبيب معتمد (Doctor)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('user@weqaya.org', 'User@123456')}
                className="px-2.5 py-1 bg-white hover:bg-brand hover:text-white rounded-md border border-brand/30 text-neutral-title text-[11px] font-bold transition-colors"
              >
                👤 عضو عادي (User)
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 mb-3 bg-danger-light text-danger-text text-xs font-bold rounded-xl border border-danger/20">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-neutral-title mb-1">
                الاسم الأول أو اسم الشهرة *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أم يوسف، أحمد ممدوح..."
                className="w-full h-11 px-3.5 rounded-md border border-neutral-muted/30 focus:border-brand focus:ring-1 focus:ring-brand text-sm bg-neutral-canvas/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-title mb-1">
              البريد الإلكتروني أو اسم المستخدم *
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="مثال: user@example.com أو 01012345678"
              className="w-full h-11 px-3.5 rounded-md border border-neutral-muted/30 focus:border-brand focus:ring-1 focus:ring-brand text-sm bg-neutral-canvas/50 dir-ltr text-end"
            />
          </div>

          {mode === 'register' && (
            <>
              {/* Optional Phone Number */}
              <div>
                <label className="block text-xs font-bold text-neutral-title mb-1">
                  رقم الموبايل المصري (اختياري)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 01012345678"
                  className="w-full h-11 px-3.5 rounded-md border border-neutral-muted/30 focus:border-brand focus:ring-1 focus:ring-brand text-sm bg-neutral-canvas/50 dir-ltr text-end"
                />
              </div>

              {/* Patient Relation Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-title mb-1.5">
                  مين المصاب بأنيميا الفول في الأسرة؟ (اختياري)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PATIENT_RELATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPatientRelation(patientRelation === opt.value ? '' : opt.value)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                        patientRelation === opt.value
                          ? 'border-brand bg-brand text-white shadow-xs font-black'
                          : 'border-neutral-muted/20 bg-neutral-canvas text-neutral-body hover:bg-neutral-muted/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-title mb-1">
              كلمة المرور *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="٨ أحرف على الأقل"
              className="w-full h-11 px-3.5 rounded-md border border-neutral-muted/30 focus:border-brand focus:ring-1 focus:ring-brand text-sm bg-neutral-canvas/50"
            />
          </div>

          {mode === 'register' && (
            <div className="p-3 bg-neutral-canvas/60 rounded-xl border border-neutral-muted/20 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDoctor}
                  onChange={(e) => setIsDoctor(e.target.checked)}
                  className="w-4 h-4 rounded text-brand focus:ring-brand"
                />
                <span className="text-xs text-neutral-title font-bold">
                  🩺 أنا طبيب أو صيدلي (طلب اعتماد ومراجعة الأصناف)
                </span>
              </label>

              {isDoctor && (
                <div className="pt-2 border-t border-neutral-muted/20 space-y-2 animate-in fade-in">
                  <div className="text-[11px] text-brand font-bold">
                    يرجى رفع صورة كارنيه النقابة للتحقق من هويتك المهنية:
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCardUpload}
                    className="block w-full text-xs text-neutral-body file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-brand file:text-white hover:file:bg-brand-hover cursor-pointer"
                  />
                  {isUploadingCard && (
                    <span className="text-xs text-brand block animate-pulse">جاري رفع الصورة...</span>
                  )}
                  {syndicateCardUrl && (
                    <div className="flex items-center gap-2 text-xs text-safe font-bold">
                      <span>✅ تم حفظ الكارنيه بنجاح</span>
                    </div>
                  )}
                  <p className="text-[10px] text-neutral-muted leading-relaxed">
                    * سيتم مراجعة الكارنيه واعتماده من المشرفين، وخلال تلك الفترة ستتمكن من استخدام حسابك كعضو عادي.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isUploadingCard}
            className="touch-target w-full bg-brand hover:bg-brand-hover text-white font-cairo font-bold py-3 rounded-md transition-colors shadow-md mt-4 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <span>جاري التحقق...</span>
            ) : mode === 'register' ? (
              <span>تأكيد الحساب والمتابعة فوراً ✅</span>
            ) : (
              <span>دخول إلى حسابي 🚀</span>
            )}
          </button>
        </form>

        <p className="text-[11px] text-neutral-muted text-center mt-4">
          بياناتك مشفرة ومحمية | مجاني 100% لخدمة أسر أنيميا الفول
        </p>
      </div>
    </div>
  );
}
