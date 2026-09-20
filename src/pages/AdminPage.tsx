import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, XCircle, ToggleLeft, ToggleRight, Plus, 
  DollarSign, Users, Calendar, AlertTriangle, Send, Search, Clock,
  UserCheck, ShieldCheck, Mail, Phone, Lock, Building2, UserPlus,
  Trash2, ShieldAlert, CheckCircle2, AlertCircle, Edit3, X, Upload,
  Ticket, PlusCircle, Sparkles
} from 'lucide-react';
import { OrganizerProfile, Contest, TicketEvent, TicketTier, Nominee, SiteSettings } from '../types';
import { INITIAL_TICKET_EVENTS, INITIAL_NOMINEES } from '../data/mockData';

export interface AdminPageProps {
  organizers?: OrganizerProfile[];
  isManualAddOrganizer?: boolean;
  setIsManualAddOrganizer?: (open: boolean) => void;
  handleManualCreateOrganizer?: (data: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    agency?: string;
    isVerified?: boolean;
    status?: 'pending' | 'approved' | 'rejected';
    eventTitle?: string;
  }) => { success: boolean; message: string };
  onUpdateOrganizers?: (organizers: OrganizerProfile[]) => void;
  contests?: Contest[];
  onUpdateContests?: (contests: Contest[]) => void;
  nominees?: Nominee[];
  onUpdateNominees?: (nominees: Nominee[]) => void;
  siteSettings?: SiteSettings;
  onUpdateSiteSettings?: (settings: SiteSettings) => void;
}

// --- MOCK INITIAL DATA FALLBACKS ---
const initialEvents = [
  { id: '1', title: 'Ghana Music Awards UK - Nominees', organizer: 'Creative Arts GH', isOngoing: true, totalVotes: 14520, revenue: 14520, endDate: '2026-12-31T23:59' },
  { id: '2', title: 'SRC Executive Elections 2026', organizer: 'UG Campus Council', isOngoing: false, totalVotes: 8900, revenue: 8900, endDate: '2026-08-01T18:00' },
];

const initialOrganizersFallback: OrganizerProfile[] = [
  { 
    id: 'org-1', 
    email: 'organizer@gmail.com', 
    fullName: 'Ghana Media & Event Board', 
    phone: '0244998877', 
    agency: 'Ghana Media & Event Board',
    eventTitle: 'MISS CAMPUS GHANA 2026',
    paidFlatFee: true,
    isVerified: true,
    isBlocked: false,
    status: 'approved',
    registeredAt: '2026-08-01'
  },
  { 
    id: 'org-2', 
    email: 'apexevents@gmail.com', 
    fullName: 'Apex Events Ltd', 
    phone: '0551122334', 
    agency: 'Apex Events Ltd',
    eventTitle: 'National Music Excellence Awards 2026',
    paidFlatFee: true,
    isVerified: false,
    isBlocked: false,
    status: 'pending',
    registeredAt: '2026-08-04'
  },
];

const initialPayouts = [
  { id: 'pay-1', userId: 'org-1', organizerName: 'UG Campus Council', eventTitle: 'SRC Executive Elections 2026', amount: 8455, paymentMethod: 'Mobile Money', momoNetwork: 'MTN MoMo', bankOrNetworkName: 'MTN MoMo', accountNumber: '0241112233', accountName: 'UG Campus Election Board', status: 'PENDING', createdAt: '2026-08-04T12:00:00Z' },
];

export default function AdminPage({
  organizers: propsOrganizers,
  isManualAddOrganizer: propsIsManualAdd,
  setIsManualAddOrganizer: propsSetIsManualAdd,
  handleManualCreateOrganizer: propsHandleManualCreate,
  onUpdateOrganizers,
  contests: propsContests,
  onUpdateContests,
  nominees: propsNominees,
  onUpdateNominees,
  siteSettings: propsSiteSettings,
  onUpdateSiteSettings,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'organizers' | 'events' | 'nominees' | 'tickets' | 'payouts' | 'growth'>('organizers');
  const [searchQuery, setSearchQuery] = useState('');

  // Nominees Search & Filter State
  const [nomineeSearch, setNomineeSearch] = useState('');
  const [nomineeContestFilter, setNomineeContestFilter] = useState('ALL');

  // Confirmation modal state for safe, in-app irreversible actions (NO window.confirm!)
  const [deleteModal, setDeleteModal] = useState<{
    type: 'event' | 'nominee' | 'ticket' | 'organizer';
    id: string;
    title: string;
  } | null>(null);

  // Ticket Events & Tiers State
  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>(() => {
    const saved = localStorage.getItem('voterightgh_ticket_events');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_TICKET_EVENTS;
  });

  useEffect(() => {
    localStorage.setItem('voterightgh_ticket_events', JSON.stringify(ticketEvents));
  }, [ticketEvents]);

  // Admin Ticket Management Modal State
  const [editingAdminTicketEvent, setEditingAdminTicketEvent] = useState<TicketEvent | null>(null);
  const [adminTiersList, setAdminTiersList] = useState<TicketTier[]>([]);
  const [editingAdminTierId, setEditingAdminTierId] = useState<string | null>(null);
  const [adminTierName, setAdminTierName] = useState('');
  const [adminTierPrice, setAdminTierPrice] = useState('');
  const [adminTierQty, setAdminTierQty] = useState('');
  const [adminTierDesc, setAdminTierDesc] = useState('');

  // Create New Ticket Event Modal State
  const [isCreatingNewTicketEvent, setIsCreatingNewTicketEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventOrganizer, setNewEventOrganizer] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Concert');
  const [newEventPoster, setNewEventPoster] = useState('');

  const handleOpenAdminTicketsModal = (evt: TicketEvent | Contest | any) => {
    const existingTiers = evt.ticketTiers || [
      { id: 'tier-1', name: 'Regular Entry Pass', price: evt.priceGHS || 50, available: 300, description: 'General access gate pass' },
      { id: 'tier-2', name: 'VIP Access Pass', price: Math.round((evt.priceGHS || 50) * 2.5), available: 100, description: 'Front row seating & free drink' }
    ];
    setEditingAdminTicketEvent({
      id: evt.id,
      title: evt.title,
      organizer: evt.organizer || 'Official Organizer',
      venue: evt.venue || 'Event Venue',
      endDate: evt.endDate || 'Sat, 15 Oct 2026',
      category: evt.category || 'Concert & Party',
      posterUrl: evt.posterUrl || evt.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
      priceGHS: evt.priceGHS || Math.min(...existingTiers.map((t: any) => t.price)) || 50,
      ticketTiers: existingTiers
    });
    setAdminTiersList(existingTiers);
    setEditingAdminTierId(null);
    setAdminTierName('');
    setAdminTierPrice('');
    setAdminTierQty('');
    setAdminTierDesc('');
  };

  const handleSaveAdminTicketTiers = () => {
    if (!editingAdminTicketEvent) return;

    const minPrice = adminTiersList.length > 0 ? Math.min(...adminTiersList.map(t => t.price)) : 50;
    const updatedEvt: TicketEvent = {
      ...editingAdminTicketEvent,
      priceGHS: minPrice,
      ticketTiers: adminTiersList
    };

    let existsInEvents = false;
    const updatedTicketEvents = ticketEvents.map(e => {
      if (e.id === updatedEvt.id || e.title.toLowerCase() === updatedEvt.title.toLowerCase()) {
        existsInEvents = true;
        return updatedEvt;
      }
      return e;
    });

    const finalEventsList = existsInEvents ? updatedTicketEvents : [updatedEvt, ...ticketEvents];
    setTicketEvents(finalEventsList);
    localStorage.setItem('voterightgh_ticket_events', JSON.stringify(finalEventsList));

    // Also update matching Contest in local storage
    const savedContests = localStorage.getItem('voterightgh_contests');
    if (savedContests) {
      try {
        const parsedContests: Contest[] = JSON.parse(savedContests);
        const updatedContests = parsedContests.map(c => {
          if (c.id === updatedEvt.id || c.title.toLowerCase() === updatedEvt.title.toLowerCase()) {
            return {
              ...c,
              ticketsEnabled: adminTiersList.length > 0,
              ticketTiers: adminTiersList
            };
          }
          return c;
        });
        localStorage.setItem('voterightgh_contests', JSON.stringify(updatedContests));
        if (onUpdateContests) {
          onUpdateContests(updatedContests);
        }
      } catch (e) {}
    }

    window.dispatchEvent(new Event('voteright_ticket_events_update'));
    window.dispatchEvent(new Event('voteright_contests_update'));
    window.dispatchEvent(new Event('storage'));

    setEditingAdminTicketEvent(null);
  };

  const handleDeleteTicketEvent = (eventId: string, title: string) => {
    setDeleteModal({
      type: 'ticket',
      id: eventId,
      title
    });
  };

  const handleCreateNewTicketEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvt: TicketEvent = {
      id: `evt-admin-${Date.now()}`,
      title: newEventTitle.trim(),
      organizer: newEventOrganizer.trim() || 'Admin Event Board',
      venue: newEventVenue.trim() || 'National Theatre, Accra',
      endDate: newEventDate.trim() || 'Sat, 28 Nov 2026',
      category: newEventCategory,
      posterUrl: newEventPoster.trim() || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
      priceGHS: 50,
      ticketTiers: [
        { id: `t1-${Date.now()}`, name: 'Regular Gate Pass', price: 50, available: 500, description: 'General Gate Entry Pass' },
        { id: `t2-${Date.now()}`, name: 'VIP Lounge Pass', price: 150, available: 150, description: 'VIP Seating + Free Drink' },
        { id: `t3-${Date.now()}`, name: 'VVIP Table Pass', price: 500, available: 20, description: 'Reserved Table for 5' }
      ]
    };

    const updated = [newEvt, ...ticketEvents];
    setTicketEvents(updated);
    localStorage.setItem('voterightgh_ticket_events', JSON.stringify(updated));
    window.dispatchEvent(new Event('voteright_ticket_events_update'));
    window.dispatchEvent(new Event('storage'));

    setIsCreatingNewTicketEvent(false);
    setNewEventTitle('');
    setNewEventOrganizer('');
    setNewEventVenue('');
    setNewEventDate('');
    setNewEventPoster('');
  };

  // Local Organizers State with Prop Synchronization
  const [localOrganizers, setLocalOrganizers] = useState<OrganizerProfile[]>(() => {
    if (propsOrganizers && propsOrganizers.length > 0) return propsOrganizers;
    const saved = localStorage.getItem('voterightgh_organizer_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing organizer profiles', e);
      }
    }
    return initialOrganizersFallback;
  });

  useEffect(() => {
    if (propsOrganizers) {
      setLocalOrganizers(propsOrganizers);
    }
  }, [propsOrganizers]);

  const updateOrganizersList = (updated: OrganizerProfile[]) => {
    setLocalOrganizers(updated);
    if (onUpdateOrganizers) {
      onUpdateOrganizers(updated);
    }
    localStorage.setItem('voterightgh_organizer_profiles', JSON.stringify(updated));
  };

  // Local Events State
  const [events, setEvents] = useState<any[]>(() => {
    if (propsContests && propsContests.length > 0) {
      return propsContests.map(c => ({
        id: c.id,
        title: c.title,
        organizer: c.organizer,
        isOngoing: c.isLive,
        totalVotes: c.totalVotes,
        revenue: c.totalVotes * c.votePrice,
        endDate: c.endDate
      }));
    }
    const saved = localStorage.getItem('voterightgh_contests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => ({
            id: c.id,
            title: c.title,
            organizer: c.organizer,
            isOngoing: c.isLive ?? true,
            totalVotes: c.totalVotes ?? 0,
            revenue: (c.totalVotes ?? 0) * (c.votePrice ?? 1),
            endDate: c.endDate || ''
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialEvents;
  });

  // Payouts State
  const [payouts, setPayouts] = useState<any[]>(() => {
    const saved = localStorage.getItem('voterightgh_payout_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialPayouts;
  });

  // Modal Control for Manual Add Organizer
  const [internalShowManualAdd, setInternalShowManualAdd] = useState(false);
  const showManualAddModal = propsIsManualAdd !== undefined ? propsIsManualAdd : internalShowManualAdd;

  const setShowManualAddModal = (open: boolean) => {
    if (propsSetIsManualAdd) {
      propsSetIsManualAdd(open);
    }
    setInternalShowManualAdd(open);
  };

  // Form State for Manual Add Organizer
  const [manualFullName, setManualFullName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAgency, setManualAgency] = useState('');
  const [manualPassword, setManualPassword] = useState('organizer123');
  const [manualEventTitle, setManualEventTitle] = useState('');
  const [manualStatus, setManualStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [manualIsVerified, setManualIsVerified] = useState(true);
  const [manualError, setManualError] = useState<string | null>(null);

  // Local Nominees State & Synchronizer
  const [localNominees, setLocalNominees] = useState<Nominee[]>(() => {
    if (propsNominees && propsNominees.length > 0) return propsNominees;
    const saved = localStorage.getItem('voterightgh_nominees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_NOMINEES;
  });

  useEffect(() => {
    if (propsNominees && propsNominees.length > 0) {
      setLocalNominees(propsNominees);
    }
  }, [propsNominees]);

  useEffect(() => {
    const syncNominees = () => {
      const saved = localStorage.getItem('voterightgh_nominees');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setLocalNominees(parsed);
        } catch (e) {}
      }
    };
    window.addEventListener('voteright_nominees_update', syncNominees);
    window.addEventListener('storage', syncNominees);
    return () => {
      window.removeEventListener('voteright_nominees_update', syncNominees);
      window.removeEventListener('storage', syncNominees);
    };
  }, []);

  // Growth / Settings & Platform Revenue Fee
  const [platformFee, setPlatformFee] = useState<number>(() => {
    if (propsSiteSettings?.platformFeePercent !== undefined) return propsSiteSettings.platformFeePercent;
    const savedFee = localStorage.getItem('voteright_platform_fee');
    if (savedFee) return parseFloat(savedFee) || 15;
    const savedSettings = localStorage.getItem('voterightgh_site_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (typeof parsed.platformFeePercent === 'number') return parsed.platformFeePercent;
      } catch (e) {}
    }
    return 15;
  });
  const [savedPlatformFee, setSavedPlatformFee] = useState<number>(platformFee);
  const [isFeeSaved, setIsFeeSaved] = useState<boolean>(false);

  const handleSavePlatformFee = () => {
    const currentSettings = propsSiteSettings || (() => {
      const saved = localStorage.getItem('voterightgh_site_settings');
      return saved ? JSON.parse(saved) : { platformFeePercent: platformFee };
    })();
    const updated = {
      ...currentSettings,
      platformFeePercent: platformFee
    };
    if (onUpdateSiteSettings) {
      onUpdateSiteSettings(updated);
    }
    localStorage.setItem('voterightgh_site_settings', JSON.stringify(updated));
    localStorage.setItem('voteright_platform_fee', platformFee.toString());
    setSavedPlatformFee(platformFee);
    setIsFeeSaved(true);
    setTimeout(() => setIsFeeSaved(false), 3500);
    window.dispatchEvent(new Event('voteright_site_settings_update'));
    window.dispatchEvent(new Event('storage'));
    showToast(`✅ Platform voting revenue cut updated to ${platformFee}% and saved!`);
  };

  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState('Welcome to VoteRight GH! Secure and fast Mobile Money voting.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Safe In-App Deletion Execution (Zero window.confirm blocking)
  const handleExecuteDelete = () => {
    if (!deleteModal) return;

    if (deleteModal.type === 'event') {
      const eventId = deleteModal.id;
      const title = deleteModal.title;
      // 1. Remove from local events list
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      // 2. Notify parent update callback
      if (propsContests && onUpdateContests) {
        onUpdateContests(propsContests.filter((c) => c.id !== eventId));
      }
      // 3. Update localStorage
      const savedContests = localStorage.getItem('voterightgh_contests');
      if (savedContests) {
        try {
          const list = JSON.parse(savedContests);
          localStorage.setItem('voterightgh_contests', JSON.stringify(list.filter((c: any) => c.id !== eventId)));
        } catch (e) {}
      }
      // 4. Remove candidates belonging to this event
      setLocalNominees((prev) => {
        const filtered = prev.filter((n) => n.contestId !== eventId);
        localStorage.setItem('voterightgh_nominees', JSON.stringify(filtered));
        if (onUpdateNominees) onUpdateNominees(filtered);
        return filtered;
      });
      // 5. Close edit modal if open
      if (editingContest?.id === eventId) {
        setEditingContest(null);
      }
      setDeleteModal(null);
      window.dispatchEvent(new Event('voteright_contests_update'));
      window.dispatchEvent(new Event('voteright_nominees_update'));
      window.dispatchEvent(new Event('storage'));
      showToast(`🗑️ Event "${title}" and its candidates removed.`);
    } else if (deleteModal.type === 'nominee') {
      const nomineeId = deleteModal.id;
      const name = deleteModal.title;
      setLocalNominees((prev) => {
        const filtered = prev.filter((n) => n.id !== nomineeId);
        localStorage.setItem('voterightgh_nominees', JSON.stringify(filtered));
        if (onUpdateNominees) onUpdateNominees(filtered);
        return filtered;
      });
      setDeleteModal(null);
      window.dispatchEvent(new Event('voteright_nominees_update'));
      window.dispatchEvent(new Event('storage'));
      showToast(`🗑️ Candidate "${name}" deleted.`);
    } else if (deleteModal.type === 'ticket') {
      const eventId = deleteModal.id;
      const title = deleteModal.title;
      const updated = ticketEvents.filter((e) => e.id !== eventId);
      setTicketEvents(updated);
      localStorage.setItem('voterightgh_ticket_events', JSON.stringify(updated));
      setDeleteModal(null);
      window.dispatchEvent(new Event('voteright_ticket_events_update'));
      window.dispatchEvent(new Event('storage'));
      showToast(`🗑️ Ticket listing "${title}" deleted.`);
    } else if (deleteModal.type === 'organizer') {
      const orgId = deleteModal.id;
      const name = deleteModal.title;
      const updated = localOrganizers.filter((o) => o.id !== orgId);
      updateOrganizersList(updated);
      setDeleteModal(null);
      showToast(`🗑️ Organizer profile "${name}" removed.`);
    }
  };

  // Sync Payouts from localStorage
  useEffect(() => {
    const syncPayouts = () => {
      const saved = localStorage.getItem('voterightgh_payout_requests');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPayouts(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    syncPayouts();
    window.addEventListener('storage', syncPayouts);
    window.addEventListener('voteright_payout_update', syncPayouts);
    return () => {
      window.removeEventListener('storage', syncPayouts);
      window.removeEventListener('voteright_payout_update', syncPayouts);
    };
  }, []);

  // Sync Expired Events
  useEffect(() => {
    const checkExpiredEvents = () => {
      const now = new Date();
      setEvents(prevEvents =>
        prevEvents.map(ev => {
          if (ev.isOngoing && ev.endDate && new Date(ev.endDate) <= now) {
            return { ...ev, isOngoing: false };
          }
          return ev;
        })
      );
    };

    checkExpiredEvents();
    const interval = setInterval(checkExpiredEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Event Status Toggle
  const toggleVotingStatus = (eventId: string) => {
    const updatedEvents = events.map(ev => ev.id === eventId ? { ...ev, isOngoing: !ev.isOngoing } : ev);
    setEvents(updatedEvents);

    if (propsContests && onUpdateContests) {
      const updatedContests = propsContests.map(c => c.id === eventId ? { ...c, isLive: !c.isLive } : c);
      onUpdateContests(updatedContests);
    }
    showToast('⚡ Event voting status updated!');
  };

  // Editing Contest State
  const [editingContest, setEditingContest] = useState<any | null>(null);
  const [editBannerUrl, setEditBannerUrl] = useState<string>('');

  const handleOpenEditAdminContest = (contest: any) => {
    setEditingContest(contest);
    setEditBannerUrl(contest.bannerUrl || '');
  };

  const handleSaveEditedContest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingContest) return;

    const formData = new FormData(e.currentTarget);
    const title = (formData.get('title') as string)?.trim() || editingContest.title;
    const organizer = (formData.get('organizer') as string)?.trim() || editingContest.organizer;
    const category = (formData.get('category') as string)?.trim() || editingContest.category || 'pageant';
    const description = (formData.get('description') as string)?.trim() || editingContest.description || '';
    const startDate = (formData.get('startDate') as string)?.trim() || editingContest.startDate;
    const endDate = (formData.get('endDate') as string)?.trim() || editingContest.endDate;
    const votePrice = parseFloat(formData.get('votePrice') as string) || editingContest.votePrice || 1.50;
    const isOngoing = formData.get('isOngoing') === 'true';
    const bannerUrl = editBannerUrl.trim() || (formData.get('bannerUrl') as string)?.trim() || editingContest.bannerUrl;
    const slug = (formData.get('slug') as string)?.trim() || editingContest.slug || '';
    const rulesRaw = formData.get('rules') as string;
    const rules = rulesRaw !== null ? rulesRaw.split('\n').map(r => r.trim()).filter(Boolean) : editingContest.rules;

    const updatedEvents = events.map(ev => {
      if (ev.id === editingContest.id) {
        return {
          ...ev,
          title,
          organizer,
          category,
          description,
          startDate,
          endDate,
          votePrice,
          isOngoing,
          isLive: isOngoing,
          bannerUrl,
          slug: slug || undefined,
          rules,
        };
      }
      return ev;
    });

    setEvents(updatedEvents);

    if (propsContests && onUpdateContests) {
      const updatedContests = propsContests.map(c => {
        if (c.id === editingContest.id) {
          return {
            ...c,
            title,
            organizer,
            category: category as any,
            description,
            startDate,
            endDate,
            votePrice,
            isLive: isOngoing,
            bannerUrl,
            slug: slug || undefined,
            rules,
          };
        }
        return c;
      });
      onUpdateContests(updatedContests);
      localStorage.setItem('voterightgh_contests', JSON.stringify(updatedContests));
    } else {
      localStorage.setItem('voterightgh_contests', JSON.stringify(updatedEvents));
    }

    window.dispatchEvent(new Event('voteright_contests_update'));
    window.dispatchEvent(new Event('storage'));

    setEditingContest(null);
    showToast(`🎉 Event "${title}" updated successfully!`);
  };

  // Handle Manual Add Submission
  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const cleanEmail = manualEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setManualError('Please enter a valid email address.');
      return;
    }

    if (!manualFullName.trim() || !manualPhone.trim()) {
      setManualError('Please fill in Full Name and Phone Number.');
      return;
    }

    // Call prop handler if available
    if (propsHandleManualCreate) {
      const res = propsHandleManualCreate({
        fullName: manualFullName,
        email: cleanEmail,
        password: manualPassword || 'organizer123',
        phone: manualPhone,
        agency: manualAgency || manualFullName,
        isVerified: manualIsVerified,
        status: manualStatus,
        eventTitle: manualEventTitle,
      });

      if (!res.success) {
        setManualError(res.message);
        return;
      }

      showToast(`✅ ${res.message}`);
    } else {
      // Local fallback provision logic (upsert + elevate role to organizer)
      const existingOrgIndex = localOrganizers.findIndex(o => o.email.toLowerCase() === cleanEmail);
      let newOrgProfile: OrganizerProfile;
      let updatedOrganizers = [...localOrganizers];

      if (existingOrgIndex >= 0) {
        const existing = localOrganizers[existingOrgIndex];
        newOrgProfile = {
          ...existing,
          fullName: manualFullName.trim() || existing.fullName,
          phone: manualPhone.trim() || existing.phone,
          agency: manualAgency.trim() || existing.agency || manualFullName.trim(),
          eventTitle: manualEventTitle.trim() || existing.eventTitle || 'Custom Voting Event',
          isVerified: manualIsVerified,
          isBlocked: false,
          status: manualStatus,
          password: manualPassword || existing.password || 'organizer123',
        };
        updatedOrganizers[existingOrgIndex] = newOrgProfile;
      } else {
        newOrgProfile = {
          id: `org-${Date.now()}`,
          email: cleanEmail,
          fullName: manualFullName.trim(),
          phone: manualPhone.trim(),
          agency: manualAgency.trim() || manualFullName.trim(),
          eventTitle: manualEventTitle.trim() || 'Custom Voting Event',
          paidFlatFee: true,
          isVerified: manualIsVerified,
          isBlocked: false,
          status: manualStatus,
          registeredAt: new Date().toISOString().split('T')[0],
          password: manualPassword || 'organizer123',
        };
        updatedOrganizers = [newOrgProfile, ...localOrganizers];
      }

      updateOrganizersList(updatedOrganizers);

      // Provision / elevate in voterightgh_users_auth
      let usersAuth: any[] = [];
      try {
        usersAuth = JSON.parse(localStorage.getItem('voterightgh_users_auth') || '[]');
      } catch (e) {
        usersAuth = [];
      }

      const existingAuthIndex = usersAuth.findIndex(
        (u: any) => u.email && u.email.toLowerCase() === cleanEmail
      );

      const userAuthObj = {
        id: newOrgProfile.id,
        email: newOrgProfile.email,
        password: newOrgProfile.password,
        fullName: newOrgProfile.fullName,
        phone: newOrgProfile.phone,
        agency: newOrgProfile.agency,
        role: 'organizer', // Dynamically elevate to organizer
        status: newOrgProfile.status,
        isVerified: newOrgProfile.isVerified,
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

      showToast(`✅ Organizer "${newOrgProfile.fullName}" provisioned successfully with active login credentials!`);
    }

    // Reset Form & Close
    setManualFullName('');
    setManualEmail('');
    setManualPhone('');
    setManualAgency('');
    setManualPassword('organizer123');
    setManualEventTitle('');
    setManualStatus('approved');
    setManualIsVerified(true);
    setShowManualAddModal(false);
  };

  // Organizer Status Management
  const handleOrganizerStatusChange = (id: string, newStatus: 'approved' | 'rejected') => {
    const updated = localOrganizers.map(org => {
      if (org.id === id) {
        return { 
          ...org, 
          status: newStatus,
          isVerified: newStatus === 'approved'
        };
      }
      return org;
    });

    updateOrganizersList(updated);

    const target = localOrganizers.find(o => o.id === id);
    if (newStatus === 'approved') {
      showToast(`✅ Organizer "${target?.fullName || target?.email}" APPROVED & Verified! Account unlocked.`);
    } else {
      showToast(`❌ Organizer "${target?.fullName || target?.email}" status set to REJECTED.`);
    }
  };

  const handleToggleBlockOrganizer = (id: string) => {
    const updated = localOrganizers.map(org => {
      if (org.id === id) {
        return { ...org, isBlocked: !org.isBlocked };
      }
      return org;
    });

    updateOrganizersList(updated);
    const target = localOrganizers.find(o => o.id === id);
    showToast(`⚡ Organizer "${target?.fullName}" ${target?.isBlocked ? 'unblocked' : 'blocked'}.`);
  };

  const handleDeleteOrganizer = (id: string) => {
    const target = localOrganizers.find(o => o.id === id);
    setDeleteModal({
      type: 'organizer',
      id,
      title: target?.fullName || target?.email || 'Organizer Profile'
    });
  };

  const handleApprovePayout = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const req = payouts.find((p) => p.id === id);
    if (!req) return;

    const transferCode = `TRF-PS-${Date.now().toString().slice(-6)}`;
    const txHash = `0x${Math.random().toString(16).substring(2, 18)}`;

    const updated = payouts.map((p) =>
      p.id === id
        ? {
            ...p,
            status: newStatus,
            disbursedAt: newStatus === 'APPROVED' ? new Date().toISOString() : p.disbursedAt,
            transferCode: p.transferCode || transferCode,
            txHash: p.txHash || txHash,
          }
        : p
    );

    setPayouts(updated);
    localStorage.setItem('voterightgh_payout_requests', JSON.stringify(updated));
    window.dispatchEvent(new Event('voteright_payout_update'));
    window.dispatchEvent(new Event('storage'));

    if (newStatus === 'APPROVED') {
      showToast(
        `✅ Payout of GHS ${req.amount?.toLocaleString() || ''} to ${
          req.organizerName || req.organizer || 'Organizer'
        } APPROVED & DISBURSED via Main Paystack Account!`
      );
    } else {
      showToast(`❌ Payout request of GHS ${req.amount?.toLocaleString() || ''} REJECTED.`);
    }
  };

  // Filtered Organizers for Table
  const filteredOrganizers = localOrganizers.filter(org => {
    const query = searchQuery.toLowerCase();
    const name = org.fullName || org.agency || '';
    const email = org.email || '';
    const phone = org.phone || '';
    const agency = org.agency || '';
    return name.toLowerCase().includes(query) || 
           email.toLowerCase().includes(query) || 
           phone.toLowerCase().includes(query) ||
           agency.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16 selection:bg-amber-400 selection:text-slate-950">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-4 right-4 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center justify-between gap-3 border border-emerald-400"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-slate-950 hover:text-white cursor-pointer font-black text-sm">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-lg">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" /> VoteRight GH — Secret Admin Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage platform organizers, review verification queues, control event status & payouts</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/30 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> System Active 🟢
          </span>
          <button 
            onClick={() => {
              localStorage.removeItem('voteright_admin_session');
              localStorage.removeItem('isAdminAuthenticated');
              localStorage.removeItem('voterightgh_user');
              window.location.href = '/';
            }}
            className="px-3.5 py-1.5 text-xs bg-red-600/20 text-red-300 border border-red-500/30 rounded-xl hover:bg-red-600 hover:text-white transition cursor-pointer font-bold"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 space-x-2 mb-8 overflow-x-auto">
          {[
            { id: 'organizers', label: `Registered Organizers (${localOrganizers.length})`, icon: Users },
            { id: 'events', label: `Events & Voting (${events.length})`, icon: Calendar },
            { id: 'nominees', label: `Candidates & Nominees (${localNominees.length})`, icon: UserCheck },
            { id: 'tickets', label: `Ticket Management (${ticketEvents.length})`, icon: Ticket },
            { id: 'payouts', label: `MoMo Payout Requests (${payouts.filter(p => p.status === 'PENDING').length})`, icon: DollarSign },
            { id: 'growth', label: 'Platform Settings & Revenue Cut', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition border-b-2 cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'border-amber-400 text-amber-400 bg-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Content with Animation */}
        <AnimatePresence mode="wait">
          {activeTab === 'organizers' && (
            <motion.div 
              key="organizers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-400" /> Registered Organizers Management
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Review live applicant profiles, verify credentials, or manually provision organizer accounts</p>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowManualAddModal(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-400/20 shrink-0"
                >
                  <UserPlus className="w-4 h-4 fill-slate-950" />
                  <span>Add Organizer Manually</span>
                </motion.button>
              </div>

              {/* Search Filter */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input 
                  type="text"
                  placeholder="Search organizers by name, email, phone number, or agency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors shadow-inner"
                />
              </div>

              {/* Organizers Management Table */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="p-4">Organizer Name & Email</th>
                        <th className="p-4">Organization / Agency</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Account Status</th>
                        <th className="p-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {filteredOrganizers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-medium">
                            No registered organizers found matching "{searchQuery}".
                          </td>
                        </tr>
                      ) : (
                        filteredOrganizers.map((org, index) => {
                          const isApproved = org.status === 'approved' || org.isVerified;
                          const isRejected = org.status === 'rejected';
                          const isPending = !isApproved && !isRejected;

                          return (
                            <motion.tr 
                              key={org.id} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15, delay: index * 0.03 }}
                              className="hover:bg-slate-700/30 transition-colors"
                            >
                              <td className="p-4">
                                <div className="font-extrabold text-white text-sm">{org.fullName || 'Organizer User'}</div>
                                <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                                  <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                                  {org.email}
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-slate-200">
                                {org.agency || org.eventTitle || 'Independent Organizer'}
                              </td>
                              <td className="p-4 font-mono text-slate-300">
                                {org.phone || 'N/A'}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col items-start gap-1">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    isApproved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    isRejected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 
                                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}>
                                    {isApproved ? 'APPROVED 🟢' : isRejected ? 'REJECTED 🔴' : 'PENDING REVIEW 🟡'}
                                  </span>
                                  {org.isBlocked && (
                                    <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase">
                                      BLOCKED
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                {isPending ? (
                                  <>
                                    <button 
                                      onClick={() => handleOrganizerStatusChange(org.id, 'approved')}
                                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer active:scale-95"
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={() => handleOrganizerStatusChange(org.id, 'rejected')}
                                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleOrganizerStatusChange(org.id, isApproved ? 'rejected' : 'approved')}
                                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer active:scale-95"
                                  >
                                    Toggle Status
                                  </button>
                                )}

                                <button 
                                  onClick={() => handleToggleBlockOrganizer(org.id)}
                                  title={org.isBlocked ? 'Unblock Account' : 'Block Access'}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    org.isBlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                  }`}
                                >
                                  <ShieldAlert className="w-4 h-4 inline" />
                                </button>

                                <button 
                                  onClick={() => handleDeleteOrganizer(org.id)}
                                  title="Delete Profile"
                                  className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: EVENTS & VOTING STATUS TOGGLE */}
          {activeTab === 'events' && (
            <motion.div 
              key="events"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center flex-wrap gap-4 bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
                <div>
                  <h2 className="text-xl font-black text-white">Active & Archived Events Override</h2>
                  <p className="text-xs text-slate-400 mt-1">One-click voting status toggle. Flipping status to ENDED immediately displays the "VOTING HAS ENDED" overlay on public cards.</p>
                </div>
              </div>

              <div className="grid gap-4">
                {events.map((ev, index) => (
                  <motion.div 
                    key={ev.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 shadow-md hover:border-slate-600 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white">{ev.title}</h3>
                      <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                        <span>Organizer: <span className="text-slate-200 font-semibold">{ev.organizer}</span></span>
                        <span>•</span>
                        <span>Total Votes: <span className="text-amber-400 font-bold">{ev.totalVotes?.toLocaleString() || 0}</span></span>
                        {ev.endDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-300 font-mono">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              End: {new Date(ev.endDate).toLocaleString()}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Actions & Voting Status Switch */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAdminContest(ev)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                        title="Edit Event Details & Banner"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Event</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAdminTicketsModal(ev)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                        title="Manage Ticket Tiers for this Event"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Manage Tickets</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteModal({ type: 'event', id: ev.id, title: ev.title })}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                        title="Remove Event from System"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Event</span>
                      </button>

                      <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-700">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Voting Status:
                        </span>
                        <button 
                          onClick={() => toggleVotingStatus(ev.id)}
                          className="flex items-center gap-2 transition cursor-pointer active:scale-95"
                        >
                          {ev.isOngoing ? (
                            <>
                              <ToggleRight className="w-8 h-8 text-emerald-400" />
                              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-black px-3 py-1 rounded-lg border border-emerald-500/30">
                                ONGOING 🟢
                              </span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-8 h-8 text-rose-400" />
                              <span className="text-xs bg-rose-500/20 text-rose-300 font-black px-3 py-1 rounded-lg border border-rose-500/30">
                                ENDED 🔴
                              </span>
                            </>
                          )
                        }
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: CANDIDATES & NOMINEES MANAGEMENT */}
          {activeTab === 'nominees' && (
            <motion.div
              key="nominees"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
                <div>
                  <h2 className="text-xl font-black text-white">Candidates & Nominees Directory</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage candidates across all competitions. Remove or search nominees with immediate real-time sync.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={nomineeSearch}
                      onChange={(e) => setNomineeSearch(e.target.value)}
                      placeholder="Search name, code, category..."
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                  <select
                    value={nomineeContestFilter}
                    onChange={(e) => setNomineeContestFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="ALL">All Events ({localNominees.length})</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {localNominees.filter((n) => {
                const matchesSearch =
                  n.name.toLowerCase().includes(nomineeSearch.toLowerCase()) ||
                  n.code.toLowerCase().includes(nomineeSearch.toLowerCase()) ||
                  n.category.toLowerCase().includes(nomineeSearch.toLowerCase());
                const matchesContest = nomineeContestFilter === 'ALL' || n.contestId === nomineeContestFilter;
                return matchesSearch && matchesContest;
              }).length === 0 ? (
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                  <Users className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="font-extrabold text-white text-base">No Nominees Found</div>
                  <p className="text-xs">No candidates match your current search query or competition filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localNominees
                    .filter((n) => {
                      const matchesSearch =
                        n.name.toLowerCase().includes(nomineeSearch.toLowerCase()) ||
                        n.code.toLowerCase().includes(nomineeSearch.toLowerCase()) ||
                        n.category.toLowerCase().includes(nomineeSearch.toLowerCase());
                      const matchesContest = nomineeContestFilter === 'ALL' || n.contestId === nomineeContestFilter;
                      return matchesSearch && matchesContest;
                    })
                    .map((n) => {
                      const parentContest = events.find((e) => e.id === n.contestId);
                      return (
                        <div
                          key={n.id}
                          className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={n.photoUrl}
                              alt={n.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-950"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-400/30 inline-block mb-1">
                                {n.code}
                              </span>
                              <h4 className="font-extrabold text-sm text-white truncate">{n.name}</h4>
                              <p className="text-[11px] text-slate-400 truncate">{n.category}</p>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">{parentContest?.title || 'General Competition'}</p>
                            </div>
                          </div>

                          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-bold">Total Votes:</span>
                            <span className="text-base font-black font-mono text-amber-400">{n.votes.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ type: 'nominee', id: n.id, title: n.name })}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                              title="Delete Candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Nominee</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: TICKET MANAGEMENT */}
          {activeTab === 'tickets' && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Top Banner Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
                  <div className="text-xs font-extrabold uppercase text-slate-400">Total Ticket Events</div>
                  <div className="text-2xl font-black text-white mt-1">{ticketEvents.length} Platform Events</div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1">Concerts, Galas & Award Shows</div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
                  <div className="text-xs font-extrabold uppercase text-slate-400">Configured Pricing Tiers</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {ticketEvents.reduce((acc, e) => acc + (e.ticketTiers?.length || 0), 0)} Tiers
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Regular, VIP & VVIP Passes</div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
                  <div className="text-xs font-extrabold uppercase text-slate-400">Total Ticket Inventory</div>
                  <div className="text-2xl font-black text-indigo-400 font-mono mt-1">
                    {ticketEvents.reduce((acc, e) => acc + (e.ticketTiers?.reduce((sum, t) => sum + (t.available || 0), 0) || 0), 0).toLocaleString()} passes
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Live available capacity</div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800 border border-slate-700 p-4 rounded-2xl">
                <div>
                  <h3 className="text-base font-extrabold text-white">Event E-Tickets Management</h3>
                  <p className="text-xs text-slate-400">Manage ticket tiers, prices, and available passes across all platform events.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingNewTicketEvent(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 shadow-lg"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Create Ticket Event</span>
                </button>
              </div>

              {/* Event Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ticketEvents.map((evt) => (
                  <div key={evt.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 shadow-md hover:border-slate-600 transition">
                    <img
                      src={evt.posterUrl}
                      alt={evt.title}
                      className="w-full sm:w-28 h-36 rounded-xl object-cover shrink-0 border border-slate-700"
                    />
                    <div className="flex-1 min-w-0 space-y-2.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded uppercase">
                            {evt.category || 'Concert & Party'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTicketEvent(evt.id, evt.title)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs cursor-pointer"
                            title="Delete Ticket Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="font-extrabold text-base text-white line-clamp-1 mt-1.5">{evt.title}</h4>
                        <p className="text-xs text-slate-400">Organizer: <span className="text-slate-200 font-semibold">{evt.organizer}</span></p>

                        <div className="text-xs text-slate-300 mt-2 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">📍 Venue:</span>
                            <span className="font-medium">{evt.venue}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">📅 Date:</span>
                            <span className="font-medium">{evt.endDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-amber-400 font-bold">
                            <span>From: GH₵ {(evt.priceGHS || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tier Badges & Action */}
                      <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {(evt.ticketTiers || []).map((t) => (
                            <span key={t.id} className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-200 px-2 py-0.5 rounded">
                              {t.name}: GH₵{t.price} ({t.available})
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenAdminTicketsModal(evt)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ml-auto"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Manage Tiers ({evt.ticketTiers?.length || 0})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: MOMO PAYOUT APPROVALS */}
          {activeTab === 'payouts' && (
            <motion.div 
              key="payouts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
                <h2 className="text-xl font-black text-white">Mobile Money & Bank Withdrawal Requests</h2>
                <p className="text-xs text-slate-400 mt-1">Live requests submitted directly from Organizer Dashboards</p>
              </div>

              <div className="grid gap-4">
                {payouts.map((p, index) => {
                  const requesterName = p.organizerName || p.organizer || 'Ghana Event Organizer';
                  const eventName = p.eventTitle || p.contestTitle || 'MISS CAMPUS GHANA 2026';
                  const providerName = p.momoNetwork || p.bankOrNetworkName || p.network || 'MTN MoMo';
                  const isPending = p.status === 'PENDING' || p.status === 'pending';
                  const isApproved = p.status === 'APPROVED' || p.status === 'Paid' || p.status === 'paid' || p.status === 'DISBURSED';

                  return (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-6 shadow-md hover:border-slate-600 transition-colors"
                    >
                      <div className="space-y-2 flex-1 min-w-[280px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-white text-base">{requesterName}</h3>
                          <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            Organizer
                          </span>
                          {p.createdAt && (
                            <span className="text-xs text-slate-400 font-mono">
                              • {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-amber-400 font-semibold">
                          Event: <span className="text-slate-200 font-medium">{eventName}</span>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/80 text-xs font-mono space-y-1 text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Payment Method:</span>
                            <span className="text-emerald-400 font-bold">{providerName}</span>
                            <span className="text-slate-400">({p.paymentMethod || 'Mobile Money'})</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Account Number:</span>{' '}
                            <span className="text-white font-bold">{p.accountNumber || p.accountNo}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Account Name:</span>{' '}
                            <span className="text-white font-bold">{p.accountName || requesterName}</span>
                          </div>
                        </div>

                        <div className="text-xl font-black text-emerald-400 font-mono pt-1">
                          GHS {Number(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPending ? (
                          <>
                            <motion.button 
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleApprovePayout(p.id, 'APPROVED')}
                              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-5 py-3 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg"
                            >
                              <span>Approve & Disburse</span> ⚡
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleApprovePayout(p.id, 'REJECTED')}
                              className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold px-4 py-3 rounded-xl text-xs border border-rose-500/30 transition cursor-pointer"
                            >
                              Reject
                            </motion.button>
                          </>
                        ) : (
                          <span className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {isApproved ? 'Approved & Disbursed ✅' : 'Request Rejected ❌'}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 4: GROWTH & PLATFORM SETTINGS */}
          {activeTab === 'growth' && (
            <motion.div 
              key="growth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-amber-400">VoteRight GH Platform Fee</h3>
                  {platformFee !== savedPlatformFee ? (
                    <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 animate-pulse">
                      Unsaved Changes
                    </span>
                  ) : (
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Saved ({savedPlatformFee}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Adjust the percentage commission deducted automatically from voting revenue across all active and upcoming competitions.
                </p>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={platformFee} 
                      onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 w-32 text-amber-400 font-mono font-bold text-lg focus:outline-none focus:border-amber-400" 
                    />
                    <span className="absolute right-3 top-3 text-slate-500 font-bold text-sm">%</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePlatformFee}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-md ${
                      platformFee !== savedPlatformFee
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 scale-105 shadow-amber-400/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{platformFee !== savedPlatformFee ? 'Save Revenue Cut' : 'Save'}</span>
                  </button>
                </div>

                {isFeeSaved && (
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle className="w-4 h-4" /> New commission cut ({savedPlatformFee}%) saved and applied to system revenue!
                  </p>
                )}

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 text-xs text-slate-300 space-y-2 font-medium">
                  <div className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    Voting Revenue Cut Breakdown Preview:
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Platform System Cut:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {platformFee}% (GH₵ {(platformFee).toFixed(2)} per GH₵ 100)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Organizer Payout Revenue:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {(100 - platformFee).toFixed(1)}% (GH₵ {(100 - platformFee).toFixed(2)} per GH₵ 100)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
                <h3 className="text-lg font-black text-amber-400">System Broadcast Announcement</h3>
                <p className="text-xs text-slate-400">Post a broadcast message visible across the platform ticker.</p>
                
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="e.g. System upgrade complete..." 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button 
                    onClick={() => {
                      if (broadcastMessage) {
                        setActiveAnnouncement(broadcastMessage);
                        showToast('📢 Broadcast banner published!');
                      }
                      setBroadcastMessage('');
                    }}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer active:scale-95"
                  >
                    Publish Announcement
                  </button>
                </div>

                {activeAnnouncement && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-mono">
                    <strong>Current Live Banner:</strong> "{activeAnnouncement}"
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* MODAL: ADD ORGANIZER MANUALLY */}
      <AnimatePresence>
        {showManualAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-400">Add Organizer Manually</h3>
                    <p className="text-[11px] text-slate-400">Directly create & provision active organizer account credentials</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowManualAddModal(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer"
                  aria-label="Close modal"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {manualError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="font-semibold">{manualError}</span>
                </div>
              )}

              <form onSubmit={handleManualAddSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Full Name / Representative</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Kwame Mensah"
                      value={manualFullName}
                      onChange={(e) => setManualFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Official Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input 
                      type="email" 
                      required
                      placeholder="organizer@gmail.com"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Ghana Phone Number (MoMo)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input 
                        type="tel" 
                        required
                        placeholder="024XXXXXXX"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Organization / Agency Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Afronation Events Ltd"
                      value={manualAgency}
                      onChange={(e) => setManualAgency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Login Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input 
                        type="text" 
                        required
                        placeholder="organizer123"
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-amber-400 font-mono font-bold rounded-xl pl-10 pr-4 py-2.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Associated Event Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Miss Campus GH 2026"
                      value={manualEventTitle}
                      onChange={(e) => setManualEventTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Verification Status</label>
                    <select 
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none"
                    >
                      <option value="approved">Approved 🟢</option>
                      <option value="pending">Pending Review 🟡</option>
                      <option value="rejected">Rejected 🔴</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={manualIsVerified}
                        onChange={(e) => setManualIsVerified(e.target.checked)}
                        className="w-4 h-4 rounded accent-amber-400"
                      />
                      <span className="font-bold text-slate-200">Verified Account Badge</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setShowManualAddModal(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg shadow-amber-400/20 transition"
                  >
                    Create Organizer Account
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT EVENT */}
      <AnimatePresence>
        {editingContest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-4 my-8 text-white shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-base text-white">
                    Edit Event: {editingContest.title}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingContest(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedContest} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Event Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={editingContest.title}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Organizer Name</label>
                    <input
                      type="text"
                      name="organizer"
                      required
                      defaultValue={editingContest.organizer || ''}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Category</label>
                    <select
                      name="category"
                      defaultValue={editingContest.category || 'pageant'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    >
                      <option value="pageant">Beauty Pageant / Fashion</option>
                      <option value="awards">Awards Scheme / Excellence</option>
                      <option value="campus">Campus / University Election</option>
                      <option value="talent">Talent / Reality Show</option>
                      <option value="corporate">Corporate / Executive Awards</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Vote Price (GHS)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="votePrice"
                      required
                      defaultValue={editingContest.votePrice || 1.50}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Voting Status</label>
                    <select
                      name="isOngoing"
                      defaultValue={editingContest.isOngoing ? 'true' : 'false'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    >
                      <option value="true">ONGOING (Voting Active)</option>
                      <option value="false">PAUSED / ENDED (Voting Closed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={editingContest.startDate ? new Date(editingContest.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={editingContest.endDate ? new Date(editingContest.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Custom Slug / URL Path</label>
                    <input
                      type="text"
                      name="slug"
                      defaultValue={editingContest.slug || ''}
                      placeholder="e.g. miss-campus-ghana-2026"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Banner / Flyer Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="bannerUrl"
                      value={editBannerUrl}
                      onChange={(e) => setEditBannerUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2.5 rounded-xl cursor-pointer font-bold shrink-0 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setEditBannerUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editBannerUrl && (
                    <div className="mt-2 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                      <img src={editBannerUrl} alt="Flyer Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Event Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={editingContest.description}
                    placeholder="Provide details about this contest or event..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Rules & Regulations (One rule per line)</label>
                  <textarea
                    name="rules"
                    rows={2}
                    defaultValue={editingContest.rules ? editingContest.rules.join('\n') : ''}
                    placeholder="Rule 1...&#10;Rule 2..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Event Nominees Direct Quick-Management */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Candidates in this Competition ({localNominees.filter((n) => n.contestId === editingContest.id).length})</span>
                    </label>
                  </div>
                  {localNominees.filter((n) => n.contestId === editingContest.id).length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
                      No candidates currently registered for this competition.
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      {localNominees
                        .filter((n) => n.contestId === editingContest.id)
                        .map((cand) => (
                          <div
                            key={cand.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={cand.photoUrl}
                                alt={cand.name}
                                className="w-7 h-7 rounded-lg object-cover bg-slate-950 shrink-0"
                              />
                              <div className="truncate">
                                <span className="text-amber-400 font-mono font-bold mr-1.5">[{cand.code}]</span>
                                <span className="text-white font-bold">{cand.name}</span>
                                <span className="text-slate-400 ml-1.5 font-mono">({cand.votes} votes)</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ type: 'nominee', id: cand.id, title: cand.name })}
                              className="text-rose-400 hover:text-rose-300 p-1.5 hover:bg-rose-500/20 rounded-lg transition cursor-pointer shrink-0"
                              title="Delete Candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDeleteModal({ type: 'event', id: editingContest.id, title: editingContest.title })}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove This Event</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingContest(null)}
                      className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: ADMIN MANAGE EVENT TICKET TIERS */}
        {editingAdminTicketEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-6 my-8 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-white">Admin Ticket Tier Management</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{editingAdminTicketEvent.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAdminTicketEvent(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Add Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Add Quick Preset Tier:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newTier: TicketTier = {
                        id: `tier-reg-${Date.now()}`,
                        name: 'Regular Gate Pass',
                        price: 50,
                        available: 300,
                        description: 'General gate access ticket'
                      };
                      setAdminTiersList([...adminTiersList, newTier]);
                    }}
                    className="text-xs font-bold bg-slate-950 border border-slate-800 hover:border-amber-400 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Regular (GH₵ 50)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newTier: TicketTier = {
                        id: `tier-vip-${Date.now()}`,
                        name: 'VIP Access Pass',
                        price: 150,
                        available: 100,
                        description: 'Front seating & free drink'
                      };
                      setAdminTiersList([...adminTiersList, newTier]);
                    }}
                    className="text-xs font-bold bg-slate-950 border border-slate-800 hover:border-purple-400 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ VIP (GH₵ 150)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newTier: TicketTier = {
                        id: `tier-vvip-${Date.now()}`,
                        name: 'VVIP Table Pass',
                        price: 500,
                        available: 20,
                        description: 'Stage table for 5 guests'
                      };
                      setAdminTiersList([...adminTiersList, newTier]);
                    }}
                    className="text-xs font-bold bg-slate-950 border border-slate-800 hover:border-indigo-400 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>+ VVIP Table (GH₵ 500)</span>
                  </button>
                </div>
              </div>

              {/* Tiers List */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">Configured Tiers ({adminTiersList.length}):</label>
                {adminTiersList.length === 0 ? (
                  <div className="bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                    No ticket tiers found. Add a tier below.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {adminTiersList.map((tier) => (
                      <div
                        key={tier.id}
                        className={`bg-slate-950 border p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          editingAdminTierId === tier.id ? 'border-amber-400 bg-amber-400/5' : 'border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{tier.name}</span>
                            <span className="font-mono text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                              GH₵ {tier.price.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              {tier.available} Available
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{tier.description || 'Event entry ticket'}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAdminTierId(tier.id);
                              setAdminTierName(tier.name);
                              setAdminTierPrice(tier.price.toString());
                              setAdminTierQty(tier.available.toString());
                              setAdminTierDesc(tier.description || '');
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminTiersList(adminTiersList.filter(t => t.id !== tier.id));
                              if (editingAdminTierId === tier.id) setEditingAdminTierId(null);
                            }}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tier Subform */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!adminTierName.trim() || !adminTierPrice) return;
                  const price = parseFloat(adminTierPrice) || 0;
                  const available = parseInt(adminTierQty) || 100;

                  if (editingAdminTierId) {
                    setAdminTiersList(adminTiersList.map(t => t.id === editingAdminTierId ? {
                      ...t,
                      name: adminTierName.trim(),
                      price,
                      available,
                      description: adminTierDesc.trim()
                    } : t));
                    setEditingAdminTierId(null);
                  } else {
                    const newTier: TicketTier = {
                      id: `tier-custom-${Date.now()}`,
                      name: adminTierName.trim(),
                      price,
                      available,
                      description: adminTierDesc.trim()
                    };
                    setAdminTiersList([...adminTiersList, newTier]);
                  }
                  setAdminTierName('');
                  setAdminTierPrice('');
                  setAdminTierQty('');
                  setAdminTierDesc('');
                }}
                className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-white">
                    {editingAdminTierId ? '⚡ Edit Ticket Tier' : '➕ Add New Tier'}
                  </div>
                  {editingAdminTierId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAdminTierId(null);
                        setAdminTierName('');
                        setAdminTierPrice('');
                        setAdminTierQty('');
                        setAdminTierDesc('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Tier Name</label>
                    <input
                      type="text"
                      required
                      value={adminTierName}
                      onChange={(e) => setAdminTierName(e.target.value)}
                      placeholder="e.g. VIP Pass"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Price (GH₵)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={adminTierPrice}
                      onChange={(e) => setAdminTierPrice(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      value={adminTierQty}
                      onChange={(e) => setAdminTierQty(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 text-xs">Description</label>
                  <input
                    type="text"
                    value={adminTierDesc}
                    onChange={(e) => setAdminTierDesc(e.target.value)}
                    placeholder="e.g. Gate entry + VIP drink coupon"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingAdminTierId ? 'Update Tier' : 'Add Tier to List'}</span>
                  </button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAdminTicketEvent(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdminTicketTiers}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save All Ticket Changes</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: ADMIN CREATE TICKET EVENT */}
        {isCreatingNewTicketEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-6 my-8 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-2xl">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-white">Create Ticketed Event</h3>
                    <p className="text-xs text-slate-400">List a new event with default Regular, VIP, and VVIP ticket tiers.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreatingNewTicketEvent(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewTicketEventSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g. Accra Music & Cultural Festival 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Organizer / Host</label>
                    <input
                      type="text"
                      value={newEventOrganizer}
                      onChange={(e) => setNewEventOrganizer(e.target.value)}
                      placeholder="e.g. Golden Era Events"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Category</label>
                    <select
                      value={newEventCategory}
                      onChange={(e) => setNewEventCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Concert">Concert & Live Show</option>
                      <option value="Pageant">Beauty Pageant & Gala</option>
                      <option value="Awards">Excellence Awards</option>
                      <option value="Festival">Cultural Festival</option>
                      <option value="Party">Nightclub & Rave</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Venue Location</label>
                    <input
                      type="text"
                      value={newEventVenue}
                      onChange={(e) => setNewEventVenue(e.target.value)}
                      placeholder="e.g. Accra International Conference Centre"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Event Date & Time</label>
                    <input
                      type="text"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      placeholder="e.g. Sat, 15 Dec 2026 at 7:00 PM"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Poster Image URL (Optional)</label>
                  <input
                    type="url"
                    value={newEventPoster}
                    onChange={(e) => setNewEventPoster(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="bg-amber-400/5 border border-amber-400/20 p-3 rounded-xl text-[11px] text-slate-300 space-y-1">
                  <div className="font-bold text-amber-400">Default Ticket Tiers Auto-Added:</div>
                  <div>• Regular Pass: GH₵ 50 (500 capacity)</div>
                  <div>• VIP Pass: GH₵ 150 (150 capacity)</div>
                  <div>• VVIP Table: GH₵ 500 (20 capacity)</div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewTicketEvent(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Ticket Event</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {/* MODAL: SAFE IRREVERSIBLE ACTION CONFIRMATION (NO window.confirm) */}
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 text-white shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer"
                aria-label="Close dialog"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pr-8">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    {deleteModal.type === 'event' && 'Remove Event'}
                    {deleteModal.type === 'nominee' && 'Delete Candidate'}
                    {deleteModal.type === 'ticket' && 'Delete Ticket Listing'}
                    {deleteModal.type === 'organizer' && 'Remove Organizer Profile'}
                  </h3>
                  <p className="text-xs text-slate-400">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {deleteModal.type === 'event' && (
                  <>
                    Are you sure you want to remove <strong className="text-white">"{deleteModal.title}"</strong>? All candidates, vote counts, and event parameters will be deleted from the system.
                  </>
                )}
                {deleteModal.type === 'nominee' && (
                  <>
                    Are you sure you want to delete candidate <strong className="text-white">"{deleteModal.title}"</strong>? Their vote tallies, contestant code, and public profile card will be permanently deleted.
                  </>
                )}
                {deleteModal.type === 'ticket' && (
                  <>
                    Are you sure you want to remove ticket event <strong className="text-white">"{deleteModal.title}"</strong>?
                  </>
                )}
                {deleteModal.type === 'organizer' && (
                  <>
                    Are you sure you want to delete organizer account <strong className="text-white">"{deleteModal.title}"</strong>?
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold text-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {deleteModal.type === 'event' ? 'Remove Event' : 'Confirm Delete'}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
