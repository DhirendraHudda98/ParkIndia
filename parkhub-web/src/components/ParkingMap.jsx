import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { api } from '../api/client';
import { echo } from '../lib/echo';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '16px'
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

export default function ParkingMap({ onSelectLot }) {
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  
  const [userLocation, setUserLocation] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);

  useEffect(() => {
    api.getLots().then(res => {
      if (res.success && res.data) {
        setLots(res.data.filter(lot => lot.status === 'open' && lot.latitude && lot.longitude));
      }
    });
  }, []);

  useEffect(() => {
    if (lots.length === 0) return;

    lots.forEach(lot => {
      const channelName = `lot.${lot.id}`;
      const channel = echo.channel(channelName);
      
      channel.listen('.slot.availability.changed', (e) => {
        setLots(prevLots => prevLots.map(l => {
          if (l.id === lot.id) {
            const modifier = e.status === 'unavailable' ? -1 : 1;
            const newAvailability = Math.max(0, Math.min(l.total_slots, l.available_slots + modifier));
            return { ...l, available_slots: newAvailability };
          }
          return l;
        }));
      });
    });

    return () => {
      lots.forEach(lot => echo.leaveChannel(`lot.${lot.id}`));
    };
  }, [lots.length]);

  const locateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success("Location found!", { position: 'bottom-center' });
        },
        () => toast.error("Location access denied", { position: 'bottom-center' })
      );
    }
  }, []);

  const calculateRoute = async (destinationLot) => {
    if (!userLocation) {
      toast("Please allow location access to get directions.", { icon: '📍', position: 'bottom-center' });
      return;
    }

    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    try {
      const results = await directionsService.route({
        origin: userLocation,
        destination: { lat: parseFloat(destinationLot.latitude), lng: parseFloat(destinationLot.longitude) },
        // eslint-disable-next-line no-undef
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(results);
    } catch (error) {
      toast.error("Could not calculate route.", { position: 'bottom-center' });
    }
  };

  const onLoad = useCallback(function callback(map) {
    if (lots.length > 0) {
      // eslint-disable-next-line no-undef
      const bounds = new google.maps.LatLngBounds();
      lots.forEach(lot => bounds.extend({ lat: parseFloat(lot.latitude), lng: parseFloat(lot.longitude) }));
      map.fitBounds(bounds);
    }
  }, [lots]);

  if (!isLoaded) return <div className="animate-pulse bg-gray-200 h-[400px] w-full rounded-2xl" />;

  return (
    <div className="relative w-full shadow-lg rounded-2xl overflow-hidden border border-gray-100">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={locateUser}
          className="bg-white p-3 rounded-full shadow-md hover:bg-gray-50 text-xl"
          title="Find Me"
        >
          📍
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || defaultCenter}
        zoom={13}
        onLoad={onLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {userLocation && (
          <Marker 
            position={userLocation} 
            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
          />
        )}

        {lots.map(lot => {
          const isFull = lot.available_slots === 0;
          return (
            <Marker
              key={lot.id}
              position={{ lat: parseFloat(lot.latitude), lng: parseFloat(lot.longitude) }}
              onClick={() => setSelectedLot(lot)}
              icon={isFull 
                ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" 
                : "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
              }
            />
          );
        })}

        {selectedLot && (
          <InfoWindow
            position={{ lat: parseFloat(selectedLot.latitude), lng: parseFloat(selectedLot.longitude) }}
            onCloseClick={() => {
              setSelectedLot(null);
              setDirectionsResponse(null);
            }}
          >
            <div className="p-3 w-[240px] text-gray-800 font-sans">
              <h3 className="font-black text-[16px] leading-tight mb-1 text-[#000080]">{selectedLot.name}</h3>
              <p className="text-[10px] text-gray-500 mb-3 flex items-center gap-1">
                <span className="opacity-50 italic">📍 {selectedLot.address || 'Unknown Address'}</span>
                {selectedLot.distance != null && (
                  <span className="bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                    {selectedLot.distance} km
                  </span>
                )}
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 border border-gray-100 p-2 rounded-xl text-center">
                  <div className="text-[8px] uppercase font-black text-gray-400 tracking-widest">Available</div>
                  <div className={`font-black text-base ${selectedLot.available_slots === 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {selectedLot.available_slots} <span className="text-[10px] opacity-40">/ {selectedLot.total_slots}</span>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-2 rounded-xl text-center">
                  <div className="text-[8px] uppercase font-black text-gray-400 tracking-widest">Price</div>
                  <div className="font-black text-base text-[#000080]">
                    {selectedLot.currency === 'INR' || isIndia ? '₹' : (selectedLot.currency || '€')}{Number(selectedLot.hourly_rate).toFixed(0)}<span className="text-[10px] opacity-40">/h</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1 mb-4">
                 <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${
                      selectedLot.demand_level === 'High' ? 'bg-rose-500 animate-pulse' : 
                      selectedLot.demand_level === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Demand: {selectedLot.demand_level}</span>
                 </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => calculateRoute(selectedLot)}
                  className="flex-1 bg-surface-100 text-surface-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-200 transition-colors"
                >
                  Route
                </button>
                <button 
                  onClick={() => {
                    if (onSelectLot) onSelectLot(selectedLot);
                  }}
                  disabled={selectedLot.available_slots === 0}
                  className={`flex-[2] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${
                    selectedLot.available_slots === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                      : (isIndia ? 'bg-[#FF9933] text-white hover:bg-[#e68a00] shadow-[#FF9933]/20' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/20')
                  }`}
                >
                  {selectedLot.available_slots === 0 ? 'Full' : 'Select Lot'}
                </button>
              </div>
            </div>
          </InfoWindow>
        )}

        {directionsResponse && (
          <DirectionsRenderer 
            directions={directionsResponse} 
            options={{ suppressMarkers: true }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
