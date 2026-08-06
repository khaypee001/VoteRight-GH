import React, { useState } from 'react';
import { TicketEvent, CurrencyCode, TicketPurchase } from '../types';
import { formatPrice } from '../utils/helpers';
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
  Download
} from 'lucide-react';

interface TicketsPageProps {
  events: TicketEvent[];
  currency: CurrencyCode;
  onPurchaseTicketSuccess: (purchase: TicketPurchase) => void;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({
  events,
  currency,
  onPurchaseTicketSuccess,
}) => {
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<TicketEvent | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Buyer Info Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [paymentChannel, setPaymentChannel] = useState<'momo_mtn' | 'momo_telecel' | 'card'>('momo_mtn');

  // Completed purchase state
  const [activeReceipt, setActiveReceipt] = useState<TicketPurchase | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    e.venue.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    e.organizer.toLowerCase().includes(ticketSearch.toLowerCase())
  );

  const handleOpenCheckout = (evt: TicketEvent) => {
    setSelectedEvent(evt);
    if (evt.ticketTiers.length > 0) {
      setSelectedTierId(evt.ticketTiers[0].id);
    }
    setQuantity(1);
    setBuyerName('');
    setBuyerPhone('');
    setBuyerEmail('');
  };

  const handleCompletePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const tier = selectedEvent.ticketTiers.find((t) => t.id === selectedTierId) || selectedEvent.ticketTiers[0];
    const totalGHS = tier.price * quantity;
    const ticketCode = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const purchase: TicketPurchase = {
        id: `pur-${Date.now()}`,
        ticketCode,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        tierName: tier.name,
        quantity,
        totalPriceGHS: totalGHS,
        buyerName,
        buyerPhone,
        buyerEmail,
        paymentMethod: paymentChannel,
        timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketCode)}`
      };

      onPurchaseTicketSuccess(purchase);
      setActiveReceipt(purchase);
      setSelectedEvent(null);
    }, 1200);
  };

  return (
    <div className="space-y-8 bg-white text-slate-900 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
          <Ticket className="w-4 h-4" />
          <span>Official Event E-Ticketing Gateway</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
          Buy Genuine Event Tickets Instantly
        </h1>

        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
          Purchase verified tickets for raves, dinners, awards nights, and concerts across Ghana with digital QR code generation.
        </p>

        <div className="relative max-w-2xl pt-2">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-5" />
          <input
            type="text"
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
            placeholder="Search events to buy tickets..."
            className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-amber-400/50 shadow-md font-medium"
          />
        </div>
      </div>

      {/* Ticket Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:ring-2 hover:ring-blue-500/50 transition-all duration-300 ease-out overflow-hidden flex flex-col md:flex-row group"
          >
            {/* Poster Banner */}
            <div className="md:w-5/12 h-56 md:h-auto bg-slate-100 relative overflow-hidden shrink-0 rounded-xl">
              <img
                src={evt.posterUrl}
                alt={evt.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute top-3 left-3 bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-md font-mono">
                From {formatPrice(evt.priceGHS, currency)}
              </div>
            </div>

            {/* Details & Actions */}
            <div className="p-6 md:w-7/12 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full inline-block">
                  {evt.category}
                </span>

                <h3 className="font-extrabold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                  {evt.title}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Ends on: {evt.endDate}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="line-clamp-1">Location: {evt.venue}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenCheckout(evt)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 hover:shadow-lg hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Ticket className="w-4 h-4" />
                <span>Purchase Ticket</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CHECKOUT TICKET MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto transition-all duration-300 ease-out scale-100 opacity-100">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Event Checkout
              </span>
              <h3 className="text-2xl font-black text-slate-900">{selectedEvent.title}</h3>
              <p className="text-xs text-slate-500">{selectedEvent.venue}</p>
            </div>

            <form onSubmit={handleCompletePurchase} className="space-y-5">
              {/* Select Ticket Tier */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Select Ticket Type
                </label>
                <div className="space-y-2">
                  {selectedEvent.ticketTiers.map((tier) => (
                    <label
                      key={tier.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedTierId === tier.id
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ticketTier"
                          value={tier.id}
                          checked={selectedTierId === tier.id}
                          onChange={() => setSelectedTierId(tier.id)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-extrabold text-xs text-slate-900">{tier.name}</div>
                          <div className="text-[11px] text-slate-500">{tier.description}</div>
                        </div>
                      </div>
                      <div className="font-black text-sm text-blue-700 font-mono">
                        {formatPrice(tier.price, currency)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-xs font-extrabold text-slate-700">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-black text-sm text-slate-900 w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Contact Info Inputs */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Ticket Holder Info
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600">Full Name</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Kwesi Mensah"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Phone (MoMo)</label>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="024XXXXXXX"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Email Address</label>
                    <input
                      type="email"
                      required
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentChannel('momo_mtn')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentChannel === 'momo_mtn'
                        ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>MTN MoMo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentChannel('momo_telecel')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentChannel === 'momo_telecel'
                        ? 'bg-rose-500 text-white border-rose-600 font-black shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Telecel Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentChannel('card')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentChannel === 'card'
                        ? 'bg-blue-600 text-white border-blue-700 font-black shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Bank Card</span>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 hover:shadow-lg hover:brightness-110 cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Pay Now & Download Digital Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TICKET RECEIPT MODAL WITH DIGITAL QR CODE */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-slate-200 text-center transition-all duration-300 ease-out scale-100 opacity-100">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Ticket Confirmed!</h3>
              <p className="text-xs text-slate-500">Your digital ticket is ready for event access.</p>
            </div>

            {/* QR Code Graphic */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block">
              <img
                src={activeReceipt.qrCodeUrl}
                alt="Ticket QR Code"
                className="w-40 h-40 mx-auto rounded-lg shadow-inner"
              />
              <div className="font-mono font-black text-xs text-blue-700 mt-2 tracking-wider">
                {activeReceipt.ticketCode}
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Event:</span>
                <span className="font-bold text-slate-900">{activeReceipt.eventTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket Type:</span>
                <span className="font-bold text-slate-900">{activeReceipt.tierName} (x{activeReceipt.quantity})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Holder:</span>
                <span className="font-bold text-slate-900">{activeReceipt.buyerName}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-black">
                <span className="text-slate-900">Total Paid:</span>
                <span className="text-blue-700 font-mono">GH₵ {activeReceipt.totalPriceGHS.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Ticket ${activeReceipt.ticketCode} saved! Keep your QR code for entry scanning at the gate.`);
                setActiveReceipt(null);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 hover:shadow-lg hover:brightness-110 cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Save Ticket PDF / Image</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
