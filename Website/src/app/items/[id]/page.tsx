import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmergencyBanner from '@/components/EmergencyBanner';
import DualProgressBar from '@/components/DualProgressBar';
import RiskPill from '@/components/RiskPill';

interface ItemPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ItemPageProps) {
  const id = parseInt(params.id, 10);
  const item = await db.getItemById(id);
  if (!item || item.is_hidden) {
    return { title: 'الصنف غير موجود — وقاية G6PD' };
  }

  return {
    title: `${item.name} — دليل أمان أنيميا الفول | وقاية`,
    description: `نسبة أمان وتكسير ${item.name}: ${item.safe_percent}% آمن مقابل ${item.hemolysis_percent}% تكسير وفق تصويتات المصابين.`,
  };
}

export default async function ItemPage({ params }: ItemPageProps) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const item = await db.getItemById(id);
  if (!item || item.is_hidden) notFound();

  const isFood = item.category === 'food';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-canvas">
      <EmergencyBanner />
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12 flex-1 w-full text-start">
        {/* Back navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-body hover:text-brand transition-colors mb-6"
        >
          <span>←</span>
          <span>العودة إلى الدليل والبحث</span>
        </Link>

        {/* Detailed Item Card */}
        <div className="card-level-1 p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-neutral-canvas border border-neutral-muted/20 mb-2">
                {isFood ? '🍔 أكلات وسناكس' : '💊 أدوية وصيدلية'}
              </span>
              <h1 className="font-cairo font-black text-2xl md:text-3xl text-neutral-title leading-tight">
                {item.name}
              </h1>
            </div>

            <RiskPill
              hemolysisVotes={item.hemolysis_votes}
              safeVotes={item.safe_votes}
              isConfirmedDanger={Boolean(item.is_confirmed_danger)}
              showSublabel
            />
          </div>

          {/* Dual Bar */}
          <div className="p-4 bg-neutral-canvas rounded-xl border border-neutral-muted/15">
            <DualProgressBar
              hemolysisVotes={item.hemolysis_votes}
              safeVotes={item.safe_votes}
              isConfirmedDanger={Boolean(item.is_confirmed_danger)}
              height={16}
            />
          </div>

          {/* Stats Breakdown or Confirmed Warning */}
          {item.is_confirmed_danger ? (
            <div className="p-5 bg-danger/10 rounded-xl border border-danger/30 text-start space-y-2">
              <div className="flex items-center gap-2 text-danger font-black text-base">
                <span>⛔</span>
                <span>محظور طبياً ومؤكد علمياً بنسبة 100%</span>
              </div>
              <p className="text-xs text-danger-text leading-relaxed font-bold">
                هذا الصنف من البقوليات الصريحة الممنوعة قطعاً لمرضى أنيميا الفول (G6PD) لاحتوائه على مواد مؤكسدة تسبب انحلال وتكسير كرات الدم الحمراء الحاد، ولا يخضع لتصويتات مجتمعية.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-danger-light rounded-xl border border-danger/20">
                <span className="text-xs text-danger-text font-bold block mb-1">حصل تكسير</span>
                <span className="font-cairo font-black text-xl text-danger">
                  {item.hemolysis_votes}
                </span>
              </div>
              <div className="p-3 bg-neutral-canvas rounded-xl border border-neutral-muted/20">
                <span className="text-xs text-neutral-body font-bold block mb-1">إجمالي الأصوات</span>
                <span className="font-cairo font-black text-xl text-neutral-title">
                  {item.total_votes}
                </span>
              </div>
              <div className="p-3 bg-safe-light rounded-xl border border-safe/20">
                <span className="text-xs text-safe-text font-bold block mb-1">آمن معهم</span>
                <span className="font-cairo font-black text-xl text-safe-text">
                  {item.safe_votes}
                </span>
              </div>
            </div>
          )}

          {/* Disclaimer callout */}
          <div className="p-4 rounded-xl bg-neutral-canvas/80 border border-neutral-muted/20 text-xs text-neutral-body leading-relaxed">
            ⚠️ <strong>تنبيه:</strong> هذه البيانات مستندة إلى استطلاع تجارب المجتمع فقط ولا تعتبر بديلاً عن الرأي الطبي. استشر طبيبك دائماً.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
