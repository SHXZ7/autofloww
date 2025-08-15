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
    <div className="w-full max-w-md">
      <div className="bg-[#2a2a2a] border border-[#666666] rounded-xl p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#ff6d6d] to-[#ff9500] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">AF</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-[#999999]">Join AutoFlow to start building workflows</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-[#e74c3c]/10 border border-[#e74c3c] rounded-lg">
            <p className="text-[#e74c3c] text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-4 py-3 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="Enter your full name"
              required
            />
          </div>

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
                className={`w-full bg-[#3a3a3a] border rounded-lg px-4 py-3 pr-12 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  formData.password && !passwordValid
                    ? "border-[#e74c3c] focus:ring-[#e74c3c]"
                    : "border-[#666666] focus:ring-[#ff6d6d]"
                }`}
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
            {formData.password && !passwordValid && (
              <p className="text-[#e74c3c] text-xs mt-1">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full bg-[#3a3a3a] border rounded-lg px-4 py-3 pr-12 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  formData.confirmPassword && !passwordsMatch
                    ? "border-[#e74c3c] focus:ring-[#e74c3c]"
                    : "border-[#666666] focus:ring-[#ff6d6d]"
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
            className="w-full bg-gradient-to-r from-[#ff6d6d] to-[#ff9500] hover:from-[#ff5252] hover:to-[#ff8f00] text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
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

        {/* Login Link */}
        <div className="text-center">
          <p className="text-[#999999]">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-[#ff6d6d] hover:text-[#ff5252] font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
