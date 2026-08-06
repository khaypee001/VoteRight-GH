import React from 'react';
import { motion } from 'motion/react';
import { Contest, CurrencyCode } from '../types';
import { calculateDaysLeft, formatPrice } from '../utils/helpers';
import { Vote, Clock, Ticket } from 'lucide-react';

interface ContestCardProps {
  contest: Contest;
  currency: CurrencyCode;
  onSelectContest: (contest: Contest) => void;
  onOpenTickets?: (contest: Contest) => void;
}

export const ContestCard: React.FC<ContestCardProps> = ({
  contest,
  currency,
  onSelectContest,
  onOpenTickets,
}) => {
  const { days, hours, minutes } = calculateDaysLeft(contest.endDate);
  const isEnded = days === 0 && hours === 0 && minutes === 0;
  const isVotingActive = contest.isLive && !isEnded;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-400/50 transition-colors duration-300 shadow-xl flex flex-col group hover:shadow-2xl hover:shadow-amber-500/10 relative"
    >
      {/* Banner Header */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-950 rounded-xl">
        <img
          src={contest.bannerUrl}
          alt={contest.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
            !isVotingActive ? 'opacity-75 filter contrast-90 grayscale-[20%]' : 'opacity-90'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Category & Status Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-amber-400/30 shadow">
            {contest.category.toUpperCase()}
          </span>
          {isVotingActive ? (
            <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20 border border-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" /> VOTING ONGOING 🟢
            </span>
          ) : (
            <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-rose-600/30 border border-rose-400">
              VOTING HAS ENDED 🔴
            </span>
          )}
        </div>

        {/* Banner Overlay for Ended Contests */}
        {!isVotingActive && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-3 text-center pointer-events-none">
            <span className="bg-rose-600/90 text-white font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-2xl border border-rose-400 flex items-center gap-1.5">
              <span>🔴 VOTING CLOSED</span>
            </span>
          </div>
        )}

        {/* Vote price badge */}
        <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow z-10">
          {formatPrice(contest.votePrice, currency)} / vote
        </div>

        {/* Organizer */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 font-medium z-10">
          <span className="truncate bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
            By {contest.organizer}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 
            onClick={() => onSelectContest(contest)}
            className="text-lg font-extrabold text-white group-hover:text-amber-400 transition-colors cursor-pointer line-clamp-1"
          >
            {contest.title}
          </h3>
          <p className="text-slate-400 text-xs line-clamp-2 mt-1.5 leading-relaxed">
            {contest.description}
          </p>
        </div>

        {/* Stats & Countdown */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-center text-xs">
          <div>
            <div className="text-slate-400 text-[10px] font-medium flex items-center justify-center gap-1">
              <Vote className="w-3 h-3 text-blue-400" /> Total Votes
            </div>
            <div className="font-extrabold text-white text-sm mt-0.5">
              {contest.totalVotes.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-[10px] font-medium flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Time Remaining
            </div>
            <div className="font-extrabold text-amber-400 text-sm mt-0.5">
              {isEnded ? 'Completed' : `${days}d ${hours}h ${minutes}m`}
            </div>
          </div>
        </div>

        {/* Categories preview chips */}
        <div className="flex flex-wrap gap-1.5">
          {contest.categories.slice(0, 2).map((cat, idx) => (
            <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-md truncate max-w-[150px]">
              {cat}
            </span>
          ))}
          {contest.categories.length > 2 && (
            <span className="bg-slate-800 text-slate-400 text-[10px] font-medium px-1.5 py-0.5 rounded-md">
              +{contest.categories.length - 2} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-2">
          {isVotingActive ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectContest(contest)}
              className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all duration-150 ease-in-out shadow-md flex items-center justify-center gap-1.5 cursor-pointer shadow-amber-400/10"
            >
              <Vote className="w-4 h-4 fill-slate-950" />
              <span>Vote Candidates</span>
            </motion.button>
          ) : (
            <button
              disabled
              className="flex-1 bg-slate-800 text-slate-400 font-extrabold text-xs py-2.5 px-3 rounded-xl cursor-not-allowed border border-slate-700/60 flex items-center justify-center gap-1.5"
            >
              <span>Voting Ended</span> 🔴
            </button>
          )}

          {contest.ticketsEnabled && onOpenTickets && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenTickets(contest)}
              title="Buy Event E-Tickets"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 font-bold text-xs p-2.5 rounded-xl transition-all duration-150 ease-in-out shadow flex items-center justify-center cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
