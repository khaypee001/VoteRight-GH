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
