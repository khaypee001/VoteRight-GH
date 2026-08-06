import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { SiteSettings } from '../types';

interface ContactPageProps {
  siteSettings?: SiteSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ siteSettings }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState<'General Inquiry' | 'Technical Support' | 'Website Feedback'>('General Inquiry');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-8 bg-white text-slate-900 pb-16 max-w-5xl mx-auto">
      {/* Top Contact Info Box (Royal Blue Background) */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-blue-800/60 px-3 py-1 rounded-full inline-block">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Contact {siteSettings?.siteName || 'VoteRight GH'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Have questions about hosting your awards show, ticketing, or voting verification? Our technical support team is ready to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-blue-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800/80 text-amber-300 flex items-center justify-center shrink-0 border border-blue-400/40">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Email Support</div>
              <div className="text-xs font-bold text-white font-mono">{siteSettings?.supportEmail || 'support@voterightgh.com'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800/80 text-amber-300 flex items-center justify-center shrink-0 border border-blue-400/40">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Phone Hotline</div>
              <div className="text-xs font-bold text-white font-mono">{siteSettings?.supportPhone || '+233 55 123 4567'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800/80 text-amber-300 flex items-center justify-center shrink-0 border border-blue-400/40">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Headquarters</div>
              <div className="text-xs font-bold text-white">{siteSettings?.headquarters || 'Adenta, Ghana'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <div className="bg-slate-50 border border-slate-200 p-6 sm:p-10 rounded-3xl shadow-sm space-y-6">
        {submitted ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Message Sent Successfully!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Thank you {firstName}! We have received your inquiry regarding "{subject}". Our support desk will reply to {email} shortly.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFirstName('');
                setLastName('');
                setPhone('');
                setEmail('');
                setMessage('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Send Us a Direct Feedback Message</h2>
              <p className="text-xs text-slate-500 mt-0.5">Fill in the fields below and our team will get back to you within 24 hours.</p>
            </div>

            {/* Subject Radio Options */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Select Inquiry Topic
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  'General Inquiry',
                  'Technical Support',
                  'Website Feedback',
                ].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer text-xs font-bold ${
                      subject === option
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="subjectOption"
                      value={option}
                      checked={subject === option}
                      onChange={() => setSubject(option as any)}
                      className="sr-only"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Name Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Kwame"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Mensah"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium mt-1"
                />
              </div>
            </div>

            {/* Phone & Email Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Phone No.</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="024XXXXXXX"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium mt-1"
                />
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="text-xs font-bold text-slate-700">Write Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your detailed message here..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium mt-1"
              />
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
