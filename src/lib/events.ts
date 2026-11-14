/**
 * AFTERGLOW Concert Events Data Layer
 * Encapsulates backend queries with mock fallbacks.
 */

import { api, resolveAssetUrl } from './api';
import { MOCK_EVENTS } from '../data/mockEvents';

export interface BackendEvent {
  id: number;
  nama_event: string;
  deskripsi: string;
  artis: string;
  alamat: string;
  lat: number | null;
  lng: number | null;
  poster_url?: string;
  kapasitas_venue?: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
  rejection_reason?: string;
  organizer_id: number;
  lineup?: Array<{
    name: string;
    role?: string;
    time?: string;
    photo_url?: string;
  }>;
  rundown?: Array<{
    time: string;
    title: string;
    description?: string;
  }>;
  facilities?: string[];
  rules?: string[];
  organization_name?: string;
  min_price: number;
  total_quota: number;
  available_quota: number;
  sold_quota?: number;
  occupancy_percent?: number;
  is_sold_out: boolean;
  is_bookmarked?: boolean;
  categories?: BackendTicketCategory[];
}

export interface BackendTicketCategory {
  id: number;
  event_id: number;
  nama_kategori: string;
  harga: number;
  kuota_total: number;
  kuota_tersedia: number;
  kuota_terjual: number;
  kuota_hold?: number;
  kuota_komplimen?: number;
  max_per_transaksi?: number;
  max_per_order?: number;
  deskripsi?: string;
}

export interface EventQueryOptions {
  q?: string;
  city?: string;
  sort?: 'terdekat' | 'terbaru' | 'termurah';
  status?: string;
  scope?: string;
  limit?: number;
  offset?: number;
  strict?: boolean;
}

export interface VoucherValidationResult {
  voucher_id: number;
  kode_voucher: string;
  diskon_amount: number;
  final_amount: number;
}

export const CATEGORY_SEARCH_MAP: Record<string, string> = {
  'music-festival': 'Festival',
  'pop-kpop': 'Pop',
  'rock-alternative': 'Rock',
  'electronic-edm': 'Electronic',
  'jazz-soul': 'Jazz',
  'indie-local': 'Indie',
};

/**
 * Exact backend platform fee formula (orderRepositories.ts:308 -> 5%)
 */
export function calculatePlatformFee(subtotalAfterDiscount: number): number {
  return Math.round(Math.max(0, subtotalAfterDiscount) * 0.05);
}

export function getCategoryMaxLimit(cat?: BackendTicketCategory | null): number {
  if (!cat) return 4;
  return Number(cat.max_per_transaksi ?? cat.max_per_order ?? 4);
}

function normalizeEvent(ev: BackendEvent): BackendEvent {
  return {
    ...ev,
    poster_url: resolveAssetUrl(ev.poster_url),
    min_price: Number(ev.min_price || 0),
    total_quota: Number(ev.total_quota || 0),
    available_quota: Number(ev.available_quota || 0),
    occupancy_percent: Number(ev.occupancy_percent || 0),
    categories: ev.categories?.map((c) => ({
      ...c,
      harga: Number(c.harga || 0),
      kuota_total: Number(c.kuota_total || 0),
      kuota_tersedia: Number(c.kuota_tersedia || 0),
      kuota_terjual: Number(c.kuota_terjual || 0),
      max_per_transaksi: Number(c.max_per_transaksi ?? c.max_per_order ?? 4),
    })),
  };
}

/**
 * Fetch concerts with search, city, sort, scope & role awareness
 */
export async function fetchEvents(options: EventQueryOptions = {}): Promise<BackendEvent[]> {
  const params = new URLSearchParams();
  if (options.q) params.set('q', options.q);
  if (options.city) params.set('city', options.city);
  if (options.sort) params.set('sort', options.sort);
  if (options.status) params.set('status', options.status);
  if (options.scope) params.set('scope', options.scope);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));

  const queryStr = params.toString() ? `?${params.toString()}` : '';

  try {
    const events = await api.get<BackendEvent[]>(`/events${queryStr}`);
    if (Array.isArray(events)) {
      if (events.length > 0 || options.strict || options.q || options.city || options.status) {
        return events.map(normalizeEvent);
      }
      return mapMockEventsToBackend();
    }
    return options.strict ? [] : mapMockEventsToBackend();
  } catch (err) {
    if (options.strict) throw err;
    console.warn('[Events API Fallback to Mock Data]:', err);
    return mapMockEventsToBackend();
  }
}

/**
 * Fetch single concert by ID
 */
export async function fetchEventById(id: number | string, strict = false): Promise<BackendEvent | null> {
  try {
    const event = await api.get<BackendEvent>(`/events/${id}`);
    return event ? normalizeEvent(event) : null;
  } catch (err) {
    if (strict) throw err;
    console.warn(`[Event ID ${id} API Fallback]:`, err);
    const mock = mapMockEventsToBackend().find((e) => String(e.id) === String(id));
    return mock || null;
  }
}

/**
 * Toggle bookmark / wishlist on concert
 */
export async function toggleBookmark(eventId: number): Promise<{ bookmarked: boolean; is_bookmarked: boolean }> {
  const res = await api.post<{ bookmarked?: boolean; is_bookmarked?: boolean }>(`/events/${eventId}/bookmark`);
  const active = Boolean(res.bookmarked ?? res.is_bookmarked);
  return { bookmarked: active, is_bookmarked: active };
}

/**
 * Preview & validate promo voucher code against event subtotal
 */
export async function validateVoucher(
  kodeVoucher: string,
  eventId: number,
  subtotal: number
): Promise<VoucherValidationResult> {
  return await api.post<VoucherValidationResult>('/vouchers/validate', {
    kode_voucher: kodeVoucher.trim().toUpperCase(),
    event_id: eventId,
    subtotal,
  });
}

/**
 * Helper to map existing mock events to uniform BackendEvent format
 */
function mapMockEventsToBackend(): BackendEvent[] {
  return MOCK_EVENTS.map((m, idx) => ({
    id: idx + 1,
    nama_event: m.title,
    deskripsi: 'Rasakan dentuman panggung dan euforia konser musik live spektakuler.',
    artis: m.artist,
    alamat: `${m.venue}, ${m.city}`,
    lat: -6.2186,
    lng: 106.8026,
    poster_url: m.posterUrl,
    kapasitas_venue: 5000,
    tanggal_mulai: new Date(Date.now() + (idx + 2) * 86400000).toISOString(),
    tanggal_selesai: new Date(Date.now() + (idx + 2) * 86400000 + 14400000).toISOString(),
    status: 'published',
    organizer_id: 1,
    organization_name: 'AFTERGLOW Promotions',
    min_price: m.startingPrice,
    total_quota: 5000,
    available_quota: m.status === 'SOLD_OUT' ? 0 : m.status === 'ALMOST_SOLD_OUT' ? 25 : 1200,
    occupancy_percent: m.status === 'SOLD_OUT' ? 100 : m.status === 'ALMOST_SOLD_OUT' ? 95 : 65,
    is_sold_out: m.status === 'SOLD_OUT',
    is_bookmarked: false,
    categories: [
      {
        id: (idx + 1) * 10 + 1,
        event_id: idx + 1,
        nama_kategori: 'VIP PANGGUNG',
        harga: m.startingPrice * 1.5,
        kuota_total: 500,
        kuota_tersedia: m.status === 'SOLD_OUT' ? 0 : 50,
        kuota_terjual: 450,
        max_per_order: 4,
        deskripsi: 'Akses terdekat panggung utama, free official lanyard, dan jalur masuk VIP khusus.',
      },
      {
        id: (idx + 1) * 10 + 2,
        event_id: idx + 1,
        nama_kategori: 'FESTIVAL REGULER',
        harga: m.startingPrice,
        kuota_total: 2000,
        kuota_tersedia: m.status === 'SOLD_OUT' ? 0 : 350,
        kuota_terjual: 1650,
        max_per_order: 6,
        deskripsi: 'Lantai dansa konser utama, akses stan kuliner & official merchandise booth.',
      },
      {
        id: (idx + 1) * 10 + 3,
        event_id: idx + 1,
        nama_kategori: 'TRIBUN DUDUK (CAT 1)',
        harga: m.startingPrice * 0.8,
        kuota_total: 1000,
        kuota_tersedia: m.status === 'SOLD_OUT' ? 0 : 200,
        kuota_terjual: 800,
        max_per_order: 6,
        deskripsi: 'Tempat duduk bernomor di tribun atas dengan pandangan panggung menyeluruh.',
      },
    ],
    lineup: [
      { name: m.artist.split(',')[0] || m.artist, role: 'Headliner', time: '21:00 WIB' },
      { name: 'Special Guest Performer', role: 'Supporting Act', time: '19:30 WIB' },
      { name: 'Opening Stage Band', role: 'Opening', time: '18:00 WIB' },
    ],
    rundown: [
      { time: '16:00 WIB', title: 'Open Gate & Wristband Exchange', description: 'Pintu gerbang dibuka, penukaran gelang digital.' },
      { time: '18:00 WIB', title: 'Opening Act Performance', description: 'Penampilan pembuka menghangatkan arena.' },
      { time: '20:30 WIB', title: 'Main Headline Concert Show', description: 'Dentuman panggung utama dimulai.' },
    ],
    facilities: ['Musholla Luas', 'Tim Medis 24 Jam', 'Area Parkir Mobil & Motor', 'Food & Beverage Zone', 'Jalur Khusus Kursi Roda'],
    rules: [
      'Dilarang membawa senjata tajam, kembang api, atau zat terlarang.',
      'Dilarang membawa kamera profesional (DSLR/Mirrorless) tanpa ID pers resmi.',
      'Wajib membawa identitas diri asli (KTP/SIM/Paspor) yang cocok dengan nama akun.',
      'Tiket yang sudah dibeli sah dan tidak dapat ditukar atau diuangkan kembali kecuali konser dibatalkan.',
    ],
  }));
}
