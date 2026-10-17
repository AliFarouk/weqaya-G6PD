import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-neutral-muted/15 mt-auto pt-10 pb-8 px-4 md:px-8 text-start select-none">
      <div className="max-w-content mx-auto space-y-8">
        {/* Top: Logo & Description */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-neutral-muted/15">
          <div className="space-y-2">
            <Logo variant="compact" />
            <p className="text-xs text-neutral-body max-w-md leading-relaxed">
              دليل رقمي مجتمعي لحظي لمرضى أنيميا الفول في مصر والوطن العربي، لمشاركة تجارب الأمان والتكسير بالأسماء التجارية المتداولة في السوق.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-neutral-body">
            <Link href="/disclaimer" className="hover:text-brand transition-colors">
              إخلاء المسؤولية الطبية
            </Link>
            <span className="text-neutral-muted">•</span>
            <Link href="/privacy" className="hover:text-brand transition-colors">
              سياسة الخصوصية
            </Link>
            <span className="text-neutral-muted">•</span>
            <a
              href={`mailto:${process.env.SUPPORT_EMAIL || 'contact@weqaya.org'}`}
              className="hover:text-brand transition-colors"
            >
              تواصل معنا
            </a>
          </div>
        </div>

        {/* Verbatim PRD §5 Medical Disclaimer per §8 */}
        <div className="p-4 rounded-xl bg-neutral-canvas border border-neutral-muted/20 text-neutral-body text-xs leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-neutral-title text-sm">
            <span>⚠️</span>
            <span>تنبيه طبي هام وإخلاء مسؤولية:</span>
          </div>
          <p>
            المعلومات والتصويتات المعروضة على منصة «وقاية» تعبر عن تجارب مستخدمين ومصادر مجتمعية استرشادية فقط، ولا تُعد بأي حال من الأحوال بديلاً عن الاستشارة الطبية المتخصصة أو التشخيص السريري. استشر طبيبك أو الصيدلي دائماً قبل تناول أي دواء أو طعام جديد، وتوجه فوراً إلى أقرب مركز طوارئ في حال ظهور أعراض تكسر الدم أو تغير لون البول إلى الداكن (رقم الإسعاف المصري: 123).
          </p>
        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-muted text-center sm:text-start pt-2">
          <span>
            © {new Date().getFullYear()} منصة وقاية G6PD — مبادرة مجتمعية غير ربحية لحماية مرضى أنيميا الفول.
          </span>
          <span className="font-mono">v1.0.0 (Production)</span>
        </div>
      </div>
    </footer>
  );
}
