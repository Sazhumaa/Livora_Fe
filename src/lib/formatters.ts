/**
 * AFTERGLOW Formatting & URL Utilities
 * Zero external dependencies.
 */

export function escapeHtml(input: unknown): string {
  const str = String(input ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format number to Indonesian Rupiah currency format
 * e.g. 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number | string): string {
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  if (isNaN(numeric)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Format ISO Date string to authentic Indonesian concert date
 * e.g. "2026-11-14T19:00:00Z" -> "Sabtu, 14 Nov 2026 • 19:00 WIB"
 */
export function formatDateIndo(dateStr: string | Date, options?: { showTime?: boolean }): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '-';

  const showTime = options?.showTime ?? true;

  const dateFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);

  if (!showTime) return dateFormatted;

  const timeFormatted = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(date);

  return `${dateFormatted} • ${timeFormatted} WIB`;
}

/**
 * Calculate countdown time remaining in minutes and seconds
 * e.g. 845 seconds -> { minutes: 14, seconds: 5, formatted: "14:05" }
 */
export function formatCountdown(remainingSeconds: number): {
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const safeSec = Math.max(0, Math.floor(remainingSeconds));
  const minutes = Math.floor(safeSec / 60);
  const seconds = safeSec % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return { minutes, seconds, formatted };
}

/**
 * Google Maps direct navigation link (zero API cost)
 */
export function getGoogleMapsUrl(alamat: string, lat?: number | null, lng?: number | null): string {
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alamat)}`;
}

/**
 * Google Calendar reminder generator (zero API cost)
 */
export function getGoogleCalendarUrl(
  event: {
    nama_event: string;
    tanggal_mulai: string | Date;
    tanggal_selesai?: string | Date;
    alamat: string;
    organization_name?: string;
  },
  ticket?: {
    nama_kategori?: string;
    kode_tiket?: string;
  }
): string {
  const startDate = new Date(event.tanggal_mulai);
  const endDate = event.tanggal_selesai
    ? new Date(event.tanggal_selesai)
    : new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // fallback +4h

  const startIso = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const title = encodeURIComponent(`[KONSER] ${event.nama_event}`);
  const loc = encodeURIComponent(event.alamat);
  const details = encodeURIComponent(
    `E-Tiket Konser Resmi AFTERGLOW: ${event.nama_event}\n` +
    `Penyelenggara: ${event.organization_name || 'Promotor Resmi'}\n` +
    (ticket?.nama_kategori ? `Kategori: ${ticket.nama_kategori}\n` : '') +
    (ticket?.kode_tiket ? `Kode Tiket: ${ticket.kode_tiket}\n` : '') +
    `\nHarap hadir 2 jam sebelum gate dibuka untuk penukaran gelang dan verifikasi barcode.`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${loc}`;
}
