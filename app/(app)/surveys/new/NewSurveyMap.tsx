'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapClickHandler({ setPos }: { setPos: (lat: string, lng: string) => void }) {
  useMapEvents({
    click(e) {
      setPos(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

function MapRecentering({ lat, lng, programmaticUpdate }: { lat: string, lng: string, programmaticUpdate: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && programmaticUpdate) {
      map.flyTo([parseFloat(lat), parseFloat(lng)], 16);
    }
  }, [lat, lng, programmaticUpdate, map]);
  return null;
}

interface NewSurveyMapProps {
  lat: string;
  lng: string;
  setPos: (lat: string, lng: string) => void;
  programmaticUpdate: boolean;
}

export default function NewSurveyMap({ lat, lng, setPos, programmaticUpdate }: NewSurveyMapProps) {
  // Default to Nigeria, Rivers State
  const centerLat = lat ? parseFloat(lat) : 4.8156;
  const centerLng = lng ? parseFloat(lng) : 7.0498;

  return (
    <MapContainer 
      center={[centerLat, centerLng]} 
      zoom={11} 
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler setPos={setPos} />
      <MapRecentering lat={lat} lng={lng} programmaticUpdate={programmaticUpdate} />
      {(lat && lng) && (
        <Marker 
          position={[parseFloat(lat), parseFloat(lng)]}
          icon={customIcon}
        />
      )}
    </MapContainer>
  );
}
