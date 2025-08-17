"use client"
import { useState, useEffect, useRef } from "react"
import { UserCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { useAuthStore } from "../stores/authStore"
import { useFlowStore } from "../stores/flowStore"

export default function ProfileBar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user, logout, loading } = useAuthStore()
  const { savedWorkflows, loadWorkflows } = useFlowStore()
  const [stats, setStats] = useState({
    workflows: 0,
    executions: 0,
    scheduled: 0
  })

  // Load workflows when component mounts
  useEffect(() => {
    if (user) {
      loadWorkflows()
    }
  }, [user, loadWorkflows])

  // Update stats when savedWorkflows changes
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      workflows: savedWorkflows?.length || 0
    }))
  }, [savedWorkflows])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-end p-4 bg-[#0a0a0a] border-b border-white/10">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#333333] rounded-full"></div>
          <div className="w-24 h-4 bg-[#333333] rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Bar */}
      <div className="bg-[#0a0a0a] border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <h1 className="text-white font-semibold text-lg gradient-text">AutoFlow</h1>
          </div>

          {/* Profile Section */}
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-white text-sm font-medium">{user?.name || "AutoFlow User"}</div>
                <div className="text-gray-400 text-xs">My Workspace</div>
              </div>
            </div>
            <ChevronDownIcon 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isProfileOpen ? "rotate-180" : ""
              }`} 
            />
          </button>
        </div>
      </div>

      {/* Profile Dropdown */}
      {isProfileOpen && (
        <div className="absolute top-full right-6 mt-2 w-80 glass border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <style jsx>{`
            .glass {
              background: rgba(15, 15, 15, 0.95);
              backdrop-filter: blur(10px);
            }
          `}</style>
          
          {/* Profile Header */}
          <div className="p-6 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35]">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{user?.name || "AutoFlow User"}</h3>
                <p className="text-white/80 text-sm">{user?.email || "user@autoflow.com"}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                    Free Plan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-4 space-y-4">
            {/* Workspace Info */}
            <div className="glass rounded-lg p-4">
              <h4 className="text-white font-medium text-sm mb-2">Current Workspace</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">My Workspace</span>
                <button className="text-[#00D4FF] text-xs hover:text-white transition-colors">
                  Switch
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-[#00D4FF] font-semibold text-lg">{stats.workflows}</div>
                <div className="text-gray-400 text-xs">Workflows</div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-[#00D4FF] font-semibold text-lg">{stats.executions}</div>
                <div className="text-gray-400 text-xs">Executions</div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-[#FF6B35] font-semibold text-lg">{stats.scheduled}</div>
                <div className="text-gray-400 text-xs">Scheduled</div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <span className="text-lg">⚙️</span>
                <span className="text-white text-sm">Settings</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <span className="text-lg">🔑</span>
                <span className="text-white text-sm">API Keys</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <span className="text-lg">📊</span>
                <span className="text-white text-sm">Usage & Billing</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <span className="text-lg">📚</span>
                <span className="text-white text-sm">Documentation</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <span className="text-lg">💬</span>
                <span className="text-white text-sm">Support</span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-2"></div>

            {/* Sign Out */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#FF6B35]/10 transition-colors text-left group"
            >
              <span className="text-lg">🚪</span>
              <span className="text-[#FF6B35] text-sm group-hover:text-white transition-colors">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  )
}
