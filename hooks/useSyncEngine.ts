import { useEffect, useState, useCallback } from "react";
import { useSurveyStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export function useSyncEngine() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const state = useSurveyStore(state => state);

  const syncData = useCallback(async (uid: string) => {
    const pendingSurveys = state.surveys.filter(s => s.status === "Pending");
    if (pendingSurveys.length === 0) return;

    setSyncing(true);
    setError(null);
    try {
      const updates = pendingSurveys.map(survey => ({
        id: survey.id,
        user_id: uid,
        device_id: state.identity.local_device_id,
        survey_data: survey,
        sync_status: "Synced",
        updated_at: new Date().toISOString()
      }));

      // In Supabase, you can do an upsert
      const { error: dbError } = await supabase
        .from('surveys')
        .upsert(updates);

      if (dbError) throw new Error(dbError.message);

      // Update local state to synced
      pendingSurveys.forEach(survey => {
        state.updateSurvey(survey.id, { status: "Synced" });
      });
      state.setLastSyncedAt(Date.now());

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }, [state]);

  // We should listen to auth state changes to detect if we have upgraded from guest to user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // user is logged in
        // if they were a guest previously, we migrate them.
        if (state.identity.isGuest) {
          state.setIdentity({ isGuest: false });
          // Force a sync of all pending local data
          await syncData(session.user.id);
        }
      } else {
        // user is logged out, mark as guest if not already
        if (!state.identity.isGuest) {
           state.setIdentity({ isGuest: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [state, syncData]);

  // Setup periodic sync when online and logged in
  useEffect(() => {
    const checkAndSync = async () => {
      if (!navigator.onLine) return;
      if (state.identity.isGuest) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const prefs = state.preferences;
      const connection = (navigator as any).connection;
      let isWifi = true;
      let isCellular = false;
      
      if (connection && connection.type) {
        isWifi = connection.type === 'wifi';
        isCellular = ['cellular', '4g', '3g', '2g'].includes(connection.type);
      }
      
      let shouldSync = false;
      if (prefs.autoSync && isWifi) shouldSync = true;
      if (prefs.autoSyncMobile && isCellular) shouldSync = true;
      if (!connection && (prefs.autoSync || prefs.autoSyncMobile)) shouldSync = true;
      
      if (shouldSync) {
         await syncData(session.user.id);
      }
    };

    const intervalId = setInterval(checkAndSync, 15000);
    window.addEventListener('online', checkAndSync);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', checkAndSync);
    };
  }, [state.surveys, state.identity.isGuest, state.preferences]);

  return { syncing, syncData, error };
}
