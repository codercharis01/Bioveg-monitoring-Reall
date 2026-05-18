import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SpeciesRecord {
  id: string;
  name: string;
  family: string;
  quadrats: number[]; // Array of abundances or presences/absences (0 or 1), length = numQuadrats
  localName?: string;
  notes?: string;
  stratum?: string;
}

export interface SurveySession {
  id: string;
  projectName: string;
  siteName: string;
  ecosystemType: string;
  vegetationType?: string;
  sampleSite?: string;
  researcherName: string;
  date: string;
  status: 'Pending' | 'Synced';
  speciesList: SpeciesRecord[];
  numQuadrats: number;
  quadratSize?: string;
  transectLength?: number;
  samplingInterval?: number;
  samplingMethod?: string;
  lat?: number;
  lng?: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  title: string;
  role: string;
  institution: string;
}

export interface AppPreferences {
  autoSync: boolean;
  autoSyncMobile: boolean;
  gpsTracking: boolean;
  offlineImageCompression: boolean;
  scientificNameSuggestions: boolean;
  highAccuracyMode: boolean;
  backgroundTracking: boolean;
  coordinateFormat: string;
}

export interface UserIdentity {
  guest_user_id: string | null;
  local_device_id: string | null;
  local_session_token: string | null;
  isGuest: boolean;
}

export interface SurveyState {
  surveys: SurveySession[];
  profile: UserProfile;
  preferences: AppPreferences;
  identity: UserIdentity;
  draftSurvey?: Partial<SurveySession>;
  lastSyncedAt?: number;
  
  // Actions
  initGuestIdentity: () => void;
  setIdentity: (identity: Partial<UserIdentity>) => void;
  addSurvey: (config: { projectName: string, siteName: string, ecosystemType: string, vegetationType?: string, sampleSite?: string, researcherName: string, date?: string, numQuadrats: number, quadratSize?: string, transectLength?: number, samplingInterval?: number, samplingMethod?: string, lat?: number, lng?: number }) => string;
  updateDraft: (data: Partial<SurveySession>) => void;
  clearDraft: () => void;
  deleteSurvey: (id: string) => void;
  updateSurvey: (id: string, data: Partial<SurveySession>) => void;
  replaceSurveys: (surveys: SurveySession[]) => void;
  resetStore: () => void;
  addSpecies: (surveyId: string, quadratIndex: number, speciesParams: { name: string, family: string, localName?: string, notes?: string, stratum?: string }) => void;
  updateSpeciesPresence: (surveyId: string, speciesId: string, quadratIndex: number, amount: number) => void;
  updateSpecies: (surveyId: string, speciesId: string, data: Partial<SpeciesRecord>) => void;
  deleteSpecies: (surveyId: string, speciesId: string) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  updatePreferences: (data: Partial<AppPreferences>) => void;
  setLastSyncedAt: (timestamp: number) => void;
}

const MOCK_SURVEY: SurveySession = {
  id: 'mock-1',
  projectName: 'Borneo Canopy Survey',
  siteName: 'Danum Valley Plot B',
  ecosystemType: 'Tropical Rainforest',
  vegetationType: 'Dipterocarp Forest',
  sampleSite: 'Plot B - North',
  researcherName: 'Dr. Sarah Chen',
  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  status: 'Synced',
  numQuadrats: 5,
  quadratSize: '10x10m',
  speciesList: [
    {
      id: 's1',
      name: 'Shorea lepidota',
      family: 'Dipterocarpaceae',
      quadrats: [1, 1, 0, 1, 0],
      localName: 'Meranti',
      stratum: 'Emergent'
    },
    {
      id: 's2',
      name: 'Lithocarpus javensis',
      family: 'Fagaceae',
      quadrats: [0, 1, 1, 0, 1],
      localName: 'Oak',
      stratum: 'Canopy'
    }
  ],
};

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      profile: {
        firstName: '',
        lastName: '',
        title: '',
        role: '',
        institution: '',
      },
      identity: {
        guest_user_id: null,
        local_device_id: null,
        local_session_token: null,
        isGuest: true,
      },
  preferences: {
    autoSync: true,
    autoSyncMobile: false,
    gpsTracking: true,
    offlineImageCompression: false,
    scientificNameSuggestions: true,
    highAccuracyMode: true,
    backgroundTracking: false,
    coordinateFormat: 'DD',
  },
  surveys: [MOCK_SURVEY],
  
  addSurvey: (config) => {
    const id = Date.now().toString();
    const newSession: SurveySession = {
      id,
      ...config,
      date: config.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending',
      speciesList: [],
    };
    set((state) => ({ surveys: [newSession, ...state.surveys] }));
    return id;
  },

  initGuestIdentity: () => set((state) => {
    if (state.identity.guest_user_id) return state; // Already initialized
    const did = 'dev_' + Math.random().toString(36).substring(2, 10);
    return {
      identity: {
        guest_user_id: 'guest_researcher_' + Math.floor(Math.random() * 100000),
        local_device_id: did,
        local_session_token: 'offline_token_' + Date.now().toString(36),
        isGuest: true,
      },
      surveys: state.surveys.length === 0 ? [MOCK_SURVEY] : state.surveys
    };
  }),

  setIdentity: (newIdentity) => set((state) => ({
    identity: { ...state.identity, ...newIdentity }
  })),

  updateDraft: (data) => set((state) => ({ 
    draftSurvey: { ...state.draftSurvey, ...data } 
  })),

  clearDraft: () => set(() => ({ draftSurvey: undefined })),

  deleteSurvey: (id) => set((state) => ({
    surveys: state.surveys.filter(survey => survey.id !== id)
  })),

  updateSurvey: (id, data) => set((state) => ({
    surveys: state.surveys.map(survey => 
      survey.id === id ? { ...survey, ...data } : survey
    )
  })),

  replaceSurveys: (surveys) => set((state) => {
    // Keep mock data if not already present
    const hasMock = surveys.some(s => s.id === 'mock-1');
    return { surveys: hasMock ? surveys : [...surveys, MOCK_SURVEY] };
  }),

  resetStore: () => set(() => ({
    surveys: [MOCK_SURVEY],
    profile: {
      firstName: '',
      lastName: '',
      title: '',
      role: '',
      institution: '',
    },
    identity: {
      guest_user_id: null,
      local_device_id: null,
      local_session_token: null,
      isGuest: true,
    }
  })),

  addSpecies: (surveyId, quadratIndex, { name, family, localName, notes, stratum }) => set((state) => {
    return {
      surveys: state.surveys.map(survey => {
        if (survey.id !== surveyId) return survey;

        const existing = survey.speciesList.find(s => s.name.toLowerCase() === name.toLowerCase());
        
        if (existing) {
          const updatedList = survey.speciesList.map(s => {
            if (s.id === existing.id) {
              const newQuadrats = [...s.quadrats];
              newQuadrats[quadratIndex] += 1;
              return { 
                ...s, 
                quadrats: newQuadrats,
                notes: notes || s.notes,
                stratum: stratum || s.stratum
              };
            }
            return s;
          });
          return { ...survey, speciesList: updatedList };
        } else {
          const quadratsArray = new Array(survey.numQuadrats).fill(0);
          quadratsArray[quadratIndex] = 1;
          
          const newSpecies: SpeciesRecord = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            name,
            family,
            localName,
            notes,
            stratum,
            quadrats: quadratsArray,
          };
          
          return { ...survey, speciesList: [...survey.speciesList, newSpecies] };
        }
      })
    };
  }),

  updateSpeciesPresence: (surveyId, speciesId, quadratIndex, amount) => set((state) => {
    return {
      surveys: state.surveys.map(survey => {
        if (survey.id !== surveyId) return survey;

        const updatedList = survey.speciesList.map(s => {
          if (s.id === speciesId) {
            const newQuadrats = [...s.quadrats];
            newQuadrats[quadratIndex] = amount;
            return { ...s, quadrats: newQuadrats };
          }
          return s;
        });

        return { ...survey, speciesList: updatedList };
      })
    };
  }),

  updateSpecies: (surveyId, speciesId, data) => set((state) => ({
    surveys: state.surveys.map(survey => {
      if (survey.id !== surveyId) return survey;
      return {
        ...survey,
        speciesList: survey.speciesList.map(s => 
          s.id === speciesId ? { ...s, ...data } : s
        )
      };
    })
  })),

  deleteSpecies: (surveyId, speciesId) => set((state) => ({
    surveys: state.surveys.map(survey => {
      if (survey.id !== surveyId) return survey;
      return {
        ...survey,
        speciesList: survey.speciesList.filter(s => s.id !== speciesId)
      };
    })
  })),

  updateProfile: (data) => set((state) => ({
    profile: { ...state.profile, ...data }
  })),

  updatePreferences: (data) => set((state) => ({
    preferences: { ...state.preferences, ...data }
  })),
  
  setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp })
}),
{
  name: 'ecosurvey-storage-v5',
}
));
