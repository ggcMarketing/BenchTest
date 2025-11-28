import { create } from 'zustand'
import axios from 'axios'

const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3000/api/v1'

export interface Widget {
  id: string
  type: 'value-card' | 'trend-graph' | 'progress-bar' | 'alarm-log'
  x: number
  y: number
  w: number
  h: number
  config: any
}

export interface Dashboard {
  id: string
  name: string
  description?: string
  widgets: Widget[]
}

interface DashboardState {
  dashboards: Dashboard[]
  currentDashboard: Dashboard | null
  isEditing: boolean
  loadDashboards: () => Promise<void>
  loadDashboard: (id: string) => Promise<void>
  saveDashboard: (dashboard: Dashboard) => Promise<void>
  setCurrentDashboard: (dashboard: Dashboard | null) => void
  setEditing: (editing: boolean) => void
  addWidget: (widget: Widget) => void
  updateWidget: (id: string, updates: Partial<Widget>) => void
  removeWidget: (id: string) => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboards: [],
  currentDashboard: null,
  isEditing: false,

  loadDashboards: async () => {
    const response = await axios.get(`${API_URL}/dashboards`)
    set({ dashboards: response.data.dashboards })
  },

  loadDashboard: async (id: string) => {
    const response = await axios.get(`${API_URL}/dashboards/${id}`)
    const dashboard = response.data
    set({
      currentDashboard: {
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        widgets: dashboard.layout.widgets || [],
      },
    })
  },

  saveDashboard: async (dashboard: Dashboard) => {
    const payload = {
      name: dashboard.name,
      description: dashboard.description,
      shared: false,
      layout: {
        grid: { cols: 12, rows: 8 },
        widgets: dashboard.widgets,
      },
    }

    if (dashboard.id) {
      await axios.put(`${API_URL}/dashboards/${dashboard.id}`, payload)
    } else {
      await axios.post(`${API_URL}/dashboards`, payload)
    }

    await get().loadDashboards()
  },

  setCurrentDashboard: (dashboard) => set({ currentDashboard: dashboard }),

  setEditing: (editing) => set({ isEditing: editing }),

  addWidget: (widget) => {
    const { currentDashboard } = get()
    if (currentDashboard) {
      set({
        currentDashboard: {
          ...currentDashboard,
          widgets: [...currentDashboard.widgets, widget],
        },
      })
    }
  },

  updateWidget: (id, updates) => {
    const { currentDashboard } = get()
    if (currentDashboard) {
      set({
        currentDashboard: {
          ...currentDashboard,
          widgets: currentDashboard.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        },
      })
    }
  },

  removeWidget: (id) => {
    const { currentDashboard } = get()
    if (currentDashboard) {
      set({
        currentDashboard: {
          ...currentDashboard,
          widgets: currentDashboard.widgets.filter((w) => w.id !== id),
        },
      })
    }
  },
}))
