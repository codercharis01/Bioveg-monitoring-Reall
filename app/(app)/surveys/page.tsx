'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Upload, Pencil } from 'lucide-react';
import { useSurveyStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function SurveysList() {
  const router = useRouter();
  const surveys = useSurveyStore(state => state.surveys) || [];
  const deleteSurvey = useSurveyStore(state => state.deleteSurvey);
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
            Synced 2m ago
          </div>
          
          <button className="p-2.5 bg-white border border-forest/15 rounded-lg text-moss/60 hover:text-forest hover:bg-forest/5 transition-colors focus:outline-none">
            <Search className="w-[18px] h-[18px]" />
          </button>
          
          <button className="p-2.5 bg-white border border-forest/15 rounded-lg text-moss/60 hover:text-forest hover:bg-forest/5 transition-colors focus:outline-none">
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

      {/* Main Content Table */}
      <div className="bg-white border border-forest/10 rounded-[16px] flex flex-col shadow-sm min-h-[400px]">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr>
              <th className="w-16 px-4 py-3 text-[11px] font-semibold text-moss/50 text-center bg-mint/50 border-b border-forest/10 tracking-widest uppercase">#</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Project Name</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Sample Site</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Date</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Researcher</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Quadrat Size</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-left bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Sample Area</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-center bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Species</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-moss/50 text-center bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Status</th>
              <th className="w-20 px-4 py-3 text-[11px] font-semibold text-moss/50 text-center bg-mint/50 border-b border-forest/10 tracking-widest uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {surveys.length > 0 ? (
              surveys.map((survey, index) => {
                const totalSpeciesInSurvey = survey?.speciesList?.length || 0;
                const qSizeText = survey?.quadratSize || '20 × 20 m (400 m²)';
                const qAreaMatch = qSizeText.match(/\((\d+)\s*m²\)/) || qSizeText.match(/(\d+)\s*m²/);
                const qArea = qAreaMatch ? parseInt(qAreaMatch[1], 10) : 400;
                const totalArea = qArea * (survey?.numQuadrats || 1);
                
                return (
                  <tr 
                    key={survey?.id || index} 
                    className="border-b border-forest/10 hover:bg-mint/30 transition-colors group last:border-b-0 cursor-pointer"
                    onClick={() => router.push(`/surveys/${survey?.id}`)}
                  >
                    <td className="px-4 py-4 text-[12.5px] text-moss/50 font-mono text-center">
                      18{6 - index}
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
                    <td className="px-4 py-4">
                      <span className="text-[13px] text-charcoal">
                        {survey?.researcherName || `${Object.values(useSurveyStore.getState().profile || {}).slice(0,2).join(' ')}`}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[12.5px] text-moss/70">
                        {qSizeText.split('(')[0].trim()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[12.5px] text-charcoal font-medium">
                        {totalArea.toLocaleString()} m²
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-[13px] font-medium text-charcoal">
                        {totalSpeciesInSurvey}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium leading-none tracking-wide capitalize",
                        survey?.status === 'Synced' 
                          ? "bg-[#dcf1e6] text-[#27523a]" 
                          : "bg-orange-100 text-orange-800"
                      )}>
                        {survey?.status || 'Pending'}
                      </span>
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
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-moss/70">
                  No surveys found. Click &quot;New Survey&quot; to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

