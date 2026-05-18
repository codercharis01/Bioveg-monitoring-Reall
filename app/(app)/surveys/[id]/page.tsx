'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter, notFound } from 'next/navigation';
import { ArrowLeft, Clock, UploadCloud, FileDown, Leaf, Edit, Trash } from 'lucide-react';
import { useSurveyStore } from '@/lib/store';
import { formatCoordinate } from '@/lib/utils';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(
  () => import('@/app/(app)/surveys/new/NewSurveyMap'),
  { ssr: false }
);

export default function SurveyDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const surveys = useSurveyStore(state => state.surveys);
  const deleteSurvey = useSurveyStore(state => state.deleteSurvey);
  const updateSurvey = useSurveyStore(state => state.updateSurvey);
  const preferences = useSurveyStore(state => state.preferences);
  
  const survey = surveys.find(s => s.id === resolvedParams.id);

  if (!survey) {
    return notFound();
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this survey?")) {
      deleteSurvey(survey.id);
      router.push('/surveys');
    }
  };

  const handleUpdate = () => {
    const newName = prompt("Enter new project name:", survey.projectName);
    if (newName) {
      updateSurvey(survey.id, { projectName: newName });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-10 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <Link 
            href="/surveys"
            className="text-moss/70 hover:text-charcoal flex items-center gap-1.5 text-[13px] font-medium mb-3 transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Surveys
          </Link>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[26px] font-semibold text-charcoal tracking-tight">{survey.projectName}</h1>
            <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full ${survey.status === 'Synced' ? 'bg-[#dcf1e6] text-[#27523a]' : 'bg-orange-100 text-orange-800'}`}>
              {survey.status}
            </span>
          </div>
          <p className="text-[14px] text-moss/70 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5" />
            {survey.sampleSite} • {survey.ecosystemType} • {survey.vegetationType}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <Link 
            href={`/surveys/${survey.id}/record`} 
            className="bg-forest hover:bg-forest-mid text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-[12px] md:text-[13.5px] font-medium transition-colors shadow-sm flex items-center gap-2 md:w-auto w-fit"
          >
            Add Species Record
          </Link>
          {survey.status === 'Pending' && (
            <button className="bg-white border border-forest/15 hover:bg-mint/50 hover:text-forest text-moss/80 px-4 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors shadow-sm flex items-center gap-2">
              <UploadCloud className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}
          <button className="bg-white border border-forest/15 hover:bg-mint/50 text-moss/80 px-4 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors shadow-sm flex items-center gap-2">
            <FileDown className="w-[18px] h-[18px]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={handleUpdate} className="bg-white border border-forest/15 hover:bg-mint/50 text-moss/80 px-3 py-2.5 rounded-lg transition-colors shadow-sm flex items-center h-[42px]" title="Edit Survey">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={handleDelete} className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-3 py-2.5 rounded-lg transition-colors shadow-sm flex items-center h-[42px]" title="Delete Survey">
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-forest/10 flex flex-col">
          <h3 className="text-[15px] font-semibold text-charcoal">Date Logged</h3>
          <p className="text-[13px] text-moss/70 mt-0.5 flex items-center gap-2">
            {survey.date}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-forest/10 flex flex-col">
          <h3 className="text-[15px] font-semibold text-charcoal">Researcher</h3>
          <p className="text-[13px] text-moss/70 mt-0.5">{survey.researcherName || 'Anonymous'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-forest/10 flex flex-col">
          <h3 className="text-[15px] font-semibold text-charcoal">Species Diversity</h3>
          <p className="text-[13px] text-moss/70 mt-0.5">{survey.speciesList.length} Unique</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-forest/10 flex flex-col">
          <h3 className="text-[15px] font-semibold text-charcoal">Effort</h3>
          <p className="text-[13px] text-moss/70 mt-0.5">{survey.numQuadrats} Quadrats Evaluated</p>
        </div>
      </div>

      <div className="bg-white border border-forest/10 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-forest/10 bg-mint/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold text-charcoal">Site Location</h3>
            <p className="text-[13px] text-moss/70 mt-0.5">Click the map or use the button below to update GPS location.</p>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={() => {
                 if (navigator.geolocation) {
                   navigator.geolocation.getCurrentPosition(
                     (position) => {
                       updateSurvey(survey.id, { 
                         lat: position.coords.latitude, 
                         lng: position.coords.longitude 
                       });
                     },
                     (error) => {
                       console.error("Error obtaining location:", error);
                     },
                     { enableHighAccuracy: preferences.highAccuracyMode }
                   );
                 }
               }}
               className="bg-forest/10 hover:bg-forest/20 text-forest px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
             >
               Current Location
             </button>
             {(survey.lat !== undefined && survey.lng !== undefined) && (
                <div className="text-[12px] font-mono text-moss/80 bg-white px-3 py-1.5 rounded-lg border border-forest/10 shadow-sm">
                  {formatCoordinate(survey.lat, false, preferences.coordinateFormat)}, {formatCoordinate(survey.lng, true, preferences.coordinateFormat)}
                </div>
             )}
          </div>
        </div>
        <div className="w-full h-[300px] bg-slate-100 flex items-center justify-center relative">
          <LeafletMap 
            lat={survey.lat?.toString() || ''} 
            lng={survey.lng?.toString() || ''} 
            setPos={(lat, lng) => {
               updateSurvey(survey.id, { lat: parseFloat(lat), lng: parseFloat(lng) });
            }}
            programmaticUpdate={0}
          />
        </div>
      </div>

      <div className="bg-white border border-forest/10 rounded-2xl shadow-sm overflow-hidden min-h-[300px]">
        <div className="p-5 border-b border-forest/10 bg-mint/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold text-charcoal">Species Distribution Summary</h3>
            <p className="text-[13px] text-moss/70 mt-0.5">Distribution matrix of recorded specimens across quadrats.</p>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <div className="hidden md:block">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead className="bg-mint border-b border-forest/10">
                <tr>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-moss/60 uppercase tracking-widest">Scientific Name</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-moss/60 uppercase tracking-widest">Family</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-moss/60 uppercase tracking-widest">Stratum</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-moss/60 uppercase tracking-widest">Notes</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-forest uppercase tracking-widest bg-mint/30 border-x border-forest/5 text-center">Total</th>
                  {(() => {
                    const lastQuadratWithData = survey.speciesList.reduce((maxIdx, species) => {
                      const speciesLastIdx = species.quadrats.reduce((last, val, idx) => val > 0 ? idx : last, -1);
                      return Math.max(maxIdx, speciesLastIdx);
                    }, -1);
                    const colsToDisplay = Math.max(1, lastQuadratWithData + 1);
                    return Array.from({ length: colsToDisplay }).map((_, idx) => (
                      <th key={`th-q${idx}`} className="px-4 py-3.5 text-[11px] font-semibold text-moss/60 uppercase tracking-widest text-center">Q{idx + 1}</th>
                    ));
                  })()}
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/5">
                {survey.speciesList.length > 0 ? survey.speciesList.map((species) => {
                  const totalAbundance = species.quadrats.reduce((sum, val) => sum + val, 0);
                  const lastQuadratWithData = survey.speciesList.reduce((maxIdx, s) => {
                    const speciesLastIdx = s.quadrats.reduce((last, val, idx) => val > 0 ? idx : last, -1);
                    return Math.max(maxIdx, speciesLastIdx);
                  }, -1);
                  const colsToDisplay = Math.max(1, lastQuadratWithData + 1);
                  
                  return (
                    <tr key={`row-${species.id}`} className="hover:bg-mint/30 transition-colors group">
                      <td className="px-5 py-4 font-semibold text-charcoal text-[13.5px]">{species.name}</td>
                      <td className="px-5 py-4 text-moss/70 text-[13px]">{species.family || '—'}</td>
                      <td className="px-5 py-4">
                        {(() => {
                          if (!species.stratum) return <span className="text-moss/40">—</span>;
                          const lowerStr = species.stratum.toLowerCase();
                          if (lowerStr.includes("sub-can") || lowerStr.includes("sub canopy")) {
                            return <span className="status-chip status-active" style={{ fontSize: '11px', background: '#e8f1ff', color: '#1d4ed8' }}>{species.stratum}</span>;
                          } else if (lowerStr.includes("canopy")) {
                            return <span className="status-chip status-complete" style={{ fontSize: '11px' }}>{species.stratum}</span>;
                          } else if (lowerStr.includes("understorey") || lowerStr.includes("understory") || lowerStr.includes("ground") || lowerStr.includes("shrub") || lowerStr.includes("root")) {
                            return <span className="status-chip status-pending" style={{ fontSize: '11px' }}>{species.stratum}</span>;
                          } else {
                            return <span className="status-chip status-active" style={{ fontSize: '11px' }}>{species.stratum}</span>;
                          }
                        })()}
                      </td>
                      <td className="px-5 py-4 text-moss/70 text-[12px] max-w-[150px] truncate" title={species.notes}>{species.notes || '—'}</td>
                      <td className="px-5 py-4 bg-mint/10 group-hover:bg-mint/40 text-forest font-bold text-[14px] border-x border-forest/5 text-center transition-colors">{totalAbundance}</td>
                      {species.quadrats.slice(0, colsToDisplay).map((val, idx) => (
                        <td key={`cell-${species.id}-q${idx}`} className="px-4 py-4 text-center">
                          {val > 0 ? (
                            <span className="font-bold text-forest text-[13.5px]">{val}</span>
                          ) : (
                            <span className="text-moss/30 text-[13.5px]">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-moss/60 text-[13.5px]">
                      No species recorded in this survey.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="md:hidden flex flex-col p-4 gap-4">
             {survey.speciesList.length > 0 ? survey.speciesList.map((species) => {
                const totalAbundance = species.quadrats.reduce((sum, val) => sum + val, 0);
                return (
                  <div key={`mob-${species.id}`} className="border border-forest/10 rounded-xl p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <div className="font-semibold text-charcoal text-[14px]">{species.name}</div>
                         <div className="text-[12px] text-moss/70 mt-0.5">{species.family || 'No Family'}</div>
                       </div>
                       <div className="bg-mint/40 text-forest font-bold px-2 py-1 rounded-md text-[13px] border border-forest/10">
                          Total: {totalAbundance}
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 mt-4 text-[12.5px] mb-3 border-b border-forest/10 pb-3">
                       <div className="text-moss/60">Stratum: <span className="text-charcoal font-medium">{species.stratum || '—'}</span></div>
                       <div className="text-moss/60 truncate col-span-2">Notes: <span className="text-charcoal font-medium">{species.notes || '—'}</span></div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-moss/60 uppercase tracking-widest mb-2">Quadrats</div>
                      <div className="flex flex-wrap gap-2">
                         {species.quadrats.map((val, idx) => val > 0 && (
                            <div key={`mob-q${idx}`} className="bg-forest/5 border border-forest/10 px-2 py-1 rounded-md text-[11px] font-medium text-forest">
                              Q{idx + 1}: {val}
                            </div>
                         ))}
                         {totalAbundance === 0 && <span className="text-moss/40 text-[12px]">No data across quadrats</span>}
                      </div>
                    </div>
                  </div>
                );
             }) : (
                <div className="p-8 text-center text-moss/60 text-[13.5px]">
                  No species recorded in this survey.
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
