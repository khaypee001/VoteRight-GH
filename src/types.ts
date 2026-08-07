export type CategoryType = 'pageant' | 'award' | 'election' | 'talent' | 'ticket';

export interface Nominee {
  id: string;
  code: string; // e.g. VRG-101
  name: string;
  category: string;
  contestId: string;
  photoUrl: string;
  bio?: string;
  votes: number;
  rank?: number;
  status?: 'approved' | 'rejected' | 'pending';
  slug?: string;
}

export interface TicketTier {
  id: string;
  name: string; // Regular, VIP, VVIP Table
  price: number;
  description: string;
  available: number;
}

export interface TicketEvent {
  id: string;
  title: string;
  organizer: string;
  posterUrl: string;
  endDate: string; // e.g., "Sat, 05 Sep 2026"
  venue: string; // e.g., "Street Star Park, Adenta"
  priceGHS: number;
  category: string;
  ticketTiers: TicketTier[];
}

export interface NominationAward {
  id: string;
  title: string;
  organizer: string;
  bannerUrl: string;
  deadline: string;
  description: string;
  categories: string[];
  status: 'OPEN' | 'CLOSED';
}

export interface Contest {
  id: string;
  title: string;
  organizer: string;
  organizerLogo?: string;
  category: CategoryType;
  bannerUrl: string;
  description: string;
  startDate: string;
  endDate: string;
  isLive: boolean;
  votePrice: number; // in base currency GHS / USD
  totalVotes: number;
  categories: string[];
  ticketsEnabled?: boolean;
  ticketTiers?: TicketTier[];
  rules?: string[];
  nomineeOnboardingMode?: 'organizer_only' | 'public_self_register' | 'hybrid';
  allowSelfRegistration?: boolean;
  slug?: string;
}

export interface VoteTransaction {
  id: string;
  referenceCode: string; // e.g. VRG-2026-981234
  contestId: string;
  contestTitle: string;
  nomineeId: string;
  nomineeName: string;
  nomineeCode: string;
  category: string;
  votesCount: number;
  amountPaid: number;
  currency: string;
  voterName: string;
  voterPhone: string;
  paymentMethod: 'momo_mtn' | 'momo_telecel' | 'momo_airteltigo' | 'card';
  timestamp: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface TicketPurchase {
  id: string;
  ticketCode: string; // e.g. TKT-VRG-98421
  eventId: string;
  eventTitle: string;
  tierName: string;
  quantity: number;
  totalPriceGHS: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  paymentMethod: string;
  timestamp: string;
  qrCodeUrl: string;
}

export interface RecentVoteFeed {
  id: string;
  voterName: string;
  nomineeName: string;
  nomineeCode: string;
  votesCount: number;
  timeAgo: string;
  contestTitle: string;
}

export type CurrencyCode = 'GHS' | 'USD' | 'NGN' | 'KES';

export interface CurrencyRate {
  code: CurrencyCode;
  symbol: string;
  rateToBase: number; // base GHS
}

export interface UserSession {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'user' | 'organizer' | 'admin';
}

export interface OrganizerProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  eventTitle?: string;
  paidFlatFee: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  registeredAt?: string;
  agency?: string;
  status?: 'pending' | 'approved' | 'rejected';
  password?: string;
  logoUrl?: string;
  dateApplied?: string;
  paystackSubaccountCode?: string;
  paystackSubaccountStatus?: 'active' | 'pending' | 'unlinked';
  subaccountSettlementBank?: string;
  subaccountAccountNumber?: string;
  subaccountPercentageCharge?: number;
}

export interface SiteSettings {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  headquarters: string;
  platformFeePercent: number;
  heroTitle: string;
  heroSubtitle: string;
  tickerAnnouncements: string[];
}

export interface PayoutRequest {
  id: string;
  userId: string;
  organizerName?: string;
  contestId?: string;
  eventTitle?: string;
  amount: number;
  paymentMethod?: 'Mobile Money' | 'Bank Transfer';
  momoNetwork?: 'MTN MoMo' | 'Telecel Cash' | 'AT Money' | string;
  accountNumber: string;
  accountName: string;
  bankOrNetworkName?: string;
  status: 'PENDING' | 'APPROVED' | 'DISBURSED' | 'REJECTED' | 'Paid';
  createdAt: string;
  subaccountCode?: string;
  transferCode?: string;
  transferRecipientCode?: string;
  transferReference?: string;
  payoutType?: 'paystack_transfer' | 'manual';
  disbursedAt?: string;
  txHash?: string;
}

export interface CandidateRegistration {
  id: string;
  contestId: string;
  contestTitle: string;
  fullName: string;
  category: string;
  bio: string;
  photoUrl: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  proposedCode?: string;
}

