'use client';

import { useState, useMemo } from 'react';
import { useSurveyStore } from '@/lib/store';
import { Download, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculatePhytoParameters, exportToCSV, exportToPDF } from '@/lib/export-utils';

export default function PhytosociologyParameters() {
  const surveys = useSurveyStore(state => state.surveys);
  const profile = useSurveyStore(state => state.profile);
  const preferences = useSurveyStore(state => state.preferences);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [quadratSize, setQuadratSize] = useState<number>(1);

  const targetSurveys = selectedSurveyId === 'all' ? surveys : surveys.filter(s => s.id === selectedSurveyId);
  const selectedProjectName = selectedSurveyId === 'all' 
    ? 'All Projects' 
    : surveys.find(s => s.id === selectedSurveyId)?.projectName || 'Select Project';

  const { parameters, totals: computedTotals } = useMemo(() => 
    calculatePhytoParameters(targetSurveys, quadratSize)
  , [targetSurveys, quadratSize]);

  const metricsMap = useMemo(() => {
    const map = new Map();
    parameters.forEach(p => map.set(p.id, p));
    return map;
  }, [parameters]);

  const speciesList = parameters;

  let sortedSpecies = [...speciesList];
  if (sortConfig !== null) {
    sortedSpecies.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof typeof a];
      let bValue: any = b[sortConfig.key as keyof typeof b];
      
      const m_a = metricsMap.get(a.id);
      const m_b = metricsMap.get(b.id);

      if (sortConfig.key === 'abundance') { aValue = m_a?.A || 0; bValue = m_b?.A || 0; }
      else if (sortConfig.key === 'n') { aValue = m_a?.n || 0; bValue = m_b?.n || 0; }
      else if (sortConfig.key === 'frequency') { aValue = m_a?.F || 0; bValue = m_b?.F || 0; }
      else if (sortConfig.key === 'density') { aValue = m_a?.D || 0; bValue = m_b?.D || 0; }
      else if (sortConfig.key === 'ra') { aValue = m_a?.RA || 0; bValue = m_b?.RA || 0; }
      else if (sortConfig.key === 'rf') { aValue = m_a?.RF || 0; bValue = m_b?.RF || 0; }
      else if (sortConfig.key === 'rd') { aValue = m_a?.RD || 0; bValue = m_b?.RD || 0; }
      else if (sortConfig.key === 'af') { aValue = m_a?.AF || 0; bValue = m_b?.AF || 0; }
      else if (sortConfig.key === 'ivi') { aValue = m_a?.IVI || 0; bValue = m_b?.IVI || 0; }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    if (speciesList.length === 0) return;

    if (targetSurveys.length === 1) {
      exportToPDF(`${targetSurveys[0].projectName}_Phyto_Report`, targetSurveys[0], profile, preferences);
    } else {
      const headers = ["No.", "Species Name", "Family", "N", "A", "F(%)", "D(m²)", "R.A(%)", "R.D(%)", "R.F(%)", "A/F", "IVI"];
      const rows = sortedSpecies.map((m, i) => [
        i + 1,
        m.name,
        m.family || '',
        m.n,
        m.A.toFixed(2),
        m.F.toFixed(2),
        m.D.toFixed(2),
        m.RA.toFixed(2),
        m.RD.toFixed(2),
        m.RF.toFixed(2),
        m.AF.toFixed(4),
        m.IVI.toFixed(2)
      ]);
      
      // Add Totals row
      rows.push([
        "", "TOTAL", "", computedTotals.n, computedTotals.A.toFixed(2), computedTotals.F.toFixed(2), computedTotals.D.toFixed(2), 
        computedTotals.RA.toFixed(2), computedTotals.RD.toFixed(2), computedTotals.RF.toFixed(2), computedTotals.AF.toFixed(4), computedTotals.IVI.toFixed(2)
      ]);

      exportToCSV(`${selectedProjectName}_Phyto_Parameters`, headers, rows as any);
    }
  };

  let sumRowN = computedTotals.n;
  let sumRowA = computedTotals.A;
  let sumRowF = computedTotals.F;
  let sumRowD = computedTotals.D;
  let sumRowRA = computedTotals.RA;
  let sumRowRD = computedTotals.RD;
  let sumRowRF = computedTotals.RF;
  let sumRowAF = computedTotals.AF;
  let sumRowIVI = computedTotals.IVI;

  return (
    <div className="max-w-[1200px] mx-auto pb-10 space-y-6">
      
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-charcoal tracking-tight">Phytosociological Parameters</h1>
          <p className="text-[13.5px] text-moss/70 mt-1">Review calculated indices (IVI, Frequency, Density, etc.) for your plant surveys.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <label className="text-[12px] font-medium text-moss/70 tracking-wide uppercase">Quadrat Size (m²)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={quadratSize}
              onChange={(e) => setQuadratSize(parseFloat(e.target.value) || 1)}
              className="w-16 px-2 py-1.5 border border-forest/20 rounded-md text-[13px] focus:ring-2 focus:ring-forest/20 focus:border-forest outline-none text-charcoal font-mono"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between gap-2 px-4 py-2 bg-white border border-forest/20 rounded-lg shadow-sm min-w-[200px] text-[14px] text-charcoal font-medium hover:bg-forest/5 transition-colors focus:ring-2 focus:ring-forest/20 outline-none"
            >
              <span className="truncate">{selectedProjectName}</span>
              <ChevronDown className="w-4 h-4 text-moss/60 flex-shrink-0" />
            </button>
            
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-full min-w-[200px] bg-white border border-forest/10 rounded-lg shadow-xl overflow-hidden py-1 z-20">
                  <div className="max-h-[300px] overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedSurveyId('all');
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[13.5px] transition-colors flex items-center justify-between",
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
                          "w-full text-left px-3 py-2 text-[13.5px] transition-colors flex items-center justify-between",
                          selectedSurveyId === survey.id 
                            ? "bg-blue-600 text-white font-medium" 
                            : "text-charcoal hover:bg-mint/50"
                        )}
                      >
                        <span className="truncate pr-2">{survey.projectName}</span>
                        {selectedSurveyId === survey.id && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                      </button>
                    ))}
                    {surveys.length === 0 && (
                      <div className="px-3 py-3 text-[13px] text-moss/60 text-center">No projects found.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={handleExport}
            disabled={speciesList.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-forest text-white rounded-lg text-[14px] font-medium hover:bg-forest-mid transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-[16px] h-[16px]" />
            Export
          </button>
        </div>
      </div>

      {/* Main Content Table */}
      {targetSurveys.length > 0 ? (
        <div className="bg-white border border-forest/10 rounded-[16px] flex flex-col shadow-sm min-h-[400px]">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr>
                <th className="w-12 px-3 py-3.5 text-[11px] font-semibold text-moss/70 text-center bg-mint/50 border-b border-forest/10 uppercase tracking-wider">#</th>
                <th 
                  className="px-3 py-3.5 text-[11px] font-semibold text-moss/70 text-left bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-1">Species Name {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
                </th>
                <th 
                  className="px-3 py-3.5 text-[11px] font-semibold text-moss/70 text-left bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('family')}
                >
                  <div className="flex items-center gap-1">Family {sortConfig?.key === 'family' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
                </th>
                <th 
                  className="px-2 py-3.5 text-[11px] font-semibold text-moss/70 text-right bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('n')}
                  title="Total Number of Individuals"
                >
                  N {sortConfig?.key === 'n' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  className="px-2 py-3.5 text-[11px] font-semibold text-moss/70 text-right bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('abundance')}
                  title="Abundance (A)"
                >
                  A {sortConfig?.key === 'abundance' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  className="px-2 py-3.5 text-[11px] font-semibold text-moss/70 text-right bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('frequency')}
                  title="Frequency (F%)"
                >
                  F(%) {sortConfig?.key === 'frequency' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  className="px-2 py-3.5 text-[11px] font-semibold text-moss/70 text-right bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('density')}
                  title="Density (D) in m²"
                >
                  D(m²) {sortConfig?.key === 'density' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  className="px-2 py-3.5 text-[11px] font-semibold text-moss/70 text-right bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('ra')}
                  title="Relative Abundance (R.A%)"
                >
                  R.A(%) {sortConfig?.key === 'ra' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  className="px-2 py-3.5 text-[11px] font-semibold text-moss/70 text-right bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('rd')}
                  title="Relative Density (R.D%)"
                >
                  R.D(%) {sortConfig?.key === 'rd' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  className="px-2 py-3.5 text-[11px] font-semibold text-moss/70 text-right bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('rf')}
                  title="Relative Frequency (R.F%)"
                >
                  R.F(%) {sortConfig?.key === 'rf' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  className="px-2 py-3.5 text-[11px] font-semibold text-moss/70 text-right bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('af')}
                  title="Abundance/Frequency Ratio (A/F)"
                >
                  A/F {sortConfig?.key === 'af' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  className="px-3 py-3.5 text-[11px] font-semibold text-forest-mid text-right bg-mint/50 border-b border-forest/10 uppercase tracking-wider cursor-pointer hover:bg-mint transition-colors"
                  onClick={() => requestSort('ivi')}
                  title="Important Value Index (IVI)"
                >
                  IVI {sortConfig?.key === 'ivi' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSpecies.length > 0 ? (
                sortedSpecies.map((s, i) => {
                  const m = metricsMap.get(s.id) || { n:0, A:0, F:0, D:0, RA:0, RF:0, RD:0, AF:0, IVI:0 };
                  return (
                  <tr key={s.id} className="border-b border-forest/5 hover:bg-mint/30 transition-colors group">
                    <td className="px-3 py-3 text-[12px] text-moss/60 font-mono text-center">
                      {(i + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-charcoal">{s.name}</div>
                      {s.localName && <div className="text-[11.5px] text-moss/70 italic mt-0.5">{s.localName}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block px-1.5 py-0.5 bg-sage-pale/60 text-forest-mid rounded text-[11px] font-medium" title={s.family || 'Unknown'}>
                        {s.family || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="text-[12.5px] font-mono font-medium text-charcoal">{m.n}</span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="text-[12.5px] font-mono text-charcoal/80">{m.A.toFixed(1)}</span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="text-[12.5px] font-mono text-charcoal/80">{m.F.toFixed(1)}</span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="text-[12.5px] font-mono text-charcoal/80">{m.D.toFixed(2)}</span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="text-[12.5px] font-mono text-charcoal/80 bg-blue-50/50 px-1 py-0.5 rounded">{m.RA.toFixed(1)}</span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="text-[12.5px] font-mono text-charcoal/80 bg-blue-50/50 px-1 py-0.5 rounded">{m.RD.toFixed(1)}</span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="text-[12.5px] font-mono text-charcoal/80 bg-blue-50/50 px-1 py-0.5 rounded">{m.RF.toFixed(1)}</span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="text-[12.5px] font-mono text-charcoal/80">{m.AF.toFixed(3)}</span>
                    </td>
                    <td className="px-3 py-3 text-right bg-sage-pale/20 group-hover:bg-sage-pale/40 transition-colors">
                      <span className="text-[13px] font-mono font-bold text-forest-mid">{m.IVI.toFixed(1)}</span>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <p className="text-[14px] font-medium text-charcoal">No records found</p>
                    <p className="text-[13px] text-moss/70 mt-1">Select a survey with species data to view parameters.</p>
                  </td>
                </tr>
              )}
              {sortedSpecies.length > 0 && (
                <tr className="border-t-2 border-forest/20 bg-mint/20 font-bold">
                  <td colSpan={3} className="px-3 py-4 text-[12px] text-right uppercase tracking-wider text-charcoal">
                    TOTAL
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-[12.5px] font-mono text-charcoal">{sumRowN}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-[12.5px] font-mono text-charcoal">{sumRowA.toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-[12.5px] font-mono text-charcoal">{sumRowF.toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-[12.5px] font-mono text-charcoal">{sumRowD.toFixed(2)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-[12.5px] font-mono text-charcoal">{sumRowRA.toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-[12.5px] font-mono text-charcoal">{sumRowRD.toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-[12.5px] font-mono text-charcoal">{sumRowRF.toFixed(1)}</span>
                  </td>
                  <td className="px-2 py-4 text-right">
                    <span className="text-[12.5px] font-mono text-charcoal">{sumRowAF.toFixed(3)}</span>
                  </td>
                  <td className="px-3 py-4 text-right text-forest-mid">
                    <span className="text-[13px] font-mono">{sumRowIVI.toFixed(1)}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-forest/10 rounded-[16px] p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-[14px] font-medium text-charcoal">No project selected</p>
          <p className="text-[13px] text-moss/70 mt-1">Please create or select a project from the dropdown above.</p>
        </div>
      )}
    </div>
  );
}
