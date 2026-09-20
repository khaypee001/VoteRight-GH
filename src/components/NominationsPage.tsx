import React, { useState } from 'react';
import { NominationAward } from '../types';
import { NomineePhotoUploader } from './NomineePhotoUploader';
import {
  FileText,
  Search,
  CheckCircle2,
  X,
  Send,
  UserCheck
} from 'lucide-react';

interface NominationsPageProps {
  awards: NominationAward[];
  onAddNomineeCandidate?: (nominee: any) => void;
}

export const NominationsPage: React.FC<NominationsPageProps> = ({ awards, onAddNomineeCandidate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAward, setSelectedAward] = useState<NominationAward | null>(null);

  // Nomination Submission Form
  const [nomineeName, setNomineeName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reason, setReason] = useState('');
  const [nominatorPhone, setNominatorPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const filteredAwards = awards.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenNomination = (award: NominationAward) => {
    setSelectedAward(award);
    setSelectedCategory(award.categories[0] || '');
    setNomineeName('');
    setReason('');
    setNominatorPhone('');
    setPhotoUrl('');
    setSubmittedSuccess(false);
  };

  const handleSubmitNomination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      alert('Please upload a contestant photo using the drag and drop box.');
      return;
    }

    if (onAddNomineeCandidate && selectedAward) {
      onAddNomineeCandidate({
        id: `nom-${Date.now()}`,
        code: `VRG-${Math.floor(100 + Math.random() * 900)}`,
        name: nomineeName,
        category: selectedCategory,
        contestId: selectedAward.id,
        photoUrl: photoUrl,
        bio: reason,
        votes: 0,
        status: 'pending' // Submitted as pending for admin / organizer approval
      });
    }

    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setSelectedAward(null);
    }, 2500);
  };

  return (
    <div className="space-y-8 bg-white text-slate-900 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
          <FileText className="w-4 h-4" />
          <span>Official Nomination Portal</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
          Available Awards For Nomination
        </h1>

        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
          Nominate deserving individuals, trailblazers, and organizations across Ghana’s top recognition award schemes.
        </p>

        <div className="relative max-w-2xl pt-2">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for award here..."
            className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-amber-400/50 shadow-md font-medium"
          />
        </div>
      </div>

      {/* Grid of Nomination Award Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredAwards.map((award) => (
          <div
            key={award.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:ring-2 hover:ring-blue-500/50 transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden rounded-xl">
                <img
                  src={award.bannerUrl}
                  alt={award.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-3 right-3 bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow">
                  Deadline: {award.deadline}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                  {award.organizer}
                </span>

                <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                  {award.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {award.description}
                </p>

                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-700 mb-1">Open Categories:</div>
                  <div className="flex flex-wrap gap-1">
                    {award.categories.map((cat) => (
                      <span
                        key={cat}
                        className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => handleOpenNomination(award)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 hover:shadow-lg hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                <span>Submit Nominee Form</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NOMINATION FORM MODAL */}
      {selectedAward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-slate-200 transition-all duration-300 ease-out scale-100 opacity-100">
            <button
              type="button"
              onClick={() => setSelectedAward(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close form"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {submittedSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Nomination Received!</h3>
                <p className="text-xs text-slate-500">
                  Thank you for submitting your nomination for {selectedAward.title}. The electoral board will review your submission shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Submit Nomination
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">{selectedAward.title}</h3>
                </div>

                <form onSubmit={handleSubmitNomination} className="space-y-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700">Select Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 mt-1 cursor-pointer"
                    >
                      {selectedAward.categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700">Nominee Full Name / Organization</label>
                    <input
                      type="text"
                      required
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      placeholder="e.g. Samuel Adjei or Adjei Foundation"
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 mt-1"
                    />
                  </div>

                  <NomineePhotoUploader
                    value={photoUrl}
                    onChange={setPhotoUrl}
                  />

                  <div>
                    <label className="text-xs font-extrabold text-slate-700">Reason for Nomination</label>
                    <textarea
                      required
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Briefly state why this nominee deserves the award..."
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700">Your Contact Phone</label>
                    <input
                      type="tel"
                      required
                      value={nominatorPhone}
                      onChange={(e) => setNominatorPhone(e.target.value)}
                      placeholder="024XXXXXXX"
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 mt-1"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 hover:shadow-lg hover:brightness-110 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Nomination Form</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
