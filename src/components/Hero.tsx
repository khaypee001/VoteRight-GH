import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Search, 
  Award, 
  Crown, 
  Vote, 
  Ticket, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight 
} from 'lucide-react';
import { CategoryType, SiteSettings } from '../types';

interface HeroProps {
  onQuickVoteByCode: (code: string) => void;
  selectedCategoryFilter: string;
  onSelectCategoryFilter: (cat: string) => void;
  totalVotesCount: number;
  totalContestsCount: number;
  siteSettings?: SiteSettings;
}

export const Hero: React.FC<HeroProps> = ({
  onQuickVoteByCode,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  totalVotesCount,
  totalContestsCount,
  siteSettings,
}) => {
  const [candidateCodeInput, setCandidateCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateCodeInput.trim()) {
      setCodeError('Please enter a candidate code e.g. VRG-101');
      return;
    }
    setCodeError('');
    onQuickVoteByCode(candidateCodeInput.trim().toUpperCase());
  };

  const categories = [
    { id: 'all', label: 'All Contests', icon: Vote },
    { id: 'pageant', label: '👑 Beauty Pageants', icon: Crown },
    { id: 'award', label: '🏆 Excellence Awards', icon: Award },
    { id: 'election', label: '🎓 Student Union & SRC', icon: Vote },
    { id: 'ticket', label: '🎟️ Event E-Tickets', icon: Ticket },
  ];

  return (
    <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-b border-slate-800/80 overflow-hidden pt-8 pb-12">
      {/* Background Decorative Blur & Grids */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Messaging - Slides in from Left */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-indigo-500/10 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-300 shadow-sm">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              <span>Africa's Most Trusted Voting & E-Ticketing Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {siteSettings?.heroTitle || (
                <>
                  Transparent Online Voting for <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">Pageants, Awards & Elections</span>
                </>
              )}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {siteSettings?.heroSubtitle || "Cast secure instant votes via Mobile Money or Card. Real-time encrypted leaderboards, instant receipt verification, and digital ticketing for organizers."}
            </p>

            {/* Quick Stats Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0">
              <motion.div 
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center transition-shadow hover:border-amber-400/40"
              >
                <div className="text-lg sm:text-xl font-extrabold text-amber-400">
                  {totalVotesCount.toLocaleString()}+
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Votes Cast</div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center transition-shadow hover:border-blue-400/40"
              >
                <div className="text-lg sm:text-xl font-extrabold text-blue-400">
                  100%
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Instant Audit</div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center transition-shadow hover:border-emerald-400/40"
              >
                <div className="text-lg sm:text-xl font-extrabold text-emerald-400">
                  24/7
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Live Leaderboards</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Direct Code Lookup Card - Slides in from Right */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/95 border border-slate-700/90 rounded-2xl p-6 shadow-2xl shadow-blue-950/40 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">Direct Vote by Code</h3>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                  Instant Access
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-4">
                Have a nominee code? Enter it below to cast your vote directly without navigating through categories!
              </p>

              <form onSubmit={handleQuickLookup} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={candidateCodeInput}
                    onChange={(e) => {
                      setCandidateCodeInput(e.target.value);
                      setCodeError('');
                    }}
                    placeholder="Enter Candidate Code (e.g. VRG-101)"
                    className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-white text-base font-mono font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-600 tracking-wider uppercase"
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>Vote Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                {codeError && (
                  <p className="text-xs text-rose-400 font-medium">{codeError}</p>
                )}

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-400">Sample codes:</span>
                  {['VRG-101', 'JHS-01', 'MED-01'].map((code) => (
                    <motion.button
                      key={code}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setCandidateCodeInput(code);
                        setCodeError('');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded border border-slate-700 font-mono text-[10px] cursor-pointer"
                    >
                      {code}
                    </motion.button>
                  ))}
                </div>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> MTN / Telecel MoMo & Cards
                </span>
                <span>Encrypted Audit Log</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Category Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 pt-6 border-t border-slate-800/60"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Browse Contests & Categories
            </h3>
            <span className="text-xs text-amber-400 font-semibold">
              Showing {totalContestsCount} Events
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectCategoryFilter(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-lg shadow-amber-400/20'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
                  }`}
                >
                  <span>{cat.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
