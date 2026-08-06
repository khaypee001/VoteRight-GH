import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, DollarSign, Settings, Search, 
  Smartphone, Building2, Check, Copy, CheckCircle2, 
  Loader2, Zap, Upload, Edit2, QrCode, Trash2, Shield, 
  ArrowUpRight, Award
} from 'lucide-react';

interface Nominee {
  id: string;
  name: string;
  category: string;
  code: string;
  photoUrl: string;
  bio?: string;
  votesCount: number;
  revenueGenerated: number;
}

interface PayoutRequest {
  id: string;
  amount: number;
  paymentMethod: string;
  momoNetwork?: string;
  accountNumber: string;
  accountName: string;
  status: string;
  eventTitle: string;
  createdAt: string;
}

export const OrganizerPortal: React.FC = () => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'nominees' | 'categories' | 'analytics' | 'payouts' | 'settings'>('overview');
  const [currency, setCurrency] = useState<'GHS' | 'USD'>('GHS');

  // Toast / Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nominees State
  const [nominees, setNominees] = useState<Nominee[]>([
    { id: '1', name: 'Stonebwoy', category: 'Artiste of the Year', code: 'GMA-001', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', bio: 'Reggae & Dancehall powerhouse', votesCount: 14250, revenueGenerated: 42750 },
    { id: '2', name: 'Sarkodie', category: 'Artiste of the Year', code: 'GMA-002', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', bio: 'Rap King & Global Icon', votesCount: 18920, revenueGenerated: 56760 },
    { id: '3', name: 'Black Sherif', category: 'Artiste of the Year', code: 'GMA-003', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', bio: 'Koinonia & Street Anthem King', votesCount: 22400, revenueGenerated: 67200 },
    { id: '4', name: 'King Promise', category: 'Best Male Vocalist', code: 'GMA-004', photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', bio: 'Smooth R&B & Afrobeats vibe', votesCount: 8400, revenueGenerated: 25200 },
  ]);

  const [searchNomineeQuery, setSearchNomineeQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Bulk Upload Modal
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Edit Nominee Modal
  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null);
  const [editNomineeName, setEditNomineeName] = useState('');
  const [editNomineeCategory, setEditNomineeCategory] = useState('');
  const [editNomineeCode, setEditNomineeCode] = useState('');
  const [editNomineePhotoUrl, setEditNomineePhotoUrl] = useState('');
  const [editNomineeBio, setEditNomineeBio] = useState('');

  // Nominee QR Card Badge Modal
  const [selectedNomineeForBadge, setSelectedNomineeForBadge] = useState<Nominee | null>(null);

  // Financials & Payouts State
  const totalVotes = nominees.reduce((acc, curr) => acc + curr.votesCount, 0);
  const grossRevenue = nominees.reduce((acc, curr) => acc + curr.revenueGenerated, 0);
  const organizerCommission = grossRevenue * 0.85; // 85% payout share for organizer
  const [withdrawnAmount, setWithdrawnAmount] = useState<number>(35000);
  const availableBalance = organizerCommission - withdrawnAmount;

  // Payout Form State
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'Mobile Money' | 'Bank Transfer'>('Mobile Money');
  const [momoNetwork, setMomoNetwork] = useState('MTN MoMo');
  const [bankName, setBankName] = useState('Ecobank Ghana');
  const [accountNumber, setAccountNumber] = useState('0244123456');
  const [accountName, setAccountName] = useState('Kwame Event Agency');
  
  const [payoutRequestsHistory, setPayoutRequestsHistory] = useState<PayoutRequest[]>([
    { id: 'PR-101', amount: 20000, paymentMethod: 'Mobile Money', momoNetwork: 'MTN MoMo', accountNumber: '0244123456', accountName: 'Kwame Event Agency', status: 'SUCCESS', eventTitle: 'Ghana Music Awards 2026', createdAt: '2026-08-01' },
    { id: 'PR-102', amount: 15000, paymentMethod: 'Bank Transfer', accountNumber: '144100029384', accountName: 'Kwame Event Agency', status: 'SUCCESS', eventTitle: 'Ghana Music Awards 2026', createdAt: '2026-08-04' },
  ]);

  // Paystack Transfer Simulation Modal
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [activeTransferStep, setActiveTransferStep] = useState(1);
  const [transferStepLabel, setTransferStepLabel] = useState('Validating Paystack Subaccount...');
  const [completedPayoutRecord, setCompletedPayoutRecord] = useState<PayoutRequest | null>(null);

  // Subaccount Details
  const subaccount = {
    subaccountCode: 'ACCT_voteright_gh_9921',
    businessName: 'Vote Right Official Agency',
    settlementBank: 'GTBank Ghana',
    accountNumber: '2019382910',
    accountName: 'Khay Hub Tech Ltd',
    percentageCharge: 15
  };
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyCode = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Settings & Viral Promo
  const [settingsAgencyName, setSettingsAgencyName] = useState('Khay Hub Events & Awards');
  const [settingsPhone, setSettingsPhone] = useState('+233 24 555 7890');
  const [settingsMomoNumber, setSettingsMomoNumber] = useState('0244123456');
  const [, setShowPosterModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyVotingLink = () => {
    navigator.clipboard.writeText('https://voterightgh.com/vote/gma-2026');
    setCopiedLink(true);
    showToast('Copied public voting URL to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Handlers for Nominees
  const handleBulkNomineeUpload = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    const newItems: Nominee[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        newItems.push({
          id: `bulk-${Date.now()}-${idx}`,
          name: parts[0]?.trim() || 'New Nominee',
          category: parts[1]?.trim() || 'General Category',
          code: parts[2]?.trim() || `GMA-99${idx}`,
          photoUrl: parts[3]?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          bio: parts[4]?.trim() || 'Imported nominee',
          votesCount: 0,
          revenueGenerated: 0
        });
      }
    });

    if (newItems.length > 0) {
      setNominees([...nominees, ...newItems]);
      setShowBulkUploadModal(false);
      setBulkText('');
      showToast(`Successfully imported ${newItems.length} nominees!`);
    } else {
      showToast('Invalid CSV format. Please check instructions.');
    }
  };

  const handleOpenEditNominee = (n: Nominee) => {
    setEditingNominee(n);
    setEditNomineeName(n.name);
    setEditNomineeCategory(n.category);
    setEditNomineeCode(n.code);
    setEditNomineePhotoUrl(n.photoUrl);
    setEditNomineeBio(n.bio || '');
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
    showToast('Nominee updated successfully!');
  };

  const handleDeleteNominee = (id: string) => {
    if (window.confirm('Are you sure you want to delete this nominee?')) {
      setNominees(nominees.filter(n => n.id !== id));
      showToast('Nominee deleted.');
    }
  };

  // Financial Payout Trigger
  const handleSelectPreset = (percent: number) => {
    const calculated = (availableBalance * percent) / 100;
    setPayoutAmount(calculated.toFixed(2));
  };

  const handleAuthorizePayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid payout amount.');
      return;
    }
    if (amt > availableBalance) {
      showToast('Requested payout exceeds available balance.');
      return;
    }

    setIsTransferModalOpen(true);
    setActiveTransferStep(1);
    setTransferStepLabel('Validating Paystack Subaccount & Split configuration...');

    setTimeout(() => {
      setActiveTransferStep(2);
      setTransferStepLabel('Creating Paystack Transfer Recipient (Mobile Money / Bank)...');
    }, 1500);

    setTimeout(() => {
      setActiveTransferStep(3);
      setTransferStepLabel('Executing instant API transfer & locking ledger balance...');
    }, 3200);

    setTimeout(() => {
      const newRecord: PayoutRequest = {
        id: `PR-${Date.now().toString().slice(-4)}`,
        amount: amt,
        paymentMethod,
        momoNetwork: payoutMethod === 'Mobile Money' ? momoNetwork : undefined,
        accountNumber,
        accountName,
        status: 'SUCCESS',
        eventTitle: 'Ghana Music Awards 2026',
        createdAt: new Date().toISOString().split('T')[0]
      };

      setWithdrawnAmount(prev => prev + amt);
      setPayoutRequestsHistory([newRecord, ...payoutRequestsHistory]);
      setCompletedPayoutRecord(newRecord);
      setIsSubmittingPayout(false);
      showToast(`Successfully disbursed GHS ${amt.toFixed(2)} via Paystack!`);
    }, 5000);
  };

  const formatPrice = (amt: number, curr: 'GHS' | 'USD') => {
    if (curr === 'USD') {
      return `$${(amt / 15.5).toFixed(2)}`;
    }
    return `GHS ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const categoriesList = ['All', ...Array.from(new Set(nominees.map(n => n.category)))];
  const filteredNominees = nominees.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchNomineeQuery.toLowerCase()) || n.code.toLowerCase().includes(searchNomineeQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || n.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-20 selection:bg-amber-400 selection:text-slate-950">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 bg-amber-400 text-slate-950 px-5 py-3 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-2 border border-amber-300"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Banner */}
      <header className="border-b border-slate-900 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black text-slate-950 text-lg">
              VR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">Vote Right Organizer</h1>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                  GMA 2026 Live ⚡
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Khay Hub Secured Management Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Toggle */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center text-xs font-bold">
              <button
                onClick={() => setCurrency('GHS')}
                className={`px-3 py-1 rounded-lg transition-all ${currency === 'GHS' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'}`}
              >
                GHS (₵)
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-lg transition-all ${currency === 'USD' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'}`}
              >
                USD ($)
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              <span className="text-xs font-bold text-slate-300">Paystack Split Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Votes Cast</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {totalVotes.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% today
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {formatPrice(grossRevenue, currency)}
            </div>
            <div className="text-[11px] text-blue-400 font-mono">
              Paystack Split: 85% Organizer
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Balance</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {formatPrice(availableBalance, currency)}
            </div>
            <button 
              onClick={() => setActiveTab('payouts')}
              className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              Withdraw Instantly ⚡
            </button>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Nominees</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {nominees.length}
            </div>
            <div className="text-[11px] text-purple-400 font-bold">
              Across {categoriesList.length - 1} Categories
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-900">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Overview & Live Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('nominees')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'nominees' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Nominees & QR Badges
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" /> Voting Analytics & Charts
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'payouts' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Paystack Payouts ⚡
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings & Viral Tools
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
          
          {/* TAB 1: OVERVIEW & LIVE LEADERBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white">Live Voting Leaderboard</h3>
                  <p className="text-xs text-slate-400">Real-time vote aggregation across all categories for Ghana Music Awards 2026.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('payouts')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Zap className="w-4 h-4" /> Request Payout Now
                  </button>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Rank & Nominee</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4 text-right">Votes</th>
                        <th className="py-3 px-4 text-right">Revenue ({currency})</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-medium">
                      {nominees
                        .sort((a, b) => b.votesCount - a.votesCount)
                        .map((nom, idx) => (
                          <tr key={nom.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3.5 px-4 flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                                idx === 0 ? 'bg-amber-400 text-slate-950 shadow' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                                #{idx + 1}
                              </span>
                              <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                                <img src={nom.photoUrl} alt={nom.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-extrabold text-white">{nom.name}</div>
                                <div className="text-[10px] text-slate-400">{nom.bio}</div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">{nom.category}</td>
                            <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">{nom.code}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{nom.votesCount.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-bold">{formatPrice(nom.revenueGenerated, currency)}</td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setSelectedNomineeForBadge(nom)}
                                className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl transition-all cursor-pointer"
                                title="View QR Code & Voting Badge"
                              >
                                <QrCode className="w-4 h-4 text-amber-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOMINEES & QR BADGES */}
          {activeTab === 'nominees' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white">Nominees & Contestant Management</h3>
                  <p className="text-xs text-slate-400">Add, edit, bulk upload, or generate promotional voting cards for your nominees.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4 text-amber-400" /> Bulk CSV Upload
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchNomineeQuery}
                    onChange={(e) => setSearchNomineeQuery(e.target.value)}
                    placeholder="Search by name or voting code..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                        selectedCategoryFilter === cat ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nominees Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredNominees.map(nom => (
                  <div key={nom.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                      <button onClick={() => handleOpenEditNominee(nom)} className="p-1.5 hover:bg-slate-800 rounded-lg text-blue-400" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteNominee(nom.id)} className="p-1.5 hover:bg-slate-800 rounded-lg text-red-400" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto border-2 border-slate-800 shadow-lg">
                      <img src={nom.photoUrl} alt={nom.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="text-center">
                      <h4 className="font-extrabold text-sm text-white">{nom.name}</h4>
                      <p className="text-[11px] text-slate-400">{nom.category}</p>
                      <div className="inline-block bg-amber-500/10 text-amber-400 font-mono font-black text-xs px-3 py-1 rounded-full mt-2 border border-amber-500/20">
                        Code: {nom.code}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500">Total Votes</div>
                        <div className="font-mono font-bold text-white">{nom.votesCount.toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => setSelectedNomineeForBadge(nom)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Badge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VOTING ANALYTICS & CHARTS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">Voting Analytics & Revenue Insights</h3>
                <p className="text-xs text-slate-400">Deep dive into voting velocity, peak traffic hours, and revenue distribution.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 md:col-span-2">
                  <h4 className="font-extrabold text-white text-sm">Vote Velocity (Last 7 Days)</h4>
                  <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-900">
                    {[
                      { day: 'Mon', count: 3200, height: '40%' },
                      { day: 'Tue', count: 4800, height: '60%' },
                      { day: 'Wed', count: 5400, height: '68%' },
                      { day: 'Thu', count: 7100, height: '85%' },
                      { day: 'Fri', count: 9800, height: '100%' },
                      { day: 'Sat', count: 8500, height: '90%' },
                      { day: 'Sun', count: 6200, height: '75%' },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[10px] font-mono text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {bar.count}
                        </div>
                        <div 
                          style={{ height: bar.height }} 
                          className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xl transition-all group-hover:brightness-125"
                        ></div>
                        <span className="text-[11px] font-bold text-slate-400">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Peak traffic recorded on Friday evenings.</span>
                    <span className="text-emerald-400 font-bold">Stable server uptime 99.99%</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="font-extrabold text-white text-sm">Payment Channels</h4>
                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <div className="flex justify-between mb-1 font-bold">
                        <span className="text-slate-300">MTN Mobile Money</span>
                        <span className="text-amber-400 font-mono">68%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full w-[68%] rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 font-bold">
                        <span className="text-slate-300">Telecel Cash</span>
                        <span className="text-blue-400 font-mono">22%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full w-[22%] rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 font-bold">
                        <span className="text-slate-300">Bank Cards & AT</span>
                        <span className="text-purple-400 font-mono">10%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full w-[10%] rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYSTACK PAYOUTS & AUTOMATED SETTLEMENTS */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white">Paystack Instant Payout & Settlement Gateway</h3>
                  <p className="text-xs text-slate-400">Disburse your organizer earnings instantly to Mobile Money or Bank Accounts via Paystack Transfer API.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Secured by Paystack Split
                </div>
              </div>

              {/* Payout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Request Payout Form */}
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <h4 className="font-extrabold text-white text-sm">Initiate Payout Request</h4>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      Available: {formatPrice(availableBalance, currency)}
                    </span>
                  </div>

                  <form onSubmit={handleAuthorizePayout} className="space-y-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-bold">Payout Amount (GHS)</label>
                        <span className="text-slate-400 font-mono text-[11px]">
                          Max: GHS {availableBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">GHS</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          max={availableBalance}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-emerald-400 font-mono font-black text-base focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(25)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer"
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(50)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(100)}
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer"
                        >
                          100% (Max)
                        </button>
                      </div>
                    </div>

                    {/* Payout Method */}
                    <div>
                      <label className="text-slate-300 block mb-1 font-bold">Destination Payout Method</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('Mobile Money')}
                          className={`p-3 rounded-xl border text-left font-bold flex items-center gap-2 cursor-pointer transition-all ${
                            payoutMethod === 'Mobile Money'
                              ? 'bg-emerald-950/40 border-emerald-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Mobile Money</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayoutMethod('Bank Transfer')}
                          className={`p-3 rounded-xl border text-left font-bold flex items-center gap-2 cursor-pointer transition-all ${
                            payoutMethod === 'Bank Transfer'
                              ? 'bg-emerald-950/40 border-emerald-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>Bank Account</span>
                        </button>
                      </div>
                    </div>

                    {/* Conditional Network or Bank Dropdown */}
                    {payoutMethod === 'Mobile Money' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1">MoMo Network</label>
                          <select
                            value={momoNetwork}
                            onChange={(e) => setMomoNetwork(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none"
                          >
                            <option value="MTN MoMo">MTN MoMo</option>
                            <option value="Telecel Cash">Telecel Cash</option>
                            <option value="AT Money">AT Money (AirtelTigo)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">MoMo Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="024XXXXXXX"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1">Select Bank</label>
                          <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none"
                          >
                            <option value="Ecobank Ghana">Ecobank Ghana</option>
                            <option value="GCB Bank">GCB Bank</option>
                            <option value="Stanbic Bank Ghana">Stanbic Bank Ghana</option>
                            <option value="Fidelity Bank Ghana">Fidelity Bank Ghana</option>
                            <option value="Access Bank">Access Bank</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Account Number</label>
                          <input
                            type="text"
                            required
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Enter bank account number"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-slate-400 block mb-1">Registered Account Name</label>
                      <input
                        type="text"
                        required
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Full name as registered on MoMo/Bank"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPayout || availableBalance <= 0}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingPayout ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Processing Paystack Transfer API...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-slate-950" />
                          <span>Authorize & Disburse Payout Instantly ⚡</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>

                {/* Right Column: Payout History & Paystack API Explainer (Slide In Right) */}
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className="lg:col-span-5 space-y-5"
                >
                  {/* Paystack Subaccount Details Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" /> Paystack Subaccount Info
                      </span>
                      <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                        {subaccount.percentageCharge}% Split
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Subaccount Code:</span>
                        <span className="text-white font-bold flex items-center gap-1">
                          {subaccount.subaccountCode}
                          <button onClick={() => handleCopyCode(subaccount.subaccountCode, 'Subaccount Code')} className="text-amber-400 hover:text-white">
                            {copiedText === subaccount.subaccountCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Settlement Bank:</span>
                        <span className="text-emerald-400 font-bold">{subaccount.settlementBank}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Account Number:</span>
                        <span className="text-white font-bold">{subaccount.accountNumber}</span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Account Name:</span>
                        <span className="text-white font-bold">{subaccount.accountName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payout History Ledger */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-extrabold text-white text-sm">Payout History Ledger</h5>
                      <span className="text-xs font-mono text-slate-400">{payoutRequestsHistory.length} requests</span>
                    </div>

                    {payoutRequestsHistory.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500">
                        No payout requests initiated yet.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {payoutRequestsHistory.map((req) => (
                          <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white font-mono">{formatPrice(req.amount, currency)}</span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {req.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">{req.eventTitle}</div>
                            <div className="text-[10px] text-slate-500 flex justify-between font-mono">
                              <span>{req.paymentMethod} • {req.accountNumber}</span>
                              <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS & VIRAL TOOLS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black text-white">Organizer Profile Settings & Viral Promo Tools</h4>
                <p className="text-xs text-slate-400">Manage your agency brand identity and promotional marketing assets.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Agency Branding Form */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h5 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">Agency Profile Branding</h5>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-300 block mb-1 font-bold">Organizer / Agency Name</label>
                      <input
                        type="text"
                        value={settingsAgencyName}
                        onChange={(e) => setSettingsAgencyName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-bold">Contact Phone Number</label>
                      <input
                        type="text"
                        value={settingsPhone}
                        onChange={(e) => setSettingsPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-bold">Default MoMo Payout Number</label>
                      <input
                        type="text"
                        value={settingsMomoNumber}
                        onChange={(e) => setSettingsMomoNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => showToast('✅ Organizer profile settings saved successfully!')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>

                {/* Viral Promo Flyer Generator */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h5 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">Viral Promo & QR Tools</h5>
                  <p className="text-xs text-slate-400">Generate custom QR codes and promotional flyers for social media (Instagram, TikTok, WhatsApp).</p>

                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Event Voting QR Poster</div>
                        <div className="text-[11px] text-slate-400">Instant scan-to-vote QR generator</div>
                      </div>
                      <button
                        onClick={() => setShowPosterModal(true)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl cursor-pointer"
                      >
                        Generate Poster ⚡
                      </button>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Share Voting Link</div>
                        <div className="text-[11px] text-slate-400">Direct voting URL for WhatsApp groups</div>
                      </div>
                      <button
                        onClick={handleCopyVotingLink}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
                      >
                        {copiedLink ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* BULK NOMINEE UPLOAD MODAL */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-amber-400 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Bulk Nominee CSV / Text Upload
              </h3>
              <button onClick={() => setShowBulkUploadModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Paste your nominees below, one per line in the format: <br />
              <code className="text-amber-400 font-mono text-[11px]">Name, Category, Code, PhotoUrl, Bio</code>
            </p>

            <textarea
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Stonebwoy, Best Artiste, GMA-001, https://..., Reggae King\nSarkodie, Best Artiste, GMA-002, https://..., Rap Icon`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkUploadModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkNomineeUpload}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Import All Nominees ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT NOMINEE MODAL */}
      {editingNominee && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <form onSubmit={handleSaveEditNominee} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-blue-400 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit Nominee Details
              </h3>
              <button type="button" onClick={() => setEditingNominee(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Full / Stage Name</label>
                <input
                  type="text"
                  required
                  value={editNomineeName}
                  onChange={(e) => setEditNomineeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Category</label>
                <input
                  type="text"
                  required
                  value={editNomineeCategory}
                  onChange={(e) => setEditNomineeCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Unique Voting Code</label>
                <input
                  type="text"
                  required
                  value={editNomineeCode}
                  onChange={(e) => setEditNomineeCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-bold uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Photo URL</label>
                <input
                  type="url"
                  required
                  value={editNomineePhotoUrl}
                  onChange={(e) => setEditNomineePhotoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Bio</label>
                <textarea
                  rows={2}
                  value={editNomineeBio}
                  onChange={(e) => setEditNomineeBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNominee(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NOMINEE QR & CARD MODAL */}
      {selectedNomineeForBadge && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-white text-center">
            <div className="flex justify-end">
              <button onClick={() => setSelectedNomineeForBadge(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto border-2 border-amber-400 shadow-xl">
              <img src={selectedNomineeForBadge.photoUrl} alt={selectedNomineeForBadge.name} className="w-full h-full object-cover" />
            </div>

            <div>
              <h4 className="font-black text-lg text-white">{selectedNomineeForBadge.name}</h4>
              <p className="text-xs text-slate-400">{selectedNomineeForBadge.category}</p>
              <div className="inline-block bg-amber-400 text-slate-950 font-black text-sm px-4 py-1 rounded-full mt-2 font-mono">
                Code: {selectedNomineeForBadge.code}
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl w-36 h-36 mx-auto flex items-center justify-center shadow">
              <QrCode className="w-28 h-28 text-slate-950" />
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedNomineeForBadge.code);
                showToast(`Copied voting code ${selectedNomineeForBadge.code}!`);
                setSelectedNomineeForBadge(null);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer"
            >
              Copy Voting Code
            </button>
          </div>
        </div>
      )}

      {/* PAYSTACK TRANSFER API PROGRESS & SUCCESS MODAL */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl text-white"
            >
              {completedPayoutRecord ? (
                <>
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-emerald-400">Paystack Transfer Successful! ⚡</h3>
                    <p className="text-xs text-slate-300 mt-2">
                      Successfully transferred <span className="font-bold text-white font-mono">{formatPrice(completedPayoutRecord.amount, currency)}</span> to <span className="text-white font-bold">{completedPayoutRecord.accountName}</span> ({completedPayoutRecord.accountNumber}).
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl font-mono text-[10px] text-slate-400 text-left space-y-1">
                    <div>Transfer ID: TRF_{Math.floor(100000 + Math.random() * 900000)}</div>
                    <div>Recipient: {completedPayoutRecord.momoNetwork || completedPayoutRecord.paymentMethod}</div>
                    <div>Status: DISBURSED / SUCCESS</div>
                  </div>

                  <button
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setCompletedPayoutRecord(null);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3.5 rounded-xl cursor-pointer shadow-lg"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30 animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Paystack API Automated Transfer</h3>
                    <p className="text-xs text-blue-400 font-mono mt-2">{transferStepLabel}</p>
                  </div>

                  <div className="space-y-2 text-left text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className={`flex items-center gap-2 ${activeTransferStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-4 h-4" /> 1. Validating Paystack Subaccount
                    </div>
                    <div className={`flex items-center gap-2 ${activeTransferStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-4 h-4" /> 2. Creating Transfer Recipient Code
                    </div>
                    <div className={`flex items-center gap-2 ${activeTransferStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      <Loader2 className={`w-4 h-4 ${activeTransferStep === 3 ? 'animate-spin' : ''}`} /> 3. Initiating Instant Payout Transfer
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

