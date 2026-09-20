import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Nominee, Contest, CurrencyCode } from '../types';
import { formatPrice, getCandidateShareUrl, getCandidateSlug } from '../utils/helpers';
import { Share2, Check, Trophy, Zap, Award, Sparkles } from 'lucide-react';

interface NomineeCardProps {
  nominee: Nominee;
  contest?: Contest;
  votePrice: number;
  currency: CurrencyCode;
  totalCategoryVotes: number;
  onVote: (nominee: Nominee) => void;
  isVotingEnded?: boolean;
  isHighlighted?: boolean;
}

export const NomineeCard: React.FC<NomineeCardProps> = ({
  nominee,
  contest,
  votePrice,
  currency,
  totalCategoryVotes,
  onVote,
  isVotingEnded = false,
  isHighlighted = false,
}) => {
  const [copied, setCopied] = useState(false);

  const percentage = totalCategoryVotes > 0 
    ? Math.round((nominee.votes / totalCategoryVotes) * 100) 
    : 0;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = contest
      ? getCandidateShareUrl(contest, nominee)
      : `${window.location.origin}/events/${nominee.contestId}/candidates/${getCandidateSlug(nominee)}`;
    
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `Vote for ${nominee.name} - ${contest?.title || 'VoteRight GH'}`,
          text: `Support and vote for ${nominee.name} (${nominee.code}) in ${contest?.title || 'VoteRight GH'}!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getRankBadge = (rank?: number) => {
    if (rank === 1) {
      return (
        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-amber-400/30">
          <Trophy className="w-3 h-3 fill-slate-950" /> #1 Leader
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="bg-slate-300 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Award className="w-3 h-3" /> #2 Place
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="bg-amber-700/90 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Award className="w-3 h-3" /> #3 Place
        </span>
      );
    }
    return rank ? (
      <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
        #{rank}
      </span>
    ) : null;
  };

  return (
    <motion.div 
      id={`candidate-${nominee.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      data-candidate-code={nominee.code.toUpperCase()}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 shadow-lg flex flex-col group relative ${
        isHighlighted
          ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-2xl shadow-amber-500/20 scale-[1.01] scroll-mt-28'
          : 'border-slate-800 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10'
      }`}
    >
      {/* Photo & Badge */}
      <div className="relative h-60 bg-slate-950 overflow-hidden rounded-xl">
        <img
          src={nominee.photoUrl}
          alt={nominee.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

        {/* Candidate Code Pill */}
        <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md text-amber-400 border border-amber-400/40 text-xs font-mono font-extrabold px-3 py-1 rounded-xl shadow-lg">
          CODE: {nominee.code}
        </div>

        {/* Highlighted Shared Badge */}
        {isHighlighted && (
          <div className="absolute top-12 left-3 z-10 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg animate-pulse">
            <Sparkles className="w-3 h-3 fill-slate-950" />
            <span>Shared Contestant</span>
          </div>
        )}

        {/* Rank Badge */}
        <div className="absolute top-3 right-3">
          {getRankBadge(nominee.rank)}
        </div>

        {/* Share Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          title="Share direct contestant link"
          className="absolute bottom-3 right-3 bg-slate-950/80 hover:bg-slate-950 text-slate-200 hover:text-amber-400 border border-slate-700 p-2 rounded-xl transition-all duration-150 ease-in-out shadow cursor-pointer flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 pr-1">Copied!</span>
            </>
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="text-[11px] font-semibold text-blue-400 tracking-wide uppercase">
            {nominee.category}
          </div>
          <h4 className="text-base font-extrabold text-white group-hover:text-amber-400 transition-colors mt-0.5 line-clamp-1">
            {nominee.name}
          </h4>
          {nominee.bio && (
            <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
              {nominee.bio}
            </p>
          )}
        </div>

        {/* Vote Progress Bar */}
        <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Total Votes:</span>
            <span className="font-extrabold text-white">
              {nominee.votes.toLocaleString()}{' '}
              <span className="text-amber-400 text-[11px]">({percentage}%)</span>
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 h-full rounded-full"
            />
          </div>
        </div>

        {/* Vote Action Button */}
        {!isVotingEnded ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onVote(nominee)}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs py-3 px-4 rounded-xl transition-all duration-150 ease-in-out shadow-md shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Cast Vote ({formatPrice(votePrice, currency)})</span>
          </motion.button>
        ) : (
          <button
            disabled
            className="w-full bg-slate-800 text-slate-400 font-extrabold text-xs py-3 px-4 rounded-xl cursor-not-allowed border border-slate-700/60 flex items-center justify-center gap-2"
          >
            <span>Voting Ended</span> 🔴
          </button>
        )}
      </div>
    </motion.div>
  );
};
