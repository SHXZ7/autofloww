"use client"
import { useState } from "react"
import { ArrowLeftIcon, EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline"

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const API_BASE_URL =  "https://autoflow-backend-pl6h.onrender.com/"


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
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-gray-400">
            We've sent a password reset link to <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#444] rounded-xl p-4 mb-6">
          <h3 className="text-white font-medium mb-2">What's next?</h3>
          <ul className="text-sm text-gray-300 space-y-1 text-left">
            <li>1. Check your email inbox</li>
            <li>2. Click the reset link (valid for 1 hour)</li>
            <li>3. Enter your new password</li>
            <li>4. Sign in with your new password</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={onBack}
            className="w-full bg-[#333333] hover:bg-[#444444] text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
          >
            Back to Sign In
          </button>
          
          <button
            onClick={() => {
              setSuccess(false)
              setEmail("")
            }}
            className="w-full text-[#00D4FF] hover:text-white text-sm transition-colors"
          >
            Send another email
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
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Sign In</span>
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
        <p className="text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-[#e74c3c]/10 border border-[#e74c3c]/20 rounded-xl">
          <p className="text-[#e74c3c] text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-xl pl-11 pr-4 py-3 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all duration-200"
              placeholder="Enter your email address"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </div>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-[#1a1a1a] rounded-xl">
        <p className="text-gray-400 text-sm">
          <span className="font-medium text-white">Having trouble?</span> Make sure you're using the email address associated with your AutoFlow account.
        </p>
      </div>
    </div>
  )
}
