'use client';

import dynamic from 'next/dynamic';
import { useSurveyStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Navigation, MapPin } from 'lucide-react';

// Dynamically import Leaflet component with SSR disabled
const MapComponent = dynamic(
  () => import('./MapComponent'),
  { ssr: false }
);

export default function MapView() {
  const surveys = useSurveyStore(state => state.surveys);
  const updateSurvey = useSurveyStore(state => state.updateSurvey);
  const preferences = useSurveyStore(state => state.preferences);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [programmaticUpdate, setProgrammaticUpdate] = useState(0);

  useEffect(() => {
    let mounted = true;

    const geocodeMissing = async () => {
      const missing = surveys.filter(s => s.sampleSite && (s.lat === undefined || s.lng === undefined));
      if (missing.length === 0) return;

      setIsGeocoding(true);
      for (const survey of missing) {
        if (!mounted) break;
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(survey.sampleSite!)}&format=json&limit=1`);
          const data = await resp.json();
          if (data && data.length > 0) {
            updateSurvey(survey.id, {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            });
          }
          // Delay to respect Nominatim limit (1 request per second max)
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (e) {
          console.error('Failed to geocode site:', e);
        }
      }
      if (mounted) {
        setIsGeocoding(false);
      }
    };

    geocodeMissing();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const surveysWithLocation = surveys.filter(s => s.lat !== undefined && s.lng !== undefined);
  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);

  const handleGetLocation = () => {
    if (!selectedSurveyId) return alert('Please select a survey first.');
    if (navigator.geolocation) {
      setIsGeocoding(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await resp.json();
          if (data && data.display_name) {
            updateSurvey(selectedSurveyId, {
              lat,
              lng,
              sampleSite: data.display_name
            });
          } else {
            updateSurvey(selectedSurveyId, { lat, lng });
          }
        } catch (e) {
          updateSurvey(selectedSurveyId, { lat, lng });
        } finally {
          setIsGeocoding(false);
          setProgrammaticUpdate(Date.now());
        }
      }, () => { setIsGeocoding(false); }, { enableHighAccuracy: preferences.highAccuracyMode });
    }
  };

  const handleClearGPS = () => {
    if (!selectedSurveyId) return alert('Please select a survey first.');
    updateSurvey(selectedSurveyId, { lat: undefined, lng: undefined });
  };

  const handleAddPlotMarker = () => {
     if (!selectedSurveyId) return alert('Please select a survey first.');
     // Usually an 'add marker' button centers map and drops marker
     const mapCenter = document.querySelector('.leaflet-container');
     if (mapCenter) {
       // Just instruct the user to click the map
       alert('Click anywhere on the map to add the plot marker for the selected survey.');
     }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFCF8]">
      <div className="p-4 md:p-6 pb-0 flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-emerald-950 tracking-tight">Geographical Overview</h1>
          <p className="text-sm text-moss/70 mt-1">
            Showing {surveysWithLocation.length} plot locations{isGeocoding && ' (Resolving missing coordinates...)'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-2 w-full md:w-auto">
          <select 
            value={selectedSurveyId}
            onChange={e => setSelectedSurveyId(e.target.value)}
            className="px-3 py-2 bg-white border border-forest/10 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/20 w-full md:w-auto overflow-hidden text-ellipsis whitespace-nowrap"
          >
            <option value="">Select Survey to Position</option>
            {surveys.map(s => (
              <option key={s.id} value={s.id}>{s.projectName} ({s.sampleSite})</option>
            ))}
          </select>

          <div className="hidden md:flex flex-wrap items-center gap-2">
            <button 
              onClick={handleAddPlotMarker}
              className="bg-white border border-forest/10 text-moss/80 hover:bg-mint hover:text-forest px-3 py-2 rounded-lg font-medium text-[12px] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              Add Plot Marker
            </button>
            
            <button 
              onClick={handleGetLocation}
              className="bg-forest hover:bg-forest-mid text-white px-3 py-2 rounded-lg font-medium text-[12px] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              Current Location
            </button>

            <button 
              onClick={handleClearGPS}
              className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-medium text-[12px] transition-colors shadow-sm"
            >
              Clear GPS
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-hidden min-h-0 relative flex flex-col">
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden relative">
          <MapComponent 
            selectedSurveyId={selectedSurveyId} 
            programmaticUpdate={programmaticUpdate}
            onMapClick={async (lat, lng) => {
              if (selectedSurveyId) {
                updateSurvey(selectedSurveyId, { lat, lng });
                setIsGeocoding(true);
                try {
                  const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                  const data = await resp.json();
                  if (data && data.display_name) {
                    updateSurvey(selectedSurveyId, { sampleSite: data.display_name });
                  }
                } catch (e) {
                  // ignore
                } finally {
                  setIsGeocoding(false);
                }
              }
            }}
          />
        </div>
        
        <div className="md:hidden mt-4 grid grid-cols-2 gap-2 flex-shrink-0">
            <button 
              onClick={handleAddPlotMarker}
              className="bg-white col-span-2 border border-forest/10 text-moss/80 hover:bg-mint hover:text-forest px-3 py-2.5 rounded-lg font-medium text-[13px] transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              Add Plot Marker
            </button>
            
            <button 
              onClick={handleGetLocation}
              className="bg-forest hover:bg-forest-mid text-white px-3 py-2.5 rounded-lg font-medium text-[13px] transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              Current Location
            </button>

            <button 
              onClick={handleClearGPS}
              className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-lg font-medium text-[13px] transition-colors shadow-sm flex items-center justify-center"
            >
              Clear GPS
            </button>
        </div>
      </div>
    </div>
  );
}
