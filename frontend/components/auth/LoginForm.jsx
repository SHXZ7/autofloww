"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { useRouter } from 'next/navigation'
import TwoFactorLogin from "./TwoFactorLogin"

export default function LoginForm({ onSwitchToSignup }) {
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
  }

  // Show 2FA verification screen if needed
  if (needs2FA) {
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
          className="w-full bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed pulse-glow"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

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
    </div>
  )
}
