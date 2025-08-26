"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "../../stores/authStore"
import { CheckIcon, ShieldCheckIcon, DocumentDuplicateIcon, ArrowRightIcon } from "@heroicons/react/24/outline"

export default function TwoFactorSetup({ isOpen, onClose }) {
  const { setup2FA, verify2FASetup } = useAuthStore()
  const [stage, setStage] = useState('initial')
  const [qrData, setQrData] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrImageLoaded, setQrImageLoaded] = useState(false)
  const [qrImageError, setQrImageError] = useState(false)

  // Auto-start setup when modal opens
  useEffect(() => {
    if (isOpen && stage === 'initial') {
      console.log("Modal opened, starting 2FA setup...")
      handleSetup2FA()
    }
  }, [isOpen])

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setStage('initial')
      setQrData(null)
      setVerificationCode('')
      setBackupCodes([])
      setError('')
      setCopied(false)
      setQrImageLoaded(false)
      setQrImageError(false)
    }
  }, [isOpen])

  const handleSetup2FA = async () => {
    console.log("Starting 2FA setup process");
    try {
      setError('')
      setLoading(true)
      setStage('setup')
      
      const result = await setup2FA()
      console.log("2FA setup result:", result);
      
      if (result && result.success) {
        console.log("Setting QR data:", result)
        setQrData({
          secret: result.secret,
          uri: result.uri
        })
        setQrImageLoaded(false)
        setQrImageError(false)
      } else {
        setError(result?.error || 'Failed to set up 2FA')
        setStage('initial')
      }
    } catch (error) {
      console.error("2FA setup error:", error);
      setError('An unexpected error occurred')
      setStage('initial')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e) => {
    e.preventDefault()
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }
    
    try {
      setError('')
      setLoading(true)
      const result = await verify2FASetup(verificationCode)
      console.log("2FA verification result:", result);
      
      if (result && result.success) {
        setBackupCodes(result.backup_codes || [])
        setStage('complete')
      } else {
        setError(result?.error || 'Invalid verification code. Please try again.')
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeInput = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
    setVerificationCode(value)
    setError('')
  }

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
    setCopied(true)
    
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const getQRCodeUrl = (text) => {
    console.log("Generating QR code for:", text)
    // Use a more reliable QR code service
    const encodedText = encodeURIComponent(text)
    return `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodedText}&choe=UTF-8`
  }

  const handleQRImageLoad = () => {
    console.log("QR code loaded successfully")
    setQrImageLoaded(true)
    setQrImageError(false)
  }

  const handleQRImageError = (e) => {
    console.error("QR code failed to load:", e)
    setQrImageError(true)
    setQrImageLoaded(false)
  }

  const handleContinueToVerification = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setStage('verify')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <ShieldCheckIcon className="w-6 h-6 mr-2 text-[#00D4FF]" />
            Two-Factor Authentication Setup
          </h2>
          <p className="text-gray-400 mt-2">
            Secure your account with an additional layer of protection
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className={`${stage === 'setup' || stage === 'verify' || stage === 'complete' ? 'text-[#00D4FF]' : 'text-gray-500'}`}>
              1. Scan QR Code
            </span>
            <span className={`${stage === 'verify' || stage === 'complete' ? 'text-[#00D4FF]' : 'text-gray-500'}`}>
              2. Enter Code
            </span>
            <span className={`${stage === 'complete' ? 'text-[#00D4FF]' : 'text-gray-500'}`}>
              3. Complete
            </span>
          </div>
          <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
            <div 
              className="bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] h-2 rounded-full transition-all duration-500"
              style={{ 
                width: stage === 'setup' ? '33%' : stage === 'verify' ? '66%' : stage === 'complete' ? '100%' : '0%' 
              }}
            ></div>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
            Stage: {stage}, QR Data: {qrData ? 'Available' : 'None'}, Loading: {loading.toString()}, QR Loaded: {qrImageLoaded.toString()}, QR Error: {qrImageError.toString()}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00D4FF]"></div>
            <p className="mt-2 text-gray-400">Processing...</p>
          </div>
        )}

        {/* QR Code Setup Stage */}
        {!loading && stage === 'setup' && qrData && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-4">Step 1: Scan QR Code</h3>
              
              {/* QR Code Display */}
              <div className="bg-white p-6 rounded-lg inline-block mb-4 shadow-lg">
                {qrImageError ? (
                  <div className="w-[250px] h-[250px] flex flex-col items-center justify-center bg-gray-100 text-gray-600">
                    <p className="text-sm mb-2">QR Code failed to load</p>
                    <button 
                      onClick={() => {
                        setQrImageError(false)
                        setQrImageLoaded(false)
                      }}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    {!qrImageLoaded && (
                      <div className="w-[250px] h-[250px] flex items-center justify-center bg-gray-100">
                        <div className="text-gray-600 text-sm">Loading QR Code...</div>
                      </div>
                    )}
                    <img 
                      src={getQRCodeUrl(qrData.uri)}
                      alt="QR Code for 2FA Setup"
                      className={`mx-auto block ${qrImageLoaded ? '' : 'hidden'}`}
                      width={250}
                      height={250}
                      onLoad={handleQRImageLoad}
                      onError={handleQRImageError}
                    />
                  </>
                )}
              </div>
              
              <p className="text-sm text-gray-300 mb-4">
                Scan this QR code with your authenticator app:
              </p>
              <div className="flex justify-center space-x-4 text-xs text-gray-400 mb-4">
                <span>• Google Authenticator</span>
                <span>• Microsoft Authenticator</span>
                <span>• Authy</span>
              </div>
              
              <div className="bg-[#252525] p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-400 mb-2">Manual entry key:</p>
                <p className="font-mono text-sm text-[#00D4FF] break-all">{qrData.secret}</p>
              </div>

              {/* Continue Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleContinueToVerification}
                  className="bg-[#00D4FF] hover:bg-[#00C4EF] text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                  <span>Continue to Verification</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Code Input Stage */}
        {!loading && stage === 'verify' && qrData && (
          <div className="space-y-6">
            {/* Show smaller QR code at top */}
            <div className="text-center">
              <div className="bg-white p-3 rounded-lg inline-block mb-4">
                <img 
                  src={getQRCodeUrl(qrData.uri)}
                  alt="QR Code for 2FA Setup"
                  className="mx-auto"
                  width={150}
                  height={150}
                />
              </div>
              <h3 className="text-lg font-semibold text-white mb-4">Step 2: Enter Verification Code</h3>
              <p className="text-gray-300 mb-6">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-3 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={handleCodeInput}
                  className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-4 py-4 text-center text-white text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
              
              <button
                type="submit"
                disabled={verificationCode.length !== 6 || loading}
                className="w-full bg-[#00D4FF] hover:bg-[#00C4EF] disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors font-semibold"
              >
                {loading ? "Verifying..." : "Verify & Enable 2FA"}
              </button>
            </form>
              
            <button
              type="button"
              onClick={() => setStage('setup')}
              className="w-full text-[#00D4FF] hover:text-white transition-colors text-sm"
            >
              ← Back to QR Code
            </button>
          </div>
        )}

        {/* Success/Complete Stage */}
        {!loading && stage === 'complete' && (
          <div className="space-y-6">
            <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-[#00D4FF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-8 h-8 text-[#00D4FF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                🎉 Two-Factor Authentication Enabled!
              </h3>
              <p className="text-gray-300 text-sm">
                Your account is now protected with 2FA
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-white font-medium">📱 Important: Save Your Backup Codes</h4>
              <p className="text-gray-400 text-sm">
                Keep these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </p>
              
              <div className="bg-[#252525] p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-[#00D4FF] p-2 bg-[#1a1a1a] rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className="w-full flex items-center justify-center space-x-2 text-sm bg-[#333333] hover:bg-[#444444] px-3 py-2 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Copied to clipboard!</span>
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Copy all backup codes</span>
                  </>
                )}
              </button>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  ⚠️ <strong>Warning:</strong> Store these codes securely! They won't be shown again.
                </p>
              </div>
            </div>
            
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#00D4FF] hover:bg-[#00C4EF] px-8 py-3 rounded-lg text-white font-semibold transition-colors"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {/* Initial Stage (fallback) */}
        {!loading && stage === 'initial' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-300 mb-6">
                Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password when you sign in.
              </p>
              <button
                type="button"
                onClick={handleSetup2FA}
                className="bg-[#00D4FF] hover:bg-[#00C4EF] px-6 py-3 rounded-lg text-white font-semibold transition-colors"
              >
                Start 2FA Setup
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && stage !== 'complete' && (
          <div className="mt-8 pt-4 border-t border-[#333333] flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#333333] hover:bg-[#444444] text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
