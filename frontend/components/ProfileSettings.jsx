"use client"
import { useState, useEffect } from "react"
import { XMarkIcon, UserCircleIcon, KeyIcon, CreditCardIcon } from "@heroicons/react/24/outline"
import { useAuthStore } from "../stores/authStore"

export default function ProfileSettings({ isOpen, onClose, activeTab = "profile" }) {
  const [currentTab, setCurrentTab] = useState(activeTab)
  const { user, updateUserProfile, loading } = useAuthStore()
  
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
    google: { key: "", isActive: false },
    discord: { key: "", isActive: false },
    github: { key: "", isActive: false }
  })
  
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
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
    }
  }, [isOpen])

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
    setHasChanges(true)
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
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-[#cccccc]">OpenAI API Key</label>
                        <span className={`text-xs px-2 py-1 rounded ${
                          apiKeys.openai.isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-[#666666]/20 text-[#999999]"
                        }`}>
                          {apiKeys.openai.isActive ? "Active" : "Not Set"}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={apiKeys.openai.key}
                          onChange={(e) => handleApiKeyChange("openai", e.target.value)}
                          placeholder="sk-..."
                          className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                        />
                      </div>
                      <p className="text-xs text-[#999999] mt-1">
                        Required for AI nodes using OpenAI models (GPT-4o, etc)
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
                      <p className="text-xs text-[#999999] mt-1">
                        Required for Google Sheets integration and Gemini AI models
                      </p>
                    </div>
                    
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
                      <p className="text-xs text-[#999999] mt-1">
                        Required for Discord messaging integration
                      </p>
                    </div>
                    
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
                      <p className="text-xs text-[#999999] mt-1">
                        Required for GitHub actions and repository management
                      </p>
                    </div>
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
                        <div>
                          <label className="block text-sm font-medium text-[#cccccc] mb-2">Current Password</label>
                          <input
                            type="password"
                            className="w-full bg-[#1a1a1a] border border-[#444444] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#cccccc] mb-2">New Password</label>
                          <input
                            type="password"
                            className="w-full bg-[#1a1a1a] border border-[#444444] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#cccccc] mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            className="w-full bg-[#1a1a1a] border border-[#444444] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <button className="bg-[#00D4FF] hover:bg-[#00C4EF] text-white px-4 py-2 rounded-lg transition-colors">
                            Update Password
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#2a2a2a] rounded-lg">
                      <h4 className="text-white font-medium mb-2">Two-Factor Authentication</h4>
                      <p className="text-[#999999] text-sm mb-4">Add an extra layer of security to your account</p>
                      <button className="bg-[#00D4FF] hover:bg-[#00C4EF] text-white px-4 py-2 rounded-lg transition-colors">
                        Enable 2FA
                      </button>
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

        {/* Footer - Remove general save button since we have specific ones */}
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
  )
}
