"use client"
import { useState, useEffect } from "react"
import { XMarkIcon, UserCircleIcon, KeyIcon, CreditCardIcon, ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline"
import { useAuthStore } from "../stores/authStore"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://autofloww-production.up.railway.app"

export default function ProfileSettings({ isOpen, onClose, activeTab = "profile" }) {
  const [currentTab, setCurrentTab] = useState(activeTab)
  const { user, updateUserProfile, changePassword, updateApiKeys, getApiKeys, loading, logout } = useAuthStore()
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    workspace: "",
    timezone: "UTC-5 (Eastern Time)",
    notifications: {
      email: true,
      workflow: true,
      errors: true
    }
  })
  
  const [apiKeys, setApiKeys] = useState({
    openai: { key: "", isActive: false },
    groq: { key: "", isActive: false },
    openrouter: { key: "", isActive: false },
    google: { key: "", isActive: false },
    google_token_json: { key: "", isActive: false },
    gmail_token_json: { key: "", isActive: false },
    discord: { key: "", isActive: false },
    github: { key: "", isActive: false },
    whatsapp_token: { key: "", isActive: false },
    whatsapp_phone_number_id: { key: "", isActive: false },
    whatsapp_sender_number: { key: "", isActive: false },
    stability: { key: "", isActive: false },
    twitter_api_key: { key: "", isActive: false },
    twitter_api_secret: { key: "", isActive: false },
    twitter_access_token: { key: "", isActive: false },
    twitter_access_secret: { key: "", isActive: false },
    linkedin_token: { key: "", isActive: false },
    instagram_token: { key: "", isActive: false }
  })
  
  const [apiKeysLoading, setApiKeysLoading] = useState(false)
  const [apiKeysSaving, setApiKeysSaving] = useState(false)
  const [apiKeysHasChanges, setApiKeysHasChanges] = useState(false)
  const [connectingGoogle, setConnectingGoogle] = useState(false)

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  
  const [passwordErrors, setPasswordErrors] = useState({})
  
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [changingPassword, setChangingPassword] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Always define ALL useEffect hooks in the same order, regardless of conditions
  // Update profile when user data changes
  
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        workspace: user.profile?.workspace || "My Workspace",
        timezone: user.profile?.timezone || "UTC-5 (Eastern Time)",
        notifications: {
          email: user.profile?.notifications?.email ?? true,
          workflow: user.profile?.notifications?.workflow ?? true,
          errors: user.profile?.notifications?.errors ?? true
        }
      })
      setHasChanges(false)
      setErrors({})
    }
  }, [user])
  
  // When active tab changes externally
  useEffect(() => {
    setCurrentTab(activeTab)
  }, [activeTab])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasChanges(false)
      setErrors({})
      setSaving(false)
      // Reset password form when modal closes
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      setPasswordErrors({})
      setChangingPassword(false)
    }
  }, [isOpen])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Load API keys when component mounts or user changes
  useEffect(() => {
    const loadApiKeys = async () => {
      if (user && currentTab === "api") {
        setApiKeysLoading(true)
        try {
          const result = await getApiKeys()
          if (result.success && result.apiKeys) {
            setApiKeys(result.apiKeys)
          }
        } catch (error) {
          console.error('Failed to load API keys:', error)
        } finally {
          setApiKeysLoading(false)
        }
      }
    }
    
    loadApiKeys()
  }, [user, currentTab])

  if (!isOpen) return null
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!profile.name.trim()) {
      newErrors.name = "Name is required"
    }
    
    if (!profile.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!profile.workspace.trim()) {
      newErrors.workspace = "Workspace name is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const validatePasswordForm = () => {
    const errors = {}
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required"
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required"
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters"
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password"
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }
    
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }
  
  const handleNotificationChange = (field, checked) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: checked
      }
    }))
    setHasChanges(true)
  }
  
  const handleApiKeyChange = (service, value) => {
    setApiKeys(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        key: value,
        isActive: value.length > 10 // Simple validation
      }
    }))
    setApiKeysHasChanges(true)
  }
  
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }
  
  const saveChanges = async () => {
    if (!validateForm()) {
      return
    }
    
    setSaving(true)
    
    try {
      const result = await updateUserProfile(profile)
      
      if (result.success) {
        setHasChanges(false)
        // Show success message
        const successNotification = document.createElement('div')
        successNotification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successNotification.textContent = 'Profile updated successfully!'
        document.body.appendChild(successNotification)
        
        setTimeout(() => {
          document.body.removeChild(successNotification)
        }, 3000)
      } else {
        // Show error message
        const errorMessage = result.error || "Failed to update profile"
        const errorNotification = document.createElement('div')
        errorNotification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        errorNotification.textContent = errorMessage
        document.body.appendChild(errorNotification)
        
        setTimeout(() => {
          document.body.removeChild(errorNotification)
        }, 5000)
      }
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setSaving(false)
    }
  }
  
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return
    }
    
    setChangingPassword(true)
    
    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      )
      
      if (result.success) {
        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        
        // Show success message
        const successNotification = document.createElement('div')
        successNotification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successNotification.textContent = 'Password changed successfully!'
        document.body.appendChild(successNotification)
        
        setTimeout(() => {
          document.body.removeChild(successNotification)
        }, 3000)
      } else {
        // Show error message
        setPasswordErrors({
          ...passwordErrors,
          general: result.error
        })
      }
    } catch (error) {
      console.error("Failed to change password:", error)
      setPasswordErrors({
        ...passwordErrors,
        general: "An unexpected error occurred"
      })
    } finally {
      setChangingPassword(false)
    }
  }
  
  const saveApiKeys = async () => {
    setApiKeysSaving(true)
    
    try {
      const result = await updateApiKeys(apiKeys)
      
      if (result.success) {
        setApiKeysHasChanges(false)
        // Show success message
        showNotification('API keys updated successfully!', 'success')
      } else {
        showNotification(result.error || 'Failed to update API keys', 'error')
      }
    } catch (error) {
      console.error("Failed to save API keys:", error)
      showNotification('An unexpected error occurred', 'error')
    } finally {
      setApiKeysSaving(false)
    }
  }

  const connectGoogleOneClick = async () => {
    setConnectingGoogle(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        showNotification("Please log in again to connect Google", "error")
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/google/oauth/start`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok || !data?.auth_url) {
        throw new Error(data?.detail || "Could not start Google connect flow")
      }

      window.location.href = data.auth_url
    } catch (error) {
      showNotification(error?.message || "Failed to connect Google", "error")
      setConnectingGoogle(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div')
    notification.className = `fixed bottom-4 right-4 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white px-6 py-3 rounded-lg shadow-lg z-50`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, type === 'success' ? 3000 : 5000)
  }

  const maskApiKey = (key) => {
    if (!key || key.length < 8) return key
    return key.substring(0, 4) + '•'.repeat(Math.max(0, key.length - 8)) + key.substring(key.length - 4)
  }

  const handleLogout = () => {
    onClose()
    logout()
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "api", label: "API Keys", icon: "🔑" },
    { id: "billing", label: "Billing", icon: "💳" },
    { id: "notifications", label: "Notifications", icon: "🔔" }
  ]

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex ${isMobile ? 'items-end justify-center p-1.5 pb-[78px]' : 'items-center justify-center'} ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className={`bg-[#0f172a] border border-[#1e293b] w-full overflow-hidden flex flex-col ${isMobile ? 'rounded-2xl h-[76dvh] max-h-[calc(100dvh-96px)] max-w-[380px] ps-mobile' : 'rounded-xl max-w-4xl h-[80vh]'}`}>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fade-in {
            animation: fadeIn 0.3s ease forwards;
          }

          .ps-mobile h3 {
            font-size: 0.92rem;
            line-height: 1.2rem;
          }

          .ps-mobile h4 {
            font-size: 0.82rem;
            line-height: 1.1rem;
          }

          .ps-mobile label,
          .ps-mobile p,
          .ps-mobile li,
          .ps-mobile span,
          .ps-mobile div {
            letter-spacing: 0;
          }

          .ps-mobile input,
          .ps-mobile select,
          .ps-mobile textarea {
            padding: 0.42rem 0.58rem;
            font-size: 0.88rem;
          }

          .ps-mobile .text-sm {
            font-size: 0.78rem !important;
            line-height: 1.05rem;
          }

          .ps-mobile .text-xs {
            font-size: 0.7rem !important;
            line-height: 1rem;
          }

          .ps-mobile .space-y-6 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.9rem;
          }

          .ps-mobile .space-y-4 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.6rem;
          }

          .ps-mobile .mobile-tight {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
          }

          .ps-mobile .mobile-small {
            font-size: 0.78rem;
          }
        `}</style>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-[#1e293b] ${isMobile ? 'pl-3 pr-4 py-2.5' : 'p-6'}`}>
          <h2 className={`${isMobile ? 'text-[15px]' : 'text-xl'} font-semibold text-white`}>Profile Settings</h2>
          <button
            onClick={onClose}
            className={`${isMobile ? 'w-8 h-8' : 'p-2'} flex items-center justify-center shrink-0 hover:bg-[#1e293b] rounded-lg transition-colors`}
            aria-label="Close settings"
          >
            <XMarkIcon className={`${isMobile ? 'w-[18px] h-[18px]' : 'w-5 h-5'} text-[#64748b]`} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar / Mobile Tabs */}
          {isMobile ? (
            <div className="w-[50px] border-r border-[#1e293b] px-1 py-1.5">
              <nav className="flex flex-col gap-1.5 items-center">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      currentTab === tab.id
                        ? "bg-[#3B82F6] text-white"
                        : "text-[#94a3b8] hover:bg-[#1e293b]"
                    }`}
                    title={tab.label}
                    aria-label={tab.label}
                  >
                    <span className="text-sm leading-none">{tab.icon}</span>
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-300 hover:bg-red-500/15 transition-colors mt-0.5"
                  title="Logout"
                  aria-label="Logout"
                >
                  <span className="text-sm leading-none">↩</span>
                </button>
              </nav>
            </div>
          ) : (
            <div className="w-64 border-r border-[#1e293b] p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      currentTab === tab.id
                        ? "bg-[#3B82F6] text-white"
                        : "text-[#94a3b8] hover:bg-[#1e293b]"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Content */}
          <div className={`flex-1 overflow-y-auto animate-fade-in ${isMobile ? 'p-2 pb-3' : 'p-6'}`}>
            {/* Profile Tab */}
            {currentTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={`w-full bg-[#1e293b] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all ${
                          errors.name ? 'border-red-500' : 'border-[#334155]'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full bg-[#1e293b] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all ${
                          errors.email ? 'border-red-500' : 'border-[#334155]'
                        }`}
                        placeholder="Enter your email address"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                        Workspace Name *
                      </label>
                      <input
                        type="text"
                        value={profile.workspace}
                        onChange={(e) => handleInputChange("workspace", e.target.value)}
                        className={`w-full bg-[#1e293b] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all ${
                          errors.workspace ? 'border-red-500' : 'border-[#334155]'
                        }`}
                        placeholder="Enter workspace name"
                      />
                      {errors.workspace && (
                        <p className="text-red-400 text-sm mt-1">{errors.workspace}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                        Timezone
                      </label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => handleInputChange("timezone", e.target.value)}
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      >
                        <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                        <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                        <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                        <option value="UTC+1 (CET)">UTC+1 (CET)</option>
                        <option value="UTC+5:30 (IST)">UTC+5:30 (IST)</option>
                        <option value="UTC+8 (CST)">UTC+8 (CST)</option>
                        <option value="UTC+9 (JST)">UTC+9 (JST)</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Save Button for Profile Tab */}
                  <div className="mt-6 pt-4 border-t border-[#1e293b]">
                    <button 
                      onClick={saveChanges}
                      disabled={!hasChanges || saving || loading}
                      className={`px-6 py-2 bg-[#3B82F6] hover:bg-[#2563eb] text-white rounded-lg transition-colors ${
                        !hasChanges || saving || loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {saving ? "Saving..." : "Save Profile"}
                    </button>
                    {hasChanges && (
                      <p className="text-yellow-400 text-sm mt-2">
                        You have unsaved changes
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* API Keys Tab */}
            {currentTab === "api" && (
              <div className={isMobile ? "space-y-3" : "space-y-6"}>
                <div>
                  <h3 className={`${isMobile ? "text-base mb-2" : "text-lg mb-4"} font-semibold text-white`}>API Keys</h3>
                  <p className={`text-[#64748b] ${isMobile ? "text-xs mb-3" : "mb-6"}`}>Manage your API keys for external integrations</p>
                  <div className={`bg-[#172554] border border-[#1d4ed8] rounded-lg ${isMobile ? "p-2.5 mb-3" : "p-4 mb-6"}`}>
                    <div className={`${isMobile ? "text-xs mb-2" : "text-sm mb-3"} font-semibold text-[#bfdbfe]`}>Google Connection Setup (2 minutes)</div>
                    <div className="mb-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={connectGoogleOneClick}
                        disabled={connectingGoogle}
                        className={`${isMobile ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"} rounded-md font-semibold text-white transition-colors ${connectingGoogle ? "bg-[#1e40af] opacity-70 cursor-not-allowed" : "bg-[#2563eb] hover:bg-[#1d4ed8]"}`}
                      >
                        {connectingGoogle ? "Connecting..." : "Connect Google (One Click)"}
                      </button>
                      <span className="text-[11px] text-[#bfdbfe]">Recommended for all users</span>
                    </div>
                    <div className="grid gap-2">
                      <div className={`bg-[#1e3a8a]/40 border border-[#1d4ed8]/40 rounded-md text-[#dbeafe] ${isMobile ? "p-2 text-[11px]" : "p-3 text-xs"}`}>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B82F6] text-white font-bold mr-2">1</span>
                        Copy your Google OAuth token JSON from your connect flow.
                      </div>
                      <div className={`bg-[#1e3a8a]/40 border border-[#1d4ed8]/40 rounded-md text-[#dbeafe] ${isMobile ? "p-2 text-[11px]" : "p-3 text-xs"}`}>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B82F6] text-white font-bold mr-2">2</span>
                        Paste it in <span className="font-semibold text-white">Google OAuth Token JSON</span> and click <span className="font-semibold text-white">Save API Keys</span>.
                      </div>
                      <div className={`bg-[#1e3a8a]/40 border border-[#1d4ed8]/40 rounded-md text-[#dbeafe] ${isMobile ? "p-2 text-[11px]" : "p-3 text-xs"}`}>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B82F6] text-white font-bold mr-2">3</span>
                        Done. Gmail, Sheets, and Drive nodes will run from your account.
                      </div>
                    </div>
                    {!isMobile && (
                      <div className="mt-3 p-3 rounded-md bg-[#0f172a] border border-[#334155]">
                        <div className="text-[11px] text-[#94a3b8] mb-1">Token JSON should look like:</div>
                        <pre className="text-[11px] text-[#cbd5e1] whitespace-pre-wrap font-mono">{"{\"refresh_token\":\"...\",\"client_id\":\"...\",\"client_secret\":\"...\",\"token_uri\":\"https://oauth2.googleapis.com/token\"}"}</pre>
                      </div>
                    )}
                    <div className={`mt-3 rounded-md bg-[#111827] border border-[#374151] ${isMobile ? "p-2" : "p-3"}`}>
                      <div className={`${isMobile ? "text-[11px] mb-1.5" : "text-xs mb-2"} font-semibold text-white`}>Where do I get this token?</div>
                      <div className={`${isMobile ? "text-[11px] space-y-1.5" : "text-xs space-y-2"} text-[#cbd5e1]`}>
                        <div>
                          Option A (recommended): Ask your workspace admin for the AutoFlow Google connect link and sign in with your Google account.
                        </div>
                        <div>
                          Option B (self-serve): Use Google OAuth Playground to generate a refresh token.
                          <a
                            href="https://developers.google.com/oauthplayground"
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1 text-[#60a5fa] underline"
                          >
                            Open OAuth Playground
                          </a>
                        </div>
                        <div>
                          Required scopes: gmail.send, gmail.readonly, spreadsheets, drive.file.
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {apiKeysLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
                      <span className="ml-2 text-[#64748b]">Loading API keys...</span>
                    </div>
                  ) : (
                    <div className={isMobile ? "space-y-4" : "space-y-6"}>
                      {/* AI Services Section */}
                      <div>
                        <h4 className={`${isMobile ? "text-sm mb-2" : "mb-4"} text-white font-medium flex items-center`}>
                          <span className="text-lg mr-2">🤖</span>
                          AI & Language Models
                        </h4>
                        <div className={`${isMobile ? "space-y-3 ml-0" : "space-y-4 ml-6"}`}>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">OpenAI API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.openai.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.openai.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.openai.key}
                              onChange={(e) => handleApiKeyChange("openai", e.target.value)}
                              placeholder="sk-..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.openai.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.openai.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for OpenAI GPT models (GPT-4, GPT-3.5, DALL-E)
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Groq API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.groq?.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.groq?.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.groq?.key || ""}
                              onChange={(e) => handleApiKeyChange("groq", e.target.value)}
                              placeholder="gsk_..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {(apiKeys.groq?.key) && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.groq.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for AI text generation in your current workflow runner.
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">OpenRouter API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.openrouter.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.openrouter.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.openrouter.key}
                              onChange={(e) => handleApiKeyChange("openrouter", e.target.value)}
                              placeholder="sk-or-v1-..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.openrouter.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.openrouter.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for accessing multiple AI models (Llama, Claude, Gemini, Mistral)
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Google API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.google.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.google.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.google.key}
                              onChange={(e) => handleApiKeyChange("google", e.target.value)}
                              placeholder="AIza..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.google.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.google.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Google Sheets integration, Google Drive, and Gemini AI models
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Stability AI API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.stability.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.stability.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.stability.key}
                              onChange={(e) => handleApiKeyChange("stability", e.target.value)}
                              placeholder="sk-..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.stability.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.stability.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Stable Diffusion image generation
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Communication Services Section */}
                      <div>
                        <h4 className={`${isMobile ? "text-sm mb-2" : "mb-4"} text-white font-medium flex items-center`}>
                          <span className="text-lg mr-2">💬</span>
                          Communication & Messaging
                        </h4>
                        <div className={`${isMobile ? "space-y-3 ml-0" : "space-y-4 ml-6"}`}>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Discord Webhook URL</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.discord.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.discord.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.discord.key}
                              onChange={(e) => handleApiKeyChange("discord", e.target.value)}
                              placeholder="https://discord.com/api/webhooks/..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.discord.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.discord.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Discord messaging integration
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Google OAuth Token JSON</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.google_token_json.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.google_token_json.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <textarea
                              value={apiKeys.google_token_json.key}
                              onChange={(e) => handleApiKeyChange("google_token_json", e.target.value)}
                              placeholder=""
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                              rows={isMobile ? 3 : 4}
                            />
                            {apiKeys.google_token_json.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.google_token_json.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Gmail Trigger, Email send, Google Sheets, and Google Drive using your own account.
                            </p>
                          </div>

                          <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3">
                            <p className="text-xs text-[#94a3b8]">
                              Gmail OAuth token is now managed via <span className="text-white font-medium">Google OAuth Token JSON</span>.
                              The old Gmail token field is hidden to avoid confusion.
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">WhatsApp Access Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.whatsapp_token.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.whatsapp_token.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.whatsapp_token.key}
                              onChange={(e) => handleApiKeyChange("whatsapp_token", e.target.value)}
                              placeholder="EAAG..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.whatsapp_token.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.whatsapp_token.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Meta WhatsApp Cloud API requests
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">WhatsApp Phone Number ID</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.whatsapp_phone_number_id.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.whatsapp_phone_number_id.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.whatsapp_phone_number_id.key}
                              onChange={(e) => handleApiKeyChange("whatsapp_phone_number_id", e.target.value)}
                              placeholder="123456789012345"
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.whatsapp_phone_number_id.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.whatsapp_phone_number_id.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required sender phone number ID from Meta app dashboard
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">WhatsApp Sender Number (Optional)</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.whatsapp_sender_number.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.whatsapp_sender_number.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.whatsapp_sender_number.key}
                              onChange={(e) => handleApiKeyChange("whatsapp_sender_number", e.target.value)}
                              placeholder="+91..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.whatsapp_sender_number.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.whatsapp_sender_number.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Optional display reference for your business WhatsApp number
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Social Media Services Section */}
                      <div>
                        <h4 className={`${isMobile ? "text-sm mb-2" : "mb-4"} text-white font-medium flex items-center`}>
                          <span className="text-lg mr-2">📱</span>
                          Social Media Platforms
                        </h4>
                        <div className={`${isMobile ? "space-y-3 ml-0" : "space-y-4 ml-6"}`}>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Twitter API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twitter_api_key.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.twitter_api_key.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twitter_api_key.key}
                              onChange={(e) => handleApiKeyChange("twitter_api_key", e.target.value)}
                              placeholder="API Key..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.twitter_api_key.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.twitter_api_key.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Twitter/X posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Twitter API Secret</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twitter_api_secret.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.twitter_api_secret.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twitter_api_secret.key}
                              onChange={(e) => handleApiKeyChange("twitter_api_secret", e.target.value)}
                              placeholder="API Secret..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.twitter_api_secret.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.twitter_api_secret.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Twitter/X posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Twitter Access Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twitter_access_token.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.twitter_access_token.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twitter_access_token.key}
                              onChange={(e) => handleApiKeyChange("twitter_access_token", e.target.value)}
                              placeholder="Access Token..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.twitter_access_token.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.twitter_access_token.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Twitter/X posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Twitter Access Token Secret</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twitter_access_secret.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.twitter_access_secret.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twitter_access_secret.key}
                              onChange={(e) => handleApiKeyChange("twitter_access_secret", e.target.value)}
                              placeholder="Access Token Secret..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.twitter_access_secret.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.twitter_access_secret.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Twitter/X posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">LinkedIn Access Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.linkedin_token.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.linkedin_token.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.linkedin_token.key}
                              onChange={(e) => handleApiKeyChange("linkedin_token", e.target.value)}
                              placeholder="LinkedIn Access Token..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.linkedin_token.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.linkedin_token.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for LinkedIn posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">Instagram Access Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.instagram_token.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.instagram_token.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.instagram_token.key}
                              onChange={(e) => handleApiKeyChange("instagram_token", e.target.value)}
                              placeholder="Instagram Access Token..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.instagram_token.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.instagram_token.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for Instagram posting automation
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Development Services Section */}
                      <div>
                        <h4 className="text-white font-medium mb-4 flex items-center">
                          <span className="text-lg mr-2">⚡</span>
                          Development & Integration
                        </h4>
                        <div className="space-y-4 ml-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#94a3b8]">GitHub Personal Access Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.github.isActive ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#334155]/50 text-[#64748b]"
                              }`}>
                                {apiKeys.github.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.github.key}
                              onChange={(e) => handleApiKeyChange("github", e.target.value)}
                              placeholder="ghp_..."
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                            />
                            {apiKeys.github.key && (
                              <div className="text-xs text-[#64748b] mt-1">
                                Current: {maskApiKey(apiKeys.github.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#64748b] mt-1">
                              Required for GitHub actions and repository management
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* API Keys Management Tips */}
                      <div className="mt-8 p-4 bg-[#1e293b] rounded-lg border border-[#334155]">
                        <h4 className="text-white font-medium mb-3 flex items-center">
                          <span className="text-lg mr-2">💡</span>
                          API Keys Security Tips
                        </h4>
                        <ul className="text-sm text-[#94a3b8] space-y-2">
                          <li className="flex items-start">
                            <span className="text-[#3B82F6] mr-2 mt-1">•</span>
                            All API keys are encrypted and stored securely
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#3B82F6] mr-2 mt-1">•</span>
                            Keys are only decrypted when needed for workflow execution
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#3B82F6] mr-2 mt-1">•</span>
                            Ensure your API keys have minimal required permissions
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#3B82F6] mr-2 mt-1">•</span>
                            Regularly rotate your API keys for better security
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#3B82F6] mr-2 mt-1">•</span>
                            Monitor your API usage through respective service dashboards
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Save Button for API Keys */}
                  <div className="mt-6 pt-4 border-t border-[#1e293b]">
                    <button 
                      onClick={saveApiKeys}
                      disabled={!apiKeysHasChanges || apiKeysSaving || apiKeysLoading}
                      className={`px-6 py-2 bg-[#3B82F6] hover:bg-[#2563eb] text-white rounded-lg transition-colors ${
                        !apiKeysHasChanges || apiKeysSaving || apiKeysLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {apiKeysSaving ? "Saving..." : "Save API Keys"}
                    </button>
                    {apiKeysHasChanges && !apiKeysLoading && (
                      <p className="text-yellow-400 text-sm mt-2">
                        You have unsaved changes
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Notifications Tab */}
            {currentTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
                  <p className="text-[#64748b] mb-6">Manage how you receive notifications</p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-[#1e293b] rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Email Notifications</h4>
                        <p className="text-[#64748b] text-sm">Receive updates about your account via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={profile.notifications.email} 
                          onChange={(e) => handleNotificationChange("email", e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-[#1e293b] rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Workflow Notifications</h4>
                        <p className="text-[#64748b] text-sm">Get notified when workflows complete or fail</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={profile.notifications.workflow} 
                          onChange={(e) => handleNotificationChange("workflow", e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-[#1e293b] rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Error Alerts</h4>
                        <p className="text-[#64748b] text-sm">Receive alerts when critical errors occur</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={profile.notifications.errors} 
                          onChange={(e) => handleNotificationChange("errors", e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Save Button for Notifications */}
                  <div className="mt-6 pt-4 border-t border-[#1e293b]">
                    <button 
                      onClick={saveChanges}
                      disabled={!hasChanges || saving || loading}
                      className={`px-6 py-2 bg-[#3B82F6] hover:bg-[#2563eb] text-white rounded-lg transition-colors ${
                        !hasChanges || saving || loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {saving ? "Saving..." : "Save Notification Settings"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Security Tab */}
            {currentTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
                  <p className="text-[#64748b] mb-6">Manage your account security</p>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-[#1e293b] rounded-lg">
                      <h4 className="text-white font-medium mb-4">Change Password</h4>
                      <div className="space-y-4">
                        {passwordErrors.general && (
                          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
                            {passwordErrors.general}
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-[#94a3b8] mb-2">Current Password</label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                            className={`w-full bg-[#0f172a] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${
                              passwordErrors.currentPassword ? 'border-red-500' : 'border-[#334155]'
                            }`}
                          />
                          {passwordErrors.currentPassword && (
                            <p className="text-red-400 text-sm mt-1">{passwordErrors.currentPassword}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#94a3b8] mb-2">New Password</label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                            className={`w-full bg-[#0f172a] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${
                              passwordErrors.newPassword ? 'border-red-500' : 'border-[#334155]'
                            }`}
                          />
                          {passwordErrors.newPassword && (
                            <p className="text-red-400 text-sm mt-1">{passwordErrors.newPassword}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#94a3b8] mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                            className={`w-full bg-[#0f172a] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${
                              passwordErrors.confirmPassword ? 'border-red-500' : 'border-[#334155]'
                            }`}
                          />
                          {passwordErrors.confirmPassword && (
                            <p className="text-red-400 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                          )}
                        </div>
                        
                        <div>
                          <button 
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                            className="bg-[#3B82F6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {changingPassword ? "Updating Password..." : "Update Password"}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#1e293b] rounded-lg">
                      <h4 className="text-white font-medium mb-2">Active Sessions</h4>
                      <p className="text-[#64748b] text-sm mb-4">Manage your active login sessions</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-[#0f172a] rounded-lg">
                          <div>
                            <div className="text-white text-sm">Current Session</div>
                            <div className="text-[#64748b] text-xs">Chrome on Windows • IP: 192.168.1.1</div>
                          </div>
                          <span className="text-xs bg-[#3B82F6]/20 text-[#3B82F6] px-2 py-1 rounded">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Billing Tab */}
            {currentTab === "billing" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Billing & Subscription</h3>
                  
                  <div className="p-4 bg-gradient-to-r from-[#3B82F6]/20 to-[#8B5CF6]/20 rounded-lg border border-[#3B82F6]/20 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Current Plan: Free</h4>
                        <p className="text-[#94a3b8] text-sm mt-1">5 workflows • 100 executions/month • Basic features</p>
                      </div>
                      <button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                        Upgrade
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-[#1e293b] rounded-lg text-center">
                        <div className="text-[#3B82F6] font-semibold text-2xl">3</div>
                        <div className="text-[#64748b] text-sm mt-1">Workflows Used</div>
                        <div className="w-full h-2 bg-[#334155] rounded-full mt-2">
                          <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <div className="text-xs text-white mt-1">3 of 5</div>
                      </div>
                      
                      <div className="p-4 bg-[#1e293b] rounded-lg text-center">
                        <div className="text-[#3B82F6] font-semibold text-2xl">47</div>
                        <div className="text-[#64748b] text-sm mt-1">Executions Used</div>
                        <div className="w-full h-2 bg-[#334155] rounded-full mt-2">
                          <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: '47%' }}></div>
                        </div>
                        <div className="text-xs text-white mt-1">47 of 100</div>
                      </div>
                      
                      <div className="p-4 bg-[#1e293b] rounded-lg text-center">
                        <div className="text-[#3B82F6] font-semibold text-2xl">∞</div>
                        <div className="text-[#64748b] text-sm mt-1">Days Remaining</div>
                        <div className="text-xs text-[#94a3b8] mt-3">Free plan never expires</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#1e293b] rounded-lg">
                      <h4 className="text-white font-medium mb-4">Available Plans</h4>
                      
                      <div className="space-y-4">
                        <div className="p-4 border border-[#334155] rounded-lg bg-[#0f172a] relative">
                          <div className="absolute top-0 right-0 bg-[#3B82F6] text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">Current</div>
                          <h5 className="text-white font-medium">Free</h5>
                          <div className="text-[#3B82F6] font-bold text-2xl mt-2">$0</div>
                          <ul className="text-sm text-[#94a3b8] space-y-2 mt-4">
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> 5 workflows
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> 100 executions/month
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> Basic features
                            </li>
                          </ul>
                        </div>
                        
                        <div className="p-4 border border-[#3B82F6] rounded-lg bg-[#0f172a]">
                          <h5 className="text-white font-medium">Pro</h5>
                          <div className="text-[#3B82F6] font-bold text-2xl mt-2">$19<span className="text-sm font-normal">/month</span></div>
                          <ul className="text-sm text-[#94a3b8] space-y-2 mt-4">
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> Unlimited workflows
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> 1,000 executions/month
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> Advanced features
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> Priority support
                            </li>
                          </ul>
                          <button className="w-full bg-[#3B82F6] hover:bg-[#2563eb] text-white py-2 rounded-lg mt-4 transition-colors">
                            Upgrade to Pro
                          </button>
                        </div>
                        
                        <div className="p-4 border border-[#334155] rounded-lg bg-[#0f172a]">
                          <h5 className="text-white font-medium">Enterprise</h5>
                          <div className="text-[#3B82F6] font-bold text-2xl mt-2">Custom</div>
                          <ul className="text-sm text-[#94a3b8] space-y-2 mt-4">
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> Unlimited everything
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> Custom integrations
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> Dedicated support
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#3B82F6] mr-2">✓</span> SLA guarantees
                            </li>
                          </ul>
                          <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg mt-4 transition-colors">
                            Contact Sales
                          </button>
                        </div>

                        {isMobile && (
                          <button
                            onClick={handleLogout}
                            className="w-full bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-200 py-2 rounded-lg mt-1 transition-colors"
                          >
                            Logout
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


      {/* Footer */}
      <div className={`border-t border-[#1e293b] ${isMobile ? 'p-2.5' : 'p-6'} flex ${isMobile ? 'justify-stretch' : 'justify-end'} space-x-3`}>
        <button
          onClick={onClose}
          className={`px-4 py-2 bg-[#334155] hover:bg-[#334155] text-white rounded-lg transition-colors ${isMobile ? 'w-full text-[13px]' : ''}`}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}