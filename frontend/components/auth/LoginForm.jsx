"use client"
import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon, EnvelopeIcon } from "@heroicons/react/24/outline"
import { useRouter } from 'next/navigation'
import ForgotPassword from "./ForgotPassword"

export default function LoginForm({ onSwitchToSignup }) {
  const [currentView, setCurrentView] = useState("login")
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")

  const { login, loading, error, clearError } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLoginError("")
    if (!formData.email || !formData.password) return
    try {
      const result = await login(formData.email, formData.password)
      if (result.success) {
        router.push('/')
      } else {
        setLoginError(result.error || "Invalid email or password")
      }
    } catch {
      setLoginError("An unexpected error occurred. Please try again.")
    }
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleBackToLogin = () => {
    setCurrentView("login")
    setLoginError("")
    clearError()
  }

  if (currentView === "forgot-password") {
    return <ForgotPassword onBack={handleBackToLogin} />
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto">
      {/* Back to Homepage pill link */}
      <button
        onClick={() => router.push("/homepage")}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE6DC] hover:bg-[#E5DCD0] text-xs font-semibold text-[#736357] hover:text-[#241812] transition-colors mb-4 border border-[#E5DCD0]/60 shadow-2xs cursor-pointer"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Back to AutoFlow
      </button>

      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-lg bg-[#241812] flex items-center justify-center text-white">
            <svg viewBox="0 0 32 32" fill="none" className="w-3.5 h-3.5">
              <rect x="9" y="5" width="14" height="10" rx="2" fill="#F6F1EA" />
              <circle cx="13.5" cy="10" r="1.3" fill="#241812" />
              <circle cx="18.5" cy="10" r="1.3" fill="#241812" />
              <rect x="6" y="17" width="20" height="11" rx="3" fill="#F6F1EA" />
              <circle cx="16" cy="22.5" r="1.5" fill="#EB5E3D" />
            </svg>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#EB5E3D]">Welcome Back</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#241812] tracking-tight mb-1">
          Sign in to your account
        </h2>
        <p className="text-xs sm:text-sm text-[#736357]">
          Access your visual canvas, integrations, and automated pipelines.
        </p>
      </div>

      {/* Error banner */}
      {(error || loginError) && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          {error || loginError}
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        {/* Email Field */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-[#241812] tracking-wide">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              required
              className="w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E5DCD0] text-[#241812] placeholder-[#A89C94] outline-none transition-all focus:border-[#EB5E3D] focus:ring-2 focus:ring-[#EB5E3D]/15 shadow-2xs"
            />
            <EnvelopeIcon className="w-4 h-4 text-[#A89C94] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#241812] tracking-wide">
              Password
            </label>
            <button
              type="button"
              onClick={() => setCurrentView("forgot-password")}
              className="text-[11px] font-semibold text-[#EB5E3D] hover:text-[#D94F2F] transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              required
              className="w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E5DCD0] text-[#241812] placeholder-[#A89C94] outline-none transition-all focus:border-[#EB5E3D] focus:ring-2 focus:ring-[#EB5E3D]/15 shadow-2xs pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89C94] hover:text-[#241812] transition-colors p-1 cursor-pointer"
            >
              {showPassword ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Submit Primary Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3 px-5 rounded-full bg-[#EB5E3D] hover:bg-[#D94F2F] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign In to Dashboard →"
          )}
        </button>
      </form>

      {/* Switch to Sign Up */}
      <div className="mt-5 text-center pt-4 border-t border-[#E5DCD0]">
        <p className="text-xs text-[#736357]">
          Don't have an AutoFlow account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-bold text-[#EB5E3D] hover:text-[#D94F2F] underline underline-offset-4 transition-colors cursor-pointer"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  )
}
