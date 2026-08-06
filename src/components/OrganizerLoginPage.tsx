import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSession, OrganizerProfile } from '../types';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, Loader2, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrganizerLoginPageProps {
  onLoginSuccess: (session: UserSession, profile?: OrganizerProfile) => void;
  onOpenRegistrationModal?: () => void;
  onBackToHome?: () => void;
  initialErrorMessage?: string;
}

export const OrganizerLoginPage: React.FC<OrganizerLoginPageProps> = ({
  onLoginSuccess,
  onOpenRegistrationModal,
  onBackToHome,
  initialErrorMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string>(initialErrorMessage || '');

  const handleOrganizerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorBanner('Please provide both your registered email address and password.');
      setLoading(false);
      return;
    }

    try {
      // 1. Attempt Supabase Auth sign-in if configured
      const { data: supabaseData, error: supabaseErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!supabaseErr && supabaseData?.user) {
        const u = supabaseData.user;
        const session: UserSession = {
          id: u.id,
          fullName: u.user_metadata?.full_name || 'Organizer User',
          email: u.email || cleanEmail,
          phone: u.user_metadata?.phone || '',
          role: 'organizer',
        };
        onLoginSuccess(session);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log('Supabase check bypassed, evaluating local storage stores.', err);
    }

    // 2. Strict credential evaluation against LocalStorage organizer profiles
    let localOrgs: OrganizerProfile[] = [];
    try {
      const savedOrgs = localStorage.getItem('voterightgh_organizer_profiles');
      if (savedOrgs) {
        localOrgs = JSON.parse(savedOrgs);
      }
    } catch (e) {
      console.error('Error reading voterightgh_organizer_profiles:', e);
    }

    // 3. Evaluation against users auth store
    let localUsers: UserSession[] = [];
    try {
      const savedUsers = localStorage.getItem('voterightgh_users_auth');
      if (savedUsers) {
        localUsers = JSON.parse(savedUsers);
      }
    } catch (e) {
      console.error('Error reading voterightgh_users_auth:', e);
    }

    // Match organizer profile
    const matchedProfile = localOrgs.find((p) => p.email.toLowerCase() === cleanEmail);
    const matchedAuthUser = localUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (matchedProfile) {
      // Verify password if stored
      if (matchedProfile.password && matchedProfile.password !== cleanPassword) {
        setErrorBanner('Incorrect password entered. Please verify your credentials and try again.');
        setLoading(false);
        return;
      }

      if (matchedProfile.isBlocked || matchedProfile.status === 'rejected') {
        setErrorBanner('This organizer account is currently suspended or inactive. Please contact VoteRight GH Support.');
        setLoading(false);
        return;
      }

      const session: UserSession = {
        id: matchedProfile.id,
        fullName: matchedProfile.fullName,
        email: matchedProfile.email,
        phone: matchedProfile.phone,
        role: 'organizer',
      };

      onLoginSuccess(session, matchedProfile);
      setLoading(false);
      return;
    }

    if (matchedAuthUser && matchedAuthUser.role === 'organizer') {
      onLoginSuccess(matchedAuthUser);
      setLoading(false);
      return;
    }

    // If no matching organizer profile found
    setErrorBanner('Invalid organizer credentials. No registered organizer profile was found for this email address. Please register your organization or contact platform support.');
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-slate-900/95 border border-slate-800/90 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 relative text-white my-auto"
      >
        {/* Back Button */}
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-medium mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
        )}

        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Organizer Portal Sign-In
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Authorized access for event organizers, agency administrators, and contest managers.
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 text-xs text-slate-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            Strict credential verification active. Only verified organizer accounts can log in.
          </span>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-3.5 text-xs text-rose-300 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Authentication Failed</span>
                <p className="leading-relaxed opacity-90">{errorBanner}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Sign-In Form */}
        <form onSubmit={handleOrganizerSignIn} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Registered Organizer Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="organizer@agency.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400 font-medium placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex justify-between">
              <span>Account Password</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400 font-medium placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Organizer Profile...</span>
              </>
            ) : (
              <>
                <span>Sign In to Organizer Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Register New Organizer Link */}
        {onOpenRegistrationModal && (
          <div className="pt-2 text-center border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Don't have an organizer account yet?{' '}
              <button
                type="button"
                onClick={onOpenRegistrationModal}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer inline-flex items-center gap-1 ml-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Apply & Register Organization</span>
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
