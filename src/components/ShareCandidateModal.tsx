import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Nominee, Contest } from '../types';
import { getCandidateShareUrl, generateQrUrl, copyToClipboard } from '../utils/helpers';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Sparkles,
  Smartphone,
  Download
} from 'lucide-react';

interface ShareCandidateModalProps {
  nominee: Nominee;
  contest?: Contest | null;
  onClose: () => void;
}

export const ShareCandidateModal: React.FC<ShareCandidateModalProps> = ({
  nominee,
  contest,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qr'>('link');

  // Construct fallback contest object if not provided
  const contestObj = contest || {
    id: nominee.contestId,
    title: 'VoteRight GH Awards',
  };

  const shareUrl = getCandidateShareUrl(contestObj, nominee);
  const qrCodeUrl = generateQrUrl(shareUrl);

  const shareMessage = `🌟 Vote for ${nominee.name} (${nominee.code}) in ${contestObj.title}! Tap the link to cast your vote now: ${shareUrl}`;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Support ${nominee.name} (${nominee.code}) in ${contestObj.title}! Cast your vote now:`
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Vote for ${nominee.name} - ${contestObj.title}`,
          text: shareMessage,
          url: shareUrl,
        });
      } catch (err) {
        // Ignored or dismissed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-white my-8"
        >
          {/* Sticky Header with prominent close button */}
          <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                <Share2 className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base leading-tight">
                  Share & Rally Votes
                </h3>
                <p className="text-[11px] text-slate-400">Direct Voting & Campaign Asset</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
              aria-label="Close share modal"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Candidate Summary Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3.5">
              <img
                src={nominee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                alt={nominee.name}
                className="w-14 h-14 rounded-xl object-cover border border-amber-400/40 shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                    {nominee.code}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {nominee.category}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white truncate mt-1">
                  {nominee.name}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {contestObj.title}
                </p>
              </div>
            </div>

            {/* Tab Switcher: Direct Link vs QR Code */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'link'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Direct Link</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code Poster</span>
              </button>
            </div>

            {activeTab === 'link' ? (
              <div className="space-y-4">
                {/* Copy Link Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Direct Voting Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        copied
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Instant Social Channels */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Share directly to supporters
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-200" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTwitterShare}
                      className="bg-sky-600/90 hover:bg-sky-500 text-white font-bold text-xs py-3 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Share2 className="w-4 h-4 text-sky-200" />
                      <span>X / Twitter</span>
                    </button>
                  </div>

                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>More Share Options...</span>
                    </button>
                  )}
                </div>

                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    When voters click this link, the app automatically navigates to {nominee.name}'s page with code <strong className="text-white font-mono">{nominee.code}</strong> pre-selected!
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-white p-4 rounded-2xl inline-block shadow-xl mx-auto">
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code to vote for ${nominee.name}`}
                    className="w-44 h-44 mx-auto rounded-lg"
                  />
                  <div className="mt-2 text-slate-950 font-black text-xs font-mono tracking-wider">
                    {nominee.code}
                  </div>
                </div>

                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Scan with any phone camera to vote instantly for <span className="text-white font-bold">{nominee.name}</span>.
                </p>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <a
                    href={qrCodeUrl}
                    download={`vote-${nominee.code}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Download QR Image</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Close Button */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-semibold rounded-xl border border-slate-800 hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Done / Close</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
