/**
 * Arabic Text Normalization & Search Utilities
 * Shared between client, server, and database indexing per §6.1.
 */

// Arabic Diacritics (Tashkeel) and Tatweel (Kashida)
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670\u0640]/g;

// Arabic-Indic Digits to Latin Digits map
const ARABIC_DIGITS_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/**
 * Normalizes Arabic string for resilient search and unique checks:
 * 1. Strips Tashkeel and Tatweel
 * 2. Normalizes Alef forms (أ, إ, آ -> ا)
 * 3. Normalizes Yaa forms (ى -> ي)
 * 4. Normalizes Taa Marbuta (ة -> ه)
 * 5. Normalizes Hamza on Waw / Yaa (ؤ -> و, ئ -> ي)
 * 6. Converts Arabic-Indic numbers to Western digits
 * 7. Lowercases Latin characters
 * 8. Collapses whitespace
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  let normalized = text
    .replace(TASHKEEL_REGEX, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (digit) => ARABIC_DIGITS_MAP[digit] || digit)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * Strips Arabic definite article 'ال' from a single word if length > 3
 */
export function stripDefiniteArticle(word: string): string {
  if (word.startsWith('ال') && word.length > 3) {
    return word.substring(2);
  }
  return word;
}

/**
 * Cleans an Arabic phrase by normalizing and stripping definite articles from words
 */
export function cleanArabicPhrase(phrase: string): string {
  const norm = normalizeArabic(phrase);
  return norm
    .split(/[\s\-_\/()]+/)
    .filter(Boolean)
    .map(stripDefiniteArticle)
    .join(' ');
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const row = new Array(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const cur = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }

  return row[n];
}

/**
 * Bigram Dice Coefficient for character n-gram similarity
 */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const mapA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const pair = a.substring(i, i + 2);
    mapA.set(pair, (mapA.get(pair) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const pair = b.substring(i, i + 2);
    const count = mapA.get(pair) || 0;
    if (count > 0) {
      mapA.set(pair, count - 1);
      intersection++;
    }
  }

  const total = (a.length - 1) + (b.length - 1);
  return total > 0 ? (2 * intersection) / total : 0;
}

export interface MatchSuggestion<T = any> {
  item: T;
  similarity: number; // 0.0 to 1.0
  isExactMatch: boolean; // 100% duplicate
  matchReason: 'exact_identical' | 'exact_without_al' | 'word_match' | 'fuzzy_similarity';
}

/**
 * Calculates similarity between a typed input and a target item name
 */
export function calculateTextSimilarity(
  input: string,
  target: string
): { similarity: number; isExactMatch: boolean; matchReason: MatchSuggestion['matchReason'] } {
  const normInput = normalizeArabic(input);
  const normTarget = normalizeArabic(target);

  if (!normInput || !normTarget) {
    return { similarity: 0, isExactMatch: false, matchReason: 'fuzzy_similarity' };
  }

  // 1. Exact normalized match (100%)
  if (normInput === normTarget) {
    return { similarity: 1.0, isExactMatch: true, matchReason: 'exact_identical' };
  }

  // 2. Cleaned phrase match (stripping 'ال') (100%)
  const cleanInput = cleanArabicPhrase(normInput);
  const cleanTarget = cleanArabicPhrase(normTarget);

  if (cleanInput.length > 0 && cleanInput === cleanTarget) {
    return { similarity: 1.0, isExactMatch: true, matchReason: 'exact_without_al' };
  }

  // 3. Word token matches & substring containment
  const inputWords = cleanInput.split(' ').filter(Boolean);
  const targetWords = cleanTarget.split(' ').filter(Boolean);

  const hasDirectWordMatch = inputWords.some((iw) =>
    targetWords.some(
      (tw) => tw === iw || (iw.length >= 2 && (tw.startsWith(iw) || tw.includes(iw)))
    )
  );

  const isSubstring =
    (cleanInput.length >= 2 && cleanTarget.includes(cleanInput)) ||
    (cleanTarget.length >= 2 && cleanInput.includes(cleanTarget));

  // 4. Distance and Dice Metrics
  const maxLen = Math.max(normInput.length, normTarget.length);
  const levDist = levenshteinDistance(normInput, normTarget);
  const levScore = maxLen > 0 ? Math.max(0, 1 - levDist / maxLen) : 0;
  const diceScore = diceCoefficient(cleanInput, cleanTarget);

  let finalSimilarity = Math.max(levScore, diceScore);

  if (hasDirectWordMatch || isSubstring) {
    // If the input matches a word in the item (e.g. typing "فول" against "فول مدمس"),
    // calculate proportional token coverage and ensure score is at least 0.70 so suggestions appear!
    const tokenCoverage = Math.min(cleanInput.length, cleanTarget.length) / Math.max(cleanInput.length, cleanTarget.length);
    finalSimilarity = Math.max(0.72, tokenCoverage, finalSimilarity);
    return {
      similarity: Math.round(finalSimilarity * 100) / 100,
      isExactMatch: false,
      matchReason: 'word_match',
    };
  }

  return {
    similarity: Math.round(finalSimilarity * 100) / 100,
    isExactMatch: finalSimilarity >= 0.98,
    matchReason: finalSimilarity >= 0.98 ? 'exact_identical' : 'fuzzy_similarity',
  };
}

/**
 * Finds all matching items from an array given user input, sorted by similarity.
 * Threshold: similarity >= 0.70 (70%) or direct word/substring match.
 */
export function findItemSuggestions<T extends { name: string }>(
  input: string,
  items: T[]
): MatchSuggestion<T>[] {
  const trimmed = input.trim();
  if (trimmed.length < 1) return [];

  const results: MatchSuggestion<T>[] = [];

  for (const item of items) {
    const check = calculateTextSimilarity(trimmed, item.name);
    // Suggest if similarity >= 0.70 OR if user typed at least 2 chars and it matched a word
    if (check.similarity >= 0.70 || check.matchReason === 'word_match') {
      results.push({
        item,
        similarity: check.similarity,
        isExactMatch: check.isExactMatch,
        matchReason: check.matchReason,
      });
    }
  }

  // Sort: Exact matches first, then highest similarity
  return results.sort((a, b) => {
    if (a.isExactMatch && !b.isExactMatch) return -1;
    if (!a.isExactMatch && b.isExactMatch) return 1;
    return b.similarity - a.similarity;
  });
}

/**
 * Canonical Egyptian phone and email identifier normalizer per §6.4.
 * Converts:
 * - Emails to trimmed lowercase
 * - Egyptian phones (010..., 011..., 012..., 015..., +201...) to canonical '+20 1X XXXX XXXX'
 */
export function normalizeIdentifier(identifier: string): {
  type: 'email' | 'phone' | 'invalid';
  canonical: string;
} {
  const trimmed = identifier.trim();

  // 1. Check if email
  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      return { type: 'email', canonical: email };
    }
    return { type: 'invalid', canonical: email };
  }

  // 2. Check if phone (convert Arabic digits first)
  const asciiPhone = trimmed.replace(/[٠-٩]/g, (d) => ARABIC_DIGITS_MAP[d] || d).replace(/[\s\-_]/g, '');

  // Match Egyptian mobile formats: 01012345678, +201012345678, 201012345678, 00201012345678
  const egPhoneRegex = /^(?:\+?20|0020|0)?(1[0125]\d{8})$/;
  const match = asciiPhone.match(egPhoneRegex);

  if (match) {
    const nationalNumber = match[1]; // 1012345678
    // Canonical format: +20 1X XXXX XXXX
    const operator = nationalNumber.substring(0, 2); // 10, 11, 12, 15
    const part1 = nationalNumber.substring(2, 6);
    const part2 = nationalNumber.substring(6, 10);
    const canonical = `+20 ${operator} ${part1} ${part2}`;
    return { type: 'phone', canonical };
  }

  // If not standard Egyptian phone or email, return normalized clean string
  return { type: 'invalid', canonical: trimmed };
}
