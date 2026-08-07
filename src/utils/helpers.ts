import { CurrencyCode, CurrencyRate } from '../types';
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

export function getEventShareUrl(contest: { id: string; title: string; slug?: string }): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/events/${getEventSlug(contest)}`;
}

export function getCandidateShareUrl(
  contest: { id: string; title: string; slug?: string },
  nominee: { id: string; name: string; code: string; slug?: string }
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/events/${getEventSlug(contest)}/candidates/${getCandidateSlug(nominee)}`;
}
