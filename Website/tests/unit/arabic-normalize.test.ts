import { describe, it, expect } from 'vitest';
import {
  normalizeArabic,
  normalizeIdentifier,
  calculateTextSimilarity,
  findItemSuggestions,
} from '@/lib/arabic-normalize';
import { getRiskTier } from '@/lib/risk-tier';

describe('normalizeArabic', () => {
  it('strips tashkeel and tatweel correctly', () => {
    expect(normalizeArabic('طَعْمِيَّةٌ سَاخِنَة')).toBe('طعميه ساخنه');
    expect(normalizeArabic('لـانـشـون')).toBe('لانشون');
  });

  it('normalizes alef, yaa, taa marbuta, and hamza forms', () => {
    expect(normalizeArabic('أحمد إبراهيم آمن')).toBe('احمد ابراهيم امن');
    expect(normalizeArabic('مستشفى مصطفى')).toBe('مستشفي مصطفي');
    expect(normalizeArabic('طماطم معلبة')).toBe('طماطم معلبه');
    expect(normalizeArabic('مسؤولية بئر')).toBe('مسووليه بير');
  });

  it('normalizes Arabic-Indic digits to Latin', () => {
    expect(normalizeArabic('ريفو ٣٢٠ مجم')).toBe('ريفو 320 مجم');
  });
});

describe('normalizeIdentifier', () => {
  it('normalizes emails to lowercase trimmed', () => {
    expect(normalizeIdentifier('  User@Example.COM  ')).toEqual({
      type: 'email',
      canonical: 'user@example.com',
    });
  });

  it('canonicalizes Egyptian phone numbers', () => {
    expect(normalizeIdentifier('01012345678')).toEqual({
      type: 'phone',
      canonical: '+20 10 1234 5678',
    });
    expect(normalizeIdentifier('+201198765432')).toEqual({
      type: 'phone',
      canonical: '+20 11 9876 5432',
    });
    expect(normalizeIdentifier('٠١٢٣٤٥٦٧٨٩٠')).toEqual({
      type: 'phone',
      canonical: '+20 12 3456 7890',
    });
  });
});

describe('getRiskTier', () => {
  it('returns insufficient_data when total votes < 5', () => {
    expect(getRiskTier(1, 2).tier).toBe('insufficient_data');
    expect(getRiskTier(0, 4).tier).toBe('insufficient_data');
  });

  it('returns danger when hemolysis% >= 50%', () => {
    expect(getRiskTier(50, 50).tier).toBe('danger');
    expect(getRiskTier(90, 10).tier).toBe('danger');
  });

  it('returns caution when 20% <= hemolysis < 50% or hemolysis >= 3 with >= 10%', () => {
    expect(getRiskTier(30, 70).tier).toBe('caution');
    expect(getRiskTier(3, 20).tier).toBe('caution');
  });

  it('returns safe_leaning when low hemolysis and enough votes', () => {
    expect(getRiskTier(1, 99).tier).toBe('safe_leaning');
    expect(getRiskTier(0, 10).tier).toBe('safe_leaning');
  });
});

describe('Arabic Text Similarity & Duplicate Prevention (§User Request)', () => {
  it('detects 100% exact match when comparing with and without "ال" (e.g. فول vs الفول)', () => {
    const res = calculateTextSimilarity('الفول', 'فول');
    expect(res.isExactMatch).toBe(true);
    expect(res.similarity).toBe(1.0);

    const res2 = calculateTextSimilarity('الريفو', 'ريفو');
    expect(res2.isExactMatch).toBe(true);
    expect(res2.similarity).toBe(1.0);
  });

  it('detects suggestion with >= 70% similarity on typos or single character differences', () => {
    // "سيبتازول" vs "سبتازول" (1 char difference in 8 chars = 87.5% similarity)
    const res = calculateTextSimilarity('سبتازول', 'سيبتازول');
    expect(res.similarity).toBeGreaterThanOrEqual(0.70);
  });

  it('shows instant suggestions when typing 2 or 3 letters matching word tokens (e.g. "فول")', () => {
    const demoItems = [
      { id: 1, name: 'فول مدمس بالزيت الحار' },
      { id: 2, name: 'فول اخضر ( حراتى )' },
      { id: 3, name: 'أقراص ريفو 320 مجم' },
    ];

    // Typing "فول" matches both bean items immediately!
    const suggestions = findItemSuggestions('فول', demoItems);
    expect(suggestions.length).toBe(2);
    expect(suggestions[0].item.name).toContain('فول');
    expect(suggestions[1].item.name).toContain('فول');
    expect(suggestions[0].isExactMatch).toBe(false); // not identical 100%, so user can still add if desired
  });

  it('flags 100% exact duplicate and blocks addition when item name is fully identical or only differs by "ال"', () => {
    const demoItems = [
      { id: 1, name: 'فول' },
      { id: 2, name: 'طعمية سخنة' },
    ];

    // User types "الفول"
    const suggestions = findItemSuggestions('الفول', demoItems);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].isExactMatch).toBe(true);
    expect(suggestions[0].item.name).toBe('فول');
  });
});
