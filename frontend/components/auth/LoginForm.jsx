"use client"
import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"

export default function LoginForm({ onSwitchToSignup }) {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, error, clearError } = useAuthStore()

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
    <div className="w-full max-w-md">
      <div className="bg-[#2a2a2a] border border-[#666666] rounded-xl p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#ff6d6d] to-[#ff9500] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">AF</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-[#999999]">Sign in to your AutoFlow account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-[#e74c3c]/10 border border-[#e74c3c] rounded-lg">
            <p className="text-[#e74c3c] text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-4 py-3 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-4 py-3 pr-12 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
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
            className="w-full bg-gradient-to-r from-[#ff6d6d] to-[#ff9500] hover:from-[#ff5252] hover:to-[#ff8f00] text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#666666]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#2a2a2a] text-[#999999]">Or</span>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-[#999999]">
            Don't have an account?{" "}
            <button
              onClick={onSwitchToSignup}
              className="text-[#ff6d6d] hover:text-[#ff5252] font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-3 bg-[#252525] rounded-lg border border-[#666666]">
          <p className="text-xs text-[#999999] text-center">
            Demo: user@autoflow.com / password123
          </p>
        </div>
      </div>
    </div>
  )
}
