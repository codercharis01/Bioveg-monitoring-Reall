'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, Map as MapIcon, BarChart3, Settings, Leaf, PlusCircle, Trees, RefreshCw, FileText, Share2, Disc3, Menu, X, ArrowLeft, WifiOff, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSurveyStore } from '@/lib/store';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { supabase } from '@/lib/supabase';

import { formatDistanceToNow } from 'date-fns';

const navSections = [
  {
    title: 'Overview',
    items: [
      { icon: Home, label: 'Dashboard', href: '/dashboard' },
      { icon: Compass, label: 'Surveys', href: '/surveys', badge: true },
    ]
  },
  {
    title: 'Field Work',
    items: [
      { icon: Disc3, label: 'New Survey', href: '/surveys/new' },
      { icon: PlusCircle, label: 'Species Entry', href: '/species' },
      { icon: MapIcon, label: 'GPS & Mapping', href: '/map' },
    ]
  },
  {
    title: 'Analysis',
        items: [
      { icon: BarChart3, label: 'Diversity Indices', href: '/analytics' },
      { icon: Trees, label: 'Parameters', href: '/phytosociology' },
    ]
  },
  {
    title: 'System',
    items: [
      { icon: RefreshCw, label: 'Offline Sync', href: '/sync' },
      { icon: FileText, label: 'Export', href: '/export' },
      { icon: Settings, label: 'Settings', href: '/settings' },
    ]
  }
];

const mobileNavItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Compass, label: 'Surveys', href: '/surveys' },
  { icon: PlusCircle, label: 'Add', href: '/species' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: MapIcon, label: 'Map', href: '/map' },
  { icon: FileText, label: 'Export', href: '/export' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const surveys = useSurveyStore(state => state.surveys);
  const profile = useSurveyStore(state => state.profile);
  const identity = useSurveyStore(state => state.identity);
  const lastSyncedAt = useSurveyStore(state => state.lastSyncedAt);
  const pInitials = profile?.firstName?.[0]?.toUpperCase() || 'U';
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useSyncEngine();

  useEffect(() => {
    if (mobileMenuOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMobileMenuOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const prefs = useSurveyStore(state => state.preferences);

  useEffect(() => {
    let watchId: number | null = null;
    
    // Background tracking simulation
    if (prefs.backgroundTracking && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          // In a real app we might update a current path or store position globally
          console.log("Background tracking update:", position.coords.latitude, position.coords.longitude);
        },
        console.error,
        { enableHighAccuracy: prefs.highAccuracyMode }
      );
    }
    
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [prefs.backgroundTracking, prefs.highAccuracyMode]);

  // Derive title from pathname
  const getPageTitle = () => {
    if (pathname?.startsWith('/dashboard')) return 'Dashboard';
    if (pathname?.startsWith('/surveys/new')) return 'New Survey';
    if (pathname?.startsWith('/surveys')) return 'All Surveys';
    if (pathname?.startsWith('/species')) return 'Species Entry';
    if (pathname?.startsWith('/map')) return 'GPS & Mapping';
    if (pathname?.startsWith('/analytics')) return 'Diversity Indices Analytics';
    if (pathname?.startsWith('/phytosociology')) return 'Phytosociological Parameters';
    if (pathname?.startsWith('/sync')) return 'Offline Sync';
    if (pathname?.startsWith('/export')) return 'Export & Reports';
    if (pathname?.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
  };

  const showBack = pathname !== '/dashboard' && pathname !== '/';

  if (isLoggingOut) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#FDFCF8] z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest mb-4"></div>
          <p className="text-moss font-medium">Logging out...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-cream text-charcoal font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] bg-forest flex-shrink-0 z-50">
        <div className="p-6 pb-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5 outline-none hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-md">
              <Leaf className="w-[18px] h-[18px] text-white/85" />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-white tracking-[-0.3px]">Bioveg Monitoring</div>
              <div className="text-[10px] text-white/35 font-normal tracking-[0.5px] uppercase">Field Research v2.4</div>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-2 py-3 overflow-y-auto flex flex-col gap-0.5">
          {navSections.map((section, idx) => (
            <div key={section.title}>
              <div className={cn("px-3 text-[10px] font-medium text-white/30 tracking-[1px] uppercase mb-1.5", idx === 0 ? "mt-1" : "mt-4")}>
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href) && !item.href.includes('new'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-[13.5px] select-none relative group",
                      isActive 
                        ? "bg-white/10 text-white font-medium" 
                        : "text-white/65 hover:bg-white/5 hover:text-white/90 font-normal"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "opacity-100" : "opacity-80")} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-moss text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full font-mono">
                        {surveys.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="flex-col p-3 pb-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/5 transition-colors mb-2">
            <div className="w-[30px] h-[30px] rounded-full bg-moss flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              {pInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium text-white/85 truncate">{profile?.title} {profile?.firstName} {profile?.lastName}</div>
              <div className="text-[11px] text-white/35 truncate">{profile?.role}</div>
            </div>
          </div>
          <button 
            onClick={async () => {
              setIsLoggingOut(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                if (user) {
                  const state = useSurveyStore.getState();
                  const pendingSurveys = state.surveys.filter(s => s.status === 'Pending');
                  if (pendingSurveys.length > 0) {
                    const updates = pendingSurveys.map(survey => ({
                      id: survey.id,
                      user_id: user.id,
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
                  }
                }
                useSurveyStore.getState().setIdentity({ isGuest: false });
                await supabase.auth.signOut();
              } catch (e) { console.error(e); }
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-[13.5px] text-white/65 hover:bg-white/5 hover:text-white/90"
          >
            <LogOut className="w-4 h-4 opacity-80" />
            <span className="font-normal">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Offline Banner */}
        {identity?.isGuest && (
          <div className="bg-amber-100/50 border-b border-amber-200/60 text-amber-800 px-4 py-2 text-[13px] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600" />
              <span className="font-semibold">OFFLINE MODE ACTIVE:</span>
              <span className="hidden sm:inline">Your ecological surveys are stored locally and will sync when internet becomes available.</span>
              <span className="sm:hidden">Local mode.</span>
            </div>
            <Link href="/sync" className="text-amber-700 font-semibold hover:underline text-xs bg-amber-200/50 px-2 py-1 rounded hidden sm:block">
              Create Account &rarr;
            </Link>
          </div>
        )}
        
        {/* Topbar */}
        <header className="h-[56px] bg-white border-b border-forest/10 flex items-center px-6 gap-4 flex-shrink-0">
          {showBack && (
            <button onClick={() => router.back()} className="mr-[-4px] p-1.5 rounded-md hover:bg-slate-100 text-charcoal/60 transition-colors">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
          )}
          <div className="text-[15px] font-semibold text-charcoal tracking-tight">
            {getPageTitle()}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[13px] text-moss/70">
            <span className="text-forest-light">Projects</span>
            <span className="text-moss/40 text-[10px]">▶</span>
            <span>Overview</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-sage-pale rounded-full text-[12px] font-medium text-forest-mid border border-moss/20">
              <div className="w-1.5 h-1.5 rounded-full bg-moss" />
              {lastSyncedAt ? `Synced ${formatDistanceToNow(lastSyncedAt)} ago` : 'Waiting to sync...'}
            </div>
            <Link href="/surveys/new" className="flex items-center gap-1.5 px-3.5 py-1.5 bg-forest hover:bg-forest-mid text-white rounded-md text-[13px] font-medium transition-colors">
              <PlusCircle className="w-[15px] h-[15px]" />
              <span className="hidden sm:inline">New Survey</span>
            </Link>
            <button 
              onClick={async () => {
                setIsLoggingOut(true);
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  const user = session?.user;
                  if (user) {
                    const state = useSurveyStore.getState();
                    const pendingSurveys = state.surveys.filter(s => s.status === 'Pending');
                    if (pendingSurveys.length > 0) {
                      const updates = pendingSurveys.map(survey => ({
                        id: survey.id,
                        user_id: user.id,
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
                    }
                  }
                  useSurveyStore.getState().setIdentity({ isGuest: false });
                  await supabase.auth.signOut();
                } catch (e) { console.error(e); }
                window.location.href = '/';
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-forest/20 text-forest hover:bg-forest/5 rounded-md text-[13px] font-medium transition-colors ml-1"
              title="Log Out"
            >
              <LogOut className="w-[15px] h-[15px]" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-7 md:p-8 relative min-h-0">
          {children}
        </div>
        
        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden flex items-center justify-around bg-white border-t border-forest/10 px-2 py-1 h-[64px] z-50 flex-shrink-0">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href) && !item.href.includes('new'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-[3px] p-2 rounded-md transition-colors",
                  isActive ? "text-forest" : "text-moss hover:bg-mint"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2 opacity-70")} />
                <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium opacity-70")}>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-[3px] p-2 rounded-md transition-colors text-moss hover:bg-mint"
          >
            <Menu className="w-5 h-5 stroke-2 opacity-70" />
            <span className="text-[10px] font-medium opacity-70">Menu</span>
          </button>
        </nav>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[280px] max-w-[80vw] bg-forest h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between p-6 pb-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-md">
                    <Leaf className="w-[18px] h-[18px] text-white/85" />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-white tracking-[-0.3px]">Bioveg Monitoring</div>
                    <div className="text-[10px] text-white/35 font-normal tracking-[0.5px] uppercase">Field Tools</div>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white p-1 outline-none">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-1">
                {navSections.map((section, idx) => (
                  <div key={section.title} className="mb-2">
                    <div className="px-3 text-[11px] font-semibold text-white/40 tracking-[1px] uppercase mb-2">
                      {section.title}
                    </div>
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href) && !item.href.includes('new'));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-[14.5px] select-none",
                            isActive 
                              ? "bg-white/10 text-white font-medium" 
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "opacity-100" : "opacity-80")} />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-moss text-white text-[11px] font-medium px-2 py-0.5 rounded-full font-mono">
                              {surveys.length}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
              
              <div className="flex-col p-4 border-t border-white/10">
                <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/5 transition-colors mb-2">
                  <div className="w-[30px] h-[30px] rounded-full bg-moss flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                    {pInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium text-white/85 truncate">{profile?.title} {profile?.firstName} {profile?.lastName}</div>
                    <div className="text-[11px] text-white/35 truncate">{profile?.role || "Settings"}</div>
                  </div>
                </Link>
                <button 
                  onClick={async () => {
                    setIsLoggingOut(true);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const user = session?.user;
                      if (user) {
                        const state = useSurveyStore.getState();
                        const pendingSurveys = state.surveys.filter(s => s.status === 'Pending');
                        if (pendingSurveys.length > 0) {
                          const updates = pendingSurveys.map(survey => ({
                            id: survey.id,
                            user_id: user.id,
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
                        }
                      }
                      useSurveyStore.getState().setIdentity({ isGuest: false });
                      await supabase.auth.signOut();
                    } catch (e) { console.error(e); }
                    window.location.href = '/';
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-[14.5px] text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="w-5 h-5 opacity-80" />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
