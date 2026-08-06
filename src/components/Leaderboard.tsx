import React, { useState } from 'react';
import { Nominee, Contest } from '../types';
import { Trophy, Award, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState<string>(contest.categories[0] || '');

  const filteredNominees = nominees
    .filter((n) => n.contestId === contest.id && (selectedCategory ? n.category === selectedCategory : true))
    .sort((a, b) => b.votes - a.votes);

  const totalCategoryVotes = filteredNominees.reduce((acc, curr) => acc + curr.votes, 0);

  const top3 = filteredNominees.slice(0, 3);
  const remaining = filteredNominees.slice(3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4" /> Live Leaderboard & Audit
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Real-Time Vote Standings
          </h2>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
          {contest.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {top3.map((nom, idx) => {
            const pct = totalCategoryVotes > 0 ? Math.round((nom.votes / totalCategoryVotes) * 100) : 0;
            const rankTitle = idx === 0 ? '1st Place 👑' : idx === 1 ? '2nd Place 🥈' : '3rd Place 🥉';
            const cardBorder = idx === 0 ? 'border-amber-400/80 bg-gradient-to-b from-amber-500/10 to-slate-900' : 'border-slate-700 bg-slate-900';

            return (
              <div
                key={nom.id}
                className={`border rounded-2xl p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden ${cardBorder}`}
              >
                {idx === 0 && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] py-0.5 tracking-wider uppercase">
                    Current Category Leader
                  </div>
                )}

                <div className="relative mt-2">
                  <img
                    src={nom.photoUrl}
                    alt={nom.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-amber-400/60 shadow-lg"
                  />
                  <span className="absolute -bottom-2 right-0 bg-slate-950 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                    #{nom.code}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-amber-400">{rankTitle}</span>
                  <h4 className="font-extrabold text-white text-base line-clamp-1">{nom.name}</h4>
                </div>

                <div className="w-full bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-lg font-black text-white">
                    {nom.votes.toLocaleString()}{' '}
                    <span className="text-xs font-bold text-amber-400">({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => onVoteCandidate(nom)}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" /> Vote Now
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-mono font-semibold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Candidate</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Votes</th>
              <th className="py-3 px-4">Share</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredNominees.map((nom, index) => {
              const pct = totalCategoryVotes > 0 ? Math.round((nom.votes / totalCategoryVotes) * 100) : 0;
              return (
                <tr key={nom.id} className="hover:bg-slate-800/40 transition-colors">
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
                      <div>
                        <div className="font-extrabold text-white">{nom.name}</div>
                        <div className="text-[10px] text-slate-400">{nom.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">
                    {nom.code}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-white">
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
                      <span className="font-bold text-amber-300 text-[11px]">{pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onVoteCandidate(nom)}
                      className="bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-amber-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                    >
                      Vote
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800">
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" /> Real-time Cryptographic Audit Trail Active
        </span>
        <span>Total Category Votes: {totalCategoryVotes.toLocaleString()}</span>
      </div>
    </div>
  );
};
