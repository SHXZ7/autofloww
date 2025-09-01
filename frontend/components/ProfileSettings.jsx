"use client"
import { useState, useEffect } from "react"
import { XMarkIcon, UserCircleIcon, KeyIcon, CreditCardIcon, ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline"
import { useAuthStore } from "../stores/authStore"

export default function ProfileSettings({ isOpen, onClose, activeTab = "profile" }) {
  const [currentTab, setCurrentTab] = useState(activeTab)
  const { user, updateUserProfile, changePassword, updateApiKeys, getApiKeys, loading } = useAuthStore()
  
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
    openrouter: { key: "", isActive: false },
    google: { key: "", isActive: false },
    discord: { key: "", isActive: false },
    github: { key: "", isActive: false },
    twilio_sid: { key: "", isActive: false },
    twilio_token: { key: "", isActive: false },
    twilio_phone: { key: "", isActive: false },
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

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "api", label: "API Keys", icon: "🔑" },
    { id: "billing", label: "Billing", icon: "💳" },
    { id: "notifications", label: "Notifications", icon: "🔔" }
  ]

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl w-full max-w-4xl h-[80vh] overflow-hidden">
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fade-in {
            animation: fadeIn 0.3s ease forwards;
          }
        `}</style>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333333]">
          <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333333] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[#999999]" />
          </button>
        </div>

        <div className="flex h-[calc(80vh-70px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-[#333333] p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    currentTab === tab.id
                      ? "bg-[#00D4FF] text-white"
                      : "text-[#cccccc] hover:bg-[#2a2a2a]"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto animate-fade-in">
            {/* Profile Tab */}
            {currentTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#cccccc] mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={`w-full bg-[#2a2a2a] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all ${
                          errors.name ? 'border-red-500' : 'border-[#444444]'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#cccccc] mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full bg-[#2a2a2a] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all ${
                          errors.email ? 'border-red-500' : 'border-[#444444]'
                        }`}
                        placeholder="Enter your email address"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#cccccc] mb-2">
                        Workspace Name *
                      </label>
                      <input
                        type="text"
                        value={profile.workspace}
                        onChange={(e) => handleInputChange("workspace", e.target.value)}
                        className={`w-full bg-[#2a2a2a] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all ${
                          errors.workspace ? 'border-red-500' : 'border-[#444444]'
                        }`}
                        placeholder="Enter workspace name"
                      />
                      {errors.workspace && (
                        <p className="text-red-400 text-sm mt-1">{errors.workspace}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#cccccc] mb-2">
                        Timezone
                      </label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => handleInputChange("timezone", e.target.value)}
                        className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
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
                  <div className="mt-6 pt-4 border-t border-[#333333]">
                    <button 
                      onClick={saveChanges}
                      disabled={!hasChanges || saving || loading}
                      className={`px-6 py-2 bg-[#00D4FF] hover:bg-[#00C4EF] text-white rounded-lg transition-colors ${
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">API Keys</h3>
                  <p className="text-[#999999] mb-6">Manage your API keys for external integrations</p>
                  
                  {apiKeysLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]"></div>
                      <span className="ml-2 text-[#999999]">Loading API keys...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* AI Services Section */}
                      <div>
                        <h4 className="text-white font-medium mb-4 flex items-center">
                          <span className="text-lg mr-2">🤖</span>
                          AI & Language Models
                        </h4>
                        <div className="space-y-4 ml-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">OpenAI API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.openai.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.openai.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.openai.key}
                              onChange={(e) => handleApiKeyChange("openai", e.target.value)}
                              placeholder="sk-..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.openai.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.openai.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for OpenAI GPT models (GPT-4, GPT-3.5, DALL-E)
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">OpenRouter API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.openrouter.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.openrouter.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.openrouter.key}
                              onChange={(e) => handleApiKeyChange("openrouter", e.target.value)}
                              placeholder="sk-or-v1-..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.openrouter.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.openrouter.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for accessing multiple AI models (Llama, Claude, Gemini, Mistral)
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Google API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.google.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.google.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.google.key}
                              onChange={(e) => handleApiKeyChange("google", e.target.value)}
                              placeholder="AIza..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.google.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.google.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for Google Sheets integration, Google Drive, and Gemini AI models
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Stability AI API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.stability.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.stability.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.stability.key}
                              onChange={(e) => handleApiKeyChange("stability", e.target.value)}
                              placeholder="sk-..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.stability.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.stability.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for Stable Diffusion image generation
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Communication Services Section */}
                      <div>
                        <h4 className="text-white font-medium mb-4 flex items-center">
                          <span className="text-lg mr-2">💬</span>
                          Communication & Messaging
                        </h4>
                        <div className="space-y-4 ml-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Discord Webhook URL</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.discord.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.discord.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.discord.key}
                              onChange={(e) => handleApiKeyChange("discord", e.target.value)}
                              placeholder="https://discord.com/api/webhooks/..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.discord.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.discord.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for Discord messaging integration
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Twilio Account SID</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twilio_sid.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.twilio_sid.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twilio_sid.key}
                              onChange={(e) => handleApiKeyChange("twilio_sid", e.target.value)}
                              placeholder="AC..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.twilio_sid.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.twilio_sid.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for SMS and WhatsApp messaging via Twilio
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Twilio Auth Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twilio_token.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.twilio_token.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twilio_token.key}
                              onChange={(e) => handleApiKeyChange("twilio_token", e.target.value)}
                              placeholder="Auth Token..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.twilio_token.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.twilio_token.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for SMS and WhatsApp messaging via Twilio
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Twilio Phone Number</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twilio_phone.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.twilio_phone.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twilio_phone.key}
                              onChange={(e) => handleApiKeyChange("twilio_phone", e.target.value)}
                              placeholder="+1234567890"
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.twilio_phone.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.twilio_phone.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Your Twilio phone number for sending SMS/WhatsApp
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Social Media Services Section */}
                      <div>
                        <h4 className="text-white font-medium mb-4 flex items-center">
                          <span className="text-lg mr-2">📱</span>
                          Social Media Platforms
                        </h4>
                        <div className="space-y-4 ml-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Twitter API Key</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twitter_api_key.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.twitter_api_key.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twitter_api_key.key}
                              onChange={(e) => handleApiKeyChange("twitter_api_key", e.target.value)}
                              placeholder="API Key..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.twitter_api_key.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.twitter_api_key.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for Twitter/X posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Twitter API Secret</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twitter_api_secret.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.twitter_api_secret.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twitter_api_secret.key}
                              onChange={(e) => handleApiKeyChange("twitter_api_secret", e.target.value)}
                              placeholder="API Secret..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.twitter_api_secret.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.twitter_api_secret.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for Twitter/X posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Twitter Access Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twitter_access_token.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.twitter_access_token.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twitter_access_token.key}
                              onChange={(e) => handleApiKeyChange("twitter_access_token", e.target.value)}
                              placeholder="Access Token..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.twitter_access_token.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.twitter_access_token.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for Twitter/X posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Twitter Access Token Secret</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.twitter_access_secret.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.twitter_access_secret.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.twitter_access_secret.key}
                              onChange={(e) => handleApiKeyChange("twitter_access_secret", e.target.value)}
                              placeholder="Access Token Secret..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.twitter_access_secret.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.twitter_access_secret.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for Twitter/X posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">LinkedIn Access Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.linkedin_token.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.linkedin_token.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.linkedin_token.key}
                              onChange={(e) => handleApiKeyChange("linkedin_token", e.target.value)}
                              placeholder="LinkedIn Access Token..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.linkedin_token.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.linkedin_token.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for LinkedIn posting automation
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-[#cccccc]">Instagram Access Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.instagram_token.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.instagram_token.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.instagram_token.key}
                              onChange={(e) => handleApiKeyChange("instagram_token", e.target.value)}
                              placeholder="Instagram Access Token..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.instagram_token.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.instagram_token.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
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
                              <label className="text-sm font-medium text-[#cccccc]">GitHub Personal Access Token</label>
                              <span className={`text-xs px-2 py-1 rounded ${
                                apiKeys.github.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                              }`}>
                                {apiKeys.github.isActive ? "Active" : "Not Set"}
                              </span>
                            </div>
                            <input
                              type="password"
                              value={apiKeys.github.key}
                              onChange={(e) => handleApiKeyChange("github", e.target.value)}
                              placeholder="ghp_..."
                              className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                            />
                            {apiKeys.github.key && (
                              <div className="text-xs text-[#999999] mt-1">
                                Current: {maskApiKey(apiKeys.github.key)}
                              </div>
                            )}
                            <p className="text-xs text-[#999999] mt-1">
                              Required for GitHub actions and repository management
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* API Keys Management Tips */}
                      <div className="mt-8 p-4 bg-[#2a2a2a] rounded-lg border border-[#444444]">
                        <h4 className="text-white font-medium mb-3 flex items-center">
                          <span className="text-lg mr-2">💡</span>
                          API Keys Security Tips
                        </h4>
                        <ul className="text-sm text-[#cccccc] space-y-2">
                          <li className="flex items-start">
                            <span className="text-[#00D4FF] mr-2 mt-1">•</span>
                            All API keys are encrypted and stored securely
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#00D4FF] mr-2 mt-1">•</span>
                            Keys are only decrypted when needed for workflow execution
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#00D4FF] mr-2 mt-1">•</span>
                            Ensure your API keys have minimal required permissions
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#00D4FF] mr-2 mt-1">•</span>
                            Regularly rotate your API keys for better security
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#00D4FF] mr-2 mt-1">•</span>
                            Monitor your API usage through respective service dashboards
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Save Button for API Keys */}
                  <div className="mt-6 pt-4 border-t border-[#333333]">
                    <button 
                      onClick={saveApiKeys}
                      disabled={!apiKeysHasChanges || apiKeysSaving || apiKeysLoading}
                      className={`px-6 py-2 bg-[#00D4FF] hover:bg-[#00C4EF] text-white rounded-lg transition-colors ${
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
                  <p className="text-[#999999] mb-6">Manage how you receive notifications</p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Email Notifications</h4>
                        <p className="text-[#999999] text-sm">Receive updates about your account via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={profile.notifications.email} 
                          onChange={(e) => handleNotificationChange("email", e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-[#444444] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D4FF]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Workflow Notifications</h4>
                        <p className="text-[#999999] text-sm">Get notified when workflows complete or fail</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={profile.notifications.workflow} 
                          onChange={(e) => handleNotificationChange("workflow", e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-[#444444] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D4FF]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Error Alerts</h4>
                        <p className="text-[#999999] text-sm">Receive alerts when critical errors occur</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={profile.notifications.errors} 
                          onChange={(e) => handleNotificationChange("errors", e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-[#444444] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D4FF]"></div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Save Button for Notifications */}
                  <div className="mt-6 pt-4 border-t border-[#333333]">
                    <button 
                      onClick={saveChanges}
                      disabled={!hasChanges || saving || loading}
                      className={`px-6 py-2 bg-[#00D4FF] hover:bg-[#00C4EF] text-white rounded-lg transition-colors ${
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
                  <p className="text-[#999999] mb-6">Manage your account security</p>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-[#2a2a2a] rounded-lg">
                      <h4 className="text-white font-medium mb-4">Change Password</h4>
                      <div className="space-y-4">
                        {passwordErrors.general && (
                          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
                            {passwordErrors.general}
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-[#cccccc] mb-2">Current Password</label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                            className={`w-full bg-[#1a1a1a] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent ${
                              passwordErrors.currentPassword ? 'border-red-500' : 'border-[#444444]'
                            }`}
                          />
                          {passwordErrors.currentPassword && (
                            <p className="text-red-400 text-sm mt-1">{passwordErrors.currentPassword}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#cccccc] mb-2">New Password</label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                            className={`w-full bg-[#1a1a1a] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent ${
                              passwordErrors.newPassword ? 'border-red-500' : 'border-[#444444]'
                            }`}
                          />
                          {passwordErrors.newPassword && (
                            <p className="text-red-400 text-sm mt-1">{passwordErrors.newPassword}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#cccccc] mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                            className={`w-full bg-[#1a1a1a] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent ${
                              passwordErrors.confirmPassword ? 'border-red-500' : 'border-[#444444]'
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
                            className="bg-[#00D4FF] hover:bg-[#00C4EF] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {changingPassword ? "Updating Password..." : "Update Password"}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#2a2a2a] rounded-lg">
                      <h4 className="text-white font-medium mb-2">Active Sessions</h4>
                      <p className="text-[#999999] text-sm mb-4">Manage your active login sessions</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded-lg">
                          <div>
                            <div className="text-white text-sm">Current Session</div>
                            <div className="text-[#999999] text-xs">Chrome on Windows • IP: 192.168.1.1</div>
                          </div>
                          <span className="text-xs bg-[#00D4FF]/20 text-[#00D4FF] px-2 py-1 rounded">Active</span>
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
                  
                  <div className="p-4 bg-gradient-to-r from-[#00D4FF]/20 to-[#FF6B35]/20 rounded-lg border border-[#00D4FF]/20 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Current Plan: Free</h4>
                        <p className="text-[#cccccc] text-sm mt-1">5 workflows • 100 executions/month • Basic features</p>
                      </div>
                      <button className="bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                        Upgrade
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-[#2a2a2a] rounded-lg text-center">
                        <div className="text-[#00D4FF] font-semibold text-2xl">3</div>
                        <div className="text-[#999999] text-sm mt-1">Workflows Used</div>
                        <div className="w-full h-2 bg-[#444444] rounded-full mt-2">
                          <div className="h-full bg-[#00D4FF] rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <div className="text-xs text-white mt-1">3 of 5</div>
                      </div>
                      
                      <div className="p-4 bg-[#2a2a2a] rounded-lg text-center">
                        <div className="text-[#00D4FF] font-semibold text-2xl">47</div>
                        <div className="text-[#999999] text-sm mt-1">Executions Used</div>
                        <div className="w-full h-2 bg-[#444444] rounded-full mt-2">
                          <div className="h-full bg-[#00D4FF] rounded-full" style={{ width: '47%' }}></div>
                        </div>
                        <div className="text-xs text-white mt-1">47 of 100</div>
                      </div>
                      
                      <div className="p-4 bg-[#2a2a2a] rounded-lg text-center">
                        <div className="text-[#00D4FF] font-semibold text-2xl">∞</div>
                        <div className="text-[#999999] text-sm mt-1">Days Remaining</div>
                        <div className="text-xs text-[#cccccc] mt-3">Free plan never expires</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#2a2a2a] rounded-lg">
                      <h4 className="text-white font-medium mb-4">Available Plans</h4>
                      
                      <div className="space-y-4">
                        <div className="p-4 border border-[#444444] rounded-lg bg-[#1a1a1a] relative">
                          <div className="absolute top-0 right-0 bg-[#00D4FF] text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">Current</div>
                          <h5 className="text-white font-medium">Free</h5>
                          <div className="text-[#00D4FF] font-bold text-2xl mt-2">$0</div>
                          <ul className="text-sm text-[#cccccc] space-y-2 mt-4">
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> 5 workflows
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> 100 executions/month
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> Basic features
                            </li>
                          </ul>
                        </div>
                        
                        <div className="p-4 border border-[#00D4FF] rounded-lg bg-[#1a1a1a]">
                          <h5 className="text-white font-medium">Pro</h5>
                          <div className="text-[#00D4FF] font-bold text-2xl mt-2">$19<span className="text-sm font-normal">/month</span></div>
                          <ul className="text-sm text-[#cccccc] space-y-2 mt-4">
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> Unlimited workflows
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> 1,000 executions/month
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> Advanced features
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> Priority support
                            </li>
                          </ul>
                          <button className="w-full bg-[#00D4FF] hover:bg-[#00C4EF] text-white py-2 rounded-lg mt-4 transition-colors">
                            Upgrade to Pro
                          </button>
                        </div>
                        
                        <div className="p-4 border border-[#444444] rounded-lg bg-[#1a1a1a]">
                          <h5 className="text-white font-medium">Enterprise</h5>
                          <div className="text-[#00D4FF] font-bold text-2xl mt-2">Custom</div>
                          <ul className="text-sm text-[#cccccc] space-y-2 mt-4">
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> Unlimited everything
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> Custom integrations
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> Dedicated support
                            </li>
                            <li className="flex items-center">
                              <span className="text-[#00D4FF] mr-2">✓</span> SLA guarantees
                            </li>
                          </ul>
                          <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg mt-4 transition-colors">
                            Contact Sales
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


      {/* Footer */}
      <div className="border-t border-[#333333] p-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-[#444444] hover:bg-[#555555] text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}