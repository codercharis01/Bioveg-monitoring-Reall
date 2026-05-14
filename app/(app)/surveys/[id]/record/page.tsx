'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Scan, Minus, ArrowLeft } from 'lucide-react';
import { useSurveyStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function ActiveSurvey({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const surveys = useSurveyStore(state => state.surveys);
  const addSpecies = useSurveyStore(state => state.addSpecies);
  const updateSpeciesPresence = useSurveyStore(state => state.updateSpeciesPresence);
  const preferences = useSurveyStore(state => state.preferences);
  
  const survey = surveys.find(s => s.id === resolvedParams.id);

  const [currentQuadrat, setCurrentQuadrat] = useState(0);
  const [newSpeciesName, setNewSpeciesName] = useState('');
  const [newSpeciesFamily, setNewSpeciesFamily] = useState('');
  const [newSpeciesStratum, setNewSpeciesStratum] = useState('');
  const [newSpeciesNotes, setNewSpeciesNotes] = useState('');
  const [isAddingMode, setIsAddingMode] = useState(false);

  // Auto-redirect if accessed without config
  if (!survey) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No active survey found.</p>
        <button onClick={() => router.push('/surveys/new')} className="mt-4 text-emerald-700 underline">Start New Survey</button>
      </div>
    );
  }

  const { projectName, siteName, numQuadrats, speciesList, id: surveyId } = survey;

  const nextQuadrat = () => setCurrentQuadrat(v => Math.min(v + 1, numQuadrats - 1));
  const prevQuadrat = () => setCurrentQuadrat(v => Math.max(v - 1, 0));
  const setQuadrat = (index: number) => setCurrentQuadrat(Math.max(Math.min(index, numQuadrats - 1), 0));

  const handleAddSpecies = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeciesName.trim()) return;
    
    addSpecies(surveyId, currentQuadrat, { 
      name: newSpeciesName.trim(), 
      family: newSpeciesFamily.trim() || 'Unknown',
      stratum: newSpeciesStratum || undefined,
      notes: newSpeciesNotes || undefined
    });
    setNewSpeciesName('');
    setNewSpeciesFamily('');
    setNewSpeciesStratum('');
    setNewSpeciesNotes('');
    setIsAddingMode(false);
  };

  const currentQuadratNumber = currentQuadrat + 1;

  const allUniqueSpecies = new Map<string, { name: string, family: string }>();
  surveys.forEach(s => s.speciesList.forEach(sp => {
    if (!allUniqueSpecies.has(sp.name.toLowerCase())) {
      allUniqueSpecies.set(sp.name.toLowerCase(), { name: sp.name, family: sp.family });
    }
  }));

  const filteredSpecies = isAddingMode && preferences.scientificNameSuggestions && newSpeciesName.trim().length > 0
    ? Array.from(allUniqueSpecies.values()).filter(s => 
        (s.name.toLowerCase().includes(newSpeciesName.toLowerCase()) || 
         s.family.toLowerCase().includes(newSpeciesName.toLowerCase())) && 
        s.name.toLowerCase() !== newSpeciesName.trim().toLowerCase()
      )
    : [];

  const uniqueFamiliesList = Array.from(new Set(Array.from(allUniqueSpecies.values()).map(s => s.family))).filter(f => f && f !== 'Unknown');

  const filteredFamilies = isAddingMode && preferences.scientificNameSuggestions && newSpeciesFamily.trim().length > 0
    ? uniqueFamiliesList.filter(f => 
        f.toLowerCase().includes(newSpeciesFamily.toLowerCase()) && 
        f.toLowerCase() !== newSpeciesFamily.trim().toLowerCase()
      )
    : [];

  return (
    <div className="flex flex-col h-full bg-[#FDFCF8] font-sans">
      {/* Top Survey Meta Bar */}
      <div className="bg-mint border-b border-forest/10 px-4 md:px-6 py-3 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link 
              href={`/surveys/${surveyId}`}
              className="p-2 rounded-lg hover:bg-mint/50 transition-colors text-moss/70 hover:text-charcoal"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </Link>
            <div>
              <h1 className="text-[15px] font-semibold text-charcoal">{projectName}</h1>
              <p className="text-[12.5px] text-moss/70">{survey.sampleSite} • Recording {numQuadrats} Quadrats</p>
            </div>
          </div>
          <Link 
            href={`/surveys/${surveyId}`}
            className="hidden sm:inline-flex bg-white hover:bg-mint/50 text-[13px] text-charcoal px-4 py-1.5 rounded-lg border border-forest/15 transition-colors font-medium items-center shadow-sm"
          >
            Complete Config
          </Link>
        </div>
      </div>

      {/* Quadrat Navigator */}
      <div className="bg-white border-b border-forest/10 px-4 py-6 sticky top-[62px] z-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={prevQuadrat}
              disabled={currentQuadrat === 0}
              className="p-2 rounded-lg border border-forest/10 text-moss/60 disabled:opacity-50 disabled:bg-slate-50 hover:bg-mint/50 hover:text-charcoal transition-colors"
            >
              <ChevronLeft className="w-[18px] h-[18px]" />
            </button>

            <div className="text-center">
              <span className="text-charcoal font-semibold text-[16px]">Quadrat {currentQuadratNumber}</span>
              <p className="text-[12px] font-medium text-moss/50 mt-0.5 uppercase tracking-widest">of {numQuadrats}</p>
            </div>

            <button 
              onClick={nextQuadrat}
              disabled={currentQuadrat === numQuadrats - 1}
              className="p-2 rounded-lg border border-forest/10 text-moss/60 disabled:opacity-50 disabled:bg-slate-50 hover:bg-mint/50 hover:text-charcoal transition-colors"
            >
              <ChevronRight className="w-[18px] h-[18px]" />
            </button>
          </div>
          
          {/* Quadrat pips */}
          <div className="max-w-md mx-auto flex flex-wrap justify-center gap-1.5 min-h-[8px]">
            {Array.from({ length: numQuadrats }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setQuadrat(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentQuadrat ? "w-6 bg-forest" : "w-1.5 bg-sage hover:bg-sage/80"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Species List for CURRENT Quadrat */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-5xl mx-auto w-full space-y-4">
          
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-[16px] font-semibold text-charcoal">Species Present</h2>
            <p className="text-[12px] text-moss/60 font-medium uppercase tracking-widest">Record observations</p>
          </div>

          {/* Quick Add Form */}
          {isAddingMode ? (
            <form onSubmit={handleAddSpecies} className="bg-white p-5 rounded-xl border border-forest/20 shadow-sm mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-forest"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 mt-1">
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-semibold tracking-widest text-moss/60 uppercase">Scientific Name</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    placeholder="e.g. Quercus alba"
                    value={newSpeciesName}
                    onChange={(e) => setNewSpeciesName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-forest/15 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/30 font-medium text-charcoal bg-white text-[13.5px]"
                  />
                  {filteredSpecies.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-forest/10 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {filteredSpecies.map(s => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => {
                            setNewSpeciesName(s.name);
                            setNewSpeciesFamily(s.family);
                          }}
                          className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-mint hover:text-forest border-b last:border-0 border-forest/5 transition-colors"
                        >
                          <div className="font-medium text-charcoal">{s.name}</div>
                          <div className="text-[11px] text-moss/60 mt-0.5">{s.family}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-semibold tracking-widest text-moss/60 uppercase">Family (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Fagaceae"
                    value={newSpeciesFamily}
                    onChange={(e) => setNewSpeciesFamily(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-forest/15 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/30 font-medium text-charcoal bg-white text-[13.5px]"
                  />
                  {filteredFamilies.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-forest/10 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {filteredFamilies.map((f, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setNewSpeciesFamily(f);
                          }}
                          className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-mint hover:text-forest border-b last:border-0 border-forest/5 transition-colors"
                        >
                          <div className="font-medium text-charcoal">{f}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-widest text-moss/60 uppercase">Stratum</label>
                  <select
                    value={newSpeciesStratum}
                    onChange={(e) => setNewSpeciesStratum(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-forest/15 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/30 font-medium text-charcoal bg-white text-[13.5px]"
                  >
                    <option value="">Select stratum...</option>
                    <option value="Canopy (>20m)">Canopy (&gt;20m)</option>
                    <option value="Sub-canopy">Sub-canopy</option>
                    <option value="Understory">Understory</option>
                    <option value="Ground layer">Ground layer</option>
                    <option value="Lianas/epiphytes">Lianas/epiphytes</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-widest text-moss/60 uppercase">Notes (Optional)</label>
                  <select
                    value={newSpeciesNotes}
                    onChange={(e) => setNewSpeciesNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-forest/15 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/30 font-medium text-charcoal bg-white text-[13.5px]"
                  >
                    <option value="">Select note...</option>
                    <option value="Dominant">Dominant</option>
                    <option value="emergent">emergent</option>
                    <option value="Pioneer">Pioneer</option>
                    <option value="Co-dominant">Co-dominant</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="bg-forest hover:bg-forest-mid text-white flex-1 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors shadow-sm"
                >
                  Record Present
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAddingMode(false)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-6 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingMode(true)}
              className="w-full bg-mint border border-forest/15 hover:border-forest/30 hover:bg-mint/80 text-forest py-4 rounded-xl text-[14px] font-medium transition-all flex items-center justify-center space-x-2 shadow-sm mb-6"
            >
              <Plus className="w-[18px] h-[18px]" />
              <span>Log New Species Record</span>
            </button>
          )}

          {/* List of previously recorded species over ANY quadrat */}
          {speciesList.length > 0 ? (
            <div className="space-y-3">
              {speciesList.map((species) => {
                const isPresentInCurrent = species.quadrats[currentQuadrat] > 0;
                
                return (
                  <div key={species.id} className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all shadow-sm",
                    isPresentInCurrent ? "bg-white border-forest/30" : "bg-mint/10 border-forest/5"
                  )}>
                    <div className="flex-1 pr-4">
                      <h3 className={cn("text-[14.5px] font-semibold", isPresentInCurrent ? "text-charcoal" : "text-moss/70")}>
                        {species.name}
                      </h3>
                      <p className="text-[12.5px] text-moss/60 mt-0.5">
                        {species.family}
                        {species.stratum && ` • ${species.stratum}`}
                        {species.notes && ` • ${species.notes}`}
                      </p>
                      
                      {/* Show history across quadrats mini-view */}
                      <div className="flex items-end space-x-1 mt-3 h-4">
                        {species.quadrats.map((val, qIdx) => (
                          <div 
                            key={qIdx} 
                            style={{ height: val > 0 ? `${Math.min(100, Math.max(30, val * 15))}%` : '30%' }}
                            className={cn(
                              "w-1.5 rounded-sm transition-all duration-300",
                              val > 0 
                                ? (qIdx === currentQuadrat ? "bg-[#3d7a52]" : "bg-[#7aab8a]") 
                                : "bg-slate-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {!isPresentInCurrent ? (
                        <button
                          onClick={() => updateSpeciesPresence(survey.id, species.id, currentQuadrat, 1)}
                          className="bg-white border border-forest/15 hover:border-forest/40 hover:text-forest hover:bg-mint/30 text-moss/50 w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm"
                          aria-label={`Mark ${species.name} present`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1.5 bg-mint/20 border border-forest/20 rounded-xl p-1 shadow-sm">
                          <button
                            onClick={() => updateSpeciesPresence(survey.id, species.id, currentQuadrat, species.quadrats[currentQuadrat] - 1)}
                            className="bg-white hover:bg-mint text-forest w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm border border-forest/10"
                            aria-label="Decrease"
                          >
                            <Minus className="w-[18px] h-[18px]" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={species.quadrats[currentQuadrat]}
                            onChange={(e) => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val) || val < 0) val = 0;
                              updateSpeciesPresence(survey.id, species.id, currentQuadrat, val);
                            }}
                            className="w-12 text-center text-charcoal font-semibold text-[14px] bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-forest/30 rounded"
                          />
                          <button
                            onClick={() => updateSpeciesPresence(survey.id, species.id, currentQuadrat, species.quadrats[currentQuadrat] + 1)}
                            className="bg-forest hover:bg-forest-mid text-white w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm"
                            aria-label="Increase"
                          >
                            <Plus className="w-[18px] h-[18px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white border border-[#EAE7E0] rounded-2xl border-dashed">
              <Scan className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No species logged yet.</p>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Tap &quot;Log New Species Record&quot; to add your first find.</p>
            </div>
          )}
          {/* Tabular Representation */}
          {speciesList.length > 0 && (
            <div className="mt-12 bg-white border border-forest/10 rounded-2xl shadow-sm overflow-hidden pb-safe">
              <div className="p-5 border-b border-forest/10 bg-mint">
                <h3 className="text-[15px] font-semibold text-charcoal">Species Distribution Summary</h3>
                <p className="text-[13px] text-moss/70 mt-0.5">Frequency and abundance across all quadrats</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap min-w-max">
                  <thead className="bg-mint border-b border-forest/10">
                    <tr>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-moss/60 uppercase tracking-widest">Species Name</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-moss/60 uppercase tracking-widest">Family</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-forest uppercase tracking-widest bg-mint/30 border-x border-forest/5 text-center">Total</th>
                      {Array.from({ length: numQuadrats }).map((_, idx) => (
                        <th key={`th-q${idx}`} className="px-4 py-3.5 text-[11px] font-semibold text-moss/60 uppercase tracking-widest text-center">Q{idx + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest/5">
                    {speciesList.map((species) => {
                      const totalAbundance = species.quadrats.reduce((sum, val) => sum + val, 0);
                      return (
                        <tr key={`row-${species.id}`} className="hover:bg-mint/30 transition-colors group">
                          <td className="px-5 py-4 font-semibold text-charcoal text-[13.5px]">{species.name}</td>
                          <td className="px-5 py-4 text-moss/70 text-[13px]">{species.family}</td>
                          <td className="px-5 py-4 bg-mint/10 group-hover:bg-mint/40 text-forest font-bold text-[14px] border-x border-forest/5 text-center transition-colors">{totalAbundance}</td>
                          {species.quadrats.map((val, idx) => (
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
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
