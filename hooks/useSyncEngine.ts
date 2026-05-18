import { useEffect, useState, useCallback } from "react";
import { useSurveyStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export function useSyncEngine() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pendingCount = useSurveyStore(state => state.surveys.filter(s => s.status === 'Pending' && !s.id.startsWith('mock-')).length);
  const isGuest = useSurveyStore(state => state.identity.isGuest);
  const preferences = useSurveyStore(state => state.preferences);
  const localDeviceId = useSurveyStore(state => state.identity.local_device_id);
  const hasFirstName = useSurveyStore(state => !!state.profile.firstName);
  
  const updateSurvey = useSurveyStore(state => state.updateSurvey);
  const setLastSyncedAt = useSurveyStore(state => state.setLastSyncedAt);
  const setIdentity = useSurveyStore(state => state.setIdentity);
  const updateProfile = useSurveyStore(state => state.updateProfile);
  const replaceSurveys = useSurveyStore(state => state.replaceSurveys);
  const resetStore = useSurveyStore(state => state.resetStore);

  const fetchUserSurveys = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('survey_data')
        .eq('user_id', uid);

      if (error) throw error;

      if (data) {
        const surveys = data.map(d => d.survey_data);
        replaceSurveys(surveys);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      if (err.message === 'Failed to fetch') {
         setError("Network error: Could not fetch user data. Check your internet connection.");
      } else {
         setError(err.message);
      }
    }
  }, [replaceSurveys]);

  const syncData = useCallback(async (uid: string) => {
    const currentState = useSurveyStore.getState();
    const pendingSurveys = currentState.surveys.filter(s => s.status === "Pending" && !s.id.startsWith('mock-'));
    if (pendingSurveys.length === 0) return;

    setSyncing(true);
    setError(null);
    try {
      const updates = pendingSurveys.map(survey => ({
        id: survey.id,
        user_id: uid,
        device_id: localDeviceId,
        survey_data: survey,
        sync_status: "Synced",
        updated_at: new Date().toISOString()
      }));

      const { error: dbError } = await supabase
        .from('surveys')
        .upsert(updates);

      if (dbError) throw new Error(dbError.message);

      pendingSurveys.forEach(survey => {
        updateSurvey(survey.id, { status: "Synced" });
      });
      setLastSyncedAt(Date.now());

    } catch (err: any) {
      console.error("Sync error:", err);
      if (err.message === 'Failed to fetch') {
        setError("Network error: Could not reach sync server. Please check your internet connection.");
      } else {
        setError(err.message);
      }
    } finally {
      setSyncing(false);
    }
  }, [localDeviceId, updateSurvey, setLastSyncedAt]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (!hasFirstName) {
          updateProfile({
            firstName: session.user.user_metadata.first_name || '',
            lastName: session.user.user_metadata.last_name || '',
            title: session.user.user_metadata.title || '',
            role: session.user.user_metadata.role || '',
            institution: session.user.user_metadata.institution || '',
          });
        }

        if (isGuest) {
          setIdentity({ isGuest: false });
          // Migrate data and fetch cloud data when transitioning from guest
          await syncData(session.user.id);
          await fetchUserSurveys(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        resetStore();
      }
    });

    // Check if we are already logged in but haven't fetched data yet
    const initSync = async () => {
      if (!isGuest) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          fetchUserSurveys(session.user.id);
        }
      }
    };
    initSync();

    return () => {
      subscription.unsubscribe();
    };
  }, [isGuest, hasFirstName, updateProfile, setIdentity, syncData, fetchUserSurveys, resetStore]);

  useEffect(() => {
    const checkAndSync = async () => {
      if (!navigator.onLine) return;
      if (isGuest) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const connection = (navigator as any).connection;
      let isWifi = true;
      let isCellular = false;
      
      if (connection && connection.type) {
        isWifi = connection.type === 'wifi';
        isCellular = ['cellular', '4g', '3g', '2g'].includes(connection.type);
      }
      
      let shouldSync = false;
      if (preferences.autoSync && isWifi) shouldSync = true;
      if (preferences.autoSyncMobile && isCellular) shouldSync = true;
      if (!connection && (preferences.autoSync || preferences.autoSyncMobile)) shouldSync = true;
      
      if (shouldSync) {
         await syncData(session.user.id);
      }
    };

    const intervalId = setInterval(checkAndSync, 8000);
    window.addEventListener('online', checkAndSync);
    checkAndSync();
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', checkAndSync);
    };
  }, [pendingCount, isGuest, preferences, syncData]);

  return { syncing, syncData, error };
}
