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
  
  // Actions
  initGuestIdentity: () => void;
  setIdentity: (identity: Partial<UserIdentity>) => void;
  addSurvey: (config: { projectName: string, siteName: string, ecosystemType: string, vegetationType?: string, sampleSite?: string, researcherName: string, date?: string, numQuadrats: number, quadratSize?: string, transectLength?: number, samplingInterval?: number, samplingMethod?: string, lat?: number, lng?: number }) => string;
  updateDraft: (data: Partial<SurveySession>) => void;
  clearDraft: () => void;
  deleteSurvey: (id: string) => void;
  updateSurvey: (id: string, data: Partial<SurveySession>) => void;
  addSpecies: (surveyId: string, quadratIndex: number, speciesParams: { name: string, family: string, localName?: string, notes?: string, stratum?: string }) => void;
  updateSpeciesPresence: (surveyId: string, speciesId: string, quadratIndex: number, amount: number) => void;
  updateSpecies: (surveyId: string, speciesId: string, data: Partial<SpeciesRecord>) => void;
  deleteSpecies: (surveyId: string, speciesId: string) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  updatePreferences: (data: Partial<AppPreferences>) => void;
}

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      profile: {
        firstName: 'Martyna',
        lastName: 'Martyns-Yellowe',
        title: 'MSc.',
        role: 'Lead Researcher',
        institution: 'University of Nigeria, Nsukka',
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
  surveys: [
    {
      id: 'mock-1',
      projectName: 'Northern Ridge Transect 3',
      siteName: 'Montane Forest Region D',
      ecosystemType: 'Montane Forest',
      vegetationType: 'Broadleaf',
      sampleSite: 'Plot A - North Slopes',
      samplingMethod: 'Systematic Sampling',
      quadratSize: '5 × 5 m (25 m²)',
      transectLength: 100,
      samplingInterval: 10,
      researcherName: 'Dr. Jane Doe',
      date: 'Oct 24, 2026',
      status: 'Pending',
      numQuadrats: 50,
      lat: 4.8156,
      lng: 7.0498,
      speciesList: [
        {
          id: 's-1',
          name: 'Quercus alba',
          family: 'Fagaceae',
          quadrats: [1, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2],
          stratum: 'Canopy (>20m)',
          notes: 'Dominant'
        },
        {
          id: 's-2',
          name: 'Acer rubrum',
          family: 'Sapindaceae',
          quadrats: [0, 4, 0, 1, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
          stratum: 'Sub-canopy',
          notes: 'Co-dominant'
        }
      ]
    },
    {
      id: 'mock-2',
      projectName: 'Valley Delta Flora',
      siteName: 'Wetland Reserve',
      ecosystemType: 'Wetland',
      vegetationType: 'Marsh Grass',
      sampleSite: 'Delta Entrance',
      samplingMethod: 'Random Sampling',
      quadratSize: '1 × 1 m (1 m²)',
      transectLength: 50,
      samplingInterval: 5,
      researcherName: 'Dr. Jane Doe',
      date: 'Oct 18, 2026',
      status: 'Synced',
      numQuadrats: 8,
      lat: -0.5,
      lng: 111.0,
      speciesList: [
        {
          id: 's-3',
          name: 'Typha latifolia',
          family: 'Typhaceae',
          quadrats: [5, 4, 6, 2, 0, 0, 0, 0],
          stratum: 'Understory',
          notes: 'Pioneer'
        }
      ]
    },
    {
      id: 'mock-3',
      projectName: 'Coastal Dune Study',
      siteName: 'Sector 7G',
      ecosystemType: 'Coastal',
      vegetationType: 'Dune Grass',
      sampleSite: 'Sector 7G Alpha',
      samplingMethod: 'Line Transect',
      quadratSize: '2 × 2 m (4 m²)',
      transectLength: 200,
      samplingInterval: 20,
      researcherName: 'Dr. Jane Doe',
      date: 'Oct 12, 2026',
      status: 'Synced',
      numQuadrats: 5,
      speciesList: [
        {
          id: 's-4',
          name: 'Ammophila arenaria',
          family: 'Poaceae',
          quadrats: [10, 12, 15, 8, 4],
          stratum: 'Ground layer',
          notes: 'emergent'
        }
      ]
    }
  ],

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
      }
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
  }))
}),
{
  name: 'ecosurvey-storage-v4',
}
));
