"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { useRouter } from 'next/navigation'
import ForgotPassword from "./ForgotPassword"

export default function LoginForm({ onSwitchToSignup, isLight = false }) {
  const [currentView, setCurrentView] = useState("login")
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [needs2FA, setNeeds2FA] = useState(false)
  const [pendingEmail, setPendingEmail] = useState("")

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
      if (result.requires2FA) {
        setNeeds2FA(true)
        setPendingEmail(result.email)
        setCurrentView("2fa")
      } else if (result.success) {
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

  // Theme tokens
  const labelColor   = isLight ? "#374151" : "#94a3b8"
  const inputBg      = isLight ? "#f9fafb" : "#0f172a"
  const inputBorder  = isLight ? "#d1d5db" : "#1e293b"
  const inputColor   = isLight ? "#111111" : "#F1F5F9"
  const dividerBg    = isLight ? "#ffffff" : "#020617"
  const dividerLine  = isLight ? "#e5e7eb" : "#1e293b"
  const subTextColor = isLight ? "#52525b" : "#94a3b8"
  const accentColor  = "#3B82F6"
  const accentHover  = "#2563eb"

  const inputStyle = (hasError) => ({
    width: "100%",
    background: inputBg,
    border: `1px solid ${hasError ? "#ef4444" : inputBorder}`,
    borderRadius: "4px",
    padding: "11px 14px",
    color: inputColor,
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.15s",
  })

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col items-start mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#3B82F6,#8B5CF6)" }}>
            <span className="text-white font-bold text-sm font-mono">AF</span>
          </div>
          <span className="font-mono font-bold text-base" style={{ color: isLight ? "#111111" : "#F1F5F9" }}>AutoFlow</span>
        </div>
        <h2 className="text-3xl font-mono font-bold mb-0.5 tracking-tight"
          style={{ color: isLight ? "#111111" : "#F1F5F9" }}>
          Welcome Back
        </h2>
        <p className="text-sm font-mono" style={{ color: subTextColor }}>
          Sign in to your AutoFlow workspace
        </p>
      </div>

      {/* Error banner */}
      {(error || loginError) && (
        <div className="mb-4 p-2 rounded" style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)"
        }}>
          <p className="text-sm font-mono" style={{ color: "#ef4444" }}>{error || loginError}</p>
        </div>
      )}

      {/* Demo alert */}
      {isDemoMode && (
        <div className="mb-4 p-2 rounded" style={{
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.2)"
        }}>
          <p className="text-sm font-mono" style={{ color: accentColor }}>🎯 Demo mode: credentials pre-filled</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Email */}
        <div>
          <label className="block text-sm font-mono mb-1" style={{ color: labelColor }}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            style={inputStyle(false)}
            onFocus={e => (e.target.style.borderColor = accentColor)}
            onBlur={e => (e.target.style.borderColor = inputBorder)}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-mono" style={{ color: labelColor }}>Password</label>
            <button type="button" onClick={() => setCurrentView("forgot-password")}
              className="text-xs font-mono transition-colors"
              style={{ color: accentColor }}
              onMouseEnter={e => (e.currentTarget.style.color = accentHover)}
              onMouseLeave={e => (e.currentTarget.style.color = accentColor)}
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
              placeholder="Enter your password"
              required
              style={{ ...inputStyle(false), paddingRight: "42px" }}
              onFocus={e => (e.target.style.borderColor = accentColor)}
              onBlur={e => (e.target.style.borderColor = inputBorder)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: isLight ? "#9ca3af" : "#6b7280" }}>
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="login-pulse w-full text-white font-mono font-bold py-3 px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          style={{ background: accentColor, fontSize: "15px" }}
          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = accentHover)}
          onMouseLeave={e => (e.currentTarget.style.background = accentColor)}
        >
          {loading ? "Signing in..." : "SIGN IN"}
        </button>

        {/* Divider */}
        <div className="relative my-0">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: dividerLine }} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 text-xs font-mono" style={{ background: dividerBg, color: isLight ? "#9ca3af" : "#6b7280" }}>or</span>
          </div>
        </div>

        {/* Switch to signup */}
        <div className="text-center text-sm font-mono" style={{ color: subTextColor }}>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-bold transition-colors"
            style={{ color: accentColor }}
            onMouseEnter={e => (e.currentTarget.style.color = accentHover)}
            onMouseLeave={e => (e.currentTarget.style.color = accentColor)}
          >
            SIGN UP
          </button>
        </div>
      </form>
    </div>
  )
}
