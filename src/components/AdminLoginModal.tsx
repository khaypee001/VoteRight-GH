import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Mail, Key, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types';

interface AdminLoginModalProps {
  onUnlockSuccess: (session?: UserSession) => void;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onUnlockSuccess,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both Email/Username and Password.');
      setLoading(false);
      return;
    }

    // Pure Standalone Local Authentication Check
    const isValidUsername =
      cleanEmail === 'admin' ||
      cleanEmail === 'admin@voteright.gh' ||
      cleanEmail === 'admin@voterightgh.com' ||
      cleanEmail === 'admin@gmail.com' ||
      cleanEmail === 'petarh225@gmail.com';

    const isValidPassword =
      cleanPassword === 'admin123' ||
      cleanPassword === 'VoteRightAdmin2026!' ||
      cleanPassword === 'Dhon1Kliq@' ||
      cleanPassword === 'AdminPass2026!' ||
      cleanPassword.toLowerCase() === 'admin';

    if (isValidUsername && isValidPassword) {
      const adminSession: UserSession = {
        id: 'usr-admin-local',
        fullName: 'System Administrator',
        email: cleanEmail.includes('@') ? cleanEmail : 'admin@voteright.gh',
        phone: '0240000000',
        role: 'admin',
      };

      // Store local admin session keys
      localStorage.setItem('voteright_admin_session', 'true');
      localStorage.setItem('isAdminAuthenticated', 'true');
      localStorage.setItem('voterightgh_user', JSON.stringify(adminSession));

      setSuccessMessage('Administrator credentials verified! Opening Admin Portal...');

      setTimeout(() => {
        setLoading(false);
        onUnlockSuccess(adminSession);
      }, 300);
    } else {
      setLoading(false);
      setError('Invalid administrator credentials. Please check your Username and Password.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative text-white my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Admin Authentication</h3>
              <p className="text-[11px] text-slate-400">VoteRight GH Control Panel Access</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close admin login modal"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-relaxed font-medium">{error}</span>
          </motion.div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="leading-relaxed font-medium">{successMessage}</span>
          </motion.div>
        )}

        {/* Minimalist Authentication Form */}
        <form onSubmit={handleAdminSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-medium text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-amber-400 font-mono font-bold text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Sign in as Admin</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};


