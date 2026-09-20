import React from 'react';
import { motion } from 'motion/react';
import { Contest, CurrencyCode, SiteSettings } from '../types';
import { formatPrice } from '../utils/helpers';
import {
  Trophy,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CreditCard,
  BarChart3,
  CheckCircle2,
  Zap,
  Globe,
  Lock,
  Layers,
  Users
} from 'lucide-react';

interface HomePageProps {
  contests: Contest[];
  currency: CurrencyCode;
  siteSettings?: SiteSettings;
  onSelectContest: (contest: Contest) => void;
  onGoToCompetitions: () => void;
  onGoToResults: () => void;
  onOpenOrganizerPortal: () => void;
  onOpenOrganizerRegistration: () => void;
  onOpenQuickVoteModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  contests,
  currency,
  siteSettings,
  onSelectContest,
  onGoToCompetitions,
  onGoToResults,
  onOpenOrganizerPortal,
  onOpenOrganizerRegistration,
  onOpenQuickVoteModal,
}) => {
  const popularShows = contests.slice(0, 5);

  return (
    <div className="space-y-12 bg-white text-slate-900 pb-16">
      {/* 1. POPULAR AWARD SHOWS SECTION */}
      <section className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4"
        >
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Popular Award Shows
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Vote for your favorites in Ghana’s most prestigious award ceremonies. Support talent across music, film, business, and more.
            </p>
          </div>

          <motion.button
            whileHover={{ x: 3 }}
            onClick={onGoToCompetitions}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* Multi-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularShows.map((contest, idx) => (
            <motion.div
              key={contest.id}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-200 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Poster image banner */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={contest.bannerUrl}
                    alt={contest.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-full shadow-md font-mono">
                    Cost Per Vote: {formatPrice(contest.votePrice, currency)}
                  </div>
                  {contest.isLive && (
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE VOTING
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                    {contest.category.toUpperCase()}
                  </span>

                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {contest.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {contest.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectContest(contest)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>View Awards Page</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. VOTING MADE EASY & REAL-TIME RESULTS SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        {/* Voting Made Easy Feature Card - Slide from left */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4 }}
          className="bg-blue-50/70 border border-blue-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-black text-slate-900">
            Website Instant Voting
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Vote directly on our web platform with 100% instant checkout. We support MTN Mobile Money, Telecel Cash, AT Money, and Visa/Mastercard. Instant voter reference receipts are generated automatically.
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-700 font-bold pt-2">
            <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <CreditCard className="w-4 h-4 text-blue-600" /> MoMo & Cards
            </span>
            <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Encrypted Audit
            </span>
          </div>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenQuickVoteModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl cursor-pointer shadow transition-all flex items-center gap-2"
            >
              <span>Vote Via Website</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Real-Time View Results Highlight - Slide from right */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4 }}
          className="bg-amber-500/10 border border-amber-400/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
            <BarChart3 className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-black text-slate-900">
            Real-Time View Results Dashboard
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Track vote tallies instantly as votes come in. View transparent leaderboards in Table View or interactive Chart View with candidate photo avatars and percentage metrics.
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-700 font-bold pt-2">
            <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-amber-200">
              <CheckCircle2 className="w-4 h-4 text-amber-500" /> Live Updates
            </span>
            <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-amber-200">
              <Trophy className="w-4 h-4 text-amber-500" /> Candidate Photos
            </span>
          </div>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGoToResults}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-6 py-3 rounded-xl cursor-pointer shadow transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Results</span>
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* 4. PLATFORM FEATURES GRID ("Ghana's Most Advanced Voting Platform") */}
      <section className="space-y-6 bg-slate-50/80 p-8 rounded-3xl border border-slate-200">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto space-y-2"
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            Why Choose Us
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ghana’s Most Advanced Voting Platform
          </h2>
          <p className="text-xs text-slate-500">
            Engineered for high-volume awards shows, pageants, union elections, and concert ticketing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {[
            { icon: Zap, title: "Simple Setup", desc: "Launch your award competition or pageant within minutes with customizable categories and nominee codes.", dir: -40 },
            { icon: Globe, title: "Nationwide Accessibility", desc: "Voters across Ghana and the diaspora can cast votes effortlessly on any mobile device or browser.", dir: 0 },
            { icon: Layers, title: "Seamless Voting", desc: "Direct nominee code lookup ensures voters find their favorite candidates in a single click.", dir: 40 },
            { icon: CreditCard, title: "Multiple Payment Methods", desc: "Instant MoMo support for MTN, Telecel, AT Money, alongside international Visa and Mastercard processing.", dir: -40 },
            { icon: Lock, title: "Secure Online Voting", desc: "Cryptographic reference hashes protect every transaction against tampering or duplicate tallying.", dir: 0 },
            { icon: BarChart3, title: "Real-Time Results Dashboard", desc: "Organizers and fans monitor live vote counts, total revenue, and candidate ranking in real time.", dir: 40 },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: feat.dir, y: feat.dir === 0 ? 30 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-xs hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">{feat.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 5. EVENT ORGANIZER FOOTER CTA BANNER */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
      >
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-2 text-center md:text-left"
        >
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to Create Your Next Event?
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Join thousands of successful event organizers using VoteRight GH for secure awards voting, instant payout accounting, and e-tickets.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenOrganizerRegistration}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer shrink-0 flex items-center gap-2"
        >
          <span>Get Started Now →</span>
        </motion.button>
      </motion.section>

      {/* Footer Text */}
      <div className="text-center pt-6 border-t border-slate-200 text-xs text-slate-500">
        All Rights Reserved ©2026 VoteRight GH • Ghana’s Leading Awards Voting and Event Ticketing Platform
      </div>
    </div>
  );
};
