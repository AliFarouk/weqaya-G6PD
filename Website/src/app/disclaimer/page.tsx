import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmergencyBanner from '@/components/EmergencyBanner';

export const metadata = {
  title: 'إخلاء المسؤولية الطبية — وقاية G6PD',
  description: 'بيان إخلاء المسؤولية الطبية القانوني لمنصة وقاية لأنيميا الفول.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-canvas">
      <EmergencyBanner />
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 text-start">
        <div className="card-level-1 p-6 md:p-10 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-muted/20">
            <span className="text-3xl">⚠️</span>
            <h1 className="font-cairo font-black text-2xl md:text-3xl text-neutral-title">
              إخلاء المسؤولية الطبية القانوني
            </h1>
          </div>

          <div className="space-y-4 text-sm text-neutral-body leading-relaxed">
            <div className="p-4 rounded-xl bg-danger-light border border-danger/20 text-danger-text font-bold">
              تنبيه حاسم: منصة «وقاية» ليست منشأة طبية، ولا تقدم تشخيصاً طبياً أو بروتوكولات علاجية لأي مريض.
            </div>

            <h2 className="font-cairo font-bold text-base text-neutral-title pt-2">
              1. طبيعة المنصة المجتمعية
            </h2>
            <p>
              منصة وقاية G6PD هي أداة رقمية حرة ودليل مجتمعي تفاعلي مبني على تجميع مشاركات وتجارب أولياء الأمور ومرضى نقص إنزيم G6PD (أنيميا الفول) في السوق المصري والعربي. التصويتات ونسب الأمان المعروضة تعكس آراء وملاحظات شخصية لأصحابها فقط.
            </p>

            <h2 className="font-cairo font-bold text-base text-neutral-title pt-2">
              2. الفروق الفردية ودرجة نقص الإنزيم
            </h2>
            <p>
              يختلف مرض نقص إنزيم G6PD في شدته الجينية من شخص لآخر (بين المتغيرات الطفيفة والشديدة)، وبالتالي فإن مادة أو غذاء قد يتحمله مريض معين دون تكسير قد يسبب نوبة انحلال دم حادة لمريض آخر. لا تعتمد مطلقاً على تصويتات الآخرين كضمان مطلق للأمان.
            </p>

            <h2 className="font-cairo font-bold text-base text-neutral-title pt-2">
              3. الطوارئ والإجراء الفوري
            </h2>
            <p>
              في حال تناول طعام أو دواء جديد وظهور أي من أعراض التكسير (تغير لون البول إلى البني الداكن كالشاي، شحوب شديد، أو خمول وتسارع في التنفس)، يجب التوجه فوراً وبدون أي تردد إلى أقرب طوارئ أطفال أو بنك دم مع الاتصال بالإسعاف المصري على الرقم (123).
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
