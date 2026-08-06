import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, XCircle, ToggleLeft, ToggleRight, Plus, 
  DollarSign, Users, Calendar, AlertTriangle, Send, Search, Clock,
  UserCheck, ShieldCheck, Mail, Phone, Lock, Building2, UserPlus,
  Trash2, ShieldAlert, CheckCircle2, AlertCircle, BarChart3, 
  Receipt, MessageSquare, Flag, TrendingUp, ShieldX
} from 'lucide-react';
import { OrganizerProfile, Contest } from '../types';

export interface AdminPageProps {
  organizers?: OrganizerProfile[];
  isManualAddOrganizer?: boolean;
  setIsManualAddOrganizer?: (open: boolean) => void;
  handleManualCreateOrganizer?: (data: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    agency?: string;
    isVerified?: boolean;
    status?: 'pending' | 'approved' | 'rejected';
    eventTitle?: string;
  }) => { success: boolean; message: string };
  onUpdateOrganizers?: (organizers: OrganizerProfile[]) => void;
  contests?: Contest[];
  onUpdateContests?: (contests: Contest[]) => void;
}

// --- MOCK INITIAL DATA FALLBACKS ---
const initialEvents = [
  { id: '1', title: 'Ghana Music Awards UK - Nominees', organizer: 'Creative Arts GH', isOngoing: true, totalVotes: 14520, votePrice: 1, revenue: 14520, endDate: '2026-12-31T23:59' },
  { id: '2', title: 'SRC Executive Elections 2026', organizer: 'UG Campus Council', isOngoing: false, totalVotes: 8900, votePrice: 1, revenue: 8900, endDate: '2026-08-01T18:00' },
];

const initialOrganizersFallback: OrganizerProfile[] = [
  { 
    id: 'org-1', 
    email: 'organizer@gmail.com', 
    fullName: 'Ghana Media & Event Board', 
    phone: '0244998877', 
    agency: 'Ghana Media & Event Board',
    eventTitle: 'MISS CAMPUS GHANA 2026',
    paidFlatFee: true,
    isVerified: true,
    isBlocked: false,
    status: 'approved',
    registeredAt: '2026-08-01'
  },
  { 
    id: 'org-2', 
    email: 'apexevents@gmail.com', 
    fullName: 'Apex Events Ltd', 
    phone: '0551122334', 
    agency: 'Apex Events Ltd',
    eventTitle: 'National Music Excellence Awards 2026',
    paidFlatFee: true,
    isVerified: false,
    isBlocked: false,
    status: 'pending',
    registeredAt: '2026-08-04'
  },
];

const initialPayouts = [
  { id: 'pay-1', userId: 'org-1', organizerName: 'UG Campus Council', eventTitle: 'SRC Executive Elections 2026', amount: 8455, paymentMethod: 'Mobile Money', momoNetwork: 'MTN MoMo', accountNumber: '0241112233', accountName: 'UG Campus Election Board', status: 'PENDING', createdAt: '2026-08-04T12:00:00Z' },
];

const initialTransactions = [
  { id: 'tx-101', contestTitle: 'Ghana Music Awards UK', nominee: 'Sarkodie (Best Rapper)', votes: 50, amount: 50, channel: 'MTN MoMo', phone: '024****123', status: 'SUCCESS', timestamp: '2026-08-06T10:30:00Z' },
  { id: 'tx-102', contestTitle: 'SRC Executive Elections 2026', nominee: 'Yaw Boakye (President)', votes: 20, amount: 20, channel: 'Telecel Cash', phone: '050****889', status: 'SUCCESS', timestamp: '2026-08-06T11:15:00Z' },
];

const initialContestants = [
  { id: 'con-1', eventId: '1', eventTitle: 'Ghana Music Awards UK', name: 'Sarkodie', category: 'Artist of the Year', votes: 5400, flagged: false },
  { id: 'con-2', eventId: '1', eventTitle: 'Ghana Music Awards UK', name: 'Black Sherif', category: 'Artist of the Year', votes: 4800, flagged: false },
  { id: 'con-3', eventId: '2', eventTitle: 'SRC Executive Elections 2026', name: 'Controversial Candidate X', category: 'Presidential', votes: 120, flagged: true },
];

export default function AdminPage({
  organizers: propsOrganizers,
  isManualAddOrganizer: propsIsManualAdd,
  setIsManualAddOrganizer: propsSetIsManualAdd,
  handleManualCreateOrganizer: propsHandleManualCreate,
  onUpdateOrganizers,
  contests: propsContests,
  onUpdateContests,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'organizers' | 'events' | 'transactions' | 'contestants' | 'payouts' | 'gateway' | 'growth'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Local Organizers State with Prop Synchronization
  const [localOrganizers, setLocalOrganizers] = useState<OrganizerProfile[]>(() => {
    if (propsOrganizers && propsOrganizers.length > 0) return propsOrganizers;
    const saved = localStorage.getItem('voterightgh_organizer_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing organizer profiles', e);
      }
    }
    return initialOrganizersFallback;
  });

  useEffect(() => {
    if (propsOrganizers) {
      setLocalOrganizers(propsOrganizers);
    }
  }, [propsOrganizers]);

  const updateOrganizersList = (updated: OrganizerProfile[]) => {
    setLocalOrganizers(updated);
    if (onUpdateOrganizers) {
      onUpdateOrganizers(updated);
    }
    localStorage.setItem('voterightgh_organizer_profiles', JSON.stringify(updated));
  };

  // Local Events State
  const [events, setEvents] = useState<any[]>(() => {
    if (propsContests && propsContests.length > 0) {
      return propsContests.map(c => ({
        id: c.id,
        title: c.title,
        organizer: c.organizer,
        isOngoing: c.isLive,
        totalVotes: c.totalVotes,
        votePrice: c.votePrice ?? 1,
        revenue: c.totalVotes * (c.votePrice ?? 1),
        endDate: c.endDate
      }));
    }
    const saved = localStorage.getItem('voterightgh_contests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => ({
            id: c.id,
            title: c.title,
            organizer: c.organizer,
            isOngoing: c.isLive ?? true,
            totalVotes: c.totalVotes ?? 0,
            votePrice: c.votePrice ?? 1,
            revenue: (c.totalVotes ?? 0) * (c.votePrice ?? 1),
            endDate: c.endDate || ''
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialEvents;
  });

  // Transactions Audit Trail State
  const [transactions, setTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem('voterightgh_transactions_audit');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialTransactions;
  });

  // Contestants Moderation State
  const [contestants, setContestants] = useState<any[]>(() => {
    const saved = localStorage.getItem('voterightgh_admin_contestants');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialContestants;
  });

  // Payouts State
  const [payouts, setPayouts] = useState<any[]>(() => {
    const saved = localStorage.getItem('voterightgh_payout_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialPayouts;
  });

  // SMS Gateway Settings State
  const [smsBalance, setSmsBalance] = useState(14250);
  const [smsGatewayProvider, setSmsGatewayProvider] = useState('Hubtel Ghana API');
  const [autoSmsReceipts, setAutoSmsReceipts] = useState(true);

  // Modal Control for Manual Add Organizer
  const [internalShowManualAdd, setInternalShowManualAdd] = useState(false);
  const showManualAddModal = propsIsManualAdd !== undefined ? propsIsManualAdd : internalShowManualAdd;

  const setShowManualAddModal = (open: boolean) => {
    if (propsSetIsManualAdd) {
      propsSetIsManualAdd(open);
    }
    setInternalShowManualAdd(open);
  };

  // Form State for Manual Add Organizer
  const [manualFullName, setManualFullName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAgency, setManualAgency] = useState('');
  const [manualPassword, setManualPassword] = useState('organizer123');
  const [manualEventTitle, setManualEventTitle] = useState('');
  const [manualStatus, setManualStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [manualIsVerified, setManualIsVerified] = useState(true);
  const [manualError, setManualError] = useState<string | null>(null);

  // Growth / Settings
  const [platformFee, setPlatformFee] = useState<number>(7.5);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState('Welcome to VoteRight GH! Secure and fast Mobile Money voting.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync Payouts & Transactions from localStorage
  useEffect(() => {
    const syncLocalStorage = () => {
      const savedPayouts = localStorage.getItem('voterightgh_payout_requests');
      if (savedPayouts) {
        try {
          const parsed = JSON.parse(savedPayouts);
          if (Array.isArray(parsed)) setPayouts(parsed);
        } catch (e) {}
      }
      const savedTx = localStorage.getItem('voterightgh_transactions_audit');
      if (savedTx) {
        try {
          const parsed = JSON.parse(savedTx);
          if (Array.isArray(parsed)) setTransactions(parsed);
        } catch (e) {}
      }
    };
    syncLocalStorage();
    window.addEventListener('storage', syncLocalStorage);
    return () => window.removeEventListener('storage', syncLocalStorage);
  }, []);

  // Sync Expired Events
  useEffect(() => {
    const checkExpiredEvents = () => {
      const now = new Date();
      setEvents(prevEvents =>
        prevEvents.map(ev => {
          if (ev.isOngoing && ev.endDate && new Date(ev.endDate) <= now) {
            return { ...ev, isOngoing: false };
          }
          return ev;
        })
      );
    };

    checkExpiredEvents();
    const interval = setInterval(checkExpiredEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Event Status Toggle
  const toggleVotingStatus = (eventId: string) => {
    const updatedEvents = events.map(ev => ev.id === eventId ? { ...ev, isOngoing: !ev.isOngoing } : ev);
    setEvents(updatedEvents);

    if (propsContests && onUpdateContests) {
      const updatedContests = propsContests.map(c => c.id === eventId ? { ...c, isLive: !c.isLive } : c);
      onUpdateContests(updatedContests);
    }
    showToast('⚡ Event voting status updated!');
  };

  // Handle Event Deletion
  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event? It will be permanently removed from the homepage and admin lists.")) {
      const updatedEvents = events.filter(ev => ev.id !== eventId);
      setEvents(updatedEvents);

      if (propsContests && onUpdateContests) {
        const updatedContests = propsContests.filter(c => c.id !== eventId);
        onUpdateContests(updatedContests);
      }

      localStorage.setItem('voterightgh_contests', JSON.stringify(updatedEvents));
      showToast('🗑️ Event successfully deleted and removed from homepage.');
    }
  };

  // Handle Contestant Moderation Actions
  const handleToggleFlagContestant = (contestantId: string) => {
    const updated = contestants.map(c => c.id === contestantId ? { ...c, flagged: !c.flagged } : c);
    setContestants(updated);
    localStorage.setItem('voterightgh_admin_contestants', JSON.stringify(updated));
    showToast('⚠️ Contestant flag status updated.');
  };

  const handleDeleteContestant = (contestantId: string) => {
    if (window.confirm("Are you sure you want to disqualify and remove this nominee?")) {
      const updated = contestants.filter(c => c.id !== contestantId);
      setContestants(updated);
      localStorage.setItem('voterightgh_admin_contestants', JSON.stringify(updated));
      showToast('🗑️ Nominee disqualified and removed.');
    }
  };

  // Handle Manual Add Submission
  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const cleanEmail = manualEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setManualError('Please enter a valid email address.');
      return;
    }

    if (!manualFullName.trim() || !manualPhone.trim()) {
      setManualError('Please fill in Full Name and Phone Number.');
      return;
    }

    if (propsHandleManualCreate) {
      const res = propsHandleManualCreate({
        fullName: manualFullName,
        email: cleanEmail,
        password: manualPassword || 'organizer123',
        phone: manualPhone,
        agency: manualAgency || manualFullName,
        isVerified: manualIsVerified,
        status: manualStatus,
        eventTitle: manualEventTitle,
      });

      if (!res.success) {
        setManualError(res.message);
        return;
      }

      showToast(`✅ ${res.message}`);
    } else {
      const existingOrgIndex = localOrganizers.findIndex(o => o.email.toLowerCase() === cleanEmail);
      let newOrgProfile: OrganizerProfile;
      let updatedOrganizers = [...localOrganizers];

      if (existingOrgIndex >= 0) {
        const existing = localOrganizers[existingOrgIndex];
        newOrgProfile = {
          ...existing,
          fullName: manualFullName.trim() || existing.fullName,
          phone: manualPhone.trim() || existing.phone,
          agency: manualAgency.trim() || existing.agency || manualFullName.trim(),
          eventTitle: manualEventTitle.trim() || existing.eventTitle || 'Custom Voting Event',
          isVerified: manualIsVerified,
          isBlocked: false,
          status: manualStatus,
          password: manualPassword || existing.password || 'organizer123',
        };
        updatedOrganizers[existingOrgIndex] = newOrgProfile;
      } else {
        newOrgProfile = {
          id: `org-${Date.now()}`,
          email: cleanEmail,
          fullName: manualFullName.trim(),
          phone: manualPhone.trim(),
          agency: manualAgency.trim() || manualFullName.trim(),
          eventTitle: manualEventTitle.trim() || 'Custom Voting Event',
          paidFlatFee: true,
          isVerified: manualIsVerified,
          isBlocked: false,
          status: manualStatus,
          registeredAt: new Date().toISOString().split('T')[0],
          password: manualPassword || 'organizer123',
        };
        updatedOrganizers = [newOrgProfile, ...localOrganizers];
      }

      updateOrganizersList(updatedOrganizers);

      let usersAuth: any[] = [];
      try {
        usersAuth = JSON.parse(localStorage.getItem('voterightgh_users_auth') || '[]');
      } catch (e) {
        usersAuth = [];
      }

      const existingAuthIndex = usersAuth.findIndex(
        (u: any) => u.email && u.email.toLowerCase() === cleanEmail
      );

      const userAuthObj = {
        id: newOrgProfile.id,
        email: newOrgProfile.email,
        password: newOrgProfile.password,
        fullName: newOrgProfile.fullName,
        phone: newOrgProfile.phone,
        agency: newOrgProfile.agency,
        role: 'organizer',
        status: newOrgProfile.status,
        isVerified: newOrgProfile.isVerified,
      };

      if (existingAuthIndex >= 0) {
        usersAuth[existingAuthIndex] = {
          ...usersAuth[existingAuthIndex],
          ...userAuthObj,
          role: 'organizer',
        };
      } else {
        usersAuth.push(userAuthObj);
      }

      localStorage.setItem('voterightgh_users_auth', JSON.stringify(usersAuth));
      showToast(`✅ Organizer "${newOrgProfile.fullName}" provisioned successfully!`);
    }

    setManualFullName('');
    setManualEmail('');
    setManualPhone('');
    setManualAgency('');
    setManualPassword('organizer123');
    setManualEventTitle('');
    setManualStatus('approved');
    setManualIsVerified(true);
    setShowManualAddModal(false);
  };

  const handleOrganizerStatusChange = (id: string, newStatus: 'approved' | 'rejected') => {
    const updated = localOrganizers.map(org => {
      if (org.id === id) {
        return { 
          ...org, 
          status: newStatus,
          isVerified: newStatus === 'approved'
        };
      }
      return org;
    });

    updateOrganizersList(updated);
    const target = localOrganizers.find(o => o.id === id);
    if (newStatus === 'approved') {
      showToast(`✅ Organizer "${target?.fullName || target?.email}" APPROVED & Verified!`);
    } else {
      showToast(`❌ Organizer status set to REJECTED.`);
    }
  };

  const handleToggleBlockOrganizer = (id: string) => {
    const updated = localOrganizers.map(org => {
      if (org.id === id) {
        return { ...org, isBlocked: !org.isBlocked };
      }
      return org;
    });

    updateOrganizersList(updated);
    const target = localOrganizers.find(o => o.id === id);
    showToast(`⚡ Organizer "${target?.fullName}" ${target?.isBlocked ? 'unblocked' : 'blocked'}.`);
  };

  const handleDeleteOrganizer = (id: string) => {
    if (confirm('Are you sure you want to remove this organizer account?')) {
      const updated = localOrganizers.filter(o => o.id !== id);
      updateOrganizersList(updated);
      showToast('🗑️ Organizer profile removed.');
    }
  };

  const handleApprovePayout = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const updated = payouts.map(p => p.id === id ? { ...p, status: newStatus } : p);
    setPayouts(updated);
    localStorage.setItem('voterightgh_payout_requests', JSON.stringify(updated));

    const req = payouts.find(p => p.id === id);
    if (newStatus === 'APPROVED') {
      showToast(`✅ Payout of GHS ${req?.amount?.toLocaleString() || ''} APPROVED & DISBURSED!`);
    } else {
      showToast(`❌ Payout request rejected.`);
    }
  };

  // Calculations for Overview Metrics
  const totalPlatformRevenue = events.reduce((acc, ev) => acc + (ev.revenue || (ev.totalVotes * (ev.votePrice || 1))), 0);
  const totalVotesCast = events.reduce((acc, ev) => acc + (ev.totalVotes || 0), 0);
  const pendingPayoutsCount = payouts.filter(p => p.status === 'PENDING' || p.status === 'pending').length;

  const filteredOrganizers = localOrganizers.filter(org => {
    const query = searchQuery.toLowerCase();
    const name = org.fullName || org.agency || '';
    const email = org.email || '';
    const phone = org.phone || '';
    return name.toLowerCase().includes(query) || 
           email.toLowerCase().includes(query) || 
           phone.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16 selection:bg-amber-400 selection:text-slate-950">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-4 right-4 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center justify-between gap-3 border border-emerald-400"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-slate-950 hover:text-white cursor-pointer font-black text-sm">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-lg">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" /> VoteRight GH — Secret Admin Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Platform oversight, live audits, organizer compliance & gateway tracking</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/30 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> System Active 🟢
          </span>
          <button 
            onClick={() => {
              localStorage.removeItem('voteright_admin_session');
              localStorage.removeItem('isAdminAuthenticated');
              localStorage.removeItem('voterightgh_user');
              window.location.href = '/';
            }}
            className="px-3.5 py-1.5 text-xs bg-red-600/20 text-red-300 border border-red-500/30 rounded-xl hover:bg-red-600 hover:text-white transition cursor-pointer font-bold"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 space-x-2 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Analytics Overview', icon: BarChart3 },
            { id: 'organizers', label: `Organizers (${localOrganizers.length})`, icon: Users },
            { id: 'events', label: `Events & Status (${events.length})`, icon: Calendar },
            { id: 'transactions', label: `Transaction Audit (${transactions.length})`, icon: Receipt },
            { id: 'contestants', label: `Contestant Moderation`, icon: Flag },
            { id: 'payouts', label: `Payouts (${pendingPayoutsCount})`, icon: DollarSign },
            { id: 'gateway', label: `SMS Gateway`, icon: MessageSquare },
            { id: 'growth', label: 'Settings & Broadcast', icon: Send }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition border-b-2 cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'border-amber-400 text-amber-400 bg-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Content with Animation */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: GLOBAL REVENUE & ANALYTICS OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Total Revenue</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    GHS {totalPlatformRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400">Platform-wide gross vote sales</div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Total Votes Cast</span>
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {totalVotesCast.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">Successful ballots recorded</div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Active Organizers</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-blue-400 font-mono">
                    {localOrganizers.length}
                  </div>
                  <div className="text-[11px] text-slate-400">Registered event hosts</div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Pending Payouts</span>
                    <DollarSign className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-400 font-mono">
                    {pendingPayoutsCount} Requests
                  </div>
                  <div className="text-[11px] text-slate-400">Awaiting MoMo disbursement</div>
                </div>
              </div>

              {/* Top Performing Events Breakdown */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" /> Top Performing Events Ranking
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/80 text-[11px] uppercase text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="p-3">Event Title</th>
                        <th className="p-3">Organizer</th>
                        <th className="p-3">Total Votes</th>
                        <th className="p-3">Revenue Generated</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {events.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-700/20">
                          <td className="p-3 font-bold text-white">{ev.title}</td>
                          <td className="p-3 text-slate-300">{ev.organizer}</td>
                          <td className="p-3 font-mono text-amber-400 font-bold">{ev.totalVotes?.toLocaleString()}</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">GHS {(ev.revenue || (ev.totalVotes * (ev.votePrice || 1))).toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${ev.isOngoing ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                              {ev.isOngoing ? 'LIVE 🟢' : 'ENDED 🔴'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: ORGANIZERS */}
          {activeTab === 'organizers' && (
            <motion.div 
              key="organizers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-400" /> Registered Organizers Management
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Review live applicant profiles, verify credentials, or manually provision organizer accounts</p>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowManualAddModal(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-400/20 shrink-0"
                >
                  <UserPlus className="w-4 h-4 fill-slate-950" />
                  <span>Add Organizer Manually</span>
                </motion.button>
              </div>

              {/* Search Filter */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input 
                  type="text"
                  placeholder="Search organizers by name, email, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors shadow-inner"
                />
              </div>

              {/* Organizers Management Table */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="p-4">Organizer Name & Email</th>
                        <th className="p-4">Agency / Event</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {filteredOrganizers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-medium">
                            No registered organizers found matching "{searchQuery}".
                          </td>
                        </tr>
                      ) : (
                        filteredOrganizers.map((org) => {
                          const isApproved = org.status === 'approved' || org.isVerified;
                          const isRejected = org.status === 'rejected';
                          const isPending = !isApproved && !isRejected;

                          return (
                            <tr key={org.id} className="hover:bg-slate-700/30 transition-colors">
                              <td className="p-4">
                                <div className="font-extrabold text-white text-sm">{org.fullName || 'Organizer User'}</div>
                                <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                                  <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                                  {org.email}
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-slate-200">
                                {org.agency || org.eventTitle || 'Independent Organizer'}
                              </td>
                              <td className="p-4 font-mono text-slate-300">
                                {org.phone || 'N/A'}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isApproved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                  isRejected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 
                                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {isApproved ? 'APPROVED 🟢' : isRejected ? 'REJECTED 🔴' : 'PENDING 🟡'}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                {isPending ? (
                                  <>
                                    <button 
                                      onClick={() => handleOrganizerStatusChange(org.id, 'approved')}
                                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={() => handleOrganizerStatusChange(org.id, 'rejected')}
                                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleOrganizerStatusChange(org.id, isApproved ? 'rejected' : 'approved')}
                                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    Toggle Status
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleToggleBlockOrganizer(org.id)}
                                  title="Block/Unblock"
                                  className="p-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg transition cursor-pointer"
                                >
                                  <ShieldAlert className="w-4 h-4 inline" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteOrganizer(org.id)}
                                  title="Delete Profile"
                                  className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: EVENTS & VOTING STATUS TOGGLE + DELETE EVENT */}
          {activeTab === 'events' && (
            <motion.div 
              key="events"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center flex-wrap gap-4 bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
                <div>
                  <h2 className="text-xl font-black text-white">Active & Archived Events Override</h2>
                  <p className="text-xs text-slate-400 mt-1">One-click voting status toggle or delete events to remove them instantly from public view.</p>
                </div>
              </div>

              <div className="grid gap-4">
                {events.length === 0 ? (
                  <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center text-slate-400 text-xs">
                    No active events found.
                  </div>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 shadow-md">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-white">{ev.title}</h3>
                        <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                          <span>Organizer: <span className="text-slate-200 font-semibold">{ev.organizer}</span></span>
                          <span>•</span>
                          <span>Votes: <span className="text-amber-400 font-bold">{ev.totalVotes?.toLocaleString() || 0}</span></span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-700">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Status:</span>
                          <button onClick={() => toggleVotingStatus(ev.id)} className="flex items-center gap-2 transition cursor-pointer">
                            {ev.isOngoing ? (
                              <>
                                <ToggleRight className="w-8 h-8 text-emerald-400" />
                                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-black px-3 py-1 rounded-lg">ONGOING 🟢</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-8 h-8 text-rose-400" />
                                <span className="text-xs bg-rose-500/20 text-rose-300 font-black px-3 py-1 rounded-lg">ENDED 🔴</span>
                              </>
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="px-4 py-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-rose-500/30"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Event</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: TRANSACTION AUDIT TRAIL LOGS */}
          {activeTab === 'transactions' && (
            <motion.div 
              key="transactions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" /> Live Vote Transaction Ledger & Audit Trail
                </h2>
                <p className="text-xs text-slate-400 mt-1">Every incoming vote payment processed via Mobile Money and card gateways</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="p-4">Tx ID / Time</th>
                        <th className="p-4">Contest & Nominee</th>
                        <th className="p-4">Channel & Phone</th>
                        <th className="p-4">Votes & Amount</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">No transactions recorded yet.</td>
                        </tr>
                      ) : (
                        transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-700/30">
                            <td className="p-4">
                              <div className="font-mono font-bold text-amber-400">{tx.id}</div>
                              <div className="text-[10px] text-slate-400">{new Date(tx.timestamp || Date.now()).toLocaleString()}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-extrabold text-white">{tx.contestTitle}</div>
                              <div className="text-slate-300 text-[11px]">Vote for: <span className="text-amber-300">{tx.nominee}</span></div>
                            </td>
                            <td className="p-4 font-mono">
                              <div className="text-emerald-400 font-bold">{tx.channel}</div>
                              <div className="text-slate-400 text-[11px]">{tx.phone}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-white">{tx.votes} Votes</div>
                              <div className="text-amber-400 font-mono">GHS {tx.amount}</div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {tx.status || 'SUCCESS'} 🟢
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: CONTESTANT & NOMINEE MODERATION */}
          {activeTab === 'contestants' && (
            <motion.div 
              key="contestants"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Flag className="w-5 h-5 text-amber-400" /> Global Contestant & Nominee Moderation
                </h2>
                <p className="text-xs text-slate-400 mt-1">Review, flag, or disqualify inappropriate entries across all active event contests</p>
              </div>

              <div className="grid gap-4">
                {contestants.map((con) => (
                  <div key={con.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 shadow-md">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">{con.name}</h3>
                        {con.flagged && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded">
                            FLAGGED ⚠️
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Event: <span className="text-slate-200 font-semibold">{con.eventTitle}</span> • Category: <span className="text-amber-400">{con.category}</span> • Votes: <span className="font-mono text-white">{con.votes}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleToggleFlagContestant(con.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          con.flagged ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {con.flagged ? 'Unflag Nominee' : 'Flag Nominee'}
                      </button>
                      <button 
                        onClick={() => handleDeleteContestant(con.id)}
                        className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer border border-rose-500/30 flex items-center gap-1"
                      >
                        <ShieldX className="w-4 h-4" /> Disqualify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 6: MOMO PAYOUT APPROVALS */}
          {activeTab === 'payouts' && (
            <motion.div 
              key="payouts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
                <h2 className="text-xl font-black text-white">Mobile Money & Bank Withdrawal Requests</h2>
                <p className="text-xs text-slate-400 mt-1">Live requests submitted directly from Organizer Dashboards</p>
              </div>

              <div className="grid gap-4">
                {payouts.map((p) => {
                  const requesterName = p.organizerName || p.organizer || 'Ghana Event Organizer';
                  const eventName = p.eventTitle || p.contestTitle || 'Voting Event';
                  const providerName = p.momoNetwork || p.bankOrNetworkName || p.network || 'MTN MoMo';
                  const isPending = p.status === 'PENDING' || p.status === 'pending';
                  const isApproved = p.status === 'APPROVED' || p.status === 'Paid' || p.status === 'paid' || p.status === 'DISBURSED';

                  return (
                    <div key={p.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-6 shadow-md">
                      <div className="space-y-2 flex-1 min-w-[280px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-white text-base">{requesterName}</h3>
                          <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Organizer</span>
                        </div>

                        <div className="text-xs text-amber-400 font-semibold">
                          Event: <span className="text-slate-200 font-medium">{eventName}</span>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs font-mono space-y-1 text-slate-200">
                          <div><span className="text-slate-400">Network:</span> <span className="text-emerald-400 font-bold">{providerName}</span></div>
                          <div><span className="text-slate-400">Account Number:</span> <span className="text-white font-bold">{p.accountNumber || p.accountNo}</span></div>
                          <div><span className="text-slate-400">Account Name:</span> <span className="text-white font-bold">{p.accountName || requesterName}</span></div>
                        </div>

                        <div className="text-xl font-black text-emerald-400 font-mono">
                          GHS {Number(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPending ? (
                          <>
                            <button 
                              onClick={() => handleApprovePayout(p.id, 'APPROVED')}
                              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-5 py-3 rounded-xl text-xs transition cursor-pointer"
                            >
                              Approve & Disburse ⚡
                            </button>
                            <button 
                              onClick={() => handleApprovePayout(p.id, 'REJECTED')}
                              className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold px-4 py-3 rounded-xl text-xs border border-rose-500/30 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={`px-4 py-2 text-xs font-bold rounded-xl border ${isApproved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                            {isApproved ? 'Approved & Disbursed ✅' : 'Rejected ❌'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 7: SMS GATEWAY SETTINGS & TRACKER */}
          {activeTab === 'gateway' && (
            <motion.div 
              key="gateway"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
                <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" /> SMS Credit & API Status
                </h3>
                <p className="text-xs text-slate-400">Monitor SMS unit balances for automated voter receipt confirmations and OTP authentications.</p>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                  <div className="text-xs text-slate-400">Active Gateway Provider:</div>
                  <div className="text-white font-bold text-sm">{smsGatewayProvider}</div>
                  <div className="text-xs text-slate-400 pt-2">Available SMS Units:</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{smsBalance.toLocaleString()} Credits</div>
                </div>

                <button 
                  onClick={() => {
                    setSmsBalance(prev => prev + 5000);
                    showToast('📱 Added 5,000 SMS units successfully!');
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Top Up SMS Credits (+5,000)
                </button>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
                <h3 className="text-lg font-black text-amber-400">SMS Gateway Configuration</h3>
                <p className="text-xs text-slate-400">Configure automated notification triggers.</p>

                <div className="space-y-4 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={autoSmsReceipts}
                      onChange={(e) => setAutoSmsReceipts(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-400"
                    />
                    <span className="text-xs font-bold text-slate-200">Automatically dispatch SMS receipt upon successful vote cast</span>
                  </label>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 space-y-1">
                    <div className="text-amber-400 font-bold">Webhook Endpoint Status:</div>
                    <div>🟢 Active (HTTPS / TLS 1.3 Secure)</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 8: GROWTH & PLATFORM SETTINGS */}
          {activeTab === 'growth' && (
            <motion.div 
              key="growth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
                <h3 className="text-lg font-black text-amber-400">VoteRight GH Platform Fee</h3>
                <p className="text-xs text-slate-400">Adjust percentage commission deducted automatically from voting revenue.</p>
                
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={platformFee} 
                    onChange={(e) => setPlatformFee(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-2 w-28 text-amber-400 font-bold text-lg focus:outline-none focus:border-amber-400" 
                  />
                  <span className="text-sm font-bold text-slate-200">% Platform Commission</span>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
                <h3 className="text-lg font-black text-amber-400">System Broadcast Announcement</h3>
                <p className="text-xs text-slate-400">Post a broadcast message visible across the platform ticker.</p>
                
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="e.g. System upgrade complete..." 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button 
                    onClick={() => {
                      if (broadcastMessage) {
                        setActiveAnnouncement(broadcastMessage);
                        showToast('📢 Broadcast banner published!');
                      }
                      setBroadcastMessage('');
                    }}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Publish Announcement
                  </button>
                </div>

                {activeAnnouncement && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-mono">
                    <strong>Current Live Banner:</strong> "{activeAnnouncement}"
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* MODAL: ADD ORGANIZER MANUALLY */}
      <AnimatePresence>
        {showManualAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-400">Add Organizer Manually</h3>
                    <p className="text-[11px] text-slate-400">Directly create & provision active organizer account credentials</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowManualAddModal(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {manualError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="font-semibold">{manualError}</span>
                </div>
              )}

              <form onSubmit={handleManualAddSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Full Name / Representative</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Kwame Mensah"
                      value={manualFullName}
                      onChange={(e) => setManualFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Official Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input 
                      type="email" 
                      required
                      placeholder="organizer@gmail.com"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Ghana Phone Number (MoMo)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input 
                        type="tel" 
                        required
                        placeholder="024XXXXXXX"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Organization / Agency Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Afronation Events Ltd"
                      value={manualAgency}
                      onChange={(e) => setManualAgency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Login Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input 
                        type="text" 
                        required
                        placeholder="organizer123"
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-amber-400 font-mono font-bold rounded-xl pl-10 pr-4 py-2.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Associated Event Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Miss Campus GH 2026"
                      value={manualEventTitle}
                      onChange={(e) => setManualEventTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Verification Status</label>
                    <select 
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none"
                    >
                      <option value="approved">Approved 🟢</option>
                      <option value="pending">Pending Review 🟡</option>
                      <option value="rejected">Rejected 🔴</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={manualIsVerified}
                        onChange={(e) => setManualIsVerified(e.target.checked)}
                        className="w-4 h-4 rounded accent-amber-400"
                      />
                      <span className="font-bold text-slate-200">Verified Account Badge</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setShowManualAddModal(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg shadow-amber-400/20 transition"
                  >
                    Create Organizer Account
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

