import React, { useState } from 'react';
import { Contest, CurrencyCode } from '../types';
import { formatPrice } from '../utils/helpers';
import { Search, Trophy, ArrowRight, Filter } from 'lucide-react';

interface CompetitionsPageProps {
  contests: Contest[];
  currency: CurrencyCode;
  onSelectContest: (contest: Contest) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const CompetitionsPage: React.FC<CompetitionsPageProps> = ({
  contests,
  currency,
  onSelectContest,
  searchQuery,
  onSearchChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredContests = contests.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 bg-white text-slate-900 pb-16">
      {/* Top Search Card (Blue Background) */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
          <Trophy className="w-4 h-4" />
          <span>Ongoing Award Contests & Pageants</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
          Cast Your Vote for Ongoing Award Contests in Ghana
        </h1>

        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
          Support your favorite contestants securely via web instant Mobile Money or Card payment. Real-time vote tallies update instantly upon confirmation.
        </p>

        {/* Search Bar Input */}
        <div className="relative max-w-2xl pt-2">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Events to Vote on VoteRight GH – Type Event Name"
            className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-amber-400/50 shadow-md font-medium"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>

        {[
          { id: 'all', label: 'All Contests' },
          { id: 'pageant', label: '👑 Pageants' },
          { id: 'award', label: '🏆 Excellence Awards' },
          { id: 'election', label: '🎓 Student Elections' },
          { id: 'talent', label: '🎤 Talent Shows' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Responsive Grid */}
      {filteredContests.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-700">No matching contests found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search keywords or category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => (
            <div
              key={contest.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:ring-2 hover:ring-blue-500/50 transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Poster Banner */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden rounded-xl">
                  <img
                    src={contest.bannerUrl}
                    alt={contest.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-full shadow-md font-mono">
                    Cost Per Vote: {formatPrice(contest.votePrice, currency)}
                  </div>
                  {contest.isLive && (
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                      {contest.category}
                    </span>
                    <span>{contest.totalVotes.toLocaleString()} Votes</span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {contest.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {contest.description}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => onSelectContest(contest)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 hover:shadow-lg hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>View Awards Page</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
