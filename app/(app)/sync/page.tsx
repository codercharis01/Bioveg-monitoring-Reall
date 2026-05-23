'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSurveyStore, SurveySession } from '@/lib/store';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { cn } from '@/lib/utils';
import { Cloud, Wifi, WifiOff, CloudUpload, ArrowRight, UserPlus, CloudOff, Eye, EyeOff, Mail, CheckCircle2, UserCheck, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type AuthFlow = 'login' | 'register' | 'verify' | 'forgot' | 'reset-sent';

export default function SyncPage() {
  const router = useRouter();
  const surveys = useSurveyStore(state => state.surveys) || [];
  const identity = useSurveyStore(state => state.identity);
  const { syncing, syncData, error: syncError } = useSyncEngine();
  const [view, setView] = useState<AuthFlow>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration fields
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [institution, setInstitution] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const pendingSurveys = surveys.filter(s => s?.status === 'Pending');
  const pendingCount = pendingSurveys.length;

  useEffect(() => {
    let unmounted = false;
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (unmounted) return;
      // If user logs in successfully, auto-sync
      if (session?.user && pendingCount > 0 && !identity.isGuest) {
        await syncData(session.user.id);
      }
    });

    return () => {
      unmounted = true;
      data.subscription.unsubscribe();
    };
  }, [pendingCount, identity.isGuest, syncData]);
  
  const handleSyncAll = async () => {
    if (pendingCount === 0 || identity.isGuest) return;
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      await syncData(user.id);
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (!trimmedEmail && view !== 'forgot') throw new Error("Please enter your email");
      
      if (view === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (authError) throw authError;

        // Auto-sync
        const state = useSurveyStore.getState();
        const pendingSurveys = state.surveys.filter(s => s.status === 'Pending');
        if (pendingSurveys.length > 0 && data.user) {
          (async () => {
            try {
              const updates = pendingSurveys.map(survey => ({
                id: survey.id,
                user_id: data.user.id,
                device_id: state.identity.local_device_id,
                survey_data: survey,
                sync_status: "Synced",
                updated_at: new Date().toISOString()
              }));
              const { error: dbError } = await supabase.from('surveys').upsert(updates);
              if (!dbError) {
                pendingSurveys.forEach(survey => {
                  state.updateSurvey(survey.id, { status: "Synced" });
                });
                state.setLastSyncedAt(Date.now());
              }
            } catch (e) {
              console.error(e);
            }
          })();
        }
        
        if (state.identity.isGuest) {
          state.setIdentity({ isGuest: false });
        }
        
        window.location.href = '/dashboard';
        return;
      } else if (view === 'register') {
        if (!password) throw new Error("Please enter a password");
        if (password.length < 6) throw new Error("Password must be at least 6 characters long");

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              title,
              role,
              institution
            }
          }
        });
        if (signUpError) throw signUpError;
        
        if (data.session) {
          if (useSurveyStore.getState().identity.isGuest) {
            useSurveyStore.getState().setIdentity({ isGuest: false });
          }
          window.location.href = '/dashboard';
          return;
        }

        setView('verify');
      } else if (view === 'forgot') {
        if (!trimmedEmail) throw new Error("Please enter your email address.");
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/?view=recovery`,
        });
        if (error) throw error;
        setView('reset-sent');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message === 'Invalid login credentials') {
        setAuthError("Password or Email Incorrect");
      } else if (err.message === 'Failed to fetch') {
        setAuthError("Network error: Could not reach authentication server.");
      } else if (err.message.includes('already registered')) {
        setAuthError("User already exists, Sign In?");
      } else {
        setAuthError(err.message);
      }
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
             <div className="w-full md:w-[350px] bg-slate-50 border border-slate-200 p-5 rounded-xl">
               {view === 'verify' && (
                 <div className="text-center">
                   <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Mail className="w-6 h-6 text-emerald-700" />
                   </div>
                   <h3 className="font-semibold text-charcoal mb-2">Verify your email</h3>
                   <p className="text-[13px] text-moss/70 mb-4">
                     We have sent you a verification email to <span className="font-semibold">{email}</span>. Verify it and log in.
                   </p>
                   <button 
                     onClick={() => setView('login')}
                     className="w-full bg-forest text-white py-2.5 rounded-lg text-[13px] font-medium hover:bg-forest-mid transition-colors"
                   >
                     Return to Sign In
                   </button>
                 </div>
               )}

               {view === 'reset-sent' && (
                 <div className="text-center">
                   <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                   </div>
                   <h3 className="font-semibold text-charcoal mb-2">Check your email</h3>
                   <p className="text-[13px] text-moss/70 mb-4">
                     We sent you a password change link to <span className="font-semibold">{email}</span>.
                   </p>
                   <button 
                     onClick={() => setView('login')}
                     className="w-full bg-forest text-white py-2.5 rounded-lg text-[13px] font-medium hover:bg-forest-mid transition-colors"
                   >
                     Sign In
                   </button>
                 </div>
               )}

               {view === 'forgot' && (
                 <div>
                   <h3 className="font-semibold text-charcoal mb-2">Forgot password?</h3>
                   <p className="text-[13px] text-moss/70 mb-4">Enter your email address to receive a password reset link.</p>
                   {authError && <div className="p-3 mb-4 bg-red-50 text-red-600 text-xs rounded border border-red-100">{authError}</div>}
                   <form onSubmit={handleAuthAction} className="space-y-4">
                     <div>
                       <label className="block text-[12px] font-medium text-moss/70 mb-1">Email address</label>
                       <input 
                         type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                         className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-forest/50" />
                     </div>
                     <div className="pt-2 space-y-2">
                       <button 
                         disabled={authLoading}
                         className="w-full bg-forest text-white py-2.5 rounded-lg text-[13px] font-medium hover:bg-forest-mid transition-colors disabled:opacity-75"
                       >
                         {authLoading ? 'Sending...' : 'Get Reset Link'}
                       </button>
                       <button 
                         type="button"
                         onClick={() => { setView('login'); setAuthError(''); }}
                         className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-colors"
                       >
                         Back to Sign In
                       </button>
                     </div>
                   </form>
                 </div>
               )}

               {(view === 'login' || view === 'register') && (
                 <div>
                   <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                     <UserPlus className="w-4 h-4 text-forest" /> {view === 'register' ? 'Create Account' : 'Sign In'}
                   </h3>
                   {authError && (
                     <div className="p-3 mb-4 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                       {authError}
                       {authError === "Password or Email Incorrect" && view === 'login' && (
                         <div className="mt-1">
                           <button type="button" onClick={() => setView('forgot')} className="underline font-semibold">Reset password?</button>
                         </div>
                       )}
                     </div>
                   )}
                   <form onSubmit={handleAuthAction} className="space-y-3">
                     {view === 'register' && (
                       <>
                         <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-[12px] font-medium text-moss/70 mb-1">First Name</label>
                              <input required type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-forest/50" />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[12px] font-medium text-moss/70 mb-1">Last Name</label>
                              <input required type="text" value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-forest/50" />
                            </div>
                         </div>
                       </>
                     )}
                     <div>
                       <label className="block text-[12px] font-medium text-moss/70 mb-1">Email</label>
                       <input 
                         type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                         className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-forest/50" />
                     </div>
                     <div>
                       <div className="flex items-center justify-between mb-1">
                         <label className="block text-[12px] font-medium text-moss/70">Password</label>
                       </div>
                       <div className="relative">
                         <input 
                           type={showPassword ? "text" : "password"} required value={password} onChange={e=>setPassword(e.target.value)}
                           className="w-full bg-white border border-slate-200 px-3 py-2 pr-10 rounded-lg text-sm outline-none focus:border-forest/50" />
                         <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                           {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                       </div>
                       {view === 'login' && (
                         <div className="flex justify-end mt-1">
                           <button type="button" onClick={() => setView('forgot')} className="text-[12px] font-medium text-forest hover:text-forest-mid">Forgot password?</button>
                         </div>
                       )}
                     </div>
                     <div className="pt-2 space-y-2">
                       <button 
                         disabled={authLoading}
                         className="w-full bg-forest text-white py-2.5 rounded-lg text-[13px] font-medium hover:bg-forest-mid transition-colors disabled:opacity-75"
                       >
                         {authLoading ? 'Processing...' : (view === 'register' ? 'Save & Sync Data' : 'Sign In & Sync')}
                       </button>
                       <button 
                         type="button"
                         onClick={() => { setView(view === 'login' ? 'register' : 'login'); setAuthError(''); }}
                         className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-colors"
                       >
                         {view === 'register' ? 'Already have an account? Sign In' : 'Create a New Account'}
                       </button>
                     </div>
                   </form>
                 </div>
               )}
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
              const isError = survey?.status === 'Error' as any; // Allow for 'Error' state if added later
              return (
                <div key={survey?.id || index} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", isSynced ? "bg-sage" : isError ? "bg-red-500" : "bg-amber-500")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-charcoal truncate">{survey?.projectName || 'Unnamed'}</div>
                    <div className="text-[12px] text-moss/60 truncate mt-0.5">{survey?.speciesList?.length || 0} species · {survey?.date || 'Unknown Date'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("text-[12px] font-medium px-2.5 py-1 rounded-md border flex items-center gap-1.5", 
                      isSynced ? "text-forest border-transparent bg-emerald-50/50" : isError ? "text-red-700 bg-red-50 border-red-200" : "text-amber-700 bg-amber-50 border-amber-200")}>
                      {isSynced ? <CheckCircle2 className="w-3.5 h-3.5" /> : isError ? <CloudOff className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span>{isSynced ? 'Synced' : isError ? 'Error' : 'Pending'}</span>
                    </div>
                    {!isSynced && !identity.isGuest && (
                      <button 
                        onClick={handleSyncAll}
                        disabled={syncing}
                        className="p-1.5 text-forest hover:bg-forest/10 rounded-md transition-colors disabled:opacity-50"
                        title="Sync manually"
                      >
                        <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                      </button>
                    )}
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
