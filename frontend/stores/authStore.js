import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Login function
      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch("http://localhost:8000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (response.ok && data.user && data.token) {
            set({
              user: data.user,
              isAuthenticated: true,
              loading: false,
              error: null,
            })
            localStorage.setItem("token", data.token)
            return { success: true }
          } else {
            const errorMessage = data.error || "Login failed"
            set({ loading: false, error: errorMessage })
            return { success: false, error: errorMessage }
          }
        } catch (error) {
          const errorMessage = "Network error - please check if the backend is running"
          set({ loading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      // Signup function
      signup: async (name, email, password) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch("http://localhost:8000/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          })

          const data = await response.json()

          if (response.ok && data.user && data.token) {
            set({
              user: data.user,
              isAuthenticated: true,
              loading: false,
              error: null,
            })
            localStorage.setItem("token", data.token)
            return { success: true }
          } else {
            const errorMessage = data.error || "Signup failed"
            set({ loading: false, error: errorMessage })
            return { success: false, error: errorMessage }
          }
        } catch (error) {
          const errorMessage = "Network error - please check if the backend is running"
          set({ loading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      // Logout function
      logout: () => {
        localStorage.removeItem("token")
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        })
        
        // Redirect to homepage on logout
        if (typeof window !== 'undefined') {
          window.location.href = '/homepage'
        }
      },

      // Get authorization headers
      getAuthHeaders: () => {
        const token = localStorage.getItem("token")
        return token ? { "Authorization": `Bearer ${token}` } : {}
      },

      // Check if user is authenticated on app load
      checkAuth: async () => {
        const token = localStorage.getItem("token")
        if (!token) return

        set({ loading: true })
        try {
          const response = await fetch("http://localhost:8000/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (response.ok) {
            const user = await response.json()
            set({
              user,
              isAuthenticated: true,
              loading: false,
            })
          } else {
            localStorage.removeItem("token")
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
            })
          }
        } catch (error) {
          console.error("Auth check error:", error)
          localStorage.removeItem("token")
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
          })
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
