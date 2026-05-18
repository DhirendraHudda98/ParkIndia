import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MapPin, Lightning, Wheelchair, ArrowsClockwise } from '@phosphor-icons/react';
import { staggerSlow, fadeUp } from '../constants/animations';
import { CityFilter } from '../components/CityFilter';
import { LocationSearch } from '../components/LocationSearch';
import { useTheme } from '../context/ThemeContext';
import 'leaflet/dist/leaflet.css';

const MAPPLS_SDK_URL = 'https://apis.mappls.com/advancedmaps/v1';
const API_BASE = import.meta.env.VITE_API_URL ?? '';
const MAPPLS_KEY = import.meta.env.VITE_MAPPLS_API_KEY ?? '';
const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

const MARKER_HEX = {
  green: '#16a34a',
  yellow: '#d97706',
  red:   '#dc2626',
  gray:  '#6b7280',
};

function formatINR(amount) {
  if (amount === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function loadMapplsSDK() {
  return new Promise((resolve, reject) => {
    if (window.mappls) { resolve(); return; }
    const script = document.createElement('script');
    script.src = `${MAPPLS_SDK_URL}/${MAPPLS_KEY}/map_load?v=1.5&plugins=all`;
    script.async = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (window.mappls) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('Mappls SDK timeout')); }, 10_000);
    };
    script.onerror = () => reject(new Error('Failed to load Mappls SDK script'));
    document.head.appendChild(script);
  });
}

function LeafletMapFallback({
  lots,
  selectedLotId,
  onSelectLot,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      import('leaflet').then(L => {
        const map = L.map(mapContainerRef.current, {
          center: [19.0760, 72.8777],
          zoom: 12,
          zoomControl: true,
        });

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 14);
            L.marker([latitude, longitude]).addTo(map).bindPopup("<div style='font-weight:600'>📍 You are here</div>");
          }, () => {}, { timeout: 10000 });
        }
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = { map, L };
      });
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || lots.length === 0) return;
    const { map, L } = mapRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    lots.forEach(lot => {
      const hex = MARKER_HEX[lot.color] ?? MARKER_HEX.gray;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36'><path d='M14 0C7.4 0 2 5.4 2 12c0 9 12 24 12 24S26 21 26 12C26 5.4 20.6 0 14 0z' fill='${encodeURIComponent(hex)}'/><circle cx='14' cy='12' r='5' fill='white'/></svg>`;
      const icon = L.icon({
        iconUrl: `data:image/svg+xml;utf8,${svg}`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      });
      const pct = lot.total_slots > 0 ? Math.round((lot.available_spots / lot.total_slots) * 100) : 0;
      const marker = L.marker([lot.latitude, lot.longitude], { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:Inter,sans-serif;min-width:200px"><strong>${lot.name}</strong><br/><small style="color:#64748b">${lot.address}</small><br/><br/>🅿️ ${lot.available_spots}/${lot.total_slots} free (${pct}%)<br/><a href="/book" style="display:block;margin-top:8px;background:#16a34a;color:#fff;padding:6px;border-radius:6px;text-align:center;text-decoration:none;font-weight:600;font-size:12px">Book Now →</a></div>`)
        .on('click', () => onSelectLot(lot.id));
      markersRef.current.set(lot.id, marker);
    });
  }, [lots, onSelectLot]);

  return (
    <div ref={mapContainerRef} style={{ height: '500px', width: '100%' }} className="bg-surface-100 dark:bg-surface-900 animate-fade-in" />
  );
}

export function MapViewPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const [useLeaflet, setUseLeaflet] = useState(!MAPPLS_KEY);

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [filterCityName, setFilterCityName] = useState(null);

  const isIndia = designTheme === 'india';

  const fetchAvailability = useCallback(async () => {
    try {
      const url = filterCityName
        ? `${API_BASE}/api/availability?city=${filterCityName}`
        : `${API_BASE}/api/availability`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLots(json.data);
        setLastRefreshed(new Date());
      }
    } catch {
      // Silently fail on refresh
    } finally {
      setLoading(false);
    }
  }, [filterCityName]);

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(fetchAvailability, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAvailability]);

  useEffect(() => {
    if (useLeaflet) {
      setLoading(false);
      return;
    }
    loadMapplsSDK()
      .then(() => setSdkReady(true))
      .catch(err => {
        console.warn('Mappls SDK failed to load, falling back to Leaflet map:', err.message);
        setUseLeaflet(true);
      });
  }, [useLeaflet]);

  useEffect(() => {
    if (!sdkReady || !mapContainerRef.current || mapRef.current) return;
    mapRef.current = new window.mappls.Map(mapContainerRef.current, {
      center: [19.0760, 72.8777],
      zoom: 12,
      zoomControl: true,
    });
  }, [sdkReady]);

  useEffect(() => {
    if (!mapRef.current || !sdkReady || lots.length === 0) return;

    const currentIds = new Set(lots.map(l => l.id));

    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    lots.forEach(lot => {
      const hex = MARKER_HEX[lot.color] ?? MARKER_HEX.gray;
      const pct = lot.total_slots > 0
        ? Math.round((lot.available_spots / lot.total_slots) * 100)
        : 0;

      const popupHtml = `
        <div style="font-family:Inter,sans-serif;min-width:220px;padding:4px">
          <h3 style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1e293b">${lot.name}</h3>
          <p style="margin:0 0 8px;font-size:12px;color:#64748b">${lot.address}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:13px;font-weight:600;color:#0f172a">
              🅿️ ${lot.available_spots}/${lot.total_slots} free (${pct}%)
            </span>
            <span style="background:${hex};color:#fff;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">
              ${lot.status.toUpperCase()}
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px;font-size:12px">
            <div style="background:#f1f5f9;border-radius:6px;padding:4px 8px">
              <div style="color:#64748b">Per Hour</div>
              <div style="font-weight:700;color:#0f172a">${formatINR(lot.hourly_rate_inr)}</div>
            </div>
            <div style="background:#f1f5f9;border-radius:6px;padding:4px 8px">
              <div style="color:#64748b">Max/Day</div>
              <div style="font-weight:700;color:#0f172a">${formatINR(lot.daily_max_inr)}</div>
            </div>
          </div>
          <a href="/book" style="display:block;text-align:center;background:#16a34a;color:#fff;padding:8px;border-radius:8px;font-weight:600;font-size:13px;text-decoration:none">
            Book Now →
          </a>
        </div>`;

      if (markersRef.current.has(lot.id)) {
        markersRef.current.get(lot.id).remove();
      }

      const markerIcon = {
        url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40'><path d='M16 0C9.4 0 4 5.4 4 12c0 9 12 28 12 28S28 21 28 12C28 5.4 22.6 0 16 0z' fill='${encodeURIComponent(hex)}'/><circle cx='16' cy='12' r='6' fill='white'/></svg>`,
        size: [32, 40],
        anchor: [16, 40],
      };

      const marker = new window.mappls.Marker({
        map: mapRef.current,
        position: { lat: lot.latitude, lng: lot.longitude },
        icon: markerIcon,
        popupHtml,
        popupOptions: { maxWidth: 280 },
      });

      marker.addListener('click', () => setSelectedLotId(lot.id));
      markersRef.current.set(lot.id, marker);
    });
  }, [lots, sdkReady]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng });
        mapRef.current.setZoom(14);
        new window.mappls.Marker({
          map: mapRef.current,
          position: { lat, lng },
          popupHtml: '<div style="font-weight:600;color:#1e293b">📍 You are here</div>',
        });
      }
    });
  }, []);

  useEffect(() => {
    if (sdkReady) {
      setTimeout(locateMe, 500);
    }
  }, [sdkReady, locateMe]);

  const selectedLot = lots.find(l => l.id === selectedLotId) ?? null;
  const freeSpots   = lots.reduce((s, l) => s + l.available_spots, 0);
  const totalSpots  = lots.reduce((s, l) => s + l.total_slots, 0);
  const occupancyPct = totalSpots > 0 ? Math.round(((totalSpots - freeSpots) / totalSpots) * 100) : 0;

  if (loading && lots.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton rounded-xl" />
        <div className="h-[520px] skeleton rounded-2xl" />
      </div>
    );
  }

  if (sdkError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
        <p className="text-lg font-semibold text-red-700 dark:text-red-300">⚠️ Map SDK Error</p>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{sdkError}</p>
        <p className="mt-4 text-xs text-red-500">Check your API Key configuration.</p>
      </div>
    );
  }

  return (
    <motion.div variants={staggerSlow} initial="hidden" animate="show" className="space-y-6">
      <motion.div
        variants={fadeUp}
        className={`overflow-hidden rounded-[28px] border px-6 py-6 shadow-[0_22px_64px_-42px_rgba(15,23,42,0.35)] ${
          isIndia 
          ? 'border-[#FF9933]/20 bg-[radial-gradient(circle_at_top_left,rgba(255,153,51,0.15),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,240,0.95))] dark:border-[#FF9933]/30 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,153,51,0.12),transparent_38%),linear-gradient(135deg,rgba(10,10,26,0.98),rgba(0,0,51,0.94))]'
          : 'border-emerald-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.15),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.95))] dark:border-emerald-900/60 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_38%),linear-gradient(135deg,rgba(22,26,34,0.98),rgba(31,41,55,0.94))]'
        }`}
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
              isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            }`}>
              <MapPin weight="fill" className="h-3.5 w-3.5" />
              🇮🇳 ParkIndia — Live Map
            </div>
            <h1 className={`flex items-center gap-3 text-3xl font-black tracking-[-0.04em] ${isIndia ? 'text-[#000080] dark:text-white' : 'text-surface-900 dark:text-white'}`}>
              <MapPin weight="fill" className={`h-7 w-7 ${isIndia ? 'text-[#FF9933]' : 'text-emerald-500'}`} />
              Find Parking Near You
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-surface-600 dark:text-surface-300">
              Real-time parking availability across India. Green = plenty of space, Yellow = filling up, Red = almost full.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard label="Parking Lots" value={String(lots.length)} sub="Live feed" isIndia={isIndia} accent />
              <StatCard label="Free Spots" value={String(freeSpots)} sub={`${occupancyPct}% occupied`} isIndia={isIndia} />
              <StatCard label="Cities" value="5+" sub="Delhi · Mumbai · Jalandhar" isIndia={isIndia} />
            </div>
            <div className="mt-5">
              <CityFilter 
                onCitySelect={(city) => {
                  setFilterCityName(city?.name ?? null);
                  setSelectedLotId(null);
                  if (city && mapRef.current) {
                    mapRef.current.setCenter({ lat: city.latitude, lng: city.longitude });
                    mapRef.current.setZoom(12);
                  }
                }} 
              />
            </div>
            <div className="mt-4">
              <LocationSearch 
                onLocationSelect={(lat, lng) => {
                  if (mapRef.current) {
                    mapRef.current.setCenter({ lat, lng });
                    mapRef.current.setZoom(16);
                  }
                }}
              />
            </div>
          </div>
          <div className={`rounded-[24px] border p-5 ${isIndia ? 'border-[#FF9933]/20 bg-white/80 dark:bg-white/[0.04]' : 'border-emerald-100 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-surface-500 dark:text-white/45">Legend</p>
            <div className="mt-3 space-y-2">
              <LegendChip color={MARKER_HEX.green} label="> 50% spots free" />
              <LegendChip color={MARKER_HEX.yellow} label="10–50% spots free" />
              <LegendChip color={MARKER_HEX.red} label="< 10% spots free" />
              <LegendChip color={MARKER_HEX.gray} label="Closed" />
            </div>
            {lastRefreshed && (
              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-surface-400">
                <ArrowsClockwise className="h-3.5 w-3.5" />
                Updated {lastRefreshed.toLocaleTimeString('en-IN')}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-[24px] border border-surface-200 bg-white shadow-[0_18px_50px_-38px_rgba(15,23,42,0.18)] dark:border-surface-800 dark:bg-surface-950/80"
        >
          <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-800">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400">Mappls Live View</p>
              <h2 className="mt-1 text-lg font-semibold text-surface-900 dark:text-white">
                {selectedLot?.name ?? 'Live Parking Map'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={locateMe}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  isIndia 
                  ? 'border-[#FF9933]/30 bg-white hover:text-[#FF9933] dark:bg-surface-800 dark:text-surface-300'
                  : 'border-surface-200 bg-white hover:border-emerald-300 hover:text-emerald-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300'
                }`}
              >
                📍 Locate Me
              </button>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              }`}>
                <span className={`h-2 w-2 animate-pulse rounded-full ${isIndia ? 'bg-[#FF9933]' : 'bg-emerald-500'}`} />
                LIVE
              </div>
            </div>
          </div>

          {useLeaflet ? (
            <LeafletMapFallback
              lots={lots}
              selectedLotId={selectedLotId}
              onSelectLot={setSelectedLotId}
            />
          ) : (
            <>
              <div
                ref={mapContainerRef}
                style={{ height: '500px', width: '100%' }}
                className="bg-surface-100 dark:bg-surface-900"
              />
              {!sdkReady && (
                <div className="flex h-[500px] items-center justify-center bg-surface-50 dark:bg-surface-900" style={{ marginTop: '-500px' }}>
                  <div className="text-center">
                    <div className={`mx-auto h-10 w-10 animate-spin rounded-full border-2 ${isIndia ? 'border-[#FF9933]' : 'border-emerald-500'} border-t-transparent`} />
                    <p className="mt-3 text-sm text-surface-500">Loading Map SDK…</p>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-4">
          <div className="rounded-[24px] border border-surface-200 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.18)] dark:border-surface-800 dark:bg-surface-950/80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400">All Locations</p>
            <div className="mt-4 space-y-2 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
              {lots.map(lot => (
                <button
                  key={lot.id}
                  type="button"
                  onClick={() => setSelectedLotId(lot.id)}
                  className={`w-full rounded-[18px] border px-4 py-3 text-left transition-colors ${
                    selectedLotId === lot.id
                      ? isIndia ? 'border-[#FF9933] bg-[#FF9933]/5' : 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10'
                      : 'border-surface-200 bg-surface-50/80 hover:border-emerald-300 dark:border-surface-800 dark:bg-surface-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-surface-900 dark:text-white">{lot.name}</p>
                      <p className="mt-0.5 truncate text-xs text-surface-500 dark:text-surface-400">{lot.city}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: MARKER_HEX[lot.color] ?? MARKER_HEX.gray }}
                      />
                      <span className="font-mono text-xs font-semibold text-surface-700 dark:text-surface-300">
                        {lot.available_spots}/{lot.total_slots}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedLot && (
            <div className="rounded-[24px] border border-surface-200 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.18)] dark:border-surface-800 dark:bg-surface-950/80">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400">Selected</p>
                  <h2 className={`mt-1 text-lg font-semibold ${isIndia ? 'text-[#000080] dark:text-white' : 'text-surface-900 dark:text-white'}`}>{selectedLot.name}</h2>
                  <p className="mt-0.5 text-xs text-surface-500">{selectedLot.address}</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                  style={{ background: MARKER_HEX[selectedLot.color] }}
                >
                  {selectedLot.available_spots} free
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <DetailRow label="Available" value={`${selectedLot.available_spots}/${selectedLot.total_slots} spots`} />
                <DetailRow label="Per Hour" value={formatINR(selectedLot.hourly_rate_inr)} />
                <DetailRow label="Max / Day" value={formatINR(selectedLot.daily_max_inr)} />
                <DetailRow label="Status" value={selectedLot.status} />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <InfoPill icon={<Lightning weight="fill" className="h-3.5 w-3.5" />} label="EV Charging" active={/ev|charge|electric/i.test(selectedLot.name)} isIndia={isIndia} />
                <InfoPill icon={<Wheelchair weight="fill" className="h-3.5 w-3.5" />} label="Accessible" active={/accessible|wheelchair/i.test(selectedLot.name)} isIndia={isIndia} />
              </div>

              <a href="/book" className={`btn w-full mt-5 text-center ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] text-white' : 'btn-primary'}`}>
                Book This Spot →
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, sub, isIndia, accent = false }) {
  return (
    <div className={`rounded-[22px] border px-4 py-4 ${
      accent 
      ? isIndia ? 'border-[#FF9933]/30 bg-[#FF9933]/10' : 'border-emerald-200 bg-emerald-500/10 dark:border-emerald-900/60' 
      : 'border-white/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.04]'
    }`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${accent ? isIndia ? 'text-[#FF9933]' : 'text-emerald-700 dark:text-emerald-300' : 'text-surface-500 dark:text-white/45'}`}>{label}</p>
      <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-surface-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{sub}</p>
    </div>
  );
}

function LegendChip({ label, color }) {
  return (
    <div className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-300">
      <span className="h-3 w-3 flex-shrink-0 rounded-full border border-white/50 shadow-sm" style={{ background: color }} />
      {label}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface-50 px-4 py-2.5 dark:bg-surface-900/70">
      <span className="text-sm text-surface-500 dark:text-surface-400">{label}</span>
      <span className="font-mono text-sm font-semibold text-surface-900 dark:text-white">{value}</span>
    </div>
  );
}

function InfoPill({ icon, label, active, isIndia }) {
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
      active 
      ? isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' 
      : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'
    }`}>
      {icon}{label}
    </div>
  );
}
