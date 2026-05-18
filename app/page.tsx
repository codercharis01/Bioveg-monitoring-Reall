'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, ArrowRight, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSurveyStore } from '@/lib/store';

type AuthFlow = 'login' | 'register' | 'verify' | 'forgot' | 'reset-sent' | 'update-password';

export default function Home() {
  const [view, setView] = useState<AuthFlow>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration specific fields
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [institution, setInstitution] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check session and only redirect after checking for reload/new session signout
  useEffect(() => {
    // Check hash for specific errors
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        if (hash.includes('type=recovery')) {
           setTimeout(() => setView('update-password'), 0);
        }
        
        const hashParams = new URLSearchParams(hash.substring(1));
        const errorDesc = hashParams.get('error_description');
        const hasAccessToken = hashParams.has('access_token');
        if (errorDesc) {
          setTimeout(() => setError(decodeURIComponent(errorDesc.replace(/\+/g, ' '))), 0);
          if (!hasAccessToken) {
             window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }
    }

    let subscription: any = null;

    const init = async () => {
      // Get initial session first to avoid flash
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession?.user && (view === 'login' || view === 'verify' || view === 'register') && !window.location.hash.includes('type=recovery')) {
        router.replace('/dashboard');
        return;
      }
      
      setIsCheckingSession(false);

      // Now monitor auth state
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event as string) === 'PASSWORD_RECOVERY') {
          setView('update-password');
          setIsCheckingSession(false);
          return;
        }

        // Only auto-redirect if they are in the login or register view and NOT in recovery flow
        if (session?.user && (view === 'login' || view === 'verify' || view === 'register') && (event as string) !== 'PASSWORD_RECOVERY' && !window.location.hash.includes('type=recovery')) {
          const state = useSurveyStore.getState();
          const pendingSurveys = state.surveys.filter(s => s.status === 'Pending' && !s.id.startsWith('mock-'));
          if (pendingSurveys.length > 0) {
            try {
              const updates = pendingSurveys.map(survey => ({
                  id: survey.id,
                  user_id: session.user.id,
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
              }
            } catch (e) {
              console.error(e);
            }
          }
          
          if (state.identity.isGuest) {
            state.setIdentity({ isGuest: false });
          }
          router.replace('/dashboard');
        }
      });
      subscription = data.subscription;
    };

    init();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router, view]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      const user = data.user;
      const state = useSurveyStore.getState();
      
      if (user) {
        state.updateProfile({
          firstName: user.user_metadata.first_name || '',
          lastName: user.user_metadata.last_name || '',
          title: user.user_metadata.title || '',
          role: user.user_metadata.role || '',
          institution: user.user_metadata.institution || '',
        });
      }
      
      const pendingSurveys = state.surveys.filter(s => s.status === 'Pending' && !s.id.startsWith('mock-'));
      if (pendingSurveys.length > 0) {
        try {
          const updates = pendingSurveys.map(survey => ({
              id: survey.id,
              user_id: user?.id,
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
      }
      
      if (state.identity.isGuest) {
        state.setIdentity({ isGuest: false });
      }

      router.replace('/dashboard');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError("Network error: Could not reach authentication server. Check your internet.");
      } else if (err.message === 'Invalid login credentials') {
        setError("Email does not exist or incorrect password. Create an account?");
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#FDFCF8]">
         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter an email and password to sign up.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
          data: {
            first_name: firstName,
            last_name: lastName,
            title,
            role,
            institution
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // If email confirmation is off, we might get a session immediately
      if (data.session) {
        const user = data.user;
        const state = useSurveyStore.getState();
        
        if (user) {
          state.updateProfile({
            firstName: user.user_metadata.first_name || '',
            lastName: user.user_metadata.last_name || '',
            title: user.user_metadata.title || '',
            role: user.user_metadata.role || '',
            institution: user.user_metadata.institution || '',
          });
        }
        
        if (state.identity.isGuest) {
          state.setIdentity({ isGuest: false });
        }
        
        window.location.replace('/dashboard');
        return;
      }

      setLoading(false);
      setView('verify');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError("Network error: Could not reach authentication server. Check your internet.");
      } else if (err.message.includes('already registered')) {
        setError("User already exists, Sign In?");
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
      });
      if (error) throw error;
      setLoading(false);
      setView('reset-sent');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      await supabase.auth.signOut();
      setView('login');
      setError("Password updated successfully. Please sign in with your new password.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-[#FDFCF8] font-sans">
      {/* Brand Side - Desktop Only mostly */}
      <div className="hidden md:flex flex-1 bg-emerald-900 text-emerald-50 p-8 md:p-16 flex-col justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-emerald-300" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white">Bioveg Monitoring</span>
        </div>
        
        <div className="mt-24 mb-32 hidden md:block">
          <h1 className="text-5xl lg:text-6xl font-medium tracking-tight leading-tight mb-6 text-white max-w-xl">
            Ecological monitoring, elevated.
          </h1>
          <p className="text-emerald-100/80 text-xl font-light max-w-lg leading-relaxed">
            Professional-grade, offline-first field survey tool designed for modern research environments and scientific rigor.
          </p>
        </div>
        
        <div className="hidden md:flex justify-between items-center text-emerald-300/50 text-sm font-medium">
          <span>Enterprise edition</span>
          <span>© 2026 Bioveg Monitoring</span>
        </div>
      </div>

      {/* Auth Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white md:bg-[#FDFCF8] overflow-y-auto">
        <div className="w-full max-w-md my-auto py-8">
          <div className="md:hidden flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-700" />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-emerald-950">Bioveg Monitoring</span>
          </div>

          {view === 'verify' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-emerald-700" />
              </div>
              <h2 className="text-2xl font-semibold text-emerald-950 tracking-tight mb-4">
                Verify your email
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We have sent you a verification email to <span className="font-semibold text-slate-900">{email}</span>. Verify it and log in.
              </p>
              <button 
                onClick={() => {
                  setLoading(false);
                  setView('login');
                }}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
              >
                Return to Sign In
              </button>
            </div>
          )}

          {view === 'reset-sent' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              </div>
              <h2 className="text-2xl font-semibold text-emerald-950 tracking-tight mb-4">
                Check your email
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We sent you a password change link to <span className="font-semibold text-slate-900">{email}</span>.
              </p>
              <button 
                onClick={() => {
                  setLoading(false);
                  setView('login');
                }}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
              >
                Sign In
              </button>
            </div>
          )}

          {view === 'update-password' && (
            <div>
              <h2 className="text-3xl font-semibold text-emerald-950 tracking-tight mb-2">
                Set New Password
              </h2>
              <p className="text-slate-500 font-medium mb-8">
                Please enter your new password below.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleUpdatePassword}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
                    />
                    <button 
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3 mt-8">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    <span>{loading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {view === 'forgot' && (
            <div>
              <h2 className="text-3xl font-semibold text-emerald-950 tracking-tight mb-2">
                Forgot password?
              </h2>
              <p className="text-slate-500 font-medium mb-8">
                Enter your email address to receive a password reset link.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleForgotPassword}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="researcher@university.edu" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
                  />
                </div>
                
                <div className="flex flex-col space-y-3 mt-8">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    <span>{loading ? 'Sending...' : 'Get Reset Link'}</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      setView('login');
                      setError(null);
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center disabled:opacity-70"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

          {(view === 'login' || view === 'register') && (
            <div>
              <h2 className="text-3xl font-semibold text-emerald-950 tracking-tight mb-2">
                {view === 'register' ? 'Welcome' : 'Welcome back'}
              </h2>
              <p className="text-slate-500 font-medium mb-8">
                {view === 'register' ? 'Register for a researcher account' : 'Sign in to sync your field data'}
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                  {error === "Password or Email Incorrect" && view === 'login' && (
                    <div className="mt-2">
                      <button 
                        type="button" 
                        onClick={() => setView('forgot')} 
                        className="underline text-emerald-700 hover:text-emerald-800 font-semibold"
                      >
                        Reset password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form className="space-y-4" onSubmit={view === 'register' ? handleSignUp : handleSignIn}>
                {view === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Title</label>
                        <select 
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
                        >
                          <option value="" disabled>Select Title</option>
                          <option value="Prof">Prof</option>
                          <option value="Dr">Dr</option>
                          <option value="PhD">PhD</option>
                          <option value="MSc">MSc</option>
                          <option value="BSc">BSc</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Role</label>
                        <select 
                          value={role}
                          onChange={e => setRole(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
                        >
                          <option value="" disabled>Select Role</option>
                          <option value="Academic Researcher">Academic Researcher</option>
                          <option value="Research Scientist">Research Scientist</option>
                          <option value="Botanist">Botanist</option>
                          <option value="Conservation Biologist">Conservation Biologist</option>
                          <option value="Environmental Consultant">Environmental Consultant</option>
                          <option value="Environmental Policy Analyst">Environmental Policy Analyst</option>
                          <option value="Field Ecologist">Field Ecologist</option>
                          <option value="Industrial Ecologist">Industrial Ecologist</option>
                          <option value="Land Manager">Land Manager</option>
                          <option value="Restoration Ecologist">Restoration Ecologist</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">First Name</label>
                        <input 
                          type="text" 
                          required
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          placeholder="Jane" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Last Name</label>
                        <input 
                          type="text" 
                          required
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          placeholder="Doe" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Institution</label>
                      <input 
                        type="text" 
                        value={institution}
                        onChange={e => setInstitution(e.target.value)}
                        placeholder="University Name" 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="researcher@university.edu" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {view === 'login' && (
                    <div className="flex justify-end mt-1">
                      <button 
                        type="button" 
                        onClick={() => setView('forgot')}
                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-3 mt-8">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    <span>{loading ? 'Processing...' : (view === 'register' ? 'Create Account' : 'Sign In')}</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      setView(view === 'login' ? 'register' : 'login');
                      setError(null);
                    }}
                    disabled={loading}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center disabled:opacity-70"
                  >
                    {view === 'register' ? 'Already have an account? Sign In' : 'Create an Account'}
                  </button>
                </div>
              </form>

              <div className="mt-8 flex items-center justify-center">
                <div className="w-full h-px bg-slate-200"></div>
                <span className="px-4 text-sm text-slate-400 font-medium bg-white md:bg-[#FDFCF8]">OR</span>
                <div className="w-full h-px bg-slate-200"></div>
              </div>

              {!loading && (
                <div className="mt-8">
                  <button 
                    onClick={() => {
                      useSurveyStore.getState().initGuestIdentity();
                      router.push('/dashboard');
                    }}
                    className="w-full group bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
                  >
                    <span>Continue Offline Mode</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed max-w-sm mx-auto">
                    Proceed without an internet connection. Data will be saved locally and sync can be triggered later.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
