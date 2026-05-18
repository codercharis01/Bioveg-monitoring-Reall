'use client';

import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Download, ChevronDown, Check } from 'lucide-react';
import { useSurveyStore } from '@/lib/store';
import { cn } from '@/lib/utils';

import PhytosociologyParameters from '../phytosociology/page';
import { calculateBiodiversityIndices, exportToExcel, exportToPDF } from '@/lib/export-utils';

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border text-[13px] border-slate-200 p-3 rounded-xl shadow-sm">
        <p className="font-semibold text-charcoal">{payload[0].payload.fullName || label}</p>
        <p className="text-moss">{payload[0].value} Individuals</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border text-[13px] border-slate-200 p-3 rounded-xl shadow-sm">
        <p className="font-semibold text-charcoal">{payload[0].name}</p>
        <p className="text-moss">{payload[0].value}% Coverage</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const surveys = useSurveyStore(state => state.surveys);
  const profile = useSurveyStore(state => state.profile);
  const preferences = useSurveyStore(state => state.preferences);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Combine species data based on selection
  const targetSurveys = selectedSurveyId === 'all' 
    ? surveys 
    : surveys.filter(s => s.id === selectedSurveyId);

  const selectedProjectName = selectedSurveyId === 'all' 
    ? 'All Projects' 
    : surveys.find(s => s.id === selectedSurveyId)?.projectName || 'Select Project';

  const handleExport = async () => {
    if (targetSurveys.length === 0) return;
    
    // For single survey, offer PDF, for many use Excel
    if (targetSurveys.length === 1) {
      exportToPDF(`${targetSurveys[0].projectName}_Diversity_Report`, targetSurveys[0], profile, preferences);
    } else {
      const { shannon, simpson, richness, evenness } = calculateBiodiversityIndices(targetSurveys);
      const summaryData = [{
        'Report Type': 'Aggregated Diversity Report',
        'Projects Included': targetSurveys.length,
        'Shannon (H\')': shannon.toFixed(3),
        'Simpson (D)': simpson.toFixed(3),
        'Species Richness (S)': richness,
        'Evenness (J)': evenness.toFixed(3),
        'Generated At': new Date().toLocaleString()
      }];
      
      const speciesAbundance = targetSurveys.flatMap(s => s.speciesList).map(s => ({
        'Species': s.name,
        'Family': s.family,
        'Stratum': s.stratum,
        'Total Abundance': s.quadrats.reduce((a, b) => a + b, 0)
      }));

      exportToExcel(`${selectedProjectName}_Diversity_Analytics`, [
        { name: 'Summary', data: summaryData },
        { name: 'Species Data', data: speciesAbundance }
      ]);
    }
  };

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const { shannon, simpson, richness, evenness, familyData, strataData } = useMemo(() => {
    const indices = calculateBiodiversityIndices(targetSurveys);
    const familyAbundance = indices.familyAbundance;
    const strataAbundance = indices.strataAbundance;
    
    // Prepare family bar chart data
    const sortedFamilies = Array.from(familyAbundance.entries())
      .map(([name, count]) => ({ name: name.substring(0, 6) + '.', fullName: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalStrataCount = Array.from(strataAbundance.values()).reduce((a, b) => a + b, 0);
    const baseColors = ['#1B4D3E', '#4B8B62', '#8ABF9A', '#A5D6B6', '#E5EFE8', '#F5CDA7', '#D4A373', '#CCD5AE', '#E9EDC9', '#FEFAE0'];
    const calculatedStrataData = Array.from(strataAbundance.entries())
      .map(([name, count], index) => ({
        name,
        value: totalStrataCount > 0 ? Math.round((count / totalStrataCount) * 100) : 0,
        color: baseColors[index % baseColors.length]
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      shannon: indices.shannon,
      simpson: indices.simpson,
      richness: indices.richness,
      evenness: indices.evenness,
      familyData: sortedFamilies,
      strataData: calculatedStrataData
    };
  }, [targetSurveys]);


  if (!mounted) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "max-w-[1400px] mx-auto pb-10 space-y-6 animate-in fade-in block"
      )}>

        
        {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>Diversity Indices Analytics</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {selectedProjectName} · All sites · {new Date().getFullYear()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white/70 border border-forest/15 rounded-lg shadow-sm min-w-[200px] text-[14.5px] text-charcoal font-medium hover:bg-forest/5 transition-colors focus:ring-2 focus:ring-forest/20 outline-none backdrop-blur-md"
            >
              <span className="truncate">{selectedProjectName}</span>
              <ChevronDown className="w-4 h-4 text-moss/60 flex-shrink-0" />
            </button>
            
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-full min-w-[220px] bg-white border border-forest/10 rounded-lg shadow-xl overflow-hidden py-1 z-20">
                  <div className="max-h-[300px] overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedSurveyId('all');
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-[14.5px] transition-colors flex items-center justify-between",
                        selectedSurveyId === 'all' 
                          ? "bg-blue-600 text-white font-medium" 
                          : "text-charcoal hover:bg-mint/50"
                      )}
                    >
                      <span className="truncate pr-2">All Projects</span>
                      {selectedSurveyId === 'all' && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                    </button>
                    {surveys.map(survey => (
                      <button
                        key={survey.id}
                        onClick={() => {
                          setSelectedSurveyId(survey.id);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-[14.5px] transition-colors flex items-center justify-between",
                          selectedSurveyId === survey.id 
                            ? "bg-blue-600 text-white font-medium" 
                            : "text-charcoal hover:bg-mint/50"
                        )}
                      >
                        <span className="truncate pr-2">{survey.projectName}</span>
                        {selectedSurveyId === survey.id && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={handleExport}
            disabled={targetSurveys.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1f3a2c] text-white rounded-lg text-[14.5px] font-medium hover:bg-[#15271e] transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-[16px] h-[16px]" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-forest/10">
          <h3 className="text-moss/60 text-[12px] font-bold tracking-wider uppercase mb-1">Shannon Diversity Index</h3>
          <p className="text-[40px] font-bold text-charcoal leading-none mb-2">
            {shannon.toFixed(2)}
          </p>
          <div className="text-[13px] text-moss/70 font-mono mb-4">
            H&apos; = -Σ p<sub className="font-sans">i</sub> ln(p<sub className="font-sans">i</sub>)
          </div>
          <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
            <div className="h-full bg-forest rounded-full" style={{ width: `${Math.min(100, (shannon / 5) * 100)}%` }} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-forest/10">
          <h3 className="text-moss/60 text-[12px] font-bold tracking-wider uppercase mb-1">Simpson&apos;s Index</h3>
          <p className="text-[40px] font-bold text-charcoal leading-none mb-2">
            {simpson.toFixed(2)}
          </p>
          <div className="text-[13px] text-moss/70 font-mono mb-4">
            D = 1 - Σ(n<sub className="font-sans">i</sub>/N)²
          </div>
          <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
            <div className="h-full bg-forest-mid rounded-full" style={{ width: `${Math.min(100, simpson * 100)}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-forest/10">
          <h3 className="text-moss/60 text-[12px] font-bold tracking-wider uppercase mb-1">Species Richness (S)</h3>
          <p className="text-[40px] font-bold text-charcoal leading-none mb-2">
            {richness}
          </p>
          <div className="text-[13px] text-moss/70 font-mono mb-4">
            Total distinct species
          </div>
          <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#8b7355] rounded-full" style={{ width: `${Math.min(100, (richness / 500) * 100)}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-forest/10">
          <h3 className="text-moss/60 text-[12px] font-bold tracking-wider uppercase mb-1">Evenness (Pielou&apos;s J)</h3>
          <p className="text-[40px] font-bold text-charcoal leading-none mb-2">
            {evenness.toFixed(2)}
          </p>
          <div className="text-[13px] text-moss/70 font-mono mb-4">
            J = H&apos; / ln(S)
          </div>
          <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, evenness * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Family bar chart */}
        <div className="bg-white border border-forest/10 rounded-2xl p-6 shadow-sm min-h-[350px] flex flex-col">
          <div className="mb-6">
            <h2 className="text-[16px] font-semibold text-charcoal">Species Abundance Distribution</h2>
            <p className="text-[13.5px] text-moss/70">Top 10 families by individual count</p>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full mt-auto" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="99%" height={250}>
              <BarChart data={familyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE7E0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={true} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 11, fontFamily: 'monospace'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  allowDecimals={false}
                />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {familyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#27523a' : '#dcf1e6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strata donut chart */}
        <div className="bg-white border border-forest/10 rounded-2xl p-6 shadow-sm min-h-[350px] flex flex-col">
          <div className="mb-6">
            <h2 className="text-[16px] font-semibold text-charcoal">Vegetation Strata Distribution</h2>
            <p className="text-[13.5px] text-moss/70">Coverage by canopy layer</p>
          </div>

          <div className="flex-1 w-full flex items-center justify-center">
            <div className="w-full max-w-[450px] flex flex-col gap-6 md:gap-0 md:flex-row md:items-center">
              <div className="w-full md:flex-1 h-[220px] relative">
                <ResponsiveContainer width="99%" height={220}>
                  <PieChart>
                    <Pie
                      data={strataData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {strataData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text manually */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[18px] font-bold text-charcoal leading-none">{richness}</span>
                  <span className="text-[10px] text-moss/60 mt-1 uppercase tracking-wider font-semibold">species</span>
                </div>
              </div>
              
              <div className="w-full md:w-[180px] grid grid-cols-2 md:grid-cols-1 md:flex md:flex-col gap-3 md:pl-4 md:border-l md:border-t-0 border-t pt-4 md:pt-0 border-forest/10">
                {strataData.map((strata, i) => (
                  <div key={i} className="flex justify-between items-center text-[13px] px-2 md:px-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: strata.color }} />
                      <span className="text-moss/80">{strata.name}</span>
                    </div>
                    <span className="font-semibold text-charcoal">{strata.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <div className="md:hidden block mt-12 animate-in fade-in">
        <PhytosociologyParameters />
      </div>
    </>
  );
}

