import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Search, 
  UserPlus, 
  X, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  Key,
  Database,
  Receipt,
  Trophy,
  Ticket
} from 'lucide-react';
import { SiteSettings } from '../types';

interface PortalsHubModalProps {
  siteSettings?: SiteSettings;
  onOpenAdminPortal: () => void;
  onOpenOrganizerPortal: () => void;
  onOpenAuditPortal: () => void;
  onOpenOrganizerRegister: () => void;
  onClose: () => void;
}

export const PortalsHubModal: React.FC<PortalsHubModalProps> = ({
  siteSettings,
  onOpenAdminPortal,
  onOpenOrganizerPortal,
  onOpenAuditPortal,
  onOpenOrganizerRegister,
  onClose,
}) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'organizer' | 'voter' | 'register'>('organizer');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative text-white my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">
                {siteSettings?.siteName || 'VoteRight GH'} Access Portals Hub
              </h3>
              <p className="text-xs text-slate-400">
                Select your portal role to launch dashboard & system tools
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Super Admin Portal */}
            <div 
              onClick={() => setSelectedRole('admin')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                selectedRole === 'admin'
                  ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-400/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  System Master
                </span>
              </div>
              <h4 className="font-black text-white text-base">Super Admin Portal</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Full platform control: adjust votes, manage contests, edit site settings, review ticker & database RLS logs.
              </p>
            </div>

            {/* 2. Event Organizer Portal */}
            <div 
              onClick={() => setSelectedRole('organizer')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                selectedRole === 'organizer'
                  ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500 text-white">
                  Event Host
                </span>
              </div>
              <h4 className="font-black text-white text-base">Organizer Portal</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Manage your award show flyers, approve candidate entries, inspect vote tallies, and view MoMo payout audits.
              </p>
            </div>

            {/* 3. Voter Audit & Receipt Portal */}
            <div 
              onClick={() => setSelectedRole('voter')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                selectedRole === 'voter'
                  ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-400/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-400 text-slate-950">
                  Public Audit
                </span>
              </div>
              <h4 className="font-black text-white text-base">Voter Verification & Receipt Portal</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Cryptographic transaction search, vote verification hashes, official digital receipts, and e-ticket QR passes.
              </p>
            </div>

            {/* 4. Host Registration Hub */}
            <div 
              onClick={() => setSelectedRole('register')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                selectedRole === 'register'
                  ? 'bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-400/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-400 text-slate-950">
                  Onboarding
                </span>
              </div>
              <h4 className="font-black text-white text-base">Host Registration Hub</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Register a new awards scheme or event on {siteSettings?.siteName || 'VoteRight GH'}, pay setup fee, and request verification.
              </p>
            </div>

          </div>

          {/* Role Action Button */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs text-slate-300 font-medium">
                {selectedRole === 'admin' && 'Enter master password or authenticate to access Super Admin dashboard.'}
                {selectedRole === 'organizer' && 'Access isolated event control dashboard for verified event organizers.'}
                {selectedRole === 'voter' && 'Search vote transaction hashes & print digital payment receipts.'}
                {selectedRole === 'register' && 'Submit host profile details & configure instant MoMo checkout for your event.'}
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (selectedRole === 'admin') onOpenAdminPortal();
                if (selectedRole === 'organizer') onOpenOrganizerPortal();
                if (selectedRole === 'voter') onOpenAuditPortal();
                if (selectedRole === 'register') onOpenOrganizerRegister();
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/20 cursor-pointer shrink-0 flex items-center gap-2"
            >
              <span>Launch Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
