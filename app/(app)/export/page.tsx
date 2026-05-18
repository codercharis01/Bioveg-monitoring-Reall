'use client';

import { useState, useMemo } from 'react';
import { Download, FileText, Filter, ChevronDown, Calendar, Search } from 'lucide-react';
import { useSurveyStore } from '@/lib/store';
import { cn, formatCoordinate } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportPage() {
  const surveys = useSurveyStore(state => state.surveys) || [];
  const preferences = useSurveyStore(state => state.preferences);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedSurveyId, setSelectedSurveyId] = useState(surveys[0]?.id || '');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };


  const selectedSurvey = surveys.find(s => s?.id === selectedSurveyId) || surveys[0];

  const speciesRichness = selectedSurvey?.speciesList?.length || 0;
  const familiesRecorded = new Set(selectedSurvey?.speciesList?.map(s => s.family)).size || 0;
  
  // Calculate mock area
  const qSizeText = selectedSurvey?.quadratSize || '20 × 20 m (400 m²)';
  const qAreaMatch = qSizeText.match(/\((\d+)\s*m²\)/) || qSizeText.match(/(\d+)\s*m²/);
  const qArea = qAreaMatch ? parseInt(qAreaMatch[1], 10) : 400;
  const totalArea = (qArea * (selectedSurvey?.numQuadrats || 1)) / 10000; // ha

  const mockIndices = useMemo(() => {
    return {
      shannon: speciesRichness > 0 ? (2 + (speciesRichness % 2)).toFixed(2) : "0.00",
      simpson: speciesRichness > 0 ? (0.7 + (speciesRichness % 3) * 0.1).toFixed(2) : "0.00",
      pielou: speciesRichness > 0 ? (0.6 + (speciesRichness % 4) * 0.1).toFixed(2) : "0.00"
    };
  }, [speciesRichness]);

  const mockParameters = useMemo(() => {
    if (!selectedSurvey || !selectedSurvey.speciesList) return null;
    
    let totalQuadrats = selectedSurvey.numQuadrats || 1;
    const aggregatedSpecies = new Map<string, { name: string, abundances: number[], presences: number }>();
    
    selectedSurvey.speciesList.forEach(s => {
      const key = s.name.toLowerCase();
      if (!aggregatedSpecies.has(key)) {
        aggregatedSpecies.set(key, { name: s.name, abundances: [], presences: 0 });
      }
      const entry = aggregatedSpecies.get(key)!;
      const n = s.quadrats.reduce((acc, val) => acc + val, 0); 
      const a = s.quadrats.filter(val => val > 0).length;
      entry.abundances.push(n);
      entry.presences += a;
    });

    const speciesList = Array.from(aggregatedSpecies.values());
    const metricsMap = new Map();
    let sumF = 0, sumD = 0, sumA = 0;

    speciesList.forEach(s => {
      const n = s.abundances.reduce((acc, val) => acc + val, 0); 
      const a = s.presences; 
      const F = (a / totalQuadrats) * 100;
      const D = n / totalArea; 
      const A = a > 0 ? n / a : 0;
      
      sumF += F;
      sumD += D;
      sumA += A;

      metricsMap.set(s.name, { n, a, F, D, A });
    });

    speciesList.forEach(s => {
       const m = metricsMap.get(s.name);
       if (m) {
         m.RF = sumF > 0 ? (m.F / sumF) * 100 : 0;
         m.RD = sumD > 0 ? (m.D / sumD) * 100 : 0;
         m.RA = sumA > 0 ? (m.A / sumA) * 100 : 0;
         m.IVI = m.RF + m.RD + m.RA;
       }
    });

    const sortedByIVI = speciesList.sort((a, b) => {
      const aIVI = metricsMap.get(a.name)?.IVI || 0;
      const bIVI = metricsMap.get(b.name)?.IVI || 0;
      return bIVI - aIVI;
    });

    const topSpecies = sortedByIVI[0];
    if (!topSpecies) return null;
    
    const m = metricsMap.get(topSpecies.name);
    return {
      name: topSpecies.name,
      F: m.F?.toFixed(2) || '0.00',
      A: m.A?.toFixed(2) || '0.00',
      D: m.D?.toFixed(2) || '0.00',
      RA: m.RA?.toFixed(2) || '0.00',
      RD: m.RD?.toFixed(2) || '0.00',
      RF: m.RF?.toFixed(2) || '0.00',
      AF: (m.F > 0 ? (m.A / m.F) : 0).toFixed(4),
      IVI: m.IVI?.toFixed(2) || '0.00',
    };
  }, [selectedSurvey, totalArea]);

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
                  <div className="report-data-row"><span className="report-data-key">Total area</span><span className="report-data-val">{totalArea.toFixed(3)} ha</span></div>
                </div>
                <div>
                  <div className="report-section-title">Phytosociological Parameters</div>
                  {mockParameters ? (
                    <>
                      <div className="report-data-row"><span className="report-data-key">Top Species</span><span className="report-data-val max-w-[100px] truncate" title={mockParameters.name}>{mockParameters.name}</span></div>
                      <div className="report-data-row"><span className="report-data-key">Frequency</span><span className="report-data-val">{mockParameters.F} %</span></div>
                      <div className="report-data-row"><span className="report-data-key">Abundance</span><span className="report-data-val">{mockParameters.A}</span></div>
                      <div className="report-data-row"><span className="report-data-key">Density</span><span className="report-data-val">{mockParameters.D}</span></div>
                      <div className="report-data-row"><span className="report-data-key">Rel. Frequency</span><span className="report-data-val">{mockParameters.RF} %</span></div>
                      <div className="report-data-row"><span className="report-data-key">Rel. Abundance</span><span className="report-data-val">{mockParameters.RA} %</span></div>
                      <div className="report-data-row"><span className="report-data-key">Rel. Density</span><span className="report-data-val">{mockParameters.RD} %</span></div>
                      <div className="report-data-row"><span className="report-data-key">A/F Ratio</span><span className="report-data-val">{mockParameters.AF}</span></div>
                      <div className="report-data-row"><span className="report-data-key">IVI</span><span className="report-data-val">{mockParameters.IVI}</span></div>
                    </>
                  ) : (
                    <div className="report-data-row"><span className="report-data-key">—</span><span className="report-data-val">—</span></div>
                  )}
                </div>
                <div>
                  <div className="report-section-title">Diversity Indices</div>
                  <div className="report-data-row"><span className="report-data-key">Shannon (H′)</span><span className="report-data-val">{mockIndices.shannon}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Simpson (D)</span><span className="report-data-val">{mockIndices.simpson}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Species richness</span><span className="report-data-val">{speciesRichness}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Families recorded</span><span className="report-data-val">{familiesRecorded}</span></div>
                  <div className="report-data-row"><span className="report-data-key">Pielou&apos;s J</span><span className="report-data-val">{mockIndices.pielou}</span></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }} className="flex-wrap pb-10">
        <button className="btn-ghost" onClick={() => {
          if (!selectedSurvey) return alert('No survey selected.');
          alert(`Previewing full report for ${selectedSurvey.projectName}...\n\nResearchers: ${selectedSurvey.researcherName}\nTotal Plots: ${selectedSurvey.numQuadrats}\nSpecies Recorded: ${selectedSurvey.speciesList?.length || 0}\n\n(A PDF generation window would typically open here.)`);
        }}>Preview full report</button>
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

        <button className="btn-primary" onClick={() => {
          if (!selectedSurvey) return showToast('No survey selected.');
          
          if (selectedFormat === 'csv') {
            let csvStr = `Scientific Name,Family,Stratum,Notes,Total,${Array.from({length: selectedSurvey.numQuadrats}).map((_, i) => 'Q'+(i+1)).join(',')}\n`;
            selectedSurvey.speciesList.forEach(s => {
              csvStr += `"${s.name}","${s.family || ''}","${s.stratum || ''}","${s.notes || ''}",${s.quadrats.reduce((a,b)=>a+b,0)},${s.quadrats.join(',')}\n`;
            });
            const blob = new Blob([csvStr], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${selectedSurvey.projectName}.csv`;
            a.click(); URL.revokeObjectURL(url);
          } else if (selectedFormat === 'excel') {
            const speciesData = selectedSurvey.speciesList.map(s => ({
              'Scientific Name': s.name,
              'Family': s.family,
              'Stratum': s.stratum,
              'Notes': s.notes,
              'Total Abundance': s.quadrats.reduce((a, b) => a + b, 0),
              ...Object.fromEntries(s.quadrats.map((val, idx) => [`Q${idx + 1}`, val]))
            }));
            const metadata = [{ 
              'Project': selectedSurvey.projectName, 
              'Ecosystem': selectedSurvey.ecosystemType,
              'Date': selectedSurvey.date 
            }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metadata), "Metadata");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(speciesData), "Species Data");
            XLSX.writeFile(wb, `${selectedSurvey.projectName}.xlsx`);
          } else if (selectedFormat === 'pdf') {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.text(`${selectedSurvey.projectName} Report`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Date: ${selectedSurvey.date} - Ecosystem: ${selectedSurvey.ecosystemType}`, 14, 30);
            doc.text(`Researcher: ${selectedSurvey.researcherName || 'Anonymous'}`, 14, 36);
            
            if (selectedSurvey.lat !== undefined && selectedSurvey.lng !== undefined) {
              doc.text(`Coordinates: ${formatCoordinate(selectedSurvey.lat, false, preferences.coordinateFormat)}, ${formatCoordinate(selectedSurvey.lng, true, preferences.coordinateFormat)}`, 14, 42);
            }
            
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Diversity Indices & Metadata", 14, 55);
            
            autoTable(doc, {
              startY: 60,
              head: [['Parameter', 'Value', 'Parameter', 'Value']],
              body: [
                ['Species Richness', speciesRichness.toString(), "Shannon (H')", mockIndices.shannon],
                ['Families Recorded', familiesRecorded.toString(), 'Simpson (D)', mockIndices.simpson],
                ['Sample Area', `${totalArea.toFixed(3)} ha`, "Pielou's J", mockIndices.pielou],
              ],
              theme: 'grid',
              headStyles: { fillColor: [40, 80, 60] }
            });

            let nextY = (doc as any).lastAutoTable.finalY + 15;
            
            doc.setFontSize(14);
            doc.text("Species Inventory", 14, nextY);
            
            const tableData = selectedSurvey.speciesList.map(s => [
              s.name, 
              s.family || '—', 
              s.stratum || '—', 
              s.quadrats.reduce((a, b) => a + b, 0).toString()
            ]);
            
            autoTable(doc, {
              startY: nextY + 5,
              head: [['Scientific Name', 'Family', 'Stratum', 'Total Abundance']],
              body: tableData,
              theme: 'striped',
              headStyles: { fillColor: [39, 82, 58] }
            });
            
            doc.save(`${selectedSurvey.projectName}.pdf`);
          }
        }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10l4 4 4-4M8 14V2M2 14h12"/></svg>
          Download {selectedFormat.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
