import { create } from 'zustand'
import { userApi } from '../api/api'

interface AuthState {
  isAuthenticated: boolean
  user: any | null
  setAuth: (token: string, user: any) => void
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  user: null,
  setAuth: (token: string, user: any) => {
    localStorage.setItem('access_token', token)
    set({ isAuthenticated: true, user })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    set({ isAuthenticated: false, user: null })
  },
  loadUser: async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const userData = await userApi.getMe()
        set({ user: userData, isAuthenticated: true })
      } catch (error) {
        // If token is invalid, clear it
        localStorage.removeItem('access_token')
        set({ isAuthenticated: false, user: null })
      }
    }
  },
}))

