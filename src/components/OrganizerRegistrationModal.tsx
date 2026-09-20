import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Mail, Phone, DollarSign, Building2, Lock, ArrowRight } from 'lucide-react';

interface OrganizerRegistrationModalProps {
  onRegisterSuccess: (organizerProfile: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    eventTitle: string;
    paidFlatFee: boolean;
    isVerified: boolean;
    isBlocked: boolean;
  }) => void;
  onClose: () => void;
}

export const OrganizerRegistrationModal: React.FC<OrganizerRegistrationModalProps> = ({
  onRegisterSuccess,
  onClose,
}) => {
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [fullName, setFullName] = useState('');
  const [gmailEmail, setGmailEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'telecel' | 'airteltigo'>('mtn');
  const [momoNumber, setMomoNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailEmail.toLowerCase().includes('@')) {
      alert('Please enter a valid Gmail / Email address.');
      return;
    }
    setMomoNumber(phone);
    setStep('payment');
  };

  const handlePaySetupFee = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const newProfile = {
        id: `org-${Date.now()}`,
        email: gmailEmail,
        fullName: fullName || 'Event Organizer',
        phone: momoNumber,
        eventTitle,
        paidFlatFee: true,
        isVerified: false, // Pending Admin Verification
        isBlocked: false,
      };
      onRegisterSuccess(newProfile);
      setStep('success');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close registration popup"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'details' && (
          <>
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full inline-block">
                Organizer Onboarding
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Register as an Event Organizer
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Host your awards show, pageant, or SRC elections on VoteRight GH. Onboard your event with full instant mobile money voting and ticketing.
              </p>
            </div>

            {/* Flat Fee Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 font-black text-slate-950" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-900">One-Time Platform Setup Fee</div>
                  <div className="text-lg font-black text-slate-950">GHS 100.00 Flat Fee</div>
                </div>
              </div>
              <span className="bg-slate-950 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                Required
              </span>
            </div>

            <form onSubmit={handleNextToPayment} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700">Organizer / Brand Full Name</label>
                <div className="relative mt-1">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ghana Excellence Awards Ltd"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700">Official Gmail / Email Address</label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={gmailEmail}
                    onChange={(e) => setGmailEmail(e.target.value)}
                    placeholder="organizer@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Used for Gmail Auth login to your hidden <span className="font-bold text-slate-700">/organizer</span> dashboard.</p>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700">Contact Phone Number</label>
                <div className="relative mt-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="024XXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700">Event / Competition Name</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. National Youth Leadership Awards 2026"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Pay GHS 100 Setup Fee</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {step === 'payment' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Web Mobile Money Checkout
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Pay GHS 100.00 Organizer Setup Fee
              </h2>
              <p className="text-xs text-slate-500">
                Authorized checkout for event onboarding on VoteRight GH.
              </p>
            </div>

            <form onSubmit={handlePaySetupFee} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Select MoMo Network</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMomoProvider('mtn')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      momoProvider === 'mtn'
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    MTN MoMo
                  </button>

                  <button
                    type="button"
                    onClick={() => setMomoProvider('telecel')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      momoProvider === 'telecel'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Telecel Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setMomoProvider('airteltigo')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      momoProvider === 'airteltigo'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    AT Money
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Wallet Phone Number</label>
                <input
                  type="tel"
                  required
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  placeholder="024XXXXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 mt-1"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Web Instant Payment Prompt
                </div>
                <p className="text-blue-700">
                  You will receive a mobile money prompt on <span className="font-mono font-bold">{momoNumber || 'your wallet'}</span> to approve GHS 100.00.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span>Processing MoMo Prompt...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pay GHS 100.00 & Submit Application</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Status: Pending Admin Verification
              </span>
              <h3 className="text-2xl font-black text-slate-900">Application Received!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thank you! Your setup payment of GHS 100.00 has been received. Our Super Admin team will verify your Gmail (<span className="font-bold text-slate-800">{gmailEmail}</span>) within 1 hour.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="font-extrabold text-slate-800">Your Hidden Organizer Route:</div>
              <div className="bg-slate-900 text-amber-300 font-mono text-[11px] p-2.5 rounded-xl flex items-center justify-between">
                <span>https://voterightgh.com/organizer</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-500">
                You can access this route once your account status is changed to <span className="text-emerald-600 font-bold">Verified</span> by an Admin.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
