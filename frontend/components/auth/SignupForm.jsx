"use client"
import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon, UserIcon, EnvelopeIcon } from "@heroicons/react/24/outline"
import { useRouter } from 'next/navigation'

export default function SignupForm({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState("")
  const { signup, loading, error, clearError } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setFormError("")
    if (!formData.name || !formData.email || !formData.password) {
      setFormError("Please fill in all fields")
      return
    }
    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match")
      return
    }
    const result = await signup(formData.name, formData.email, formData.password)
    if (result.success) {
      router.push("/")
    } else {
      setFormError(result.error || "Signup failed. Please try again.")
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const passwordsMatch = formData.confirmPassword ? formData.password === formData.confirmPassword : true
  const passwordValid = formData.password ? formData.password.length >= 6 : true

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto">
      {/* Back to Homepage pill link */}
      <button
        onClick={() => router.push("/homepage")}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE6DC] hover:bg-[#E5DCD0] text-xs font-semibold text-[#736357] hover:text-[#241812] transition-colors mb-3 border border-[#E5DCD0]/60 shadow-2xs cursor-pointer"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Back to AutoFlow
      </button>

      {/* Header */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-[#241812] flex items-center justify-center text-white">
            <svg viewBox="0 0 32 32" fill="none" className="w-3.5 h-3.5">
              <rect x="9" y="5" width="14" height="10" rx="2" fill="#F6F1EA" />
              <circle cx="13.5" cy="10" r="1.3" fill="#241812" />
              <circle cx="18.5" cy="10" r="1.3" fill="#241812" />
              <rect x="6" y="17" width="20" height="11" rx="3" fill="#F6F1EA" />
              <circle cx="16" cy="22.5" r="1.5" fill="#EB5E3D" />
            </svg>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#EB5E3D]">Get Started Free</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#241812] tracking-tight mb-0.5">
          Create your account
        </h2>
        <p className="text-xs text-[#736357]">
          Join thousands of developers and teams automating workflows with AI.
        </p>
      </div>

      {/* Error banner */}
      {(error || formError) && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          {error || formError}
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5" noValidate>
        {/* Full Name */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-bold text-[#241812] tracking-wide">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
              className="w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E5DCD0] text-[#241812] placeholder-[#A89C94] outline-none transition-all focus:border-[#EB5E3D] focus:ring-2 focus:ring-[#EB5E3D]/15 shadow-2xs"
            />
            <UserIcon className="w-4 h-4 text-[#A89C94] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-0.5">
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
              className="w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E5DCD0] text-[#241812] placeholder-[#A89C94] outline-none transition-all focus:border-[#EB5E3D] focus:ring-2 focus:ring-[#EB5E3D]/15 shadow-2xs"
            />
            <EnvelopeIcon className="w-4 h-4 text-[#A89C94] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-bold text-[#241812] tracking-wide">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              className="w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E5DCD0] text-[#241812] placeholder-[#A89C94] outline-none transition-all focus:border-[#EB5E3D] focus:ring-2 focus:ring-[#EB5E3D]/15 shadow-2xs pr-10"
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

        {/* Confirm Password */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-bold text-[#241812] tracking-wide">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
              className="w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E5DCD0] text-[#241812] placeholder-[#A89C94] outline-none transition-all focus:border-[#EB5E3D] focus:ring-2 focus:ring-[#EB5E3D]/15 shadow-2xs pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89C94] hover:text-[#241812] transition-colors p-1 cursor-pointer"
            >
              {showConfirmPassword ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full py-2.5 sm:py-3 px-5 rounded-full bg-[#EB5E3D] hover:bg-[#D94F2F] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create Free Account →"
          )}
        </button>
      </form>

      {/* Switch to Sign In */}
      <div className="mt-3 sm:mt-4 text-center pt-2.5 sm:pt-3 border-t border-[#E5DCD0]">
        <p className="text-xs text-[#736357]">
          Already have an AutoFlow account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-[#EB5E3D] hover:text-[#D94F2F] underline underline-offset-4 transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
