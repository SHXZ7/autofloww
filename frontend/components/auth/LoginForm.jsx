"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { useRouter } from 'next/navigation'
import ForgotPassword from "./ForgotPassword"

export default function LoginForm({ onSwitchToSignup, isLight = false }) {
  const [currentView, setCurrentView] = useState("login")
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [loginError, setLoginError] = useState("")

  const { login, loading, error, clearError } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('demo') === 'true') {
      setIsDemoMode(true)
      setFormData({ email: 'user@autoflow.com', password: 'password123' })
    }
  }, [])

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
        setLoginError(result.error || "Login failed")
      }
    } catch {
      setLoginError("An unexpected error occurred")
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
      {/* Back to Site link at the top (reduced margin) */}
      <button
        onClick={() => router.push("/homepage")}
        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors mb-8"
        style={{ color: secondaryText }}
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Back to Site
      </button>

      {/* Header (reduced margin) */}
      <div className="flex flex-col items-start mb-6">
        <h2
          className="text-4xl font-bold mb-1.5 tracking-tight transition-colors"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: textColor,
          }}
        >
          Sign in
        </h2>
        <p className="text-xs font-medium transition-colors" style={{ color: secondaryText }}>
          Sign in to your AutoFlow workspace.
        </p>
      </div>

      {/* Error banner */}
      {(error || loginError) && (
        <div className="mb-4 p-2.5 rounded-xl border border-red-500/20" style={{
          background: "rgba(239,68,68,0.06)",
        }}>
          <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>{error || loginError}</p>
        </div>
      )}

      {/* Demo alert */}
      {isDemoMode && (
        <div className="mb-4 p-2.5 rounded-xl border border-dashed" style={{
          background: isLight ? "rgba(17,17,17,0.03)" : "rgba(37,99,235,0.08)",
          borderColor: isLight ? "#e8e4de" : "#1e293b"
        }}>
          <p className="text-xs font-medium" style={{ color: isLight ? "#111" : "#3b82f6" }}>🎯 Demo mode: credentials pre-filled</p>
        </div>
      )}

      {/* Form (tightened gaps) */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Password</label>
            <button
              type="button"
              onClick={() => setCurrentView("forgot-password")}
              className="text-[10px] font-bold tracking-tight transition-colors"
              style={{ color: isLight ? "#111" : "#3b82f6" }}
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
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-1 outline-none pr-10"
              style={{
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: inputColor,
              }}
              onFocus={e => (e.target.style.borderColor = isLight ? "#111" : "#2563eb")}
              onBlur={e => (e.target.style.borderColor = inputBorder)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPassword ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-3 active:scale-[0.98]"
          style={{ background: accentColor, fontSize: "13px" }}
          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = accentHover)}
          onMouseLeave={e => (e.currentTarget.style.background = accentColor)}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {/* Switch to signup */}
        <div className="text-center text-xs mt-4" style={{ color: secondaryText }}>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-bold underline transition-colors"
            style={{ color: isLight ? "#111" : "#ffffff" }}
          >
            SIGN UP
          </button>
        </div>
      </form>
    </div>
  )
}
