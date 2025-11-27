import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  role: 'operator' | 'engineer' | 'manager';
  name: string;
}

export interface TagSubscription {
  tagPath: string;
  latestValue: number;
  quality: string;
  timestamp: number;
}

export interface CoilData {
  id: string;
  status: 'active' | 'completed';
  startTime: number;
  endTime?: number;
  grade?: string;
  targetThickness?: number;
  targetWidth?: number;
  length?: number;
  targetLength?: number;
  progress?: number;
  stats?: {
    avgThickness: number;
    stdThickness: number;
    minThickness: number;
    maxThickness: number;
  };
}

export interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: number;
  tagPath?: string;
}

interface AppState {
  // User & Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Plant Selection
  selectedPlant: string;
  selectedLine: string;
  setPlant: (plant: string) => void;
  setLine: (line: string) => void;

  // Tag Subscriptions
  subscribedTags: Map<string, TagSubscription>;
  updateTag: (tagPath: string, data: Partial<TagSubscription>) => void;
  clearTags: () => void;

  // Coil Tracking
  activeCoil: CoilData | null;
  coilHistory: CoilData[];
  setActiveCoil: (coil: CoilData | null) => void;
  addCoilToHistory: (coil: CoilData) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  clearAlert: (id: string) => void;
  clearAllAlerts: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User & Auth
  user: null,
  setUser: (user) => set({ user }),

  // Plant Selection
  selectedPlant: 'Plant1',
  selectedLine: 'Line1',
  setPlant: (plant) => set({ selectedPlant: plant }),
  setLine: (line) => set({ selectedLine: line }),

  // Tag Subscriptions
  subscribedTags: new Map(),
  updateTag: (tagPath, data) => set((state) => {
    const newTags = new Map(state.subscribedTags);
    const existing = newTags.get(tagPath) || {
      tagPath,
      latestValue: 0,
      quality: 'GOOD',
      timestamp: Date.now()
    };
    newTags.set(tagPath, { ...existing, ...data });
    return { subscribedTags: newTags };
  }),
  clearTags: () => set({ subscribedTags: new Map() }),

  // Coil Tracking
  activeCoil: null,
  coilHistory: [],
  setActiveCoil: (coil) => set({ activeCoil: coil }),
  addCoilToHistory: (coil) => set((state) => ({
    coilHistory: [coil, ...state.coilHistory].slice(0, 50) // Keep last 50
  })),

  // Alerts
  alerts: [],
  addAlert: (alert) => set((state) => ({
    alerts: [{ ...alert, id: `${Date.now()}-${Math.random()}` }, ...state.alerts].slice(0, 100)
  })),
  clearAlert: (id) => set((state) => ({
    alerts: state.alerts.filter(a => a.id !== id)
  })),
  clearAllAlerts: () => set({ alerts: [] }),

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open })
}));
