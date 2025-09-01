"use client"
import { useState } from "react"
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline"
import { useAuthStore } from "../../stores/authStore"

export default function PinSetup({ isOpen, onClose }) {
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [generatedPin, setGeneratedPin] = useState("")
  const [copied, setCopied] = useState(false)
  const { setupPin2FA } = useAuthStore()

  const handleSetupPin = async () => {
    setLoading(true)
    setError("")
    
    try {
      const result = await setupPin2FA()
      
      if (result.success) {
        setGeneratedPin(result.pin)
        setSuccess(true)
      } else {
        setError(result.error || "Failed to set up PIN-based 2FA")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPin = () => {
    navigator.clipboard.writeText(generatedPin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setPin("")
    setShowPin(false)
    setError("")
    setSuccess(false)
    setGeneratedPin("")
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Enable PIN-based 2FA</h2>
          <p className="text-gray-400">
            Secure your account with a PIN that you'll enter every time you log in
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="space-y-6">
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-6 text-center">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                2FA Enabled Successfully!
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Your account is now protected with PIN-based two-factor authentication.
              </p>
            </div>

            <div className="bg-[#252525] rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <span className="text-lg mr-2">🔐</span>
                Your 2FA PIN
              </h4>
              
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex-1 bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-center">
                  <span className={`text-2xl font-mono tracking-widest ${showPin ? 'text-[#00D4FF]' : 'text-gray-500'}`}>
                    {showPin ? generatedPin : '••••••'}
                  </span>
                </div>
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="p-3 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
                >
                  {showPin ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              <button
                onClick={handleCopyPin}
                className="w-full flex items-center justify-center space-x-2 bg-[#333] hover:bg-[#444] text-white py-2 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    <span>Copy PIN</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                <span className="font-medium">⚠️ Important:</span> Save this PIN securely! You'll need to enter it every time you log in.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] text-white font-semibold py-3 rounded-xl transition-all duration-300"
            >
              Complete Setup
            </button>
          </div>
        ) : (
          /* Setup State */
          <div className="space-y-6">
            <div className="bg-[#252525] rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">How PIN-based 2FA works:</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-[#00D4FF] mr-2">1.</span>
                  We'll generate a secure 6-digit PIN for you
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D4FF] mr-2">2.</span>
                  Save this PIN in a secure location
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D4FF] mr-2">3.</span>
                  Enter your PIN every time you log in
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSetupPin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting up PIN...</span>
                  </div>
                ) : (
                  "Generate My 2FA PIN"
                )}
              </button>

              <button
                onClick={handleClose}
                className="w-full bg-[#333] hover:bg-[#444] text-white py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}