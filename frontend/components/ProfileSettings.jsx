"use client"
import { useState } from "react"
import { XMarkIcon, UserCircleIcon, KeyIcon, CreditCardIcon } from "@heroicons/react/24/outline"

export default function ProfileSettings({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("profile")
  const [profile, setProfile] = useState({
    name: "AutoFlow User",
    email: "user@autoflow.com",
    workspace: "My Workspace",
    timezone: "UTC-5 (Eastern Time)",
    notifications: {
      email: true,
      workflow: true,
      errors: true
    }
  })

  if (!isOpen) return null

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "api", label: "API Keys", icon: "🔑" },
    { id: "billing", label: "Billing", icon: "💳" },
    { id: "notifications", label: "Notifications", icon: "🔔" }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-[#2a2a2a] border border-[#666666] rounded-xl w-full max-w-4xl h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#666666]">
          <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[#999999]" />
          </button>
        </div>

        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r border-[#666666] p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    activeTab === tab.id
                      ? "bg-[#ff6d6d] text-white"
                      : "text-[#cccccc] hover:bg-[#3a3a3a]"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#cccccc] mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#cccccc] mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#cccccc] mb-2">Workspace Name</label>
                      <input
                        type="text"
                        value={profile.workspace}
                        onChange={(e) => setProfile({...profile, workspace: e.target.value})}
                        className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#cccccc] mb-2">Timezone</label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => setProfile({...profile, timezone: e.target.value})}
                        className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d]"
                      >
                        <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                        <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                        <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                        <option value="UTC+1 (CET)">UTC+1 (CET)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">API Keys</h3>
                  <p className="text-[#999999] mb-6">Manage your API keys for external integrations</p>
                  
                  <div className="space-y-4">
                    <div className="bg-[#3a3a3a] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">OpenAI API Key</span>
                        <span className="text-xs bg-[#2ecc71] text-white px-2 py-1 rounded">Active</span>
                      </div>
                      <div className="text-[#999999] font-mono text-sm">sk-...****...****</div>
                    </div>
                    
                    <div className="bg-[#3a3a3a] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Google API Key</span>
                        <span className="text-xs bg-[#e74c3c] text-white px-2 py-1 rounded">Inactive</span>
                      </div>
                      <div className="text-[#999999] font-mono text-sm">Not configured</div>
                    </div>
                  </div>
                  
                  <button className="mt-4 bg-[#ff6d6d] hover:bg-[#ff5252] text-white px-4 py-2 rounded-lg transition-colors">
                    Add New API Key
                  </button>
                </div>
              </div>
            )}

            {/* Add other tab contents as needed */}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#666666] p-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#666666] hover:bg-[#777777] text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-[#ff6d6d] hover:bg-[#ff5252] text-white rounded-lg transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
