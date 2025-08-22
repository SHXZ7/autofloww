"use client"
import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { ShieldCheckIcon } from "@heroicons/react/24/outline"

export default function TwoFactorLogin({ email, onSuccess, onCancel }) {
  const { verify2FALogin, loading } = useAuthStore()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError("Please enter the verification code")
      return
    }

    try {
      const result = await verify2FALogin(email, code)
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || "Invalid verification code")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-8 max-w-md w-full shadow-xl">
      <div className="text-center mb-6">
        <ShieldCheckIcon className="w-12 h-12 mx-auto text-[#00D4FF] mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-400">
          Enter the verification code from your authenticator app
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#cccccc] mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={6}
            className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
            placeholder="000000"
            autoComplete="one-time-code"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can also use a backup code from your list
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-[#333333] hover:bg-[#444444] text-white rounded-lg transition-colors"
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 text-white rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </form>
    </div>
  )
}
