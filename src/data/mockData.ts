import { Contest, Nominee, RecentVoteFeed, CurrencyRate, TicketEvent, NominationAward, SiteSettings } from '../types';

export const CURRENCIES: CurrencyRate[] = [
  { code: 'GHS', symbol: 'GH₵', rateToBase: 1.0 },
  { code: 'USD', symbol: '$', rateToBase: 0.065 },
  { code: 'NGN', symbol: '₦', rateToBase: 100.0 },
  { code: 'KES', symbol: 'KSh', rateToBase: 8.5 },
];

export const INITIAL_CONTESTS: Contest[] = [
  {
    id: 'contest-miss-good-news',
    title: 'Miss Good News 2026',
    organizer: 'Gospel Vision & Media Foundation',
    category: 'pageant',
    bannerUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200',
    description: 'Empowering Christian women leaders, intellect, grace, and community impact.',
    startDate: '2026-06-15T00:00:00Z',
    endDate: '2026-08-28T20:00:00Z',
    isLive: true,
    votePrice: 1.50,
    totalVotes: 218450,
    categories: ['👑 Queen of Grace 2026', '💡 Most Intellectual', '🌟 People’s Choice'],
    ticketsEnabled: true
  },
  {
    id: 'contest-high-school-awards',
    title: 'High School Awards Ghana',
    organizer: 'National High School Guild',
    category: 'award',
    bannerUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1200',
    description: 'Celebrating high school student innovators, SRC presidents, debate champions, and campus icons.',
    startDate: '2026-07-10T00:00:00Z',
    endDate: '2026-09-12T18:00:00Z',
    isLive: true,
    votePrice: 1.00,
    totalVotes: 184200,
    categories: ['📚 Best Academic Innovator', '🗣️ Debater of the Year', '🎭 Campus Influencer'],
    ticketsEnabled: true
  },
  {
    id: 'contest-nubs-dinner',
    title: 'NUBS Dinner & Excellence Awards',
    organizer: 'National Union of Baptist Students',
    category: 'award',
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200',
    description: 'Annual dinner & excellence awards honoring outstanding student ministry leaders and scholars.',
    startDate: '2026-08-01T00:00:00Z',
    endDate: '2026-09-18T20:00:00Z',
    isLive: true,
    votePrice: 2.00,
    totalVotes: 98400,
    categories: ['✝️ Ministry Leader of the Year', '📖 Scholar of the Year', '🤝 Executive Personality'],
    ticketsEnabled: true
  },
  {
    id: 'contest-banda-world',
    title: 'Banda To The World Awards',
    organizer: 'Banda Youth Empowerment Council',
    category: 'award',
    bannerUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200',
    description: 'Recognizing Banda community trailblazers, entrepreneurs, health heroes, and sports ambassadors.',
    startDate: '2026-07-20T00:00:00Z',
    endDate: '2026-09-27T22:00:00Z',
    isLive: true,
    votePrice: 1.50,
    totalVotes: 156300,
    categories: ['🏆 Banda Most Beautiful', '💼 Entrepreneur of the Year', '🏅 Sports Ambassador'],
    ticketsEnabled: true
  },
  {
    id: 'contest-heritage-star',
    title: 'Heritage Star Pageant 2026',
    organizer: 'Heritage Cultural Media',
    category: 'pageant',
    bannerUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=1200',
    description: 'Celebrating authentic Ghanaian heritage, traditional fashion, and youth mentorship.',
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-08-25T23:59:59Z',
    isLive: true,
    votePrice: 1.50,
    totalVotes: 295000,
    categories: ['👑 Heritage Queen 2026', '👗 Cultural Fashion Icon', '💡 Social Impact Award'],
    ticketsEnabled: true
  }
];

export const INITIAL_NOMINEES: Nominee[] = [
  // Miss Good News 2026
  {
    id: 'nom-mgn-1',
    code: 'MGN-01',
    name: 'Grace Serwaa',
    category: '👑 Queen of Grace 2026',
    contestId: 'contest-miss-good-news',
    photoUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600',
    bio: 'Youth advocate & volunteer nurse leading medical outreaches in Eastern Region.',
    votes: 68400,
    rank: 1
  },
  {
    id: 'nom-mgn-2',
    code: 'MGN-02',
    name: 'Abena Peace',
    category: '👑 Queen of Grace 2026',
    contestId: 'contest-miss-good-news',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    bio: 'Teacher & gospel choir director promoting girl-child literacy.',
    votes: 62100,
    rank: 2
  },
  {
    id: 'nom-mgn-3',
    code: 'MGN-03',
    name: 'Esther Osei',
    category: '💡 Most Intellectual',
    contestId: 'contest-miss-good-news',
    photoUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
    bio: 'Computer science researcher advocating for STEM in junior schools.',
    votes: 51200,
    rank: 1
  },

  // Banda To The World
  {
    id: 'nom-btw-1',
    code: 'BTW-10',
    name: 'Adjoa Banda',
    category: '🏆 Banda Most Beautiful',
    contestId: 'contest-banda-world',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
    bio: 'Cultural ambassador showcasing traditional Banda crafts.',
    votes: 54100,
    rank: 1
  },
  {
    id: 'nom-btw-2',
    code: 'BTW-11',
    name: 'Kwaku Enterprise',
    category: '💼 Entrepreneur of the Year',
    contestId: 'contest-banda-world',
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
    bio: 'Agro-processing pioneer providing jobs for local youth.',
    votes: 49200,
    rank: 1
  }
];

export const INITIAL_TICKET_EVENTS: TicketEvent[] = [
  {
    id: 'evt-genz-rave',
    title: 'Gen Z Rave 2026',
    organizer: 'Vibe Tribe Events',
    posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
    endDate: 'Sat, 05 Sep 2026',
    venue: 'Street Star Park, Adenta, Accra',
    priceGHS: 50.00,
    category: 'Concert & Party',
    ticketTiers: [
      { id: 'gz-reg', name: 'Regular Entry Pass', price: 50.00, description: 'Single general admission entry pass', available: 350 },
      { id: 'gz-vip', name: 'VIP Access Pass', price: 120.00, description: 'Stage-front VIP lounge + Complimentary Drink', available: 100 },
      { id: 'gz-vvip', name: 'VVIP Squad Pass (5 People)', price: 450.00, description: 'Reserved couch table of 5 + Premium Bottle', available: 20 }
    ]
  },
  {
    id: 'evt-nubs-gala',
    title: 'NUBS Gala Dinner & Red Carpet',
    organizer: 'National Union of Baptist Students',
    posterUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200',
    endDate: 'Fri, 18 Sep 2026',
    venue: 'Accra International Conference Centre',
    priceGHS: 120.00,
    category: 'Gala Dinner',
    ticketTiers: [
      { id: 'nubs-single', name: 'Single Banquet Pass', price: 120.00, description: '3-course buffet dinner + awards show entry', available: 150 },
      { id: 'nubs-couple', name: 'Couples Pass', price: 220.00, description: 'Reserved dining table for 2', available: 50 }
    ]
  },
  {
    id: 'evt-banda-gala',
    title: 'Banda Gala Night & Fashion Show',
    organizer: 'Banda Youth Empowerment Council',
    posterUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200',
    endDate: 'Sun, 27 Sep 2026',
    venue: 'Labadi Beach Hotel, Accra',
    priceGHS: 150.00,
    category: 'Cultural Awards',
    ticketTiers: [
      { id: 'bd-gold', name: 'Gold Ticket', price: 150.00, description: 'Red Carpet entry & general seating', available: 120 },
      { id: 'bd-plat', name: 'Platinum Table Pass', price: 600.00, description: 'Reserved table of 4 with champagne', available: 15 }
    ]
  },
  {
    id: 'evt-gh-film',
    title: 'Ghana Film & Music Night 2026',
    organizer: 'Ghana Creative Arts Industry',
    posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200',
    endDate: 'Sat, 10 Oct 2026',
    venue: 'National Theatre, Accra',
    priceGHS: 80.00,
    category: 'Awards Ceremony',
    ticketTiers: [
      { id: 'gf-std', name: 'Standard Seat', price: 80.00, description: 'Auditorium seat', available: 300 },
      { id: 'gf-vip', name: 'VIP Executive', price: 200.00, description: 'Front rows & celebrity meet and greet', available: 60 }
    ]
  }
];

export const INITIAL_NOMINATIONS: NominationAward[] = [
  {
    id: 'nom-adges',
    title: 'ADGES Excellence Awards 2026',
    organizer: 'African Development & Growth Ethics Society',
    bannerUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
    deadline: '30 Aug 2026',
    description: 'Nominate outstanding ethical leaders, young CEOs, public servants, and community champions.',
    categories: ['Young CEO of the Year', 'Ethical Leadership Award', 'Community Impact Hero'],
    status: 'OPEN'
  },
  {
    id: 'nom-scholars',
    title: "Scholars' Excellence Awards 2026",
    organizer: 'Ghana Tertiary Academic Guild',
    bannerUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1200',
    deadline: '15 Sep 2026',
    description: 'Celebrating university researchers, student innovators, campus journalists, and peer mentors.',
    categories: ['Academic Scholar of the Year', 'Campus Journalist of the Year', 'Innovation & Tech Pioneer'],
    status: 'OPEN'
  },
  {
    id: 'nom-gbewaa',
    title: 'GBEWAA Excellence Awards 2026',
    organizer: 'Northern Youth Heritage Movement',
    bannerUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200',
    deadline: '20 Sep 2026',
    description: 'Recognizing cultural pioneers, traditional artisans, sports stars, and educational advocates.',
    categories: ['Cultural Preservation Champion', 'Artisan of the Year', 'Youth Mentor of the Year'],
    status: 'OPEN'
  }
];

export const INITIAL_RECENT_VOTES: RecentVoteFeed[] = [
  {
    id: 'rv-1',
    voterName: 'Kwame O.',
    nomineeName: 'Grace Serwaa',
    nomineeCode: 'MGN-01',
    votesCount: 50,
    timeAgo: 'Just now',
    contestTitle: 'Miss Good News 2026'
  },
  {
    id: 'rv-2',
    voterName: 'Ama K.',
    nomineeName: 'Grace Serwaa',
    nomineeCode: 'MGN-01',
    votesCount: 100,
    timeAgo: '2 mins ago',
    contestTitle: 'Miss Good News 2026'
  },
  {
    id: 'rv-3',
    voterName: 'Emmanuel T.',
    nomineeName: 'Adjoa Banda',
    nomineeCode: 'BTW-10',
    votesCount: 20,
    timeAgo: '4 mins ago',
    contestTitle: 'Banda To The World Awards'
  }
];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteName: 'VoteRight GH',
  supportEmail: 'support@voterightgh.com',
  supportPhone: '+233 55 123 4567',
  headquarters: 'Adenta, Accra - Ghana',
  platformFeePercent: 15,
  heroTitle: 'Ghana’s #1 Awards Voting & E-Ticketing Platform',
  heroSubtitle: 'Instant Mobile Money & Card checkout for pageants, music awards, and live event ticketing across West Africa.',
  tickerAnnouncements: [
    '🔥 VoteRight GH - Season 2026 Pageant & Award Voting is officially LIVE!',
    '🎟️ Get your verified QR Code E-Tickets for Accra concerts & galas now.',
    '⚡ Instant MoMo verification supported on MTN, Telecel, and AT Money.'
  ]
};

