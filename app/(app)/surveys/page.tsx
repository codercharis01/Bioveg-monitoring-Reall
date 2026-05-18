'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Upload, Pencil } from 'lucide-react';
import { useSurveyStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function SurveysList() {
  const router = useRouter();
  const surveys = useSurveyStore(state => state.surveys) || [];
  const lastSyncedAt = useSurveyStore(state => state.lastSyncedAt);
  const deleteSurvey = useSurveyStore(state => state.deleteSurvey);
  const identity = useSurveyStore(state => state.identity);
  
  const { syncing, syncData } = useSyncEngine();
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setTick] = useState(0);

  const handleSyncPrompt = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (identity.isGuest) {
      if (confirm("You are currently using guest mode. To sync with the cloud, you need to sign in. Would you like to sign in now?")) {
        router.push('/');
      }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await syncData(session.user.id);
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredSurveys = surveys
    .filter(s => 
      (s?.projectName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s?.siteName || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.id.startsWith('mock-')) return 1;
      if (b.id.startsWith('mock-')) return -1;
      const timeA = !isNaN(Number(a.id)) ? Number(a.id) : new Date(a.date).getTime() || 0;
      const timeB = !isNaN(Number(b.id)) ? Number(b.id) : new Date(b.date).getTime() || 0;
      return timeB - timeA;
    });

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleUpdate = (e: React.MouseEvent, survey: any) => {
    e.preventDefault();
    e.stopPropagation();
    const newName = prompt("Enter new project name:", survey.projectName);
    if (newName) {
      useSurveyStore.getState().updateSurvey(survey.id, { projectName: newName });
    }
    setOpenMenuId(null);
  };

  const handleExport = () => {
    const csvRows = [];
    const headers = ['ID', 'Project Name', 'Site Name', 'Ecosystem Type', 'Date', 'Status', 'No. Quadrats', 'Lat', 'Lng'];
    csvRows.push(headers.join(','));
    for (const s of filteredSurveys) {
      const row = [s?.id, s?.projectName, s?.siteName, s?.ecosystemType, s?.date, s?.status, s?.numQuadrats, s?.lat, s?.lng].map(v => `"${v || ''}"`);
      csvRows.push(row.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'surveys.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute stats
  const totalSurveys = surveys.length;
  const totalProjects = new Set(surveys.map(s => s?.siteName)).size; // Using siteName functionally as project

  return (
    <div className="max-w-[1400px] mx-auto pb-10 space-y-6">
      
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>All Surveys</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {totalSurveys} surveys across {totalProjects} projects
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-mint/50 text-forest rounded-full text-[12px] font-medium border border-forest/10 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse"></div>
            {lastSyncedAt ? `Synced ${formatDistanceToNow(lastSyncedAt)} ago` : 'Waiting to sync...'}
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-moss/50" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-forest/15 rounded-lg text-sm text-charcoal outline-none focus:border-forest/50 transition-colors w-40 sm:w-48 lg:w-64"
            />
          </div>

          {surveys.some(s => s.status === 'Pending' && !s.id.startsWith('mock-')) && (
            <button
              onClick={handleSyncPrompt}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-moss text-white rounded-lg text-[14.5px] font-medium hover:bg-forest transition-colors shadow-sm whitespace-nowrap disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync All'}
            </button>
          )}
          
          <button 
            onClick={handleExport}
            className="p-2.5 bg-white border border-forest/15 rounded-lg text-moss/60 hover:text-forest hover:bg-forest/5 transition-colors focus:outline-none"
            title="Export to CSV"
          >
            <Upload className="w-[18px] h-[18px]" />
          </button>
          
          <Link
            href="/surveys/new"
            className="hidden items-center gap-2 px-4 py-2.5 bg-forest text-white rounded-lg text-[14.5px] font-medium hover:bg-forest-mid transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-[16px] h-[16px]" />
            New Survey
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-forest/10 rounded-[16px] flex flex-col shadow-sm min-h-[400px]">
        {surveys.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-16 px-4 py-3 text-[11px] font-semibold text-moss/50 text-center bg-mint/50 border-b border-forest/10 tracking-widest uppercase rounded-tl-[16px]">#</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Project Name</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Sample Site</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Date</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase hidden lg:table-cell">Researcher</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase hidden lg:table-cell">Quadrat Size</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-center bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Species</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-center bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Status</th>
                  <th className="w-20 px-4 py-3 text-[11px] font-semibold text-moss/50 text-center bg-mint/50 border-b border-forest/10 tracking-widest uppercase rounded-tr-[16px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filteredSurveys.map((survey, index) => {
                    const totalSpeciesInSurvey = survey?.speciesList?.length || 0;
                    const qSizeText = survey?.quadratSize || '20 × 20 m (400 m²)';
                    
                    return (
                      <tr 
                        key={survey?.id || index} 
                        className="border-b border-forest/10 hover:bg-mint/30 transition-colors group last:border-b-0 cursor-pointer"
                        onClick={() => router.push(`/surveys/${survey?.id}`)}
                      >
                        <td className="px-4 py-4 text-[12.5px] text-moss/50 font-mono text-center">
                          {String(filteredSurveys.length - index).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-charcoal text-[13.5px]">{survey?.projectName || 'Unnamed Survey'}</div>
                          <div className="text-[12px] text-moss/70 mt-0.5">
                            {survey?.numQuadrats || 0} plots
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[13px] text-charcoal font-medium">
                            {survey?.sampleSite || 'Unknown Site'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[12.5px] text-moss/80 font-mono">
                            {survey?.date || 'Unknown Date'}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-[13px] text-charcoal">
                            {survey?.researcherName || `${Object.values(useSurveyStore.getState().profile || {}).slice(0,2).join(' ')}`}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-[12.5px] text-moss/70">
                            {qSizeText.split('(')[0].trim()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-[13px] font-medium text-charcoal">
                            {totalSpeciesInSurvey}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium leading-none tracking-wide capitalize",
                              survey?.status === 'Synced' 
                                ? "bg-[#dcf1e6] text-[#27523a]" 
                                : "bg-orange-100 text-orange-800"
                            )}>
                              {survey?.status || 'Pending'}
                            </span>
                            {survey?.status === 'Pending' && !survey?.id.startsWith('mock-') && (
                              <button 
                                onClick={handleSyncPrompt}
                                className="p-1 text-moss hover:text-forest hover:bg-forest/5 rounded transition-colors"
                                title="Sync Now"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-9-9c2.52 0 4.84.83 6.7 2.22M21 3v6h-6"/></svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => toggleMenu(e, survey?.id)}
                            className="inline-flex w-8 h-8 items-center justify-center rounded-lg border border-forest/20 text-moss/60 hover:text-forest hover:bg-white transition-colors"
                          >
                            <Pencil className="w-[14px] h-[14px]" />
                          </button>
                          {openMenuId === survey?.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)} 
                              />
                              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-white rounded-lg shadow-lg border border-forest/10 py-1 z-20">
                                <button 
                                  onClick={(e) => {
                                    setOpenMenuId(null);
                                    router.push(`/surveys/${survey?.id}/record`);
                                  }}
                                  className="w-full text-left px-4 py-2 text-[12.5px] text-charcoal hover:bg-mint transition-colors"
                                >
                                  Add Species
                                </button>
                                <button 
                                  onClick={(e) => handleUpdate(e, survey)}
                                  className="w-full text-left px-4 py-2 text-[12.5px] text-charcoal hover:bg-mint transition-colors"
                                >
                                  Rename
                                </button>
                                <button 
                                  onClick={(e) => {
                                    if (confirm("Are you sure you want to delete this survey?")) {
                                      deleteSurvey(survey?.id);
                                    }
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-[12.5px] text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col p-4 gap-4">
              {filteredSurveys.map((survey, index) => {
                const totalSpeciesInSurvey = survey?.speciesList?.length || 0;
                return (
                  <div 
                    key={survey?.id || index}
                    className="border border-forest/10 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer relative"
                    onClick={() => router.push(`/surveys/${survey?.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-charcoal text-[14px]">{survey?.projectName || 'Unnamed Survey'}</div>
                        <div className="text-[12px] text-moss/70 mt-0.5">{survey?.sampleSite || 'Unknown Site'}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium leading-none tracking-wide capitalize",
                          survey?.status === 'Synced' 
                            ? "bg-[#dcf1e6] text-[#27523a]" 
                            : "bg-orange-100 text-orange-800"
                        )}>
                          {survey?.status || 'Pending'}
                        </span>
                        {survey?.status === 'Pending' && !survey?.id.startsWith('mock-') && (
                          <button 
                            onClick={handleSyncPrompt}
                            className="p-1 text-moss bg-forest/5 rounded transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-9-9c2.52 0 4.84.83 6.7 2.22M21 3v6h-6"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 mt-4 text-[12.5px]">
                      <div className="text-moss/60">Date: <span className="text-charcoal font-medium">{survey?.date || 'Unknown'}</span></div>
                      <div className="text-moss/60">Plots: <span className="text-charcoal font-medium">{survey?.numQuadrats || 0}</span></div>
                      <div className="text-moss/60">Species: <span className="text-charcoal font-medium">{totalSpeciesInSurvey}</span></div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-forest/10 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11.5px] text-moss/60 font-mono">ID: {String(filteredSurveys.length - index).padStart(2, '0')}</span>
                      <div className="relative">
                        <button 
                          onClick={(e) => toggleMenu(e, survey?.id)}
                          className="flex items-center justify-center p-1.5 rounded-md text-moss/60 hover:text-forest bg-forest/5"
                        >
                          <Pencil className="w-[14px] h-[14px]" />
                        </button>
                        {openMenuId === survey?.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)} 
                            />
                            <div className="absolute right-0 bottom-8 w-32 bg-white rounded-lg shadow-lg border border-forest/10 py-1 z-20">
                              <button 
                                onClick={(e) => {
                                  setOpenMenuId(null);
                                  router.push(`/surveys/${survey?.id}/record`);
                                }}
                                className="w-full text-left px-4 py-2 text-[12.5px] text-charcoal hover:bg-mint"
                              >
                                Add Species
                              </button>
                              <button 
                                onClick={(e) => handleUpdate(e, survey)}
                                className="w-full text-left px-4 py-2 text-[12.5px] text-charcoal hover:bg-mint"
                              >
                                Rename
                              </button>
                              <button 
                                onClick={(e) => {
                                  if (confirm("Are you sure you want to delete this survey?")) {
                                    deleteSurvey(survey?.id);
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-[12.5px] text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-[13px] text-moss/70 flex-1 flex flex-col items-center justify-center min-h-[300px]">
             No surveys found. Click &quot;New Survey&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
}

