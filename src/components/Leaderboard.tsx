import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Nominee, Contest } from '../types';
import { Trophy, Award, BarChart3, Table as TableIcon, ShieldCheck, Zap, Sparkles, Share2 } from 'lucide-react';
import { ShareCandidateModal } from './ShareCandidateModal';

interface LeaderboardProps {
  contest: Contest;
  nominees: Nominee[];
  onVoteCandidate: (nominee: Nominee) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  contest,
  nominees,
  onVoteCandidate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(contest.categories[0] || 'all');
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [shareNominee, setShareNominee] = useState<Nominee | null>(null);

  const filteredNominees = nominees
    .filter((n) => n.contestId === contest.id && (selectedCategory === 'all' || !selectedCategory ? true : n.category === selectedCategory))
    .sort((a, b) => b.votes - a.votes);

  const totalCategoryVotes = filteredNominees.reduce((acc, curr) => acc + curr.votes, 0);
  const maxVotes = Math.max(...filteredNominees.map((n) => n.votes), 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-white">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Live Standings & Vote Graph</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Real-Time Visual Leaderboard
          </h2>
          <p className="text-xs text-slate-400">
            Live vote distribution graph updated with every verified Mobile Money & Card transaction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle (Graph vs Table) */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'graph'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Graph View</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>

          {/* Total Votes Metric */}
          <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Category Votes</div>
            <div className="text-sm font-black text-amber-400 font-mono flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {totalCategoryVotes.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          All Categories ({contest.categories.length})
        </button>
        {contest.categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* RENDER MODE: GRAPH VIEW */}
      {viewMode === 'graph' && (
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-900 pb-2">
            <span className="font-semibold text-slate-300">Vote Proportion Chart</span>
            <span className="text-[11px] text-amber-400/90 font-mono">Sorted by Highest Votes</span>
          </div>

          {filteredNominees.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No contestants found in this category.
            </div>
          ) : (
            <div className="relative pt-6">
              {/* Reference Grid lines */}
              <div className="absolute inset-x-0 top-6 bottom-36 flex flex-col justify-between pointer-events-none opacity-15">
                <div className="border-b border-dashed border-slate-500 w-full" />
                <div className="border-b border-dashed border-slate-500 w-full" />
                <div className="border-b border-dashed border-slate-500 w-full" />
                <div className="border-b border-dashed border-slate-500 w-full" />
              </div>

              {/* Scrollable Graph Bars Area with Names Beneath */}
              <div className="overflow-x-auto pb-4 pt-4 scrollbar-thin scrollbar-thumb-slate-800">
                <div
                  className="flex items-end justify-around gap-4 sm:gap-6 min-h-[360px] px-2"
                  style={{ minWidth: `${Math.max(filteredNominees.length * 150, 400)}px` }}
                >
                  {filteredNominees.map((nom, idx) => {
                    const percentage = totalCategoryVotes > 0
                      ? Math.round((nom.votes / totalCategoryVotes) * 100)
                      : 0;

                    // Proportional height relative to maximum votes with min-height clamp
                    const heightPercent = maxVotes > 0
                      ? Math.max(Math.round((nom.votes / maxVotes) * 100), 10)
                      : 10;

                    const isLeader = idx === 0;
                    const isSecond = idx === 1;
                    const isThird = idx === 2;

                    // Distinctive gradients for podium finishers
                    const barGradient = isLeader
                      ? 'from-amber-500 via-amber-400 to-amber-300 shadow-amber-400/20'
                      : isSecond
                      ? 'from-slate-400 via-slate-300 to-slate-200 shadow-slate-300/15'
                      : isThird
                      ? 'from-amber-700 via-amber-600 to-amber-500 shadow-amber-600/15'
                      : 'from-blue-600 via-indigo-500 to-blue-400 shadow-blue-500/15';

                    const rankBadge = isLeader ? (
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                        <Trophy className="w-3 h-3 fill-slate-950" /> #1 Leader
                      </span>
                    ) : isSecond ? (
                      <span className="bg-slate-300 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="w-3 h-3" /> #2 Place
                      </span>
                    ) : isThird ? (
                      <span className="bg-amber-800 text-amber-200 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="w-3 h-3" /> #3 Place
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        #{idx + 1}
                      </span>
                    );

                    return (
                      <div
                        key={nom.id}
                        className="flex-1 max-w-[200px] flex flex-col items-center group relative"
                      >
                        {/* Vote Stats On Top of the Bar */}
                        <div className="mb-2 text-center space-y-0.5">
                          <div className="text-xs font-black text-white font-mono tracking-tight">
                            {nom.votes.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold text-amber-400 bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded-full inline-block">
                            {percentage}% share
                          </div>
                        </div>

                        {/* Animated Graph Bar Column */}
                        <div className="w-full flex flex-col items-center justify-end h-52 bg-slate-900/50 rounded-2xl p-1.5 border border-slate-800/80 relative">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                            className={`w-full bg-gradient-to-t ${barGradient} rounded-xl relative shadow-lg flex flex-col items-center justify-between p-1.5 transition-all group-hover:brightness-110`}
                          >
                            {/* Leader crown particle */}
                            {isLeader && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 p-1 rounded-full shadow-lg">
                                <Sparkles className="w-3 h-3 fill-slate-950" />
                              </div>
                            )}
                            <div className="w-full flex justify-center">
                              <span className="text-[9px] font-black text-slate-950 bg-white/85 px-1.5 py-0.5 rounded-full shadow-xs">
                                #{idx + 1}
                              </span>
                            </div>
                          </motion.div>
                        </div>

                        {/* Ground Baseline Divider */}
                        <div className="w-full h-1 bg-slate-800 my-2 rounded-full" />

                        {/* Contestant Info BENEATH THE GRAPH BAR */}
                        <div className="text-center space-y-1.5 w-full pt-1 flex flex-col items-center">
                          {/* Contestant Avatar with rank border */}
                          <div className="relative">
                            <img
                              src={nom.photoUrl}
                              alt={nom.name}
                              className={`w-12 h-12 rounded-full object-cover border-2 shadow-md ${
                                isLeader
                                  ? 'border-amber-400 ring-2 ring-amber-400/40'
                                  : 'border-slate-700 group-hover:border-amber-400/60'
                              } transition-all`}
                            />
                            <span className="absolute -bottom-1 -right-1 bg-slate-950 text-amber-300 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-slate-800">
                              {nom.code}
                            </span>
                          </div>

                          {/* Contestant Name (Prominent beneath bar) */}
                          <div className="w-full px-1">
                            <h4 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight">
                              {nom.name}
                            </h4>
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              {nom.category}
                            </div>
                          </div>

                          <div className="pt-0.5">{rankBadge}</div>

                          {/* Fast Action Vote & Share Buttons */}
                          <div className="flex items-center gap-1.5 w-full max-w-[140px] mt-1">
                            <button
                              onClick={() => onVoteCandidate(nom)}
                              className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-[11px] py-2 px-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Zap className="w-3 h-3 fill-slate-950" />
                              <span>Vote</span>
                            </button>
                            <button
                              onClick={() => setShareNominee(nom)}
                              title={`Share direct link to vote for ${nom.name}`}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER MODE: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Contestant Name</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Verified Votes</th>
                <th className="py-3.5 px-4">Vote Share</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredNominees.map((nom, index) => {
                const pct = totalCategoryVotes > 0
                  ? Math.round((nom.votes / totalCategoryVotes) * 100)
                  : 0;

                return (
                  <tr key={nom.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-white">
                      {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={nom.photoUrl}
                          alt={nom.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div className="font-extrabold text-white text-sm">{nom.name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {nom.code}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {nom.category}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-white font-mono">
                      {nom.votes.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-bold text-amber-300 text-[11px] font-mono">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setShareNominee(nom)}
                          title={`Share direct link to vote for ${nom.name}`}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 p-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onVoteCandidate(nom)}
                          className="bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-amber-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 fill-current" /> Vote
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Real-time Audit Trail Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" /> Real-time Cryptographic Audit Trail Active
        </span>
        <span className="font-mono">
          Showing {filteredNominees.length} {filteredNominees.length === 1 ? 'Contestant' : 'Contestants'} • {totalCategoryVotes.toLocaleString()} Votes
        </span>
      </div>

      {/* Share Contestant Modal */}
      {shareNominee && (
        <ShareCandidateModal
          nominee={shareNominee}
          contest={contest}
          onClose={() => setShareNominee(null)}
        />
      )}
    </div>
  );
};
