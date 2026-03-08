"use client"
import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"

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

  // Derived theme tokens (aligned to homepage: #020617 dark, #3B82F6 accent)
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
    padding: "9px 13px",
    color: inputColor,
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.15s",
  })

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col items-start mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#3B82F6,#8B5CF6)" }}>
            <span className="text-white font-bold text-sm font-mono">AF</span>
          </div>
          <span className="font-mono font-bold text-base" style={{ color: isLight ? "#111111" : "#F1F5F9" }}>AutoFlow</span>
        </div>
        <h2 className="text-3xl font-mono font-bold mb-1 tracking-tight"
          style={{ color: isLight ? "#111111" : "#F1F5F9" }}>
          Create Account
        </h2>
        <p className="text-sm font-mono" style={{ color: subTextColor }}>
          Join AutoFlow to start building workflows
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 p-2 rounded" style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)"
        }}>
          <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>

        {/* Name */}
        <div>
          <label className="block text-sm font-mono mb-1" style={{ color: labelColor }}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
            style={inputStyle(false)}
            onFocus={e => (e.target.style.borderColor = accentColor)}
            onBlur={e => (e.target.style.borderColor = inputBorder)}
          />
        </div>

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
          <label className="block text-sm font-mono mb-1" style={{ color: labelColor }}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              required
              style={{ ...inputStyle(formData.password && !passwordValid), paddingRight: "42px" }}
              onFocus={e => (e.target.style.borderColor = formData.password && !passwordValid ? "#ef4444" : accentColor)}
              onBlur={e => (e.target.style.borderColor = formData.password && !passwordValid ? "#ef4444" : inputBorder)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: isLight ? "#9ca3af" : "#6b7280" }}>
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {formData.password && !passwordValid && (
            <p className="text-xs mt-1" style={{ color: "#ef4444" }}>Password must be at least 6 characters</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-mono mb-1" style={{ color: labelColor }}>Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
              style={{ ...inputStyle(formData.confirmPassword && !passwordsMatch), paddingRight: "42px" }}
              onFocus={e => (e.target.style.borderColor = formData.confirmPassword && !passwordsMatch ? "#ef4444" : accentColor)}
              onBlur={e => (e.target.style.borderColor = formData.confirmPassword && !passwordsMatch ? "#ef4444" : inputBorder)}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: isLight ? "#9ca3af" : "#6b7280" }}>
              {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-xs mt-1" style={{ color: "#ef4444" }}>Passwords don&apos;t match</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !passwordValid || !passwordsMatch}
          className="signup-pulse w-full text-white font-mono font-bold py-2.5 px-4 transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          style={{ background: accentColor, fontSize: "15px" }}
          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = accentHover)}
          onMouseLeave={e => (e.currentTarget.style.background = accentColor)}
        >
          {loading ? "Creating account..." : "CREATE ACCOUNT"}
        </button>

        {/* Divider */}
        <div className="relative my-0">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: dividerLine }} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 text-xs" style={{ background: dividerBg, color: isLight ? "#9ca3af" : "#6b7280" }}>or</span>
          </div>
        </div>

        {/* Switch to login */}
        <div className="text-center text-sm font-mono" style={{ color: subTextColor }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold transition-colors"
            style={{ color: accentColor }}
            onMouseEnter={e => (e.currentTarget.style.color = accentHover)}
            onMouseLeave={e => (e.currentTarget.style.color = accentColor)}
          >
            login
          </button>
        </div>
      </form>
    </div>
  )
}
