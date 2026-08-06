import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Contest,
  Nominee,
  RecentVoteFeed,
  VoteTransaction,
  CurrencyCode,
  TicketEvent,
  NominationAward,
  TicketPurchase,
  UserSession,
  OrganizerProfile,
  SiteSettings,
  CurrencyRate
} from './types';
import {
  INITIAL_CONTESTS,
  INITIAL_NOMINEES,
  INITIAL_TICKET_EVENTS,
  INITIAL_NOMINATIONS,
  INITIAL_RECENT_VOTES,
  INITIAL_SITE_SETTINGS,
  CURRENCIES
} from './data/mockData';
import { Header, ActiveTabType } from './components/Header';
import { Ticker } from './components/Ticker';
import { HomePage } from './components/HomePage';
import { CompetitionsPage } from './components/CompetitionsPage';
import { ResultsPage } from './components/ResultsPage';
import { TicketsPage } from './components/TicketsPage';
import { NominationsPage } from './components/NominationsPage';
import { ContactPage } from './components/ContactPage';
import { LoginPage } from './components/LoginPage';
import { OrganizerLoginPage } from './components/OrganizerLoginPage';
import { ContestDetail } from './components/ContestDetail';
import { VotingModal } from './components/VotingModal';
import { QuickVoteModal } from './components/QuickVoteModal';
import { AuditVerification } from './components/AuditVerification';
import { OrganizerPortal } from './components/OrganizerPortal';
import { OrganizerRegistrationModal } from './components/OrganizerRegistrationModal';
import { AdminPortal } from './components/AdminPortal';
import AdminPage from './pages/AdminPage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Logo } from './components/Logo';
import { ShieldCheck, Lock, Mail, Phone, MapPin, Heart, Sparkles } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTabType>('home');
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);

  // Persistence State
  const [contests, setContests] = useState<Contest[]>(() => {
    const saved = localStorage.getItem('voterightgh_contests');
    return saved ? JSON.parse(saved) : INITIAL_CONTESTS;
  });

  const [nominees, setNominees] = useState<Nominee[]>(() => {
    const saved = localStorage.getItem('voterightgh_nominees');
    return saved ? JSON.parse(saved) : INITIAL_NOMINEES;
  });

  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>(() => {
    const saved = localStorage.getItem('voterightgh_ticket_events');
    return saved ? JSON.parse(saved) : INITIAL_TICKET_EVENTS;
  });

  const [nominationAwards, setNominationAwards] = useState<NominationAward[]>(() => {
    const saved = localStorage.getItem('voterightgh_nominations');
    return saved ? JSON.parse(saved) : INITIAL_NOMINATIONS;
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('voterightgh_site_settings');
    return saved ? JSON.parse(saved) : INITIAL_SITE_SETTINGS;
  });

  const [currencies, setCurrencies] = useState<CurrencyRate[]>(() => {
    const saved = localStorage.getItem('voterightgh_currencies');
    return saved ? JSON.parse(saved) : CURRENCIES;
  });

  const [recentVotes, setRecentVotes] = useState<RecentVoteFeed[]>(INITIAL_RECENT_VOTES);
  
  const [transactions, setTransactions] = useState<VoteTransaction[]>(() => {
    const saved = localStorage.getItem('voterightgh_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [organizerProfiles, setOrganizerProfiles] = useState<OrganizerProfile[]>(() => {
    const saved = localStorage.getItem('voterightgh_organizer_profiles');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'org-1',
            email: 'organizer@gmail.com',
            fullName: 'Ghana Media & Event Board',
            phone: '0244998877',
            eventTitle: 'MISS CAMPUS GHANA 2026',
            paidFlatFee: true,
            isVerified: true,
            isBlocked: false,
          },
          {
            id: 'org-2',
            email: 'apexevents@gmail.com',
            fullName: 'Apex Events Ltd',
            phone: '0551122334',
            eventTitle: 'National Music Excellence Awards 2026',
            paidFlatFee: true,
            isVerified: false,
            isBlocked: false,
          },
        ];
  });

  const [activeOrganizerProfile, setActiveOrganizerProfile] = useState<OrganizerProfile | null>(organizerProfiles[0]);

  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('voterightgh_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currency, setCurrency] = useState<CurrencyCode>('GHS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [votingModalData, setVotingModalData] = useState<{ nominee: Nominee; contest: Contest } | null>(null);
  const [showQuickVoteModal, setShowQuickVoteModal] = useState<boolean>(false);
  const [quickVoteCode, setQuickVoteCode] = useState<string>('');
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showOrganizerPortal, setShowOrganizerPortal] = useState<boolean>(false);
  const [showOrganizerRegistrationModal, setShowOrganizerRegistrationModal] = useState<boolean>(false);
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState<string>('');
  const [isManualAddOrganizer, setIsManualAddOrganizer] = useState<boolean>(false);

  const handleManualCreateOrganizer = (data: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    agency?: string;
    isVerified?: boolean;
    status?: 'pending' | 'approved' | 'rejected';
    eventTitle?: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Sync current organizer profiles from state & localStorage
    let currentOrgs = organizerProfiles;
    try {
      const saved = localStorage.getItem('voterightgh_organizer_profiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentOrgs = parsed;
        }
      }
    } catch (e) {
      console.error('Error reading voterightgh_organizer_profiles:', e);
    }

    const existingOrgIndex = currentOrgs.findIndex(
      (org) => org.email.toLowerCase() === cleanEmail
    );

    let finalOrgProfile: OrganizerProfile;

    if (existingOrgIndex >= 0) {
      // UPGRADE / UPDATE existing organizer profile
      const existing = currentOrgs[existingOrgIndex];
      finalOrgProfile = {
        ...existing,
        fullName: data.fullName.trim() || existing.fullName,
        phone: data.phone.trim() || existing.phone,
        agency: data.agency?.trim() || existing.agency || data.fullName.trim(),
        eventTitle: data.eventTitle?.trim() || existing.eventTitle || 'Voting Campaign',
        isVerified: data.isVerified ?? true,
        isBlocked: false,
        status: data.status || 'approved',
        password: data.password || existing.password || 'organizer123',
      };
      currentOrgs[existingOrgIndex] = finalOrgProfile;
    } else {
      // CREATE new organizer profile
      finalOrgProfile = {
        id: `org-${Date.now()}`,
        email: cleanEmail,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        agency: data.agency?.trim() || data.fullName.trim(),
        eventTitle: data.eventTitle?.trim() || 'Voting Campaign',
        paidFlatFee: true,
        isVerified: data.isVerified ?? true,
        isBlocked: false,
        status: data.status || (data.isVerified !== false ? 'approved' : 'pending'),
        registeredAt: new Date().toISOString().split('T')[0],
        password: data.password || 'organizer123',
      };
      currentOrgs = [finalOrgProfile, ...currentOrgs];
    }

    // Update App State & LocalStorage for organizer profiles
    setOrganizerProfiles(currentOrgs);
    localStorage.setItem(
      'voterightgh_organizer_profiles',
      JSON.stringify(currentOrgs)
    );

    // 2. Sync with voterightgh_users_auth and dynamically elevate role to 'organizer'
    let usersAuth: any[] = [];
    try {
      usersAuth = JSON.parse(
        localStorage.getItem('voterightgh_users_auth') || '[]'
      );
    } catch (e) {
      usersAuth = [];
    }

    const existingAuthIndex = usersAuth.findIndex(
      (u: any) => u.email && u.email.toLowerCase() === cleanEmail
    );

    const userAuthObj = {
      id: finalOrgProfile.id,
      email: finalOrgProfile.email,
      password: finalOrgProfile.password,
      fullName: finalOrgProfile.fullName,
      phone: finalOrgProfile.phone,
      agency: finalOrgProfile.agency,
      role: 'organizer', // Dynamically elevate / enforce organizer role
      status: finalOrgProfile.status,
      isVerified: finalOrgProfile.isVerified,
    };

    if (existingAuthIndex >= 0) {
      usersAuth[existingAuthIndex] = {
        ...usersAuth[existingAuthIndex],
        ...userAuthObj,
        role: 'organizer',
      };
    } else {
      usersAuth.push(userAuthObj);
    }

    localStorage.setItem('voterightgh_users_auth', JSON.stringify(usersAuth));

    return {
      success: true,
      message: `Organizer "${finalOrgProfile.fullName}" (${cleanEmail}) provisioned successfully with active Organizer access!`,
    };
  };

  // Smart Search Bar / Route Interceptor
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const cleanQuery = query.trim().toLowerCase();

    // Route / Search Bar Interception for /organizer
    if (
      cleanQuery === '/organizer' ||
      cleanQuery === 'organizer' ||
      cleanQuery === '/organizers' ||
      cleanQuery === 'organizer login' ||
      cleanQuery === 'organizer portal' ||
      cleanQuery.startsWith('/organizer')
    ) {
      // Clear search box query
      setSearchQuery('');

      // Check if user has an active organizer session
      let isOrgAuth = false;
      const savedUserJson = localStorage.getItem('voterightgh_user');
      if (savedUserJson) {
        try {
          const u = JSON.parse(savedUserJson);
          if (u.role === 'organizer') isOrgAuth = true;
        } catch (e) {}
      }

      if (isOrgAuth || (user && user.role === 'organizer')) {
        setShowOrganizerPortal(true);
        if (typeof window !== 'undefined') window.history.pushState({}, '', '/organizer');
      } else {
        setSelectedContest(null);
        setActiveTab('login');
        setLoginErrorMessage(
          'Organizer Portal Sign-In Required: Enter your registered organizer email and password to access the portal.'
        );
        if (typeof window !== 'undefined') window.history.pushState({}, '', '/organizer');
      }
    }
  };

  // Route URL Inspector (/admin & /organizer path guards)
  useEffect(() => {
    const checkRouteGuards = () => {
      const pathname = window.location.pathname.toLowerCase();

      if (pathname.startsWith('/admin')) {
        const isAdminAuth =
          localStorage.getItem('voteright_admin_session') === 'true' ||
          localStorage.getItem('isAdminAuthenticated') === 'true';

        if (isAdminAuth) {
          setShowAdminPortal(true);
          setShowAdminLoginModal(false);
        } else {
          setShowAdminPortal(false);
          setShowAdminLoginModal(true);
        }
      } else if (pathname.startsWith('/organizer')) {
        let isOrganizerAuth = false;
        const savedUserJson = localStorage.getItem('voterightgh_user');
        if (savedUserJson) {
          try {
            const u = JSON.parse(savedUserJson);
            if (u.role === 'organizer') {
              isOrganizerAuth = true;
            }
          } catch (e) {}
        }

        if (isOrganizerAuth || (user && user.role === 'organizer')) {
          setShowOrganizerPortal(true);
        } else {
          setShowOrganizerPortal(false);
          setSelectedContest(null);
          setActiveTab('login');
          setLoginErrorMessage(
            'Organizer Portal Sign-In Required: Please log in with your registered organizer credentials to access the portal.'
          );
        }
      }
    };

    checkRouteGuards();
    window.addEventListener('popstate', checkRouteGuards);
    return () => window.removeEventListener('popstate', checkRouteGuards);
  }, [user]);

  // Sync to Local Storage
  useEffect(() => {
    localStorage.setItem('voterightgh_contests', JSON.stringify(contests));
  }, [contests]);

  useEffect(() => {
    localStorage.setItem('voterightgh_nominees', JSON.stringify(nominees));
  }, [nominees]);

  useEffect(() => {
    localStorage.setItem('voterightgh_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('voterightgh_organizer_profiles', JSON.stringify(organizerProfiles));
  }, [organizerProfiles]);

  useEffect(() => {
    localStorage.setItem('voterightgh_ticket_events', JSON.stringify(ticketEvents));
  }, [ticketEvents]);

  useEffect(() => {
    localStorage.setItem('voterightgh_nominations', JSON.stringify(nominationAwards));
  }, [nominationAwards]);

  useEffect(() => {
    localStorage.setItem('voterightgh_site_settings', JSON.stringify(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    localStorage.setItem('voterightgh_currencies', JSON.stringify(currencies));
  }, [currencies]);

  const handleUpdateContest = (updated: Contest) => {
    setContests((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleUpdateNomineeStatus = (nomineeId: string, status: 'approved' | 'rejected') => {
    setNominees((prev) => prev.map((n) => (n.id === nomineeId ? { ...n, status } : n)));
  };

  const handleUpdateOrganizerProfile = (profile: OrganizerProfile) => {
    setOrganizerProfiles((prev) => prev.map((p) => (p.id === profile.id ? profile : p)));
  };

  const handleRegisterOrganizer = (newProfile: OrganizerProfile) => {
    setOrganizerProfiles((prev) => [newProfile, ...prev]);
    setActiveOrganizerProfile(newProfile);
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('voterightgh_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('voterightgh_user');
    }
  }, [user]);

  // Confirm Vote Payment Handler
  const handleConfirmVote = (tx: VoteTransaction) => {
    // Increment candidate votes
    setNominees((prev) =>
      prev.map((n) => (n.id === tx.nomineeId ? { ...n, votes: n.votes + tx.votesCount } : n))
    );

    // Increment contest total votes
    setContests((prev) =>
      prev.map((c) => (c.id === tx.contestId ? { ...c, totalVotes: c.totalVotes + tx.votesCount } : c))
    );

    if (selectedContest && selectedContest.id === tx.contestId) {
      setSelectedContest((prev) => (prev ? { ...prev, totalVotes: prev.totalVotes + tx.votesCount } : null));
    }

    setTransactions((prev) => [tx, ...prev]);

    // Live Feed Ticker Update
    const newFeed: RecentVoteFeed = {
      id: `rv-${Date.now()}`,
      voterName: tx.voterName,
      nomineeName: tx.nomineeName,
      nomineeCode: tx.nomineeCode,
      votesCount: tx.votesCount,
      timeAgo: 'Just now',
      contestTitle: tx.contestTitle,
    };
    setRecentVotes((prev) => [newFeed, ...prev.slice(0, 9)]);
  };

  const handleSelectContestFromCard = (contest: Contest) => {
    setSelectedContest(contest);
    setActiveTab('competitions');
  };

  // Direct Code Lookup Trigger
  const handleQuickVoteByCode = (code: string) => {
    const found = nominees.find((n) => n.code.toUpperCase() === code.toUpperCase());
    if (found) {
      const c = contests.find((ct) => ct.id === found.contestId);
      if (c) {
        setVotingModalData({ nominee: found, contest: c });
        return;
      }
    }
    setQuickVoteCode(code);
    setShowQuickVoteModal(true);
  };

  const handleAddContest = (newContest: Contest) => {
    setContests((prev) => [newContest, ...prev]);
  };

  const handleAddNominee = (newNominee: Nominee) => {
    setNominees((prev) => [newNominee, ...prev]);
  };

  if (showAdminPortal) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminPage
          organizers={organizerProfiles}
          isManualAddOrganizer={isManualAddOrganizer}
          setIsManualAddOrganizer={setIsManualAddOrganizer}
          handleManualCreateOrganizer={handleManualCreateOrganizer}
          onUpdateOrganizers={setOrganizerProfiles}
          contests={contests}
          onUpdateContests={setContests}
        />
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Recent Activity Ticker */}
      <Ticker recentVotes={recentVotes} announcements={siteSettings.tickerAnnouncements} />

      {/* Main Top Header Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'competitions') setSelectedContest(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        currency={currency}
        onCurrencyChange={setCurrency}
        user={user}
        onLogout={() => setUser(null)}
        onOpenQuickVoteModal={() => setShowQuickVoteModal(true)}
      />

      {/* Page Body Router Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedContest ? `contest-${selectedContest.id}` : activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {selectedContest ? (
              <ContestDetail
                contest={selectedContest}
                nominees={nominees}
                currency={currency}
                onBack={() => setSelectedContest(null)}
                onVoteCandidate={(nominee) =>
                  setVotingModalData({ nominee, contest: selectedContest })
                }
                onOpenTickets={() => setActiveTab('tickets')}
              />
            ) : (
              <>
                {activeTab === 'home' && (
                  <HomePage
                    contests={contests}
                    currency={currency}
                    siteSettings={siteSettings}
                    onSelectContest={handleSelectContestFromCard}
                    onGoToCompetitions={() => setActiveTab('competitions')}
                    onGoToResults={() => setActiveTab('results')}
                    onOpenOrganizerPortal={() => setShowOrganizerPortal(true)}
                    onOpenOrganizerRegistration={() => setShowOrganizerRegistrationModal(true)}
                    onOpenQuickVoteModal={() => setShowQuickVoteModal(true)}
                  />
                )}

                {activeTab === 'competitions' && (
                  <CompetitionsPage
                    contests={contests}
                    currency={currency}
                    onSelectContest={setSelectedContest}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                )}

                {activeTab === 'results' && (
                  <ResultsPage
                    contests={contests}
                    nominees={nominees}
                    onVoteNominee={(nominee) => {
                      const c = contests.find((ct) => ct.id === nominee.contestId);
                      if (c) setVotingModalData({ nominee, contest: c });
                    }}
                  />
                )}

                {activeTab === 'tickets' && (
                  <TicketsPage
                    events={ticketEvents}
                    currency={currency}
                    onPurchaseTicketSuccess={() => {}}
                  />
                )}

                {activeTab === 'nominations' && (
                  <NominationsPage awards={nominationAwards} />
                )}

                {activeTab === 'contact' && <ContactPage siteSettings={siteSettings} />}

                {activeTab === 'login' && (
                  window.location.pathname.toLowerCase().startsWith('/organizer') ? (
                    <OrganizerLoginPage
                      initialErrorMessage={loginErrorMessage}
                      onLoginSuccess={(session, profile) => {
                        setUser(session);
                        localStorage.setItem('voterightgh_user', JSON.stringify(session));
                        setLoginErrorMessage('');

                        // Re-sync profiles store
                        let currentOrgs = organizerProfiles;
                        try {
                          const saved = localStorage.getItem('voterightgh_organizer_profiles');
                          if (saved) {
                            const parsed = JSON.parse(saved);
                            if (Array.isArray(parsed) && parsed.length > 0) currentOrgs = parsed;
                          }
                        } catch (e) {}

                        const matchedOrg = profile || currentOrgs.find((o) => o.email.toLowerCase() === session.email.toLowerCase());
                        if (matchedOrg) {
                          setActiveOrganizerProfile(matchedOrg);
                        } else {
                          const newProfile: OrganizerProfile = {
                            id: session.id || `org-${Date.now()}`,
                            email: session.email,
                            fullName: session.fullName,
                            phone: session.phone || '0240000000',
                            eventTitle: 'Organized Event',
                            paidFlatFee: true,
                            isVerified: true,
                            isBlocked: false,
                            status: 'approved',
                            registeredAt: new Date().toISOString().split('T')[0],
                          };
                          const newList = [newProfile, ...currentOrgs];
                          setOrganizerProfiles(newList);
                          localStorage.setItem('voterightgh_organizer_profiles', JSON.stringify(newList));
                          setActiveOrganizerProfile(newProfile);
                        }

                        setShowOrganizerPortal(true);
                        setActiveTab('home');
                        if (typeof window !== 'undefined') window.history.pushState({}, '', '/organizer');
                      }}
                      onOpenRegistrationModal={() => {
                        setShowOrganizerRegistrationModal(true);
                      }}
                      onBackToHome={() => {
                        setActiveTab('home');
                        if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
                      }}
                    />
                  ) : (
                    <LoginPage
                      organizerProfiles={organizerProfiles}
                      errorMessage={loginErrorMessage}
                      onLoginSuccess={(session) => {
                        setUser(session);
                        setLoginErrorMessage('');
                        if (session.role === 'admin') {
                          setShowAdminPortal(true);
                          setActiveTab('home');
                        } else if (session.role === 'organizer') {
                          // Re-sync organizerProfiles from localStorage to ensure newly provisioned accounts are present
                          let updatedProfiles = organizerProfiles;
                          try {
                            const saved = localStorage.getItem('voterightgh_organizer_profiles');
                            if (saved) {
                              const parsed = JSON.parse(saved);
                              if (Array.isArray(parsed) && parsed.length > 0) {
                                updatedProfiles = parsed;
                                setOrganizerProfiles(parsed);
                              }
                            }
                          } catch (e) {
                            console.error('Error syncing organizer profiles on login:', e);
                          }

                          const matchedOrg = updatedProfiles.find(
                            (o) => o.email.toLowerCase() === session.email.toLowerCase()
                          );

                          const isApproved = matchedOrg
                            ? matchedOrg.isVerified === true ||
                              matchedOrg.status === 'approved' ||
                              (matchedOrg.isVerified !== false && matchedOrg.status !== 'pending' && matchedOrg.status !== 'rejected')
                            : true;

                          const isBlocked = matchedOrg
                            ? matchedOrg.isBlocked === true || matchedOrg.status === 'rejected'
                            : false;

                          if (matchedOrg && isApproved && !isBlocked) {
                            setActiveOrganizerProfile(matchedOrg);
                            setShowOrganizerPortal(true);
                            setActiveTab('home');
                          } else if (!matchedOrg) {
                            // Dynamically create & store profile for verified organizer session
                            const freshOrg: OrganizerProfile = {
                              id: session.id || `org-${Date.now()}`,
                              email: session.email,
                              fullName: session.fullName,
                              phone: session.phone || '0240000000',
                              eventTitle: 'Organized Event',
                              paidFlatFee: true,
                              isVerified: true,
                              isBlocked: false,
                              status: 'approved',
                              registeredAt: new Date().toISOString().split('T')[0],
                            };
                            const newList = [freshOrg, ...updatedProfiles];
                            setOrganizerProfiles(newList);
                            localStorage.setItem('voterightgh_organizer_profiles', JSON.stringify(newList));
                            setActiveOrganizerProfile(freshOrg);
                            setShowOrganizerPortal(true);
                            setActiveTab('home');
                          } else {
                            setUser(null);
                            setLoginErrorMessage(
                              'Account pending approval. An Administrator must approve your email address before you can access the organizer dashboard.'
                            );
                          }
                        } else {
                          setActiveTab('home');
                        }
                      }}
                    />
                  )
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Site Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 text-xs py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <Logo size="md" variant="light" />
              <p className="text-slate-400 text-xs leading-relaxed">
                VoteRight GH is Ghana's leading awards voting and event ticketing platform using web instant checkout. Trusted by top award shows for secure, reliable voting.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px]">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li className="hover:text-amber-400 transition-colors cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedContest(null); }}>Home</li>
                <li className="hover:text-amber-400 transition-colors cursor-pointer" onClick={() => { setActiveTab('competitions'); setSelectedContest(null); }}>Ongoing Competitions</li>
                <li className="hover:text-amber-400 transition-colors cursor-pointer" onClick={() => { setActiveTab('results'); setSelectedContest(null); }}>Live Award Results</li>
                <li className="hover:text-amber-400 transition-colors cursor-pointer" onClick={() => { setActiveTab('tickets'); setSelectedContest(null); }}>Event E-Tickets</li>
                <li className="hover:text-amber-400 transition-colors cursor-pointer" onClick={() => { setActiveTab('nominations'); setSelectedContest(null); }}>Awards Nominations</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px]">
                Web Mobile Money & Cards
              </h4>
              <div className="flex flex-wrap gap-2 text-[10px]">
                <span className="bg-slate-800 text-amber-300 font-bold px-2.5 py-1 rounded border border-slate-700">MTN MoMo</span>
                <span className="bg-slate-800 text-rose-300 font-bold px-2.5 py-1 rounded border border-slate-700">Telecel Cash</span>
                <span className="bg-slate-800 text-sky-300 font-bold px-2.5 py-1 rounded border border-slate-700">AT Money</span>
                <span className="bg-slate-800 text-emerald-300 font-bold px-2.5 py-1 rounded border border-slate-700">Visa / Mastercard</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px]">
                Audit & Receipt Verification
              </h4>
              <p className="text-slate-400 text-xs">
                Need to verify a voter transaction code?
              </p>
              <button
                onClick={() => setShowAuditModal(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verify Vote Receipt Code
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>
              All Rights Reserved ©2026 VoteRight GH
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveTab('contact')} className="hover:text-amber-400 transition-colors">Contact Support</button>
              <span>•</span>
              <button onClick={() => setShowOrganizerRegistrationModal(true)} className="hover:text-amber-400 transition-colors font-bold text-amber-400">Register as Organizer (GHS 100)</button>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {votingModalData && (
        <VotingModal
          nominee={votingModalData.nominee}
          contest={votingModalData.contest}
          currency={currency}
          onClose={() => setVotingModalData(null)}
          onConfirmVote={handleConfirmVote}
        />
      )}

      {showQuickVoteModal && (
        <QuickVoteModal
          nominees={nominees}
          contests={contests}
          initialCode={quickVoteCode}
          onSelectCandidateToVote={(nominee, contest) => {
            setShowQuickVoteModal(false);
            setVotingModalData({ nominee, contest });
          }}
          onClose={() => setShowQuickVoteModal(false)}
        />
      )}

      {showAuditModal && (
        <AuditVerification
          transactions={transactions}
          currency={currency}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {showOrganizerRegistrationModal && (
        <OrganizerRegistrationModal
          onRegisterSuccess={handleRegisterOrganizer}
          onClose={() => setShowOrganizerRegistrationModal(false)}
        />
      )}

      {showOrganizerPortal && (
        <ProtectedRoute requiredRole="organizer">
          <OrganizerPortal
            organizerProfile={activeOrganizerProfile}
            contests={contests}
            nominees={nominees}
            currency={currency}
            onUpdateContest={handleUpdateContest}
            onAddContest={handleAddContest}
            onUpdateNomineeStatus={handleUpdateNomineeStatus}
            onAddNominee={handleAddNominee}
            onClose={() => setShowOrganizerPortal(false)}
          />
        </ProtectedRoute>
      )}

      {showAdminLoginModal && (
        <AdminLoginModal
          onUnlockSuccess={(session) => {
            if (session) {
              setUser(session);
            } else {
              const savedUserJson = localStorage.getItem('voterightgh_user');
              if (savedUserJson) {
                setUser(JSON.parse(savedUserJson));
              }
            }
            setShowAdminLoginModal(false);
            setShowAdminPortal(true);
            window.history.pushState({}, '', '/admin');
          }}
          onClose={() => {
            setShowAdminLoginModal(false);
          }}
        />
      )}
    </div>
  );
}
