'use client';

import Link from 'next/link';
import { Leaf, Map as MapIcon, CloudOff, Trees, TrendingUp, Clock, AlertCircle, FileText } from 'lucide-react';
import { useSurveyStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const surveys = useSurveyStore(state => state.surveys) || [];

  const pendingSurveys = surveys.filter(s => s?.status === 'Pending').length;
  const completedSurveys = surveys.filter(s => s?.status === 'Synced').length;
  const totalSpecies = surveys.reduce((acc, survey) => acc + (survey?.speciesList?.length || 0), 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const speciesThisMonth = surveys.reduce((acc, survey) => {
    try {
      const surveyDate = new Date(survey.date);
      if (!isNaN(surveyDate.getTime()) && surveyDate.getMonth() === currentMonth && surveyDate.getFullYear() === currentYear) {
        return acc + (survey?.speciesList?.length || 0);
      }
    } catch (e) {
      // Skip invalid dates
    }
    return acc;
  }, 0);

  const profile = useSurveyStore(state => state.profile);

  const sortedSurveys = [...surveys].sort((a, b) => {
    if (a.id.startsWith('mock-')) return 1;
    if (b.id.startsWith('mock-')) return -1;
    const timeA = !isNaN(Number(a.id)) ? Number(a.id) : new Date(a.date).getTime() || 0;
    const timeB = !isNaN(Number(b.id)) ? Number(b.id) : new Date(b.date).getTime() || 0;
    return timeB - timeA;
  });

  // Unique projects grouped by projectName
  const uniqueProjects = Array.from(
    sortedSurveys.reduce((map, survey) => {
      if (!map.has(survey.projectName)) {
        map.set(survey.projectName, { ...survey, count: 1 });
      } else {
        const existing = map.get(survey.projectName);
        // Combine stats
        const mergedSpecies = new Set([
          ...(existing.speciesList || []).map((s: any) => s?.name),
          ...(survey.speciesList || []).map((s: any) => s?.name)
        ]);
        
        map.set(survey.projectName, {
          ...existing,
          numQuadrats: (existing.numQuadrats || 0) + (survey.numQuadrats || 0),
          uniqueSpeciesCount: mergedSpecies.size,
          count: existing.count + 1,
          status: existing.status === 'Pending' || survey.status === 'Pending' ? 'Pending' : 'Synced'
        });
      }
      return map;
    }, new Map<string, any>()).values()
  );

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 className="text-[22px] font-semibold text-charcoal tracking-[-0.4px] leading-tight">{profile?.firstName ? `Welcome back, ${profile.firstName} 👋` : 'Welcome, New User 👋'}</h1>
          <p className="text-[13.5px] text-moss/70 mt-1">You have {pendingSurveys} surveys pending sync · {surveys[0]?.projectName || 'Borneo Rainforest project'} updated recently</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-7">
        <div className="bg-white border border-forest/10 rounded-[16px] p-4 lg:p-5 hover:shadow-sm hover:-translate-y-[1px] transition-all cursor-default">
          <div className="w-8 h-8 rounded-lg bg-sage-pale text-forest-mid flex items-center justify-center mb-3">
            <Leaf className="w-4 h-4" />
          </div>
          <div className="text-[11.5px] font-medium text-moss/70 tracking-[0.3px] mb-2 uppercase">Species Recorded</div>
          <div className="text-[26px] font-semibold text-charcoal tracking-[-0.8px] leading-none font-mono">{totalSpecies}</div>
          <div className="flex items-center gap-1 mt-1.5 text-[12px] text-moss font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+{speciesThisMonth} this month</span>
          </div>
        </div>
        
        <div className="bg-white border border-forest/10 rounded-[16px] p-4 lg:p-5 hover:shadow-sm hover:-translate-y-[1px] transition-all cursor-default">
          <div className="w-8 h-8 rounded-lg bg-earth-pale text-earth flex items-center justify-center mb-3">
            <MapIcon className="w-4 h-4" />
          </div>
          <div className="text-[11.5px] font-medium text-moss/70 tracking-[0.3px] mb-2 uppercase">Surveys Completed</div>
          <div className="text-[26px] font-semibold text-charcoal tracking-[-0.8px] leading-none font-mono">{completedSurveys}</div>
          <div className="flex items-center gap-1 mt-1.5 text-[12px] text-moss font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{surveys.length} total</span>
          </div>
        </div>
        
        <div className="bg-white border border-forest/10 rounded-[16px] p-4 lg:p-5 hover:shadow-sm hover:-translate-y-[1px] transition-all cursor-default">
          <div className="w-8 h-8 rounded-lg bg-[#fef3e2] text-[#d97706] flex items-center justify-center mb-3">
            <CloudOff className="w-4 h-4" />
          </div>
          <div className="text-[11.5px] font-medium text-moss/70 tracking-[0.3px] mb-2 uppercase">Pending Sync</div>
          <div className="text-[26px] font-semibold text-charcoal tracking-[-0.8px] leading-none font-mono">{pendingSurveys}</div>
          <div className="flex items-center gap-1 mt-1.5 text-[12px] text-[#d97706] font-medium">
            <AlertCircle className="w-3 h-3" />
            <span>Offline queue</span>
          </div>
        </div>
        
        <div className="bg-white border border-forest/10 rounded-[16px] p-4 lg:p-5 hover:shadow-sm hover:-translate-y-[1px] transition-all cursor-default">
          <div className="w-8 h-8 rounded-lg bg-[#e8f1ff] text-[#2563eb] flex items-center justify-center mb-3">
            <Trees className="w-4 h-4" />
          </div>
          <div className="text-[11.5px] font-medium text-moss/70 tracking-[0.3px] mb-2 uppercase">Ecosystem Types</div>
          <div className="text-[26px] font-semibold text-charcoal tracking-[-0.8px] leading-none font-mono">
            {new Set(surveys.map(s => s.ecosystemType)).size}
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-[12px] text-moss font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Active projects</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 mb-5">
        <div className="bg-white border border-forest/10 rounded-[16px] overflow-hidden">
          <div className="flex items-center justify-between p-4 px-5 border-b border-forest/10">
            <span className="text-[13.5px] font-semibold text-charcoal tracking-[-0.2px]">Active Research Projects</span>
            <a href="/surveys" className="text-[12px] text-moss font-medium hover:text-forest transition-colors">View all</a>
          </div>
          <div className="py-2">
            {uniqueProjects.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-moss/70">No projects found. Start by creating a new survey.</div>
            ) : uniqueProjects.map((project) => (
              <a href={`/surveys`} key={project.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-mint transition-colors cursor-pointer group">
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  project.vegetationType?.toLowerCase().includes('forest') || project.ecosystemType?.toLowerCase().includes('forest')
                    ? "bg-[#15803d]"
                    : project.vegetationType?.toLowerCase().includes('marine') || project.ecosystemType?.toLowerCase().includes('marine')
                    ? "bg-[#0ea5e9]"
                    : project.vegetationType?.toLowerCase().includes('grass') || project.ecosystemType?.toLowerCase().includes('grass')
                    ? "bg-[#eab308]"
                    : project.vegetationType?.toLowerCase().includes('wetland') || project.ecosystemType?.toLowerCase().includes('wetland')
                    ? "bg-[#0891b2]"
                    : "bg-[#16a34a]"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-charcoal truncate">{project.projectName}</div>
                  <div className="text-[12px] text-moss/60 mt-0.5 truncate">{project.ecosystemType} · {project.count} survey{project.count !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-medium text-charcoal font-mono">{project.uniqueSpeciesCount ?? project.speciesList?.length ?? 0} spp</div>
                  <div className="text-[11.5px] text-moss/60 mt-0.5">{project.numQuadrats || 0} plots</div>
                </div>
                <div className="w-[70px] text-center ml-2">
                  <span className={cn(
                    "inline-block px-[9px] py-[3px] rounded-full text-[11px] font-medium",
                    project.status === 'Synced' 
                      ? "bg-[#eff6ff] text-[#1d4ed8]" 
                      : "bg-[#fef3e2] text-[#d97706]"
                  )}>
                    {project.status}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white border border-forest/10 rounded-[16px] overflow-hidden">
          <div className="flex items-center justify-between p-4 px-5 border-b border-forest/10">
            <span className="text-[13.5px] font-semibold text-charcoal tracking-[-0.2px]">Recent Activity</span>
            <span className="text-[12px] text-moss/50 font-medium">Activity</span>
          </div>
          <div className="py-2">
            {sortedSurveys.slice(0, 5).map((survey, index) => (
              <div key={index} className="flex gap-3 px-5 py-2.5 hover:bg-mint transition-colors cursor-pointer">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                  survey.status === 'Synced' ? "bg-sage" : "bg-[#d97706]"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-moss/80 leading-[1.4]">
                    <strong className="text-charcoal font-medium">{survey.projectName}</strong> — {survey.status === 'Synced' ? 'synced to offline storage' : 'saved locally as pending'}
                  </div>
                  <div className="text-[11.5px] text-moss/50 mt-[3px] font-mono">{survey.date} · {survey.researcherName}</div>
                </div>
              </div>
            ))}
            {surveys.length === 0 && (
              <div className="p-8 text-center text-[13px] text-moss/70">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
