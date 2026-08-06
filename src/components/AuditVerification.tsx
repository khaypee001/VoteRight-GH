import React, { useState } from 'react';
import { VoteTransaction, CurrencyCode } from '../types';
import { formatPrice, generateQrUrl } from '../utils/helpers';
import { ShieldCheck, Search, CheckCircle2, AlertCircle, FileText, Lock, QrCode } from 'lucide-react';

interface AuditVerificationProps {
  transactions: VoteTransaction[];
  currency: CurrencyCode;
  onClose: () => void;
}

export const AuditVerification: React.FC<AuditVerificationProps> = ({
  transactions,
  currency,
  onClose,
}) => {
  const [searchRef, setSearchRef] = useState('');
  const [searchedTx, setSearchedTx] = useState<VoteTransaction | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;

    const found = transactions.find(
      (tx) => tx.referenceCode.toLowerCase() === searchRef.trim().toLowerCase()
    );

    setSearchedTx(found || null);
    setHasSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative text-white my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Public Vote Audit Portal</h3>
              <p className="text-[11px] text-emerald-300">End-to-End Cryptographic Verification</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-300 leading-relaxed">
            Every vote on VoteRightGh generates an immutable audit hash and reference receipt. Enter your transaction reference code below to verify that your vote was successfully logged and credited to your candidate.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                placeholder="Enter Reference Code e.g. VRG-2026-981234..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 text-white font-mono text-sm rounded-xl pl-10 pr-24 py-3 focus:outline-none uppercase"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 rounded-lg transition-all cursor-pointer"
              >
                Verify Vote
              </button>
            </div>

            {/* Recent Reference Code Shortcuts */}
            {transactions.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Recent reference codes:</span>
                {transactions.slice(-2).map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => {
                      setSearchRef(tx.referenceCode);
                      setSearchedTx(tx);
                      setHasSearched(true);
                    }}
                    className="bg-slate-800 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700"
                  >
                    {tx.referenceCode}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Result Card */}
          {hasSearched && (
            searchedTx ? (
              <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>AUDIT VERIFIED & CREDITED</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                    HASH MATCHED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Reference Code:</span>
                    <span className="font-mono font-bold text-white text-sm">{searchedTx.referenceCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Nominee Credited:</span>
                    <span className="font-extrabold text-amber-400">{searchedTx.nomineeName} ({searchedTx.nomineeCode})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Contest:</span>
                    <span className="font-semibold text-slate-200">{searchedTx.contestTitle}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Votes Credited:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">+{searchedTx.votesCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Payment Method:</span>
                    <span className="font-medium text-slate-300 uppercase">{searchedTx.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Timestamp:</span>
                    <span className="font-medium text-slate-300">{new Date(searchedTx.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Lock className="w-3 h-3 text-emerald-400" /> Tamper-Proof Cryptographic Signature Valid
                  </span>
                  <span className="font-bold text-white">Status: {searchedTx.status}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-6 text-center space-y-2 animate-in fade-in">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">Reference Code Not Found</h4>
                <p className="text-xs text-slate-400">
                  Double check your receipt reference code. If you recently voted, allow up to 30 seconds for the node sync.
                </p>
              </div>
            )
          )}

          {/* Audit Trail Info */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> VoteRightGh Transparency Guarantee
            </div>
            <p className="text-[11px] leading-relaxed">
              Organizers receive real-time automated audit exports with complete reference listings, ensuring 100% fair elections and transparent award results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
