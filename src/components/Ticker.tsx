import React from 'react';
import { RecentVoteFeed } from '../types';
import { Volume2, Sparkles, ShieldCheck } from 'lucide-react';

interface TickerProps {
  recentVotes: RecentVoteFeed[];
  announcements?: string[];
}

export const Ticker: React.FC<TickerProps> = ({ recentVotes, announcements = [] }) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 text-xs py-2 px-4 overflow-hidden relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-semibold text-amber-400 shrink-0 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span className="uppercase tracking-wider text-[10px]">Live Updates</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap w-full relative flex items-center">
          <div className="inline-flex gap-8 animate-marquee">
            {announcements.map((ann, i) => (
              <div key={`ann-${i}`} className="inline-flex items-center gap-2 text-amber-300 font-extrabold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                <span>📢</span>
                <span>{ann}</span>
              </div>
            ))}
            {recentVotes.map((vote) => (
              <div key={vote.id} className="inline-flex items-center gap-2 text-slate-300">
                <span className="font-bold text-blue-400">{vote.voterName}</span>
                <span>cast</span>
                <span className="font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  +{vote.votesCount} votes
                </span>
                <span>for</span>
                <span className="font-semibold text-white">{vote.nomineeName} ({vote.nomineeCode})</span>
                <span className="text-slate-500 text-[11px]">• {vote.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-emerald-400 font-medium shrink-0 text-[11px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>End-to-End Encrypted & Audited</span>
        </div>
      </div>
    </div>
  );
};
