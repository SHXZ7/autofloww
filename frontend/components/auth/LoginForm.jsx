"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { useRouter } from 'next/navigation'
import ForgotPassword from "./ForgotPassword"

export default function LoginForm({ onSwitchToSignup }) {
  const [currentView, setCurrentView] = useState("login") // login, forgot-password, 2fa
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [needs2FA, setNeeds2FA] = useState(false)
  const [pendingEmail, setPendingEmail] = useState("")
  
  const { login, loading, error, clearError } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Check if demo mode is enabled via URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('demo') === 'true') {
      setIsDemoMode(true)
      setFormData({
        email: 'user@autoflow.com',
        password: 'password123'
      })
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLoginError("")
    
    if (!formData.email || !formData.password) {
      return
    }

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.requires2FA) {
        // Show 2FA verification screen
        setNeeds2FA(true)
        setPendingEmail(result.email)
        setCurrentView("2fa")
      } else if (result.success) {
        router.push('/')
      } else {
        setLoginError(result.error || "Login failed")
      }
    } catch (error) {
      setLoginError("An unexpected error occurred")
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handle2FASuccess = () => {
    router.push('/')
  }

  const handleCancel2FA = () => {
    setNeeds2FA(false)
    setPendingEmail("")
    setCurrentView("login")
  }

  const handleForgotPassword = () => {
    setCurrentView("forgot-password")
  }

  const handleBackToLogin = () => {
    setCurrentView("login")
    setLoginError("")
    clearError()
  }

  // Show Forgot Password component
  if (currentView === "forgot-password") {
    return <ForgotPassword onBack={handleBackToLogin} />
  }

  // Show 2FA verification screen if needed
  if (currentView === "2fa" && needs2FA) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <TwoFactorLogin 
          email={pendingEmail}
          onSuccess={handle2FASuccess}
          onCancel={handleCancel2FA}
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Error Messages - show both store error and component error */}
      {(error || loginError) && (
        <div className="mb-6 p-4 bg-[#e74c3c]/10 border border-[#e74c3c]/20 rounded-xl">
          <p className="text-[#e74c3c] text-sm">{error || loginError}</p>
        </div>
      )}

      {/* Demo Mode Alert */}
      {isDemoMode && (
        <div className="mb-6 p-4 glass rounded-xl">
          <p className="text-blue-400 text-sm flex items-center space-x-2">
            <span className="text-lg">🎯</span>
            <span>Demo mode: Credentials have been pre-filled for you!</span>
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-[#1a1a1a] border border-[#444] rounded-xl px-4 py-3 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all duration-200"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-xl px-4 py-3 pr-12 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all duration-200"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#999999] hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Forgot Password Link */}
      <div className="text-center mt-4">
        <button
          onClick={handleForgotPassword}
          className="text-[#00D4FF] hover:text-white text-sm transition-colors"
        >
          Forgot your password?
        </button>
      </div>

      {/* Divider */}
      <div className="my-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#0a0a0a] text-gray-500">Or</span>
          </div>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-gray-400">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            className="text-[#00D4FF] hover:text-white font-medium transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Demo Credentials - only show if not in demo mode */}
      {!isDemoMode && (
        <div className="mt-8 p-4 glass rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            <span className="block mb-1 text-sm">Try demo credentials:</span>
            <span className="font-mono">user@autoflow.com / password123</span>
          </p>
        </div>
      )}
    </div>
  )
}
