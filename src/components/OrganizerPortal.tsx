import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Vote, 
  Settings, 
  BarChart3, 
  ShieldAlert,
  Plus,
  QrCode,
  Upload,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  Loader2,
  Smartphone,
  Building2,
  Zap,
  ShieldCheck,
  TrendingUp,
  Share2
} from 'lucide-react';

interface OrganizerPortalProps {
  onLogout: () => void;
  organizerName?: string;
  organizerEmail?: string;
}

interface Contest {
  id: string;
  title: string;
  description: string;
  totalVotes: number;
  revenue: number;
  status: 'Active' | 'Paused' | 'Ended';
  startDate: string;
  endDate: string;
  subaccountCode: string;
}

interface Nominee {
  id: string;
  contestId: string;
  name: string;
  category: string;
  code: string;
  votes: number;
  photoUrl: string;
  bio: string;
}

interface PayoutRequest {
  id: string;
  eventTitle: string;
  amount: number;
  paymentMethod: string;
  momoNetwork?: string;
  accountNumber: string;
  accountName: string;
  status: string;
  createdAt: string;
}

export const OrganizerPortal: React.FC<OrganizerPortalProps> = ({ 
  onLogout, 
  organizerName = "Organizer",
  organizerEmail = "admin@voteright.com"
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'candidates' | 'voters' | 'analytics' | 'payouts' | 'settings'>('dashboard');
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stats & Contests state
  const [stats, setStats] = useState({
    totalVoters: 1420,
    totalVotesCast: 980,
    activeElections: 2,
    turnoutRate: '69%',
    totalRevenue: 14700
  });

  const [myContests, setMyContests] = useState<Contest[]>([
    {
      id: 'c1',
      title: 'Ghana Music Awards 2026',
      description: 'Official voting portal for Artiste of the Year & Genre categories.',
      totalVotes: 780,
      revenue: 11700,
      status: 'Active',
      startDate: '2026-06-01',
      endDate: '2026-08-31',
      subaccountCode: 'ACCT_ghmusic2026'
    },
    {
      id: 'c2',
      title: 'Campus Face of Legon 2026',
      description: 'Annual University of Ghana student leadership & popularity contest.',
      totalVotes: 200,
      revenue: 3000,
      status: 'Active',
      startDate: '2026-07-15',
      endDate: '2026-09-15',
      subaccountCode: 'ACCT_legon2026'
    }
  ]);

  const [selectedContestId, setSelectedContestId] = useState<string>('c1');
  const selectedContest = myContests.find(c => c.id === selectedContestId) || myContests[0];

  // Nominees / Candidates State
  const [nominees, setNominees] = useState<Nominee[]>([
    { id: 'n1', contestId: 'c1', name: 'Stonebwoy', category: 'Artiste of the Year', code: 'GMA-001', votes: 340, photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', bio: 'Dancehall heavyweight & African reggae icon.' },
    { id: 'n2', contestId: 'c1', name: 'Sarkodie', category: 'Artiste of the Year', code: 'GMA-002', votes: 290, photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', bio: 'Rap king and African hip-hop pioneer.' },
    { id: 'n3', contestId: 'c1', name: 'Black Sherif', category: 'Artiste of the Year', code: 'GMA-003', votes: 150, photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', bio: 'Voice of the youth and highlife fusion star.' }
  ]);

  // New Contest Modal Form State
  const [showNewContestModal, setShowNewContestModal] = useState(false);
  const [newContestTitle, setNewContestTitle] = useState('');
  const [newContestDesc, setNewContestDesc] = useState('');

  // New Nominee Form State
  const [newNomineeName, setNewNomineeName] = useState('');
  const [newNomineeCategory, setNewNomineeCategory] = useState('Artiste of the Year');
  const [newNomineeCode, setNewNomineeCode] = useState('');
  const [newNomineePhotoUrl, setNewNomineePhotoUrl] = useState('');
  const [newNomineeBio, setNewNomineeBio] = useState('');

  // Bulk Upload Modal State
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Edit Nominee State
  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null);
  const [editNomineeName, setEditNomineeName] = useState('');
  const [editNomineeCategory, setEditNomineeCategory] = useState('');
  const [editNomineeCode, setEditNomineeCode] = useState('');
  const [editNomineePhotoUrl, setEditNomineePhotoUrl] = useState('');
  const [editNomineeBio, setEditNomineeBio] = useState('');

  // Nominee Badge / QR Modal State
  const [selectedNomineeForBadge, setSelectedNomineeForBadge] = useState<Nominee | null>(null);

  // Payouts & Paystack API State
  const availableBalance = selectedContest.revenue * 0.85; // 85% net organizer share
  const currency = 'GHS';
  const subaccount = { subaccountCode: selectedContest.subaccountCode };

  const [selectedPayoutEventId, setSelectedPayoutEventId] = useState<string>(selectedContestId);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'Mobile Money' | 'Bank Transfer'>('Mobile Money');
  const [momoNetwork, setMomoNetwork] = useState('MTN MoMo');
  const [bankName, setBankName] = useState('Ecobank Ghana');
  const [accountNumber, setAccountNumber] = useState('0244998877');
  const [accountName, setAccountName] = useState(organizerName);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Transfer modal progress state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStepLabel, setTransferStepLabel] = useState('Connecting to Paystack Transfer API...');
  const [activeTransferStep, setActiveTransferStep] = useState(1);
  const [completedPayoutRecord, setCompletedPayoutRecord] = useState<PayoutRequest | null>(null);

  const [payoutRequestsHistory, setPayoutRequestsHistory] = useState<PayoutRequest[]>([
    {
      id: 'TRF_9981245',
      eventTitle: 'Ghana Music Awards 2026',
      amount: 2500,
      paymentMethod: 'Mobile Money',
      momoNetwork: 'MTN MoMo',
      accountNumber: '0244998877',
      accountName: organizerName,
      status: 'APPROVED',
      createdAt: '2026-08-01T10:30:00Z'
    }
  ]);

  // Settings state
  const [settingsAgencyName, setSettingsAgencyName] = useState(organizerName);
  const [settingsPhone, setSettingsPhone] = useState('+233 24 400 1122');
  const [settingsMomoNumber, setSettingsMomoNumber] = useState('0244998877 (MTN)');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const formatPrice = (amount: number, curr = 'GHS') => {
    return `${curr} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Handle Creating New Contest
  const handleCreateContest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContestTitle.trim()) return;

    const newContest: Contest = {
      id: `c_${Date.now()}`,
      title: newContestTitle,
      description: newContestDesc || 'Custom voting event created via organizer portal.',
      totalVotes: 0,
      revenue: 0,
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      subaccountCode: `ACCT_${Math.random().toString(36).substring(2, 8)}`
    };

    setMyContests([newContest, ...myContests]);
    setSelectedContestId(newContest.id);
    setNewContestTitle('');
    setNewContestDesc('');
    setShowNewContestModal(false);
    showToast('✨ New voting event created successfully!');
  };

  // Handle Adding Single Nominee
  const handleAddNominee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNomineeName.trim()) return;

    const nominee: Nominee = {
      id: `n_${Date.now()}`,
      contestId: selectedContestId,
      name: newNomineeName,
      category: newNomineeCategory,
      code: newNomineeCode || `VR-${Math.floor(100 + Math.random() * 900)}`,
      votes: 0,
      photoUrl: newNomineePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: newNomineeBio || 'Official contest nominee.'
    };

    setNominees([...nominees, nominee]);
    setNewNomineeName('');
    setNewNomineeCode('');
    setNewNomineePhotoUrl('');
    setNewNomineeBio('');
    showToast(`👤 Nominee ${nominee.name} added successfully!`);
  };

  // Handle Bulk Nominee Upload
  const handleBulkNomineeUpload = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    let addedCount = 0;

    const newNomineesList = [...nominees];
    lines.forEach((line) => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        newNomineesList.push({
          id: `n_bulk_${Date.now()}_${Math.random()}`,
          contestId: selectedContestId,
          name: parts[0],
          category: parts[1],
          code: parts[2] || `VR-${Math.floor(100 + Math.random() * 900)}`,
          votes: 0,
          photoUrl: parts[3] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          bio: parts[4] || 'Contestant'
        });
        addedCount++;
      }
    });

    setNominees(newNomineesList);
    setBulkText('');
    setShowBulkUploadModal(false);
    showToast(`📥 Successfully imported ${addedCount} nominees!`);
  };

  // Delete Nominee
  const handleDeleteNominee = (id: string) => {
    setNominees(nominees.filter(n => n.id !== id));
    showToast('🗑️ Nominee removed.');
  };

  // Open Edit Nominee
  const handleOpenEdit = (n: Nominee) => {
    setEditingNominee(n);
    setEditNomineeName(n.name);
    setEditNomineeCategory(n.category);
    setEditNomineeCode(n.code);
    setEditNomineePhotoUrl(n.photoUrl);
    setEditNomineeBio(n.bio);
  };

  const handleSaveEditNominee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNominee) return;

    setNominees(nominees.map(n => n.id === editingNominee.id ? {
      ...n,
      name: editNomineeName,
      category: editNomineeCategory,
      code: editNomineeCode,
      photoUrl: editNomineePhotoUrl,
      bio: editNomineeBio
    } : n));

    setEditingNominee(null);
    showToast('✏️ Nominee updated successfully!');
  };

  // Preset percentage buttons for payout
  const handleSelectPreset = (percent: number) => {
    const val = (availableBalance * percent) / 100;
    setPayoutAmount(val.toFixed(2));
  };

  // Paystack Transfer API Simulation Flow
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccess(null);

    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayoutError('Please enter a valid payout amount.');
      return;
    }
    if (amt > availableBalance) {
      setPayoutError('Requested amount exceeds available net balance.');
      return;
    }

    setIsSubmittingPayout(true);
    setIsTransferModalOpen(true);
    setActiveTransferStep(1);
    setTransferStepLabel(`Verifying Subaccount Balance for ${subaccount.subaccountCode}...`);

    await new Promise(r => setTimeout(r, 1200));
    setActiveTransferStep(2);
    setTransferStepLabel(`Creating Paystack Transfer Recipient (${accountNumber} - ${accountName})...`);

    await new Promise(r => setTimeout(r, 1400));
    setActiveTransferStep(3);
    setTransferStepLabel(`Executing Automated ${payoutMethod} Disbursement via Paystack API...`);

    await new Promise(r => setTimeout(r, 1500));

    const newRecord: PayoutRequest = {
      id: `TRF_${Math.floor(1000000 + Math.random() * 9000000)}`,
      eventTitle: selectedContest.title,
      amount: amt,
      paymentMethod: payoutMethod,
      momoNetwork: payoutMethod === 'Mobile Money' ? momoNetwork : undefined,
      accountNumber,
      accountName,
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    };

    setPayoutRequestsHistory([newRecord, ...payoutRequestsHistory]);
    setCompletedPayoutRecord(newRecord);
    setIsSubmittingPayout(false);
    setPayoutSuccess(`Successfully disbursed ${formatPrice(amt, currency)} to ${accountName}!`);
  };

  const currentNominees = nominees.filter(n => n.contestId === selectedContestId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-amber-400 selection:text-slate-950">
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-amber-500 to-amber-400 p-2.5 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white">Vote Right</h1>
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/20">
                Organizer Pro
              </span>
            </div>
            <p className="text-xs text-slate-400">Automated Voting & Paystack Split Settlement Portal</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="hidden md:block text-right">
            <div className="text-sm font-extrabold text-white">{organizerName}</div>
            <div className="text-xs text-slate-400 font-mono">{organizerEmail}</div>
          </div>
          
          {/* Log Out Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border border-rose-500/30 shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 space-y-2 hidden md:block">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2">
            Organizer Navigation
          </div>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Contests</span>
          </button>

          <button
            onClick={() => setActiveTab('candidates')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === 'candidates' 
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Candidates / Nominees</span>
          </button>

          <button
            onClick={() => setActiveTab('voters')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === 'voters' 
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Voters Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Live Analytics & Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === 'payouts' 
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Paystack Payouts & Split</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings & QR Badges</span>
          </button>

          {/* Subaccount Info Quick Card in Sidebar */}
          <div className="pt-6 mt-6 border-t border-slate-800 px-3 space-y-2">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paystack Subaccount</div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="text-[11px] font-bold text-white truncate">{selectedContest.title}</div>
              <div className="text-[10px] text-amber-400 font-mono font-bold truncate">{subaccount.subaccountCode}</div>
              <div className="text-[10px] text-emerald-400 font-mono font-bold">Net Balance: {formatPrice(availableBalance, currency)}</div>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              
              {/* TAB 1: DASHBOARD & CONTESTS */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white">Election Overview</h2>
                      <p className="text-xs text-slate-400">Real-time metrics, active voting pools, and system security health.</p>
                    </div>

                    <button
                      onClick={() => setShowNewContestModal(true)}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer w-fit"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Voting Contest</span>
                    </button>
                  </div>

                  {/* Stat Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
                      <div className="text-xs font-bold text-slate-400">Total Registered Voters</div>
                      <div className="text-3xl font-black text-white">{stats.totalVoters.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-400 font-bold">+12% from last week</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
                      <div className="text-xs font-bold text-slate-400">Total Votes Cast</div>
                      <div className="text-3xl font-black text-amber-400">{stats.totalVotesCast.toLocaleString()}</div>
                      <div className="text-[10px] text-amber-400 font-bold">Verified & immutable</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
                      <div className="text-xs font-bold text-slate-400">Total Revenue ({currency})</div>
                      <div className="text-3xl font-black text-emerald-400">{formatPrice(stats.totalRevenue, currency)}</div>
                      <div className="text-[10px] text-emerald-400 font-bold">85% Split Subaccount</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
                      <div className="text-xs font-bold text-slate-400">Turnout Rate</div>
                      <div className="text-3xl font-black text-blue-400">{stats.turnoutRate}</div>
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-emerald-400">Live & Secure</span>
                      </div>
                    </div>
                  </div>

                  {/* Contest Selector Banner */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-white text-sm">Active Contests Management</h3>
                      <span className="text-xs font-mono text-slate-400">{myContests.length} Total Contests</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myContests.map((contest) => (
                        <div
                          key={contest.id}
                          onClick={() => {
                            setSelectedContestId(contest.id);
                            setSelectedPayoutEventId(contest.id);
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                            selectedContestId === contest.id
                              ? 'bg-amber-400/10 border-amber-400 shadow-xl'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {contest.status}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-amber-400">{contest.subaccountCode}</span>
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-white">{contest.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-1">{contest.description}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                            <span className="text-slate-300 font-bold">{contest.totalVotes.toLocaleString()} Votes</span>
                            <span className="text-emerald-400 font-mono font-black">{formatPrice(contest.revenue, currency)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CANDIDATES / NOMINEES MANAGEMENT */}
              {activeTab === 'candidates' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white">Candidates & Nominees</h2>
                      <p className="text-xs text-slate-400">Manage nominees, voting codes, and categories for: <span className="text-amber-400 font-bold">{selectedContest.title}</span></p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowBulkUploadModal(true)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Bulk Import (.CSV/Text)</span>
                      </button>
                    </div>
                  </div>

                  {/* Add New Nominee Form */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h3 className="font-black text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>Add New Nominee</span>
                    </h3>

                    <form onSubmit={handleAddNominee} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Nominee Name</label>
                        <input
                          type="text"
                          required
                          value={newNomineeName}
                          onChange={(e) => setNewNomineeName(e.target.value)}
                          placeholder="e.g. KiDi"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Category</label>
                        <input
                          type="text"
                          required
                          value={newNomineeCategory}
                          onChange={(e) => setNewNomineeCategory(e.target.value)}
                          placeholder="Artiste of the Year"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Voting Code (Auto or Custom)</label>
                        <input
                          type="text"
                          value={newNomineeCode}
                          onChange={(e) => setNewNomineeCode(e.target.value.toUpperCase())}
                          placeholder="e.g. GMA-004"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-bold uppercase focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Photo URL</label>
                        <input
                          type="url"
                          value={newNomineePhotoUrl}
                          onChange={(e) => setNewNomineePhotoUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Bio / Tagline</label>
                        <input
                          type="text"
                          value={newNomineeBio}
                          onChange={(e) => setNewNomineeBio(e.target.value)}
                          placeholder="Hitmaker & performer"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2.5 rounded-xl shadow transition-all cursor-pointer"
                        >
                          Add Nominee
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Nominees List Table / Cards */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-extrabold text-white text-sm">
                        Registered Nominees ({currentNominees.length})
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">Contest: {selectedContest.title}</span>
                    </div>

                    {currentNominees.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No nominees registered yet for this contest. Add one above or import in bulk.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentNominees.map((nominee) => (
                          <div key={nominee.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <img src={nominee.photoUrl} alt={nominee.name} className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-extrabold text-white text-sm truncate">{nominee.name}</h4>
                                  <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                    {nominee.code}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">{nominee.category}</p>
                                <div className="text-xs font-bold text-emerald-400 mt-1">{nominee.votes.toLocaleString()} Votes</div>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-1">{nominee.bio}</p>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                              <button
                                onClick={() => setSelectedNomineeForBadge(nominee)}
                                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>QR Badge</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenEdit(nominee)}
                                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                                  title="Edit Nominee"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNominee(nominee.id)}
                                  className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg cursor-pointer"
                                  title="Delete Nominee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: VOTERS DIRECTORY */}
              {activeTab === 'voters' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">Voters Directory & Audit</h2>
                    <p className="text-xs text-slate-400">Monitor voter verification status, IP logs, and payment references.</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-extrabold text-white text-sm">Recent Vote Transactions</h3>
                      <button onClick={() => showToast('📥 Voters log exported to CSV!')} className="text-xs font-bold text-amber-400 flex items-center gap-1.5 cursor-pointer">
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {[
                        { id: 'TXN-99812', voter: '0244****77', nominee: 'Stonebwoy (GMA-001)', votes: 20, amount: 'GHS 30.00', status: 'SUCCESS', time: '2 mins ago' },
                        { id: 'TXN-99811', voter: '0552****11', nominee: 'Sarkodie (GMA-002)', votes: 50, amount: 'GHS 75.00', status: 'SUCCESS', time: '14 mins ago' },
                        { id: 'TXN-99810', voter: '0201****88', nominee: 'Black Sherif (GMA-003)', votes: 10, amount: 'GHS 15.00', status: 'SUCCESS', time: '32 mins ago' }
                      ].map((tx) => (
                        <div key={tx.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-amber-400 font-bold">{tx.id}</span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">{tx.status}</span>
                            </div>
                            <div className="text-xs font-bold text-white">Voted for <span className="text-amber-300">{tx.nominee}</span></div>
                            <div className="text-[10px] text-slate-400 font-mono">MoMo Number: {tx.voter} • {tx.time}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-black text-emerald-400">+{tx.votes} Votes</div>
                            <div className="text-xs font-mono font-bold text-white">{tx.amount}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LIVE ANALYTICS & AUDIT */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">Live Analytics & Charts</h2>
                    <p className="text-xs text-slate-400">Inspect voting velocity, peak traffic hours, and geographical distribution.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                      <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        <span>Vote Distribution by Nominee</span>
                      </h3>
                      <div className="space-y-3 pt-2">
                        {[
                          { name: 'Stonebwoy', votes: 340, pct: 45, color: 'bg-amber-400' },
                          { name: 'Sarkodie', votes: 290, pct: 38, color: 'bg-emerald-400' },
                          { name: 'Black Sherif', votes: 150, pct: 17, color: 'bg-blue-400' }
                        ].map((item) => (
                          <div key={item.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-white">{item.name}</span>
                              <span className="text-amber-400">{item.votes} votes ({item.pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                              <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                      <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Security & Fraud Prevention Audit</span>
                      </h3>
                      <div className="space-y-3 text-xs text-slate-300">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span>Bot & Duplicate IP Blocks</span>
                          <span className="font-bold text-emerald-400 font-mono">142 Blocked</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span>Paystack Split Reconciliation</span>
                          <span className="font-bold text-emerald-400 font-mono">100% Synced</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span>SSL & SHA-256 Encryption</span>
                          <span className="font-bold text-emerald-400 font-mono">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PAYSTACK PAYOUTS & SPLIT SETTLEMENT */}
              {activeTab === 'payouts' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">Paystack Payouts & Split Settlement</h2>
                    <p className="text-xs text-slate-400">Withdraw your 85% organizer net earnings directly to Bank or Mobile Money via Paystack Transfer API.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column: Request Payout Form */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <h3 className="font-extrabold text-white text-sm">Initiate Payout Transfer</h3>
                          <p className="text-xs text-slate-400 font-mono">Subaccount: {subaccount.subaccountCode}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Available Balance</span>
                          <span className="text-lg font-black text-emerald-400 font-mono">{formatPrice(availableBalance, currency)}</span>
                        </div>
                      </div>

                      {payoutError && (
                        <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>{payoutError}</span>
                        </div>
                      )}

                      {payoutSuccess && (
                        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{payoutSuccess}</span>
                        </div>
                      )}

                      <form onSubmit={handlePayoutSubmit} className="space-y-4">
                        {/* Select Event Pool */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">Select Event Revenue Pool</label>
                          <select
                            value={selectedPayoutEventId}
                            onChange={(e) => setSelectedPayoutEventId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                          >
                            {myContests.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title} ({c.totalVotes.toLocaleString()} votes)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Payout Amount with Quick Preset Buttons */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-300">Payout Amount (GHS)</label>
                            <span className="text-[11px] text-emerald-400 font-mono font-bold">
                              Available: {formatPrice(availableBalance, currency)}
                            </span>
                          </div>

                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">GHS</span>
                            <input
                              type="number"
                              step="0.01"
                              required
                              max={availableBalance}
                              value={payoutAmount}
                              onChange={(e) => setPayoutAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-14 pr-4 py-3 text-sm text-emerald-300 font-mono font-black focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {/* Preset Percentage Buttons */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Preset:</span>
                            <button
                              type="button"
                              onClick={() => handleSelectPreset(25)}
                              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              25%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectPreset(50)}
                              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectPreset(75)}
                              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              75%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectPreset(100)}
                              className="bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/30 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer ml-auto"
                            >
                              Max (100%)
                            </button>
                          </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPayoutMethod('Mobile Money')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              payoutMethod === 'Mobile Money'
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-lg'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <Smartphone className="w-4 h-4" />
                            <span>Mobile Money</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPayoutMethod('Bank Transfer')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              payoutMethod === 'Bank Transfer'
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-lg'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                            <span>Bank Transfer</span>
                          </button>
                        </div>

                        {/* Network / Bank and Account Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {payoutMethod === 'Mobile Money' ? (
                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">MoMo Network</label>
                              <select
                                value={momoNetwork}
                                onChange={(e) => setMomoNetwork(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                              >
                                <option value="MTN MoMo">MTN MoMo</option>
                                <option value="Telecel Cash">Telecel Cash</option>
                                <option value="AT Money">AT Money (AirtelTigo)</option>
                              </select>
                            </div>
                          ) : (
                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Bank Name</label>
                              <select
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                              >
                                <option value="Ecobank Ghana">Ecobank Ghana</option>
                                <option value="GCB Bank">GCB Bank</option>
                                <option value="Stanbic Bank Ghana">Stanbic Bank Ghana</option>
                                <option value="Fidelity Bank Ghana">Fidelity Bank Ghana</option>
                                <option value="Access Bank">Access Bank</option>
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">
                              {payoutMethod === 'Mobile Money' ? 'Mobile Number' : 'Account Number'}
                            </label>
                            <input
                              type="text"
                              required
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              placeholder="0244998877"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">Registered Account Holder Name</label>
                          <input
                            type="text"
                            required
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Name as registered on MoMo / Bank"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingPayout || availableBalance <= 0}
                          className={`w-full py-3.5 rounded-xl text-xs font-black transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                            availableBalance > 0
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isSubmittingPayout ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Processing Paystack Transfer API...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              <span>Initiate Paystack Payout Transfer ({formatPrice(parseFloat(payoutAmount) || 0, currency)})</span>
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>

                    {/* Right Column: Payout History & Paystack Architecture Details */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Paystack Subaccount Security Card */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-amber-400">
                          <ShieldCheck className="w-5 h-5" />
                          <h6 className="font-extrabold text-sm text-white">Paystack Split & Transfer Security</h6>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Vote payments are split automatically at checkout: <span className="text-white font-bold">85% goes directly to your subaccount</span> ({subaccount.subaccountCode}) and <span className="text-white font-bold">15% goes to VoteRight</span>. Payout requests trigger real-time bank and MoMo transfers via the Paystack Transfer API.
                        </p>
                      </div>

                      {/* Payout History Ledger */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h5 className="font-extrabold text-white text-sm">Payout Requests History ({payoutRequestsHistory.length})</h5>

                        {payoutRequestsHistory.length === 0 ? (
                          <div className="text-center py-6 bg-slate-950 rounded-xl text-xs text-slate-400">
                            No payout requests recorded yet.
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                            {payoutRequestsHistory.map((p) => (
                              <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-sm text-amber-400">{formatPrice(p.amount, currency)}</span>
                                  <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      p.status === 'APPROVED' || p.status === 'Paid' || p.status === 'DISBURSED'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-300 font-medium truncate">{p.eventTitle}</div>
                                <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                                  <span>{p.paymentMethod} ({p.momoNetwork || 'Bank'})</span>
                                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SETTINGS & VIRAL PROMOTION TOOLS */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">Organizer Profile Settings & Viral QR Tools</h2>
                    <p className="text-xs text-slate-400">Manage your agency profile, contact details, and marketing badge downloads.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Agency Profile Settings Form */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                      <h3 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">
                        Agency Profile & Contact Info
                      </h3>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Agency / Organizer Name</label>
                          <input
                            type="text"
                            value={settingsAgencyName}
                            onChange={(e) => setSettingsAgencyName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Support Phone Number</label>
                          <input
                            type="text"
                            value={settingsPhone}
                            onChange={(e) => setSettingsPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Mobile Money Payout Number</label>
                          <input
                            type="text"
                            value={settingsMomoNumber}
                            onChange={(e) => setSettingsMomoNumber(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => showToast('✅ Organizer profile updated successfully!')}
                          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow"
                        >
                          Save Settings
                        </button>
                      </div>
                    </div>

                    {/* Viral QR & Poster Marketing Tools */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                      <h3 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-amber-400" />
                        <span>Viral Voting Posters & QR Codes</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Generate customized voting flyers and QR codes for your nominees to share on Instagram, TikTok, and WhatsApp.
                      </p>

                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center shrink-0">
                          <QrCode className="w-full h-full text-slate-950" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-white">Nominee QR Code Batch</h4>
                          <p className="text-[11px] text-slate-400">Scan to open voting page for active contest.</p>
                          <button
                            type="button"
                            onClick={() => showToast('📥 QR code batch downloaded to device!')}
                            className="text-xs font-bold text-amber-400 hover:underline cursor-pointer block pt-1"
                          >
                            Download All Nominee QR Codes (.ZIP) →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* MODALS */}

      {/* 1. PAYSTACK TRANSFER API PROGRESS MODAL POPUP */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl text-white"
            >
              <div className="w-20 h-20 bg-amber-400/20 text-amber-400 rounded-3xl flex items-center justify-center mx-auto border border-amber-400/30">
                {completedPayoutRecord ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                ) : (
                  <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">
                  {completedPayoutRecord ? 'Payout Transfer Successful!' : 'Executing Paystack Transfer API'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {transferStepLabel}
                </p>
              </div>

              {/* Transfer Steps Indicator */}
              <div className="space-y-2 text-left bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                <div className={`flex items-center gap-2 ${activeTransferStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4" /> <span>1. Validating Subaccount Balance ({subaccount.subaccountCode})</span>
                </div>
                <div className={`flex items-center gap-2 ${activeTransferStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4" /> <span>2. Creating Paystack Transfer Recipient</span>
                </div>
                <div className={`flex items-center gap-2 ${activeTransferStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4" /> <span>3. Initiating Automated Bank/MoMo Disbursement</span>
                </div>
              </div>

              {completedPayoutRecord && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 space-y-1">
                  <div className="font-black">Transfer Reference: {completedPayoutRecord.id}</div>
                  <div>Disbursed to {completedPayoutRecord.accountName} ({completedPayoutRecord.accountNumber})</div>
                </div>
              )}

              {completedPayoutRecord && (
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-3.5 rounded-xl cursor-pointer shadow-lg"
                >
                  Done & Return to Payouts
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. CREATE NEW CONTEST MODAL */}
      <AnimatePresence>
        {showNewContestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreateContest}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Vote className="w-5 h-5 text-amber-400" />
                  <span>Create New Voting Contest</span>
                </h3>
                <button type="button" onClick={() => setShowNewContestModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Contest Title</label>
                  <input
                    type="text"
                    required
                    value={newContestTitle}
                    onChange={(e) => setNewContestTitle(e.target.value)}
                    placeholder="e.g. Ghana DJ Awards 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Description</label>
                  <textarea
                    rows={3}
                    value={newContestDesc}
                    onChange={(e) => setNewContestDesc(e.target.value)}
                    placeholder="Official voting portal description..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewContestModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-6 py-2.5 rounded-xl shadow cursor-pointer"
                >
                  Create Contest & Subaccount
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* 3. BULK NOMINEE UPLOAD MODAL */}
      <AnimatePresence>
        {showBulkUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span>Bulk Upload Nominees ({selectedContest.title})</span>
                </h3>
                <button onClick={() => setShowBulkUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-400">
                Paste comma-separated nominee details (one per line):<br />
                <span className="font-mono text-amber-400">Name, Category, Code, PhotoUrl, Bio</span>
              </p>

              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Stonebwoy, Artiste of the Year, GMA-001, https://..., Reggae Legend&#10;Sarkodie, Artiste of the Year, GMA-002, https://..., Rap King"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowBulkUploadModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkNomineeUpload}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-6 py-2.5 rounded-xl shadow cursor-pointer"
                >
                  Upload & Add Nominees
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. EDIT NOMINEE MODAL */}
      <AnimatePresence>
        {editingNominee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSaveEditNominee}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span>Edit Nominee: {editingNominee.name}</span>
                </h3>
                <button type="button" onClick={() => setEditingNominee(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Nominee Name</label>
                  <input
                    type="text"
                    required
                    value={editNomineeName}
                    onChange={(e) => setEditNomineeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Category</label>
                    <input
                      type="text"
                      required
                      value={editNomineeCategory}
                      onChange={(e) => setEditNomineeCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Voting Code</label>
                    <input
                      type="text"
                      required
                      value={editNomineeCode}
                      onChange={(e) => setEditNomineeCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-bold uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Photo URL</label>
                  <input
                    type="url"
                    required
                    value={editNomineePhotoUrl}
                    onChange={(e) => setEditNomineePhotoUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Bio / Tagline</label>
                  <input
                    type="text"
                    value={editNomineeBio}
                    onChange={(e) => setEditNomineeBio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNominee(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-6 py-2.5 rounded-xl shadow cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* 5. NOMINEE BADGE & QR CODE MODAL */}
      <AnimatePresence>
        {selectedNomineeForBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl text-white"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="font-extrabold text-sm text-white">Nominee Voting Pass & QR</h4>
                <button onClick={() => setSelectedNomineeForBadge(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <img src={selectedNomineeForBadge.photoUrl} alt={selectedNomineeForBadge.name} className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-amber-400 shadow-md" />
                <div>
                  <h5 className="font-black text-base text-white">{selectedNomineeForBadge.name}</h5>
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 mt-1 inline-block">
                    {selectedNomineeForBadge.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{selectedNomineeForBadge.category}</p>

                <div className="w-32 h-32 bg-white rounded-xl p-2 mx-auto flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-950" />
                </div>
              </div>

              <button
                onClick={() => {
                  showToast('📥 Nominee flyer downloaded!');
                  setSelectedNomineeForBadge(null);
                }}
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-3 rounded-xl cursor-pointer"
              >
                Download Voting Poster (.PNG)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default OrganizerPortal;

