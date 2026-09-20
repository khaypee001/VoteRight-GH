import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TicketEvent, CurrencyCode, TicketPurchase, TicketTier } from '../types';
import { formatPrice, generateQrUrl } from '../utils/helpers';
import {
  Ticket,
  Search,
  Calendar,
  MapPin,
  CheckCircle2,
  X,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Printer,
  ExternalLink,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  Share2,
  Check,
  Tag,
  Building2,
  ChevronRight,
  Info
} from 'lucide-react';

interface TicketsPageProps {
  events: TicketEvent[];
  currency: CurrencyCode;
  purchasedTickets?: TicketPurchase[];
  onPurchaseTicketSuccess: (purchase: TicketPurchase) => void;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({
  events,
  currency,
  purchasedTickets = [],
  onPurchaseTicketSuccess,
}) => {
  const [activeView, setActiveView] = useState<'browse' | 'my_passes'>('browse');
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Checkout Modal State
  const [selectedEvent, setSelectedEvent] = useState<TicketEvent | null>(null);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [paymentNetwork, setPaymentNetwork] = useState<'mtn' | 'telecel' | 'at' | 'card'>('mtn');
  const [telecelVoucher, setTelecelVoucher] = useState('');

  // Payment Status State
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'initializing' | 'authenticating' | 'verifying' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeReference, setActiveReference] = useState('');
  const [activeAuthorizationUrl, setActiveAuthorizationUrl] = useState('');
  const [issuedTicket, setIssuedTicket] = useState<TicketPurchase | null>(null);

  // Detail View for previously purchased tickets
  const [viewingPass, setViewingPass] = useState<TicketPurchase | null>(null);
  const [copiedPassCode, setCopiedPassCode] = useState<string | null>(null);

  // Categories extraction
  const categories = ['All', ...Array.from(new Set(events.map((e) => e.category)))];

  const filteredEvents = events.filter((evt) => {
    const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
    const matchesSearch =
      evt.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      evt.venue.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      evt.organizer.toLowerCase().includes(ticketSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenCheckout = (evt: TicketEvent, tier?: TicketTier) => {
    setSelectedEvent(evt);
    setSelectedTier(tier || evt.ticketTiers[0] || null);
    setQuantity(1);
    setBuyerName('');
    setBuyerPhone('');
    setBuyerEmail('');
    setTelecelVoucher('');
    setCheckoutStep('form');
    setErrorMessage('');
    setActiveReference('');
    setActiveAuthorizationUrl('');
    setIssuedTicket(null);
  };

  const calculateTotalGHS = () => {
    if (!selectedTier) return 0;
    return selectedTier.price * quantity;
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !selectedTier) return;

    if (!buyerPhone.trim()) {
      alert('Please enter your mobile phone number for Mobile Money payment and ticket delivery.');
      return;
    }

    if (!buyerName.trim()) {
      alert('Please enter the pass holder name to appear on the official ticket.');
      return;
    }

    setCheckoutStep('initializing');
    setErrorMessage('');

    const totalGHS = calculateTotalGHS();
    const cleanPhone = buyerPhone.replace(/\D/g, '');
    const email = buyerEmail.trim() || `${cleanPhone || 'attendee'}@voteright.gh`;
    const reference = `TKT-VRG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amountGHS: totalGHS,
          phone: buyerPhone,
          voterName: buyerName,
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          tierName: selectedTier.name,
          quantity,
          type: 'ticket',
          reference,
        }),
      });

      const resData = await response.json();
      if (!resData.status || !resData.data) {
        throw new Error(resData.message || 'Unable to connect to Paystack payment gateway.');
      }

      setActiveReference(resData.data.reference || reference);
      setActiveAuthorizationUrl(resData.data.authorization_url || '');

      // Check for PaystackPop inline script
      const configRes = await fetch('/api/paystack/config');
      const config = await configRes.json();
      const publicKey = config.publicKey || 'pk_test_voteright_gh_demo';

      if (typeof window !== 'undefined' && (window as any).PaystackPop && resData.data.access_code) {
        try {
          const handler = (window as any).PaystackPop.setup({
            key: publicKey,
            email,
            amount: Math.round(totalGHS * 100),
            currency: 'GHS',
            ref: resData.data.reference || reference,
            access_code: resData.data.access_code,
            onClose: () => {
              setCheckoutStep('authenticating');
            },
            callback: (popRes: any) => {
              const verifiedRef = popRes.reference || resData.data.reference || reference;
              verifyTicketPayment(verifiedRef);
            },
          });
          handler.openIframe();
          setCheckoutStep('authenticating');
          return;
        } catch (popErr) {
          console.warn('Paystack inline iframe blocked or failed, continuing with direct verification:', popErr);
        }
      }

      setCheckoutStep('authenticating');
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setErrorMessage(err.message || 'Could not initialize payment. Please try again.');
      setCheckoutStep('error');
    }
  };

  const verifyTicketPayment = async (refToVerify?: string) => {
    const ref = refToVerify || activeReference;
    if (!ref) {
      setErrorMessage('Missing transaction reference code.');
      setCheckoutStep('error');
      return;
    }

    setCheckoutStep('verifying');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/paystack/verify/${encodeURIComponent(ref)}`);
      const data = await response.json();

      if (data.status && data.data && data.data.verified) {
        if (!selectedEvent || !selectedTier) {
          throw new Error('Event session expired.');
        }

        const ticketCode = `TKT-VRG-${Math.floor(100000 + Math.random() * 900000)}`;
        const totalGHS = calculateTotalGHS();

        const newPurchase: TicketPurchase = {
          id: `pur-${Date.now()}`,
          ticketCode,
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          tierName: selectedTier.name,
          quantity,
          totalPriceGHS: totalGHS,
          buyerName,
          buyerPhone,
          buyerEmail: buyerEmail || `${buyerPhone}@voteright.gh`,
          paymentMethod: paymentNetwork === 'card' ? 'Visa/Mastercard' : `${paymentNetwork.toUpperCase()} MoMo`,
          timestamp: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          qrCodeUrl: generateQrUrl(ticketCode),
        };

        setIssuedTicket(newPurchase);
        onPurchaseTicketSuccess(newPurchase);
        setCheckoutStep('success');

        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#1D4ED8', '#F59E0B', '#10B981'],
          });
        } catch (e) {}
      } else {
        throw new Error(data.message || 'Payment has not been completed yet. Please authorize on your phone.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(err.message || 'Payment verification failed.');
      setCheckoutStep('error');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPassCode(code);
    setTimeout(() => setCopiedPassCode(null), 2000);
  };

  return (
    <div className="space-y-8 bg-slate-50 min-h-screen -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 text-slate-900">
      {/* Top Header & Navigation Strip */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
              <Ticket className="w-3.5 h-3.5" />
              <span>Official Event Ticketing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Events & Admission Passes
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Verified admission passes for award galas, pageants, dinners, and concerts across Ghana with instant Mobile Money delivery.
            </p>
          </div>

          {/* Tab Switcher: Browse vs My Passes */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start md:self-auto">
            <button
              onClick={() => setActiveView('browse')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                activeView === 'browse'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Upcoming Events</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-slate-200 text-slate-800 font-mono">
                {events.length}
              </span>
            </button>
            <button
              onClick={() => setActiveView('my_passes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                activeView === 'my_passes'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>My Passes</span>
              {purchasedTickets.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-emerald-500 text-white font-mono font-bold">
                  {purchasedTickets.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* BROWSE VIEW */}
        {activeView === 'browse' && (
          <div className="space-y-6">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Search by event title, venue, or organizer..."
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium shadow-xs placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">No events found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No ticketed events match your current search or category filter. Try clearing your query.
                </p>
                <button
                  onClick={() => {
                    setTicketSearch('');
                    setSelectedCategory('All');
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((evt) => (
                  <article
                    key={evt.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    {/* Event Poster & Date Ribbon */}
                    <div className="relative h-48 bg-slate-900 overflow-hidden">
                      <img
                        src={evt.posterUrl}
                        alt={evt.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                      {/* Top Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/10">
                          {evt.category}
                        </span>
                      </div>

                      {/* Starting Price Pill */}
                      <div className="absolute bottom-3 right-3 bg-white text-slate-950 px-3 py-1 rounded-lg font-black text-xs shadow-sm font-mono">
                        From {formatPrice(evt.priceGHS, currency)}
                      </div>

                      {/* Date Pill */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white font-medium drop-shadow-sm">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>{evt.endDate}</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{evt.organizer}</span>
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-900 leading-snug line-clamp-2">
                          {evt.title}
                        </h3>

                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{evt.venue}</span>
                        </div>
                      </div>

                      {/* Tier options preview */}
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Available Passes
                        </div>
                        <div className="space-y-1.5">
                          {evt.ticketTiers.slice(0, 2).map((tier) => (
                            <div
                              key={tier.id}
                              className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100"
                            >
                              <div className="font-semibold text-slate-800 truncate mr-2">
                                {tier.name}
                              </div>
                              <div className="font-black text-slate-900 font-mono shrink-0">
                                {formatPrice(tier.price, currency)}
                              </div>
                            </div>
                          ))}
                          {evt.ticketTiers.length > 2 && (
                            <div className="text-[11px] text-slate-500 font-medium text-center">
                              +{evt.ticketTiers.length - 2} more tier options available
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenCheckout(evt)}
                          className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Select Passes & Buy</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY PASSES VIEW */}
        {activeView === 'my_passes' && (
          <div className="space-y-6">
            {purchasedTickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Ticket className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">No Tickets Purchased Yet</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When you purchase event tickets on VoteRight GH using MTN Mobile Money, Telecel Cash, or Card, your digital QR passes will be saved here automatically.
                </p>
                <button
                  onClick={() => setActiveView('browse')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Explore Upcoming Events</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchasedTickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">
                          {tkt.ticketCode}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                          {tkt.eventTitle}
                        </h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Tier: <strong className="text-slate-800">{tkt.tierName}</strong> (x{tkt.quantity})
                        </div>
                      </div>

                      <img
                        src={tkt.qrCodeUrl}
                        alt="Ticket QR"
                        className="w-14 h-14 bg-slate-50 rounded-lg p-1 border border-slate-200 shrink-0"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Pass Holder:</span>
                        <span className="font-bold text-slate-800 truncate block">{tkt.buyerName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Amount Paid:</span>
                        <span className="font-mono font-bold text-slate-900 block">
                          GH₵ {tkt.totalPriceGHS.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Status:</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Gate Ready
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Date Issued:</span>
                        <span className="text-slate-700 text-[11px] truncate block">{tkt.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setViewingPass(tkt)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        View Full Pass
                      </button>
                      <button
                        onClick={() => handleCopyCode(tkt.ticketCode)}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="Copy Code"
                      >
                        {copiedPassCode === tkt.ticketCode ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CHECKOUT & PAYMENT MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 my-8 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Ticket Purchase
                </span>
                <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM STEP */}
            {checkoutStep === 'form' && (
              <form onSubmit={handleStartPayment} className="p-6 space-y-5">
                {/* Tier Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Ticket Tier *
                  </label>
                  <div className="space-y-2">
                    {selectedEvent.ticketTiers.map((tier) => {
                      const isSelected = selectedTier?.id === tier.id;
                      return (
                        <div
                          key={tier.id}
                          onClick={() => setSelectedTier(tier)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900">{tier.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {tier.description}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-sm text-slate-900 font-mono">
                              {formatPrice(tier.price, currency)}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              {tier.available} left
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-slate-900 w-5 text-center font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Attendee Details */}
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pass Holder Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Kwesi Mensah"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Money Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="0244123456"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="name@email.com"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Network Selection */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Payment Method (Ghana MoMo / Card)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentNetwork('mtn')}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentNetwork === 'mtn'
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs ring-1 ring-amber-500'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>MTN MoMo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentNetwork('telecel')}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentNetwork === 'telecel'
                          ? 'bg-red-600 text-white border-red-700 shadow-xs ring-1 ring-red-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Telecel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentNetwork('at')}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentNetwork === 'at'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-1 ring-blue-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>AT Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentNetwork('card')}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentNetwork === 'card'
                          ? 'bg-slate-900 text-white border-slate-950 shadow-xs ring-1 ring-slate-950'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card</span>
                    </button>
                  </div>

                  {paymentNetwork === 'telecel' && (
                    <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-[11px] text-red-800 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Telecel Cash Voucher</span>
                      </div>
                      <p className="text-[10px] leading-relaxed">
                        Dial <strong>*110#</strong> on your phone & select Generate Voucher if prompted by Paystack checkout.
                      </p>
                    </div>
                  )}
                </div>

                {/* Total & Action Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500">Total Payable</div>
                    <div className="text-xl font-black text-slate-900 font-mono">
                      {formatPrice(calculateTotalGHS(), currency)}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-200" />
                    <span>Pay with Paystack</span>
                  </button>
                </div>
              </form>
            )}

            {/* INITIALIZING STEP */}
            {checkoutStep === 'initializing' && (
              <div className="p-10 text-center space-y-4">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Connecting to Payment Gateway</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Preparing secure Mobile Money & Card checkout for {quantity}x {selectedTier?.name}...
                </p>
              </div>
            )}

            {/* AUTHENTICATING / PAYSTACK PENDING STEP */}
            {checkoutStep === 'authenticating' && (
              <div className="p-6 space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Smartphone className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    Authorize Payment on Your Phone
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                    Check your handset for the Mobile Money prompt to approve{' '}
                    <strong className="text-slate-900 font-mono">
                      {formatPrice(calculateTotalGHS(), currency)}
                    </strong>
                    .
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-slate-500 bg-slate-100 py-1 px-3 rounded-lg inline-block">
                    Ref: {activeReference}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => verifyTicketPayment()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>I have Approved • Issue My Ticket</span>
                  </button>

                  {activeAuthorizationUrl && (
                    <a
                      href={activeAuthorizationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Open Paystack Web Checkout</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setCheckoutStep('form')}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium pt-1 cursor-pointer"
                  >
                    Cancel or Change Payment Method
                  </button>
                </div>
              </div>
            )}

            {/* VERIFYING STEP */}
            {checkoutStep === 'verifying' && (
              <div className="p-10 text-center space-y-4">
                <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Verifying Payment with Paystack</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Confirming network receipt and generating your digital cryptographic pass...
                </p>
              </div>
            )}

            {/* ERROR STEP */}
            {checkoutStep === 'error' && (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900">Payment Unverified</h4>
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl mt-2 max-w-sm mx-auto leading-relaxed">
                    {errorMessage || 'Payment could not be verified yet. Please ensure you approved the prompt.'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('form')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                  >
                    Back to Form
                  </button>
                  <button
                    type="button"
                    onClick={() => verifyTicketPayment()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Retry Verification
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS / ISSUED PASS STEP */}
            {checkoutStep === 'success' && issuedTicket && (
              <div className="p-6 space-y-5">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-lg text-slate-900">Admission Ticket Issued!</h4>
                  <p className="text-xs text-slate-500">
                    Saved to your passes and ready for gate scanner check-in.
                  </p>
                </div>

                {/* TACTILE PHYSICAL TICKET DESIGN */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden border border-slate-800 shadow-md">
                  {/* Perforation Cutouts */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />

                  <div className="flex items-start justify-between gap-3 border-b border-dashed border-slate-700 pb-4 mb-4">
                    <div>
                      <span className="text-[10px] font-mono tracking-wider text-amber-400 font-bold uppercase">
                        VOTERIGHT GH PASS
                      </span>
                      <h5 className="font-extrabold text-base text-white mt-0.5">
                        {issuedTicket.eventTitle}
                      </h5>
                      <div className="text-xs text-slate-300 mt-1">
                        Tier: <strong className="text-amber-400">{issuedTicket.tierName}</strong> (x{issuedTicket.quantity})
                      </div>
                    </div>

                    <img
                      src={issuedTicket.qrCodeUrl}
                      alt="Pass QR"
                      className="w-16 h-16 bg-white rounded-lg p-1 shrink-0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pass Holder:</span>
                      <span className="font-bold text-white">{issuedTicket.buyerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pass Code:</span>
                      <span className="font-mono text-emerald-400 font-bold">{issuedTicket.ticketCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Venue:</span>
                      <span className="text-slate-200 truncate block">{selectedEvent.venue}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Status:</span>
                      <span className="text-emerald-400 font-bold text-[11px]">VALID FOR ENTRY</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Ticket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEvent(null);
                      setActiveView('my_passes');
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer text-center"
                  >
                    View My Passes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL PASS VIEW MODAL */}
      {viewingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 my-8 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-700">Official E-Ticket Pass</span>
              <button
                onClick={() => setViewingPass(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Ticket Visual */}
              <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden shadow-md">
                {/* Perforation Cutouts */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />

                <div className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold mb-1">
                  VOTERIGHT GH GATE PASS
                </div>
                <h3 className="font-extrabold text-lg text-white mb-2">{viewingPass.eventTitle}</h3>
                <div className="text-xs text-amber-400 font-bold mb-4">
                  {viewingPass.tierName} • {viewingPass.quantity} Person(s)
                </div>

                <div className="bg-white p-3 rounded-xl inline-block shadow-inner mx-auto mb-3">
                  <img
                    src={viewingPass.qrCodeUrl}
                    alt="Admission QR"
                    className="w-40 h-40 mx-auto"
                  />
                  <div className="font-mono font-bold text-xs text-slate-900 mt-2 tracking-wider">
                    {viewingPass.ticketCode}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Pass Holder: <strong className="text-white">{viewingPass.buyerName}</strong>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Event:</span>
                  <span className="font-bold text-slate-800">{viewingPass.eventTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tier:</span>
                  <span className="font-bold text-slate-800">{viewingPass.tierName} (x{viewingPass.quantity})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Paid:</span>
                  <span className="font-mono font-bold text-slate-900">GH₵ {viewingPass.totalPriceGHS.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span className="font-medium text-slate-800">{viewingPass.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-600 font-bold">READY FOR ENTRY SCAN</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyCode(viewingPass.ticketCode)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {copiedPassCode === viewingPass.ticketCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
