import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Mail, Phone, DollarSign, Building2, Lock, ArrowRight, CreditCard } from 'lucide-react';
import { OrganizerProfile } from '../types';

interface OrganizerRegistrationModalProps {
  onRegisterSuccess: (organizerProfile: OrganizerProfile) => void;
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
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailEmail.toLowerCase().includes('@')) {
      alert('Please enter a valid Gmail / Email address.');
      return;
    }
    if (!password) {
      alert('Please create a dashboard password.');
      return;
    }
    setStep('payment');
  };

  const handlePaystackPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    // Your verified live Paystack public key
    const publicKey = 'pk_live_f480929519f31511eaa374c3a5c5c7c246988e92';

    if (typeof (window as any).PaystackPop === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => executePaystack(publicKey);
      script.onerror = () => {
        setIsProcessing(false);
        setErrorMessage('Failed to load Paystack payment gateway. Please check your internet connection.');
      };
      document.body.appendChild(script);
    } else {
      executePaystack(publicKey);
    }
  };

  const executePaystack = (key: string) => {
    try {
      const handler = (window as any).PaystackPop.setup({
        key: key,
        email: gmailEmail.trim().toLowerCase(),
        amount: 10000, // 100 GHS in pesewas (100 * 100)
        currency: 'GHS',
        ref: 'VR_ORG_' + Math.floor((Math.random() * 1000000000) + 1),
        metadata: {
          custom_fields: [
            {
              display_name: 'Organizer Name',
              variable_name: 'organizer_name',
              value: fullName,
            },
            {
              display_name: 'Event Title',
              variable_name: 'event_title',
              value: eventTitle,
            },
            {
              display_name: 'Phone Number',
              variable_name: 'phone',
              value: phone,
            },
          ],
        },
        callback: function (response: any) {
          handleRegistrationSuccess(response.reference);
        },
        onClose: function () {
          setIsProcessing(false);
          setErrorMessage('Payment window was closed before completion. GHS 100 fee is required to activate portal.');
        },
      });
      handler.openIframe();
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage('Could not initialize payment popup. Please try again.');
    }
  };

  const handleRegistrationSuccess = (paymentRef: string) => {
    const cleanEmail = gmailEmail.trim().toLowerCase();
    const newProfile: OrganizerProfile = {
      id: `org-${Date.now()}`,
      email: cleanEmail,
      fullName: fullName || 'Event Organizer',
      phone: phone,
      agency: fullName,
      eventTitle: eventTitle,
      paidFlatFee: true,
      isVerified: true,
      isBlocked: false,
      status: 'approved',
      registeredAt: new Date().toISOString().split('T')[0],
      password: password,
    };

    // Save profile to localStorage
    let currentOrgs: OrganizerProfile[] = [];
    try {
      const saved = localStorage.getItem('voterightgh_organizer_profiles');
      if (saved) currentOrgs = JSON.parse(saved);
    } catch (e) {}

    const updatedOrgs = [newProfile, ...currentOrgs];
    localStorage.setItem('voterightgh_organizer_profiles', JSON.stringify(updatedOrgs));

    // Also update users_auth so they can log in anytime
    let usersAuth: any[] = [];
    try {
      usersAuth = JSON.parse(localStorage.getItem('voterightgh_users_auth') || '[]');
    } catch (e) {}

    usersAuth.push({
      id: newProfile.id,
      email: newProfile.email,
      password: password,
      fullName: newProfile.fullName,
      phone: newProfile.phone,
      role: 'organizer',
      status: 'approved',
      isVerified: true,
    });
    localStorage.setItem('voterightgh_users_auth', JSON.stringify(usersAuth));

    // Create active user session
    const sessionUser = {
      id: newProfile.id,
      email: newProfile.email,
      fullName: newProfile.fullName,
      role: 'organizer' as const,
    };
    localStorage.setItem('voterightgh_user', JSON.stringify(sessionUser));

    onRegisterSuccess(newProfile);
    setIsProcessing(false);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-slate-200 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                <p className="text-[10px] text-slate-500 mt-1">Used to log in to your hidden <span className="font-bold text-slate-700">/organizer</span> dashboard.</p>
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

              <div>
                <label className="text-xs font-extrabold text-slate-700">Create Dashboard Password</label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a secure password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Secure Paystack Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {step === 'payment' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Live Paystack Checkout
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Pay GHS 100.00 Setup Fee
              </h2>
              <p className="text-xs text-slate-500">
                Complete your one-time registration payment via Paystack to instantly launch your organizer dashboard.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs">
                {errorMessage}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Organizer Name:</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Email:</span>
                <span className="font-bold text-slate-900">{gmailEmail}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Event Title:</span>
                <span className="font-bold text-slate-900">{eventTitle}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-700">Total Due:</span>
                <span className="text-base font-black text-amber-600">GHS 100.00</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handlePaystackPayment}
                disabled={isProcessing}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Opening Paystack...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay GHS 100.00 Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Payment Successful & Activated
              </span>
              <h3 className="text-2xl font-black text-slate-900">Welcome, Organizer!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your payment of GHS 100.00 was successful. Your organizer account has been instantly activated.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="font-extrabold text-slate-800">Your Organizer Dashboard Route:</div>
              <div className="bg-slate-900 text-amber-300 font-mono text-[11px] p-2.5 rounded-xl flex items-center justify-between">
                <span>https://voterightgh.com/organizer</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <button
              onClick={() => {
                window.location.href = '/organizer';
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs py-3.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-lg"
            >
              Launch Organizer Dashboard Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

