import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Contest, CurrencyCode, TicketTier } from '../types';
import { formatPrice, generateRefCode, generateQrUrl } from '../utils/helpers';
import { X, Ticket, CheckCircle2, ShieldCheck, QrCode, Smartphone, CreditCard, Printer, Lock, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface TicketModalProps {
  contest: Contest;
  currency: CurrencyCode;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  contest,
  currency,
  onClose,
}) => {
  const tiers = contest.ticketTiers || [];
  const [selectedTier, setSelectedTier] = useState<TicketTier>(tiers[0] || {
    id: 't-def',
    name: 'General Admission Pass',
    price: 15,
    description: 'General seating entry pass to the event venue',
    available: 100
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [step, setStep] = useState<'selection' | 'initializing' | 'paystack_auth' | 'verifying' | 'completed' | 'error'>('selection');
  const [ticketRef, setTicketRef] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [paystackData, setPaystackData] = useState<{
    authorization_url: string;
    access_code: string;
    reference: string;
  } | null>(null);

  const totalPriceGHS = selectedTier.price * quantity;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerPhone) {
      alert('Please enter mobile phone number for ticket SMS pass delivery.');
      return;
    }

    setStep('initializing');
    setErrorMessage('');

    try {
      const cleanPhone = buyerPhone.replace(/\D/g, '');
      const email = `${cleanPhone || 'attendee'}@voteright.gh`;

      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amountGHS: totalPriceGHS,
          phone: buyerPhone,
          voterName: buyerName || 'Event Attendee',
          contestId: contest.id,
          reference: `TKT-PSTK-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        }),
      });

      const resData = await response.json();
      if (!resData.status || !resData.data) {
        throw new Error(resData.message || 'Failed to initialize Paystack ticket checkout.');
      }

      setPaystackData(resData.data);
      setTicketRef(resData.data.reference);

      // Trigger PaystackPop Inline script if present
      const configRes = await fetch('/api/paystack/config');
      const config = await configRes.json();
      const publicKey = config.publicKey || 'pk_test_voteright_gh_demo';

      if (window && (window as any).PaystackPop && resData.data.access_code) {
        try {
          const handler = (window as any).PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: Math.round(totalPriceGHS * 100),
            currency: 'GHS',
            ref: resData.data.reference,
            access_code: resData.data.access_code,
            onClose: () => { setStep('selection'); },
            callback: (res: any) => {
              verifyTicketPayment(res.reference || resData.data.reference);
            }
          });
          handler.openIframe();
          setStep('paystack_auth');
          return;
        } catch (popErr) {
          console.warn('PaystackPop inline error, falling back to overlay verification:', popErr);
        }
      }

      setStep('paystack_auth');

    } catch (err: any) {
      console.error('Paystack Ticket Error:', err);
      setErrorMessage(err.message || 'An error occurred connecting to Paystack.');
      setStep('error');
    }
  };

  const verifyTicketPayment = async (refToVerify?: string) => {
    const ref = refToVerify || paystackData?.reference;
    if (!ref) {
      setErrorMessage('Missing ticket reference code.');
      setStep('error');
      return;
    }

    setStep('verifying');

    try {
      const response = await fetch(`/api/paystack/verify/${encodeURIComponent(ref)}`);
      const data = await response.json();

      if (data.status && data.data && data.data.verified) {
        setTicketRef(ref);
        setStep('completed');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        throw new Error(data.message || 'Payment verification failed.');
      }
    } catch (err: any) {
      console.error('Ticket Verification Error:', err);
      setErrorMessage(err.message || 'Unable to verify payment with Paystack.');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-white my-8 transition-all duration-300 ease-out scale-100 opacity-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-400/20 flex items-center justify-center border border-blue-400/30">
              <Ticket className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Buy Event E-Tickets</h3>
              <p className="text-[11px] text-blue-200">{contest.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close ticket purchase modal"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 'selection' ? (
            <form onSubmit={handlePurchase} className="space-y-5">
              {/* Ticket Tier Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Ticket Tier
                </label>
                <div className="space-y-2.5">
                  {tiers.map((tier) => {
                    const isSelected = selectedTier.id === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedTier(tier)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-extrabold text-sm text-white">{tier.name}</div>
                          <p className="text-xs text-slate-400 mt-0.5">{tier.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-amber-400">
                            {formatPrice(tier.price, currency)}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-semibold">
                            {tier.available} Left
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Quantity:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-white flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-base text-amber-400 w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-white flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buyer info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Attendee Name
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Ama Serwaa"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Phone Number for Ticket QR *
                  </label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="e.g. 0244123456"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block">Total Ticket Price:</span>
                  <span className="text-2xl font-black text-amber-400">
                    {formatPrice(totalPriceGHS, currency)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white bg-blue-600 px-3 py-1 rounded-xl block mb-1">
                    {quantity}x {selectedTier.name}
                  </span>
                  <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 justify-end">
                    <Lock className="w-3 h-3" /> Paystack Secured
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm py-3.5 px-6 rounded-2xl transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 hover:shadow-lg hover:brightness-110 shadow-xl shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Pay {formatPrice(totalPriceGHS, currency)} via Paystack</span>
              </button>
            </form>
          ) : null}

          {/* Initializing */}
          {step === 'initializing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">Connecting to Paystack...</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Setting up Paystack ticket checkout for {quantity}x {selectedTier.name}.
              </p>
            </div>
          )}

          {/* Paystack Auth */}
          {step === 'paystack_auth' && (
            <div className="py-6 space-y-5 text-center">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Paystack Ticket Purchase ({formatPrice(totalPriceGHS, currency)})
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Reference: <strong className="text-amber-400 font-mono">{paystackData?.reference}</strong>
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => verifyTicketPayment()}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Payment & Issue E-Ticket</span>
                </button>

                {paystackData?.authorization_url && (
                  <a
                    href={paystackData.authorization_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                  >
                    <span>Open Paystack Checkout Window</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Verifying */}
          {step === 'verifying' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">Verifying Paystack Payment...</h3>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-white">Payment Error</h3>
                <p className="text-xs text-rose-300 mt-1 max-w-xs mx-auto bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  {errorMessage || 'Payment could not be verified.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setStep('selection')}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={() => verifyTicketPayment()}
                  className="bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Completed State */}
          {step === 'completed' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">E-Ticket Pass Generated!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Sent via SMS & WhatsApp to <strong>{buyerPhone}</strong>.
                </p>
              </div>

              {/* Ticket Card Preview */}
              <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-dashed border-blue-500/40 rounded-2xl p-5 space-y-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-blue-400 font-mono font-bold uppercase">
                      XCELVOTE E-TICKET PASS
                    </span>
                    <h4 className="font-extrabold text-white text-base mt-0.5">{contest.title}</h4>
                  </div>
                  <img
                    src={generateQrUrl(ticketRef)}
                    alt="Ticket QR"
                    className="w-16 h-16 rounded bg-white p-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pass Holder:</span>
                    <span className="font-extrabold text-white">{buyerName || 'Attendee'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tier:</span>
                    <span className="font-extrabold text-amber-400">{selectedTier.name} ({quantity} Pass)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pass Code:</span>
                    <span className="font-mono text-emerald-400 font-bold">{ticketRef}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Status:</span>
                    <span className="font-bold text-emerald-400">VALID FOR ENTRY</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Ticket
                </button>

                <button
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-3 rounded-xl cursor-pointer"
                >
                  Close Pass
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
