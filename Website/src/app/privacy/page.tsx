import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmergencyBanner from '@/components/EmergencyBanner';

export const metadata = {
  title: 'سياسة الخصوصية — وقاية G6PD',
  description: 'مسودة سياسة الخصوصية وحماية بيانات المستخدمين في منصة وقاية لأنيميا الفول.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-canvas">
      <EmergencyBanner />
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 text-start">
        <div className="card-level-1 p-6 md:p-10 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-muted/20">
            <span className="text-3xl">🛡️</span>
            <div>
              <h1 className="font-cairo font-black text-2xl md:text-3xl text-neutral-title">
                سياسة الخصوصية وحماية البيانات
              </h1>
              <span className="text-xs text-neutral-muted">
                (مسودة أولية — قيد المراجعة القانونية المعتمدة)
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm text-neutral-body leading-relaxed">
            <h2 className="font-cairo font-bold text-base text-neutral-title">
              1. ما هي البيانات التي نجمعها؟
            </h2>
            <ul className="list-disc list-inside space-y-1.5 ps-2">
              <li><strong>بيانات الحساب:</strong> الاسم المعروض، البريد الإلكتروني أو رقم الهاتف، وكلمة المرور المشفرة بتقنية argon2id.</li>
              <li><strong>مشاركات المجتمع:</strong> الأصوات المسجلة (حصل تكسير / آمن)، والأصناف التي تضيفها للدليل.</li>
              <li><strong>الملفات المرفوعة:</strong> صور أغلفة المنتجات عند رفعها اختيارياً، بعد إزالة بيانات الموقع الجغرافي (EXIF Metadata) لحماية خصوصيتك.</li>
            </ul>

            <h2 className="font-cairo font-bold text-base text-neutral-title pt-2">
              2. كيف نستخدم بياناتك؟
            </h2>
            <p>
              نستخدم البيانات فقط لإدارة حسابك، وتوثيق أصواتك ومنع تكرار التصويت، وتقديم نسب إحصائية دقيقة لمجتمع مرضى أنيميا الفول. لن نقوم ببيع أو تأجير أو مشاركة بياناتك مع أي طرف تجاري أو إعلاني خارجي.
            </p>

            <h2 className="font-cairo font-bold text-base text-neutral-title pt-2">
              3. أمن التخزين والتشفير
            </h2>
            <p>
              تُخزن كلمات المرور بتشفير عالي الأمان لا يمكن فكه حتى من قبل مديري المنصة. كما يتم استخدام بروتوكول HTTPS المشفر في جميع الاتصالات ونقل البيانات.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
