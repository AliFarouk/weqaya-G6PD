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
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-muted/20">
          <div className="flex items-center gap-2 text-danger">
            <span className="text-2xl">🚨</span>
            <h2 id="emergency-modal-title" className="font-cairo font-bold text-lg text-danger">
              علامات نوبة التكسير الحادة والإجراء الفوري
            </h2>
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

        <div className="mt-4 space-y-4 text-sm text-neutral-body leading-relaxed">
          <div className="p-3 bg-danger-light rounded-xl border border-danger/20 text-danger-text font-medium">
            ⚠️ هذه إرشادات توعوية عامة لمساعدتك على التحرك السريع وليست بديلاً عن التشخيص الطبي العاجل.
          </div>

          <div>
            <h3 className="font-cairo font-bold text-neutral-title text-base mb-2">
              1. العلامات التحذيرية الثلاث الحرجة (ظهور أي منها يستدعي الطوارئ):
            </h3>
            <ul className="list-disc list-inside space-y-1.5 ps-2 text-neutral-title">
              <li><strong>تغير لون البول:</strong> يصبح داكناً جداً يشبه الشاي المغلي أو الكولا.</li>
              <li><strong>شحوب واصفرار مفاجئ:</strong> شحوب الوجه والشفتين واصفرار بياض العينين (يرقان).</li>
              <li><strong>خمول وتسارع نبضات القلب:</strong> إجهاد شديد، نوم غير معتاد للطفل، وسرعة في التنفس.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-cairo font-bold text-neutral-title text-base mb-2">
              2. الخطوات الفورية المطلوبة:
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 ps-2">
              <li>التوجه فوراً لأقرب طوارئ مستشفى أطفال أو بنك دم لإجراء قياس عاجل لنسبة الهيموجلوبين.</li>
              <li>إبلاغ الطبيب فور وصولك: «الطفل مريض أنيميا فول G6PD ويشتبه في حدوث تكسير حاد».</li>
              <li>إيقاف أي دواء جديد تم تناوله مؤخراً (خاصة الأسبرين، السلفا، أو المسكنات).</li>
            </ol>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="tel:123"
              className="touch-target flex-1 flex items-center justify-center gap-2 bg-danger text-white rounded-md font-bold py-3 hover:bg-danger-hover transition-colors shadow-md text-base"
            >
              <span>📞 الاتصال بالإسعاف المصري (123)</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="touch-target px-5 py-3 rounded-md border border-neutral-muted/30 font-bold hover:bg-neutral-canvas text-neutral-title"
            >
              فهمت
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
