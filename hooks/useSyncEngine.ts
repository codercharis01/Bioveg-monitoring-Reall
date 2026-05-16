import { useEffect, useState, useCallback } from "react";
import { useSurveyStore } from "@/lib/store";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, writeBatch, collection, getDocs, query, where } from "firebase/firestore";

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
      const batch = writeBatch(db);
      
      pendingSurveys.forEach(survey => {
        const docRef = doc(db, "surveys", survey.id);
        batch.set(docRef, {
          ...survey,
          userId: uid,
          deviceId: state.identity.local_device_id,
          syncStatus: "Synced",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();

      // Update local state to synced
      pendingSurveys.forEach(survey => {
        state.updateSurvey(survey.id, { status: "Synced" });
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }, [state]);

  // We should listen to auth state changes to detect if we have upgraded from guest to user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // user is logged in
        // if they were a guest previously, we migrate them.
        if (state.identity.isGuest) {
          state.setIdentity({ isGuest: false });
          // Force a sync of all pending local data
          await syncData(user.uid);
        }
      } else {
        // user is logged out, mark as guest if not already
        if (!state.identity.isGuest) {
           state.setIdentity({ isGuest: true });
        }
      }
    });
    return () => unsub();
  }, [state, syncData]);

  // Setup periodic sync when online and logged in
  useEffect(() => {
    const checkAndSync = async () => {
      if (!navigator.onLine) return;
      if (state.identity.isGuest) return;
      
      const user = auth.currentUser;
      if (!user) return;

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
         await syncData(user.uid);
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
