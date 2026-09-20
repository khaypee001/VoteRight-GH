import React, { useState } from 'react';
import { Nominee, Contest } from '../types';
import { Search, Zap, X, AlertCircle } from 'lucide-react';

interface QuickVoteModalProps {
  nominees: Nominee[];
  contests: Contest[];
  initialCode?: string;
  onSelectCandidateToVote: (nominee: Nominee, contest: Contest) => void;
  onClose: () => void;
}

export const QuickVoteModal: React.FC<QuickVoteModalProps> = ({
  nominees,
  contests,
  initialCode = '',
  onSelectCandidateToVote,
  onClose,
}) => {
  const [code, setCode] = useState(initialCode);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = code.trim().toUpperCase();
    if (!query) {
      setErrorMsg('Please enter a valid candidate code (e.g. VRG-101)');
      return;
    }

    const foundNominee = nominees.find(
      (n) => n.code.toUpperCase() === query || n.name.toUpperCase().includes(query)
    );

    if (!foundNominee) {
      setErrorMsg(`No candidate found matching code "${query}". Check the code and try again.`);
      return;
    }

    const foundContest = contests.find((c) => c.id === foundNominee.contestId);
    if (!foundContest) {
      setErrorMsg('Contest for this nominee could not be found.');
      return;
    }

    // Launch voting directly
    onSelectCandidateToVote(foundNominee, foundContest);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-white my-8">
        <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Direct Vote by Code</h3>
              <p className="text-[11px] text-slate-400">Jump directly to voting</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close direct vote modal"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Enter Candidate Code or Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="e.g. VRG-101, JHS-01, MED-01..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-amber-400 font-mono font-extrabold text-base rounded-2xl pl-10 pr-4 py-3.5 focus:outline-none uppercase tracking-wider"
                />
                <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-400/20 cursor-pointer"
            >
              Lookup & Cast Vote
            </button>
          </form>

          {/* Quick Code suggestions */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block">
              Sample Candidate Codes to Try:
            </span>
            <div className="flex flex-wrap gap-2">
              {nominees.slice(0, 4).map((nom) => (
                <button
                  key={nom.id}
                  onClick={() => {
                    setCode(nom.code);
                    setErrorMsg('');
                    const c = contests.find((ct) => ct.id === nom.contestId);
                    if (c) onSelectCandidateToVote(nom, c);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-amber-400/50 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400">{nom.code}</span>
                  <span className="text-slate-400 font-sans text-[10px] truncate max-w-[100px]">{nom.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
