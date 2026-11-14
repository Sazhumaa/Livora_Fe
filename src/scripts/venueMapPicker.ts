import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface VenuePreset {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export const VENUE_PRESETS: VenuePreset[] = [
  {
    id: 'gbk',
    label: 'GBK Senayan',
    address: 'Stadion Utama Gelora Bung Karno, Senayan, Jakarta Pusat',
    lat: -6.2186,
    lng: 106.8026,
  },
  {
    id: 'ice',
    label: 'ICE BSD City',
    address: 'Indonesia Convention Exhibition (ICE), BSD City, Tangerang',
    lat: -6.3006,
    lng: 106.6365,
  },
  {
    id: 'jiexpo',
    label: 'JIExpo Kemayoran',
    address: 'Arena JIExpo Kemayoran, Jakarta Pusat',
    lat: -6.1463,
    lng: 106.8453,
  },
  {
    id: 'gwk',
    label: 'GWK Bali',
    address: 'Garuda Wisnu Kencana Cultural Park, Ungasan, Bali',
    lat: -8.8104,
    lng: 115.1675,
  },
];

const CARTO_DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const CARTO_LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const OSM_RASTER_FALLBACK: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
    },
  ],
};

function parseCoordString(raw: string): { lat: number; lng: number } | null {
  const parts = raw.split(',').map((s) => Number(s.trim()));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null;
  }
  const [lat, lng] = parts;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function formatShortAddress(data: any, lat: number, lng: number): string {
  const a = data?.address || {};
  const landmark = a.amenity || a.building || a.stadium || a.leisure || a.tourism || a.road || a.pedestrian;
  const area = a.suburb || a.neighbourhood || a.village || a.city_district || a.town || a.city || a.county;
  const region = a.city || a.state;
  const segments = [landmark, area, region && region !== area ? region : null].filter(Boolean);
  if (segments.length > 0) return segments.join(', ');
  if (typeof data?.display_name === 'string' && data.display_name.trim()) {
    return data.display_name.split(',').slice(0, 3).map((s: string) => s.trim()).join(', ');
  }
  return `Lokasi Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

function createPinElement(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none';
  wrap.innerHTML = `
    <span class="absolute w-9 h-9 rounded-full bg-electric-magenta/30 animate-ping pointer-events-none"></span>
    <span class="relative w-7 h-7 rounded-full bg-electric-magenta border-2 border-white shadow-[0_0_16px_rgba(209,77,145,0.85)] flex items-center justify-center">
      <span class="w-2 h-2 rounded-full bg-white"></span>
    </span>
  `;
  return wrap;
}

export interface VenueMapPickerController {
  syncFromInput: (shouldFly?: boolean) => void;
  resize: () => void;
  destroy: () => void;
}

export function mountVenueMapPicker(): VenueMapPickerController {
  const viewport = document.getElementById('ev-map-viewport') as HTMLElement | null;
  const lokasiInput = document.getElementById('ev-f-lokasi') as HTMLInputElement | null;
  const alamatInput = document.getElementById('ev-f-alamat') as HTMLInputElement | null;
  const coordBadge = document.getElementById('ev-coord-badge');
  const footerCoord = document.getElementById('ev-footer-coord-readout');
  const searchInput = document.getElementById('ev-map-search-input') as HTMLInputElement | null;
  const searchBtn = document.getElementById('ev-map-search-btn') as HTMLButtonElement | null;
  const resultsBox = document.getElementById('ev-map-search-results');
  const gpsBtn = document.getElementById('ev-map-gps-btn') as HTMLButtonElement | null;
  const statusNote = document.getElementById('ev-map-status-note');
  const manualToggleBtn = document.getElementById('ev-toggle-manual-coord') as HTMLButtonElement | null;
  const loadingOverlay = document.getElementById('ev-map-loading-overlay');
  const loadingText = document.getElementById('ev-map-loading-text');
  const presetBtns = document.querySelectorAll<HTMLButtonElement>('[data-ev-venue-preset]');

  let map: MapLibreMap | null = null;
  let marker: Marker | null = null;
  let isDestroyed = false;
  let currentIsDark = document.documentElement.classList.contains('dark');
  let usingFallbackTiles = false;
  let manualUnlocked = false;
  let geocodeAbort: AbortController | null = null;
  let themeObserver: MutationObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const setStatus = (msg: string, isError = false) => {
    if (!statusNote) return;
    if (!msg) {
      statusNote.classList.add('hidden');
      statusNote.textContent = '';
      return;
    }
    statusNote.textContent = msg;
    statusNote.classList.remove('hidden');
    statusNote.classList.toggle('text-red-600', isError);
    statusNote.classList.toggle('dark:text-red-300', isError);
    statusNote.classList.toggle('text-neutral-500', !isError);
    statusNote.classList.toggle('dark:text-muted-gray', !isError);
  };

  const updateCoordinateOutputs = (lat: number, lng: number, updateInput = true) => {
    const latStr = lat.toFixed(4);
    const lngStr = lng.toFixed(4);
    const value = `${latStr},${lngStr}`;
    if (updateInput && lokasiInput) lokasiInput.value = value;
    if (coordBadge) coordBadge.textContent = `LAT ${latStr} · LNG ${lngStr}`;
    if (footerCoord) footerCoord.textContent = value;
  };

  const highlightActivePreset = (activeId: string | null) => {
    presetBtns.forEach((btn) => {
      const match = btn.dataset.evVenuePreset === activeId;
      btn.classList.toggle('border-electric-magenta', match);
      btn.classList.toggle('text-electric-magenta', match);
      btn.classList.toggle('font-bold', match);
      btn.classList.toggle('border-neutral-200', !match);
      btn.classList.toggle('dark:border-white/15', !match);
      btn.classList.toggle('text-neutral-600', !match);
      btn.classList.toggle('dark:text-muted-gray', !match);
    });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!alamatInput) return;
    geocodeAbort?.abort();
    geocodeAbort = new AbortController();
    setStatus('Mengambil nama alamat dari titik peta...');
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=id`;
      const res = await fetch(url, { signal: geocodeAbort.signal });
      if (!res.ok) throw new Error('Reverse geocode failed');
      const data = await res.json();
      alamatInput.value = formatShortAddress(data, lat, lng);
      setStatus('');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (!alamatInput.value.trim()) {
        alamatInput.value = `Lokasi Peta (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
      setStatus('Koordinat diperbarui. Anda dapat menyempurnakan detail nama venue di kolom alamat.');
    }
  };

  const hideLoadingOverlay = () => {
    loadingOverlay?.classList.add('hidden');
  };

  const showLoadingError = (msg: string) => {
    if (loadingText) loadingText.textContent = msg;
    loadingOverlay?.classList.remove('hidden');
    setStatus(msg, true);
  };

  const ensureMapInitialized = () => {
    if (!viewport || map || isDestroyed) return;

    try {
      const initial = parseCoordString(lokasiInput?.value || '') || VENUE_PRESETS[0];
      currentIsDark = document.documentElement.classList.contains('dark');

      map = new MapLibreMap({
        container: viewport,
        style: currentIsDark ? CARTO_DARK_STYLE : CARTO_LIGHT_STYLE,
        center: [initial.lng, initial.lat],
        zoom: 14.5,
        attributionControl: false,
      });

      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

      marker = new Marker({
        element: createPinElement(),
        draggable: true,
        anchor: 'center',
      })
        .setLngLat([initial.lng, initial.lat])
        .addTo(map);

      map.on('load', () => {
        hideLoadingOverlay();
        map?.resize();
      });

      map.on('render', () => {
        hideLoadingOverlay();
      });

      map.on('error', () => {
        if (!usingFallbackTiles && map) {
          usingFallbackTiles = true;
          map.setStyle(OSM_RASTER_FALLBACK);
          return;
        }
        hideLoadingOverlay();
      });

      map.on('click', (ev: MapMouseEvent) => {
        const { lat, lng } = ev.lngLat;
        marker?.setLngLat([lng, lat]);
        highlightActivePreset(null);
        updateCoordinateOutputs(lat, lng);
        reverseGeocode(lat, lng);
      });

      marker.on('dragend', () => {
        const lngLat = marker?.getLngLat();
        if (!lngLat) return;
        highlightActivePreset(null);
        updateCoordinateOutputs(lngLat.lat, lngLat.lng);
        reverseGeocode(lngLat.lat, lngLat.lng);
      });

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          map?.resize();
        });
        resizeObserver.observe(viewport);
      }

      themeObserver = new MutationObserver(() => {
        const nextDark = document.documentElement.classList.contains('dark');
        if (nextDark === currentIsDark || !map || usingFallbackTiles) return;
        currentIsDark = nextDark;
        map.setStyle(currentIsDark ? CARTO_DARK_STYLE : CARTO_LIGHT_STYLE);
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      setTimeout(() => {
        map?.resize();
      }, 180);
    } catch (err: any) {
      showLoadingError(
        `Peta interaktif tidak dapat dimuat (${err?.message || 'WebGL tidak tersedia'}). Gunakan "Edit Manual" atau refresh halaman.`
      );
    }
  };

  const moveMarkerTo = (lat: number, lng: number, shouldFly = true) => {
    updateCoordinateOutputs(lat, lng);
    ensureMapInitialized();
    if (isDestroyed) return;
    marker?.setLngLat([lng, lat]);
    if (map) {
      if (shouldFly) {
        map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14.5), essential: true });
      } else {
        map.jumpTo({ center: [lng, lat], zoom: 14.5 });
      }
      requestAnimationFrame(() => map?.resize());
    }
  };

  const hideSearchResults = () => {
    if (!resultsBox) return;
    resultsBox.classList.add('hidden');
    resultsBox.innerHTML = '';
  };

  const runSearch = async () => {
    const query = searchInput?.value.trim() || '';
    if (query.length < 2) {
      setStatus('Masukkan minimal 2 karakter nama venue, jalan, atau kota.', true);
      return;
    }

    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.textContent = 'Mencari...';
    }
    setStatus('Mencari lokasi di peta OpenStreetMap...');

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=id&accept-language=id&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Search error');
      const items: any[] = await res.json();

      if (!resultsBox) return;
      if (!Array.isArray(items) || items.length === 0) {
        hideSearchResults();
        setStatus('Lokasi tidak ditemukan. Coba kata kunci kota atau klik langsung di peta.', true);
        return;
      }

      resultsBox.innerHTML = items
        .map((item, idx) => {
          const title = escapeHtmlInline(String(item.name || item.display_name?.split(',')[0] || 'Lokasi'));
          const desc = escapeHtmlInline(String(item.display_name || ''));
          return `
            <button
              type="button"
              data-map-pick-idx="${idx}"
              class="w-full text-left px-3.5 py-2.5 hover:bg-electric-magenta/10 transition-colors border-b last:border-b-0 border-neutral-200 dark:border-white/10"
            >
              <span class="block text-xs font-bold text-neutral-950 dark:text-soft-white">${title}</span>
              <span class="block text-[11px] font-mono text-neutral-500 dark:text-muted-gray truncate">${desc}</span>
            </button>
          `;
        })
        .join('');
      resultsBox.classList.remove('hidden');
      setStatus('');

      resultsBox.querySelectorAll<HTMLButtonElement>('[data-map-pick-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const picked = items[Number(btn.dataset.mapPickIdx)];
          if (!picked) return;
          const lat = Number(picked.lat);
          const lng = Number(picked.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          highlightActivePreset(null);
          if (alamatInput) {
            alamatInput.value = String(picked.display_name || picked.name || '').split(',').slice(0, 3).map((s: string) => s.trim()).join(', ');
          }
          moveMarkerTo(lat, lng, true);
          hideSearchResults();
        });
      });
    } catch {
      setStatus('Layanan pencarian peta sedang sibuk. Anda tetap dapat mengklik titik di peta secara langsung.', true);
    } finally {
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Cari Peta';
      }
    }
  };

  const onSearchClick = () => void runSearch();
  const onSearchKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void runSearch();
    }
  };

  const onPresetClick = (e: Event) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const preset = VENUE_PRESETS.find((p) => p.id === btn.dataset.evVenuePreset);
    if (!preset) return;
    hideSearchResults();
    setStatus('');
    highlightActivePreset(preset.id);
    if (alamatInput) alamatInput.value = preset.address;
    moveMarkerTo(preset.lat, preset.lng, true);
  };

  const onGpsClick = () => {
    if (!navigator.geolocation) {
      setStatus('Browser tidak mendukung geolokasi perangkat.', true);
      return;
    }
    if (gpsBtn) gpsBtn.disabled = true;
    setStatus('Mengambil koordinat GPS perangkat...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (gpsBtn) gpsBtn.disabled = false;
        highlightActivePreset(null);
        hideSearchResults();
        moveMarkerTo(pos.coords.latitude, pos.coords.longitude, true);
        void reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        if (gpsBtn) gpsBtn.disabled = false;
        setStatus('Izin lokasi ditolak atau GPS tidak tersedia. Silakan klik titik venue di peta.', true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onToggleManual = () => {
    manualUnlocked = !manualUnlocked;
    if (lokasiInput) {
      lokasiInput.readOnly = !manualUnlocked;
      lokasiInput.classList.toggle('bg-white', manualUnlocked);
      lokasiInput.classList.toggle('dark:bg-void-black', manualUnlocked);
      if (manualUnlocked) lokasiInput.focus();
    }
    if (manualToggleBtn) {
      manualToggleBtn.textContent = manualUnlocked ? 'Kunci Input' : 'Edit Manual';
    }
  };

  const onManualInput = () => {
    if (!lokasiInput) return;
    const parsed = parseCoordString(lokasiInput.value);
    if (!parsed) return;
    highlightActivePreset(null);
    updateCoordinateOutputs(parsed.lat, parsed.lng, false);
    ensureMapInitialized();
    if (isDestroyed) return;
    marker?.setLngLat([parsed.lng, parsed.lat]);
    map?.easeTo({ center: [parsed.lng, parsed.lat], duration: 300 });
  };

  searchBtn?.addEventListener('click', onSearchClick);
  searchInput?.addEventListener('keydown', onSearchKeydown);
  presetBtns.forEach((btn) => btn.addEventListener('click', onPresetClick));
  gpsBtn?.addEventListener('click', onGpsClick);
  manualToggleBtn?.addEventListener('click', onToggleManual);
  lokasiInput?.addEventListener('change', onManualInput);

  return {
    syncFromInput(shouldFly = false) {
      hideSearchResults();
      setStatus('');
      const parsed = parseCoordString(lokasiInput?.value || '') || VENUE_PRESETS[0];
      const matchedPreset = VENUE_PRESETS.find(
        (p) => Math.abs(p.lat - parsed.lat) < 0.001 && Math.abs(p.lng - parsed.lng) < 0.001
      );
      highlightActivePreset(matchedPreset?.id || null);
      moveMarkerTo(parsed.lat, parsed.lng, shouldFly);
    },
    resize() {
      requestAnimationFrame(() => map?.resize());
    },
    destroy() {
      isDestroyed = true;
      geocodeAbort?.abort();
      resizeObserver?.disconnect();
      resizeObserver = null;
      themeObserver?.disconnect();
      themeObserver = null;
      searchBtn?.removeEventListener('click', onSearchClick);
      searchInput?.removeEventListener('keydown', onSearchKeydown);
      presetBtns.forEach((btn) => btn.removeEventListener('click', onPresetClick));
      gpsBtn?.removeEventListener('click', onGpsClick);
      manualToggleBtn?.removeEventListener('click', onToggleManual);
      lokasiInput?.removeEventListener('change', onManualInput);
      marker?.remove();
      marker = null;
      map?.remove();
      map = null;
    },
  };
}

function escapeHtmlInline(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
