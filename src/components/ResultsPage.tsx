import React, { useState } from 'react';
import { Contest, Nominee } from '../types';
import {
  BarChart3,
  Table as TableIcon,
  Search,
  Share2,
  ArrowLeft,
  Check,
  Zap,
} from 'lucide-react';

interface ResultsPageProps {
  contests: Contest[];
  nominees: Nominee[];
  onVoteNominee: (nominee: Nominee) => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  contests,
  nominees,
  onVoteNominee,
}) => {
  const [eventSearch, setEventSearch] = useState('');
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  
  // Detailed view state
  const [contestantSearch, setContestantSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');
  const [sortBy, setSortBy] = useState<'highest' | 'code' | 'name'>('highest');
  const [expandedCategory, setExpandedCategory] = useState<string>('all');
  const [copiedShare, setCopiedShare] = useState(false);

  const filteredContests = contests.filter((c) =>
    c.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
    c.organizer.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // If NO contest selected, show Event Summary List with search
  if (!selectedContest) {
    return (
      <div className="space-y-8 bg-white text-slate-900 pb-16">
        {/* Header Search Card */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
            <BarChart3 className="w-4 h-4" />
            <span>Live Audit & Results Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Real-Time Award Results & Vote Tallies
          </h1>

          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
            Select an event to view transparent live standings, nominee photos, vote percentages, and interactive graph analytics.
          </p>

          <div className="relative max-w-2xl pt-2">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-5" />
            <input
              type="text"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              placeholder="Search by typing event name..."
              className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-amber-400/50 shadow-md font-medium"
            />
          </div>
        </div>

        {/* Event Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((c) => {
            const contestNominees = nominees.filter((n) => n.contestId === c.id);
            const totalVotes = contestNominees.reduce((acc, curr) => acc + curr.votes, 0);

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:ring-2 hover:ring-blue-500/50 transition-all duration-300 ease-out p-6 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="h-40 w-full rounded-xl overflow-hidden bg-slate-100 relative">
                    <img
                      src={c.bannerUrl}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-3 left-3 bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow">
                      Total Categories: {c.categories.length}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    {c.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1 border-t border-slate-100">
                    <span>Organizer: {c.organizer}</span>
                    <span className="font-extrabold text-blue-900 font-mono flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all duration-300 bg-blue-50 border border-blue-200">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      {totalVotes.toLocaleString()} Votes
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedContest(c);
                    setExpandedCategory('all');
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 hover:shadow-lg shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Results Page</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // DETAILED RESULTS VIEW FOR SELECTED CONTEST
  const contestNominees = nominees.filter((n) => n.contestId === selectedContest.id);

  // Filter nominees by search & category
  let filteredNominees = contestNominees.filter((n) => {
    const matchesSearch =
      n.name.toLowerCase().includes(contestantSearch.toLowerCase()) ||
      n.code.toLowerCase().includes(contestantSearch.toLowerCase());
    const matchesCat = expandedCategory === 'all' || n.category === expandedCategory;
    return matchesSearch && matchesCat;
  });

  // Sort nominees
  if (sortBy === 'highest') {
    filteredNominees.sort((a, b) => b.votes - a.votes);
  } else if (sortBy === 'code') {
    filteredNominees.sort((a, b) => a.code.localeCompare(b.code));
  } else if (sortBy === 'name') {
    filteredNominees.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalVotesCast = contestNominees.reduce((sum, n) => sum + n.votes, 0);

  return (
    <div className="space-y-8 bg-white text-slate-900 pb-16">
      {/* Back Button & Award Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedContest(null)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              Live Audit & Real-Time Analytics
            </div>
            <h1 className="text-2xl font-black text-slate-900">{selectedContest.title}</h1>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 flex items-center gap-2 cursor-pointer shadow-sm self-start md:self-auto"
        >
          {copiedShare ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share Results</span>
            </>
          )}
        </button>
      </div>

      {/* Control Bar: Search Contestant, View Toggles, Sort Dropdown */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search Contestant Input */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={contestantSearch}
            onChange={(e) => setContestantSearch(e.target.value)}
            placeholder="Search contestant by name or code..."
            className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-600 font-medium"
          />
        </div>

        {/* View Toggle Buttons */}
        <div className="md:col-span-4 flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <TableIcon className="w-4 h-4" /> Table View
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              viewMode === 'chart'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Chart View
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="md:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="highest">Highest Votes First</option>
            <option value="code">Sort by Candidate Code</option>
            <option value="name">Sort by Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setExpandedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            expandedCategory === 'all'
              ? 'bg-amber-400 text-slate-950 font-black'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Categories ({selectedContest.categories.length})
        </button>

        {selectedContest.categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setExpandedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              expandedCategory === cat
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* RENDER MODE: CHART VIEW */}
      {viewMode === 'chart' && (
        <div className="space-y-8">
          {/* Render Graph Column Cards */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  Interactive Vote Chart Analysis
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nominee photos positioned inside column heads with live pulses & percentages.
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Total Votes</div>
                <div className="text-xl font-black text-amber-400 font-mono flex items-center gap-2 justify-end">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  {totalVotesCast.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Vertical Bar Graph Visualizer */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 items-end pt-4 min-h-[360px]">
              {filteredNominees.map((nom, idx) => {
                const categoryTotal = contestNominees
                  .filter((n) => n.category === nom.category)
                  .reduce((sum, n) => sum + n.votes, 0);
                const pct = categoryTotal > 0 ? Math.round((nom.votes / categoryTotal) * 100) : 0;
                const barHeight = Math.max(pct, 12); // min height for bar visibility

                return (
                  <div
                    key={nom.id}
                    className="flex flex-col items-center space-y-3 group"
                  >
                    {/* Nominee Photo inside Column Head */}
                    <div className="relative transform group-hover:-translate-y-1 transition-transform">
                      {/* Live Update Pulse Halo behind leader */}
                      {idx === 0 && (
                        <div className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
                      )}
                      <img
                        src={nom.photoUrl}
                        alt={nom.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-400 shadow-lg relative z-10"
                      />
                      <span className="absolute -bottom-1 right-0 bg-slate-950 text-amber-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-400/40 z-20">
                        #{nom.code}
                      </span>
                    </div>

                    {/* Bar Column */}
                    <div className="w-full bg-slate-800/80 rounded-2xl p-2 flex flex-col justify-end min-h-[160px] border border-slate-700/60 relative overflow-hidden">
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 via-indigo-600 to-amber-400 rounded-xl flex flex-col items-center justify-end pb-2 shadow-md transition-all duration-500 ease-out"
                      >
                        <span className="text-xs font-black text-slate-950 bg-white/90 px-2 py-0.5 rounded-full shadow-xs">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Nominee Label & Vote Count */}
                    <div className="text-center space-y-1 w-full">
                      <div className="font-extrabold text-xs text-white line-clamp-1">{nom.name}</div>
                      <div className="text-[11px] font-bold text-blue-900 font-mono flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-lg transition-all duration-300 bg-blue-50 border border-blue-200">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </span>
                        <span>{nom.votes.toLocaleString()} votes</span>
                      </div>
                      <button
                        onClick={() => onVoteNominee(nom)}
                        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] py-1.5 rounded-lg transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 cursor-pointer mt-1"
                      >
                        Vote
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODE: TABLE VIEW */}
      {viewMode === 'table' && (
        <div
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-900 uppercase font-mono font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Contestant</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Votes</th>
                  <th className="py-3.5 px-4">Percentage</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredNominees.map((nom, index) => {
                  const categoryTotal = contestNominees
                    .filter((n) => n.category === nom.category)
                    .reduce((sum, n) => sum + n.votes, 0);
                  const pct = categoryTotal > 0 ? Math.round((nom.votes / categoryTotal) * 100) : 0;

                  return (
                    <tr key={nom.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {index === 0 && (
                              <span className="absolute -inset-0.5 rounded-full bg-amber-400 animate-ping opacity-50" />
                            )}
                            <img
                              src={nom.photoUrl}
                              alt={nom.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-300 relative z-10"
                            />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{nom.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-blue-600">
                        {nom.code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-semibold">
                        {nom.category}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-black text-blue-900 font-mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-300 bg-blue-50 border border-blue-200">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                          </span>
                          {nom.votes.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="bg-amber-400 h-full rounded-full transition-all duration-500 ease-out"
                            />
                          </div>
                          <span className="font-black text-slate-900 text-xs">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onVoteNominee(nom)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 cursor-pointer shadow-sm"
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
        </div>
      )}
    </div>
  );
};
