import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSession, OrganizerProfile } from '../types';
import { User, Lock, Mail, Phone, ArrowRight, AlertTriangle, ShieldCheck, Loader2, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  organizerProfiles?: OrganizerProfile[];
  errorMessage?: string;
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ organizerProfiles = [], errorMessage: propsErrorMessage, onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [errorBanner, setErrorBanner] = useState<string>(propsErrorMessage || '');
  const [loading, setLoading] = useState(false);

  // Detect if accessed via /organizer route
  const isOrganizerRoute = typeof window !== 'undefined' && window.location.pathname.toLowerCase().startsWith('/organizer');

  useEffect(() => {
    if (propsErrorMessage) {
      setErrorBanner(propsErrorMessage);
    }
  }, [propsErrorMessage]);

  // Sign In Form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorBanner('');

    const cleanEmail = signInEmail.trim().toLowerCase();
    const cleanPassword = signInPassword.trim();

    // 1. Try Supabase Auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: signInPassword,
      });

      if (!error && data?.session?.user) {
        // Query profile from Supabase profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_verified, is_blocked, full_name, phone')
          .eq('id', data.session.user.id)
          .single();

        let role: 'user' | 'organizer' | 'admin' = profile?.role || 'user';
        
        if (role === 'organizer' && (profile?.is_verified === false || profile?.is_blocked === true)) {
          setErrorBanner('Account pending approval. An Administrator must approve your email address before you can access the organizer dashboard.');
          setLoading(false);
          return;
        }

        const session: UserSession = {
          id: data.session.user.id,
          fullName: profile?.full_name || data.session.user.email?.split('@')[0] || 'User',
          email: data.session.user.email || cleanEmail,
          phone: profile?.phone || '',
          role,
        };

        setLoading(false);
        onLoginSuccess(session);
        return;
      }
    } catch (err) {
      console.log('Supabase sign-in notice:', err);
    }

    // 2. Local credentials check against registered profiles & auth users
    let localOrgs: OrganizerProfile[] = organizerProfiles;
    try {
      const savedOrgs = localStorage.getItem('voterightgh_organizer_profiles');
      if (savedOrgs) {
        const parsed = JSON.parse(savedOrgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localOrgs = parsed;
        }
      }
    } catch (err) {
      console.error('Error reading voterightgh_organizer_profiles:', err);
    }

    let localAuthUsers: any[] = [];
    try {
      const savedAuth = localStorage.getItem('voterightgh_users_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (Array.isArray(parsed)) {
          localAuthUsers = parsed;
        }
      }
    } catch (err) {
      console.error('Error reading voterightgh_users_auth:', err);
    }

    const matchedOrg = localOrgs.find((o) => o.email.toLowerCase() === cleanEmail);
    const matchedAuthUser = localAuthUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    let role: 'user' | 'organizer' | 'admin' = 'user';

    if (
      cleanEmail === 'admin@voteright.gh' ||
      cleanEmail === 'admin@voterightgh.com' ||
      cleanEmail === 'admin@gmail.com' ||
      cleanEmail === 'admin'
    ) {
      role = 'admin';
    } else if (matchedOrg || (matchedAuthUser && matchedAuthUser.role === 'organizer')) {
      // Validate password if configured on profile or auth record
      const expectedPassword = matchedOrg?.password || matchedAuthUser?.password;
      if (expectedPassword && cleanPassword && cleanPassword !== expectedPassword) {
        setErrorBanner('Invalid email address or password. Please verify your credentials and try again.');
        setLoading(false);
        return;
      }

      // Check approval/verification status
      const isBlocked =
        matchedOrg?.isBlocked === true ||
        matchedOrg?.status === 'rejected' ||
        matchedAuthUser?.isBlocked === true ||
        matchedAuthUser?.status === 'rejected' ||
        matchedAuthUser?.status === 'blocked';

      const isApproved = matchedOrg
        ? matchedOrg.isVerified === true ||
          matchedOrg.status === 'approved' ||
          (matchedOrg.isVerified !== false && matchedOrg.status !== 'pending' && matchedOrg.status !== 'rejected')
        : matchedAuthUser
        ? matchedAuthUser.isVerified === true || matchedAuthUser.status === 'approved'
        : true;

      if (isBlocked || !isApproved) {
        setErrorBanner('Account pending approval. An Administrator must approve your email address before you can access the organizer dashboard.');
        setLoading(false);
        return;
      }

      role = 'organizer';
    } else if (isOrganizerRoute) {
      // Reject organizer login if no registered organizer account exists
      setErrorBanner('Invalid organizer credentials. No registered organizer account found for this email address. Please register your organization or contact system support.');
      setLoading(false);
      return;
    } else if (matchedAuthUser) {
      if (matchedAuthUser.password && cleanPassword && cleanPassword !== matchedAuthUser.password) {
        setErrorBanner('Invalid email address or password. Please try again.');
        setLoading(false);
        return;
      }
      role = matchedAuthUser.role || 'user';
    }

    const session: UserSession = {
      id: matchedOrg?.id || matchedAuthUser?.id || `usr-${Date.now()}`,
      fullName: matchedOrg?.fullName || matchedAuthUser?.fullName || cleanEmail.split('@')[0] || 'User',
      email: cleanEmail,
      phone: matchedOrg?.phone || matchedAuthUser?.phone || '0240000000',
      role,
    };

    setLoading(false);
    onLoginSuccess(session);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorBanner('');

    const cleanEmail = signUpEmail.trim().toLowerCase();
    const cleanPassword = signUpPassword.trim();
    const cleanFullName = signUpFullName.trim();
    const cleanPhone = signUpPhone.trim();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            full_name: cleanFullName,
            phone: cleanPhone,
          },
        },
      });

      if (!error && data?.user) {
        // Try creating profile record in profiles table
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: cleanEmail,
            full_name: cleanFullName,
            phone: cleanPhone,
            role: 'user',
            is_verified: true,
            is_blocked: false,
          },
        ]).select();
      }
    } catch (err) {
      console.log('Supabase sign-up notice:', err);
    }

    // Persist to local users auth store for fallback login
    try {
      const savedAuth = localStorage.getItem('voterightgh_users_auth');
      const usersAuth: any[] = savedAuth ? JSON.parse(savedAuth) : [];
      const existingIdx = usersAuth.findIndex((u) => u.email && u.email.toLowerCase() === cleanEmail);
      
      const newAuthUser = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        password: cleanPassword,
        fullName: cleanFullName,
        phone: cleanPhone,
        role: 'user',
        status: 'approved',
        isVerified: true,
      };

      if (existingIdx >= 0) {
        // Preserve role if already organizer or admin
        const existingRole = usersAuth[existingIdx].role || 'user';
        usersAuth[existingIdx] = {
          ...usersAuth[existingIdx],
          ...newAuthUser,
          role: existingRole,
        };
      } else {
        usersAuth.push(newAuthUser);
      }
      localStorage.setItem('voterightgh_users_auth', JSON.stringify(usersAuth));
    } catch (err) {
      console.error('Error saving user to voterightgh_users_auth:', err);
    }

    const session: UserSession = {
      id: `usr-${Date.now()}`,
      fullName: cleanFullName,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'user',
    };
    setLoading(false);
    onLoginSuccess(session);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-md mx-auto py-8 bg-white text-slate-900"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            {isOrganizerRoute ? <Building2 className="w-6 h-6 text-amber-300" /> : <User className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isOrganizerRoute ? 'Organizer Portal Sign-In' : 'Account Access'}
          </h2>
          <p className="text-xs text-slate-500">
            {isOrganizerRoute
              ? 'Enter your registered organizer credentials to access the management portal.'
              : 'Sign in to access your voter account or organizer dashboard.'}
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorBanner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-50 border border-rose-300 p-4 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-semibold"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorBanner}</div>
          </motion.div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Container with AnimatePresence */}
        <AnimatePresence mode="wait">
          {mode === 'signin' ? (
            <motion.form 
              key="signin"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignIn} 
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-extrabold text-slate-700">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700">Password</label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form 
              key="signup"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignUp} 
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-extrabold text-slate-700">Full Name</label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder="e.g. Ama Osei"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700">Phone Number</label>
                <div className="relative mt-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="024XXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700">Password</label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
