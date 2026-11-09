export interface EventItem {
  id: string;
  slug: string;
  title: string;
  artist: string;
  venue: string;
  city: string;
  date: string;
  startingPrice: number;
  status: 'AVAILABLE' | 'ALMOST_SOLD_OUT' | 'SOLD_OUT';
  posterUrl: string;
  category: string;
  badge?: string;
}

export const MOCK_EVENTS: EventItem[] = [
  {
    id: 'evt-01',
    slug: 'afterglow-music-festival-2026',
    title: 'AFTERGLOW FESTIVAL 2026: VOID INCEPTION',
    artist: 'Porter Robinson, M83, Wave to Earth, RADWIMPS',
    venue: 'Gelora Bung Karno Stadium',
    city: 'Jakarta',
    date: '14 - 15 NOV 2026',
    startingPrice: 1250000,
    status: 'ALMOST_SOLD_OUT',
    posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    category: 'Music Festival',
    badge: 'HEADLINER',
  },
  {
    id: 'evt-02',
    slug: 'supernova-world-tour-jakarta',
    title: 'SUPERNOVA: THE COSMIC ODYSSEY',
    artist: 'aespa & Special Guest',
    venue: 'Indonesia Arena',
    city: 'Jakarta',
    date: '28 NOV 2026',
    startingPrice: 1650000,
    status: 'AVAILABLE',
    posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    category: 'Pop & K-Pop',
    badge: 'HOT TOUR',
  },
  {
    id: 'evt-03',
    slug: 'midnight-echoes-live-bandung',
    title: 'MIDNIGHT ECHOES: SYNTHWAVE ORCHESTRA',
    artist: 'The Midnight, Gunship',
    venue: 'Eldorado Dome',
    city: 'Bandung',
    date: '05 DEC 2026',
    startingPrice: 650000,
    status: 'AVAILABLE',
    posterUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    category: 'Electronic / EDM',
  },
  {
    id: 'evt-04',
    slug: 'neon-rebels-stadium-tour',
    title: 'REBELLION NIGHTS: LIVE & UNPLUGGED',
    artist: 'Bring Me The Horizon & ONE OK ROCK',
    venue: 'Stadion Madya GBK',
    city: 'Jakarta',
    date: '12 DEC 2026',
    startingPrice: 1850000,
    status: 'SOLD_OUT',
    posterUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    category: 'Rock & Alternative',
    badge: 'SOLD OUT',
  },
  {
    id: 'evt-05',
    slug: 'solitude-frequencies-bali',
    title: 'SUNSET SERENADE BY THE CLIFF',
    artist: 'Cigarettes After Sex',
    venue: 'Savaya Bali',
    city: 'Bali',
    date: '19 DEC 2026',
    startingPrice: 950000,
    status: 'AVAILABLE',
    posterUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    category: 'Indie & Local Scene',
  },
  {
    id: 'evt-06',
    slug: 'velvet-grooves-international-jazz',
    title: 'VELVET VOICES: JAZZ & SOUL NIGHT',
    artist: 'Snarky Puppy, Laufey',
    venue: 'JIExpo Theater',
    city: 'Jakarta',
    date: '27 DEC 2026',
    startingPrice: 1100000,
    status: 'ALMOST_SOLD_OUT',
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    category: 'Jazz & Soul',
  },
];
