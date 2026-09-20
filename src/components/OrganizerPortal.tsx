import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Contest, 
  Nominee, 
  CategoryType, 
  CurrencyCode, 
  PayoutRequest, 
  TicketTier, 
  VoteTransaction,
  CandidateRegistration 
} from '../types';
import { formatPrice, getEventShareUrl, getCandidateShareUrl, getNextNomineeCode } from '../utils/helpers';
import {
  fetchOrganizerEvents,
  createOrganizerEvent,
  insertPayoutRequest,
  fetchPayoutRequests,
} from '../lib/organizerHooks';
import {
  getPaystackSubaccountDetails,
  updatePaystackSubaccount,
  createPaystackTransferRecipient,
  initiatePaystackTransfer,
  PaystackSubaccount
} from '../lib/paystackTransferService';
import {
  BarChart3,
  DollarSign,
  Users,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Edit3,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  AlertTriangle,
  Image as ImageIcon,
  PlusCircle,
  QrCode,
  Copy,
  FileText,
  Send,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Ticket,
  Check,
  Sparkles,
  TrendingUp,
  Wallet,
  CreditCard,
  Smartphone,
  Share2,
  Clock,
  Layers,
  Settings,
  LayoutDashboard,
  Trophy,
  Loader2,
  AlertCircle,
  Upload,
  Trash2,
  Building2,
  ExternalLink,
  Eye,
  Edit2,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Zap,
  ChevronRight
} from 'lucide-react';

export interface OrganizerProfileProps {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  eventTitle?: string;
  paidFlatFee: boolean;
  isVerified: boolean;
  isBlocked: boolean;
}

interface OrganizerPortalProps {
  organizerProfile?: OrganizerProfileProps | null;
  contests: Contest[];
  nominees: Nominee[];
  currency: CurrencyCode;
  onUpdateContest: (updated: Contest) => void;
  onAddContest?: (contest: Contest) => void;
  onUpdateNomineeStatus: (nomineeId: string, status: 'approved' | 'rejected') => void;
  onAddNominee: (nominee: Nominee) => void;
  onClose: () => void;
}

// Initial mock candidates pending queue
const INITIAL_PENDING_CANDIDATES: CandidateRegistration[] = [
  {
    id: 'cand-101',
    contestId: 'contest-1',
    contestTitle: 'MISS CAMPUS GHANA 2026',
    fullName: 'Yaa Asantewaa Bonsu',
    category: 'Miss Campus Queen',
    bio: 'Business Administration Student & Social Entrepreneur at UG Legon.',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    phone: '0241239876',
    email: 'yaa.bonsu@gmail.com',
    status: 'pending',
    submittedAt: '2026-08-04T14:30:00Z',
    proposedCode: 'MCG-108'
  },
  {
    id: 'cand-102',
    contestId: 'contest-2',
    contestTitle: 'National Music Excellence Awards 2026',
    fullName: 'Kweku Flick',
    category: 'Best New Hip-Hop Artiste',
    bio: 'Ghanaian hip-hop and drill musician based in Kumasi.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    phone: '0559988776',
    email: 'kwekuflick.mgmt@gmail.com',
    status: 'pending',
    submittedAt: '2026-08-05T09:15:00Z',
    proposedCode: 'NMA-205'
  }
];

export const OrganizerPortal: React.FC<OrganizerPortalProps> = ({
  organizerProfile,
  contests,
  nominees: globalNominees,
  currency,
  onUpdateContest,
  onAddContest,
  onUpdateNomineeStatus,
  onAddNominee,
  onClose,
}) => {
  // Use current profile or fallback mock profile
  const profile = organizerProfile || {
    id: 'org-1',
    email: 'organizer@gmail.com',
    fullName: 'Ghana Media & Event Board',
    phone: '0244998877',
    paidFlatFee: true,
    isVerified: true,
    isBlocked: false,
  };

  // Sidebar navigation tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'my_events' | 'create_event' | 'nominees' | 'leaderboard' | 'payouts' | 'settings'
  >('overview');

  // Filter contests owned strictly by this organizer
  const myContests = contests.filter(
    (c) =>
      c.organizer.toLowerCase().includes('ghana') ||
      c.organizer.toLowerCase().includes(profile.fullName.toLowerCase()) ||
      c.id === 'contest-1' ||
      c.id === 'contest-2'
  );

  const [selectedContest, setSelectedContest] = useState<Contest | null>(
    myContests[0] || contests[0] || null
  );

  // Edit Event State
  const [editTitle, setEditTitle] = useState(selectedContest?.title || '');
  const [editDescription, setEditDescription] = useState(selectedContest?.description || '');
  const [editFlyerUrl, setEditFlyerUrl] = useState(selectedContest?.bannerUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingContestModal, setEditingContestModal] = useState<Contest | null>(null);
  const [editModalBannerUrl, setEditModalBannerUrl] = useState<string>('');

  const handleOpenEditModal = (contest: Contest) => {
    setEditingContestModal(contest);
    setEditModalBannerUrl(contest.bannerUrl || '');
  };

  // Modal Edit Event submit handler
  const handleSaveModalContest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingContestModal) return;

    const formData = new FormData(e.currentTarget);
    const title = (formData.get('title') as string)?.trim() || editingContestModal.title;
    const organizer = (formData.get('organizer') as string)?.trim() || editingContestModal.organizer || profile.fullName || '';
    const category = (formData.get('category') as any) || editingContestModal.category;
    const description = (formData.get('description') as string)?.trim() || editingContestModal.description;
    const startDate = (formData.get('startDate') as string)?.trim() || editingContestModal.startDate || new Date().toISOString().split('T')[0];
    const endDate = (formData.get('endDate') as string)?.trim() || editingContestModal.endDate;
    const votePrice = parseFloat(formData.get('votePrice') as string) || editingContestModal.votePrice;
    const isLive = formData.get('isLive') === 'true';
    const bannerUrl = editModalBannerUrl.trim() || (formData.get('bannerUrl') as string)?.trim() || editingContestModal.bannerUrl;
    const slug = (formData.get('slug') as string)?.trim() || editingContestModal.slug || '';
    const nomineeOnboardingMode = (formData.get('nomineeOnboardingMode') as any) || editingContestModal.nomineeOnboardingMode || 'hybrid';
    const rulesRaw = formData.get('rules') as string;
    const rules = rulesRaw !== null ? rulesRaw.split('\n').map(r => r.trim()).filter(Boolean) : editingContestModal.rules;

    const updatedContest: Contest = {
      ...editingContestModal,
      title,
      organizer,
      category,
      description,
      startDate,
      endDate,
      votePrice,
      isLive,
      bannerUrl,
      slug: slug || undefined,
      nomineeOnboardingMode,
      allowSelfRegistration: nomineeOnboardingMode !== 'organizer_only',
      rules
    };

    onUpdateContest(updatedContest);
    if (selectedContest?.id === updatedContest.id) {
      setSelectedContest(updatedContest);
      setEditTitle(title);
      setEditDescription(description);
      setEditFlyerUrl(bannerUrl);
    }
    setEditingContestModal(null);
    showToast(`🎉 Event "${title}" updated successfully!`);
  };

  // Nominees Local State synchronized with globalNominees
  const [localNominees, setLocalNominees] = useState<Nominee[]>(globalNominees);

  useEffect(() => {
    setLocalNominees(globalNominees);
  }, [globalNominees]);

  // Pending candidates state
  const [pendingCandidates, setPendingCandidates] = useState<CandidateRegistration[]>(() => {
    const saved = localStorage.getItem('voterightgh_pending_candidates');
    return saved ? JSON.parse(saved) : INITIAL_PENDING_CANDIDATES;
  });

  useEffect(() => {
    localStorage.setItem('voterightgh_pending_candidates', JSON.stringify(pendingCandidates));
  }, [pendingCandidates]);

  // Filter nominees belonging to selected contest
  const contestNominees = localNominees.filter(
    (n) => selectedContest && n.contestId === selectedContest.id
  );

  // Read ticket purchases from localStorage to include ticket revenue dynamically
  const ticketPurchases = (() => {
    try {
      const saved = localStorage.getItem('voterightgh_ticket_purchases');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  })();

  const myEventIds = new Set(myContests.map((c) => c.id));
  const myEventTitles = new Set(myContests.map((c) => (c.title || '').toLowerCase()));

  const totalTicketRevenue = ticketPurchases
    .filter((tp: any) => myEventIds.has(tp.eventId) || myEventTitles.has((tp.eventTitle || '').toLowerCase()))
    .reduce((sum: number, tp: any) => sum + (tp.totalPriceGHS || tp.totalPrice || 0), 0);

  // Calculation of Quick Balance Card Stats
  const totalVotesAcrossEvents = myContests.reduce((acc, c) => acc + (c.totalVotes || 0), 0);
  const voteRevenue = myContests.reduce(
    (acc, c) => acc + (c.totalVotes || 0) * (c.votePrice || 1.5),
    0
  );
  const grossEarnings = voteRevenue + totalTicketRevenue;
  const platformFee = grossEarnings * 0.15;
  const netEarnings = grossEarnings - platformFee;

  // Payout Requests State
  const [payoutRequestsHistory, setPayoutRequestsHistory] = useState<PayoutRequest[]>(() => {
    const saved = localStorage.getItem('voterightgh_payout_requests');
    return saved ? JSON.parse(saved) : [
      {
        id: 'payout-101',
        userId: profile.id,
        organizerName: profile.fullName,
        contestId: 'contest-1',
        eventTitle: 'MISS CAMPUS GHANA 2026',
        amount: 1500,
        paymentMethod: 'Mobile Money',
        momoNetwork: 'MTN MoMo',
        accountNumber: '0244998877',
        accountName: profile.fullName,
        status: 'APPROVED',
        createdAt: '2026-08-01T10:30:00Z',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('voterightgh_payout_requests', JSON.stringify(payoutRequestsHistory));
  }, [payoutRequestsHistory]);

  useEffect(() => {
    const syncPayouts = () => {
      const saved = localStorage.getItem('voterightgh_payout_requests');
      if (saved) {
        try {
          setPayoutRequestsHistory(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('storage', syncPayouts);
    window.addEventListener('voteright_payout_update', syncPayouts);
    return () => {
      window.removeEventListener('storage', syncPayouts);
      window.removeEventListener('voteright_payout_update', syncPayouts);
    };
  }, []);

  const totalPaidOut = payoutRequestsHistory
    .filter((p) => p.status === 'APPROVED' || p.status === 'Paid' || p.status === 'DISBURSED')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPendingPayout = payoutRequestsHistory
    .filter((p) => p.status === 'PENDING' || p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const availableBalance = Math.max(0, netEarnings - totalPaidOut - totalPendingPayout);

  // Paystack Subaccount & On-Demand Transfer State
  const [subaccount, setSubaccount] = useState<PaystackSubaccount>(() => 
    getPaystackSubaccountDetails(profile.id, profile.fullName, profile.phone)
  );
  const [showSubaccountEdit, setShowSubaccountEdit] = useState(false);
  const [editSettlementBank, setEditSettlementBank] = useState(subaccount.settlementBank);
  const [editAccountNumber, setEditAccountNumber] = useState(subaccount.accountNumber);
  const [editAccountName, setEditAccountName] = useState(subaccount.accountName);

  // Transfer API Execution Progress Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [activeTransferStep, setActiveTransferStep] = useState(0);
  const [transferStepLabel, setTransferStepLabel] = useState('');
  const [completedPayoutRecord, setCompletedPayoutRecord] = useState<PayoutRequest | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyCode = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(val);
    showToast(`Copied ${label} (${val})!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleSelectPreset = (percentage: number) => {
    if (availableBalance <= 0) return;
    const calculated = (availableBalance * (percentage / 100)).toFixed(2);
    setPayoutAmount(calculated);
  };

  const handleSaveSubaccountConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updatePaystackSubaccount(profile.id, {
      settlementBank: editSettlementBank,
      accountNumber: editAccountNumber,
      accountName: editAccountName,
    });
    setSubaccount(updated);
    setShowSubaccountEdit(false);
    setAccountNumber(editAccountNumber);
    setAccountName(editAccountName);
    showToast('✅ Paystack Subaccount settlement account updated!');
  };

  // MoMo & Bank Payout Form State
  const [selectedPayoutEventId, setSelectedPayoutEventId] = useState<string>(selectedContest?.id || myContests[0]?.id || '');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'Mobile Money' | 'Bank Transfer'>('Mobile Money');
  const [momoNetwork, setMomoNetwork] = useState<string>('MTN MoMo');
  const [bankName, setBankName] = useState<string>('Ecobank Ghana');
  const [accountNumber, setAccountNumber] = useState<string>(profile.phone || '0244998877');
  const [accountName, setAccountName] = useState<string>(profile.fullName || 'Ghana Media & Event Board');
  const [payoutError, setPayoutError] = useState<string>('');
  const [payoutSuccess, setPayoutSuccess] = useState<string>('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stepper State for Campaign Creator
  const [stepperStep, setStepperStep] = useState<number>(1);
  const [step1Title, setStep1Title] = useState('');
  const [step1Type, setStep1Type] = useState<'voting' | 'ticketing' | 'hybrid'>('voting');
  const [step1Category, setStep1Category] = useState<CategoryType>('award');
  const [step1Description, setStep1Description] = useState('');
  const [step1BannerUrl, setStep1BannerUrl] = useState('');
  const [step1VotePrice, setStep1VotePrice] = useState('1.00');
  const [step1StartDate, setStep1StartDate] = useState('2026-08-10');
  const [step1EndDate, setStep1EndDate] = useState('2026-09-30');
  
  // Nominee Onboarding Mode selector
  const [step1OnboardingMode, setStep1OnboardingMode] = useState<'organizer_only' | 'public_self_register' | 'hybrid'>('hybrid');

  // Categories & Nominees Setup
  const [categories, setCategories] = useState<
    {
      id: string;
      name: string;
      nominees: { id: string; name: string; code: string; photoUrl: string; bio?: string }[];
    }[]
  >([
    {
      id: 'cat-1',
      name: 'Best Artiste of the Year',
      nominees: [
        {
          id: 'n1',
          name: 'Stonebwoy',
          code: 'GMA-001',
          photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
          bio: 'Reggae & Dancehall pioneer',
        },
        {
          id: 'n2',
          name: 'Sarkodie',
          code: 'GMA-002',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
          bio: 'Hip-Hop icon',
        },
      ],
    },
  ]);
  const [newCatName, setNewCatName] = useState('');
  const [activeCatIndex, setActiveCatIndex] = useState(0);

  // Add nominee form state in Creator Stepper
  const [nomName, setNomName] = useState('');
  const [nomPhotoUrl, setNomPhotoUrl] = useState('');
  const [nomBio, setNomBio] = useState('');

  // Ticket Tiers
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    { id: 'tier-1', name: 'Regular Pass', price: 50, description: 'General Access Gate Pass', available: 500 },
    { id: 'tier-2', name: 'VIP Table', price: 150, description: 'Front Row Seating & Complimentary Drink', available: 100 },
  ]);
  const [tierName, setTierName] = useState('');
  const [tierPrice, setTierPrice] = useState('');
  const [tierQuantity, setTierQuantity] = useState('');

  // Dedicated Nominee Management Portal Form State
  const [manualNomineeName, setManualNomineeName] = useState('');
  const [manualNomineeCategory, setManualNomineeCategory] = useState('Artiste of the Year');
  const [manualNomineeBio, setManualNomineeBio] = useState('');
  const [manualNomineeCode, setManualNomineeCode] = useState('');
  const [manualNomineePhotoUrl, setManualNomineePhotoUrl] = useState('');
  const [selectedNomineeForBadge, setSelectedNomineeForBadge] = useState<Nominee | null>(null);

  // Search & Filtering in Nominees Portal
  const [nomineeSearchQuery, setNomineeSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Bulk Nominee Upload Modal State
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Edit Nominee Modal State
  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null);
  const [editNomineeName, setEditNomineeName] = useState('');
  const [editNomineeCategory, setEditNomineeCategory] = useState('');
  const [editNomineeCode, setEditNomineeCode] = useState('');
  const [editNomineePhotoUrl, setEditNomineePhotoUrl] = useState('');
  const [editNomineeBio, setEditNomineeBio] = useState('');

  // Settings State
  const [settingsAgencyName, setSettingsAgencyName] = useState(profile.fullName);
  const [settingsPhone, setSettingsPhone] = useState(profile.phone);
  const [settingsLogoUrl, setSettingsLogoUrl] = useState('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80');
  const [settingsMomoNumber, setSettingsMomoNumber] = useState(profile.phone);

  // Copy Link and QR state
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);

  // Manage Event Tickets Modal State
  const [managingTicketsContest, setManagingTicketsContest] = useState<Contest | null>(null);
  const [managingTiersList, setManagingTiersList] = useState<TicketTier[]>([]);
  const [managingTicketsEnabled, setManagingTicketsEnabled] = useState<boolean>(true);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierNameInput, setTierNameInput] = useState<string>('');
  const [tierPriceInput, setTierPriceInput] = useState<string>('');
  const [tierQuantityInput, setTierQuantityInput] = useState<string>('');
  const [tierDescriptionInput, setTierDescriptionInput] = useState<string>('');

  const handleOpenManageTicketsModal = (contest: Contest) => {
    setManagingTicketsContest(contest);
    setManagingTiersList(contest.ticketTiers || [
      { id: 'tier-reg', name: 'Regular Entry Pass', price: 50, description: 'General access gate pass', available: 300 },
      { id: 'tier-vip', name: 'VIP Access Pass', price: 150, description: 'VIP seating & complimentary drink', available: 100 }
    ]);
    setManagingTicketsEnabled(contest.ticketsEnabled !== false);
    setEditingTierId(null);
    setTierNameInput('');
    setTierPriceInput('');
    setTierQuantityInput('');
    setTierDescriptionInput('');
  };

  const handleAddOrUpdateTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierNameInput.trim()) return;

    const priceNum = parseFloat(tierPriceInput) || 0;
    const qtyNum = parseInt(tierQuantityInput, 10) || 100;

    if (editingTierId) {
      setManagingTiersList(prev => prev.map(t => t.id === editingTierId ? {
        ...t,
        name: tierNameInput.trim(),
        price: priceNum,
        available: qtyNum,
        description: tierDescriptionInput.trim() || 'Event entry pass'
      } : t));
    } else {
      const newTier: TicketTier = {
        id: `tier-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: tierNameInput.trim(),
        price: priceNum,
        available: qtyNum,
        description: tierDescriptionInput.trim() || 'Event entry pass'
      };
      setManagingTiersList(prev => [...prev, newTier]);
    }

    setEditingTierId(null);
    setTierNameInput('');
    setTierPriceInput('');
    setTierQuantityInput('');
    setTierDescriptionInput('');
  };

  const handleEditTierClick = (tier: TicketTier) => {
    setEditingTierId(tier.id);
    setTierNameInput(tier.name);
    setTierPriceInput(tier.price.toString());
    setTierQuantityInput(tier.available.toString());
    setTierDescriptionInput(tier.description || '');
  };

  const handleDeleteTierClick = (tierId: string) => {
    setManagingTiersList(prev => prev.filter(t => t.id !== tierId));
    if (editingTierId === tierId) {
      setEditingTierId(null);
      setTierNameInput('');
      setTierPriceInput('');
      setTierQuantityInput('');
      setTierDescriptionInput('');
    }
  };

  const handleAddPresetTier = (presetName: string, presetPrice: number, presetQty: number, presetDesc: string) => {
    const newTier: TicketTier = {
      id: `tier-preset-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: presetName,
      price: presetPrice,
      available: presetQty,
      description: presetDesc
    };
    setManagingTiersList(prev => [...prev, newTier]);
  };

  const handleSaveTicketsForContest = () => {
    if (!managingTicketsContest) return;

    const updatedContest: Contest = {
      ...managingTicketsContest,
      ticketsEnabled: managingTicketsEnabled && managingTiersList.length > 0,
      ticketTiers: managingTiersList,
    };

    onUpdateContest(updatedContest);

    // Save to local storage
    const saved = localStorage.getItem('voterightgh_contests');
    const existingContests: Contest[] = saved ? JSON.parse(saved) : contests;
    const updatedContestsList = existingContests.map(c => c.id === updatedContest.id ? updatedContest : c);
    localStorage.setItem('voterightgh_contests', JSON.stringify(updatedContestsList));

    // Also sync to ticketEvents in local storage
    const savedEvts = localStorage.getItem('voterightgh_ticket_events');
    const existingEvents: any[] = savedEvts ? JSON.parse(savedEvts) : [];
    const minPrice = managingTiersList.length > 0 ? Math.min(...managingTiersList.map(t => t.price)) : 20;

    let foundInTicketEvents = false;
    const updatedTicketEvents = existingEvents.map(evt => {
      if (evt.id === updatedContest.id || evt.title.toLowerCase() === updatedContest.title.toLowerCase()) {
        foundInTicketEvents = true;
        return {
          ...evt,
          ticketTiers: managingTiersList,
          priceGHS: minPrice,
        };
      }
      return evt;
    });

    if (!foundInTicketEvents && managingTiersList.length > 0) {
      updatedTicketEvents.unshift({
        id: updatedContest.id,
        title: updatedContest.title,
        organizer: updatedContest.organizer || 'Official Organizer',
        venue: 'Event Venue (See Details)',
        endDate: updatedContest.endDate ? new Date(updatedContest.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Upcoming',
        category: updatedContest.category || 'Event Ticket',
        posterUrl: updatedContest.bannerUrl,
        priceGHS: minPrice,
        ticketTiers: managingTiersList
      });
    }

    localStorage.setItem('voterightgh_ticket_events', JSON.stringify(updatedTicketEvents));

    // Trigger sync events across window
    window.dispatchEvent(new Event('voteright_contests_update'));
    window.dispatchEvent(new Event('voteright_ticket_events_update'));
    window.dispatchEvent(new Event('storage'));

    setToastMessage(`🎟️ Ticket tiers saved for "${updatedContest.title}"!`);
    setTimeout(() => setToastMessage(null), 3500);
    setManagingTicketsContest(null);
  };

  // File Upload Helper
  const handleFileUpload = (file: File, callback: (url: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Bulk Nominee Upload Handler
  const handleBulkNomineeUpload = () => {
    if (!selectedContest) {
      alert('Please select or publish an event scheme first.');
      return;
    }
    if (!bulkText.trim()) {
      alert('Please enter or paste nominee details.');
      return;
    }

    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    let count = 0;

    lines.forEach((line) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 1 && parts[0]) {
        const name = parts[0];
        const category = parts[1] || 'General Category';
        const code = parts[2] || `VR-${Math.floor(100 + Math.random() * 900)}`;
        const photoUrl = parts[3] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80';
        const bio = parts[4] || 'Official Nominee';

        const newNom: Nominee = {
          id: `nom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          code,
          name,
          category,
          contestId: selectedContest.id,
          photoUrl,
          bio,
          votes: 0,
          status: 'approved',
        };

        onAddNominee(newNom);
        setLocalNominees((prev) => [newNom, ...prev]);
        count++;
      }
    });

    setBulkText('');
    setShowBulkUploadModal(false);
    showToast(`🎉 Bulk Upload Success! ${count} nominees added to ${selectedContest.title}.`);
  };

  // Edit Nominee Modal Handler
  const handleOpenEditNominee = (nominee: Nominee) => {
    setEditingNominee(nominee);
    setEditNomineeName(nominee.name);
    setEditNomineeCategory(nominee.category);
    setEditNomineeCode(nominee.code);
    setEditNomineePhotoUrl(nominee.photoUrl);
    setEditNomineeBio(nominee.bio || '');
  };

  const handleSaveEditNominee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNominee) return;

    const updated: Nominee = {
      ...editingNominee,
      name: editNomineeName.trim(),
      category: editNomineeCategory.trim(),
      code: editNomineeCode.trim().toUpperCase(),
      photoUrl: editNomineePhotoUrl.trim(),
      bio: editNomineeBio.trim(),
    };

    setLocalNominees((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    // Sync with localStorage
    const savedNominees = localStorage.getItem('voterightgh_nominees');
    if (savedNominees) {
      try {
        const list: Nominee[] = JSON.parse(savedNominees);
        const updatedList = list.map((n) => (n.id === updated.id ? updated : n));
        localStorage.setItem('voterightgh_nominees', JSON.stringify(updatedList));
      } catch (err) {
        console.error('Error updating nominee in local storage:', err);
      }
    }

    setEditingNominee(null);
    showToast(`✅ Nominee "${updated.name}" updated successfully!`);
  };

  // Delete Nominee Handler
  const handleDeleteNominee = (nomineeId: string, name: string) => {
    setLocalNominees((prev) => prev.filter((n) => n.id !== nomineeId));
    const savedNominees = localStorage.getItem('voterightgh_nominees');
    if (savedNominees) {
      try {
        const list: Nominee[] = JSON.parse(savedNominees);
        const updatedList = list.filter((n) => n.id !== nomineeId);
        localStorage.setItem('voterightgh_nominees', JSON.stringify(updatedList));
      } catch (err) {
        console.error('Error deleting nominee from local storage:', err);
      }
    }
    window.dispatchEvent(new Event('voteright_nominees_update'));
    window.dispatchEvent(new Event('storage'));
    showToast(`🗑️ Nominee "${name}" deleted.`);
  };

  // Toggle Event Voting Status
  const handleToggleStatus = (contest: Contest) => {
    const updated: Contest = {
      ...contest,
      isLive: !contest.isLive,
    };
    onUpdateContest(updated);
    if (selectedContest?.id === contest.id) {
      setSelectedContest(updated);
    }
    showToast(`Voting status for "${contest.title}" updated to ${updated.isLive ? 'ONGOING (🟢)' : 'PAUSED (🔴)'}`);
  };

  // Toggle Nominee Self Registration
  const handleToggleSelfRegistration = (contest: Contest) => {
    const updated: Contest = {
      ...contest,
      allowSelfRegistration: !contest.allowSelfRegistration,
    };
    onUpdateContest(updated);
    if (selectedContest?.id === contest.id) {
      setSelectedContest(updated);
    }
    showToast(`Public self-registration for "${contest.title}" ${updated.allowSelfRegistration ? 'ENABLED (🟢)' : 'DISABLED (🔴)'}`);
  };

  // Handle Save Event Edits
  const handleSaveEventEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContest) return;

    const updated: Contest = {
      ...selectedContest,
      title: editTitle,
      description: editDescription,
      bannerUrl: editFlyerUrl,
    };

    onUpdateContest(updated);
    setSelectedContest(updated);
    setSaveSuccess(true);
    showToast('Event details and banner updated!');
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Auto Generate Nominee Code in strict sequential order
  const handleAutoGenerateCode = (_prefix?: string) => {
    const nextCode = getNextNomineeCode(localNominees, selectedContest);
    setManualNomineeCode(nextCode);
    showToast(`Assigned next sequential code: ${nextCode}`);
  };

  // Add Nominee Manually from Portal
  const handleAddNomineeManually = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContest) {
      alert('Please select or create an event first.');
      return;
    }
    if (!manualNomineeName.trim()) {
      alert('Please enter nominee full name.');
      return;
    }

    const codeToUse = manualNomineeCode.trim() || getNextNomineeCode(localNominees, selectedContest);

    const newNom: Nominee = {
      id: `nom-${Date.now()}`,
      code: codeToUse,
      name: manualNomineeName.trim(),
      category: manualNomineeCategory.trim() || 'General Category',
      contestId: selectedContest.id,
      photoUrl: manualNomineePhotoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      bio: manualNomineeBio.trim() || 'Official Contestant',
      votes: 0,
      status: 'approved',
    };

    onAddNominee(newNom);
    const updatedNominees = [newNom, ...localNominees];
    setLocalNominees(updatedNominees);

    setManualNomineeName('');
    setManualNomineeBio('');
    // Automatically set next sequential code ready for the next nominee
    setManualNomineeCode(getNextNomineeCode(updatedNominees, selectedContest));
    setManualNomineePhotoUrl('');
    showToast(`✅ Nominee "${newNom.name}" added with code ${newNom.code}!`);
  };

  // Candidate Registration Approval Handlers
  const handleApproveCandidate = (candidate: CandidateRegistration) => {
    const candidateContest = myContests.find(c => c.id === candidate.contestId) || selectedContest;
    const assignedCode = candidate.proposedCode || getNextNomineeCode(localNominees, candidateContest);

    const approvedNominee: Nominee = {
      id: `nom-${Date.now()}`,
      code: assignedCode,
      name: candidate.fullName,
      category: candidate.category,
      contestId: candidate.contestId,
      photoUrl: candidate.photoUrl,
      bio: candidate.bio,
      votes: 0,
      status: 'approved'
    };

    onAddNominee(approvedNominee);
    setLocalNominees((prev) => [approvedNominee, ...prev]);

    const updatedQueue = pendingCandidates.filter(c => c.id !== candidate.id);
    setPendingCandidates(updatedQueue);
    showToast(`✅ Contestant "${candidate.fullName}" APPROVED! Voting code assigned: ${assignedCode}`);
  };

  const handleRejectCandidate = (candidateId: string) => {
    const updatedQueue = pendingCandidates.filter(c => c.id !== candidateId);
    setPendingCandidates(updatedQueue);
    showToast(`❌ Candidate application rejected.`);
  };

  // Publish Event Handler
  const handlePublishEvent = async () => {
    setIsSubmittingPayout(true);

    const newContestObj: Contest = {
      id: `contest-${Date.now()}`,
      title: step1Title || 'New Ghana Awards Gala 2026',
      organizer: profile.fullName,
      category: step1Category,
      bannerUrl: step1BannerUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&q=80',
      description: step1Description || 'Official voting and ticketing competition.',
      startDate: step1StartDate,
      endDate: step1EndDate,
      isLive: true,
      votePrice: parseFloat(step1VotePrice) || 1.0,
      totalVotes: 0,
      categories: categories.map((c) => c.name),
      ticketsEnabled: ticketTiers.length > 0,
      ticketTiers: ticketTiers,
      nomineeOnboardingMode: step1OnboardingMode,
      allowSelfRegistration: step1OnboardingMode !== 'organizer_only'
    };

    if (onAddContest) {
      onAddContest(newContestObj);
    }

    // Add nominees to state
    categories.forEach((cat) => {
      cat.nominees.forEach((nom) => {
        onAddNominee({
          id: nom.id,
          code: nom.code,
          name: nom.name,
          category: cat.name,
          contestId: newContestObj.id,
          photoUrl: nom.photoUrl,
          bio: nom.bio,
          votes: 0,
          status: 'approved',
        });
      });
    });

    setIsSubmittingPayout(false);
    setSelectedContest(newContestObj);
    setActiveTab('my_events');
    setStepperStep(1);
    showToast(`🎉 Event "${newContestObj.title}" published successfully!`);
  };

  // Payout Request Submission to Admin Dashboard & Main Paystack Account
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError('');
    setPayoutSuccess('');

    const requestedAmount = parseFloat(payoutAmount);

    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      setPayoutError('Please enter a valid payout amount greater than GHS 0.');
      return;
    }

    if (requestedAmount > availableBalance) {
      setPayoutError(
        `Requested amount (${formatPrice(requestedAmount, currency)}) exceeds your available balance (${formatPrice(availableBalance, currency)}).`
      );
      return;
    }

    if (!accountNumber || accountNumber.length < 8) {
      setPayoutError('Please enter a valid account or Mobile Money number.');
      return;
    }

    if (!accountName.trim()) {
      setPayoutError('Please enter the registered Account Name.');
      return;
    }

    setIsSubmittingPayout(true);

    const eventTitle = myContests.find(c => c.id === selectedPayoutEventId)?.title || selectedContest?.title || 'VoteRight Revenue Pool';

    const newRequest: PayoutRequest = {
      id: `payout-${Date.now()}`,
      userId: profile.id,
      organizerName: accountName.trim() || profile.fullName,
      contestId: selectedPayoutEventId || myContests[0]?.id || 'contest-1',
      eventTitle: eventTitle,
      amount: requestedAmount,
      paymentMethod: payoutMethod,
      momoNetwork: payoutMethod === 'Mobile Money' ? momoNetwork : bankName,
      bankOrNetworkName: payoutMethod === 'Mobile Money' ? momoNetwork : bankName,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      payoutType: 'manual',
    };

    // Simulate short network delay
    await new Promise((res) => setTimeout(res, 600));

    setIsSubmittingPayout(false);

    const updatedRequests = [newRequest, ...payoutRequestsHistory];
    setPayoutRequestsHistory(updatedRequests);
    localStorage.setItem('voterightgh_payout_requests', JSON.stringify(updatedRequests));
    window.dispatchEvent(new Event('voteright_payout_update'));
    window.dispatchEvent(new Event('storage'));

    setPayoutSuccess(
      `🎉 Payout request of GHS ${requestedAmount.toFixed(2)} submitted! Pending admin review and Paystack main account disbursement.`
    );
    setPayoutAmount('');
    showToast(`🎉 Payout request for GHS ${requestedAmount.toFixed(2)} submitted to Admin!`);
  };

  // Export Leaderboard / Voter Logs to CSV
  const handleExportCSV = () => {
    if (!selectedContest) return;

    const headers = 'Timestamp,Voter Name,Voter Phone,Nominee Code,Nominee Name,Category,Votes Cast,Amount Paid (GHS),Payment Method,Reference\n';
    const mockLogs = contestNominees.flatMap((n) => [
      `2026-08-05 14:22:10,Kofi Mensah,0241234567,${n.code},${n.name},${n.category},50,50.00,MTN MoMo,VRG-984210`,
      `2026-08-05 12:10:05,Ama Serwaa,0559876543,${n.code},${n.name},${n.category},20,20.00,Telecel Cash,VRG-984211`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + mockLogs.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `voter_logs_${selectedContest.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Voter CSV report exported successfully!');
  };

  // Copy Voting Link
  const handleCopyVotingLink = () => {
    if (!selectedContest) return;
    const url = getEventShareUrl(selectedContest);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Account Blocked Guard
  if (profile.isBlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer"
            aria-label="Close"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
            <XCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">Organizer Portal Access Blocked</h3>
          <p className="text-xs text-slate-400">
            Your organizer account (<span className="text-white font-mono">{profile.email}</span>) has been restricted by an Administrator.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl relative text-white my-4 flex flex-col min-h-[85vh]"
      >

        {/* Toast Alert Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-400 text-slate-950 px-6 py-2.5 text-xs font-black flex items-center justify-between shrink-0 shadow-lg"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> {toastMessage}
              </span>
              <button onClick={() => setToastMessage(null)} className="font-bold hover:opacity-75">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. TOP HEADER & QUICK BALANCE CARDS */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-5 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0">
          
          {/* Organizer Info & Verified Badge */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-xl text-white">{settingsAgencyName || profile.fullName}</h3>
                {profile.isVerified ? (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active Verified Organizer
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Account: <span className="text-slate-200 font-semibold">{profile.email}</span> • Phone: <span className="text-slate-200">{settingsPhone || profile.phone}</span>
              </p>
            </div>
          </div>

          {/* Quick Balance Card */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 px-4 shrink-0 min-w-[130px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-400" /> Total Revenue
              </span>
              <div className="text-base font-black text-amber-400 mt-0.5">
                {formatPrice(grossEarnings, currency)}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 px-4 shrink-0 min-w-[120px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400" /> Total Votes
              </span>
              <div className="text-base font-black text-blue-400 mt-0.5">
                {totalVotesAcrossEvents.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-3 px-4 shrink-0 min-w-[150px] bg-emerald-950/20">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-emerald-400" /> Available Payout
              </span>
              <div className="text-base font-black text-emerald-300 mt-0.5">
                {formatPrice(availableBalance, currency)}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer shrink-0 ml-auto md:ml-2"
              title="Close Portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. BODY LAYOUT WITH SIDEBAR + MAIN CONTENT */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-1 shrink-0 flex md:flex-col overflow-x-auto md:overflow-y-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('my_events')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'my_events'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Events & Toggles ({myContests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('create_event')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'create_event'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Create Event</span>
            </button>

            <button
              onClick={() => setActiveTab('nominees')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'nominees'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Nominees Portal</span>
              {pendingCandidates.length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-auto">
                  {pendingCandidates.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Live Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('payouts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'payouts'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Payouts & MoMo</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings & Viral Tools</span>
            </button>
          </div>

          {/* Main Dashboard Content View */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto max-h-[75vh]">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-lg font-black text-white">Organizer Dashboard Overview</h4>
                    <p className="text-xs text-slate-400">Track event performance, real-time vote activity, and payouts.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('create_event')}
                    className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Launch Campaign
                  </button>
                </div>

                {/* Quick Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Active Campaigns</span>
                    <div className="text-2xl font-black text-white mt-1">{myContests.length} Events</div>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
                      {myContests.filter(c => c.isLive).length} currently live
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Total Nominees</span>
                    <div className="text-2xl font-black text-amber-400 mt-1">{localNominees.length} Contestants</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Across all categories</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Gross Revenue</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{formatPrice(grossEarnings, currency)}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Vote & ticket revenue</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Available Balance</span>
                    <div className="text-2xl font-black text-blue-400 mt-1">{formatPrice(availableBalance, currency)}</div>
                    <button
                      onClick={() => setActiveTab('payouts')}
                      className="text-[10px] text-blue-400 underline font-bold mt-1 block hover:text-blue-300 cursor-pointer"
                    >
                      Request Payout →
                    </button>
                  </div>
                </div>

                {/* Event Selector for Quick Controls */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-black text-sm text-white">Your Managed Events</h5>
                    <button
                      onClick={() => setActiveTab('my_events')}
                      className="text-xs font-bold text-blue-400 hover:underline cursor-pointer"
                    >
                      View All Events & Toggles →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myContests.map((contest) => (
                      <div
                        key={contest.id}
                        onClick={() => setSelectedContest(contest)}
                        className={`border rounded-2xl p-4 transition-all cursor-pointer flex gap-4 ${
                          selectedContest?.id === contest.id
                            ? 'bg-blue-950/30 border-blue-500/50 shadow-lg'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={contest.bannerUrl}
                          alt={contest.title}
                          className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-800"
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h6 className="font-extrabold text-sm text-white truncate">{contest.title}</h6>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                contest.isLive
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {contest.isLive ? 'LIVE' : 'PAUSED'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate">{contest.description}</p>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                              <span>{contest.totalVotes.toLocaleString()} Votes</span>
                              <span>•</span>
                              <span>{formatPrice(contest.votePrice, currency)} / vote</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(contest);
                              }}
                              className="text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow cursor-pointer shrink-0"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Event</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MY EVENTS CONTROL CARD & REAL-TIME TOGGLES */}
            {activeTab === 'my_events' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-black text-white">Event Management & Real-Time Controls</h4>
                  <p className="text-xs text-slate-400">Toggle live voting status and public self-registration per event.</p>
                </div>

                <div className="grid gap-6">
                  {myContests.map((contest) => {
                    const isSelected = selectedContest?.id === contest.id;

                    return (
                      <div key={contest.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <img src={contest.bannerUrl} alt={contest.title} className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-black text-base text-white">{contest.title}</h5>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                  contest.isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {contest.isLive ? 'ONGOING' : 'PAUSED'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Category: <span className="text-slate-200 capitalize font-medium">{contest.category}</span> • Votes: <span className="text-amber-400 font-bold">{contest.totalVotes.toLocaleString()}</span> • Rate: <span className="text-slate-200 font-mono">GHS {contest.votePrice}</span>
                              </p>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              onClick={() => handleOpenEditModal(contest)}
                              className="text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Event</span>
                            </button>
                            <button
                              onClick={() => setSelectedContest(contest)}
                              className="text-xs font-bold bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                            >
                              Edit Flyer
                            </button>
                            <button
                              onClick={() => {
                                setSelectedContest(contest);
                                setActiveTab('nominees');
                              }}
                              className="text-xs font-bold bg-blue-600/30 border border-blue-500/40 text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white cursor-pointer"
                            >
                              Manage Nominees →
                            </button>
                            <button
                              onClick={() => handleOpenManageTicketsModal(contest)}
                              className="text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow cursor-pointer"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>Manage Tickets ({contest.ticketTiers?.length || 0})</span>
                            </button>
                          </div>
                        </div>

                        {/* TOGGLES ROW */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                          {/* Toggle 1: Voting Status */}
                          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="text-xs font-extrabold text-white">Voting Status</div>
                              <div className="text-[11px] text-slate-400">
                                {contest.isLive ? '🟢 ONGOING - Accepting votes' : '🔴 PAUSED - Voting disabled'}
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleStatus(contest)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                contest.isLive ? 'bg-emerald-600 text-white shadow' : 'bg-rose-600 text-white shadow'
                              }`}
                            >
                              {contest.isLive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              <span>{contest.isLive ? 'ONGOING 🟢' : 'PAUSED 🔴'}</span>
                            </button>
                          </div>

                          {/* Toggle 2: Nominee Self-Registration */}
                          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="text-xs font-extrabold text-white">Nominee Self-Registration</div>
                              <div className="text-[11px] text-slate-400">
                                {contest.allowSelfRegistration ? '🟢 ENABLED - Public page open' : '🔴 DISABLED - Organizer upload only'}
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleSelfRegistration(contest)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                contest.allowSelfRegistration ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {contest.allowSelfRegistration ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              <span>{contest.allowSelfRegistration ? 'ENABLED 🟢' : 'DISABLED 🔴'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Edit Selected Event Banner & Form */}
                {selectedContest && (
                  <form onSubmit={handleSaveEventEdits} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 mt-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-blue-400" />
                        <h4 className="font-extrabold text-white text-sm">Edit Banner & Event Information for "{selectedContest.title}"</h4>
                      </div>
                      {saveSuccess && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Event updated!
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Event Title</label>
                        <input
                          type="text"
                          required
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Event Banner Image URL or Upload</label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            required
                            value={editFlyerUrl}
                            onChange={(e) => setEditFlyerUrl(e.target.value)}
                            placeholder="Image URL..."
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                          <label className="bg-slate-800 hover:bg-slate-700 px-3 py-2.5 rounded-xl border border-slate-700 cursor-pointer flex items-center justify-center text-xs font-bold text-slate-300">
                            <Upload className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, setEditFlyerUrl);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Event Description</label>
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-1">Event Banner Flyer Preview</span>
                      <div className="h-40 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 relative">
                        <img
                          src={editFlyerUrl || selectedContest.bannerUrl}
                          alt="Flyer Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Event Banner Changes</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: CAMPAIGN CREATOR STEPPER & ONBOARDING MODE */}
            {activeTab === 'create_event' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-black text-white">Create New Event & Onboarding Setup</h4>
                  <p className="text-xs text-slate-400">Configure event details, banner flyer, voting rules, and nominee addition mode.</p>
                </div>

                {/* Stepper Progress Bar */}
                <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                  <div
                    className={`py-2 px-3 rounded-xl text-center text-xs font-extrabold transition-all ${
                      stepperStep === 1
                        ? 'bg-blue-600 text-white'
                        : stepperStep > 1
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-500'
                    }`}
                  >
                    1. Basic & Onboarding
                  </div>
                  <div
                    className={`py-2 px-3 rounded-xl text-center text-xs font-extrabold transition-all ${
                      stepperStep === 2
                        ? 'bg-blue-600 text-white'
                        : stepperStep > 2
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-500'
                    }`}
                  >
                    2. Categories & Nominees
                  </div>
                  <div
                    className={`py-2 px-3 rounded-xl text-center text-xs font-extrabold transition-all ${
                      stepperStep === 3
                        ? 'bg-blue-600 text-white'
                        : stepperStep > 3
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-500'
                    }`}
                  >
                    3. Ticket Tiers
                  </div>
                  <div
                    className={`py-2 px-3 rounded-xl text-center text-xs font-extrabold transition-all ${
                      stepperStep === 4 ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500'
                    }`}
                  >
                    4. Review & Publish
                  </div>
                </div>

                {/* STEP 1: Basic Event Details & Nominee Onboarding Mode */}
                {stepperStep === 1 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <h5 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">
                      Step 1: Event Details & Nominee Onboarding Mode
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Event Title</label>
                        <input
                          type="text"
                          required
                          value={step1Title}
                          onChange={(e) => setStep1Title(e.target.value)}
                          placeholder="e.g. Ghana Music Excellence Awards 2026"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Category Type</label>
                        <select
                          value={step1Category}
                          onChange={(e) => setStep1Category(e.target.value as CategoryType)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="award">Award Scheme</option>
                          <option value="pageant">Beauty Pageant</option>
                          <option value="election">Student / Executive Election</option>
                          <option value="talent">Talent Show / Reality TV</option>
                          <option value="ticket">Concert / Event Tickets</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Vote Price (GHS per vote)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={step1VotePrice}
                          onChange={(e) => setStep1VotePrice(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={step1StartDate}
                          onChange={(e) => setStep1StartDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">End Date</label>
                        <input
                          type="date"
                          value={step1EndDate}
                          onChange={(e) => setStep1EndDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* EVENT BANNER IMAGE UPLOAD FIELD */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                        <span>Event Banner Picture Upload</span>
                        <span className="text-[11px] text-slate-400">File picker preview or image URL</span>
                      </label>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="url"
                          value={step1BannerUrl}
                          onChange={(e) => setStep1BannerUrl(e.target.value)}
                          placeholder="Paste Flyer Image URL or upload file..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <label className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 cursor-pointer flex items-center justify-center gap-2 shrink-0">
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>Upload Banner</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, setStep1BannerUrl);
                            }}
                          />
                        </label>
                      </div>

                      {step1BannerUrl && (
                        <div className="mt-3 h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative">
                          <img src={step1BannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* NOMINEE ADDITION MODE (RADIO / TOGGLE SELECTOR) */}
                    <div className="space-y-3 border-t border-slate-800 pt-4">
                      <label className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                        Nominee Addition & Onboarding Mode
                      </label>
                      <p className="text-xs text-slate-400">Choose how contestants/nominees will be registered for this event:</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Option A */}
                        <label
                          onClick={() => setStep1OnboardingMode('organizer_only')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 block ${
                            step1OnboardingMode === 'organizer_only'
                              ? 'bg-blue-950/40 border-blue-500 shadow-lg'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-white">Option A: Organizer Upload</span>
                            <input
                              type="radio"
                              name="onboardingMode"
                              checked={step1OnboardingMode === 'organizer_only'}
                              onChange={() => setStep1OnboardingMode('organizer_only')}
                              className="accent-blue-500"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            "I will upload all nominees/contestants myself." Public self-registration is closed.
                          </p>
                        </label>

                        {/* Option B */}
                        <label
                          onClick={() => setStep1OnboardingMode('public_self_register')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 block ${
                            step1OnboardingMode === 'public_self_register'
                              ? 'bg-blue-950/40 border-blue-500 shadow-lg'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-white">Option B: Public Registration</span>
                            <input
                              type="radio"
                              name="onboardingMode"
                              checked={step1OnboardingMode === 'public_self_register'}
                              onChange={() => setStep1OnboardingMode('public_self_register')}
                              className="accent-blue-500"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            "Allow contestants to self-register as nominees on a public page." Submissions enter your approval queue.
                          </p>
                        </label>

                        {/* Option C */}
                        <label
                          onClick={() => setStep1OnboardingMode('hybrid')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 block ${
                            step1OnboardingMode === 'hybrid'
                              ? 'bg-blue-950/40 border-blue-500 shadow-lg'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-white">Option C: Hybrid Mode</span>
                            <input
                              type="radio"
                              name="onboardingMode"
                              checked={step1OnboardingMode === 'hybrid'}
                              onChange={() => setStep1OnboardingMode('hybrid')}
                              className="accent-blue-500"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            "Hybrid (Both Organizer Upload & Public Self-Registration)." Maximum candidate participation.
                          </p>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Event Description & Rules</label>
                      <textarea
                        rows={3}
                        value={step1Description}
                        onChange={(e) => setStep1Description(e.target.value)}
                        placeholder="Briefly describe the contest rules, voting terms, and criteria..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (!step1Title.trim()) {
                            alert('Please enter an Event Title.');
                            return;
                          }
                          setStepperStep(2);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer flex items-center gap-2"
                      >
                        <span>Next: Category & Nominees</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Category & Nominee Setup */}
                {stepperStep === 2 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <h5 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">
                      Step 2: Category & Nominee Setup
                    </h5>

                    {/* Category Creation Form */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="New Category Name (e.g., Best Campus Executive)"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCatName.trim()) return;
                          setCategories([...categories, { id: `cat-${Date.now()}`, name: newCatName.trim(), nominees: [] }]);
                          setNewCatName('');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shrink-0"
                      >
                        Add Category
                      </button>
                    </div>

                    {/* Category Tabs */}
                    {categories.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2">
                        {categories.map((cat, idx) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCatIndex(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              activeCatIndex === idx
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {cat.name} ({cat.nominees.length})
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Nominee Addition Box */}
                    {categories[activeCatIndex] && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                        <h6 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Add Nominee to "{categories[activeCatIndex].name}"
                        </h6>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 block mb-1">Nominee Name</label>
                            <input
                              type="text"
                              value={nomName}
                              onChange={(e) => setNomName(e.target.value)}
                              placeholder="e.g. Stonebwoy"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-400 block mb-1">Photo Upload or URL</label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={nomPhotoUrl}
                                onChange={(e) => setNomPhotoUrl(e.target.value)}
                                placeholder="Photo URL..."
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                              />
                              <label className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg cursor-pointer flex items-center justify-center">
                                <Upload className="w-3.5 h-3.5 text-amber-400" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, setNomPhotoUrl);
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Short Bio / Tagline</label>
                          <input
                            type="text"
                            value={nomBio}
                            onChange={(e) => setNomBio(e.target.value)}
                            placeholder="Contestant bio or slogan"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!nomName.trim()) return;
                            const cat = categories[activeCatIndex];
                            if (!cat) return;
                            const autoCode = `VR-${Math.floor(100 + Math.random() * 900)}`;
                            const newNom = {
                              id: `nom-${Date.now()}`,
                              name: nomName.trim(),
                              code: autoCode,
                              photoUrl: nomPhotoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
                              bio: nomBio.trim(),
                            };
                            const updatedCategories = [...categories];
                            updatedCategories[activeCatIndex].nominees.push(newNom);
                            setCategories(updatedCategories);
                            setNomName('');
                            setNomPhotoUrl('');
                            setNomBio('');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Save Nominee (Auto Code)</span>
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setStepperStep(1)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        onClick={() => setStepperStep(3)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer flex items-center gap-2"
                      >
                        <span>Next: Ticket Tiers</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: TICKET TIERS */}
                {stepperStep === 3 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h5 className="font-extrabold text-white text-sm">
                          Step 3: Ticket Tiers & Pass Configuration
                        </h5>
                        <p className="text-xs text-slate-400 mt-0.5">Configure ticket passes, prices, and quantities for your event attendees.</p>
                      </div>
                      <span className="text-xs font-mono font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 px-3 py-1 rounded-full">
                        {ticketTiers.length} Tier(s) Added
                      </span>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">Quick Add Preset Tiers:</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!ticketTiers.some(t => t.name === 'Regular Pass')) {
                              setTicketTiers(prev => [...prev, { id: `t-reg-${Date.now()}`, name: 'Regular Pass', price: 50, available: 300, description: 'General Gate Entry Pass' }]);
                            }
                          }}
                          className="text-xs font-bold bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5 text-amber-400" />
                          <span>+ Regular (GH₵ 50)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!ticketTiers.some(t => t.name === 'VIP Pass')) {
                              setTicketTiers(prev => [...prev, { id: `t-vip-${Date.now()}`, name: 'VIP Pass', price: 150, available: 100, description: 'Front Row Seating & Free Drink' }]);
                            }
                          }}
                          className="text-xs font-bold bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5 text-purple-400" />
                          <span>+ VIP (GH₵ 150)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!ticketTiers.some(t => t.name === 'VVIP Table')) {
                              setTicketTiers(prev => [...prev, { id: `t-vvip-${Date.now()}`, name: 'VVIP Table Pass', price: 500, available: 20, description: 'Exclusive VVIP Lounge Table for 5' }]);
                            }
                          }}
                          className="text-xs font-bold bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5 text-amber-400" />
                          <span>+ VVIP Table (GH₵ 500)</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Tiers List */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-300">Active Ticket Tiers:</label>
                      {ticketTiers.length === 0 ? (
                        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
                          No ticket tiers added yet. Use the presets above or form below to add tier options.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {ticketTiers.map((tier) => (
                            <div key={tier.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3">
                              <div>
                                <div className="font-extrabold text-white text-xs flex items-center gap-2">
                                  <span>{tier.name}</span>
                                  <span className="font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[11px]">
                                    GH₵ {tier.price.toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1">{tier.description || 'General entry'}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Available: {tier.available} passes</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setTicketTiers(prev => prev.filter(t => t.id !== tier.id))}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manual Tier Creation Form */}
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
                      <div className="text-xs font-extrabold text-white">Add Custom Ticket Tier</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Tier Name</label>
                          <input
                            type="text"
                            value={tierName}
                            onChange={(e) => setTierName(e.target.value)}
                            placeholder="e.g. Early Bird"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Price (GH₵)</label>
                          <input
                            type="number"
                            value={tierPrice}
                            onChange={(e) => setTierPrice(e.target.value)}
                            placeholder="e.g. 40"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={tierQuantity}
                            onChange={(e) => setTierQuantity(e.target.value)}
                            placeholder="e.g. 200"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!tierName.trim()) return;
                            setTicketTiers(prev => [
                              ...prev,
                              {
                                id: `t-cust-${Date.now()}`,
                                name: tierName.trim(),
                                price: parseFloat(tierPrice) || 30,
                                available: parseInt(tierQuantity, 10) || 100,
                                description: 'Custom event ticket pass'
                              }
                            ]);
                            setTierName('');
                            setTierPrice('');
                            setTierQuantity('');
                          }}
                          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Add Ticket Tier</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-slate-800">
                      <button onClick={() => setStepperStep(2)} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer">Back</button>
                      <button onClick={() => setStepperStep(4)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5">
                        <span>Next: Review & Publish</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {stepperStep === 4 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <h5 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">
                      Step 4: Review & Publish Event
                    </h5>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <h6 className="font-black text-lg text-white">{step1Title || 'New Event'}</h6>
                      <div className="text-xs text-amber-400 font-bold">
                        GHS {step1VotePrice} per vote • Onboarding: {step1OnboardingMode.toUpperCase()}
                      </div>
                      <p className="text-xs text-slate-400">{step1Description}</p>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button onClick={() => setStepperStep(3)} className="bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl">Back</button>
                      <button
                        onClick={handlePublishEvent}
                        className="bg-amber-400 text-slate-950 font-black text-sm px-8 py-3 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" /> Publish Event Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DEDICATED ORGANIZER NOMINEE MANAGEMENT PORTAL */}
            {activeTab === 'nominees' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-black text-white">Nominee Management & Self-Registration Queue</h4>
                    <p className="text-xs text-slate-400">Add nominees manually with unique voting codes or review self-registered candidates.</p>
                  </div>

                  {/* Event Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">Event:</span>
                    <select
                      value={selectedContest?.id || ''}
                      onChange={(e) => {
                        const found = myContests.find(c => c.id === e.target.value);
                        if (found) setSelectedContest(found);
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                    >
                      {myContests.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 1. DEDICATED NOMINEE ADDITION FORM & BULK UPLOAD BUTTON */}
                <form onSubmit={handleAddNomineeManually} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                    <h5 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      <span>Add New Nominee / Contestant</span>
                    </h5>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkUploadModal(true)}
                        className="bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/30 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>⚡ Bulk Upload (CSV / Paste)</span>
                      </button>
                      <span className="text-[11px] text-amber-400 font-mono font-bold hidden sm:inline">
                        Target Event: {selectedContest?.title || 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Nominee Full Name */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">1. Nominee Full / Stage Name</label>
                      <input
                        type="text"
                        required
                        value={manualNomineeName}
                        onChange={(e) => setManualNomineeName(e.target.value)}
                        placeholder="e.g. Shatta Wale or Abena Korkor"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* 2. Award Category Assignment */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">2. Award Category Assignment</label>
                      <input
                        type="text"
                        required
                        value={manualNomineeCategory}
                        onChange={(e) => setManualNomineeCategory(e.target.value)}
                        placeholder="e.g. Artiste of the Year, Best Campus Exec"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* 4. Unique Voting Code */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                        <span>4. Unique Voting Code</span>
                        <button
                          type="button"
                          onClick={() => handleAutoGenerateCode()}
                          className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer font-bold flex items-center gap-1"
                          title="Generate next sequential voting code"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Sequential ({getNextNomineeCode(localNominees, selectedContest)})</span>
                        </button>
                      </label>
                      <input
                        type="text"
                        required
                        value={manualNomineeCode || getNextNomineeCode(localNominees, selectedContest)}
                        onChange={(e) => setManualNomineeCode(e.target.value.toUpperCase())}
                        placeholder={getNextNomineeCode(localNominees, selectedContest)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-blue-500 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 3. Nominee Bio */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">3. Nominee Bio / Slogan</label>
                      <input
                        type="text"
                        value={manualNomineeBio}
                        onChange={(e) => setManualNomineeBio(e.target.value)}
                        placeholder="Contestant slogan or short biography..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* 5. PROFILE / REPRESENTATIVE PICTURE UPLOAD */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                        <span>5. Profile Picture Upload / URL</span>
                        <span className="text-[10px] text-slate-400">File picker preview or URL</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={manualNomineePhotoUrl}
                          onChange={(e) => setManualNomineePhotoUrl(e.target.value)}
                          placeholder="Image URL..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <label className="bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-700 cursor-pointer flex items-center justify-center text-xs font-bold text-amber-400">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, setManualNomineePhotoUrl);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Save & Add Nominee to Event</span>
                    </button>
                  </div>
                </form>

                {/* 2. PUBLIC NOMINEE REGISTRATION APPROVAL QUEUE */}
                <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4 bg-amber-950/10">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h5 className="font-extrabold text-amber-400 text-sm flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-amber-400" />
                        <span>Public Nominee Self-Registration Approval Queue ({pendingCandidates.length})</span>
                      </h5>
                      <p className="text-xs text-slate-400 mt-0.5">Approve self-registered candidates submitted via public portal.</p>
                    </div>
                  </div>

                  {pendingCandidates.length === 0 ? (
                    <div className="text-center py-6 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                      No pending self-registered candidate applications in the queue right now.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingCandidates.map((cand) => (
                        <div key={cand.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-start">
                          <img src={cand.photoUrl} alt={cand.fullName} className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0" />
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex justify-between items-center">
                              <h6 className="font-bold text-white text-sm truncate">{cand.fullName}</h6>
                              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                {cand.proposedCode}
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 font-medium">{cand.category}</div>
                            <p className="text-[11px] text-slate-400 line-clamp-2">{cand.bio}</p>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Contact: {cand.phone} • {cand.email}
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => handleApproveCandidate(cand)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Candidate
                              </button>
                              <button
                                onClick={() => handleRejectCandidate(cand.id)}
                                className="bg-rose-500/20 hover:bg-rose-600 text-rose-200 font-bold text-xs px-3 py-1.5 rounded-lg border border-rose-500/30 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. NOMINEE DIRECTORY TABLE / GRID WITH SEARCH & FILTERS */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h5 className="font-extrabold text-white text-sm">Nominee Directory ({contestNominees.length})</h5>
                      <p className="text-xs text-slate-400">Search, edit, manage or generate QR cards for active contestants.</p>
                    </div>

                    {/* Search and Category Filter Inputs */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-56">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={nomineeSearchQuery}
                          onChange={(e) => setNomineeSearchQuery(e.target.value)}
                          placeholder="Search candidate or code..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>

                      {/* Category Filter Dropdown */}
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium shrink-0 max-w-[140px]"
                      >
                        <option value="ALL">All Categories</option>
                        {Array.from(new Set(contestNominees.map((n) => n.category))).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filtered Nominees List */}
                  {(() => {
                    const filtered = contestNominees.filter((n) => {
                      const matchesSearch =
                        n.name.toLowerCase().includes(nomineeSearchQuery.toLowerCase()) ||
                        n.code.toLowerCase().includes(nomineeSearchQuery.toLowerCase()) ||
                        n.category.toLowerCase().includes(nomineeSearchQuery.toLowerCase());
                      const matchesCat =
                        selectedCategoryFilter === 'ALL' ||
                        n.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
                      return matchesSearch && matchesCat;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-400">
                          No nominees matching "{nomineeSearchQuery}" found in this event.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((nom) => (
                          <motion.div
                            key={nom.id}
                            whileHover={{ y: -3, scale: 1.01 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center relative group"
                          >
                            <img
                              src={nom.photoUrl}
                              alt={nom.name}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                            />
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <h6 className="font-extrabold text-sm text-white truncate">{nom.name}</h6>
                                <span className="text-xs font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                  {nom.code}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 truncate">{nom.category}</div>
                              <div className="text-xs font-bold text-emerald-400">
                                {nom.votes.toLocaleString()} Votes
                              </div>

                              <div className="pt-2 flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedNomineeForBadge(nom)}
                                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1"
                                >
                                  <QrCode className="w-3 h-3" /> Card & QR
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditNominee(nom)}
                                  className="bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-blue-500/30 cursor-pointer flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNominee(nom.id, nom.name)}
                                  className="bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-rose-500/30 cursor-pointer flex items-center gap-1 ml-auto"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB 5: LIVE LEADERBOARD & ANALYTICS */}
            {activeTab === 'leaderboard' && selectedContest && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-black text-white">Live Leaderboard & Analytics</h4>
                    <p className="text-xs text-slate-400">Real-time vote distribution, QR codes, and voter audit logs.</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleCopyVotingLink}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Voting Link'}</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Voter CSV</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bars per Nominee */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h5 className="font-extrabold text-white text-sm">Real-time Vote Percentages</h5>

                  <div className="space-y-4">
                    {contestNominees.map((nom, idx) => {
                      const totalCatVotes = contestNominees.reduce((sum, n) => sum + n.votes, 0) || 1;
                      const percent = Math.round((nom.votes / totalCatVotes) * 100);

                      return (
                        <div key={nom.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-amber-400 font-black">#{idx + 1}</span>
                              <span className="font-bold text-white">{nom.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">({nom.code})</span>
                            </div>
                            <div className="font-mono text-xs font-black text-amber-400">
                              {nom.votes.toLocaleString()} votes ({percent}%)
                            </div>
                          </div>

                          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-amber-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(percent, 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: PAYOUT REQUEST MODULE & MAIN PLATFORM PAYSTACK WORKFLOW */}
            {activeTab === 'payouts' && (
              <div className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Main Platform Paystack Escrow Active</span>
                      </span>
                      <span className="text-slate-500 text-xs font-mono">Platform Escrow</span>
                    </div>
                    <h4 className="text-xl font-black text-white tracking-tight mt-1">
                      Organizer Revenue & Paystack Payout Requests
                    </h4>
                    <p className="text-xs text-slate-400">
                      All vote and ticket payments flow into the main platform Paystack account. Track your accumulated net revenue in real-time and submit payout requests directly to your Mobile Money or Bank Account.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowSubaccountEdit(!showSubaccountEdit)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span>{showSubaccountEdit ? 'Close Details' : 'Default MoMo Details'}</span>
                    </button>
                  </div>
                </motion.div>

                {/* Inline Saved Default MoMo Details Editor */}
                {showSubaccountEdit && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveSubaccountConfig}
                    className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <h5 className="font-extrabold text-sm text-white">Default Payout Settlement Account</h5>
                      </div>
                      <span className="text-[11px] text-amber-400 font-mono font-bold">85% Net Split Active</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Settlement Bank / MoMo Network</label>
                        <select
                          value={editSettlementBank}
                          onChange={(e) => setEditSettlementBank(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                        >
                          <option value="MTN Mobile Money (Ghana)">MTN Mobile Money (Ghana)</option>
                          <option value="Telecel Cash (Ghana)">Telecel Cash (Ghana)</option>
                          <option value="AT Money (AirtelTigo)">AT Money (AirtelTigo)</option>
                          <option value="Ecobank Ghana">Ecobank Ghana</option>
                          <option value="GCB Bank">GCB Bank</option>
                          <option value="Stanbic Bank Ghana">Stanbic Bank Ghana</option>
                          <option value="Fidelity Bank Ghana">Fidelity Bank Ghana</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Account / MoMo Number</label>
                        <input
                          type="text"
                          required
                          value={editAccountNumber}
                          onChange={(e) => setEditAccountNumber(e.target.value)}
                          placeholder="024XXXXXXX"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Registered Account Name</label>
                        <input
                          type="text"
                          required
                          value={editAccountName}
                          onChange={(e) => setEditAccountName(e.target.value)}
                          placeholder="Name on MoMo account"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSubaccountEdit(false)}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold px-4 py-2 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-5 py-2 rounded-xl transition-all shadow"
                      >
                        Save Settlement Account
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Balance & Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden"
                  >
                    <span className="text-slate-400 text-[11px] font-bold block">Gross Revenue Generated</span>
                    <div className="text-2xl font-black text-white mt-1">{formatPrice(grossEarnings, currency)}</div>
                    <span className="text-[10px] text-slate-500 block mt-1">From all votes and ticket purchases</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden"
                  >
                    <span className="text-slate-400 text-[11px] font-bold block">Platform Fee (15%)</span>
                    <div className="text-2xl font-black text-rose-400 mt-1">-{formatPrice(platformFee, currency)}</div>
                    <span className="text-[10px] text-slate-500 block mt-1">Retained by platform for processing</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 bg-emerald-950/20 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 text-[11px] font-extrabold block">Available Balance</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-3xl font-black text-emerald-300 mt-1">{formatPrice(availableBalance, currency)}</div>
                    <span className="text-[10px] text-emerald-400/80 block mt-1">Available for On-Demand Payout</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden"
                  >
                    <span className="text-slate-400 text-[11px] font-bold block">Total Disbursed To Date</span>
                    <div className="text-2xl font-black text-amber-400 mt-1">{formatPrice(totalPaidOut, currency)}</div>
                    <span className="text-[10px] text-slate-500 block mt-1">Disbursed via Main Paystack Account</span>
                  </motion.div>
                </div>

                {/* Main 2-Column Split: Payout Request Form & Architecture Info */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Payout Request Form */}
                  <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl"
                  >
                    <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-white text-sm">Request Payout</h5>
                          <p className="text-[11px] text-slate-400">Submit withdrawal request to Admin for Paystack disbursement</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
                        Escrow Payout
                      </span>
                    </div>

                    {payoutError && (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{payoutError}</span>
                      </div>
                    )}

                    {payoutSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{payoutSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handlePayoutSubmit} className="space-y-4">
                      {/* Select Event */}
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Select Event Revenue Source</label>
                        <select
                          value={selectedPayoutEventId}
                          onChange={(e) => setSelectedPayoutEventId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                        >
                          {myContests.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Payment Method */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">Payout Method</label>
                          <select
                            value={payoutMethod}
                            onChange={(e) => setPayoutMethod(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                          >
                            <option value="Mobile Money">Mobile Money (MTN, Telecel, AT)</option>
                            <option value="Bank Transfer">Bank Wire Transfer</option>
                          </select>
                        </div>

                        {/* Network / Provider */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            {payoutMethod === 'Mobile Money' ? 'MoMo Network Provider' : 'Bank Name'}
                          </label>
                          {payoutMethod === 'Mobile Money' ? (
                            <select
                              value={momoNetwork}
                              onChange={(e) => setMomoNetwork(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                            >
                              <option value="MTN MoMo">MTN Mobile Money</option>
                              <option value="Telecel Cash">Telecel Cash (Vodafone)</option>
                              <option value="AT Money">AT Money (AirtelTigo)</option>
                            </select>
                          ) : (
                            <select
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                            >
                              <option value="Ecobank Ghana">Ecobank Ghana</option>
                              <option value="GCB Bank">GCB Bank</option>
                              <option value="Stanbic Bank">Stanbic Bank</option>
                              <option value="Fidelity Bank">Fidelity Bank</option>
                              <option value="Zenith Bank">Zenith Bank</option>
                              <option value="CalBank">CalBank</option>
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* MoMo / Account Number */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            {payoutMethod === 'Mobile Money' ? 'MoMo Number' : 'Account Number'}
                          </label>
                          <input
                            type="text"
                            required
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="024XXXXXXX"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 font-bold"
                          />
                        </div>

                        {/* Account Holder Name */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">Account Holder Name</label>
                          <input
                            type="text"
                            required
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Exact account name"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Withdrawal Amount with Quick Percentage Presets */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-300">
                            Requested Payout Amount (GHS)
                          </label>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            Max Available: GHS {availableBalance.toFixed(2)}
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            required
                            step="0.01"
                            max={availableBalance}
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder={`Enter GHS amount (e.g. ${availableBalance > 0 ? availableBalance.toFixed(2) : '100.00'})`}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3.5 pr-20 py-2.5 text-sm text-amber-400 font-mono font-black focus:outline-none focus:border-emerald-500"
                          />
                          <div className="absolute right-3 top-2.5 text-xs font-extrabold text-slate-500 pointer-events-none">
                            GHS
                          </div>
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Quick Fill:</span>
                          {[25, 50, 75, 100].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => handleSelectPreset(pct)}
                              disabled={availableBalance <= 0}
                              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono font-bold text-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmittingPayout || availableBalance <= 0}
                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm py-3.5 rounded-xl transition-all shadow-xl shadow-emerald-900/30 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                      >
                        {isSubmittingPayout ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Submitting Payout Request...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-300" />
                            <span>Submit Payout Request</span>
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>

                  {/* Right Column: Main Paystack Central Escrow Info */}
                  <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="lg:col-span-5 space-y-4"
                  >
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400" />
                          <h5 className="font-extrabold text-white text-xs uppercase tracking-wider">
                            Central Escrow Account
                          </h5>
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          Main Account
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 font-bold">Paystack Master Account</span>
                          <span className="font-mono text-amber-300 font-bold">Main Platform Gateway</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 font-bold">Organizer Net Revenue</span>
                          <span className="font-bold text-white">85% of Gross Revenue</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 font-bold">Platform Processing Fee</span>
                          <span className="font-mono text-emerald-400 font-bold">15%</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 font-bold">Disbursement Mechanism</span>
                          <span className="font-bold text-white">Admin Approval & MoMo/Bank Wire</span>
                        </div>
                      </div>
                    </div>

                    {/* How Payout Workflow Works */}
                    <div className="bg-gradient-to-br from-blue-950/40 via-slate-950 to-indigo-950/40 border border-blue-500/30 rounded-2xl p-5 space-y-3 shadow-xl">
                      <div className="flex items-center gap-2 text-blue-400 font-extrabold text-xs">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span>Central Escrow Payout Workflow</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        All incoming payments flow into the main Paystack account first. When you submit a payout request, it is reviewed by admins and disbursed directly to your MoMo or Bank account.
                      </p>
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>No complex subaccount onboarding required</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Direct MoMo & Bank Wire disbursement</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Real-time earnings tracking & status audit log</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Live Transfer Execution Modal */}
                {isTransferModalOpen && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsTransferModalOpen(false);
                          setCompletedPayoutRecord(null);
                        }}
                        className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer"
                        aria-label="Close transfer modal"
                        title="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="text-center space-y-2 pt-2">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                          {completedPayoutRecord ? (
                            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                          ) : (
                            <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                          )}
                        </div>

                        <h4 className="text-lg font-black text-white">
                          {completedPayoutRecord ? 'Payout Transferred Successfully!' : 'Executing Paystack Transfer API'}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {completedPayoutRecord 
                            ? `GHS ${completedPayoutRecord.amount.toFixed(2)} disbursed to ${completedPayoutRecord.accountName}` 
                            : transferStepLabel}
                        </p>
                      </div>

                      {/* 5-Step Visual Pipeline */}
                      <div className="space-y-2.5 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs">
                        {[
                          "1. Subaccount & Balance Audit",
                          "2. Generating Recipient Code",
                          "3. Invoking Paystack Transfer API",
                          "4. Disbursing to MoMo / Bank Wallet",
                          "5. Finalizing Cryptographic Ledger"
                        ].map((stepText, idx) => {
                          const stepNum = idx + 1;
                          const isDone = activeTransferStep > stepNum || completedPayoutRecord !== null;
                          const isCurrent = activeTransferStep === stepNum && !completedPayoutRecord;

                          return (
                            <div key={idx} className="flex items-center justify-between">
                              <span className={`font-medium ${isDone ? 'text-emerald-400 font-bold' : isCurrent ? 'text-amber-300 font-bold' : 'text-slate-500'}`}>
                                {stepText}
                              </span>
                              <div>
                                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                {isCurrent && <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />}
                                {!isDone && !isCurrent && <span className="text-[10px] text-slate-600 font-mono">Pending</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Completed Details Box */}
                      {completedPayoutRecord && (
                        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-emerald-300">
                            <span className="font-bold">Transfer Code:</span>
                            <span className="font-mono font-bold">{completedPayoutRecord.transferCode}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-300">
                            <span className="font-bold">Tx Hash:</span>
                            <span className="font-mono text-[10px] text-slate-300 truncate max-w-[180px]">
                              {completedPayoutRecord.txHash}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-300">
                            <span className="font-bold">Status:</span>
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                              Disbursed
                            </span>
                          </div>
                        </div>
                      )}

                      {completedPayoutRecord && (
                        <button
                          onClick={() => {
                            setIsTransferModalOpen(false);
                            setCompletedPayoutRecord(null);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow cursor-pointer"
                        >
                          Done & Close
                        </button>
                      )}
                    </motion.div>
                  </div>
                )}

                {/* Payout History Ledger Table */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden space-y-3 p-5 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h5 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      <span>Paystack Transfer & Payout History</span>
                    </h5>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {payoutRequestsHistory.length} Total Records
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Method / Network</th>
                          <th className="py-2.5 px-3">Account Details</th>
                          <th className="py-2.5 px-3">Transfer Code</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {payoutRequestsHistory.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-white">
                              {p.momoNetwork || p.bankOrNetworkName || 'MoMo'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono">
                              {p.accountNumber} ({p.accountName})
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                              {p.transferCode || 'TRF_VRG_INIT'}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">
                              GHS {p.amount.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                  p.status === 'APPROVED' || p.status === 'Paid' || p.status === 'DISBURSED'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : p.status === 'REJECTED'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {p.status === 'APPROVED' ? 'DISBURSED' : p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </div>
            )}

            {/* TAB 7: SETTINGS & VIRAL TOOLS */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-black text-white">Organizer Settings & Viral Tools</h4>
                  <p className="text-xs text-slate-400">Manage organizer profile credentials and generate viral event share assets.</p>
                </div>

                {/* Organizer Profile Form */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h5 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">
                    Organizer Agency Profile
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Agency / Organization Name</label>
                      <input
                        type="text"
                        value={settingsAgencyName}
                        onChange={(e) => setSettingsAgencyName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Official Contact Phone</label>
                      <input
                        type="text"
                        value={settingsPhone}
                        onChange={(e) => setSettingsPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Agency Logo URL</label>
                      <input
                        type="url"
                        value={settingsLogoUrl}
                        onChange={(e) => setSettingsLogoUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Default MoMo Payout Phone Number</label>
                      <input
                        type="text"
                        value={settingsMomoNumber}
                        onChange={(e) => setSettingsMomoNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Organizer profile settings saved!')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Save Profile Settings
                  </button>
                </div>

                {/* Viral & Growth Tools */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h5 className="font-extrabold text-amber-400 text-sm border-b border-slate-800 pb-2">
                    Viral Campaign Tools & Event Poster QR Codes
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                      <Share2 className="w-5 h-5 text-blue-400" />
                      <div className="font-bold text-xs text-white">Event Share Link</div>
                      <p className="text-[11px] text-slate-400">Direct URL for voters to land on your voting page.</p>
                      <button
                        onClick={handleCopyVotingLink}
                        className="w-full bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer"
                      >
                        Copy Share Link
                      </button>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                      <QrCode className="w-5 h-5 text-amber-400" />
                      <div className="font-bold text-xs text-white">Download Poster QR Code</div>
                      <p className="text-[11px] text-slate-400">High-resolution QR code image for flyer printing.</p>
                      <button
                        onClick={() => setShowPosterModal(true)}
                        className="w-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs py-2 rounded-lg transition cursor-pointer"
                      >
                        View Poster QR
                      </button>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                      <Download className="w-5 h-5 text-emerald-400" />
                      <div className="font-bold text-xs text-white">Export Votes CSV Report</div>
                      <p className="text-[11px] text-slate-400">Download complete audit log of votes for transparency.</p>
                      <button
                        onClick={handleExportCSV}
                        className="w-full bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer"
                      >
                        Export Votes CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </motion.div>

      {/* MODAL: NOMINEE VOTING BADGE / QR CODE */}
      <AnimatePresence>
        {selectedNomineeForBadge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative text-white"
            >
              <button
                onClick={() => setSelectedNomineeForBadge(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Official Voting Card
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <img src={selectedNomineeForBadge.photoUrl} alt={selectedNomineeForBadge.name} className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-amber-400 shadow-lg" />
                <div>
                  <h3 className="font-extrabold text-lg text-white">{selectedNomineeForBadge.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{selectedNomineeForBadge.category}</p>
                </div>

                <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-3">
                  <span className="text-[10px] text-amber-300 uppercase font-bold block">Unique Voting Code</span>
                  <span className="text-2xl font-black text-amber-400 font-mono tracking-widest block">
                    {selectedNomineeForBadge.code}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl max-w-[140px] mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      getCandidateShareUrl(
                        selectedContest || myContests.find(c => c.id === selectedNomineeForBadge.contestId) || { id: selectedNomineeForBadge.contestId, title: 'Event' },
                        selectedNomineeForBadge
                      )
                    )}`}
                    alt="QR Code"
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Scan or enter code on VoteRight GH</p>
              </div>

              <button
                onClick={() => {
                  showToast(`Voting card badge downloaded for ${selectedNomineeForBadge.name}!`);
                  setSelectedNomineeForBadge(null);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl cursor-pointer"
              >
                Download Nominee Card & QR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: POSTER QR CODE */}
      <AnimatePresence>
        {showPosterModal && selectedContest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl relative text-white"
            >
              <button
                onClick={() => setShowPosterModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="font-black text-base text-white">Event Poster QR Code</h4>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <img src={selectedContest.bannerUrl} alt="Banner" className="w-full h-28 object-cover rounded-xl" />
                <h5 className="font-black text-sm text-amber-400">{selectedContest.title}</h5>

                <div className="p-3 bg-white rounded-xl max-w-[160px] mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      getEventShareUrl(selectedContest)
                    )}`}
                    alt="Event QR"
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-xs text-slate-300 font-mono">Scan to vote directly on VoteRight GH</p>
              </div>

              <button
                onClick={() => {
                  showToast('Event poster QR image downloaded!');
                  setShowPosterModal(false);
                }}
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-3 rounded-xl cursor-pointer"
              >
                Download Printable Poster QR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* MODAL: BULK NOMINEE UPLOAD */}
      <AnimatePresence>
        {showBulkUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative text-white"
            >
              <button
                type="button"
                onClick={() => setShowBulkUploadModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-base">
                <Upload className="w-5 h-5" />
                <span>Bulk Upload Nominees (CSV / Paste)</span>
              </div>

              <p className="text-xs text-slate-300">
                Paste list of contestants below (one contestant per line). Format:
                <br />
                <code className="text-[11px] text-amber-300 font-mono bg-slate-950 px-2 py-0.5 rounded mt-1 block border border-slate-800">
                  Full Name, Category, Code, PhotoURL, Bio
                </code>
              </p>

              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={6}
                placeholder={`Stonebwoy, Artiste of the Year, ST01, https://..., Reggae pioneer\nSarkodie, Artiste of the Year, SK02, https://..., Hip-hop icon\nBlack Sherif, Best New Artiste, BS03, https://..., Highlife fusion`}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkNomineeUpload}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 cursor-pointer flex items-center gap-1.5 shadow-lg"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Process Bulk Upload</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT NOMINEE */}
      <AnimatePresence>
        {editingNominee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-white"
            >
              <button
                type="button"
                onClick={() => setEditingNominee(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-blue-400 font-extrabold text-base">
                <Edit2 className="w-5 h-5" />
                <span>Edit Nominee Details</span>
              </div>

              <form onSubmit={handleSaveEditNominee} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Full / Stage Name</label>
                  <input
                    type="text"
                    required
                    value={editNomineeName}
                    onChange={(e) => setEditNomineeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Award Category</label>
                  <input
                    type="text"
                    required
                    value={editNomineeCategory}
                    onChange={(e) => setEditNomineeCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Voting Code</label>
                  <input
                    type="text"
                    required
                    value={editNomineeCode}
                    onChange={(e) => setEditNomineeCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex justify-between">
                    <span>Photo URL or Upload</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editNomineePhotoUrl}
                      onChange={(e) => setEditNomineePhotoUrl(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl border border-slate-700 cursor-pointer flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, setEditNomineePhotoUrl);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Bio / Slogan</label>
                  <input
                    type="text"
                    value={editNomineeBio}
                    onChange={(e) => setEditNomineeBio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingNominee(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT EVENT */}
      <AnimatePresence>
        {editingContestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-4 my-8 text-white shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-base text-white">
                    Edit Event: {editingContestModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingContestModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveModalContest} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Event Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={editingContestModal.title}
                      placeholder="e.g. MISS CAMPUS GHANA 2026"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Organizer Name</label>
                    <input
                      type="text"
                      name="organizer"
                      required
                      defaultValue={editingContestModal.organizer || profile.fullName || ''}
                      placeholder="e.g. Campus Events Ghana"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Category Type</label>
                    <select
                      name="category"
                      defaultValue={editingContestModal.category || 'pageant'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    >
                      <option value="pageant">Beauty Pageant</option>
                      <option value="award">Excellence Award</option>
                      <option value="election">Student Election</option>
                      <option value="talent">Talent Show</option>
                      <option value="other">Other Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Price Per Vote (GH₵)</label>
                    <input
                      type="number"
                      step="0.10"
                      name="votePrice"
                      required
                      defaultValue={editingContestModal.votePrice || 1.50}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-400 focus:outline-none focus:border-amber-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Voting Status</label>
                    <select
                      name="isLive"
                      defaultValue={editingContestModal.isLive ? 'true' : 'false'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-bold"
                    >
                      <option value="true">Ongoing (Live)</option>
                      <option value="false">Closed (Paused)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={editingContestModal.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      defaultValue={editingContestModal.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Custom URL Slug (Optional)</label>
                    <input
                      type="text"
                      name="slug"
                      defaultValue={editingContestModal.slug || ''}
                      placeholder="e.g. miss-campus-2026"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Nominee Registration Mode</label>
                    <select
                      name="nomineeOnboardingMode"
                      defaultValue={editingContestModal.nomineeOnboardingMode || 'hybrid'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    >
                      <option value="hybrid">Hybrid (Public Self-Reg + Organizer Upload)</option>
                      <option value="public_self_register">Public Self-Registration Only</option>
                      <option value="organizer_only">Organizer Upload Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Banner Flyer Image URL or Upload</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      name="bannerUrl"
                      value={editModalBannerUrl}
                      onChange={(e) => setEditModalBannerUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-extrabold text-slate-200 shrink-0">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setEditModalBannerUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {editModalBannerUrl && (
                    <div className="mt-2 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                      <img src={editModalBannerUrl} alt="Flyer Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Event Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={editingContestModal.description}
                    placeholder="Provide details about this contest or event..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Rules & Regulations (One rule per line)</label>
                  <textarea
                    name="rules"
                    rows={2}
                    defaultValue={editingContestModal.rules ? editingContestModal.rules.join('\n') : ''}
                    placeholder="Rule 1...&#10;Rule 2..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingContestModal(null)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: MANAGE EVENT TICKETS */}
        {managingTicketsContest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-6 my-8 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-white">Manage Event Tickets</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{managingTicketsContest.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setManagingTicketsContest(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Ticketing Switch */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-extrabold text-white">Ticketing Status for Public Site</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {managingTicketsEnabled ? 'Active — Users can view & purchase tickets on public gateway.' : 'Disabled — Ticketing is paused for this event.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingTicketsEnabled(!managingTicketsEnabled)}
                  className="flex items-center gap-2 cursor-pointer active:scale-95 transition"
                >
                  {managingTicketsEnabled ? (
                    <>
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-lg border border-emerald-500/30">
                        ACTIVE 🟢
                      </span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-8 h-8 text-rose-400" />
                      <span className="text-xs bg-rose-500/20 text-rose-300 font-extrabold px-3 py-1 rounded-lg border border-rose-500/30">
                        DISABLED 🔴
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Quick Add Preset Tier:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPresetTier('Regular Pass', 50, 300, 'General gate entry pass')}
                    className="text-xs font-bold bg-slate-950 border border-slate-800 hover:border-amber-400 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Regular (GH₵ 50)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetTier('VIP Lounge Pass', 150, 100, 'VIP lounge access + 1 free drink')}
                    className="text-xs font-bold bg-slate-950 border border-slate-800 hover:border-purple-400 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ VIP (GH₵ 150)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetTier('VVIP Table Pass', 500, 20, 'Reserved VVIP stage table for 5 guests')}
                    className="text-xs font-bold bg-slate-950 border border-slate-800 hover:border-indigo-400 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>+ VVIP Table (GH₵ 500)</span>
                  </button>
                </div>
              </div>

              {/* Existing Tiers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">Configured Ticket Tiers ({managingTiersList.length}):</label>
                </div>

                {managingTiersList.length === 0 ? (
                  <div className="bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                    No ticket tiers added. Add one below or use quick presets above.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {managingTiersList.map((tier) => (
                      <div
                        key={tier.id}
                        className={`bg-slate-950 border p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          editingTierId === tier.id ? 'border-amber-400 bg-amber-400/5' : 'border-slate-800'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{tier.name}</span>
                            <span className="font-mono text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                              GH₵ {tier.price.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              {tier.available} Available
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{tier.description || 'General entry ticket pass'}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleEditTierClick(tier)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTierClick(tier.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add / Edit Subform */}
              <form onSubmit={handleAddOrUpdateTier} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-white">
                    {editingTierId ? '⚡ Edit Ticket Tier' : '➕ Add New Ticket Tier'}
                  </div>
                  {editingTierId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTierId(null);
                        setTierNameInput('');
                        setTierPriceInput('');
                        setTierQuantityInput('');
                        setTierDescriptionInput('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Tier Name</label>
                    <input
                      type="text"
                      required
                      value={tierNameInput}
                      onChange={(e) => setTierNameInput(e.target.value)}
                      placeholder="e.g. Early Bird Pass"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Price (GH₵)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={tierPriceInput}
                      onChange={(e) => setTierPriceInput(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Quantity Available</label>
                    <input
                      type="number"
                      required
                      value={tierQuantityInput}
                      onChange={(e) => setTierQuantityInput(e.target.value)}
                      placeholder="e.g. 200"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 text-xs">Tier Description</label>
                  <input
                    type="text"
                    value={tierDescriptionInput}
                    onChange={(e) => setTierDescriptionInput(e.target.value)}
                    placeholder="e.g. Stage front row seating & free welcome drink"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingTierId ? 'Update Tier' : 'Add Tier to List'}</span>
                  </button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setManagingTicketsContest(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTicketsForContest}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Ticket Configuration</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
