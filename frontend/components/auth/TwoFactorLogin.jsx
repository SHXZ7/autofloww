"use client"
import { useState } from "react"
import { ShieldCheckIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { useAuthStore } from "../../stores/authStore"

export default function TwoFactorLogin({ email, onSuccess, onCancel }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { verify2FALogin } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await verify2FALogin(email, code)
      
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || "Invalid verification code")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCodeInput = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
    setCode(value)
    setError('')
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl w-full max-w-md p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-400">
          Enter the 6-digit code from your authenticator app
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Signing in as: <span className="text-[#00D4FF]">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#e74c3c]/10 border border-[#e74c3c]/20 rounded-xl">
          <p className="text-[#e74c3c] text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={handleCodeInput}
            className="w-full bg-[#0a0a0a] border border-[#444] rounded-xl px-4 py-4 text-center text-white text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all duration-200"
            placeholder="000000"
            maxLength={6}
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Enter the code from your authenticator app
          </p>
        </div>

        <button
          type="submit"
          disabled={code.length !== 6 || loading}
          className="w-full bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </div>
          ) : (
            "Verify & Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mx-auto"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Sign In</span>
        </button>
      </div>

      <div className="mt-6 p-4 bg-[#1a1a1a] rounded-xl">
        <p className="text-gray-400 text-xs text-center">
          <span className="font-medium text-white">Can't access your authenticator?</span><br/>
          You can use one of your backup codes instead of the 6-digit code.
        </p>
      </div>
    </div>
  )
}
