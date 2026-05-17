'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSurveyStore } from '@/lib/store';
import Link from 'next/link';
import { Folder } from 'lucide-react';

type MapComponentProps = {
  selectedSurveyId?: string;
  programmaticUpdate?: number;
  onMapClick?: (lat: number, lng: number) => void;
};

function MapClickHandler({ setPos }: { setPos: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      setPos(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecentering({ lat, lng, programmaticUpdate }: { lat?: number, lng?: number, programmaticUpdate?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== undefined && lng !== undefined && programmaticUpdate && programmaticUpdate > 0) {
      map.flyTo([lat, lng], 16);
    }
  }, [lat, lng, programmaticUpdate, map]);
  return null;
}

export default function MapComponent({ selectedSurveyId, programmaticUpdate, onMapClick }: MapComponentProps) {
  const surveys = useSurveyStore(state => state.surveys);
  
  // Fix for default marker icons in react-leaflet
  const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const surveysWithLocation = surveys.filter(s => s.lat !== undefined && s.lng !== undefined);
  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);
  
  const defaultCenter: [number, number] = selectedSurvey && selectedSurvey.lat !== undefined && selectedSurvey.lng !== undefined
    ? [selectedSurvey.lat, selectedSurvey.lng]
    : surveysWithLocation.length > 0
    ? [surveysWithLocation[0].lat!, surveysWithLocation[0].lng!] 
    : [4.8156, 7.0498];

  return (
    <div className="w-full h-full rounded-2xl relative overflow-hidden ring-1 ring-black/5 shadow-sm">
      <MapContainer 
        center={defaultCenter} 
        zoom={7} 
        maxZoom={19}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {onMapClick && <MapClickHandler setPos={onMapClick} />}
        {selectedSurvey && <MapRecentering lat={selectedSurvey.lat} lng={selectedSurvey.lng} programmaticUpdate={programmaticUpdate} />}
        {surveysWithLocation.map(survey => (
          <Marker 
            key={survey.id} 
            position={[survey.lat!, survey.lng!]}
            icon={customIcon}
            zIndexOffset={survey.id === selectedSurveyId ? 1000 : 0}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <Folder className="w-4 h-4 text-forest" />
                  <h3 className="text-sm font-semibold text-charcoal truncate m-0 leading-none">{survey.projectName}</h3>
                </div>
                <p className="text-xs text-moss/70 mb-2 truncate m-0">{survey.sampleSite}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-forest/10">
                  <span className="text-[11px] font-mono text-moss/50 m-0">{survey.lat?.toFixed(4)}, {survey.lng?.toFixed(4)}</span>
                  <Link 
                    href={`/surveys/${survey.id}`}
                    className="text-[11px] font-medium text-forest hover:underline m-0"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
