'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ItemRow } from '@/lib/db';
import { getRiskTier } from '@/lib/risk-tier';
import DualProgressBar from '@/components/DualProgressBar';
import VoteButtons from '@/components/VoteButtons';
import RiskPill from '@/components/RiskPill';

interface ItemCardProps {
  item: ItemRow;
  onVote: (itemId: number, voteType: 'hemolysis' | 'safe') => void;
  onReport: (itemId: number) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ItemCard({
  item,
  onVote,
  onReport,
  onShowToast,
}: ItemCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const isVotingRef = isVoting;
  const isConfirmed = Boolean(item.is_confirmed_danger);
  const tierInfo = getRiskTier(item.hemolysis_votes, item.safe_votes, isConfirmed);

  const handleVote = async (type: 'hemolysis' | 'safe') => {
    if (isVotingRef || isConfirmed) return;
    setIsVoting(true);
    try {
      await onVote(item.id, type);
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/items/${item.id}`;
    const shareData = {
      title: `${item.name} — دليل وقاية لأنيميا الفول`,
      text: isConfirmed
        ? `تنبيه: «${item.name}» صنف محظور قطعياً لمرضى أنيميا الفول (G6PD) بالإجماع العلمي.`
        : `تأكد من تجارب المرضى مع ${item.name}: ${item.safe_percent}% آمن مقابل ${item.hemolysis_percent}% تكسير.`,
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      onShowToast('تم نسخ رابط الصنف إلى الحافظة بنجاح 📋', 'success');
    } catch {
      onShowToast('تعذر نسخ الرابط', 'error');
    }
  };

  const isFood = item.category === 'food';
  const badgeIcon = isFood ? '/brand/badge-food.svg' : '/brand/badge-medication.svg';

  return (
    <article className="card-level-1 relative p-5 overflow-hidden flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-level-2 group">
      {/* 4px RTL Right-Edge Indicator Strip per §4 */}
      <div
        style={{ backgroundColor: tierInfo.edgeColor }}
        className="absolute top-0 end-0 bottom-0 w-1.5 transition-colors"
      />

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 pe-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-canvas border border-neutral-muted/20 flex items-center justify-center p-1 shrink-0">
              <Image
                src={badgeIcon}
                alt={isFood ? 'أكل وسناكس' : 'دواء وصيدلية'}
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span className="text-xs font-bold text-neutral-body">
              {item.origin === 'supermarket'
                ? '🛒 سوبر ماركت'
                : item.origin === 'restaurant'
                ? '🍽️ مطاعم وجاهز'
                : item.origin === 'home'
                ? '🍲 أكل بيتي'
                : item.origin === 'pharmacy'
                ? '💊 صيدلية'
                : isFood
                ? '🍔 أكل وسناك'
                : '💊 دواء وصيدلية'}
            </span>
          </div>

          <RiskPill
            hemolysisVotes={item.hemolysis_votes}
            safeVotes={item.safe_votes}
            isConfirmedDanger={isConfirmed}
          />
        </div>

        {/* Item Title & Trade Name */}
        <Link
          href={`/items/${item.id}`}
          className="block group-hover:text-brand transition-colors text-start"
        >
          <h2 className="font-cairo font-bold text-lg md:text-xl text-neutral-title leading-snug">
            {item.name}
          </h2>
        </Link>
      </div>

      {/* Dual Progress Bar */}
      <DualProgressBar
        hemolysisVotes={item.hemolysis_votes}
        safeVotes={item.safe_votes}
        isConfirmedDanger={isConfirmed}
      />

      {/* Action Voting Buttons or Confirmed Danger Callout */}
      {isConfirmed ? (
        <div className="w-full py-2.5 px-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-center font-bold text-xs flex items-center justify-center gap-2 select-none shadow-xs">
          <span>⛔</span>
          <span>صنف محظور طبياً ومؤكد خطورته (لا يخضع للتصويت)</span>
        </div>
      ) : (
        <VoteButtons
          currentVote={item.user_vote}
          onVote={handleVote}
          disabled={isVoting}
        />
      )}

      {/* Card Footer: Metadata & Actions */}
      <div className="flex items-center justify-between text-xs text-neutral-muted pt-2.5 border-t border-neutral-muted/15 select-none">
        <span className="text-[11px] font-medium text-neutral-muted/90">
          {isConfirmed ? 'تحذير طبي رسمي قاطع' : 'تجارب مجتمعية استرشادية'}
        </span>

        <div className="flex items-center gap-3">
          <span className="font-bold text-neutral-body">
            {isConfirmed ? 'ممنوع علمياً ⛔' : `${item.total_votes} صوّتوا`}
          </span>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-1 rounded hover:bg-neutral-canvas hover:text-brand transition-colors"
            title="مشاركة الصنف"
            aria-label="مشاركة الصنف"
          >
            📤
          </button>

          {/* Report Button */}
          <button
            type="button"
            onClick={() => onReport(item.id)}
            className="p-1 rounded hover:bg-neutral-canvas hover:text-danger transition-colors"
            title="إبلاغ عن محتوى غير لائق"
            aria-label="إبلاغ"
          >
            🚩
          </button>
        </div>
      </div>
    </article>
  );
}
