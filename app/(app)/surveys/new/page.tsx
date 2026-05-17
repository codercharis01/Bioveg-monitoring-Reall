'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, MapPin, Navigation } from 'lucide-react';
import { useSurveyStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const NewSurveyMap = dynamic(
  () => import('./NewSurveyMap'),
  { ssr: false }
);

const steps = [
  { id: 1, label: 'Project' },
  { id: 2, label: 'Ecosystem' },
  { id: 3, label: 'Setup' },
  { id: 4, label: 'GPS' },
  { id: 5, label: 'Confirm' }
];

const ecosystems = [
  { label: 'Tropical Rainforest', icon: '🌳' },
  { label: 'Temperate Forest', icon: '🌿' },
  { label: 'Marine / Coral', icon: '🌊' },
  { label: 'Grassland / Savanna', icon: '🌾' },
  { label: 'Mangrove / Wetland', icon: '🪸' },
  { label: 'Alpine / Montane', icon: '🏔️' },
  { label: 'Arid / Desert', icon: '🏜️' },
  { label: 'Freshwater / Riparian', icon: '🌊' },
  { label: 'Custom / Other', icon: '🔬' }
];

export default function NewSurvey() {
  const router = useRouter();
  const addSurvey = useSurveyStore(state => state.addSurvey);
  const preferences = useSurveyStore(state => state.preferences);
  const draftSurvey = useSurveyStore(state => state.draftSurvey);
  const updateDraft = useSurveyStore(state => state.updateDraft);
  const clearDraft = useSurveyStore(state => state.clearDraft);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [programmaticUpdate, setProgrammaticUpdate] = useState(0);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    projectName: draftSurvey?.projectName || '',
    siteName: draftSurvey?.siteName || '',
    sampleSite: draftSurvey?.sampleSite || '',
    researcherName: draftSurvey?.researcherName || `${useSurveyStore.getState().profile?.firstName || ''} ${useSurveyStore.getState().profile?.lastName || ''}`.trim(),
    date: draftSurvey?.date ? new Date(draftSurvey.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    ecosystemType: draftSurvey?.ecosystemType || 'Tropical Rainforest',
    numQuadrats: draftSurvey?.numQuadrats || 50,
    quadratSize: draftSurvey?.quadratSize || '10 × 10 m (100 m²)',
    transectLength: draftSurvey?.transectLength || 500,
    samplingInterval: draftSurvey?.samplingInterval || 100,
    samplingMethod: draftSurvey?.samplingMethod || 'Systematic',
    lat: draftSurvey?.lat !== undefined ? draftSurvey.lat.toString() : '',
    lng: draftSurvey?.lng !== undefined ? draftSurvey.lng.toString() : ''
  });

  useEffect(() => {
    updateDraft({
      projectName: formData.projectName,
      siteName: formData.siteName,
      sampleSite: formData.sampleSite,
      ecosystemType: formData.ecosystemType,
      researcherName: formData.researcherName,
      date: formData.date,
      numQuadrats: formData.numQuadrats,
      quadratSize: formData.quadratSize,
      transectLength: formData.transectLength,
      samplingInterval: formData.samplingInterval,
      samplingMethod: formData.samplingMethod,
      lat: formData.lat ? parseFloat(formData.lat) : undefined,
      lng: formData.lng ? parseFloat(formData.lng) : undefined
    });
  }, [formData, updateDraft]);

  const handleSubmit = () => {
    // We pass the data supported by the store
    const id = addSurvey({
      projectName: formData.projectName,
      siteName: formData.siteName,
      sampleSite: formData.sampleSite,
      ecosystemType: formData.ecosystemType,
      researcherName: formData.researcherName,
      date: new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      numQuadrats: formData.numQuadrats,
      quadratSize: formData.quadratSize,
      transectLength: formData.transectLength,
      samplingInterval: formData.samplingInterval,
      samplingMethod: formData.samplingMethod,
      lat: parseFloat(formData.lat) || undefined,
      lng: parseFloat(formData.lng) || undefined
    });
    clearDraft();
    router.push(`/surveys/${id}`);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);

        setProgrammaticUpdate(Date.now());
        setFormData(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }));

        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await resp.json();
          if (data && data.display_name) {
            setFormData(prev => ({
              ...prev,
              sampleSite: data.display_name
            }));
          }
        } catch (e) {
          console.error('Reverse geocoding failed:', e);
        }

      }, undefined, { enableHighAccuracy: preferences.highAccuracyMode });
    }
  };

  const handleGeocodeSite = async () => {
    if (!formData.sampleSite) return;
    setIsGeocoding(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.sampleSite)}&format=json&limit=1`);
      const data = await resp.json();
      if (data && data.length > 0) {
        setProgrammaticUpdate(Date.now());
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(data[0].lat).toFixed(6),
          lng: parseFloat(data[0].lon).toFixed(6)
        }));
      }
    } catch (e) {
      console.error('Failed to geocode site:', e);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto w-full pb-10">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>New Project setup</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Set up project configuration, coordinates and parameters.</p>
      </div>

      <div className="flex items-center gap-0 mb-7 bg-white border border-forest/10 rounded-[16px] px-6 py-4 overflow-x-auto">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <div key={step.id} className={cn("flex items-center", index !== steps.length - 1 ? "flex-1" : "")}>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0 transition-colors",
                  isActive ? "bg-forest text-white" : 
                  isDone ? "bg-sage text-white" : 
                  "bg-forest/5 text-moss/50"
                )}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <div className={cn(
                  "text-[12.5px] font-medium transition-colors",
                  isActive ? "text-charcoal" : 
                  isDone ? "text-moss" : 
                  "text-moss/50"
                )}>
                  {step.label}
                </div>
              </div>
              {index !== steps.length - 1 && (
                <div className="flex-1 h-[1px] bg-forest/10 mx-4 min-w-[20px]"></div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-[16px] border border-forest/10 overflow-hidden shadow-sm">
        <div className="p-5 px-6 border-b border-forest/10">
          <h2 className="text-[15px] font-semibold text-charcoal">
            {currentStep === 1 && "Project Information"}
            {currentStep === 2 && "Select Ecosystem Type"}
            {currentStep === 3 && "Quadrat Configuration"}
            {currentStep === 4 && "GPS Coordinates"}
            {currentStep === 5 && "Confirm Details"}
          </h2>
          <p className="text-[13px] text-moss/70 mt-[3px]">
            {currentStep === 1 && "Basic details about the research project and site"}
            {currentStep === 2 && "Choose the primary ecosystem classification for this survey site"}
            {currentStep === 3 && "Set up plot dimensions and sampling protocol"}
            {currentStep === 4 && "Locate the survey site using GPS"}
            {currentStep === 5 && "Review your survey configuration before starting"}
          </p>
        </div>

        <div className="p-6">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[12px] font-medium text-moss/80">Project Name</label>
                <input 
                  type="text" 
                  value={formData.projectName}
                  onChange={e => setFormData({...formData, projectName: e.target.value})}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-moss/80">Sampling Area</label>
                <input 
                  type="text" 
                  value={formData.siteName}
                  onChange={e => setFormData({...formData, siteName: e.target.value})}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none" 
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[12px] font-medium text-moss/80 flex justify-between items-center">
                  Sample Site
                  {isGeocoding && <span className="text-[10px] text-forest font-semibold animate-pulse">Resolving location...</span>}
                </label>
                <input 
                  type="text" 
                  placeholder="research center, alakahia"
                  value={formData.sampleSite}
                  onChange={e => setFormData({...formData, sampleSite: e.target.value})}
                  onBlur={handleGeocodeSite}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none" 
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[12px] font-medium text-moss/80">Researcher Name</label>
                <input 
                  type="text" 
                  value={formData.researcherName}
                  onChange={e => setFormData({...formData, researcherName: e.target.value})}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none" 
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[12px] font-medium text-moss/80">Date</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none" 
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ecosystems.map((eco) => (
                <button
                  key={eco.label}
                  onClick={() => setFormData({...formData, ecosystemType: eco.label})}
                  className={cn(
                    "p-3.5 border-2 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                    formData.ecosystemType === eco.label 
                      ? "border-forest bg-sage-pale text-forest" 
                      : "border-forest/10 hover:border-sage hover:bg-mint text-moss"
                  )}
                >
                  <span className="text-2xl block">{eco.icon}</span>
                  <span className="text-[12.5px] font-medium">{eco.label}</span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-moss/80">Quadrat Size</label>
                  <select 
                    value={formData.quadratSize}
                    onChange={e => setFormData({...formData, quadratSize: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none" 
                  >
                    <option>5 × 5 m (25 m²)</option>
                    <option>10 × 10 m (100 m²)</option>
                    <option>20 × 20 m (400 m²)</option>
                    <option>25 × 25 m (625 m²)</option>
                    <option>Custom dimensions</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-moss/80">Number of Plots</label>
                  <input 
                    type="number" 
                    value={formData.numQuadrats}
                    min={1}
                    max={500}
                    onChange={e => setFormData({...formData, numQuadrats: Math.min(500, parseInt(e.target.value) || 1)})}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-moss/80">Transect Length (m)</label>
                  <input 
                    type="number" 
                    value={formData.transectLength}
                    onChange={e => setFormData({...formData, transectLength: parseInt(e.target.value) || 10})}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-moss/80">Sampling Interval (m)</label>
                  <input 
                    type="number" 
                    value={formData.samplingInterval}
                    onChange={e => setFormData({...formData, samplingInterval: parseInt(e.target.value) || 5})}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-moss/80">Sampling Method</label>
                <div className="flex gap-2">
                  {['Systematic', 'Random', 'Stratified'].map(method => (
                    <button
                      key={method}
                      onClick={() => setFormData({...formData, samplingMethod: method})}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-lg border-[1.5px] text-[13px] font-medium transition-all",
                        formData.samplingMethod === method
                          ? "border-forest bg-sage-pale text-forest"
                          : "border-forest/20 text-moss hover:bg-forest/5"
                      )}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-forest/20 bg-slate-200">
                <NewSurveyMap 
                  lat={formData.lat} 
                  lng={formData.lng} 
                  setPos={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))} 
                  programmaticUpdate={programmaticUpdate}
                />
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-[1000] pointer-events-none">
                  <div className="bg-white/95 backdrop-blur shadow-lg border border-forest/10 px-4 py-3 rounded-xl pointer-events-auto flex flex-col items-center">
                    <h3 className="text-[14px] font-medium text-charcoal mb-2">Location Services</h3>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <button 
                          onClick={() => { alert('Click anywhere on the map to add the plot marker.') }}
                          className="flex items-center gap-2 bg-white text-moss/80 border border-forest/10 px-3 py-2 rounded-lg font-medium text-[12px] hover:bg-mint transition-colors shadow-sm"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Add Plot Marker
                        </button>
                        <button 
                          onClick={handleGetLocation}
                          className="flex items-center gap-2 bg-forest text-white px-3 py-2 rounded-lg font-medium text-[12px] hover:bg-forest-mid transition-colors shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Current Location
                        </button>
                        <button 
                          onClick={() => setFormData({...formData, lat: '', lng: ''})}
                          className="flex items-center gap-2 bg-white text-red-600 border border-red-200 px-3 py-2 rounded-lg font-medium text-[12px] hover:bg-red-50 transition-colors shadow-sm"
                        >
                          Clear GPS
                        </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-moss/80">Latitude</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1.3521"
                    value={formData.lat}
                    onChange={e => {
                      setFormData({...formData, lat: e.target.value});
                      setProgrammaticUpdate(Date.now());
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none font-mono" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-moss/80">Longitude</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 110.4396"
                    value={formData.lng}
                    onChange={e => {
                      setFormData({...formData, lng: e.target.value});
                      setProgrammaticUpdate(Date.now());
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-forest/20 focus:border-moss focus:ring-[3px] focus:ring-sage/20 transition-all text-[13.5px] text-charcoal bg-[#faf6f0] focus:bg-white outline-none font-mono" 
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="bg-sand border border-forest/10 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-[11px] font-semibold text-moss/60 uppercase tracking-widest mb-1.5">Project Details</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-[13px]">
                    <div className="text-moss/80">Project Name</div>
                    <div className="font-medium text-charcoal">{formData.projectName || '—'}</div>
                    <div className="text-moss/80">Sampling Area</div>
                    <div className="font-medium text-charcoal">{formData.siteName || '—'}</div>
                    <div className="text-moss/80">Sample Site</div>
                    <div className="font-medium text-charcoal">{formData.sampleSite || '—'}</div>
                    <div className="text-moss/80">Researcher</div>
                    <div className="font-medium text-charcoal">{formData.researcherName || '—'}</div>
                  </div>
                </div>
                
                <div className="h-[1px] bg-forest/10" />

                <div>
                  <h3 className="text-[11px] font-semibold text-moss/60 uppercase tracking-widest mb-1.5">Environment</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-[13px]">
                    <div className="text-moss/80">Ecosystem</div>
                    <div className="font-medium text-charcoal">{formData.ecosystemType}</div>
                    <div className="text-moss/80">Sample Site</div>
                    <div className="font-medium text-charcoal">{formData.sampleSite || '—'}</div>
                    <div className="text-moss/80">Location</div>
                    <div className="font-medium text-charcoal font-mono">{formData.lat && formData.lng ? `${formData.lat}, ${formData.lng}` : 'Not set'}</div>
                  </div>
                </div>

                <div className="h-[1px] bg-forest/10" />

                <div>
                  <h3 className="text-[11px] font-semibold text-moss/60 uppercase tracking-widest mb-1.5">Sampling Setup</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-[13px]">
                    <div className="text-moss/80">Method</div>
                    <div className="font-medium text-charcoal">{formData.samplingMethod}</div>
                    <div className="text-moss/80">Plots</div>
                    <div className="font-medium text-charcoal">{formData.numQuadrats} × {formData.quadratSize}</div>
                    <div className="text-moss/80">Transect</div>
                    <div className="font-medium text-charcoal">{formData.transectLength}m (every {formData.samplingInterval}m)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-[#faf6f0] border-t border-forest/10 flex justify-between items-center">
          <button 
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 bg-transparent text-moss border border-forest/20 rounded-md font-medium text-[13px] hover:bg-white hover:text-charcoal hover:border-forest/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-moss/70 font-medium">Step {currentStep} of 5</span>
            {currentStep < 5 ? (
              <button 
                type="button"
                onClick={nextStep}
                className="flex items-center px-4 py-2 bg-forest text-white rounded-md font-medium text-[13px] hover:bg-forest-mid transition-colors"
                disabled={currentStep === 1 && (!formData.projectName || !formData.siteName || !formData.researcherName)}
              >
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit}
                className="flex items-center px-5 py-2 bg-forest text-white rounded-md font-medium text-[13px] hover:bg-forest-mid transition-colors"
              >
                Complete Setup <Check className="w-4 h-4 ml-1.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

