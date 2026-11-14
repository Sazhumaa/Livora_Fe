# AFTERGLOW Frontend (`Astro 5` + `@astrojs/node`)

Frontend platform tiket konser **AFTERGLOW** (*Void Black `#0B090B` × Electric Magenta `#D14D91`*, *Bebas Neue × Inter*).

## Tech Stack
- **Framework**: Astro 5 (`output: 'static'` dengan SSR dinamis melalui `@astrojs/node` standalone adapter pada halaman dinamis/terproteksi)
- **Styling**: Tailwind CSS
- **Peta Lokasi Venue**: `maplibre-gl` (tile Carto Dark/Positron + fallback raster OpenStreetMap tanpa API key)
- **QR Engine**:
  - Generator Boarding Pass: `qrcode-generator`
  - Validator Scanner Gerbang: Native `BarcodeDetector` + fallback canvas `jsqr` untuk Safari & Firefox
- **Audio HUD**: Web Audio API ambient concert pad synthesizer (zero-dependency)

## Environment Variables
| Variabel | Default | Kegunaan |
| :--- | :--- | :--- |
| `PUBLIC_API_BASE_URL` | `http://localhost:3000` | Base URL backend API untuk browser client & resolusi aset `/uploads/*` |
| `INTERNAL_API_URL` | `PUBLIC_API_BASE_URL` | Optional SSR server-to-server origin (mis. `http://backend:3000` di Docker/compose) |

## Struktur Rute Utama
- `/` — Landing page live stats (`GET /events/stats`), Hero interactive concert pass cards, & featured concerts
- `/events` — Katalog konser dengan pencarian, filter kota (`?kota=`/`?city=`), genre (`?genre=`), & sorting
- `/events/[id]` — Detail konser, pin peta MapLibre read-only, promo voucher, & checkout **Multi-Tier Quantity Stepper**
- `/organizers/[id]` — Profil publik promotor resmi & daftar konser aktifnya
- `/orders/[order_code]` — Pembayaran order 15 menit (single-flight refresh token & `resend` e-tiket)
- `/orders/[order_code]/receipt` — Kuitansi resmi printable (`print:hidden` HUD/Navbar/Footer)
- `/tickets` — Dompet e-tiket & QR Boarding Pass (`active` / `used` / `cancelled`)
- `/account` — Hub Akun: profil (`minlength 3..50`), riwayat order, wishlist, & refund
- `/organizer` — Studio Promotor: kurasi draft, toggle jeda penjualan (`PATCH /organizer/events/:id/pause`), ekspor CSV transaksi & kehadiran, edit profil organisasi, pengajuan payout escrow
- `/admin` — Admin Console: KPI platform, verifikasi promotor, kurasi konser, antrean payout & refund, directory users/orders/audit terpaginasi, & manual cron trigger
- `/scanner` — Aplikasi Gate Scanner kru pintu masuk (`BarcodeDetector` + `jsqr` fallback + upload foto QR + manual code)
- `/faq`, `/terms`, `/privacy`, `/404` — Halaman panduan gate, ketentuan layanan, privasi, & fallback 404

## Menjalankan Secara Lokal
```bash
npm install
npm run dev
```

Build produksi & verifikasi tipe:
```bash
bunx tsc --noEmit
npm run build
```
