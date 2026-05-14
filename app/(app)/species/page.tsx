'use client';

import { useState, useEffect } from 'react';
import { useSurveyStore } from '@/lib/store';
import { Search, Plus, MoreHorizontal, Download, Folder, Filter, Calendar, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function SpeciesEntry() {
  const surveys = useSurveyStore(state => state.surveys);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(surveys[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [editingSpeciesId, setEditingSpeciesId] = useState<string | null>(null);
  const [editQuadrats, setEditQuadrats] = useState<number[]>([]);
  const updateSpecies = useSurveyStore(state => state.updateSpecies);
  const deleteSpecies = useSurveyStore(state => state.deleteSpecies);

  // Extract unique site names and dates for filter suggestions
  const sites = Array.from(new Set(surveys.map(s => s.sampleSite))).filter(Boolean);
  const dates = Array.from(new Set(surveys.map(s => s.date))).filter(Boolean);

  const filteredSurveys = surveys.filter(s => {
    const matchesSearch = s.projectName.toLowerCase().includes(projectSearchQuery.toLowerCase());
    const matchesSite = !siteFilter || s.sampleSite === siteFilter;
    const matchesDate = !dateFilter || s.date === dateFilter;
    return matchesSearch && matchesSite && matchesDate;
  });

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);
  const speciesList = selectedSurvey?.speciesList || [];

  let filteredSpecies = speciesList.filter((s) => {
    const lowerQuery = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(lowerQuery) || 
           (s.localName && s.localName.toLowerCase().includes(lowerQuery)) ||
           (s.family && s.family.toLowerCase().includes(lowerQuery));
  });

  if (sortConfig !== null) {
    filteredSpecies.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof typeof a];
      let bValue: any = b[sortConfig.key as keyof typeof b];
      
      if (sortConfig.key === 'abundance') {
        aValue = a.quadrats.reduce((sum, val) => sum + val, 0);
        bValue = b.quadrats.reduce((sum, val) => sum + val, 0);
      }

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

  const exportToCSV = () => {
    if (!selectedSurvey) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No.,Species Name,Local Name,Family,Total Abundance\n";

    filteredSpecies.forEach((species, index) => {
      const abundance = species.quadrats.reduce((acc, val) => acc + val, 0);
      const row = [
        index + 1,
        `"${species.name}"`,
        `"${species.localName || ''}"`,
        `"${species.family || ''}"`,
        abundance
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedSurvey.projectName}_species.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>Species Registration</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Manage and log your species entries across all projects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        
        {/* Project Selection Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-forest/10 rounded-[16px] overflow-hidden">
            <div className="p-4 border-b border-forest/10 bg-mint">
              <h2 className="text-[14px] font-semibold text-charcoal flex items-center justify-between">
                Projects
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[11px] font-medium tracking-wide transition-colors",
                    (siteFilter || dateFilter) 
                      ? "bg-forest/10 border-forest/20 text-forest" 
                      : "bg-white border-forest/10 text-moss/70 hover:bg-forest/5 hover:text-charcoal"
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>FILTER</span>
                </button>
              </h2>
            </div>
            
            <div className="p-3 bg-mint/30 border-b border-forest/10 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-moss/50" />
                <input 
                  type="text"
                  placeholder="Search projects..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-forest/10 rounded-lg text-[12px] text-charcoal outline-none focus:ring-2 focus:ring-forest/5 transition-all"
                />
              </div>

              {showFilters && (
                <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-moss/50" />
                    <select
                      value={siteFilter}
                      onChange={(e) => setSiteFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-forest/10 rounded-lg text-[12px] text-charcoal outline-none appearance-none"
                    >
                      <option value="">All Sites</option>
                      {sites.map(site => (
                        <option key={site} value={site}>{site}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-moss/50" />
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-forest/10 rounded-lg text-[12px] text-charcoal outline-none appearance-none"
                    >
                      <option value="">All Dates</option>
                      {dates.map(date => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                  </div>
                  {(siteFilter || dateFilter) && (
                    <button 
                      onClick={() => {setSiteFilter(''); setDateFilter('');}}
                      className="text-[11px] text-forest font-medium flex items-center gap-1 hover:underline"
                    >
                      <X className="w-3 h-3" /> Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 pb-1">
              <p className="text-[11px] font-medium text-moss/60 uppercase tracking-wider">
                Select project you would like to record a specie
              </p>
            </div>

            <div className="p-2 pt-1 space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto">
              {filteredSurveys.map(survey => (
                <div key={survey.id} className="flex items-center gap-1 group">
                  <button
                    onClick={() => setSelectedSurveyId(survey.id)}
                    className={cn(
                      "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors min-w-0",
                      selectedSurveyId === survey.id 
                        ? "bg-sage-pale text-forest" 
                        : "hover:bg-mint text-moss"
                    )}
                  >
                    <Folder className={cn("w-4 h-4 flex-shrink-0", selectedSurveyId === survey.id ? "text-forest" : "text-moss/60")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{survey.projectName}</div>
                      <div className="text-[11px] opacity-70 truncate">{survey.sampleSite} · {survey.speciesList.length} species</div>
                    </div>
                  </button>
                  <Link
                    href={`/surveys/${survey.id}/record`}
                    className="p-2 rounded-lg bg-mint hover:bg-sage-pale text-forest/70 hover:text-forest transition-colors flex-shrink-0"
                    title="Add Species"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>
              ))}
              {filteredSurveys.length === 0 && (
                <div className="p-4 text-center text-[12px] text-moss/60">No matching projects found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Species Information */}
        <div className="space-y-2 min-w-0">
          {selectedSurvey ? (
            <>
              <div className="species-toolbar">
                <div className="search-field">
                  <Search />
                  <input 
                    type="text" 
                    placeholder="Search species in this project…" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={exportToCSV}
                    className="btn-ghost hidden sm:flex"
                  >
                    <Download className="w-[15px] h-[15px]" />
                    Export CSV
                  </button>
                  <Link 
                    href={`/surveys/${selectedSurvey.id}/record`}
                    className="bg-forest hover:bg-forest-mid text-white flex items-center gap-1.5 px-3 py-1.5 md:px-[14px] md:py-[7px] rounded-lg text-[12px] md:text-[13px] font-medium transition-colors"
                  >
                    <Plus className="w-[14px] h-[14px]" />
                    Add Species
                  </Link>
                </div>
              </div>

              {/* Species Table */}
              <div className="species-table-wrap">
                <table className="species-table min-w-max">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}>#</th>
                      <th 
                        className="cursor-pointer hover:text-charcoal transition-colors"
                        onClick={() => requestSort('name')}
                      >
                        Species Name {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th 
                        className="cursor-pointer hover:text-charcoal transition-colors"
                        onClick={() => requestSort('family')}
                      >
                        Family {sortConfig?.key === 'family' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th 
                        className="cursor-pointer hover:text-charcoal transition-colors"
                        onClick={() => requestSort('abundance')}
                      >
                        Abundance {sortConfig?.key === 'abundance' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th>Cover (%)</th>
                      <th>Stratum</th>
                      <th>Notes</th>
                      <th style={{ width: '64px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpecies.length > 0 ? (
                      filteredSpecies.map((s, i) => {
                        const abundance = s.quadrats.reduce((acc, val) => acc + val, 0);
                        const cover = selectedSurvey?.numQuadrats ? (abundance / selectedSurvey.numQuadrats).toFixed(2) : "0.00";
                        const maxAbundance = Math.max(...filteredSpecies.map(sp => sp.quadrats.reduce((a, v) => a + v, 0)), 1);
                        const percentage = Math.min(100, (abundance / maxAbundance) * 100);
                        
                        // Status chip color for Stratum
                        let stratumElement = <span className="text-moss/40">—</span>;
                        if (s.stratum) {
                          const lowerStr = s.stratum.toLowerCase();
                          if (lowerStr.includes("sub-can") || lowerStr.includes("sub canopy")) {
                            stratumElement = <span className="status-chip status-active" style={{ fontSize: '11px', background: '#e8f1ff', color: '#1d4ed8' }}>{s.stratum}</span>;
                          } else if (lowerStr.includes("canopy")) {
                            stratumElement = <span className="status-chip status-complete" style={{ fontSize: '11px' }}>{s.stratum}</span>;
                          } else if (lowerStr.includes("understorey") || lowerStr.includes("understory") || lowerStr.includes("ground") || lowerStr.includes("shrub") || lowerStr.includes("root")) {
                            stratumElement = <span className="status-chip status-pending" style={{ fontSize: '11px' }}>{s.stratum}</span>;
                          } else {
                            stratumElement = <span className="status-chip status-active" style={{ fontSize: '11px' }}>{s.stratum}</span>;
                          }
                        }

                        return (
                        <tr key={s.id}>
                          <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px' }}>
                            {(i + 1).toString().padStart(2, '0')}
                          </td>
                          <td>
                            <strong>{s.name}</strong><br/>
                            {s.localName && <span className="sci-name">{s.localName}</span>}
                          </td>
                          <td>
                            <span className="family-badge">
                              {s.family || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            <div className="abundance-bar">
                              <div className="ab-bar-bg">
                                <div className="ab-bar-fill" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span style={{ fontSize: '12px', fontFamily: 'var(--mono)' }}>{abundance}</span>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--mono)' }}>
                            {cover}
                          </td>
                          <td>
                            {stratumElement}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                            {s.notes || '—'}
                          </td>
                          <td className="relative">
                            <button 
                              onClick={() => setOpenActionMenuId(openActionMenuId === s.id ? null : s.id)}
                              className="icon-btn" style={{ width: '28px', height: '28px', border: 'none' }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openActionMenuId === s.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setOpenActionMenuId(null)} 
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-white rounded-lg shadow-lg border border-forest/10 py-1 z-20">
                                  <button 
                                    onClick={() => {
                                      const newName = prompt("Edit Species Name:", s.name);
                                      if (newName && newName.trim() !== '') {
                                        updateSpecies(selectedSurvey.id, s.id, { name: newName.trim() });
                                      }
                                      setOpenActionMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-[12px] text-moss hover:bg-mint transition-colors"
                                  >
                                    Edit Name
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setEditingSpeciesId(s.id);
                                      setEditQuadrats([...s.quadrats]);
                                      setOpenActionMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-[12px] text-moss hover:bg-mint transition-colors"
                                  >
                                    Edit Records
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete ${s.name}?`)) {
                                        deleteSpecies(selectedSurvey.id, s.id);
                                      }
                                      setOpenActionMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      )})
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-[13px] text-moss/70">
                          {speciesList.length === 0 ? "No species recorded yet for this project." : "No species match your search."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Species Distribution Summary Table */}
              <div className="bg-white border border-forest/10 rounded-[16px] shadow-sm flex flex-col">
                <div className="p-4 px-5 border-b border-forest/10 bg-mint">
                  <h3 className="text-[14px] font-semibold text-charcoal">Species Distribution Summary</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full border-collapse min-w-max">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-[11px] font-medium text-moss/70 text-left bg-mint border-b border-forest/10 border-r min-w-[200px]">Species</th>
                        {Array.from({ length: selectedSurvey.numQuadrats }).map((_, i) => (
                          <th key={i} className="px-2 py-3 text-[11px] font-medium text-moss/70 text-center bg-mint border-b border-forest/10 tracking-[0.5px] uppercase">
                            Q{i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {speciesList.length > 0 ? (
                        speciesList.map((s) => (
                          <tr key={s.id} className="border-b border-forest/10 last:border-b-0 hover:bg-mint/50">
                            <td className="px-4 py-2 border-r border-forest/10">
                              <div className="text-[12.5px] font-medium text-charcoal">{s.name}</div>
                            </td>
                            {s.quadrats.map((amount, i) => (
                              <td key={i} className="px-1 py-2 text-center border-r border-forest/5 last:border-r-0">
                                {amount > 0 ? (
                                  <div className="mx-auto w-6 h-6 rounded flex items-center justify-center bg-sage-pale text-forest font-mono text-[11px] font-medium">
                                    {amount}
                                  </div>
                                ) : (
                                  <div className="mx-auto w-6 h-6 rounded flex items-center justify-center text-moss/20 font-mono text-[11px]">
                                    -
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={selectedSurvey.numQuadrats + 1} className="px-4 py-8 text-center text-[13px] text-moss/70">
                            No species data available for distribution.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-forest/10 rounded-[16px] p-8 text-center flex flex-col items-center justify-center h-[300px]">
              <div className="w-12 h-12 rounded-xl bg-mint flex items-center justify-center text-moss mb-4">
                <Folder className="w-6 h-6" />
              </div>
              <p className="text-[14px] font-medium text-charcoal">No project selected</p>
              <p className="text-[13px] text-moss/70 mt-1">Select a project from the sidebar to view species.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Species Records Modal */}
      {editingSpeciesId && selectedSurvey && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-forest/10 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-forest/10 flex justify-between items-center bg-mint/50">
              <h3 className="text-lg font-semibold text-emerald-950">
                Edit Records: {speciesList.find(s => s.id === editingSpeciesId)?.name}
              </h3>
              <button 
                onClick={() => setEditingSpeciesId(null)}
                className="text-moss/60 hover:text-charcoal p-1 rounded-md hover:bg-forest/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {editQuadrats.map((q, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium text-moss/70 uppercase">Quadrat {i + 1}</label>
                    <input
                      type="number"
                      min="0"
                      value={q}
                      onChange={(e) => {
                        const newVals = [...editQuadrats];
                        newVals[i] = parseInt(e.target.value) || 0;
                        setEditQuadrats(newVals);
                      }}
                      className="w-full px-3 py-2 border border-forest/20 rounded-lg text-[13px] focus:ring-2 focus:ring-forest/20 focus:border-forest outline-none text-charcoal font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-forest/10 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setEditingSpeciesId(null)}
                className="px-4 py-2 bg-white border border-forest/20 text-charcoal rounded-lg font-medium hover:bg-gray-50 transition-colors text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateSpecies(selectedSurvey.id, editingSpeciesId, { quadrats: editQuadrats });
                  setEditingSpeciesId(null);
                }}
                className="px-5 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest-mid transition-colors text-[13px]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
