import React, { useState, useEffect } from 'react';
import {
  Contest,
  Nominee,
  VoteTransaction,
  CurrencyCode,
  OrganizerProfile,
  TicketEvent,
  NominationAward,
  RecentVoteFeed,
  SiteSettings,
  CurrencyRate,
  TicketTier,
  PayoutRequest
} from '../types';
import { formatPrice, getNextNomineeCode } from '../utils/helpers';
import { Logo } from './Logo';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Trash2,
  Edit3,
  Plus,
  Search,
  Download,
  DollarSign,
  Vote,
  Users,
  Trophy,
  X,
  BarChart3,
  Sparkles,
  Ticket,
  FileText,
  UserCheck,
  UserX,
  Building2,
  Settings,
  Radio,
  Globe,
  Clock,
  PlusCircle,
  Tag,
  Database,
  LogOut,
  Upload,
  Calendar,
  Zap,
  Check,
  Image as ImageIcon
} from 'lucide-react';

interface AdminPortalProps {
  contests: Contest[];
  nominees: Nominee[];
  transactions: VoteTransaction[];
  organizerProfiles: OrganizerProfile[];
  ticketEvents: TicketEvent[];
  nominationAwards: NominationAward[];
  recentVotes: RecentVoteFeed[];
  siteSettings: SiteSettings;
  currencies: CurrencyRate[];
  currency: CurrencyCode;
  onUpdateContests: (contests: Contest[]) => void;
  onUpdateNominees: (nominees: Nominee[]) => void;
  onUpdateTransactions: (transactions: VoteTransaction[]) => void;
  onUpdateOrganizerProfiles: (profiles: OrganizerProfile[]) => void;
  onUpdateTicketEvents: (events: TicketEvent[]) => void;
  onUpdateNominationAwards: (awards: NominationAward[]) => void;
  onUpdateRecentVotes: (votes: RecentVoteFeed[]) => void;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
  onUpdateCurrencies: (currencies: CurrencyRate[]) => void;
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  contests,
  nominees,
  transactions,
  organizerProfiles,
  ticketEvents,
  nominationAwards,
  recentVotes,
  siteSettings,
  currencies,
  currency,
  onUpdateContests,
  onUpdateNominees,
  onUpdateTransactions,
  onUpdateOrganizerProfiles,
  onUpdateTicketEvents,
  onUpdateNominationAwards,
  onUpdateRecentVotes,
  onUpdateSiteSettings,
  onUpdateCurrencies,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'settings' | 'contests' | 'nominees' | 'tickets' | 'nominations' | 'organizers' | 'transactions' | 'payouts' | 'ticker' | 'database'
  >('overview');

  // Payout Requests State
  const [payouts, setPayouts] = useState<PayoutRequest[]>(() => {
    const saved = localStorage.getItem('voterightgh_payout_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'payout-101',
        userId: 'org-1',
        organizerName: 'Aseda Event Management',
        contestId: 'contest-1',
        eventTitle: 'MISS CAMPUS GHANA 2026',
        amount: 1500,
        paymentMethod: 'Mobile Money',
        momoNetwork: 'MTN MoMo',
        accountNumber: '0244998877',
        accountName: 'Kwame Mensah',
        status: 'APPROVED',
        createdAt: '2026-08-01T10:30:00Z',
      },
    ];
  });

  useEffect(() => {
    const syncPayouts = () => {
      const saved = localStorage.getItem('voterightgh_payout_requests');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPayouts(parsed);
          }
        } catch (e) {}
      }
    };
    syncPayouts();
    window.addEventListener('storage', syncPayouts);
    window.addEventListener('voteright_payout_update', syncPayouts);
    return () => {
      window.removeEventListener('storage', syncPayouts);
      window.removeEventListener('voteright_payout_update', syncPayouts);
    };
  }, []);

  const handleApprovePayoutInPortal = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const req = payouts.find((p) => p.id === id);
    if (!req) return;

    const transferCode = `TRF-PS-${Date.now().toString().slice(-6)}`;
    const txHash = `0x${Math.random().toString(16).substring(2, 18)}`;

    const updated = payouts.map((p) =>
      p.id === id
        ? {
            ...p,
            status: newStatus,
            disbursedAt: newStatus === 'APPROVED' ? new Date().toISOString() : p.disbursedAt,
            transferCode: p.transferCode || transferCode,
            txHash: p.txHash || txHash,
          }
        : p
    );

    setPayouts(updated);
    localStorage.setItem('voterightgh_payout_requests', JSON.stringify(updated));
    window.dispatchEvent(new Event('voteright_payout_update'));
    window.dispatchEvent(new Event('storage'));

    if (newStatus === 'APPROVED') {
      showToast(
        `✅ Payout of GHS ${req.amount?.toLocaleString() || ''} to ${
          req.organizerName || 'Organizer'
        } APPROVED & DISBURSED via Main Paystack Account!`
      );
    } else {
      showToast(`❌ Payout request of GHS ${req.amount?.toLocaleString() || ''} REJECTED.`);
    }
  };

  // Filters
  const [contestStatusFilter, setContestStatusFilter] = useState<'all' | 'ongoing' | 'closed'>('all');
  const [contestSearch, setContestSearch] = useState('');
  const [selectedContestForNominees, setSelectedContestForNominees] = useState<string>('all');
  const [nomineeSearch, setNomineeSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [awardSearch, setAwardSearch] = useState('');

  // Modals / Editing States
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [isCreatingContest, setIsCreatingContest] = useState(false);
  const [adminModalBannerUrl, setAdminModalBannerUrl] = useState<string>('');

  const handleAdminFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAdminModalBannerUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditAdminContest = (contest: Contest) => {
    setEditingContest(contest);
    setAdminModalBannerUrl(contest.bannerUrl || '');
  };

  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null);
  const [isCreatingNominee, setIsCreatingNominee] = useState(false);
  const [selectedContestForNewNominee, setSelectedContestForNewNominee] = useState<string>(contests[0]?.id || '');

  const [voteAdjustNominee, setVoteAdjustNominee] = useState<Nominee | null>(null);
  const [voteAdjustAmount, setVoteAdjustAmount] = useState<number>(100);

  const [editingEvent, setEditingEvent] = useState<TicketEvent | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const [editingAward, setEditingAward] = useState<NominationAward | null>(null);
  const [isCreatingAward, setIsCreatingAward] = useState(false);

  const [editingOrganizer, setEditingOrganizer] = useState<OrganizerProfile | null>(null);
  const [isCreatingOrganizer, setIsCreatingOrganizer] = useState(false);
  const [allowlistEmail, setAllowlistEmail] = useState('');

  const [isCreatingManualTx, setIsCreatingManualTx] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string>('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // KPIs
  const totalVotesCast = contests.reduce((sum, c) => sum + c.totalVotes, 0);
  const totalRevenueGHS = transactions.reduce((sum, tx) => sum + (tx.status === 'SUCCESS' ? tx.amountPaid : 0), 0);
  const ongoingContests = contests.filter((c) => c.isLive);
  const closedContests = contests.filter((c) => !c.isLive);
  const pendingNominees = nominees.filter((n) => n.status === 'pending');

  // --- HANDLERS FOR CONTESTS ---
  const handleToggleContestLive = (contestId: string) => {
    const updated = contests.map((c) => {
      if (c.id === contestId) {
        const nextState = !c.isLive;
        showToast(`Contest "${c.title}" is now ${nextState ? 'ONGOING (Live)' : 'CLOSED'}`);
        return { ...c, isLive: nextState };
      }
      return c;
    });
    onUpdateContests(updated);
  };

  const handleDeleteContest = (contestId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This will also remove all its candidates.`)) {
      onUpdateContests(contests.filter((c) => c.id !== contestId));
      onUpdateNominees(nominees.filter((n) => n.contestId !== contestId));
      showToast(`Deleted contest "${title}"`);
    }
  };

  const handleSaveContest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const organizer = formData.get('organizer') as string;
    const category = formData.get('category') as any;
    const bannerUrl = adminModalBannerUrl.trim() || (formData.get('bannerUrl') as string) || '';
    const description = formData.get('description') as string;
    const startDate = (formData.get('startDate') as string) || new Date().toISOString().split('T')[0];
    const endDate = formData.get('endDate') as string;
    const votePrice = parseFloat(formData.get('votePrice') as string) || 1.50;
    const isLive = formData.get('isLive') === 'true';
    const slug = formData.get('slug') as string;
    const nomineeOnboardingMode = (formData.get('nomineeOnboardingMode') as any) || 'hybrid';
    const rulesRaw = formData.get('rules') as string;
    const rules = rulesRaw ? rulesRaw.split('\n').map((r) => r.trim()).filter(Boolean) : [];

    if (editingContest) {
      const updated = contests.map((c) =>
        c.id === editingContest.id
          ? {
              ...c,
              title,
              organizer: organizer || c.organizer,
              category,
              bannerUrl: bannerUrl || c.bannerUrl,
              description,
              startDate: startDate || c.startDate,
              endDate: endDate || c.endDate,
              votePrice,
              isLive,
              slug: slug || c.slug,
              nomineeOnboardingMode,
              allowSelfRegistration: nomineeOnboardingMode !== 'organizer_only',
              rules
            }
          : c
      );
      onUpdateContests(updated);
      showToast(`Updated event "${title}"`);
      setEditingContest(null);
    } else {
      const newC: Contest = {
        id: `contest-${Date.now()}`,
        title,
        organizer: organizer || 'Admin',
        category,
        bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200',
        description,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        isLive,
        votePrice,
        totalVotes: 0,
        categories: ['General'],
        slug: slug || undefined,
        nomineeOnboardingMode,
        allowSelfRegistration: nomineeOnboardingMode !== 'organizer_only',
        rules: rules.length > 0 ? rules : ['Each vote costs GH₵ ' + votePrice.toFixed(2)]
      };
      onUpdateContests([newC, ...contests]);
      showToast(`Created new contest "${title}"`);
      setIsCreatingContest(false);
    }
  };

  // --- HANDLERS FOR NOMINEES ---
  const handleSaveNominee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const code = (formData.get('code') as string).toUpperCase();
    const category = formData.get('category') as string;
    const contestId = (formData.get('contestId') as string) || selectedContestForNewNominee;
    const photoUrl = formData.get('photoUrl') as string;
    const bio = formData.get('bio') as string;
    const votes = parseInt(formData.get('votes') as string, 10) || 0;
    const status = (formData.get('status') as any) || 'approved';

    if (editingNominee) {
      const updated = nominees.map((n) =>
        n.id === editingNominee.id
          ? { ...n, name, code, category, contestId, photoUrl, bio, votes, status }
          : n
      );
      onUpdateNominees(updated);
      showToast(`Updated candidate "${name}" (${code})`);
      setEditingNominee(null);
    } else {
      const newN: Nominee = {
        id: `nom-${Date.now()}`,
        name,
        code,
        category,
        contestId,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
        bio,
        votes,
        status: 'approved'
      };
      onUpdateNominees([newN, ...nominees]);
      showToast(`Added candidate "${name}" (${code})`);
      setIsCreatingNominee(false);
    }
  };

  const handleDeleteNominee = (nomineeId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove candidate "${name}"?`)) {
      onUpdateNominees(nominees.filter((n) => n.id !== nomineeId));
      showToast(`Removed candidate "${name}"`);
    }
  };

  const handleApproveNominee = (nomineeId: string, name: string) => {
    onUpdateNominees(
      nominees.map((n) => (n.id === nomineeId ? { ...n, status: 'approved' } : n))
    );
    showToast(`Approved candidate nomination "${name}"`);
  };

  const handleApplyVoteAdjustment = (addOrSubtract: 'add' | 'subtract') => {
    if (!voteAdjustNominee) return;
    const delta = addOrSubtract === 'add' ? voteAdjustAmount : -voteAdjustAmount;

    onUpdateNominees(
      nominees.map((n) => {
        if (n.id === voteAdjustNominee.id) {
          const newVotes = Math.max(0, n.votes + delta);
          return { ...n, votes: newVotes };
        }
        return n;
      })
    );

    onUpdateContests(
      contests.map((c) => {
        if (c.id === voteAdjustNominee.contestId) {
          const newTotal = Math.max(0, c.totalVotes + delta);
          return { ...c, totalVotes: newTotal };
        }
        return c;
      })
    );

    showToast(`${addOrSubtract === 'add' ? 'Added' : 'Subtracted'} ${voteAdjustAmount} votes for ${voteAdjustNominee.name}`);
    setVoteAdjustNominee(null);
  };

  // --- HANDLERS FOR EVENT TICKETS ---
  const handleSaveEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const organizer = formData.get('organizer') as string;
    const venue = formData.get('venue') as string;
    const endDate = formData.get('endDate') as string;
    const category = formData.get('category') as string;
    const posterUrl = formData.get('posterUrl') as string;
    const regPrice = parseFloat(formData.get('regPrice') as string) || 50;
    const vipPrice = parseFloat(formData.get('vipPrice') as string) || 120;

    const tiers: TicketTier[] = [
      { id: `tier-reg-${Date.now()}`, name: 'Regular Entry Pass', price: regPrice, description: 'Single general admission entry pass', available: 300 },
      { id: `tier-vip-${Date.now()}`, name: 'VIP Access Pass', price: vipPrice, description: 'VIP lounge access + drink', available: 100 }
    ];

    if (editingEvent) {
      const updated = ticketEvents.map((evt) =>
        evt.id === editingEvent.id
          ? { ...evt, title, organizer, venue, endDate, category, posterUrl: posterUrl || evt.posterUrl, priceGHS: regPrice }
          : evt
      );
      onUpdateTicketEvents(updated);
      showToast(`Updated event ticket listing "${title}"`);
      setEditingEvent(null);
    } else {
      const newEvt: TicketEvent = {
        id: `evt-${Date.now()}`,
        title,
        organizer,
        venue,
        endDate: endDate || 'Sat, 15 Oct 2026',
        category: category || 'Concert',
        posterUrl: posterUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
        priceGHS: regPrice,
        ticketTiers: tiers
      };
      onUpdateTicketEvents([newEvt, ...ticketEvents]);
      showToast(`Created new ticket event "${title}"`);
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteEvent = (eventId: string, title: string) => {
    if (window.confirm(`Delete event ticket listing "${title}"?`)) {
      onUpdateTicketEvents(ticketEvents.filter((e) => e.id !== eventId));
      showToast(`Deleted event listing "${title}"`);
    }
  };

  // --- HANDLERS FOR NOMINATION AWARDS ---
  const handleSaveAward = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const organizer = formData.get('organizer') as string;
    const bannerUrl = formData.get('bannerUrl') as string;
    const deadline = formData.get('deadline') as string;
    const description = formData.get('description') as string;
    const status = (formData.get('status') as any) || 'OPEN';
    const categoriesRaw = formData.get('categories') as string;
    const categoriesList = categoriesRaw ? categoriesRaw.split(',').map((c) => c.trim()).filter(Boolean) : ['General Award'];

    if (editingAward) {
      const updated = nominationAwards.map((a) =>
        a.id === editingAward.id
          ? { ...a, title, organizer, bannerUrl, deadline, description, status, categories: categoriesList }
          : a
      );
      onUpdateNominationAwards(updated);
      showToast(`Updated award scheme "${title}"`);
      setEditingAward(null);
    } else {
      const newA: NominationAward = {
        id: `nom-award-${Date.now()}`,
        title,
        organizer,
        bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200',
        deadline: deadline || '30 Sep 2026',
        description,
        categories: categoriesList,
        status
      };
      onUpdateNominationAwards([newA, ...nominationAwards]);
      showToast(`Created award nomination scheme "${title}"`);
      setIsCreatingAward(false);
    }
  };

  const handleDeleteAward = (awardId: string, title: string) => {
    if (window.confirm(`Delete nomination award scheme "${title}"?`)) {
      onUpdateNominationAwards(nominationAwards.filter((a) => a.id !== awardId));
      showToast(`Deleted award scheme "${title}"`);
    }
  };

  // --- HANDLERS FOR ORGANIZERS ---
  const handleSaveOrganizer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const eventTitle = formData.get('eventTitle') as string;
    const isVerified = formData.get('isVerified') === 'true';
    const paidFlatFee = formData.get('paidFlatFee') === 'true';

    if (editingOrganizer) {
      const updated = organizerProfiles.map((p) =>
        p.id === editingOrganizer.id
          ? { ...p, fullName, email, phone, eventTitle, isVerified, paidFlatFee }
          : p
      );
      onUpdateOrganizerProfiles(updated);
      showToast(`Updated organizer "${fullName}"`);
      setEditingOrganizer(null);
    } else {
      const newOrg: OrganizerProfile = {
        id: `org-${Date.now()}`,
        fullName,
        email,
        phone,
        eventTitle,
        paidFlatFee,
        isVerified,
        isBlocked: false,
        registeredAt: new Date().toISOString()
      };
      onUpdateOrganizerProfiles([newOrg, ...organizerProfiles]);
      showToast(`Registered organizer "${fullName}"`);
      setIsCreatingOrganizer(false);
    }
  };

  // --- HANDLERS FOR TRANSACTIONS ---
  const handleUpdateTxStatus = (txId: string, newStatus: 'SUCCESS' | 'PENDING' | 'FAILED') => {
    onUpdateTransactions(
      transactions.map((tx) => (tx.id === txId ? { ...tx, status: newStatus } : tx))
    );
    showToast(`Updated transaction status to ${newStatus}`);
  };

  const handleDeleteTx = (txId: string, ref: string) => {
    if (window.confirm(`Delete transaction record ${ref}?`)) {
      onUpdateTransactions(transactions.filter((tx) => tx.id !== txId));
      showToast(`Deleted transaction ${ref}`);
    }
  };

  const handleSaveManualTx = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const voterName = formData.get('voterName') as string;
    const voterPhone = formData.get('voterPhone') as string;
    const nomineeCodeInput = (formData.get('nomineeCode') as string).toUpperCase();
    const votesCount = parseInt(formData.get('votesCount') as string, 10) || 10;
    const paymentMethod = (formData.get('paymentMethod') as any) || 'momo_mtn';

    const nomineeFound = nominees.find((n) => n.code.toUpperCase() === nomineeCodeInput);
    if (!nomineeFound) {
      alert(`No candidate found with code "${nomineeCodeInput}"`);
      return;
    }

    const parentContest = contests.find((c) => c.id === nomineeFound.contestId);
    const amountPaid = votesCount * (parentContest?.votePrice || 1.5);
    const refCode = `VRG-MANUAL-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: VoteTransaction = {
      id: `tx-${Date.now()}`,
      referenceCode: refCode,
      contestId: nomineeFound.contestId,
      contestTitle: parentContest?.title || 'Contest',
      nomineeId: nomineeFound.id,
      nomineeName: nomineeFound.name,
      nomineeCode: nomineeFound.code,
      category: nomineeFound.category,
      votesCount,
      amountPaid,
      currency: 'GHS',
      voterName,
      voterPhone,
      paymentMethod,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    };

    // Increment votes
    onUpdateNominees(
      nominees.map((n) => (n.id === nomineeFound.id ? { ...n, votes: n.votes + votesCount } : n))
    );
    onUpdateContests(
      contests.map((c) => (c.id === nomineeFound.contestId ? { ...c, totalVotes: c.totalVotes + votesCount } : c))
    );

    onUpdateTransactions([newTx, ...transactions]);

    // Feed
    onUpdateRecentVotes([
      {
        id: `rv-${Date.now()}`,
        voterName,
        nomineeName: nomineeFound.name,
        nomineeCode: nomineeFound.code,
        votesCount,
        timeAgo: 'Just now',
        contestTitle: parentContest?.title || 'Contest'
      },
      ...recentVotes.slice(0, 9)
    ]);

    showToast(`Recorded manual vote of ${votesCount} votes for ${nomineeFound.name}`);
    setIsCreatingManualTx(false);
  };

  // --- HANDLERS FOR TICKER ANNOUNCEMENTS ---
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    onUpdateSiteSettings({
      ...siteSettings,
      tickerAnnouncements: [...siteSettings.tickerAnnouncements, newAnnouncement.trim()]
    });
    setNewAnnouncement('');
    showToast('Added new ticker broadcast message');
  };

  const handleRemoveAnnouncement = (index: number) => {
    const updated = [...siteSettings.tickerAnnouncements];
    updated.splice(index, 1);
    onUpdateSiteSettings({
      ...siteSettings,
      tickerAnnouncements: updated
    });
    showToast('Removed ticker broadcast item');
  };

  // --- HANDLERS FOR SITE SETTINGS ---
  const handleSaveSiteSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const siteName = formData.get('siteName') as string;
    const supportEmail = formData.get('supportEmail') as string;
    const supportPhone = formData.get('supportPhone') as string;
    const headquarters = formData.get('headquarters') as string;
    const platformFeePercent = parseFloat(formData.get('platformFeePercent') as string) || 15;
    const heroTitle = formData.get('heroTitle') as string;
    const heroSubtitle = formData.get('heroSubtitle') as string;

    onUpdateSiteSettings({
      ...siteSettings,
      siteName,
      supportEmail,
      supportPhone,
      headquarters,
      platformFeePercent,
      heroTitle,
      heroSubtitle
    });
    showToast('Saved Site Settings & Hero Configuration!');
  };

  // CSV Export
  const handleExportCSV = (type: 'transactions' | 'contests' | 'nominees' | 'events') => {
    let csvData = '';
    let fileName = `voterightgh_${type}_export_${Date.now()}.csv`;

    if (type === 'transactions') {
      csvData = 'RefCode,Timestamp,VoterName,VoterPhone,Contest,Nominee,Code,Votes,AmountPaid,Gateway,Status\n';
      transactions.forEach((tx) => {
        csvData += `"${tx.referenceCode}","${tx.timestamp}","${tx.voterName}","${tx.voterPhone}","${tx.contestTitle}","${tx.nomineeName}","${tx.nomineeCode}",${tx.votesCount},${tx.amountPaid},"${tx.paymentMethod}","${tx.status}"\n`;
      });
    } else if (type === 'contests') {
      csvData = 'ID,Title,Organizer,Category,Status,VotePrice,TotalVotes\n';
      contests.forEach((c) => {
        csvData += `"${c.id}","${c.title}","${c.organizer}","${c.category}","${c.isLive ? 'ONGOING' : 'CLOSED'}",${c.votePrice},${c.totalVotes}\n`;
      });
    } else if (type === 'nominees') {
      csvData = 'ID,Code,Name,Category,ContestID,Votes,Status\n';
      nominees.forEach((n) => {
        csvData += `"${n.id}","${n.code}","${n.name}","${n.category}","${n.contestId}",${n.votes},"${n.status || 'approved'}"\n`;
      });
    } else {
      csvData = 'ID,Title,Organizer,Venue,EndDate,PriceGHS\n';
      ticketEvents.forEach((evt) => {
        csvData += `"${evt.id}","${evt.title}","${evt.organizer}","${evt.venue}","${evt.endDate}",${evt.priceGHS}\n`;
      });
    }

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvData);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${type} report to CSV`);
  };

  // Filtered views
  const filteredContests = contests.filter((c) => {
    const matchesStatus =
      contestStatusFilter === 'all' ||
      (contestStatusFilter === 'ongoing' && c.isLive) ||
      (contestStatusFilter === 'closed' && !c.isLive);
    const matchesSearch =
      contestSearch === '' ||
      c.title.toLowerCase().includes(contestSearch.toLowerCase()) ||
      c.organizer.toLowerCase().includes(contestSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredNominees = nominees.filter((n) => {
    const matchesContest = selectedContestForNominees === 'all' || n.contestId === selectedContestForNominees;
    const matchesSearch =
      nomineeSearch === '' ||
      n.name.toLowerCase().includes(nomineeSearch.toLowerCase()) ||
      n.code.toLowerCase().includes(nomineeSearch.toLowerCase()) ||
      n.category.toLowerCase().includes(nomineeSearch.toLowerCase());
    return matchesContest && matchesSearch;
  });

  const filteredTransactions = transactions.filter((tx) => {
    if (!txSearch) return true;
    const q = txSearch.toLowerCase();
    return (
      tx.referenceCode.toLowerCase().includes(q) ||
      tx.voterName.toLowerCase().includes(q) ||
      tx.voterPhone.toLowerCase().includes(q) ||
      tx.nomineeName.toLowerCase().includes(q) ||
      tx.contestTitle.toLowerCase().includes(q)
    );
  });

  const filteredEvents = ticketEvents.filter((e) =>
    e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
    e.organizer.toLowerCase().includes(eventSearch.toLowerCase()) ||
    e.venue.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const filteredAwards = nominationAwards.filter((a) =>
    a.title.toLowerCase().includes(awardSearch.toLowerCase()) ||
    a.organizer.toLowerCase().includes(awardSearch.toLowerCase())
  );

  const handleAdminLogout = () => {
    localStorage.removeItem('voteright_admin_session');
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('voterightgh_user');
    window.history.pushState({}, '', '/');
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden animate-in fade-in duration-200">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="absolute top-4 right-4 z-50 bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>FULL SITE ADMIN CONTROL PANEL</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
            Platform Master Key: <strong className="text-amber-400">ADMIN-LEVEL-0</strong>
          </span>

          <button
            onClick={handleAdminLogout}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md shadow-rose-600/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Exit Admin</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 space-y-2 shrink-0 hidden md:block overflow-y-auto">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1">
            System Control Sections
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview & KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Site Info & Hero Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('contests')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'contests'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4" />
              <span>Contests & Voting</span>
            </div>
            <span className="bg-slate-950/40 text-[10px] px-2 py-0.5 rounded-full">{contests.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('nominees')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'nominees'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Candidates & Codes</span>
            </div>
            <div className="flex items-center gap-1">
              {pendingNominees.length > 0 && (
                <span className="bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full">
                  {pendingNominees.length}
                </span>
              )}
              <span className="bg-slate-950/40 text-[10px] px-2 py-0.5 rounded-full">{nominees.length}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Ticket className="w-4 h-4" />
              <span>Event E-Tickets</span>
            </div>
            <span className="bg-slate-950/40 text-[10px] px-2 py-0.5 rounded-full">{ticketEvents.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('nominations')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'nominations'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span>Award Nominations</span>
            </div>
            <span className="bg-slate-950/40 text-[10px] px-2 py-0.5 rounded-full">{nominationAwards.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('organizers')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'organizers'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4" />
              <span>Organizer Moderation</span>
            </div>
            <span className="bg-slate-950/40 text-[10px] px-2 py-0.5 rounded-full">{organizerProfiles.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4" />
              <span>Vote Ledger Transactions</span>
            </div>
            <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full">
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4" />
              <span>Payout Management</span>
            </div>
            <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {payouts.filter((p) => p.status === 'PENDING' || p.status === 'pending').length} Pending
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ticker')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'ticker'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Radio className="w-4 h-4" />
              <span>Ticker Announcements</span>
            </div>
            <span className="bg-sky-400/20 text-sky-300 text-[10px] px-2 py-0.5 rounded-full">
              {siteSettings.tickerAnnouncements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'database'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4" />
              <span>Database & RLS Rules</span>
            </div>
            <span className="bg-purple-400/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full">
              SQL
            </span>
          </button>

          <div className="pt-6 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1">
              Quick CSV Reports
            </div>
            <button
              onClick={() => handleExportCSV('transactions')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors text-left"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" /> Export Votes Ledger
            </button>
            <button
              onClick={() => handleExportCSV('contests')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors text-left"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" /> Export Contests
            </button>
            <button
              onClick={() => handleExportCSV('events')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors text-left"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Export E-Tickets
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Mobile Tab Navigation */}
          <div className="flex md:hidden overflow-x-auto gap-2 pb-2">
            {(['overview', 'settings', 'contests', 'nominees', 'tickets', 'nominations', 'organizers', 'transactions', 'ticker', 'database'] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap capitalize ${
                    activeTab === tab ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    {siteSettings.siteName} Command Center
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Complete management control over all page content, contests, candidates, tickets, awards, organizers, transactions, and site config.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setIsCreatingContest(true);
                      setEditingContest(null);
                    }}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
                  >
                    <Plus className="w-4 h-4" /> New Contest
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingEvent(true);
                      setEditingEvent(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> New Ticket Event
                  </button>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>Vote Revenue Recorded</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {formatPrice(totalRevenueGHS, currency)}
                  </div>
                  <p className="text-[11px] text-slate-500">Gross vote sales processed</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>Total Votes Cast</span>
                    <Vote className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {totalVotesCast.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500">Across {contests.length} competitions</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>Event Tickets Listed</span>
                    <Ticket className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-black text-sky-400 font-mono">
                    {ticketEvents.length}
                  </div>
                  <p className="text-[11px] text-slate-500">Live concert & gala listings</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>System Commission ({siteSettings.platformFeePercent}%)</span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {formatPrice(totalRevenueGHS * (siteSettings.platformFeePercent / 100), currency)}
                  </div>
                  <p className="text-[11px] text-slate-500">Platform maintenance share</p>
                </div>
              </div>

              {/* Active Events & Contests Cards in Overview */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" /> Active Events & Competitions ({contests.length})
                    </h3>
                    <p className="text-xs text-slate-400">Manage event details, pricing, status, or click Edit Event to update.</p>
                  </div>
                  <button
                    onClick={() => { setEditingContest(null); setIsCreatingContest(true); }}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Plus className="w-4 h-4" /> Add New Event
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {contests.map((c) => (
                    <div key={c.id} className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <img src={c.bannerUrl} alt={c.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded uppercase">
                                {c.category}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                {c.isLive ? 'Ongoing' : 'Closed'}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-white line-clamp-1">{c.title}</h4>
                            <p className="text-xs text-slate-400">{c.organizer}</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 font-medium">
                          <div>
                            <span className="text-slate-500 text-[10px] block uppercase font-bold">End Date</span>
                            <span className="text-slate-200 font-mono">{c.endDate || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block uppercase font-bold">Price / Vote</span>
                            <span className="text-amber-400 font-mono font-bold">GH₵ {c.votePrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                        <div className="text-xs text-slate-400 font-bold">
                          <span className="text-white font-mono">{c.totalVotes.toLocaleString()}</span> votes
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditAdminContest(c)}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow transition-all"
                            title="Edit Event"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Event</span>
                          </button>
                          <button
                            onClick={() => handleDeleteContest(c.id, c.title)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Approvals Callout */}
              {pendingNominees.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-3xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/20 text-rose-400 rounded-2xl">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">
                        {pendingNominees.length} Candidate Nomination(s) Pending Approval
                      </h4>
                      <p className="text-xs text-slate-400">
                        Public site visitors submitted nominations for review before appearing on leaderboards.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('nominees')}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer shrink-0"
                  >
                    Review Pending
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. SITE SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" /> General Site Info & Hero Banner Customization
                </h3>
                <p className="text-xs text-slate-400">
                  Manage site title, support phone/email, headquarters address, platform commission, and main hero marketing messaging.
                </p>
              </div>

              <form onSubmit={handleSaveSiteSettings} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Website Brand Name</label>
                    <input
                      type="text"
                      name="siteName"
                      defaultValue={siteSettings.siteName}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Platform Commission Fee (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      name="platformFeePercent"
                      defaultValue={siteSettings.platformFeePercent}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Support Email</label>
                    <input
                      type="email"
                      name="supportEmail"
                      defaultValue={siteSettings.supportEmail}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Support Phone Hotline</label>
                    <input
                      type="text"
                      name="supportPhone"
                      defaultValue={siteSettings.supportPhone}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Headquarters Location</label>
                    <input
                      type="text"
                      name="headquarters"
                      defaultValue={siteSettings.headquarters}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <h4 className="font-extrabold text-sm text-amber-400">Hero Section Messaging</h4>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Hero Main Title Headline</label>
                    <input
                      type="text"
                      name="heroTitle"
                      defaultValue={siteSettings.heroTitle}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Hero Subtitle Paragraph</label>
                    <textarea
                      name="heroSubtitle"
                      rows={2}
                      defaultValue={siteSettings.heroSubtitle}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-6 py-3 rounded-xl cursor-pointer shadow-lg shadow-amber-400/20"
                  >
                    Save Site Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. CONTESTS TAB */}
          {activeTab === 'contests' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => setContestStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                      contestStatusFilter === 'all' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    All ({contests.length})
                  </button>
                  <button
                    onClick={() => setContestStatusFilter('ongoing')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                      contestStatusFilter === 'ongoing' ? 'bg-emerald-400 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Ongoing ({ongoingContests.length})
                  </button>
                  <button
                    onClick={() => setContestStatusFilter('closed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                      contestStatusFilter === 'closed' ? 'bg-slate-700 text-white' : 'text-slate-400'
                    }`}
                  >
                    Closed ({closedContests.length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={contestSearch}
                    onChange={(e) => setContestSearch(e.target.value)}
                    placeholder="Search contest..."
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingContest(null);
                    setIsCreatingContest(true);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Contest
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4">Contest & Organizer</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Vote Price</th>
                        <th className="p-4">Total Votes</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredContests.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={c.bannerUrl} alt={c.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                              <div>
                                <div className="font-extrabold text-white text-sm">{c.title}</div>
                                <div className="text-[11px] text-slate-400">{c.organizer}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 uppercase font-bold text-slate-300">{c.category}</td>
                          <td className="p-4 font-mono font-bold text-amber-400">GH₵ {c.votePrice.toFixed(2)}</td>
                          <td className="p-4 font-mono font-bold text-white">{c.totalVotes.toLocaleString()}</td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleContestLive(c.id)}
                              className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                                c.isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {c.isLive ? 'Ongoing' : 'Closed'}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleContestLive(c.id)}
                                title={c.isLive ? 'Close' : 'Open'}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer"
                              >
                                {c.isLive ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                              </button>
                              <button
                                onClick={() => handleOpenEditAdminContest(c)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                                title="Edit Event"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Event</span>
                              </button>
                              <button
                                onClick={() => handleDeleteContest(c.id, c.title)}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. CANDIDATES & CODES TAB */}
          {activeTab === 'nominees' && (
            <div className="space-y-6">
              {/* Pending Approvals Table if any */}
              {pendingNominees.length > 0 && (
                <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-5 space-y-3">
                  <h3 className="font-extrabold text-sm text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Pending Visitor Candidates ({pendingNominees.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pendingNominees.map((pn) => (
                      <div key={pn.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={pn.photoUrl} alt={pn.name} className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <div className="font-bold text-xs text-white">{pn.name}</div>
                            <div className="text-[10px] text-amber-400 font-mono">{pn.code}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleApproveNominee(pn.id, pn.name)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <select
                    value={selectedContestForNominees}
                    onChange={(e) => setSelectedContestForNominees(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">All Contests ({contests.length})</option>
                    {contests.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>

                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={nomineeSearch}
                      onChange={(e) => setNomineeSearch(e.target.value)}
                      placeholder="Search nominee by name or code..."
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingNominee(null);
                    setIsCreatingNominee(true);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Candidate
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredNominees.map((n) => {
                  const parentContest = contests.find((c) => c.id === n.contestId);
                  return (
                    <div key={n.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative">
                      <div className="flex items-start gap-3">
                        <img src={n.photoUrl} alt={n.name} className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-800" />
                        <div className="flex-1 min-w-0">
                          <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-400/30 inline-block mb-1">
                            {n.code}
                          </span>
                          <h4 className="font-extrabold text-sm text-white truncate">{n.name}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{n.category}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{parentContest?.title || 'Unknown'}</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold">Total Votes:</span>
                        <span className="text-base font-black font-mono text-amber-400">{n.votes.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => setVoteAdjustNominee(n)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] py-1.5 rounded-xl cursor-pointer"
                        >
                          Adjust Votes
                        </button>
                        <button
                          onClick={() => setEditingNominee(n)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNominee(n.id, n.name)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. EVENT TICKETS TAB */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
                <div>
                  <h3 className="text-base font-extrabold text-white">Event E-Tickets Management</h3>
                  <p className="text-xs text-slate-400">Create & manage concert/gala ticket listings and pricing tiers.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Search event title or venue..."
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setIsCreatingEvent(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Event Ticket
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((evt) => (
                  <div key={evt.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4">
                    <img src={evt.posterUrl} alt={evt.title} className="w-24 h-32 rounded-xl object-cover shrink-0 border border-slate-800" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase">
                            {evt.category}
                          </span>
                          <h4 className="font-extrabold text-sm text-white line-clamp-1 mt-1">{evt.title}</h4>
                          <p className="text-xs text-slate-400">{evt.organizer}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingEvent(evt)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.title)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 space-y-1">
                        <div>📍 {evt.venue}</div>
                        <div>📅 {evt.endDate}</div>
                        <div className="font-mono text-amber-400 font-bold">Starts at GH₵ {evt.priceGHS.toFixed(2)}</div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        {evt.ticketTiers.length} Pricing Tier(s) Configured
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. AWARD NOMINATIONS TAB */}
          {activeTab === 'nominations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
                <div>
                  <h3 className="text-base font-extrabold text-white">Award Nomination Schemes</h3>
                  <p className="text-xs text-slate-400">Manage award schemes open for public candidate entries.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={awardSearch}
                      onChange={(e) => setAwardSearch(e.target.value)}
                      placeholder="Search award scheme..."
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setEditingAward(null);
                      setIsCreatingAward(true);
                    }}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Award Scheme
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAwards.map((a) => (
                  <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={a.bannerUrl} alt={a.title} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white line-clamp-1">{a.title}</h4>
                          <p className="text-xs text-slate-400">{a.organizer}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          a.status === 'OPEN'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">{a.description}</p>
                    <div className="text-[11px] text-amber-400 font-mono font-bold">Deadline: {a.deadline}</div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 font-mono">{a.categories.length} Categories</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingAward(a)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAward(a.id, a.title)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. ORGANIZER ACCOUNTS TAB */}
          {activeTab === 'organizers' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" /> Organizer Allowlist & Account Management
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Approve Gmail/email addresses to grant dashboard access at <span className="font-mono text-amber-300">/organizer</span>. Only approved emails can access organizer tools.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingOrganizer(null);
                    setIsCreatingOrganizer(true);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Register Organizer Profile
                </button>
              </div>

              {/* Quick Allowlist Addition Box */}
              <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4" /> Add Organizer Gmail / Email to Approved Allowlist
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!allowlistEmail.trim()) return;
                    const cleanEmail = allowlistEmail.trim().toLowerCase();
                    const existing = organizerProfiles.find((o) => o.email.toLowerCase() === cleanEmail);

                    let activeOrg: OrganizerProfile;

                    if (existing) {
                      activeOrg = { ...existing, isVerified: true, isBlocked: false, status: 'approved' };
                      onUpdateOrganizerProfiles(
                        organizerProfiles.map((o) =>
                          o.email.toLowerCase() === cleanEmail ? activeOrg : o
                        )
                      );
                      showToast(`Approved ${cleanEmail} for /organizer access!`);
                    } else {
                      activeOrg = {
                        id: `org-${Date.now()}`,
                        email: cleanEmail,
                        fullName: cleanEmail.split('@')[0].toUpperCase(),
                        phone: '0240000000',
                        eventTitle: 'New Approved Organizer Event',
                        paidFlatFee: true,
                        isVerified: true,
                        isBlocked: false,
                        status: 'approved',
                        password: 'organizer123',
                      };
                      onUpdateOrganizerProfiles([activeOrg, ...organizerProfiles]);
                      showToast(`Added & Approved ${cleanEmail} on Allowlist!`);
                    }

                    // Sync auth store and elevate role to organizer
                    try {
                      const usersAuth = JSON.parse(localStorage.getItem('voterightgh_users_auth') || '[]');
                      const existingAuthIndex = usersAuth.findIndex(
                        (u: any) => u.email && u.email.toLowerCase() === cleanEmail
                      );
                      const authRecord = {
                        id: activeOrg.id,
                        email: activeOrg.email,
                        fullName: activeOrg.fullName,
                        phone: activeOrg.phone,
                        role: 'organizer',
                        status: 'approved',
                        isVerified: true,
                        password: activeOrg.password || 'organizer123',
                      };
                      if (existingAuthIndex >= 0) {
                        usersAuth[existingAuthIndex] = {
                          ...usersAuth[existingAuthIndex],
                          ...authRecord,
                          role: 'organizer',
                        };
                      } else {
                        usersAuth.push(authRecord);
                      }
                      localStorage.setItem('voterightgh_users_auth', JSON.stringify(usersAuth));
                    } catch (err) {
                      console.error('Error syncing voterightgh_users_auth in AdminPortal allowlist:', err);
                    }

                    setAllowlistEmail('');
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="email"
                    required
                    value={allowlistEmail}
                    onChange={(e) => setAllowlistEmail(e.target.value)}
                    placeholder="Enter organizer Gmail address (e.g. organizer@gmail.com)"
                    className="flex-1 bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer shrink-0 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Add to Allowlist</span>
                  </button>
                </form>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4">Organizer Full Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Event Title</th>
                        <th className="p-4">GHS 100 Fee</th>
                        <th className="p-4">Account Status</th>
                        <th className="p-4 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {organizerProfiles.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-white text-sm">{p.fullName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{p.phone}</div>
                          </td>
                          <td className="p-4 font-mono font-medium text-amber-300">{p.email}</td>
                          <td className="p-4 font-semibold text-slate-200">{p.eventTitle || 'Event'}</td>
                          <td className="p-4">
                            <span className="bg-emerald-500/20 text-emerald-400 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                              Paid GHS 100.00
                            </span>
                          </td>
                          <td className="p-4">
                            {p.isBlocked ? (
                              <span className="bg-rose-500/20 text-rose-400 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-rose-500/30">
                                Blocked
                              </span>
                            ) : p.isVerified ? (
                              <span className="bg-emerald-500/20 text-emerald-400 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                Verified
                              </span>
                            ) : (
                              <span className="bg-amber-500/20 text-amber-300 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/30">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  onUpdateOrganizerProfiles(
                                    organizerProfiles.map((org) =>
                                      org.id === p.id ? { ...org, isVerified: true, isBlocked: false } : org
                                    )
                                  );
                                  showToast(`Verified ${p.email}`);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Verify
                              </button>
                              <button
                                onClick={() => {
                                  onUpdateOrganizerProfiles(
                                    organizerProfiles.map((org) =>
                                      org.id === p.id ? { ...org, isVerified: false, isBlocked: true } : org
                                    )
                                  );
                                  showToast(`Blocked ${p.email}`);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <UserX className="w-3.5 h-3.5" /> Block
                              </button>
                              <button
                                onClick={() => setEditingOrganizer(p)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. VOTE LEDGER TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
                <div>
                  <h3 className="text-base font-extrabold text-white">Live Cryptographic Vote Transactions Ledger</h3>
                  <p className="text-xs text-slate-400">View, update status, or manually record offline vote receipts.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      placeholder="Filter ref code or phone..."
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={() => setIsCreatingManualTx(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Record Manual Vote
                  </button>

                  <button
                    onClick={() => handleExportCSV('transactions')}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4">Ref Code</th>
                        <th className="p-4">Voter Name & Phone</th>
                        <th className="p-4">Candidate & Contest</th>
                        <th className="p-4">Votes</th>
                        <th className="p-4">Amount Paid</th>
                        <th className="p-4">Gateway</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                            No vote transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-mono font-bold text-amber-400">{tx.referenceCode}</td>
                            <td className="p-4">
                              <div className="font-extrabold text-white">{tx.voterName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{tx.voterPhone}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-extrabold text-slate-200">
                                {tx.nomineeName} <span className="text-amber-400 font-mono">({tx.nomineeCode})</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{tx.contestTitle}</div>
                            </td>
                            <td className="p-4 font-mono font-black text-white">{tx.votesCount}</td>
                            <td className="p-4 font-mono font-black text-emerald-400">
                              GH₵ {tx.amountPaid.toFixed(2)}
                            </td>
                            <td className="p-4 font-mono uppercase text-[10px] text-slate-300">
                              {tx.paymentMethod.replace('momo_', '')}
                            </td>
                            <td className="p-4">
                              <select
                                value={tx.status}
                                onChange={(e) => handleUpdateTxStatus(tx.id, e.target.value as any)}
                                className={`text-[10px] font-black px-2 py-1 rounded border bg-slate-950 font-mono cursor-pointer ${
                                  tx.status === 'SUCCESS' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'
                                }`}
                              >
                                <option value="SUCCESS">SUCCESS</option>
                                <option value="PENDING">PENDING</option>
                                <option value="FAILED">FAILED</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteTx(tx.id, tx.referenceCode)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAYOUT MANAGEMENT TAB */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Main Paystack Platform Account</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">Organizer Payout & Disbursement Center</h3>
                  <p className="text-xs text-slate-400">
                    Review requested withdrawals from organizers and trigger manual or Paystack MoMo/Bank disbursements from the central escrow account.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pending Requests</span>
                    <span className="text-lg font-black text-amber-400">
                      GHS {payouts.filter(p => p.status === 'PENDING' || p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-emerald-500/30 px-4 py-2 rounded-2xl text-right">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase">Total Disbursed</span>
                    <span className="text-lg font-black text-emerald-400">
                      GHS {payouts.filter(p => p.status === 'APPROVED' || p.status === 'Paid' || p.status === 'DISBURSED').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payout Requests Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="font-extrabold text-white text-sm">Payout Requests ({payouts.length})</h4>
                  <span className="text-xs text-slate-400 font-mono">Central Paystack Escrow</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-4">Organizer / Event</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Payment Method / Destination</th>
                        <th className="p-4">Account Name</th>
                        <th className="p-4">Submitted</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {payouts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No payout requests found.
                          </td>
                        </tr>
                      ) : (
                        payouts.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-4">
                              <div className="font-extrabold text-white">{req.organizerName || req.organizer || 'Organizer'}</div>
                              <div className="text-[10px] text-amber-400 font-mono mt-0.5">{req.eventTitle || 'VoteRight Event'}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-mono text-sm font-black text-emerald-400">
                                GHS {req.amount?.toLocaleString()}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-200">{req.paymentMethod || 'Mobile Money'}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {req.momoNetwork || req.bankOrNetworkName || 'MTN MoMo'} - <span className="text-amber-300 font-bold">{req.accountNumber}</span>
                              </div>
                            </td>
                            <td className="p-4 font-bold text-slate-300">{req.accountName || req.organizerName || '—'}</td>
                            <td className="p-4 text-slate-400 text-[11px] font-mono">
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="p-4 text-center">
                              {req.status === 'APPROVED' || req.status === 'Paid' || req.status === 'DISBURSED' ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                                  <Check className="w-3 h-3" /> Approved / Disbursed
                                </span>
                              ) : req.status === 'REJECTED' ? (
                                <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                                  <X className="w-3 h-3" /> Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase animate-pulse">
                                  <Clock className="w-3 h-3" /> Pending Review
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {(req.status === 'PENDING' || req.status === 'pending') ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleApprovePayoutInPortal(req.id, 'APPROVED')}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve & Disburse
                                  </button>
                                  <button
                                    onClick={() => handleApprovePayoutInPortal(req.id, 'REJECTED')}
                                    className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-extrabold text-[11px] px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <X className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-500">
                                  {req.transferCode || 'Completed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 9. TICKER ANNOUNCEMENTS TAB */}
          {activeTab === 'ticker' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-sky-400" /> Ticker Broadcast Announcements & Activity Feeds
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Add custom news ticker broadcasts that scroll across the top header of all pages.
                  </p>
                </div>

                <form onSubmit={handleAddAnnouncement} className="flex gap-3">
                  <input
                    type="text"
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="Enter broadcast text e.g. '🔥 Miss Good News 2026 voting ends tonight!'"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer shrink-0"
                  >
                    Add Broadcast
                  </button>
                </form>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
                <h4 className="font-extrabold text-sm text-white">Active Ticker Broadcast Items</h4>

                <div className="space-y-2">
                  {siteSettings.tickerAnnouncements.map((ann, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-200 font-medium">{ann}</span>
                      <button
                        onClick={() => handleRemoveAnnouncement(idx)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 10. DATABASE & SUPABASE RLS SCHEMA TAB */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-purple-400" /> PostgreSQL & Supabase RLS Security Schema
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Full database tables blueprint, atomic vote count trigger functions, and Row-Level Security (RLS) policies.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`
-- VoteRight GH PostgreSQL Schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'organizer',
  is_verified BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  cost_per_vote NUMERIC(10,2) DEFAULT 1.50,
  status TEXT DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS public.nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES public.competitions(id),
  category_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  photo_url TEXT NOT NULL,
  status TEXT DEFAULT 'approved',
  vote_count INT DEFAULT 0
);
                      `);
                      showToast('Copied PostgreSQL Schema SQL snippet!');
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Copy SQL Schema Snippet
                  </button>
                </div>
              </div>

              {/* Schema Table Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-amber-400">public.profiles</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                      Users & Organizers
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Stores authenticated email accounts, organizer role flags, verification status, and flat fee payment state.
                  </p>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>• id: UUID (Primary Key)</div>
                    <div>• email: TEXT (Unique)</div>
                    <div>• role: TEXT ('admin' | 'organizer' | 'user')</div>
                    <div>• is_verified: BOOLEAN</div>
                    <div>• is_blocked: BOOLEAN</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-blue-400">public.competitions</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                      Pageants & Awards
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Contains award events linked strictly to <span className="font-mono text-amber-300">organizer_id</span> with status toggles.
                  </p>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>• id: UUID (Primary Key)</div>
                    <div>• organizer_id: UUID (FK profiles.id)</div>
                    <div>• title: TEXT</div>
                    <div>• cost_per_vote: NUMERIC(10,2)</div>
                    <div>• status: TEXT ('open' | 'closed')</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">public.votes</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                      Ledger & Payment Logs
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Stores immutable MoMo payment transaction references. Client direct writes are blocked by RLS policies.
                  </p>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>• nominee_id: UUID (FK nominees.id)</div>
                    <div>• votes_count: INT</div>
                    <div>• amount_paid: NUMERIC(10,2)</div>
                    <div>• payment_reference: VARCHAR(100)</div>
                    <div>• channel: VARCHAR(50)</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-purple-400 font-extrabold">Atomic Vote Trigger</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono px-2 py-0.5 rounded">
                      Security Definer
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Automatically increments candidate vote totals when a successful vote record is inserted into the ledger.
                  </p>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-purple-300">
                    <div>CREATE TRIGGER trigger_on_vote_payment_success</div>
                    <div>AFTER INSERT ON public.votes</div>
                    <div>EXECUTE FUNCTION increment_nominee_vote_count();</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- MODALS --- */}

      {/* MODAL: CREATE / EDIT CONTEST */}
      {(isCreatingContest || editingContest) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-4 my-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-lg text-white">
                  {editingContest ? `Edit Event: ${editingContest.title}` : 'Create New Event / Contest'}
                </h3>
              </div>
              <button onClick={() => { setIsCreatingContest(false); setEditingContest(null); }} className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContest} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Event Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingContest?.title || ''}
                    placeholder="e.g. MISS HERITAGE PAGEANT 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Organizer Name</label>
                  <input
                    type="text"
                    name="organizer"
                    required
                    defaultValue={editingContest?.organizer || ''}
                    placeholder="e.g. Empire Entertainment"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Category Type</label>
                  <select
                    name="category"
                    defaultValue={editingContest?.category || 'pageant'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="pageant">Beauty Pageant</option>
                    <option value="award">Excellence Award</option>
                    <option value="election">Student Election</option>
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
                    defaultValue={editingContest?.votePrice || 1.50}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-amber-400 focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Voting Status</label>
                  <select
                    name="isLive"
                    defaultValue={editingContest ? (editingContest.isLive ? 'true' : 'false') : 'true'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 font-bold"
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
                    defaultValue={editingContest?.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    defaultValue={editingContest?.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Custom URL Slug (Optional)</label>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={editingContest?.slug || ''}
                    placeholder="e.g. miss-heritage-2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nominee Registration Mode</label>
                  <select
                    name="nomineeOnboardingMode"
                    defaultValue={editingContest?.nomineeOnboardingMode || 'hybrid'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="hybrid">Hybrid (Public Self-Reg + Organizer Upload)</option>
                    <option value="public_self_register">Public Self-Registration Only</option>
                    <option value="organizer_only">Organizer Upload Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Banner / Flyer Image URL or Upload</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    name="bannerUrl"
                    value={adminModalBannerUrl}
                    onChange={(e) => setAdminModalBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
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
                        if (file) handleAdminFileUpload(file);
                      }}
                    />
                  </label>
                </div>

                {adminModalBannerUrl && (
                  <div className="mt-2 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                    <img src={adminModalBannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingContest?.description || ''}
                  placeholder="Contest description..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Rules & Regulations (One rule per line)</label>
                <textarea
                  name="rules"
                  rows={2}
                  defaultValue={editingContest?.rules ? editingContest.rules.join('\n') : ''}
                  placeholder="Rule 1...&#10;Rule 2..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsCreatingContest(false); setEditingContest(null); }}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingContest ? 'Save Changes' : 'Create Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT NOMINEE */}
      {(isCreatingNominee || editingNominee) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 my-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-white">
                {editingNominee ? 'Edit Candidate Info' : 'Add New Candidate'}
              </h3>
              <button onClick={() => { setIsCreatingNominee(false); setEditingNominee(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNominee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Candidate Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingNominee?.name || ''}
                    placeholder="e.g. Akosua Mansah"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Voting Code</span>
                    {!editingNominee && (
                      <span className="text-[10px] text-amber-400 font-normal">
                        Sequential Order Enabled
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    defaultValue={
                      editingNominee?.code ||
                      getNextNomineeCode(
                        nominees,
                        contests.find((c) => c.id === selectedContestForNewNominee)
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Assign to Contest</label>
                  <select
                    name="contestId"
                    defaultValue={editingNominee?.contestId || selectedContestForNewNominee}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    {contests.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Award / Category</label>
                  <input
                    type="text"
                    name="category"
                    required
                    defaultValue={editingNominee?.category || 'General Category'}
                    placeholder="e.g. Best Vocalist"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Photo URL</label>
                <input
                  type="url"
                  name="photoUrl"
                  defaultValue={editingNominee?.photoUrl || ''}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Initial Vote Count</label>
                  <input
                    type="number"
                    name="votes"
                    defaultValue={editingNominee?.votes || 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Approval Status</label>
                  <select
                    name="status"
                    defaultValue={editingNominee?.status || 'approved'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Short Bio</label>
                <textarea
                  name="bio"
                  rows={2}
                  defaultValue={editingNominee?.bio || ''}
                  placeholder="Candidate bio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsCreatingNominee(false); setEditingNominee(null); }}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT EVENT TICKET */}
      {(isCreatingEvent || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 my-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-white">
                {editingEvent ? 'Edit Event Ticket Listing' : 'Add New Event E-Ticket'}
              </h3>
              <button onClick={() => { setIsCreatingEvent(false); setEditingEvent(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingEvent?.title || ''}
                  placeholder="e.g. Gen Z Concert 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Organizer</label>
                  <input
                    type="text"
                    name="organizer"
                    required
                    defaultValue={editingEvent?.organizer || ''}
                    placeholder="e.g. Vibe Tribe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    required
                    defaultValue={editingEvent?.category || 'Concert & Party'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Venue Location</label>
                  <input
                    type="text"
                    name="venue"
                    required
                    defaultValue={editingEvent?.venue || ''}
                    placeholder="e.g. Street Star Park, Adenta"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Event Date</label>
                  <input
                    type="text"
                    name="endDate"
                    required
                    defaultValue={editingEvent?.endDate || 'Sat, 05 Sep 2026'}
                    placeholder="e.g. Sat, 05 Sep 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Poster Image URL</label>
                <input
                  type="url"
                  name="posterUrl"
                  defaultValue={editingEvent?.posterUrl || ''}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Regular Ticket Price (GH₵)</label>
                  <input
                    type="number"
                    name="regPrice"
                    defaultValue={editingEvent?.priceGHS || 50}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">VIP Ticket Price (GH₵)</label>
                  <input
                    type="number"
                    name="vipPrice"
                    defaultValue={120}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsCreatingEvent(false); setEditingEvent(null); }}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Save Event Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT AWARD SCHEME */}
      {(isCreatingAward || editingAward) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 my-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-white">
                {editingAward ? 'Edit Award Scheme' : 'Add Award Scheme for Nominations'}
              </h3>
              <button onClick={() => { setIsCreatingAward(false); setEditingAward(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAward} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Award Scheme Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingAward?.title || ''}
                  placeholder="e.g. ADGES Excellence Awards 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Organizer</label>
                  <input
                    type="text"
                    name="organizer"
                    required
                    defaultValue={editingAward?.organizer || ''}
                    placeholder="e.g. Society Guild"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Deadline Date</label>
                  <input
                    type="text"
                    name="deadline"
                    required
                    defaultValue={editingAward?.deadline || '30 Sep 2026'}
                    placeholder="e.g. 30 Sep 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Banner Image URL</label>
                <input
                  type="url"
                  name="bannerUrl"
                  defaultValue={editingAward?.bannerUrl || ''}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Award Categories (Comma-separated)</label>
                <input
                  type="text"
                  name="categories"
                  defaultValue={editingAward?.categories ? editingAward.categories.join(', ') : ''}
                  placeholder="Young CEO, Innovation Pioneer, Scholar of the Year"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingAward?.status || 'OPEN'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 font-bold"
                  >
                    <option value="OPEN">OPEN for Nominations</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingAward?.description || ''}
                  placeholder="Award description..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsCreatingAward(false); setEditingAward(null); }}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Save Award Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT ORGANIZER */}
      {(isCreatingOrganizer || editingOrganizer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 my-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-white">
                {editingOrganizer ? 'Edit Organizer Account' : 'Register Organizer Account'}
              </h3>
              <button onClick={() => { setIsCreatingOrganizer(false); setEditingOrganizer(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrganizer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Organizer / Brand Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  defaultValue={editingOrganizer?.fullName || ''}
                  placeholder="e.g. Ghana Media Board"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={editingOrganizer?.email || ''}
                    placeholder="organizer@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    defaultValue={editingOrganizer?.phone || ''}
                    placeholder="0244998877"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  name="eventTitle"
                  defaultValue={editingOrganizer?.eventTitle || ''}
                  placeholder="e.g. MISS CAMPUS GHANA 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">GHS 100 Setup Fee</label>
                  <select
                    name="paidFlatFee"
                    defaultValue={editingOrganizer ? (editingOrganizer.paidFlatFee ? 'true' : 'false') : 'true'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="true">Paid GHS 100.00</option>
                    <option value="false">Unpaid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Verification Status</label>
                  <select
                    name="isVerified"
                    defaultValue={editingOrganizer ? (editingOrganizer.isVerified ? 'true' : 'false') : 'true'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="true">Verified Active</option>
                    <option value="false">Pending Verification</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsCreatingOrganizer(false); setEditingOrganizer(null); }}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Save Organizer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL VOTE ENTRY */}
      {isCreatingManualTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 my-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white">Record Offline / Manual Vote Payment</h3>
              <button onClick={() => setIsCreatingManualTx(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualTx} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Candidate Code (e.g. VRG-101)</label>
                <input
                  type="text"
                  name="nomineeCode"
                  required
                  placeholder="VRG-101"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-amber-400 font-mono font-bold text-sm uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Voter Name</label>
                  <input
                    type="text"
                    name="voterName"
                    required
                    placeholder="Kwame Mensah"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Voter Phone</label>
                  <input
                    type="text"
                    name="voterPhone"
                    required
                    placeholder="0244123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Number of Votes</label>
                  <input
                    type="number"
                    name="votesCount"
                    required
                    defaultValue={20}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Payment Gateway</label>
                  <select
                    name="paymentMethod"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="momo_mtn">MTN MoMo</option>
                    <option value="momo_telecel">Telecel Cash</option>
                    <option value="momo_airteltigo">AT Money</option>
                    <option value="card">Bank Card / Offline Cash</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingManualTx(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Record & Add Votes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VOTE ADJUSTMENT OVERRIDE */}
      {voteAdjustNominee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white">
                Override Vote Tally: {voteAdjustNominee.name}
              </h3>
              <button onClick={() => setVoteAdjustNominee(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 text-center">
              <span className="text-xs text-slate-400 font-bold">Current Recorded Votes</span>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {voteAdjustNominee.votes.toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Adjustment Amount</label>
              <input
                type="number"
                value={voteAdjustAmount}
                onChange={(e) => setVoteAdjustAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 text-amber-400 font-mono font-extrabold text-lg text-center rounded-2xl py-3 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleApplyVoteAdjustment('subtract')}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-black text-xs py-3 rounded-2xl cursor-pointer"
              >
                Subtract -{voteAdjustAmount}
              </button>
              <button
                onClick={() => handleApplyVoteAdjustment('add')}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs py-3 rounded-2xl cursor-pointer shadow-lg shadow-emerald-400/20"
              >
                Add +{voteAdjustAmount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
