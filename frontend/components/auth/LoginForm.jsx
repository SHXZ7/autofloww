"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"

export default function LoginForm({ onSwitchToSignup }) {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const { login, loading, error, clearError } = useAuthStore()

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
    
    if (!formData.email || !formData.password) {
      return
    }

    const result = await login(formData.email, formData.password)
    if (!result.success) {
      console.error("Login failed:", result.error)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="w-full">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-[#e74c3c]/10 border border-[#e74c3c]/20 rounded-xl">
          <p className="text-[#e74c3c] text-sm">{error}</p>
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
