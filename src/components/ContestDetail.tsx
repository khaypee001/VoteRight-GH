import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Contest, Nominee, CurrencyCode } from '../types';
import { NomineeCard } from './NomineeCard';
import { Leaderboard } from './Leaderboard';
import { calculateDaysLeft, formatPrice, getEventShareUrl } from '../utils/helpers';
import { 
  ArrowLeft, 
  Vote, 
  Trophy, 
  Ticket, 
  Share2, 
  Clock, 
  Info, 
  Search, 
  Check, 
  Filter, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface ContestDetailProps {
  contest: Contest;
  nominees: Nominee[];
  currency: CurrencyCode;
  onBack: () => void;
  onVoteCandidate: (nominee: Nominee) => void;
  onOpenTickets?: (contest: Contest) => void;
  highlightedCandidateCode?: string | null;
}

export const ContestDetail: React.FC<ContestDetailProps> = ({
  contest,
  nominees,
  currency,
  onBack,
  onVoteCandidate,
  onOpenTickets,
  highlightedCandidateCode,
}) => {
  const [activeTab, setActiveTab] = useState<'nominees' | 'leaderboard'>('nominees');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'code' | 'name'>('votes');
  const [copiedShare, setCopiedShare] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const { days, hours, minutes } = calculateDaysLeft(contest.endDate);
  const isEnded = days === 0 && hours === 0 && minutes === 0;
  const isVotingActive = contest.isLive && !isEnded;

  const contestNominees = nominees.filter((n) => n.contestId === contest.id);

  // Auto-land and scroll directly to shared contestant
  useEffect(() => {
    if (highlightedCandidateCode) {
      const cleanCode = highlightedCandidateCode.toLowerCase().trim();
      const target = contestNominees.find(
        (n) =>
          n.code.toLowerCase() === cleanCode ||
          n.id.toLowerCase() === cleanCode ||
          cleanCode.endsWith(n.code.toLowerCase())
      );

      if (target) {
        setActiveTab('nominees');
        setSearchTerm('');
        // Ensure the candidate is visible within category filter
        if (selectedCategory !== 'all' && selectedCategory !== target.category) {
          setSelectedCategory('all');
        }

        const timer = setTimeout(() => {
          const domId = `candidate-${target.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const el = document.getElementById(domId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);

        return () => clearTimeout(timer);
      }
    }
  }, [highlightedCandidateCode, contestNominees]);

  // Filter & Sort
  const filteredNominees = contestNominees
    .filter((n) => {
      const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
      const matchesSearch = 
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes;
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      return a.name.localeCompare(b.name);
    });

  const handleCopyLink = () => {
    const url = getEventShareUrl(contest);
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Contests</span>
        </motion.button>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedShare ? 'Copied Link' : 'Share Contest'}</span>
          </motion.button>
        </div>
      </div>

      {/* Hero Banner Section */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="relative h-64 sm:h-80 bg-slate-950">
          <img
            src={contest.bannerUrl}
            alt={contest.title}
            className={`w-full h-full object-cover ${!isVotingActive ? 'opacity-65 filter contrast-90 grayscale-[25%]' : 'opacity-80'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Floating Status & Category Tag */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <div className="bg-slate-950/90 text-amber-400 font-bold text-xs px-3 py-1.5 rounded-xl border border-amber-400/40">
              {contest.category.toUpperCase()}
            </div>
            {isVotingActive ? (
              <span className="bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 border border-emerald-400">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" /> VOTING ONGOING 🟢
              </span>
            ) : (
              <span className="bg-rose-600 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/30 border border-rose-400">
                VOTING HAS ENDED 🔴
              </span>
            )}
          </div>

          {/* Banner Overlay for Ended Contests */}
          {!isVotingActive && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
              <span className="bg-rose-600 text-white font-black text-sm sm:text-base px-5 py-2 rounded-full uppercase tracking-wider shadow-2xl border border-rose-400 flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" /> VOTING HAS ENDED 🔴
              </span>
              <p className="text-slate-300 text-xs sm:text-sm max-w-lg leading-relaxed">
                This campaign voting period is officially closed. You can review official winner tallies and candidate rankings on the leaderboard.
              </p>
            </div>
          )}

          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <span>Organized by <strong className="text-white">{contest.organizer}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Contest
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {contest.title}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl line-clamp-2">
              {contest.description}
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-slate-400 text-[11px] font-medium">Total Votes Cast</div>
            <div className="text-xl font-black text-amber-400 mt-0.5">
              {contest.totalVotes.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px] font-medium">Vote Price</div>
            <div className="text-xl font-black text-white mt-0.5">
              {formatPrice(contest.votePrice, currency)} / vote
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px] font-medium">Time Remaining</div>
            <div className="text-xl font-black text-blue-400 mt-0.5">
              {isEnded ? 'Closed' : `${days}d ${hours}h ${minutes}m`}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px] font-medium">Total Candidates</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {contestNominees.length} Nominees
            </div>
          </div>
        </div>
      </div>

      {/* Rules Banner (Collapsible) */}
      {contest.rules && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between text-xs font-bold text-amber-400 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4" /> Voting Rules & Official Guidelines
            </span>
            <span>{showRules ? 'Hide Guidelines ▲' : 'Show Guidelines ▼'}</span>
          </button>

          {showRules && (
            <ul className="mt-3 space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-3 pl-4 list-disc">
              {contest.rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('nominees')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'nominees'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Vote className="w-4 h-4" /> Nominees & Candidates ({contestNominees.length})
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" /> Live Leaderboard
          </button>
        </div>

        {contest.ticketsEnabled && onOpenTickets && (
          <button
            onClick={() => onOpenTickets(contest)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow cursor-pointer"
          >
            <Ticket className="w-4 h-4" /> Buy Event E-Tickets
          </button>
        )}
      </div>

      {/* Main Tab Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Leaderboard
              contest={contest}
              nominees={nominees}
              onVoteCandidate={onVoteCandidate}
            />
          </motion.div>
        ) : (
          <motion.div
            key="nominees"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Filters & Search Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                    selectedCategory === 'all'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  All Categories
                </button>
                {contest.categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search and Sort */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name or code..."
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="votes">Sort: Highest Votes</option>
                  <option value="code">Sort: Candidate Code</option>
                  <option value="name">Sort: Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Nominees Grid */}
            {filteredNominees.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <Vote className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No candidates found</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your search query or selecting a different category tab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNominees.map((nom) => {
                  const categoryNominees = contestNominees.filter((n) => n.category === nom.category);
                  const totalCatVotes = categoryNominees.reduce((sum, n) => sum + n.votes, 0);

                  const isHighlighted = Boolean(
                    highlightedCandidateCode &&
                    (nom.code.toLowerCase() === highlightedCandidateCode.toLowerCase() ||
                     nom.id.toLowerCase() === highlightedCandidateCode.toLowerCase() ||
                     highlightedCandidateCode.toLowerCase().endsWith(nom.code.toLowerCase()))
                  );

                  return (
                    <NomineeCard
                      key={nom.id}
                      nominee={nom}
                      contest={contest}
                      votePrice={contest.votePrice}
                      currency={currency}
                      totalCategoryVotes={totalCatVotes}
                      onVote={onVoteCandidate}
                      isVotingEnded={!isVotingActive}
                      isHighlighted={isHighlighted}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
