import { SpeciesRecord, SurveySession } from './store';
import { formatCoordinate } from './utils';

/**
 * Calculates biodiversity indices: Shannon, Simpson, Richness, Evenness
 */
export function calculateBiodiversityIndices(surveys: SurveySession[]) {
  const speciesAbundance = new Map<string, number>();
  const familyAbundance = new Map<string, number>();
  const strataAbundance = new Map<string, number>();

  surveys.forEach(survey => {
    survey.speciesList.forEach(species => {
      const abundance = species.quadrats.reduce((sum, val) => sum + val, 0);
      if (abundance > 0) {
        const currentSpCount = speciesAbundance.get(species.name) || 0;
        speciesAbundance.set(species.name, currentSpCount + abundance);

        const famName = species.family || 'Unknown';
        const currentFamCount = familyAbundance.get(famName) || 0;
        familyAbundance.set(famName, currentFamCount + abundance);

        const stratum = species.stratum || 'Unspecified';
        const currentStrataCount = strataAbundance.get(stratum) || 0;
        strataAbundance.set(stratum, currentStrataCount + abundance);
      }
    });
  });

  const abundances = Array.from(speciesAbundance.values());
  const N = abundances.reduce((sum, val) => sum + val, 0);
  const S = abundances.length;

  let shannon = 0;
  let simpson = 0;

  if (N > 0) {
    abundances.forEach(n_i => {
      const p_i = n_i / N;
      shannon -= p_i * Math.log(p_i);
      simpson += p_i * p_i;
    });
    simpson = 1 - simpson;
  }

  const evenness = S > 1 && shannon > 0 ? shannon / Math.log(S) : 0;

  return {
    shannon,
    simpson,
    richness: S,
    evenness,
    speciesAbundance,
    familyAbundance,
    strataAbundance,
    totalAbundance: N
  };
}

/**
 * Calculates phytosociological parameters for a set of surveys
 */
export function calculatePhytoParameters(surveys: SurveySession[], quadratSizeM2: number = 1) {
  let totalQuadrats = 0;
  surveys.forEach(s => totalQuadrats += s.numQuadrats);
  if (totalQuadrats === 0) totalQuadrats = 1;

  const aggregatedSpecies = new Map<string, { 
    id: string, 
    name: string, 
    family: string, 
    localName?: string, 
    abundances: number[], 
    presences: number 
  }>();
  
  surveys.forEach(survey => {
    survey.speciesList.forEach(s => {
      const key = s.name.toLowerCase();
      if (!aggregatedSpecies.has(key)) {
        aggregatedSpecies.set(key, { 
          id: key, 
          name: s.name, 
          family: s.family, 
          localName: s.localName, 
          abundances: [],
          presences: 0 
        });
      }
      const entry = aggregatedSpecies.get(key)!;
      const n = s.quadrats.reduce((acc, val) => acc + val, 0); 
      const a = s.quadrats.filter(val => val > 0).length; 
      entry.abundances.push(n);
      entry.presences += a;
    });
  });

  const speciesList = Array.from(aggregatedSpecies.values());
  const results: any[] = [];
  let sumF = 0, sumD = 0, sumA = 0;

  speciesList.forEach(s => {
    const n = s.abundances.reduce((acc, val) => acc + val, 0); 
    const a = s.presences; 
    const F = (a / totalQuadrats) * 100;
    const totalArea = totalQuadrats * quadratSizeM2;
    const D = n / totalArea;
    const A = a > 0 ? n / a : 0;
    
    sumF += F;
    sumD += D;
    sumA += A;

    results.push({ ...s, n, a, F, D, A });
  });

  results.forEach(m => {
    m.RF = sumF > 0 ? (m.F / sumF) * 100 : 0;
    m.RD = sumD > 0 ? (m.D / sumD) * 100 : 0;
    m.RA = sumA > 0 ? (m.A / sumA) * 100 : 0;
    m.IVI = m.RF + m.RD + m.RA;
    m.AF = m.F > 0 ? m.A / m.F : 0;
  });

  return {
    parameters: results,
    totals: {
      n: results.reduce((acc, m) => acc + m.n, 0),
      A: results.reduce((acc, m) => acc + m.A, 0),
      F: results.reduce((acc, m) => acc + m.F, 0),
      D: results.reduce((acc, m) => acc + m.D, 0),
      RA: results.reduce((acc, m) => acc + m.RA, 0),
      RD: results.reduce((acc, m) => acc + m.RD, 0),
      RF: results.reduce((acc, m) => acc + m.RF, 0),
      AF: results.reduce((acc, m) => acc + m.AF, 0),
      IVI: results.reduce((acc, m) => acc + m.IVI, 0),
    }
  };
}

/**
 * Common Exports
 */
export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent = headers.join(",") + "\n"
    + rows.map(r => r.map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v).join(",")).join("\n");
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToExcel = async (filename: string, sheets: { name: string, data: any[] }[]) => {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

export async function exportToPDF(filename: string, survey: SurveySession, profile: any, preferences: any) {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default || (autoTableModule as unknown as CallableFunction);
  
  const doc = new jsPDF();
  const indices = calculateBiodiversityIndices([survey]);
  const phyto = calculatePhytoParameters([survey], 1);

  // Colors
  const headerColor = [20, 70, 45] as [number, number, number];
  const accentColor = [59, 130, 90] as [number, number, number];
  
  // Header
  // Banner background
  doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
  
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("ECOSURVEY REPORT", 14, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 14, 20, { align: 'right' });
  
  // Methodology Summary
  doc.setFontSize(14);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text("Methodology Summary", 14, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  
  const methodologyText = `This report summarizes the ecological data collected for project "${survey.projectName}". ` +
    `Data was recorded on ${survey.date} at ${survey.siteName || survey.sampleSite || 'a specified location'} ` +
    `using the ${survey.samplingMethod || 'standard'} sampling method. ` +
    `A total of ${survey.numQuadrats} quadrats were evaluated across the ${survey.ecosystemType} ecosystem, ` +
    `focusing on the ${survey.vegetationType} vegetation layer.`;
  
  doc.text(doc.splitTextToSize(methodologyText, 180), 14, 52);
  
  // Metadata Section
  doc.setFontSize(14);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text("Project Metadata", 14, 80);
  
  autoTable(doc, {
    startY: 85,
    body: [
      ['Project Name', survey.projectName, 'Date', survey.date],
      ['Site Name', survey.siteName || survey.sampleSite || '—', 'Ecosystem', survey.ecosystemType],
      ['Researcher', survey.researcherName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Anonymous', 'Plots', survey.numQuadrats.toString()],
      ['Coordinates', survey.lat !== undefined ? `${formatCoordinate(survey.lat, false, preferences.coordinateFormat)}, ${formatCoordinate(survey.lng, true, preferences.coordinateFormat)}` : 'Not recorded', 'Method', survey.samplingMethod || '—'],
    ],
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 248, 245], textColor: headerColor }, 2: { fontStyle: 'bold', fillColor: [240, 248, 245], textColor: headerColor } }
  });

  // Indices Section
  let nextY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text("Biodiversity Indices", 14, nextY);
  
  autoTable(doc, {
    startY: nextY + 5,
    head: [['Index Name', 'Description / Formula', 'Result']],
    body: [
      ['Shannon Diversity (H\')', 'Measures species diversity and abundance. (-Σ p_i ln(p_i))', indices.shannon.toFixed(3)],
      ['Simpson Index (D)', 'Measures probability that two randomly selected individuals belong to different species.', indices.simpson.toFixed(3)],
      ['Species Richness (S)', 'Total number of unique species found.', indices.richness.toString()],
      ['Pielou\'s Evenness (J)', 'Measures how equal the community is numerically.', indices.evenness.toFixed(3)],
    ],
    theme: 'striped',
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255] }
  });

  // Species Parameters Table
  nextY = (doc as any).lastAutoTable.finalY + 15;
  if (nextY > 230) { doc.addPage(); nextY = 20; }
  
  doc.setFontSize(14);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text("Species Inventory & Phytosociological Parameters", 14, nextY);
  
  const speciesData = phyto.parameters.map((p, i) => [
    (i + 1).toString(),
    p.name,
    p.family || '—',
    p.n.toString(),
    p.F.toFixed(1),
    p.D.toFixed(2),
    p.IVI.toFixed(1)
  ]);

  autoTable(doc, {
    startY: nextY + 5,
    head: [['#', 'Species Name', 'Family', 'Abund.', 'Freq %', 'Density', 'IVI']],
    body: speciesData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255] }
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
