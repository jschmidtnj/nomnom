
import React, { useEffect, useRef } from 'react';
import { Restaurant, Coordinates } from '../types';

interface Props {
  userLocation: Coordinates;
  restaurants: Restaurant[];
  selectedId: string | null;
  onRestaurantSelect: (id: string) => void;
}

declare const L: any;

const MapView: React.FC<Props> = ({ userLocation, restaurants, selectedId, onRestaurantSelect }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([userLocation.lat, userLocation.lng], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([userLocation.lat, userLocation.lng]);
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `<div class="w-6 h-6 bg-blue-500 border-4 border-white rounded-full shadow-lg pulse"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapRef.current);

    return () => {};
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([userLocation.lat, userLocation.lng]);

    restaurants.forEach(res => {
      const isSelected = res.id === selectedId;
      const markerIcon = L.divIcon({
        className: 'restaurant-marker',
        html: `
          <div class="group relative flex flex-col items-center">
            <div class="transition-all duration-300 transform ${isSelected ? 'scale-125 z-50' : 'scale-100'}">
              <div class="bg-white p-1 rounded-full shadow-xl border-2 ${isSelected ? 'border-amber-500' : 'border-gray-200'}">
                <div class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-amber-500 text-white font-bold text-xs">
                  ${res.name[0]}
                </div>
              </div>
            </div>
            ${isSelected ? `
              <div class="absolute -top-10 bg-white px-2 py-1 rounded shadow-lg border border-amber-100 whitespace-nowrap font-bold text-xs text-amber-600 animate-bounce">
                ${res.name}
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([res.lat, res.lng], { icon: markerIcon })
        .addTo(mapRef.current)
        .on('click', () => onRestaurantSelect(res.id));
      
      markersRef.current.set(res.id, marker);
      bounds.extend([res.lat, res.lng]);
    });

    if (restaurants.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [restaurants, selectedId, userLocation]);

  return (
    <div id="map" className="w-full h-full relative group">
      <style>{`
        .pulse {
          animation: pulse-animation 2s infinite;
        }
        @keyframes pulse-animation {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  );
};

export default MapView;
