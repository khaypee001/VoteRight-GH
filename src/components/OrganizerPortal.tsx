import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, Ticket, Award, QrCode, Wallet, Settings, 
  Plus, Copy, Download, Edit2, Trash2, CheckCircle2, 
  Smartphone, Building2, Zap, Clock, Upload, Search, Filter, 
  ArrowUpRight, DollarSign, ShieldAlert, LogOut
} from 'lucide-react';

export const VoteRightDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currency, setCurrency] = useState('GHS');
  
  // States for modals & tools
  const [selectedNomineeForBadge, setSelectedNomineeForBadge] = useState(null);
  const [editingNominee, setEditingNominee] = useState(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Edit Nominee form states
  const [editNomineeName, setEditNomineeName] = useState('');
  const [editNomineeCategory, setEditNomineeCategory] = useState('');
  const [editNomineeCode, setEditNomineeCode] = useState('');
  const [editNomineePhotoUrl, setEditNomineePhotoUrl] = useState('');
  const [editNomineeBio, setEditNomineeBio] = useState('');

  // Add Nominee form states
  const [newNomineeName, setNewNomineeName] = useState('');
  const [newNomineeCategory, setNewNomineeCategory] = useState('Best Artiste of the Year');
  const [newNomineeCode, setNewNomineeCode] = useState('GMA-105');
  const [newNomineePhotoUrl, setNewNomineePhotoUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300');
  const [newNomineeBio, setNewNomineeBio] = useState('Rising music star');

  // Payout states
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('Mobile Money');
  const [momoNetwork, setMomoNetwork] = useState('MTN MoMo');
  const [bankName, setBankName] = useState('Ecobank Ghana');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(14580.00);

  // Transfer modal progression
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [activeTransferStep, setActiveTransferStep] = useState(1);
  const [transferStepLabel, setTransferStepLabel] = useState('Validating Subaccount Balance...');
  const [completedPayoutRecord, setCompletedPayoutRecord] = useState(null);

  // Settings
  const [settingsAgencyName, setSettingsAgencyName] = useState('VoteRight Ghana Events');
  const [settingsPhone, setSettingsPhone] = useState('+233 24 400 1122');

  // Nominees list state
  const [nominees, setNominees] = useState([
    { id: 1, name: 'Stonebwoy', category: 'Artiste of the Year', code: 'GMA-001', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', votes: 14250, revenue: 'GHS 71,250' },
    { id: 2, name: 'Sarkodie', category: 'Artiste of the Year', code: 'GMA-002', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', votes: 12900, revenue: 'GHS 64,500' },
    { id: 3, name: 'Black Sherif', category: 'Artiste of the Year', code: 'GMA-003', photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300', votes: 11840, revenue: 'GHS 59,200' },
    { id: 4, name: 'King Promise', category: 'Artiste of the Year', code: 'GMA-004', photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300', votes: 9710, revenue: 'GHS 48,550' },
  ]);

  // Payout History
  const [payoutRequestsHistory, setPayoutRequestsHistory] = useState([
    { id: 'PAY-8821', amount: 5000, paymentMethod: 'Mobile Money', momoNetwork: 'MTN MoMo', accountNumber: '0244998877', accountName: 'Kwame Organizer', status: 'Successful', createdAt: '2026-07-28' },
    { id: 'PAY-7712', amount: 3200, paymentMethod: 'Bank Transfer', momoNetwork: 'Ecobank', accountNumber: '14410029384', accountName: 'Kwame Organizer', status: 'Successful', createdAt: '2026-07-15' },
  ]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatPrice = (amt, curr) => `${curr} ${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const handleCopyCode = (code, label = 'Code') => {
    navigator.clipboard.writeText(code);
    showToast(`📋 ${label} "${code}" copied to clipboard!`);
  };

  const handleSelectPreset = (percentage) => {
    const calculated = (availableBalance * percentage) / 100;
    setPayoutAmount(calculated.toFixed(2));
  };

  const handleOpenEditNominee = (nom) => {
    setEditingNominee(nom);
    setEditNomineeName(nom.name);
    setEditNomineeCategory(nom.category);
    setEditNomineeCode(nom.code);
    setEditNomineePhotoUrl(nom.photoUrl);
    setEditNomineeBio(nom.bio || 'Nominee bio here');
  };

  const handleSaveEditNominee = (e) => {
    e.preventDefault();
    setNominees(nominees.map(n => n.id === editingNominee.id ? {
      ...n,
      name: editNomineeName,
      category: editNomineeCategory,
      code: editNomineeCode,
      photoUrl: editNomineePhotoUrl,
      bio: editNomineeBio
    } : n));
    setEditingNominee(null);
    showToast(`✅ Nominee "${editNomineeName}" updated successfully!`);
  };

  const handleDeleteNominee = (id) => {
    setNominees(nominees.filter(n => n.id !== id));
    showToast('🗑️ Nominee removed successfully.');
  };

  const handleAddNominee = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      name: newNomineeName,
      category: newNomineeCategory,
      code: newNomineeCode,
      photoUrl: newNomineePhotoUrl,
      votes: 0,
      revenue: 'GHS 0.00',
      bio: newNomineeBio
    };
    setNominees([newEntry, ...nominees]);
    setNewNomineeName('');
    showToast(`🌟 Nominee "${newNomineeName}" added successfully!`);
  };

  const handleBulkNomineeUpload = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    let addedCount = 0;
    const newItems = [...nominees];

    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        newItems.unshift({
          id: Date.now() + Math.random(),
          name: parts[0],
          category: parts[1],
          code: parts[2],
          photoUrl: parts[3] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
          votes: 0,
          revenue: 'GHS 0.00',
          bio: parts[4] || 'Imported Nominee'
        });
        addedCount++;
      }
    });

    setNominees(newItems);
    setShowBulkUploadModal(false);
    setBulkText('');
    showToast(`🚀 Successfully bulk-imported ${addedCount} nominees!`);
  };

  const handleRequestPayout = (e) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (!amt || amt <= 0) {
      showToast('⚠️ Please enter a valid payout amount.');
      return;
    }
    if (amt > availableBalance) {
      showToast('⚠️ Insufficient available balance for payout.');
      return;
    }

    // Trigger Paystack Transfer simulation modal
    setIsTransferModalOpen(true);
    setActiveTransferStep(1);
    setTransferStepLabel('Validating Subaccount Balance with Paystack API...');
    setCompletedPayoutRecord(null);

    setTimeout(() => {
      setActiveTransferStep(2);
      setTransferStepLabel(`Creating Transfer Recipient (${accountNumber} - ${momoNetwork || bankName})...`);
    }, 1500);

    setTimeout(() => {
      setActiveTransferStep(3);
      setTransferStepLabel('Executing Automated Instant Payout Transfer...');
    }, 3000);

    setTimeout(() => {
      const newRecord = {
        id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: amt,
        paymentMethod: payoutMethod,
        momoNetwork: payoutMethod === 'Mobile Money' ? momoNetwork : bankName,
        accountNumber,
        accountName,
        status: 'Successful',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setAvailableBalance(prev => prev - amt);
      setPayoutRequestsHistory([newRecord, ...payoutRequestsHistory]);
      setCompletedPayoutRecord(newRecord);
      setPayoutAmount('');
      setAccountNumber('');
      setAccountName('');
    }, 4500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans relative"
    >
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold font-mono">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Dashboard */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        
        {/* Top Header Bar */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-lg">
              VR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg text-white">VoteRight Ghana</h1>
                <span className="bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Organizer Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Event: 2026 Ghana Music Awards & Voting Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Currency Switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center">
              {['GHS', 'USD', 'NGN'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    currency === c ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Log Out Button */}
            <button
              onClick={() => showToast('👋 Logged out successfully!')}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="bg-slate-900/80 border-b border-slate-800/80 px-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 py-3 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'nominees', label: 'Nominees & Codes', icon: Users },
              { id: 'voting', label: 'USSD & Web Voting', icon: Ticket },
              { id: 'revenue', label: 'Revenue & Analytics', icon: DollarSign },
              { id: 'payouts', label: 'Instant Payouts', icon: Wallet },
              { id: 'settings', label: 'Settings & Tools', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' 
                      : 'bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="p-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                  <div className="text-xs font-bold text-slate-400">Total Votes Cast</div>
                  <div className="text-2xl font-black font-mono text-white">48,700</div>
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% today
                  </div>
                  <div className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                    <Ticket className="w-5 h-5"/>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                  <div className="text-xs font-bold text-slate-400">Total Gross Revenue</div>
                  <div className="text-2xl font-black font-mono text-amber-400">{formatPrice(243500, currency)}</div>
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> USSD & Web active
                  </div>
                  <div className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-5 h-5"/>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                  <div className="text-xs font-bold text-slate-400">Available Payout Balance</div>
                  <div className="text-2xl font-black font-mono text-emerald-400">{formatPrice(availableBalance, currency)}</div>
                  <button 
                    onClick={() => setActiveTab('payouts')}
                    className="text-[11px] text-amber-400 font-bold hover:underline block"
                  >
                    Withdraw via Paystack →
                  </button>
                  <div className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center">
                    <Wallet className="w-5 h-5"/>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                  <div className="text-xs font-bold text-slate-400">Active Nominees</div>
                  <div className="text-2xl font-black font-mono text-white">{nominees.length}</div>
                  <div className="text-[11px] text-slate-400 font-bold">Across 4 categories</div>
                  <div className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-purple-400/10 text-purple-400 flex items-center justify-center">
                    <Users className="w-5 h-5"/>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Live Leaderboard Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* USSD Shortcode Banner */}
                <div className="lg:col-span-1 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                      USSD Live Shortcode
                    </span>
                    <h3 className="text-2xl font-black font-mono text-white mt-3">*928*123#</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Voters can dial this code on MTN, Telecel, and AT to cast votes instantly offline without internet!
                    </p>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">Web Portal URL:</span>
                    <button 
                      onClick={() => handleCopyCode('https://voteright.gh/gma2026', 'Portal URL')}
                      className="text-amber-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5"/> Copy Link
                    </button>
                  </div>
                </div>

                {/* Top Leaderboard */}
                <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400"/>
                      <span>Current Top Nominee Leaderboard</span>
                    </h4>
                    <button 
                      onClick={() => setActiveTab('nominees')}
                      className="text-xs text-amber-400 font-bold hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {nominees.slice(0, 3).map((nom, idx) => (
                      <div key={nom.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-800 font-mono text-xs font-black flex items-center justify-center text-amber-400">
                            #{idx + 1}
                          </span>
                          <img src={nom.photoUrl} alt={nom.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700"/>
                          <div>
                            <div className="font-black text-xs text-white">{nom.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{nom.category} • Code: <span className="text-amber-400 font-bold">{nom.code}</span></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-black text-xs text-amber-400">{nom.votes.toLocaleString()} votes</div>
                          <div className="text-[10px] text-emerald-400 font-mono font-bold">{nom.revenue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: NOMINEES & CODES */}
          {activeTab === 'nominees' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-black text-white">Nominee Management & Voting Codes</h4>
                  <p className="text-xs text-slate-400">Manage nominees, generate custom badges, and assign USSD shortcodes.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4 text-amber-400"/> Bulk CSV Upload
                  </button>
                </div>
              </div>

              {/* Add New Nominee Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h5 className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                  <Plus className="w-4 h-4"/> Add New Nominee
                </h5>
                <form onSubmit={handleAddNominee} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <input
                    type="text"
                    required
                    value={newNomineeName}
                    onChange={(e) => setNewNomineeName(e.target.value)}
                    placeholder="Nominee Full Name"
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    required
                    value={newNomineeCategory}
                    onChange={(e) => setNewNomineeCategory(e.target.value)}
                    placeholder="Category Name"
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    required
                    value={newNomineeCode}
                    onChange={(e) => setNewNomineeCode(e.target.value.toUpperCase())}
                    placeholder="Voting Code (e.g. GMA-105)"
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold uppercase focus:outline-none"
                  />
                  <input
                    type="url"
                    required
                    value={newNomineePhotoUrl}
                    onChange={(e) => setNewNomineePhotoUrl(e.target.value)}
                    placeholder="Photo Image URL"
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-2 rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4"/> Add Nominee
                  </button>
                </form>
              </div>

              {/* Nominees Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {nominees.map((nom) => (
                  <div key={nom.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 relative group">
                    <div className="w-full h-36 rounded-xl overflow-hidden relative border border-slate-800">
                      <img src={nom.photoUrl} alt={nom.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-amber-400 border border-slate-800">
                        {nom.code}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-black text-sm text-white">{nom.name}</h5>
                      <div className="text-[11px] text-slate-400 font-mono">{nom.category}</div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Votes:</span>
                      <span className="text-amber-400 font-bold">{nom.votes.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedNomineeForBadge(nom)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] py-2 rounded-xl border border-slate-800 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-400"/> Badge QR
                      </button>
                      <button
                        onClick={() => handleOpenEditNominee(nom)}
                        className="bg-slate-900 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 p-2 rounded-xl border border-slate-800 transition-all cursor-pointer"
                        title="Edit Nominee"
                      >
                        <Edit2 className="w-3.5 h-3.5"/>
                      </button>
                      <button
                        onClick={() => handleDeleteNominee(nom.id)}
                        className="bg-slate-900 hover:bg-red-600/20 text-slate-300 hover:text-red-400 p-2 rounded-xl border border-slate-800 transition-all cursor-pointer"
                        title="Delete Nominee"
                      >
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: USSD & WEB VOTING */}
          {activeTab === 'voting' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black text-white">USSD & Web Voting Configuration</h4>
                <p className="text-xs text-slate-400">Configure voting channels, pricing per vote, and gateway integrations.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h5 className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                    <Smartphone className="w-4 h-4"/> USSD Shortcode Integration
                  </h5>
                  <p className="text-xs text-slate-300">
                    Your dedicated shortcode is active across all major telecom networks in Ghana.
                  </p>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Shortcode:</span> <span className="text-amber-400 font-bold">*928*123#</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Network Partners:</span> <span className="text-white">MTN, Telecel, AT</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Price Per Vote:</span> <span className="text-white">GHS 5.00</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Gateway Status:</span> <span className="text-emerald-400 font-bold">CONNECTED & LIVE</span></div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h5 className="font-extrabold text-sm text-blue-400 flex items-center gap-2">
                    <Ticket className="w-4 h-4"/> Web Widget & Embed Code
                  </h5>
                  <p className="text-xs text-slate-300">
                    Embed this voting widget on any external website or blog.
                  </p>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <code>&lt;iframe src="https://voteright.gh/embed/gma2026" width="100%" height="600px" frameborder="0"&gt;&lt;/iframe&gt;</code>
                  </div>
                  <button
                    onClick={() => handleCopyCode('<iframe src="https://voteright.gh/embed/gma2026" width="100%" height="600px" frameborder="0"></iframe>', 'Embed Code')}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5"/> Copy Embed Widget Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVENUE & ANALYTICS */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black text-white">Revenue Analytics & Audit Trails</h4>
                <p className="text-xs text-slate-400">Real-time breakdown of vote sales, platform commissions, and net earnings.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <div className="text-xs font-bold text-slate-400">Gross Sales Revenue</div>
                  <div className="text-xl font-black font-mono text-white">{formatPrice(243500, currency)}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <div className="text-xs font-bold text-slate-400">Platform Commission (5%)</div>
                  <div className="text-xl font-black font-mono text-red-400">-{formatPrice(12175, currency)}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <div className="text-xs font-bold text-slate-400">Net Organizer Share</div>
                  <div className="text-xl font-black font-mono text-emerald-400">{formatPrice(231325, currency)}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INSTANT PAYOUTS */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black text-white">Instant Payouts via Paystack Transfer API</h4>
                <p className="text-xs text-slate-400">Withdraw your net voting revenue instantly to your Mobile Money wallet or Bank Account.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Payout Form */}
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-400"/>
                      <span>Disburse Voting Revenue</span>
                    </h5>
                    <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                      Paystack Instant Transfer
                    </span>
                  </div>

                  <form onSubmit={handleRequestPayout} className="space-y-4">
                    {/* Amount Field + Presets */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-300">Payout Amount (GHS)</label>
                        <span className="text-[11px] font-mono text-emerald-400">
                          Available: {formatPrice(availableBalance, currency)}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">GHS</span>
                        <input
                          type="number"
                          step="0.01"
                          max={availableBalance}
                          required
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-amber-400 font-mono font-black focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Preset Buttons */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold">Quick Select:</span>
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(25)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg text-slate-300 cursor-pointer"
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(50)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg text-slate-300 cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(75)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg text-slate-300 cursor-pointer"
                        >
                          75%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(100)}
                          className="bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-lg text-emerald-300 hover:text-white cursor-pointer ml-auto"
                        >
                          Max (100%)
                        </button>
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">Disbursement Channel</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('Mobile Money')}
                          className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            payoutMethod === 'Mobile Money'
                              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-4 h-4"/>
                          <span>Mobile Money</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('Bank Transfer')}
                          className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            payoutMethod === 'Bank Transfer'
                              ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Building2 className="w-4 h-4"/>
                          <span>Bank Account</span>
                        </button>
                      </div>
                    </div>

                    {/* Network or Bank Provider & Account Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {payoutMethod === 'Mobile Money' ? (
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">MoMo Network</label>
                          <select
                            value={momoNetwork}
                            onChange={(e) => setMomoNetwork(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
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
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                          >
                            <option value="Ecobank Ghana">Ecobank Ghana</option>
                            <option value="GCB Bank">GCB Bank</option>
                            <option value="Stanbic Bank Ghana">Stanbic Bank Ghana</option>
                            <option value="Fidelity Bank Ghana">Fidelity Bank Ghana</option>
                            <option value="Zenith Bank Ghana">Zenith Bank Ghana</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          {payoutMethod === 'Mobile Money' ? 'MoMo Number' : 'Account Number'}
                        </label>
                        <input
                          type="text"
                          required
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="0244998877"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        required
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Registered name on account"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPayout || availableBalance <= 0}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmittingPayout ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Processing Paystack Transfer API...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4"/>
                          <span>Disburse Payout Now via Paystack</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>

                {/* Right Column: Payout History & Paystack Transfer Logs */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400"/>
                        <span>Payout History & Transfer Logs</span>
                      </h5>
                      <span className="text-[10px] font-mono text-slate-400">
                        {payoutRequestsHistory.length} transactions
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {payoutRequestsHistory.map((p) => (
                        <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-amber-400">{formatPrice(p.amount, currency)}</span>
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              {p.status}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-white truncate">{p.eventTitle || 'Contest Payout'}</div>

                          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                            <span>{p.paymentMethod} • {p.momoNetwork || 'Bank'}</span>
                            <span className="text-slate-300">{p.accountNumber}</span>
                          </div>

                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between font-mono">
                            <span>Ref: {p.id}</span>
                            <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS & TOOLS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black text-white">Organizer Profile Settings & Viral Tools</h4>
                <p className="text-xs text-slate-400">Customize your agency profile, contact phone, and branding.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h5 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">Agency Profile Information</h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Agency / Organizer Name</label>
                    <input
                      type="text"
                      value={settingsAgencyName}
                      onChange={(e) => setSettingsAgencyName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={() => showToast('✅ Organizer profile settings updated successfully!')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4"/>
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>

      {/* NOMINEE QR CODE & DIGITAL POSTER BADGE MODAL */}
      <AnimatePresence>
        {selectedNomineeForBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative text-white"
            >
              <button
                onClick={() => setSelectedNomineeForBadge(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>

              <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto border-2 border-amber-400 shadow-xl">
                <img src={selectedNomineeForBadge.photoUrl} alt={selectedNomineeForBadge.name} className="w-full h-full object-cover" />
              </div>

              <div>
                <h4 className="font-black text-lg text-white">{selectedNomineeForBadge.name}</h4>
                <div className="text-xs text-amber-400 font-bold">{selectedNomineeForBadge.category}</div>
                <div className="text-2xl font-mono font-black text-amber-300 mt-1 bg-amber-400/10 py-1 px-3 rounded-xl border border-amber-400/30 inline-block">
                  {selectedNomineeForBadge.code}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-center">
                <QrCode className="w-28 h-28 text-white"/>
              </div>

              <p className="text-[11px] text-slate-400 font-mono">
                Dial *928*123# or scan to vote on VoteRight Ghana.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyCode(selectedNomineeForBadge.code, 'Voting Code')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5"/> Copy Code
                </button>
                <button
                  onClick={() => {
                    showToast(`📥 Digital poster badge downloaded for ${selectedNomineeForBadge.name}!`);
                    setSelectedNomineeForBadge(null);
                  }}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5"/> Download Badge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT NOMINEE MODAL */}
      <AnimatePresence>
        {editingNominee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.form
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onSubmit={handleSaveEditNominee}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-400"/>
                  <span>Edit Nominee: {editingNominee.name}</span>
                </h4>
                <button type="button" onClick={() => setEditingNominee(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nominee Full Name</label>
                <input
                  type="text"
                  required
                  value={editNomineeName}
                  onChange={(e) => setEditNomineeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={editNomineeCategory}
                  onChange={(e) => setEditNomineeCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Unique Voting Code</label>
                <input
                  type="text"
                  required
                  value={editNomineeCode}
                  onChange={(e) => setEditNomineeCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Photo URL</label>
                <input
                  type="url"
                  required
                  value={editNomineePhotoUrl}
                  onChange={(e) => setEditNomineePhotoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Bio / Slogan</label>
                <input
                  type="text"
                  value={editNomineeBio}
                  onChange={(e) => setEditNomineeBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNominee(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* BULK NOMINEE UPLOAD MODAL */}
      <AnimatePresence>
        {showBulkUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                  <Upload className="w-4 h-4"/>
                  <span>Bulk Upload Nominees (CSV format)</span>
                </h4>
                <button onClick={() => setShowBulkUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-400">
                Paste your CSV data below. Format per line: <br />
                <code className="text-amber-400 font-mono text-[11px]">Name, Category, Code, PhotoUrl, Bio</code>
              </p>

              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Stonebwoy, Best Artiste, GMA-001, https://..., Reggae King&#10;Sarkodie, Best Artiste, GMA-002, https://..., Rap Icon"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowBulkUploadModal(false)}
                  className="bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkNomineeUpload}
                  className="bg-amber-400 text-slate-950 text-xs font-black px-6 py-2.5 rounded-xl shadow"
                >
                  Upload & Import Nominees
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYSTACK TRANSFER API PROGRESS & SUCCESS MODAL */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full text-center space-y-6 shadow-2xl text-white"
            >
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
                {completedPayoutRecord ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400"/>
                ) : (
                  <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              <div>
                <h4 className="text-xl font-black text-white">
                  {completedPayoutRecord ? 'Payout Successfully Disbursed!' : 'Paystack Transfer API in Progress'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {transferStepLabel}
                </p>
              </div>

              {/* Stepper Progress Indicator */}
              {!completedPayoutRecord && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs font-mono">
                  <div className={`flex items-center gap-2 ${activeTransferStep >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5"/> <span>1. Validating Subaccount Balance</span>
                  </div>
                  <div className={`flex items-center gap-2 ${activeTransferStep >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5"/> <span>2. Creating Paystack Transfer Recipient</span>
                  </div>
                  <div className={`flex items-center gap-2 ${activeTransferStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5"/> <span>3. Initiating Automated MoMo / Bank Transfer</span>
                  </div>
                </div>
              )}

              {completedPayoutRecord && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl text-left space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Sent:</span>
                    <span className="text-emerald-400 font-bold">{formatPrice(completedPayoutRecord.amount, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recipient Account:</span>
                    <span className="text-white">{completedPayoutRecord.accountNumber} ({completedPayoutRecord.momoNetwork})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Holder:</span>
                    <span className="text-white">{completedPayoutRecord.accountName}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-500/20">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 font-black">DISBURSED SUCCESSFUL</span>
                  </div>
                </div>
              )}

              {completedPayoutRecord && (
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs py-3.5 rounded-xl cursor-pointer"
                >
                  Close & Return to Dashboard
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

