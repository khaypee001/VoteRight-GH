import { CurrencyCode, CurrencyRate, Nominee, Contest } from '../types';
import { CURRENCIES } from '../data/mockData';

export function formatPrice(amountInBaseUSD: number, targetCurrency: CurrencyCode = 'GHS'): string {
  const curr = CURRENCIES.find((c) => c.code === targetCurrency) || CURRENCIES[0];
  const converted = amountInBaseUSD * curr.rateToBase;
  
  if (targetCurrency === 'GHS') {
    return `${curr.symbol} ${converted.toFixed(2)}`;
  } else if (targetCurrency === 'USD') {
    return `${curr.symbol}${converted.toFixed(2)}`;
  } else if (targetCurrency === 'NGN') {
    return `${curr.symbol}${Math.round(converted).toLocaleString()}`;
  } else {
    return `${curr.symbol} ${Math.round(converted).toLocaleString()}`;
  }
}

export function generateRefCode(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `VRG-2026-${randomNum}`;
}

export function generateQrUrl(dataString: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dataString)}&color=0f172a&bgcolor=f8fafc`;
}

export function calculateDaysLeft(endDateString: string): { days: number; hours: number; minutes: number } {
  const end = new Date(endDateString).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '');     // Trim leading/trailing hyphens
}

export function getEventSlug(contest: { id?: string; title: string; slug?: string }): string {
  if (contest.slug && contest.slug.trim()) {
    return slugify(contest.slug);
  }
  const titleSlug = slugify(contest.title);
  if (titleSlug) return titleSlug;
  return contest.id || 'event';
}

export function getCandidateSlug(nominee: { id?: string; name: string; code: string; slug?: string }): string {
  if (nominee.slug && nominee.slug.trim()) {
    return slugify(nominee.slug);
  }
  const nameSlug = slugify(nominee.name);
  const codeSlug = slugify(nominee.code);
  if (nameSlug && codeSlug) {
    return `${nameSlug}-${codeSlug}`;
  }
  return nameSlug || codeSlug || nominee.id || 'candidate';
}

export function getPublicBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://ais-pre-pgjwbruinlnlqhiprnv3ca-137708270078.europe-west2.run.app';
  }
  const origin = window.location.origin;
  // If running inside AI Studio private dev container, use the public shared app URL
  if (origin && origin.includes('ais-dev-')) {
    return origin.replace('ais-dev-', 'ais-pre-');
  }
  return origin || 'https://ais-pre-pgjwbruinlnlqhiprnv3ca-137708270078.europe-west2.run.app';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fall through to fallback
    }
  }

  // Robust fallback for iframes and restricted browser contexts
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Copy fallback failed:', err);
    return false;
  }
}

export function getEventShareUrl(contest: { id: string; title: string; slug?: string }): string {
  const base = getPublicBaseUrl();
  const eventSlug = getEventSlug(contest);
  return `${base}/events/${eventSlug}?contest=${encodeURIComponent(contest.id)}`;
}

export function getCandidateShareUrl(
  contest: { id: string; title: string; slug?: string },
  nominee: { id: string; name: string; code: string; slug?: string }
): string {
  const base = getPublicBaseUrl();
  const eventSlug = getEventSlug(contest);
  const candSlug = getCandidateSlug(nominee);
  return `${base}/events/${eventSlug}/candidates/${candSlug}?contest=${encodeURIComponent(contest.id)}&candidate=${encodeURIComponent(nominee.code)}`;
}

/**
 * Automatically calculates the next sequential voting code for a nominee in a contest.
 * Strictly follows sequential numerical order without generating arbitrary random numbers.
 * E.g. If contest nominees have codes VRG-101, VRG-102, returns VRG-103.
 * E.g. If contest nominees have codes VR-01, VR-02, returns VR-03.
 * E.g. If contest has no nominees yet, derives clean uppercase prefix from contest title and returns ${PREFIX}-01.
 */
export function getNextNomineeCode(
  allNominees: Nominee[] = [],
  contest?: Contest | { id?: string; title?: string } | null
): string {
  // If no contest selected, inspect all nominees or fallback to VR-01
  if (!contest || !contest.id) {
    let maxNum = 0;
    let pad = 2;
    for (const n of allNominees) {
      const match = n.code.trim().toUpperCase().match(/^(.*?)(\d+)$/);
      if (match) {
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
          pad = Math.max(pad, match[2].length);
        }
      }
    }
    const nextNum = maxNum > 0 ? maxNum + 1 : 1;
    return `VR-${String(nextNum).padStart(pad, '0')}`;
  }

  // Filter nominees for this contest
  const contestNominees = allNominees.filter((n) => n.contestId === contest.id);

  // Derive preferred default prefix from contest title
  let defaultPrefix = 'VRG-';
  if (contest.title && contest.title.trim()) {
    const cleanTitle = contest.title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleanTitle.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      // Pick first letter of up to 3 words
      defaultPrefix = words.slice(0, 3).map((w) => w[0].toUpperCase()).join('') + '-';
    } else if (words.length === 1 && words[0].length >= 3) {
      defaultPrefix = words[0].substring(0, 3).toUpperCase() + '-';
    }
  }

  if (contestNominees.length === 0) {
    return `${defaultPrefix}01`;
  }

  // Find maximum number and detect prefix pattern used among existing nominees in this contest
  let maxNumber = 0;
  let detectedPrefix = defaultPrefix;
  let numberPadding = 2;
  const existingCodesSet = new Set(contestNominees.map((n) => n.code.trim().toUpperCase()));

  for (const nominee of contestNominees) {
    const rawCode = nominee.code.trim().toUpperCase();
    const match = rawCode.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const digits = match[2];
      const num = parseInt(digits, 10);
      if (!isNaN(num)) {
        if (num > maxNumber) {
          maxNumber = num;
          detectedPrefix = prefix;
          numberPadding = Math.max(numberPadding, digits.length);
        }
      }
    }
  }

  if (maxNumber === 0) {
    let candidateNum = 1;
    let candidateCode = `${detectedPrefix}${String(candidateNum).padStart(numberPadding, '0')}`;
    while (existingCodesSet.has(candidateCode)) {
      candidateNum++;
      candidateCode = `${detectedPrefix}${String(candidateNum).padStart(numberPadding, '0')}`;
    }
    return candidateCode;
  }

  let nextNumber = maxNumber + 1;
  let nextCode = `${detectedPrefix}${String(nextNumber).padStart(numberPadding, '0')}`;
  while (existingCodesSet.has(nextCode)) {
    nextNumber++;
    nextCode = `${detectedPrefix}${String(nextNumber).padStart(numberPadding, '0')}`;
  }

  return nextCode;
}
