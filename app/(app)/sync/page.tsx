'use client';

import { useState } from 'react';
import { useSurveyStore, SurveySession } from '@/lib/store';
import { cn } from '@/lib/utils';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export default function SyncPage() {
  const surveys = useSurveyStore(state => state.surveys) || [];
  const updateSurvey = useSurveyStore(state => state.updateSurvey);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const pendingSurveys = surveys.filter(s => s?.status === 'Pending');
  const pendingCount = pendingSurveys.length;
  
  const handleSyncAll = async () => {
    if (pendingCount === 0) return;
    const user = auth.currentUser;
    if (!user) {
      alert('You must be signed in to sync data.');
      return;
    }

    setIsSyncing(true);
    try {
      for (const survey of pendingSurveys) {
        // Upload the main survey session
        const surveyRef = doc(db, 'surveys', survey.id);
        const surveyData = {
          userId: user.uid,
          projectName: survey.projectName || '',
          siteName: survey.siteName || '',
          ecosystemType: survey.ecosystemType || '',
          vegetationType: survey.vegetationType || '',
          sampleSite: survey.sampleSite || '',
          researcherName: survey.researcherName || '',
          date: survey.date || '',
          status: 'Synced',
          numQuadrats: survey.numQuadrats || 0,
          quadratSize: survey.quadratSize || '',
          transectLength: survey.transectLength || 0,
          samplingInterval: survey.samplingInterval || 0,
          samplingMethod: survey.samplingMethod || '',
          lat: survey.lat || 0,
          lng: survey.lng || 0,
        };
        await setDoc(surveyRef, surveyData);

        // Upload species sequentially
        for (const species of (survey.speciesList || [])) {
          const speciesRef = doc(db, 'surveys', survey.id, 'species', species.id);
          const speciesData = {
            name: species.name || '',
            family: species.family || '',
            quadrats: species.quadrats || [],
            localName: species.localName || '',
            notes: species.notes || '',
            stratum: species.stratum || ''
          };
          await setDoc(speciesRef, speciesData);
        }

        // Update local store
        updateSurvey(survey.id, { status: 'Synced' });
      }

      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Failed to sync some records. Check console for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCompleted = () => {
    // Optionally remove synced items from store, or just keep them synced. We'll just keep them.
  };

  return (
    <div className="w-full">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>Offline Sync</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {pendingCount} items pending {lastSynced && `· Last synced today at ${lastSynced}`}
        </p>
      </div>

      <div className="sync-status-card">
        <div className="sync-icon-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12A9 9 0 113 12"/><path d="M21 9v3h-3"/><path d="M3 15v-3h3"/></svg>
        </div>
        <div className="sync-status-title">
          {pendingCount === 0 ? 'All records synced' : isSyncing ? 'Syncing...' : `${pendingCount} records awaiting upload`}
        </div>
        <div className="sync-status-sub">
          {pendingCount === 0 ? "You're up to date" : "You're online · Tap to sync all pending items now"}
        </div>
        <button 
          className="btn-primary" 
          style={{ marginTop: '14px', marginInline: 'auto' }} 
          onClick={handleSyncAll} 
          disabled={isSyncing || pendingCount === 0}
        >
          {isSyncing ? 'Syncing...' : 'Manually sync all pending survey data'}
        </button>
      </div>

      <div className="sync-queue-card">
        <div className="card-header">
          <span className="card-title">Sync Queue</span>
          <a className="card-action" onClick={handleClearCompleted}>Clear completed</a>
        </div>
        
        {surveys.filter(Boolean).length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            No surveys found
          </div>
        ) : (
          surveys.filter(Boolean).map((survey: SurveySession, index: number) => {
            const isSynced = survey?.status === 'Synced';
            return (
              <div key={survey?.id || index} className="sync-item">
                <div className={cn("sync-item-icon", isSynced ? "si-done" : "si-wait")}>
                  {isSynced ? (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8l4 4 7-7"/></svg>
                  ) : (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>
                  )}
                </div>
                <div className="sync-item-info">
                  <div className="sync-item-name">{survey?.projectName || 'Unnamed'} — {survey?.sampleSite || 'Unknown Site'}</div>
                  <div className="sync-item-detail">{survey?.speciesList?.length || 0} species · {survey?.date || 'Unknown Date'}</div>
                </div>
                <div className="sync-item-time">{isSynced ? 'Synced' : 'Queued'}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="storage-bar-wrap">
        <div className="storage-header">
          <span className="storage-label">Local Storage</span>
          <span className="storage-size">45 MB / 2.5 GB used</span>
        </div>
        <div className="storage-track">
          <div className="storage-fill" style={{ width: '2%' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Images: 12 MB · Survey data: 18 MB · Cache: 15 MB</span>
          <span style={{ fontSize: '12px', color: 'var(--color-moss)', fontWeight: 500, cursor: 'pointer' }}>Manage storage →</span>
        </div>
      </div>
    </div>
  );
}
