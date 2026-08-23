"use client"
import { useState } from "react"
import { ArrowLeftIcon, EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline"

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://autoflow-f6hga9djg0a5b4fj.uaenorth-01.azurewebsites.net'


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    
    if (!email) {
      setError("Email is required")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.detail || data.error || "Failed to send reset email")
      }
    } catch (error) {
      setError("Network error - please check if the backend is running")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="mb-6">
          <div className="w-14 h-14 bg-[#2EA38D]/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#2EA38D]/30">
            <CheckCircleIcon className="w-7 h-7 text-[#2EA38D]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#241812] tracking-tight mb-2">Check Your Email</h2>
          <p className="text-sm text-[#736357]">
            We've sent a password reset link to <span className="font-semibold text-[#241812]">{email}</span>
          </p>
        </div>

        <div className="bg-[#EDE6DC] border border-[#E5DCD0] rounded-2xl p-5 mb-6 text-left shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#241812] mb-3">Next Steps</h3>
          <ul className="text-xs text-[#736357] space-y-2">
            <li>1. Check your email inbox (and spam folder)</li>
            <li>2. Click the secure reset link (valid for 1 hour)</li>
            <li>3. Enter your new password and sign in</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={onBack}
            className="w-full py-3.5 px-6 rounded-full bg-[#241812] hover:bg-[#3A2C24] text-white font-bold text-sm tracking-wide transition-all shadow-md cursor-pointer"
          >
            Back to Sign In
          </button>
          
          <button
            onClick={() => {
              setSuccess(false)
              setEmail("")
            }}
            className="w-full text-xs font-semibold text-[#EB5E3D] hover:text-[#D94F2F] transition-colors py-1"
          >
            Send another reset email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDE6DC] hover:bg-[#E5DCD0] text-xs font-semibold text-[#736357] hover:text-[#241812] transition-colors mb-6 border border-[#E5DCD0]/60 shadow-2xs"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>
        
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#241812] tracking-tight mb-2">Reset Password</h2>
        <p className="text-sm text-[#736357]">
          Enter your email address and we'll send you a password recovery link.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#241812] tracking-wide">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm bg-white border border-[#E5DCD0] text-[#241812] placeholder-[#A89C94] outline-none transition-all focus:border-[#EB5E3D] focus:ring-2 focus:ring-[#EB5E3D]/15 shadow-2xs"
              placeholder="name@company.com"
              required
            />
            <EnvelopeIcon className="w-4 h-4 text-[#A89C94] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3.5 px-6 rounded-full bg-[#EB5E3D] hover:bg-[#D94F2F] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending link...
            </span>
          ) : (
            "Send Reset Link →"
          )}
        </button>
      </form>
    </div>
  )
}
