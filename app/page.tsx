'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Please enter an email and password to sign up.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
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
      <div className="flex-1 flex items-center justify-center p-8 bg-white md:bg-[#FDFCF8]">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-700" />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-emerald-950">Bioveg Monitoring</span>
          </div>

          <h2 className="text-3xl font-semibold text-emerald-950 tracking-tight mb-2">Welcome back</h2>
          <p className="text-slate-500 font-medium mb-10">Sign in to sync your field data</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignIn}>
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
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-slate-900 bg-white" 
              />
            </div>
            
            <div className="flex flex-col space-y-3 mt-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              </button>
              
              <button 
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center disabled:opacity-70"
              >
                Create Account
              </button>
            </div>
          </form>

          <div className="mt-8 flex items-center justify-center">
            <div className="w-full h-px bg-slate-200"></div>
            <span className="px-4 text-sm text-slate-400 font-medium bg-white md:bg-[#FDFCF8]">OR</span>
            <div className="w-full h-px bg-slate-200"></div>
          </div>

          <div className="mt-8">
            <Link href="/dashboard" className="w-full group bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2">
              <span>Continue Offline Mode</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
            </Link>
            <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed max-w-sm mx-auto">
              Proceed without an internet connection. Data will be saved locally and sync can be triggered later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
