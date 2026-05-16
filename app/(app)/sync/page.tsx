'use client';

import { useState } from 'react';
import { useSurveyStore, SurveySession } from '@/lib/store';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { cn } from '@/lib/utils';
import { Cloud, Wifi, WifiOff, CloudUpload, ArrowRight, UserPlus, CloudOff } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function SyncPage() {
  const surveys = useSurveyStore(state => state.surveys) || [];
  const identity = useSurveyStore(state => state.identity);
  const { syncing, syncData, error: syncError } = useSyncEngine();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const pendingSurveys = surveys.filter(s => s?.status === 'Pending');
  const pendingCount = pendingSurveys.length;
  
  const handleSyncAll = async () => {
    if (pendingCount === 0 || identity.isGuest) return;
    const user = auth.currentUser;
    if (user) {
      await syncData(user.uid);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (!email || !password) throw new Error("Please fill in both fields");
      // This will trigger the global auth observer and auto-migrate standard data
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto w-full">
      <div className="mb-6 md:mb-8">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.3px] text-charcoal">Cloud Synchronization</h1>
        <p className="text-[13px] md:text-[14px] text-moss/70 mt-1">
          {pendingCount} items pending {identity.isGuest ? '· Upgrade required' : ''}
        </p>
      </div>

      {identity.isGuest ? (
        <div className="bg-white border-2 border-forest/20 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
             <div className="flex-1">
               <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                 <CloudOff className="w-6 h-6" />
               </div>
               <h2 className="text-xl font-semibold text-charcoal mb-2">You are using Offline Mode</h2>
               <p className="text-moss/80 text-[14.5px] leading-relaxed mb-6">
                 Your ecological surveys are currently stored locally on this device. To securely back up your biodiversity data, sync across devices, or collaborate with the broader research team, please create a free account.
               </p>
               <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 text-[13px] font-medium mb-6">
                 All your {surveys.length} local records and biodiversity calculations will be successfully merged and preserved during the upgrade process.
               </div>
             </div>
             <div className="w-full md:w-[320px] bg-slate-50 border border-slate-200 p-5 rounded-xl">
               <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                 <UserPlus className="w-4 h-4 text-forest" /> Create Account
               </h3>
               {authError && <div className="p-3 mb-4 bg-red-50 text-red-600 text-xs rounded border border-red-100">{authError}</div>}
               <form onSubmit={handleCreateAccount} className="space-y-4">
                 <div>
                   <label className="block text-[12px] font-medium text-moss/70 mb-1">Email</label>
                   <input 
                     type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                     className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-forest/50" />
                 </div>
                 <div>
                   <label className="block text-[12px] font-medium text-moss/70 mb-1">Password</label>
                   <input 
                     type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                     className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-forest/50" />
                 </div>
                 <button 
                  disabled={authLoading}
                  className="w-full bg-forest text-white py-2.5 rounded-lg text-[13px] font-medium hover:bg-forest-mid transition-colors mt-2 disabled:opacity-75"
                 >
                   {authLoading ? 'Upgrading...' : 'Save & Sync Data'}
                 </button>
               </form>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-forest/10 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center mb-8 shadow-sm">
          <div className="w-16 h-16 bg-mint/50 rounded-2xl flex items-center justify-center mb-5 border border-forest/10 text-forest">
            {syncing ? <CloudUpload className="w-7 h-7 animate-pulse" /> : <Cloud className="w-7 h-7" />}
          </div>
          <div className="text-xl font-semibold text-charcoal mb-2">
            {pendingCount === 0 ? 'All records are synced' : syncing ? 'Syncing securely...' : `${pendingCount} records awaiting upload`}
          </div>
          <div className="text-[14.5px] text-moss/70 mb-6 max-w-md">
            {pendingCount === 0 
              ? "Your local field data matches the remote database. You're up to date." 
              : "Internet connection detected. Tap the button below to upload your local vegetation records."}
          </div>
          {syncError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded w-full max-w-md border border-red-100">
              {syncError}
            </div>
          )}
          <button 
            className="bg-forest text-white px-6 py-3 rounded-xl font-medium text-[14px] hover:bg-forest-mid transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm min-w-[200px]"
            onClick={handleSyncAll} 
            disabled={syncing || pendingCount === 0}
          >
            {syncing ? 'Synchronizing...' : 'Sync Pending Data Now'}
          </button>
        </div>
      )}

      <div className="bg-white border border-forest/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 px-5 border-b border-forest/10 bg-slate-50/50">
          <span className="text-[13.5px] font-semibold text-charcoal">Synchronization Queue</span>
          <span className="text-[12px] font-medium text-moss/70">{surveys.length} total local records</span>
        </div>
        
        {surveys.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-moss/70">
            No surveys found
          </div>
        ) : (
          <div className="divide-y divide-forest/10 max-h-[400px] overflow-y-auto">
            {surveys.map((survey: SurveySession, index: number) => {
              const isSynced = survey?.status === 'Synced';
              return (
                <div key={survey?.id || index} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", isSynced ? "bg-sage" : "bg-amber-500")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-charcoal truncate">{survey?.projectName || 'Unnamed'}</div>
                    <div className="text-[12px] text-moss/60 truncate mt-0.5">{survey?.speciesList?.length || 0} species · {survey?.date || 'Unknown Date'}</div>
                  </div>
                  <div className="text-[12px] font-medium px-2.5 py-1 rounded-md border text-right">
                    {isSynced 
                      ? <span className="text-forest border-transparent">Synced</span> 
                      : <span className="text-amber-700 bg-amber-50 border-amber-200">Pending</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
