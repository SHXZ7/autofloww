import { create } from "zustand"
import { persist } from "zustand/middleware"

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
          const response = await fetch("http://localhost:8000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          // Handle 2FA requirement
          if (data.requires_2fa) {
            set({ 
              loading: false,
              requires2FA: true,
              pending2FAEmail: data.email 
            })
            return { 
              success: false, 
              requires2FA: true,
              email: data.email,
              message: "Two-factor authentication required" 
            }
          }

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

      // Verify 2FA code during login
      verify2FALogin: async (email, code) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch("http://localhost:8000/auth/2fa/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
          })

          const data = await response.json()

          if (response.ok && data.verified) {
            set({
              user: data.user,
              isAuthenticated: true,
              loading: false,
              error: null,
              requires2FA: false,
              pending2FAEmail: null
            })
            localStorage.setItem("token", data.token)
            return { success: true }
          } else {
            const errorMessage = data.error || "Invalid verification code"
            set({ loading: false, error: errorMessage })
            return { success: false, error: errorMessage }
          }
        } catch (error) {
          const errorMessage = "Network error during 2FA verification"
          set({ loading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      // Set up 2FA for a user
      setupPin2FA: async () => {
        const { loading, error } = get()
        
        // Prevent multiple simultaneous calls
        if (loading) {
          console.log("PIN 2FA setup already in progress, skipping");
          return { success: false, error: "Setup already in progress" }
        }
        
        set({ loading: true, error: null })
        
        try {
          const token = localStorage.getItem("token")
          if (!token) {
            throw new Error("Authentication required")
          }

          console.log("Calling PIN 2FA setup endpoint...");
          
          const response = await fetch("http://localhost:8000/auth/2fa/setup", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          })

          console.log("PIN 2FA setup response status:", response.status);
          
          if (!response.ok) {
            const errorData = await response.json()
            console.error("PIN 2FA setup failed:", errorData);
            throw new Error(errorData.detail || `HTTP ${response.status}`)
          }
          
          const data = await response.json()
          console.log("PIN 2FA setup response data:", data);

          // Update user state to reflect 2FA is enabled
          const currentUser = get().user
          if (currentUser) {
            set({ 
              user: { 
                ...currentUser, 
                two_factor_enabled: true 
              }
            })
          }
          set({ loading: false })
          return { 
            success: true, 
            pin: data.pin,
            enabled: data.enabled,
            message: data.message
          }
        } catch (error) {
          console.error("PIN 2FA setup error:", error);
          const errorMessage = error.message || "Network error during PIN 2FA setup"
          set({ loading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      // Verify PIN during login
      verifyPinLogin: async (email, pin) => {
        set({ loading: true, error: null })
        try {

          const response = await fetch("http://localhost:8000/auth/2fa/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, pin })
          })

          const data = await response.json()

          if (response.ok && data.verified) {
            set({
              user: data.user,
              isAuthenticated: true,
              loading: false,
              error: null,
              requires2FA: false,
              pending2FAEmail: null
            })
            localStorage.setItem("token", data.token)
            set({ loading: false })
            return { 
              success: true
            }
          } else {
            const errorMessage = data.error || "Invalid PIN"
            set({ loading: false, error: errorMessage })
            return { success: false, error: errorMessage }
          }
        } catch (error) {
          const errorMessage = error.message || "Network error during PIN verification"
          set({ loading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      // Disable 2FA
      disable2FA: async (password) => {
        set({ loading: true, error: null })
        try {
          const token = localStorage.getItem("token")
          if (!token) {
            throw new Error("Authentication required")
          }

          const response = await fetch("http://localhost:8000/auth/2fa/disable", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ password })
          })

          const data = await response.json()

          if (response.ok) {
            // Update the user object to reflect 2FA is disabled
            const currentUser = get().user
            if (currentUser) {
              set({ 
                user: { 
                  ...currentUser, 
                  two_factor_enabled: false 
                }
              })
            }
            
            set({ loading: false })
            return { success: true, message: data.message }
          } else {
            const errorMessage = data.detail || "Failed to disable 2FA"
            set({ loading: false, error: errorMessage })
            return { success: false, error: errorMessage }
          }
        } catch (error) {
          const errorMessage = error.message || "Network error during 2FA disabling"
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

      // Update user profile
      updateUserProfile: async (profileData) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          
          if (!token) {
            throw new Error("Authentication required");
          }
          
          // Make API call to update profile
          const response = await fetch("http://localhost:8000/auth/profile", {
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
          const response = await fetch("http://localhost:8000/auth/password", {
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
