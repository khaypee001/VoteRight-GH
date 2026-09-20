import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Trophy, Zap, CheckCircle2, Award, Users, BarChart3, Lock, ArrowRight } from 'lucide-react';
import { SiteSettings } from '../types';

interface AboutPageProps {
  siteSettings?: SiteSettings;
  onGoToCompetitions: () => void;
  onGoToContact: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  siteSettings,
  onGoToCompetitions,
  onGoToContact,
}) => {
  const brandName = siteSettings?.siteName || 'VoteRight GH';

  return (
    <div className="space-y-12 bg-white text-slate-900 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-blue-800/60 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-blue-400/30">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            About Our Platform
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Empowering Transparent Awards Voting & E-Ticketing in Ghana
          </h1>

          <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
            {brandName} is Ghana’s premier digital gateway for high-integrity public voting, beauty pageants, excellence awards, campus elections, and e-ticketing. We bridge event organizers, contestants, and voters with seamless Mobile Money and Card payment technologies.
          </p>
        </div>
      </motion.div>

      {/* Core Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-slate-50 border border-slate-200 rounded-3xl p-7 space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Our Mission</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To provide organizers and audiences across Ghana and West Africa with a completely tamper-proof, transparent, and user-friendly voting infrastructure. Every vote cast on our system is instantly tallied, verifiable, and protected by bank-grade security protocols.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-slate-50 border border-slate-200 rounded-3xl p-7 space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Our Vision</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To be the undisputed standard for African creative industry recognitions and live event commerce, making participation frictionless for fans worldwide supporting their favorite contestants.
          </p>
        </motion.div>
      </div>

      {/* Why Choose VoteRight GH */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Why Choose {brandName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Built from the ground up for speed, transparency, and maximum reliability during peak vote surges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Instant MoMo & Card Checkout</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Voters can cast single or bulk votes effortlessly through MTN Mobile Money, Telecel Cash, AT Money, and Visa/Mastercard.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Real-Time Live Results</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Public and private leaderboards update instantly as transactions confirm, ensuring full transparency for nominees and voters.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Verifiable Transaction Hashes</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every vote generates a unique reference code that can be audited independently using our public audit verification tool.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Organizer Management Portal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Event hosts get dedicated dashboards to configure categories, approve nominees, monitor analytics, and request automated payouts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Dedicated Nominee Portals</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Contestants receive short voting codes, branded vote cards, and sharable direct URLs to rally their supporters on social media.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Fraud & Bot Mitigation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Multi-factor payment verification prevents duplicate or spoofed ballots, ensuring only legitimate public votes count.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-2xl font-black">Ready to explore ongoing competitions?</h3>
          <p className="text-xs text-slate-400">
            Browse through active award ceremonies or get in touch with our team for event hosting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onGoToCompetitions}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>Explore Events</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onGoToContact}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs px-5 py-3.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};
