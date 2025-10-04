"use client"
import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"

export default function SignupForm({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signup, loading, error, clearError } = useAuthStore()
  const API_BASE_URL =  "https://autoflow-backend-pl6h.onrender.com/"


  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (!formData.name || !formData.email || !formData.password) {
      return
    }

    if (formData.password !== formData.confirmPassword) {
      return
    }

    if (formData.password.length < 6) {
      return
    }

    const result = await signup(formData.name, formData.email, formData.password)
    if (!result.success) {
      console.error("Signup failed:", result.error)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const passwordsMatch = formData.password === formData.confirmPassword
  const passwordValid = formData.password.length >= 6

  return (
    <div className="w-full">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-[#e74c3c]/10 border border-[#e74c3c]/20 rounded-xl">
          <p className="text-[#e74c3c] text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-[#1a1a1a] border border-[#444] rounded-xl px-4 py-3 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all duration-200"
            placeholder="Enter your full name"
            required
          />
        </div>

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
              className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 pr-12 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                formData.password && !passwordValid
                  ? "border-[#e74c3c] focus:ring-[#e74c3c]"
                  : "border-[#444] focus:ring-[#00D4FF]"
              }`}
              placeholder="Create a password"
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
          {formData.password && !passwordValid && (
            <p className="text-[#e74c3c] text-xs mt-1">
              Password must be at least 6 characters
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 pr-12 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                formData.confirmPassword && !passwordsMatch
                  ? "border-[#e74c3c] focus:ring-[#e74c3c]"
                  : "border-[#444] focus:ring-[#00D4FF]"
              }`}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#999999] hover:text-white transition-colors"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-[#e74c3c] text-xs mt-1">Passwords don't match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !passwordValid || !passwordsMatch}
          className="w-full bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed pulse-glow mt-2"
        >
          {loading ? "Creating account..." : "Create Account"}
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

      {/* Login Link */}
      <div className="text-center">
        <p className="text-gray-400">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-[#00D4FF] hover:text-white font-medium transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
