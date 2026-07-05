"use client"
import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { useRouter } from 'next/navigation'

export default function SignupForm({ onSwitchToLogin, isLight = false }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signup, loading, error, clearError } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    if (!formData.name || !formData.email || !formData.password) return
    if (formData.password !== formData.confirmPassword) return
    if (formData.password.length < 6) return
    const result = await signup(formData.name, formData.email, formData.password)
    if (!result.success) console.error("Signup failed:", result.error)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const passwordsMatch = formData.password === formData.confirmPassword
  const passwordValid = formData.password.length >= 6

  // Theme design matching the homepage
  const accentColor = isLight ? "#111111" : "#2563eb"
  const accentHover = isLight ? "#27272a" : "#1d4ed8"
  const labelColor = isLight ? "#52525b" : "#9ca3af"
  const inputBg = isLight ? "#ffffff" : "#0d1527"
  const inputBorder = isLight ? "#e8e4de" : "#1e293b"
  const inputColor = isLight ? "#111111" : "#ffffff"
  const textColor = isLight ? "#111111" : "#ffffff"
  const secondaryText = isLight ? "#52525b" : "#9ca3af"

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Back to Site link at the top (reduced spacing) */}
      <button
        onClick={() => router.push("/homepage")}
        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors mb-8"
        style={{ color: secondaryText }}
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Back to Site
      </button>

      {/* Header */}
      <div className="flex flex-col items-start mb-6">
        <h2
          className="text-4xl font-bold mb-1.5 tracking-tight transition-colors"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: textColor,
          }}
        >
          Sign up
        </h2>
        <p className="text-xs font-medium transition-colors" style={{ color: secondaryText }}>
          Create an account to start building workflows.
        </p>
      </div>

      {/* Error banner (reduced spacing) */}
      {error && (
        <div className="mb-4 p-2.5 rounded-xl border border-red-500/20" style={{
          background: "rgba(239,68,68,0.06)",
        }}>
          <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
            className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-1 outline-none"
            style={{
              background: inputBg,
              border: `1px solid ${inputBorder}`,
              color: inputColor,
            }}
            onFocus={e => (e.target.style.borderColor = isLight ? "#111" : "#2563eb")}
            onBlur={e => (e.target.style.borderColor = inputBorder)}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@email.com"
            required
            className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-1 outline-none"
            style={{
              background: inputBg,
              border: `1px solid ${inputBorder}`,
              color: inputColor,
            }}
            onFocus={e => (e.target.style.borderColor = isLight ? "#111" : "#2563eb")}
            onBlur={e => (e.target.style.borderColor = inputBorder)}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-1 outline-none pr-10"
              style={{
                background: inputBg,
                border: `1px solid ${formData.password && !passwordValid ? "#ef4444" : inputBorder}`,
                color: inputColor,
              }}
              onFocus={e => (e.target.style.borderColor = formData.password && !passwordValid ? "#ef4444" : isLight ? "#111" : "#2563eb")}
              onBlur={e => (e.target.style.borderColor = formData.password && !passwordValid ? "#ef4444" : inputBorder)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPassword ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
          {formData.password && !passwordValid && (
            <p className="text-[9px] mt-0.5" style={{ color: "#ef4444" }}>Password must be at least 6 characters</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-1 outline-none pr-10"
              style={{
                background: inputBg,
                border: `1px solid ${formData.confirmPassword && !passwordsMatch ? "#ef4444" : inputBorder}`,
                color: inputColor,
              }}
              onFocus={e => (e.target.style.borderColor = formData.confirmPassword && !passwordsMatch ? "#ef4444" : isLight ? "#111" : "#2563eb")}
              onBlur={e => (e.target.style.borderColor = formData.confirmPassword && !passwordsMatch ? "#ef4444" : inputBorder)}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showConfirmPassword ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-[9px] mt-0.5" style={{ color: "#ef4444" }}>Passwords do not match</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !passwordValid || !passwordsMatch}
          className="w-full text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-3 active:scale-[0.98]"
          style={{ background: accentColor, fontSize: "13px" }}
          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = accentHover)}
          onMouseLeave={e => (e.currentTarget.style.background = accentColor)}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        {/* Switch to login */}
        <div className="text-center text-xs mt-4" style={{ color: secondaryText }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold underline transition-colors"
            style={{ color: isLight ? "#111" : "#ffffff" }}
          >
            login
          </button>
        </div>
      </form>
    </div>
  )
}
