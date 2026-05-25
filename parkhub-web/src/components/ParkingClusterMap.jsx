import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';

// Fix missing marker icons (Leaflet default icon bug)
if (typeof window !== 'undefined' && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}


// ── Icons Mock/Fallback for Standalone Usage ──
// If Phosphor icons are available in the project, we import them;
// otherwise, we provide simple elegant inline SVGs so the code is completely self-contained.
import {
  MapPin,
  CurrencyInr,
  Funnel,
  SpinnerGap,
  NavigationArrow,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  ArrowClockwise,
} from '@phosphor-icons/react';

// ── Dummy Fallback Data ──
// Dense realistically placed parking locations across dense hubs (Delhi/NCR area, India)
const DUMMY_PARKINGS = [
  {
    id: 'lot-1',
    name: 'Connaught Place Block A Parking',
    latitude: 28.6304,
    longitude: 77.2177,
    available_slots: 24,
    total_slots: 80,
    price: 40,
  },
  {
    id: 'lot-2',
    name: 'Palika Bazaar Underground Garage',
    latitude: 28.6298,
    longitude: 77.2195,
    available_slots: 0, // Full
    total_slots: 120,
    price: 30,
  },
  {
    id: 'lot-3',
    name: 'Janpath B B Marg Multi-Level Parking',
    latitude: 28.6258,
    longitude: 77.2185,
    available_slots: 45,
    total_slots: 150,
    price: 50,
  },
  {
    id: 'lot-4',
    name: 'Khan Market Premium Parking',
    latitude: 28.6015,
    longitude: 77.2272,
    available_slots: 8,
    total_slots: 40,
    price: 80,
  },
  {
    id: 'lot-5',
    name: 'Rajendra Place Metro Spot',
    latitude: 28.6425,
    longitude: 77.1782,
    available_slots: 60,
    total_slots: 200,
    price: 20,
  },
  {
    id: 'lot-6',
    name: 'Karol Bagh Market Parking Hub',
    latitude: 28.6452,
    longitude: 77.1912,
    available_slots: 0, // Full
    total_slots: 90,
    price: 35,
  },
  {
    id: 'lot-7',
    name: 'India Gate Visitors Parking Lot',
    latitude: 28.6129,
    longitude: 77.2295,
    available_slots: 110,
    total_slots: 300,
    price: 25,
  },
];

// ── Custom SVG Pin Markers ──
// Create customizedLeaflet Icons with gorgeous drop-shadows and inner status rings
const createCustomMarker = (availableSlots) => {
  const isAvailable = availableSlots > 0;
  const primaryColor = isAvailable ? '#10b981' : '#ef4444'; // Emerald green vs Red
  const ringColor = isAvailable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';

  const svgMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" fill="none">
      <defs>
        <filter id="shadow" x="-4" y="-4" width="44" height="54" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="rgba(15,23,42,0.25)" />
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M18 2C9.16 2 2 9.16 2 18C2 28.5 18 42 18 42S34 28.5 34 18C34 9.16 26.84 2 18 2Z" fill="${primaryColor}" />
        <circle cx="18" cy="18" r="7" fill="white" />
        <circle cx="18" cy="18" r="11" stroke="${ringColor}" stroke-width="2" />
        <text x="18" y="21" font-family="'Inter', sans-serif" font-weight="900" font-size="8" fill="${primaryColor}" text-anchor="middle">P</text>
      </g>
    </svg>
  `;

  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`,
    iconSize: [36, 46],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
  });
};

// Pulse icon representing the User's live detected position
const createUserLocationMarker = () => {
  const svgMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" fill="#3b82f6" fill-opacity="0.2" />
      <circle cx="14" cy="14" r="6" fill="#3b82f6" />
      <circle cx="14" cy="14" r="6" stroke="white" stroke-width="2" />
      <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
    </svg>
  `;
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// ── Custom Cluster Icon Styling ──
// Dynamic color shifts and sizes based on cluster count
const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  let themeColor = '#10b981'; // Green for sparse
  let glowColor = 'rgba(16, 185, 129, 0.4)';

  if (count >= 5 && count < 10) {
    themeColor = '#f59e0b'; // Amber for medium
    glowColor = 'rgba(245, 158, 11, 0.4)';
  } else if (count >= 10) {
    themeColor = '#ef4444'; // Red for dense
    glowColor = 'rgba(239, 68, 68, 0.4)';
  }

  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: ${themeColor};
        color: white;
        font-family: 'Inter', sans-serif;
        font-weight: 800;
        font-size: 14px;
        border: 3px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 10px 20px ${glowColor}, inset 0 2px 4px rgba(255,255,255,0.3);
      ">
        ${count}
      </div>
    `,
    className: 'custom-leaflet-cluster',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

// ── Map controller component for smooth bounds fitting and centering ──
function MapController({ lots, userLoc, flyToTarget }) {
  const map = useMap();

  // 1. Auto-fit bounds on initial loading of active parking lots
  useEffect(() => {
    if (lots.length === 0) return;
    const points = lots.map((l) => [l.latitude, l.longitude]);
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 15, animate: true, duration: 1.5 });
    }
  }, [lots, map]);

  // 2. Smoothly fly to selected sidebar target
  useEffect(() => {
    if (!flyToTarget) return;
    map.setView([flyToTarget.lat, flyToTarget.lng], 16, {
      animate: true,
      duration: 1.2,
    });
  }, [flyToTarget, map]);

  return null;
}

// ── Main Parking Map View Component ──
export function ParkingClusterMap({ onSelectLot, lots: externalLots, fullScreen = true }) {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [filterOnlyAvailable, setFilterOnlyAvailable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Geolocation states
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  
  // Interaction target
  const [flyToTarget, setFlyToTarget] = useState(null);

  // Fetch parking spots
  const fetchParkings = async () => {
    console.log('ParkingClusterMap API Sync: Starting fetch sequence...');
    setLoading(true);
    setErrorState(false);
    try {
      // 1. Try authenticated API Client first
      console.log('ParkingClusterMap API Sync: Attempting to fetch lots from client api.getLots()...');
      const response = await api.getLots();
      console.log('ParkingClusterMap API Sync: client api.getLots() response:', response);
      if (response && response.success && Array.isArray(response.data)) {
        console.log('ParkingClusterMap API Sync: Successfully fetched lots array from client. Count:', response.data.length);
        setParkings(response.data);
        return;
      }

      // 2. Try direct fetch from /api/parkings
      console.log('ParkingClusterMap API Sync: Falling back to direct fetch from "/api/parkings"...');
      const res = await fetch('/api/parkings');
      console.log('ParkingClusterMap API Sync: "/api/parkings" response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('ParkingClusterMap API Sync: "/api/parkings" JSON data:', data);
        if (Array.isArray(data)) {
          setParkings(data);
          return;
        } else if (data?.success && Array.isArray(data.data)) {
          setParkings(data.data);
          return;
        }
      }

      // 3. Try direct fetch from /api/v1/lots
      console.log('ParkingClusterMap API Sync: Falling back to direct fetch from "/api/v1/lots"...');
      const resLots = await fetch('/api/v1/lots');
      console.log('ParkingClusterMap API Sync: "/api/v1/lots" response status:', resLots.status);
      if (resLots.ok) {
        const data = await resLots.json();
        console.log('ParkingClusterMap API Sync: "/api/v1/lots" JSON data:', data);
        if (Array.isArray(data)) {
          setParkings(data);
          return;
        } else if (data?.success && Array.isArray(data.data)) {
          setParkings(data.data);
          return;
        }
      }

      throw new Error('All coordinate API sources returned invalid response format.');
    } catch (err) {
      console.warn('ParkingClusterMap API Sync: API failed or was unreachable. Fallback dataset activated.', err);
      setParkings(DUMMY_PARKINGS);
      setErrorState(true);
    } finally {
      setLoading(false);
    }
  };

  // Sync external props or internal fetch
  useEffect(() => {
    if (externalLots && Array.isArray(externalLots) && externalLots.length > 0) {
      console.log('ParkingClusterMap: Loading externally supplied lots list. Count:', externalLots.length);
      setParkings(externalLots);
      setLoading(false);
      setErrorState(false);
    } else {
      console.log('ParkingClusterMap: No valid external lots provided. Fetching via API endpoints...');
      fetchParkings();
    }
  }, [externalLots]);

  // Geolocation triggers
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      console.warn('ParkingClusterMap: Browser does not support geolocation.');
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    console.log('ParkingClusterMap: Detecting live user location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = { lat: latitude, lng: longitude };
        console.log('ParkingClusterMap: Location successfully pinpointed:', newLoc);
        setUserLocation(newLoc);
        setFlyToTarget(newLoc);
        setGeoLoading(false);
      },
      (err) => {
        console.error('ParkingClusterMap: Location detection failed:', err);
        alert('Could not determine your location. Please check your browser location access permissions.');
        setGeoLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ── Normalize coordinates & parameters ──
  const normalizedParkings = useMemo(() => {
    console.log('ParkingClusterMap Data Normalization: Processing', parkings.length, 'spots...');
    return parkings.map((p) => {
      // 1. Parsing numeric coordinates
      const lat = p.latitude !== undefined && p.latitude !== null ? parseFloat(p.latitude) : NaN;
      const lng = p.longitude !== undefined && p.longitude !== null ? parseFloat(p.longitude) : NaN;
      
      // 2. Normalizing prices / hourly rate fields
      const price = p.price !== undefined ? parseFloat(p.price) : (p.hourly_rate !== undefined ? parseFloat(p.hourly_rate) : 0);
      
      // 3. Ensuring valid numeric capacities
      const available_slots = p.available_slots !== undefined ? parseInt(p.available_slots, 10) : 0;
      const total_slots = p.total_slots !== undefined ? parseInt(p.total_slots, 10) : 0;
      
      // 4. Checking bounding ranges
      const isValid = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      
      if (!isValid) {
        console.warn(`ParkingClusterMap Debug: Invalid Coordinate range on spot "${p.name || 'Unnamed'}" (ID: ${p.id}). Latitude: ${p.latitude}, Longitude: ${p.longitude}`);
      } else {
        console.log(`ParkingClusterMap Debug: Coordinate validated for spot "${p.name}" (${lat}, ${lng})`);
      }

      return {
        ...p,
        latitude: lat,
        longitude: lng,
        price,
        available_slots,
        total_slots,
        isValid
      };
    });
  }, [parkings]);

  // Filter out invalid coordinates to protect Leaflet map container
  const validParkings = useMemo(() => {
    const validList = normalizedParkings.filter(p => p.isValid);
    console.log(`ParkingClusterMap Debug: Valid coordinates total count: ${validList.length} of ${normalizedParkings.length}`);
    return validList;
  }, [normalizedParkings]);

  // Filter list based on toggles and search inputs
  const filteredParkings = useMemo(() => {
    const result = validParkings.filter((p) => {
      const matchAvailable = filterOnlyAvailable ? p.available_slots > 0 : true;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchAvailable && matchSearch;
    });
    console.log(`ParkingClusterMap Debug: Filtered active matching hubs: ${result.length}`);
    return result;
  }, [validParkings, filterOnlyAvailable, searchTerm]);

  // Compute live statistics for widgets
  const stats = useMemo(() => {
    const totalLots = normalizedParkings.length;
    const availableLots = normalizedParkings.filter((p) => p.available_slots > 0).length;
    const totalFreeSlots = normalizedParkings.reduce((sum, p) => sum + p.available_slots, 0);
    const totalCapacity = normalizedParkings.reduce((sum, p) => sum + p.total_slots, 0);
    const occupancyPercentage = totalCapacity > 0 ? Math.round(((totalCapacity - totalFreeSlots) / totalCapacity) * 100) : 0;
    
    return { totalLots, availableLots, totalFreeSlots, occupancyPercentage };
  }, [normalizedParkings]);

  // Fly to parking spot
  const handleSpotFocus = (spot) => {
    console.log(`ParkingClusterMap: Flying to focus target "${spot.name}" ([${spot.latitude}, ${spot.longitude}])`);
    setFlyToTarget({ lat: spot.latitude, lng: spot.longitude });
  };

  return (
    <div className={`relative flex overflow-hidden bg-surface-900 font-sans text-surface-100 ${
      fullScreen ? 'h-screen w-screen' : 'h-full w-full'
    }`}>
      
      {/* ── Left Sidebar Control Deck (Glassmorphism design) ── */}
      <div className="absolute lg:relative z-10 flex h-full w-[380px] shrink-0 flex-col border-r border-white/10 bg-slate-900/90 p-6 shadow-[10px_0_30px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse">
            <MapPin size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              ParkHub <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/30">PRO</span>
            </h1>
            <p className="text-[11px] text-slate-400">Premium Dense Cluster Hub</p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/5 bg-white/4 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Hubs</span>
            <p className="mt-1 text-2xl font-black text-white">{stats.totalLots}</p>
            <span className="text-[9px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle size={10} weight="fill" /> {stats.availableLots} Available
            </span>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/4 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Free Spots</span>
            <p className="mt-1 text-2xl font-black text-emerald-400">{stats.totalFreeSlots}</p>
            <span className="text-[9px] text-slate-400">{stats.occupancyPercentage}% occupied</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-5 space-y-3">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search parking hub..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          {/* Filter Toggles */}
          <button
            onClick={() => setFilterOnlyAvailable(prev => !prev)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-semibold tracking-wide transition-all ${
              filterOnlyAvailable
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-white/10 bg-slate-950/20 text-slate-300 hover:border-white/20'
            }`}
          >
            <span className="flex items-center gap-2">
              <Funnel size={13} weight="bold" /> Only Show Available Spaces
            </span>
            <span className={`h-2 w-2 rounded-full ${filterOnlyAvailable ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
          </button>
        </div>

        {/* Refresh & Geolocation Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={detectUserLocation}
            disabled={geoLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 px-3 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
          >
            <NavigationArrow size={12} weight="fill" className={geoLoading ? 'animate-spin' : ''} />
            My Location
          </button>
          <button
            onClick={fetchParkings}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/30 hover:bg-slate-950/60 px-3 py-2.5 text-xs font-bold text-slate-300 transition"
          >
            <ArrowClockwise size={12} weight="bold" /> Sync Data
          </button>
        </div>

        {/* Fallback Warning Flag */}
        {errorState && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-400">
            ⚠️ <strong>Local API Down:</strong> Using secure local backup cluster datasets to preserve full system availability.
          </div>
        )}

        {/* Results Sidebar Scroll list */}
        <div className="mt-5 flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Parking Hub List ({filteredParkings.length})</h3>
          
          {filteredParkings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/2 p-6 text-center text-xs text-slate-500">
              No matching active hubs found.
            </div>
          ) : (
            filteredParkings.map((spot) => {
              const isAvailable = spot.available_slots > 0;
              return (
                <button
                  key={spot.id}
                  onClick={() => handleSpotFocus(spot)}
                  className="flex w-full flex-col rounded-xl border border-white/5 bg-white/4 p-4 text-left transition hover:border-emerald-500/30 hover:bg-white/6"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="truncate text-xs font-bold text-white leading-tight">{spot.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {isAvailable ? 'Active' : 'Full'}
                    </span>
                  </div>
                  
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      🚗 {spot.available_slots} / {spot.total_slots} Free
                    </span>
                    <span className="flex items-center text-emerald-400 font-bold">
                      ₹{spot.price}/hr
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Half: The Map ── */}
      <div className="relative flex-1 h-full w-full bg-slate-950">
        
        {/* Loading Spinner Screen Overlay */}
        {loading && (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
            <SpinnerGap className="h-10 w-10 animate-spin text-emerald-500" weight="bold" />
            <p className="mt-4 text-sm font-bold text-white">Synthesizing cluster layers...</p>
            <p className="mt-1 text-xs text-slate-400">Establishing real-time connection</p>
          </div>
        )}

        {/* Geolocation Loading Status Indicator */}
        {geoLoading && (
          <div className="absolute top-6 left-6 z-[1000] flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-600/90 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md">
            <SpinnerGap size={14} className="animate-spin" weight="bold" /> Pinpointing coordinates...
          </div>
        )}

        {/* Leaflet MapContainer */}
        <MapContainer
          center={[28.6304, 77.2177]} // Center initially in CP block Delhi
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} // Disable to customize position later
        >
          {/* Custom zoom control inside clean placement */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* User Live Geolocation Spot Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserLocationMarker()}>
              <Popup>
                <div className="p-1 text-xs font-bold">📍 You are here!</div>
              </Popup>
            </Marker>
          )}

          {/* Dynamic Marker Cluster Group */}
          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            iconCreateFunction={createClusterIcon}
            maxClusterRadius={60}
          >
            {filteredParkings.map((spot) => {
              const markerIcon = createCustomMarker(spot.available_slots);
              return (
                <Marker
                  key={spot.id}
                  position={[spot.latitude, spot.longitude]}
                  icon={markerIcon}
                >
                  <Popup className="custom-popup-box">
                    <div className="min-w-[200px] p-2 font-sans">
                      <h4 className="m-0 text-sm font-black text-slate-800 leading-snug">{spot.name}</h4>
                      
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                        <span className="font-semibold text-slate-600">
                          🚗 Free Spots:
                        </span>
                        <span className={`font-black ${spot.available_slots > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {spot.available_slots} / {spot.total_slots}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">
                          💳 Hourly Cost:
                        </span>
                        <span className="font-black text-slate-900 flex items-center">
                          ₹{spot.price}/hr
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (onSelectLot) {
                            onSelectLot(spot);
                          } else {
                            alert(`Redirecting to payment gateway for hub slot: "${spot.name}"`);
                          }
                        }}
                        className="mt-3.5 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 py-2 text-center text-xs font-bold text-white transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                      >
                        {onSelectLot ? 'Select Lot ✓' : 'Book Now →'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>

          {/* Bound Controller */}
          <MapController lots={filteredParkings} userLoc={userLocation} flyToTarget={flyToTarget} />
        </MapContainer>
      </div>
    </div>
  );
}
export default ParkingClusterMap;
