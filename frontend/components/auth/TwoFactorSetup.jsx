"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "../../stores/authStore"
import { CheckIcon, ShieldCheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline"

export default function TwoFactorSetup({ isOpen, onClose }) {
  const { setup2FA, verify2FASetup } = useAuthStore()
  const [stage, setStage] = useState('initial') // initial, setup, verify, complete
  const [qrData, setQrData] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // Setup 2FA when the modal is opened
  useEffect(() => {
    if (isOpen && stage === 'initial') {
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
        setQrData({
          secret: result.secret,
          uri: result.uri
        })
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

  const handleVerify2FA = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code')
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
        setError(result?.error || 'Failed to verify code')
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
    setCopied(true)
    
    // Reset copied status after 2 seconds
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  // Function to get QR code URL
  const getQRCodeUrl = (text) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <ShieldCheckIcon className="w-6 h-6 mr-2 text-[#00D4FF]" />
            Two-Factor Authentication
          </h2>
          {stage !== 'complete' && (
            <p className="text-gray-400 mt-2">
              Protect your account with an additional layer of security
            </p>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00D4FF]"></div>
            <p className="mt-2 text-gray-400">Setting up 2FA...</p>
          </div>
        )}

        {/* Setup Stage */}
        {!loading && stage === 'setup' && qrData && (
          <div className="space-y-4">
            <div className="glass p-6 rounded-lg flex flex-col items-center">
              {/* Replace QRCode component with an image */}
              <img 
                src={getQRCodeUrl(qrData.uri)}
                alt="QR Code"
                className="mb-4"
                width={200}
                height={200}
              />
              <div className="text-center">
                <p className="text-sm text-gray-300 mb-2">
                  Scan this QR code with your authenticator app
                </p>
                <p className="font-mono text-sm text-[#00D4FF] bg-[#00D4FF]/10 px-3 py-1 rounded">
                  {qrData.secret}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#cccccc] mb-2">
                Enter the 6-digit code from your app
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  className="flex-1 bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                  placeholder="000000"
                />
                <button
                  onClick={handleVerify2FA}
                  className="px-4 py-2 bg-[#00D4FF] hover:bg-[#00C4EF] text-white rounded-lg transition-colors"
                >
                  Verify
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Enter the code from your authenticator app to verify setup
              </p>
            </div>
          </div>
        )}

        {/* Complete Stage */}
        {!loading && stage === 'complete' && (
          <div className="space-y-6">
            <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg p-4 text-center">
              <div className="w-16 h-16 bg-[#00D4FF]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckIcon className="w-8 h-8 text-[#00D4FF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Two-Factor Authentication Enabled
              </h3>
              <p className="text-gray-300 text-sm">
                Your account is now protected with 2FA
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-white font-medium">Backup Codes</h4>
              <p className="text-gray-400 text-sm">
                Keep these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </p>
              
              <div className="bg-[#252525] p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm text-[#00D4FF]">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleCopyBackupCodes}
                className="flex items-center space-x-2 text-sm bg-[#333333] hover:bg-[#444444] px-3 py-2 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Copy all codes</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="text-center">
              <button
                onClick={onClose}
                className="bg-[#00D4FF] hover:bg-[#00C4EF] px-6 py-2 rounded-lg text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Initial Stage */}
        {!loading && stage === 'initial' && (
          <div className="space-y-4">
            <p className="text-gray-300">
              Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password when you sign in.
            </p>
            <p className="text-gray-300">
              You'll need an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy to proceed.
            </p>
          </div>
        )}

        {/* Buttons */}
        {!loading && stage !== 'complete' && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#333333] hover:bg-[#444444] text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            {stage === 'initial' && (
              <button
                onClick={handleSetup2FA}
                className="px-4 py-2 bg-[#00D4FF] hover:bg-[#00C4EF] text-white rounded-lg transition-colors"
              >
                Set Up 2FA
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
