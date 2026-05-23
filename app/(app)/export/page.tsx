'use client';

import { useState, useMemo } from 'react';
import { Download, FileText, Filter, ChevronDown, Calendar, Search } from 'lucide-react';
import { useSurveyStore } from '@/lib/store';
import { cn, formatCoordinate } from '@/lib/utils';
import { calculateBiodiversityIndices, calculatePhytoParameters, exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils';

export default function ExportPage() {
  const surveys = useSurveyStore(state => state.surveys) || [];
  const profile = useSurveyStore(state => state.profile);
  const preferences = useSurveyStore(state => state.preferences);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedSurveyId, setSelectedSurveyId] = useState(surveys[0]?.id || '');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const selectedSurvey = surveys.find(s => s?.id === selectedSurveyId) || surveys[0];

  const { shannon, simpson, richness, evenness, totalAbundance, familyAbundance } = useMemo(() => {
    if (!selectedSurvey) return { shannon: 0, simpson: 0, richness: 0, evenness: 0, totalAbundance: 0, familyAbundance: new Map() };
    return calculateBiodiversityIndices([selectedSurvey]);
  }, [selectedSurvey]);

  const familiesRecorded = familyAbundance.size;
  
  const phyto = useMemo(() => {
    if (!selectedSurvey) return null;
    // Extract quadrat size from text like "20 × 20 m (400 m²)"
    const qSizeText = selectedSurvey.quadratSize || '1';
    const qAreaMatch = qSizeText.match(/\((\d+)\s*m²\)/) || qSizeText.match(/(\d+)\s*m²/);
    const qArea = qAreaMatch ? parseInt(qAreaMatch[1], 10) : 1;
    return calculatePhytoParameters([selectedSurvey], qArea);
  }, [selectedSurvey]);

  const topSpecies = useMemo(() => {
    if (!phyto) return null;
    return [...phyto.parameters].sort((a, b) => b.IVI - a.IVI)[0];
  }, [phyto]);

  const handleDownload = async () => {
    if (!selectedSurvey) return showToast('No survey selected.');
    
    if (selectedFormat === 'csv') {
      const headers = ["Scientific Name", "Family", "Stratum", "Notes", "Total Abundance", ...Array.from({length: selectedSurvey.numQuadrats}).map((_, i) => `Q${i+1}`)];
      const rows = selectedSurvey.speciesList.map(s => [
        s.name,
        s.family || '',
        s.stratum || '',
        s.notes || '',
        s.quadrats.reduce((a, b) => a + b, 0),
        ...s.quadrats
      ]);
      exportToCSV(`${selectedSurvey.projectName}_data`, headers, rows);
    } else if (selectedFormat === 'excel') {
      const speciesData = selectedSurvey.speciesList.map(s => ({
        'Scientific Name': s.name,
        'Family': s.family,
        'Stratum': s.stratum,
        'Notes': s.notes,
        'Total Abundance': s.quadrats.reduce((a, b) => a + b, 0),
        ...Object.fromEntries(s.quadrats.map((val, idx) => [`Q${idx + 1}`, val]))
      }));
      
      const parametersData = phyto?.parameters.map(p => ({
        'Species': p.name,
        'Family': p.family,
        'N (Abundance)': p.n,
        'F (Frequency %)': p.F.toFixed(2),
        'D (Density)': p.D.toFixed(3),
        'R.A (%)': p.RA.toFixed(2),
        'R.D (%)': p.RD.toFixed(2),
        'R.F (%)': p.RF.toFixed(2),
        'IVI': p.IVI.toFixed(2)
      })) || [];

      await exportToExcel(`${selectedSurvey.projectName}_full_report`, [
        { name: 'Species List', data: speciesData },
        { name: 'Parameters', data: parametersData },
        { name: 'Summary', data: [{
            'Shannon Index': shannon.toFixed(3),
            'Simpson Index': simpson.toFixed(3),
            'Richness': richness,
            'Evenness': evenness.toFixed(3)
          }] 
        }
      ]);
    } else if (selectedFormat === 'pdf') {
      await exportToPDF(`${selectedSurvey.projectName}_report`, selectedSurvey, profile, preferences);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-emerald-950 tracking-tight">Export & Reports</h1>
          <p className="text-sm text-moss/70 mt-1">Generate scientific reports and data exports</p>
        </div>
        <div className="flex flex-col gap-1.5 w-full md:w-auto">
          <label className="text-[11px] text-moss/60 font-medium uppercase tracking-wider">Select Survey</label>
          <select 
            value={selectedSurveyId}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
            className="w-full md:min-w-[200px] px-3 py-2 bg-white border border-forest/10 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/20 shadow-sm"
          >
            {surveys.map(s => (
              <option key={s.id} value={s.id}>{s.projectName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="export-grid">
        <div className={cn("export-card", selectedFormat === 'csv' && "selected")} onClick={() => setSelectedFormat('csv')}>
          <div className="export-icon ei-csv">
            <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2h9l5 5v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M13 2v5h5"/><path d="M7 13h8M7 17h5"/></svg>
          </div>
          <div className="export-format">CSV Export</div>
          <div className="export-desc">Raw species data, coordinates, abundance records</div>
        </div>
        <div className={cn("export-card", selectedFormat === 'excel' && "selected")} onClick={() => setSelectedFormat('excel')}>
          <div className="export-icon ei-excel">
            <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2h9l5 5v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M13 2v5h5"/><path d="M8 10l2.5 5M10.5 10L8 15M13 10v5M15 10h-2v5h2"/></svg>
          </div>
          <div className="export-format">Excel Workbook</div>
          <div className="export-desc">Multi-sheet formatted workbook with charts</div>
        </div>
        <div className={cn("export-card", selectedFormat === 'pdf' && "selected")} onClick={() => setSelectedFormat('pdf')}>
          <div className="export-icon ei-pdf">
            <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2h9l5 5v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M13 2v5h5"/><path d="M7 13c0-1.1.9-2 2-2h1.5a1.5 1.5 0 010 3H7M7 14h3"/></svg>
          </div>
          <div className="export-format">PDF Report</div>
          <div className="export-desc">Print-ready scientific report with all analytics</div>
        </div>
      </div>

      <div className="report-preview">
        {!selectedSurvey ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No survey selected or available.
          </div>
        ) : (
          <>
            <div className="report-preview-header">
              <div>
                <h2>{selectedSurvey.projectName} — {selectedSurvey.date} Report</h2>
                <p>Generated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {selectedSurvey.researcherName}</p>
              </div>
              <span className="report-badge">Draft Preview</span>
            </div>
            <div className="report-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                <div>
                  <div className="report-section-title">Survey Metadata</div>
                  <div className="report-data-row"><span className="report-data-key">Project Name</span><span className="report-data-val">{selectedSurvey.projectName}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Ecosystem</span><span className="report-data-val">{selectedSurvey.ecosystemType}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Coordinates</span><span className="report-data-val">{selectedSurvey.lat !== undefined && selectedSurvey.lng !== undefined ? `${formatCoordinate(selectedSurvey.lat, false, preferences.coordinateFormat)}, ${formatCoordinate(selectedSurvey.lng, true, preferences.coordinateFormat)}` : 'Not recorded'}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Sample Site</span><span className="report-data-val">{selectedSurvey.sampleSite || '—'}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Method</span><span className="report-data-val">{selectedSurvey.samplingMethod || '—'}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Quadrat size</span><span className="report-data-val">{selectedSurvey.quadratSize || '—'}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Transect length</span><span className="report-data-val">{selectedSurvey.transectLength ? `${selectedSurvey.transectLength} m` : '—'}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Sampling interval</span><span className="report-data-val">{selectedSurvey.samplingInterval ? `${selectedSurvey.samplingInterval} m` : '—'}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Total plots</span><span className="report-data-val">{selectedSurvey.numQuadrats}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Total Abundance</span><span className="report-data-val">{totalAbundance} ind.</span></div>
                </div>
                <div>
                  <div className="report-section-title">Phytosociological Parameters</div>
                  {topSpecies ? (
                    <>
                      <div className="report-data-row"><span className="report-data-key">Top Species</span><span className="report-data-val max-w-[100px] truncate" title={topSpecies.name}>{topSpecies.name}</span></div>
                      <div className="report-data-row"><span className="report-data-key">Frequency</span><span className="report-data-val">{topSpecies.F.toFixed(2)} %</span></div>
                      <div className="report-data-row"><span className="report-data-key">Abundance</span><span className="report-data-val">{topSpecies.n}</span></div>
                      <div className="report-data-row"><span className="report-data-key">Density</span><span className="report-data-val">{topSpecies.D.toFixed(3)}</span></div>
                      <div className="report-data-row"><span className="report-data-key">Rel. Frequency</span><span className="report-data-val">{topSpecies.RF.toFixed(2)} %</span></div>
                      <div className="report-data-row"><span className="report-data-key">Rel. Abundance</span><span className="report-data-val">{topSpecies.RA.toFixed(2)} %</span></div>
                      <div className="report-data-row"><span className="report-data-key">Rel. Density</span><span className="report-data-val">{topSpecies.RD.toFixed(2)} %</span></div>
                      <div className="report-data-row"><span className="report-data-key">A/F Ratio</span><span className="report-data-val">{topSpecies.AF.toFixed(4)}</span></div>
                      <div className="report-data-row"><span className="report-data-key">IVI</span><span className="report-data-val">{topSpecies.IVI.toFixed(2)}</span></div>
                    </>
                  ) : (
                    <div className="report-data-row"><span className="report-data-key">—</span><span className="report-data-val">—</span></div>
                  )}
                </div>
                <div>
                  <div className="report-section-title">Diversity Indices</div>
                  <div className="report-data-row"><span className="report-data-key">Shannon (H′)</span><span className="report-data-val">{shannon.toFixed(3)}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Simpson (D)</span><span className="report-data-val">{simpson.toFixed(3)}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Species richness</span><span className="report-data-val">{richness}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Families recorded</span><span className="report-data-val">{familiesRecorded}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Pielou&apos;s J</span><span className="report-data-val">{evenness.toFixed(3)}</span></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }} className="flex-wrap pb-10">
        <button className="btn-ghost" onClick={async () => await exportToPDF(`${selectedSurvey.projectName}_Preview`, selectedSurvey, profile, preferences)}>Preview full report</button>
        <button className="btn-ghost" onClick={() => {
          if (!selectedSurvey) return showToast('No survey selected.');
          navigator.clipboard.writeText(`${window.location.origin}/surveys/${selectedSurvey.id}`);
          showToast("Survey link copied to clipboard!");
        }}>Share link</button>

        {toastMsg && (
          <div className="fixed bottom-4 right-4 bg-charcoal text-white px-4 py-2 rounded-lg shadow-lg text-[14px]">
            {toastMsg}
          </div>
        )}

        <button className="btn-primary" onClick={handleDownload}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10l4 4 4-4M8 14V2M2 14h12"/></svg>
          Download {selectedFormat.toUpperCase()}
        </button>
      </div>

    </div>
  );
}
