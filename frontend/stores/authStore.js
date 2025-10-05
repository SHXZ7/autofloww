import { create } from "zustand"
import { persist } from "zustand/middleware"

  const API_BASE_URL = "https://shxz7-autoflow.hf.space"

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: null, // Start with null instead of false (representing "unknown")
      loading: true, // Start with loading true by default
      error: null,

      // Login function
      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
          const response = await fetch(`${API_BASE_URL}/auth/signup`, {
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

      // Update user profile
      updateUserProfile: async (profileData) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          
          if (!token) {
            throw new Error("Authentication required");
          }
          
          // Make API call to update profile
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
          });
          
          const result = await response.json();
          
          if (response.ok) {
            // Update local state with the updated user data
            set({
              user: result.user,
              loading: false,
              error: null
            });
            
            return { success: true, message: result.message };
          } else {
            const errorMessage = result.detail || result.error || "Failed to update profile";
            set({ loading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        } catch (error) {
          const errorMessage = error.message || "Network error occurred";
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Change user password
      changePassword: async (currentPassword, newPassword) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          
          if (!token) {
            throw new Error("Authentication required");
          }
          
          // Make API call to change password
          const response = await fetch(`${API_BASE_URL}/auth/password`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
              current_password: currentPassword,
              new_password: newPassword
            })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            set({ loading: false, error: null });
            return { success: true, message: result.message };
          } else {
            const errorMessage = result.detail || result.error || "Failed to change password";
            set({ loading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        } catch (error) {
          const errorMessage = error.message || "Network error occurred";
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
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
        
        // If no token, set to not authenticated
        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            loading: false
          })
          return
        }

        // Otherwise, check token validity
        set({ loading: true })
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
          // Handle network errors - set explicit authentication state
          // instead of leaving it in loading state
          set({
            loading: false,
            isAuthenticated: false,  // Important: set this to false to prevent infinite loading
            error: "Network error while checking authentication"
          })
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // API Keys management
      updateApiKeys: async (apiKeys) => {
        try {
          const token = localStorage.getItem("token")
          
          if (!token) {
            throw new Error("Authentication required")
          }

          const response = await fetch(`${API_BASE_URL}/api/user/api-keys`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ apiKeys })
          })
          
          const data = await response.json()
          
          if (response.ok) {
            set(state => ({
              user: {
                ...state.user,
                apiKeys: data.apiKeys
              }
            }))
            return { success: true }
          } else {
            return { success: false, error: data.detail || data.message || 'Failed to update API keys' }
          }
        } catch (error) {
          console.error('Update API keys error:', error)
          return { success: false, error: 'Network error occurred' }
        }
      },

      getApiKeys: async () => {
        try {
          const token = localStorage.getItem("token")
          
          if (!token) {
            throw new Error("Authentication required")
          }

          const response = await fetch(`${API_BASE_URL}/api/user/api-keys`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          const data = await response.json()
          
          if (response.ok) {
            return { success: true, apiKeys: data.apiKeys }
          } else {
            return { success: false, error: data.detail || data.message || 'Failed to fetch API keys' }
          }
        } catch (error) {
          console.error('Get API keys error:', error)
          return { success: false, error: 'Network error occurred' }
        }
      },
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
