import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Nominee, Contest, CurrencyCode, VoteTransaction } from '../types';
import { formatPrice, generateRefCode, generateQrUrl } from '../utils/helpers';
import { 
  X, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  Phone, 
  Printer, 
  ArrowRight,
  Lock,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface VotingModalProps {
  nominee: Nominee;
  contest: Contest;
  currency: CurrencyCode;
  onClose: () => void;
  onConfirmVote: (transaction: VoteTransaction) => void;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  nominee,
  contest,
  currency,
  onClose,
  onConfirmVote,
}) => {
  const [selectedVotes, setSelectedVotes] = useState<number>(50);
  const [customVotes, setCustomVotes] = useState<string>('');
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'momo_mtn' | 'momo_telecel' | 'momo_airteltigo' | 'card' | 'ussd'>('momo_mtn');

  // Steps: 'selection' | 'initializing' | 'paystack_auth' | 'verifying' | 'completed' | 'error'
  const [step, setStep] = useState<'selection' | 'initializing' | 'paystack_auth' | 'verifying' | 'completed' | 'error'>('selection');
  const [errorMessage, setErrorMessage] = useState('');
  const [paystackData, setPaystackData] = useState<{
    authorization_url: string;
    access_code: string;
    reference: string;
    mode: string;
  } | null>(null);

  const [completedTransaction, setCompletedTransaction] = useState<VoteTransaction | null>(null);

  const totalVotesCount = customVotes && parseInt(customVotes) > 0 ? parseInt(customVotes) : selectedVotes;
  const priceInGHS = totalVotesCount * contest.votePrice;

  const votePackages = [
    { count: 1, label: '1 Vote', tag: '' },
    { count: 10, label: '10 Votes', tag: '' },
    { count: 50, label: '50 Votes', tag: '🔥 Most Popular' },
    { count: 100, label: '100 Votes', tag: '🌟 Best Value' },
    { count: 500, label: '500 Votes', tag: '⚡ Mega Booster' },
  ];

  // Load Paystack Inline JS script dynamically
  useEffect(() => {
    if (!document.getElementById('paystack-js-script')) {
      const script = document.createElement('script');
      script.id = 'paystack-js-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Initiate Paystack Payment via backend API
  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterPhone) {
      alert('Please enter your mobile phone number for receipt delivery and MoMo prompt.');
      return;
    }

    setStep('initializing');
    setErrorMessage('');

    try {
      const cleanPhone = voterPhone.replace(/\D/g, '');
      const email = voterEmail.trim() || `${cleanPhone || 'voter'}@voteright.gh`;

      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amountGHS: priceInGHS,
          phone: voterPhone,
          voterName: voterName || 'Anonymous Voter',
          nomineeId: nominee.id,
          nomineeName: nominee.name,
          contestId: contest.id,
          votesCount: totalVotesCount,
          reference: `VRG-PSTK-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        }),
      });

      const resData = await response.json();

      if (!resData.status || !resData.data) {
        throw new Error(resData.message || 'Failed to initialize Paystack checkout.');
      }

      setPaystackData(resData.data);

      // Attempt to launch Paystack Pop inline modal if available
      const configRes = await fetch('/api/paystack/config');
      const config = await configRes.json();
      const publicKey = config.publicKey || 'pk_test_voteright_gh_demo';

      if (window && (window as any).PaystackPop && resData.data.access_code) {
        try {
          const handler = (window as any).PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: Math.round(priceInGHS * 100),
            currency: 'GHS',
            ref: resData.data.reference,
            access_code: resData.data.access_code,
            onClose: () => {
              setStep('selection');
            },
            callback: (response: any) => {
              const ref = response.reference || resData.data.reference;
              verifyPaystackPayment(ref);
            }
          });
          handler.openIframe();
          setStep('paystack_auth');
          return;
        } catch (popErr) {
          console.warn('PaystackPop inline error, falling back to embedded modal verification:', popErr);
        }
      }

      // Fallback: Proceed to embedded Paystack authorization overlay with server verification
      setStep('paystack_auth');

    } catch (err: any) {
      console.error('Paystack Initialization Error:', err);
      setErrorMessage(err.message || 'An error occurred while connecting to Paystack.');
      setStep('error');
    }
  };

  // Verify Payment via backend API with Paystack
  const verifyPaystackPayment = async (referenceToVerify?: string) => {
    const ref = referenceToVerify || paystackData?.reference;
    if (!ref) {
      setErrorMessage('Missing transaction reference code for verification.');
      setStep('error');
      return;
    }

    setStep('verifying');

    try {
      const response = await fetch(`/api/paystack/verify/${encodeURIComponent(ref)}`);
      const data = await response.json();

      if (data.status && data.data && data.data.verified) {
        finalizeTransaction(ref, data.data.channel || paymentMethod, data.data.mode);
      } else {
        throw new Error(data.message || 'Payment verification failed or pending authorization.');
      }
    } catch (err: any) {
      console.error('Paystack Verification Error:', err);
      setErrorMessage(err.message || 'Paystack verification failed. Please try again.');
      setStep('error');
    }
  };

  const finalizeTransaction = (paystackRef: string, channel: string, mode?: string) => {
    const newTx: VoteTransaction = {
      id: `tx-${Date.now()}`,
      referenceCode: paystackRef,
      contestId: contest.id,
      contestTitle: contest.title,
      nomineeId: nominee.id,
      nomineeName: nominee.name,
      nomineeCode: nominee.code,
      category: nominee.category,
      votesCount: totalVotesCount,
      amountPaid: priceInGHS,
      currency: currency,
      voterName: voterName || 'Anonymous Voter',
      voterPhone: voterPhone,
      paymentMethod: paymentMethod,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
    };

    setCompletedTransaction(newTx);
    setStep('completed');

    // Fire celebratory multi-stage confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa']
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#fbbf24', '#34d399', '#60a5fa']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fbbf24', '#f472b6', '#a78bfa']
      });
    }, 350);

    // Notify parent to update candidate vote count in global state
    onConfirmVote(newTx);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-white my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Cast Your Votes</h3>
              <p className="text-[11px] text-slate-400">Instant Mobile Money & Card Payment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Nominee Summary */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
            <img
              src={nominee.photoUrl}
              alt={nominee.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/50 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 font-mono font-black text-[10px] px-2 py-0.5 rounded">
                  {nominee.code}
                </span>
                <span className="text-[11px] text-blue-400 font-bold truncate">
                  {nominee.category}
                </span>
              </div>
              <h4 className="font-extrabold text-white text-base truncate mt-0.5">
                {nominee.name}
              </h4>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {contest.title}
              </p>
            </div>
          </div>

          {/* STEP 1: Package Selection & Form */}
          {step === 'selection' && (
            <form onSubmit={handleStartPayment} className="space-y-5">
              {/* Vote Packages */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Select Vote Package
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {votePackages.map((pkg) => {
                    const isSelected = selectedVotes === pkg.count && !customVotes;
                    return (
                      <button
                        key={pkg.count}
                        type="button"
                        onClick={() => {
                          setSelectedVotes(pkg.count);
                          setCustomVotes('');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-amber-400/10 border-amber-400 text-white'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {pkg.tag && (
                          <span className="block text-[9px] font-extrabold text-amber-400 mb-0.5">
                            {pkg.tag}
                          </span>
                        )}
                        <div className="text-sm font-black">{pkg.label}</div>
                        <div className="text-xs text-slate-400 font-bold mt-0.5">
                          {formatPrice(pkg.count * contest.votePrice, currency)}
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom vote input */}
                  <div className="col-span-2 sm:col-span-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                    <span className="block text-[10px] font-bold text-slate-400">Custom Votes</span>
                    <input
                      type="number"
                      min="1"
                      value={customVotes}
                      onChange={(e) => {
                        setCustomVotes(e.target.value);
                      }}
                      placeholder="e.g. 250"
                      className="w-full bg-transparent text-amber-400 font-extrabold text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Select Payment Gateway
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo_mtn')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'momo_mtn'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>MTN Mobile Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo_telecel')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'momo_telecel'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-rose-400" />
                    <span>Telecel Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>Card / Visa / Mastercard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ussd')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'ussd'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>USSD Prompt (*920*88#)</span>
                  </button>
                </div>
              </div>

              {/* Voter Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    MoMo Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={voterPhone}
                    onChange={(e) => setVoterPhone(e.target.value)}
                    placeholder="e.g. 0244123456"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Total Price Banner & Paystack Badge */}
              <div className="bg-amber-400/10 border border-amber-400/30 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 font-medium block">Total Payable Amount:</span>
                  <span className="text-2xl font-black text-amber-400">
                    {formatPrice(priceInGHS, currency)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-white block">
                    {totalVotesCount} {totalVotesCount === 1 ? 'Vote' : 'Votes'}
                  </span>
                  <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 justify-end">
                    <Lock className="w-3 h-3" /> Paystack Secured
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm py-3.5 px-6 rounded-2xl transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 hover:shadow-lg hover:brightness-110 shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Pay {formatPrice(priceInGHS, currency)} via Paystack</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Initializing Paystack */}
          {step === 'initializing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">Connecting to Paystack Gateway...</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Setting up secure payment authorization for {totalVotesCount} votes for {nominee.name}.
              </p>
            </div>
          )}

          {/* STEP 3: Paystack Authorization Screen */}
          {step === 'paystack_auth' && (
            <div className="py-6 space-y-5 text-center">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-extrabold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Paystack Payment Window
                </span>
                <h3 className="text-lg font-extrabold text-white mt-2">
                  Complete Payment of {formatPrice(priceInGHS, currency)}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                  A Paystack authorization modal or mobile money prompt is active for reference:
                  <br />
                  <strong className="text-amber-400 font-mono text-xs">{paystackData?.reference}</strong>
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-w-sm mx-auto space-y-3 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Voter Phone:</span>
                  <span className="font-bold text-white">{voterPhone}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Votes Credited:</span>
                  <span className="font-bold text-emerald-400">+{totalVotesCount} Votes</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Payment Channel:</span>
                  <span className="font-bold text-amber-400 uppercase">{paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => verifyPaystackPayment()}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Payment & Confirm Votes</span>
                </button>

                {paystackData?.authorization_url && (
                  <a
                    href={paystackData.authorization_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                  >
                    <span>Open Paystack Checkout Page</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}

                <button
                  onClick={() => setStep('selection')}
                  className="text-xs text-slate-400 hover:text-white pt-1 block mx-auto cursor-pointer"
                >
                  Cancel and change payment options
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Verifying Paystack Transaction */}
          {step === 'verifying' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">Verifying Paystack Payment...</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Communicating with Paystack API server to authenticate transaction reference <strong className="text-amber-400 font-mono">{paystackData?.reference}</strong>.
              </p>
            </div>
          )}

          {/* STEP 5: Error State */}
          {step === 'error' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-white">Paystack Payment Error</h3>
                <p className="text-xs text-rose-300 mt-1 max-w-xs mx-auto bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  {errorMessage || 'Unable to verify payment with Paystack.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setStep('selection')}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Back to Packages
                </button>
                <button
                  onClick={() => verifyPaystackPayment()}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Verification</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Completed State & Official Paystack Digital Receipt */}
          {step === 'completed' && completedTransaction && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300 relative">
              {/* Subtle Confetti Overlay Particles */}
              <div className="absolute -inset-4 pointer-events-none overflow-hidden rounded-3xl z-10">
                <div className="absolute top-2 left-6 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
                <div className="absolute top-4 right-10 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75 delay-300" />
                <div className="absolute top-1/3 left-3 w-3 h-3 rounded-full bg-sky-400/80 animate-bounce delay-150" />
                <div className="absolute top-1/2 right-4 w-2.5 h-2.5 rounded-full bg-pink-400/80 animate-bounce delay-500" />
                <div className="absolute bottom-10 left-12 w-2 h-2 rounded-full bg-purple-400/80 animate-ping delay-700" />
              </div>

              <div className="text-center space-y-2 relative z-20">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">
                  Vote Successfully Cast!
                </h3>
                <p className="text-xs text-slate-300">
                  Added <strong className="text-amber-400">+{completedTransaction.votesCount} votes</strong> to {nominee.name}.
                </p>
              </div>

              {/* Official Paystack Digital Voting Receipt Card */}
              <div className="bg-slate-950 border-2 border-dashed border-amber-400/40 rounded-2xl p-5 space-y-4 relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase block tracking-wider">
                      OFFICIAL VOTE RECEIPT
                    </span>
                    <span className="text-sm font-extrabold text-white font-mono">
                      Ref: {completedTransaction.referenceCode}
                    </span>
                  </div>
                  <img
                    src={generateQrUrl(completedTransaction.referenceCode)}
                    alt="Audit QR"
                    className="w-12 h-12 rounded bg-white p-0.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Candidate:</span>
                    <span className="font-extrabold text-white">{completedTransaction.nomineeName}</span>
                    <span className="text-[10px] text-amber-400 block font-mono">({completedTransaction.nomineeCode})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Contest:</span>
                    <span className="font-bold text-slate-200 line-clamp-1">{completedTransaction.contestTitle}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Votes Credited:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">+{completedTransaction.votesCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Amount Paid:</span>
                    <span className="font-extrabold text-amber-400">{formatPrice(completedTransaction.amountPaid, currency)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Voter Phone:</span>
                    <span className="font-medium text-slate-300">{completedTransaction.voterPhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Paystack Status:</span>
                    <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> PAYSTACK VERIFIED
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-center text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span>{new Date(completedTransaction.timestamp).toLocaleString()}</span>
                  <span className="text-blue-400 font-bold">Paystack Authenticated</span>
                </div>
              </div>

              {/* Receipt Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>

                <button
                  onClick={onClose}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <span>Done / Close</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
