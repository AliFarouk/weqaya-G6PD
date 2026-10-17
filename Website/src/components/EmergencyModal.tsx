'use client';

import React from 'react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto text-start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-muted/20">
          <div className="flex items-center gap-2 text-danger">
            <span className="text-2xl animate-pulse">🚨</span>
            <div>
              <h2 id="emergency-modal-title" className="font-cairo font-bold text-lg sm:text-xl text-danger leading-tight">
                دليل نوبة التكسير الحادة والإجراء الفوري
              </h2>
              <span className="text-[11px] text-neutral-muted font-bold block">
                بروتوكول الطوارئ الطبي المعتمد لمرضى أنيميا الفول في مصر
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

        <div className="mt-4 space-y-4 text-xs sm:text-sm text-neutral-body leading-relaxed">
          {/* Timeline Callout */}
          <div className="p-3 bg-brand-light/60 rounded-xl border border-brand/20 text-brand font-bold flex items-center gap-2">
            <span className="text-lg shrink-0">⏱️</span>
            <span>
              <strong>توقيت ظهور الأعراض:</strong> قد تتأخر أعراض نوبة التكسير وتبدأ بالظهور بعد <strong>يوم إلى 3 أيام</strong> من تناول الفول أو الطعمية أو الدواء الممنوع.
            </span>
          </div>

          {/* 1. Critical Symptoms */}
          <div className="bg-danger-light/40 p-4 rounded-xl border border-danger/20 space-y-2">
            <h3 className="font-cairo font-black text-danger text-sm sm:text-base flex items-center gap-1.5">
              <span>⚠️</span>
              <span>1. الأعراض التحذيرية الحرجة (توجه للمستشفى فوراً إذا لاحظت أي منها):</span>
            </h3>
            <ul className="list-disc list-inside space-y-1.5 ps-1 font-bold text-neutral-title">
              <li>
                <strong>تغير لون البول:</strong> يصبح داكناً جداً يشبه الشاي المغلي أو الكولا أو القهوة.
              </li>
              <li>
                <strong>شحوب واصفرار مفاجئ:</strong> شحوب في الوجه والشفتين واصفرار بياض العينين والجلد (يرقان).
              </li>
              <li>
                <strong>خمول وتسارع النبض:</strong> إجهاد شديد، نوم غير معتاد، دوار وغثيان، وسرعة في ضربات القلب وضيق في التنفس.
              </li>
            </ul>
          </div>

          {/* 2. Hospital Crisis Protocol */}
          <div className="bg-neutral-canvas p-4 rounded-xl border border-neutral-muted/20 space-y-2.5">
            <h3 className="font-cairo font-black text-neutral-title text-sm sm:text-base flex items-center gap-1.5">
              <span>🏥</span>
              <span>2. بروتوكول المستشفى (ماذا يحدث عند حدوث التكسير؟):</span>
            </h3>
            <p className="text-xs text-neutral-muted">
              أول إجراء هو التوجه فوراً لأقرب طوارئ أطفال أو مستشفى عام لعمل تحليل هيموجلوبين فوري (CBC):
            </p>
            <div className="space-y-2">
              <div className="p-2.5 bg-white rounded-lg border border-neutral-muted/20">
                <span className="font-bold text-brand block mb-1">🔹 إذا كان التكسير بسيطاً:</span>
                <span className="text-xs text-neutral-body leading-relaxed">
                  لن يحتاج المريض لنقل دم، وسيصف له الطبيب <strong>حمض الفوليك (Folic Acid) وفيتامين B12</strong> لمساعدة النخاع على بناء خلايا الدم، مع الاهتمام بالتغذية الصحية والنوم المبكر وراحة تامة.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-danger/30">
                <span className="font-bold text-danger block mb-1">🔻 إذا كان التكسير شديداً (حاداً):</span>
                <span className="text-xs text-neutral-body leading-relaxed">
                  يحتاج المصاب إلى <strong>نقل دم بأسرع وقت ممكن</strong> بالمستشفى لتعويض النقص الحاد في كرات الدم وحماية وظائف الكلى والأعضاء الحيوية.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              <span>🌱</span>
              <span>
                <strong>مدة التعافي:</strong> يحتاج الجسم عادة من <strong>8 إلى 14 يوماً</strong> لتعويض كرات الدم الحمراء والتعافي التام من النوبة.
              </span>
            </div>
          </div>

          {/* 3. Nursing Mothers Warning */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs sm:text-sm space-y-1">
            <div className="font-black flex items-center gap-1.5 text-amber-950">
              <span>🤱</span>
              <span>تحذير حاسم للأمهات المرضعات في مصر:</span>
            </div>
            <p className="leading-relaxed">
              مركبات الفول والطعمية والبقوليات وأدوية السلفا والأسبرين <strong>تنتقل للرضيع عبر حليب الأم</strong>. إذا كان طفلك الرضيع مصاباً بأنيميا الفول، فيجب عليكِ الامتناع التام عنها طوال فترة الرضاعة.
            </p>
          </div>

          {/* Immediate Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="tel:123"
              className="touch-target flex-1 flex items-center justify-center gap-2 bg-danger text-white rounded-xl font-black py-3 hover:bg-danger-hover transition-colors shadow-md text-sm sm:text-base"
            >
              <span>📞 الاتصال بالإسعاف المصري (123)</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="touch-target px-5 py-3 rounded-xl border border-neutral-muted/30 font-bold hover:bg-neutral-canvas text-neutral-title text-xs sm:text-sm"
            >
              فهمت الإرشادات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
