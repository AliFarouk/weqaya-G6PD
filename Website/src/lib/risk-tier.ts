export type RiskTier = 'insufficient_data' | 'danger' | 'caution' | 'safe_leaning';

export interface RiskTierInfo {
  tier: RiskTier;
  label: string;
  sublabel: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  edgeColor: string; // 4px indicator strip on right edge (RTL)
  badgeIcon: string;
}

/**
 * Strict medical-safety risk tier evaluation logic per §6.2.
 * Rationale: this is a safety product for vulnerable infants and patients,
 * a false "safe" is far worse than a false "danger".
 * 
 * Rules:
 * 1. total_votes < 5 -> insufficient_data (Neutral Gray)
 * 2. hemolysis% >= 50% -> Danger ("ممنوع / خطر تكسير")
 * 3. 20% <= hemolysis% < 50% OR (hemolysis_votes >= 3 && hemolysis% >= 10%) -> Caution ("بحذر وتحت إشراف")
 * 4. otherwise -> Safe-leaning ("آمن لأغلب المصوّتين") — NOT "آمن مؤكد".
 */
export function getRiskTier(hemolysisVotes: number, safeVotes: number, isConfirmedDanger: boolean = false): RiskTierInfo {
  if (isConfirmedDanger) {
    return {
      tier: 'danger',
      label: 'ممنوع قطعاً (مؤكد طبياً)',
      sublabel: 'بقوليات صريحة محظورة علمياً',
      textColor: '#D81B43',
      bgColor: 'rgba(245, 54, 92, 0.15)',
      borderColor: 'rgba(245, 54, 92, 0.4)',
      edgeColor: '#F5365C',
      badgeIcon: '⛔',
    };
  }

  const total = hemolysisVotes + safeVotes;

  if (total < 5) {
    return {
      tier: 'insufficient_data',
      label: 'بيانات غير كافية',
      sublabel: 'أقل من 5 مشاركات مجتمعية',
      textColor: '#525F7F',
      bgColor: '#F1F3F9',
      borderColor: '#D4D9E2',
      edgeColor: '#8898AA',
      badgeIcon: 'ℹ️',
    };
  }

  const hemolysisPercent = (hemolysisVotes / total) * 100;

  if (hemolysisPercent >= 50) {
    return {
      tier: 'danger',
      label: 'ممنوع / خطر تكسير',
      sublabel: `${Math.round(hemolysisPercent)}% أبلغوا عن تكسير دم`,
      textColor: '#D81B43',
      bgColor: 'rgba(245, 54, 92, 0.12)',
      borderColor: 'rgba(245, 54, 92, 0.3)',
      edgeColor: '#F5365C',
      badgeIcon: '⚠️',
    };
  }

  if (hemolysisPercent >= 20 || (hemolysisVotes >= 3 && hemolysisPercent >= 10)) {
    return {
      tier: 'caution',
      label: 'بحذر وتحت إشراف',
      sublabel: `${Math.round(hemolysisPercent)}% أبلغوا عن تكسير دم`,
      textColor: '#E03E19',
      bgColor: 'rgba(251, 99, 64, 0.12)',
      borderColor: 'rgba(251, 99, 64, 0.3)',
      edgeColor: '#FB6340',
      badgeIcon: '⚡',
    };
  }

  return {
    tier: 'safe_leaning',
    label: 'آمن لأغلب المصوّتين',
    sublabel: `${Math.round(100 - hemolysisPercent)}% أبلغوا أنه آمن معهم`,
    textColor: '#139E69',
    bgColor: 'rgba(45, 206, 137, 0.12)',
    borderColor: 'rgba(45, 206, 137, 0.3)',
    edgeColor: '#2DCE89',
    badgeIcon: '✅',
  };
}
