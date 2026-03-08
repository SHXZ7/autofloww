"use client"
import { useState, useEffect, useRef } from "react"
import { UserCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { useAuthStore } from "../stores/authStore"
import { useFlowStore } from "../stores/flowStore"
import ProfileSettings from "./ProfileSettings"

export default function ProfileBar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile")
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false)
  const dropdownRef = useRef(null)
  const workspaceSelectorRef = useRef(null)
  const { user, logout, loading } = useAuthStore()
  const { savedWorkflows, loadWorkflows, newWorkflow } = useFlowStore()
  const [stats, setStats] = useState({
    workflows: 0,
    executions: 0,
    scheduled: 0
  })
  
  // Available workspaces (in a real app, these would come from an API)
  const [workspaces, setWorkspaces] = useState([
    { id: "1", name: "My Workspace", active: true },
    { id: "2", name: "Team Alpha", active: false },
    { id: "3", name: "Marketing", active: false }
  ])
  
  const [currentWorkspace, setCurrentWorkspace] = useState(workspaces.find(w => w.active))

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
      workflows: savedWorkflows?.length || 0,
      // In a real app, you'd fetch these from an API
      executions: user?.profile?.execution_count || 0,
      scheduled: savedWorkflows?.filter(w => w.nodes?.some(n => n.type === 'schedule')).length || 0
    }))
  }, [savedWorkflows, user])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
      
      if (workspaceSelectorRef.current && !workspaceSelectorRef.current.contains(event.target)) {
        setShowWorkspaceSelector(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
  }
  
  const handleSwitchWorkspace = (workspace) => {
    // Update active workspace
    const updatedWorkspaces = workspaces.map(w => ({
      ...w,
      active: w.id === workspace.id
    }))
    
    setWorkspaces(updatedWorkspaces)
    setCurrentWorkspace(workspace)
    setShowWorkspaceSelector(false)
    
    // In a real app, you'd switch the context here
    // For now, we'll just create a new workflow to simulate a workspace change
    newWorkflow()
    
    // Show a notification
    const notification = document.getElementById('workspace-notification')
    if (notification) {
      notification.style.opacity = "1"
      notification.style.transform = "translateY(0)"
      setTimeout(() => {
        notification.style.opacity = "0"
        notification.style.transform = "translateY(-20px)"
      }, 3000)
    }
  }
  
  const openSettings = (tab = "profile") => {
    setActiveSettingsTab(tab)
    setIsSettingsOpen(true)
    setIsProfileOpen(false)
  }

  if (loading || !user) {
    return (
      <div style={{display:'flex', alignItems:'center', height:'100%', padding:'0 10px'}}>
        <div className="animate-pulse" style={{display:'flex', alignItems:'center', gap:'8px'}}>
          <div style={{width:'26px', height:'26px', background:'rgba(255,255,255,0.08)', borderRadius:'50%'}}></div>
          <div style={{width:'68px', height:'11px', background:'rgba(255,255,255,0.08)', borderRadius:'6px'}}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact profile button — sits inline inside the unified nav */}
      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all duration-150"
        style={{border:'none', background:'transparent', cursor:'pointer'}}
      >
        <div style={{
          width:'26px', height:'26px', borderRadius:'50%', flexShrink:0,
          background:'linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{color:'white', fontWeight:700, fontSize:'11px'}}>
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden md:flex flex-col items-start" style={{minWidth:0}}>
          <span style={{color:'#ddd', fontSize:'12.5px', fontWeight:500, lineHeight:'1.25', whiteSpace:'nowrap'}}>
            {user?.name || "User"}
          </span>
          <span style={{color:'#555', fontSize:'10.5px', lineHeight:'1.25', whiteSpace:'nowrap'}}>
            {currentWorkspace?.name || "Workspace"}
          </span>
        </div>
        <ChevronDownIcon
          style={{
            width:'13px', height:'13px', color:'#555', flexShrink:0,
            transition:'transform 0.18s ease',
            transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Profile Dropdown */}
      {isProfileOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 rounded-xl z-50 overflow-hidden" style={{background:'#0e0e0e', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 24px 56px rgba(0,0,0,0.75)'}}>
          <style jsx>{`
            .glass {
              background: rgba(15, 15, 15, 0.95);
              backdrop-filter: blur(10px);
            }
            
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            .animate-fade-in {
              animation: fadeIn 0.2s ease forwards;
            }
            
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            .notification {
              position: fixed;
              bottom: 20px;
              right: 20px;
              opacity: 0;
              transform: translateY(20px);
              transition: all 0.3s ease;
              z-index: 100;
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


          {/* Profile Content */}
          <div className="p-4 space-y-4 animate-fade-in">
            {/* Workspace Info */}
            <div className="glass rounded-lg p-4 relative">
              <h4 className="text-white font-medium text-sm mb-2">Current Workspace</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{currentWorkspace?.name || "My Workspace"}</span>
                <button 
                  className="text-[#00D4FF] text-xs hover:text-white transition-colors"
                  onClick={() => setShowWorkspaceSelector(!showWorkspaceSelector)}
                >
                  Switch
                </button>
              </div>
              
              {/* Workspace Selector Dropdown */}
              {showWorkspaceSelector && (
                <div 
                  ref={workspaceSelectorRef}
                  className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg p-2 z-10 animate-fade-in"
                >
                  {workspaces.map(workspace => (
                    <div 
                      key={workspace.id}
                      onClick={() => handleSwitchWorkspace(workspace)}
                      className={`p-2 rounded-lg flex items-center space-x-2 cursor-pointer ${
                        workspace.active ? 'bg-[#00D4FF]/20 text-[#00D4FF]' : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${workspace.active ? 'bg-[#00D4FF]' : 'bg-gray-600'}`}></div>
                      <span>{workspace.name}</span>
                    </div>
                  ))}
                  
                  <div className="border-t border-white/10 mt-2 pt-2">
                    <button 
                      className="w-full text-left text-xs text-[#00D4FF] hover:text-white transition-colors p-2"
                      onClick={() => {
                        alert("Create workspace feature will be available in the next update!");
                        setShowWorkspaceSelector(false);
                      }}
                    >
                      + Create new workspace
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <button 
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                onClick={() => openSettings("profile")}
              >
                <span className="text-lg">⚙️</span>
                <span className="text-white text-sm">Settings</span>
              </button>
              <button 
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                onClick={() => openSettings("api")}
              >
                <span className="text-lg">🔑</span>
                <span className="text-white text-sm">API Keys</span>
              </button>
              <button 
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                onClick={() => {
                  window.open("https://github.com/yourusername/AutoFlow/wiki", "_blank");
                  setIsProfileOpen(false);
                }}
              >
                <span className="text-lg">📚</span>
                <span className="text-white text-sm">Documentation</span>
              </button>
              <button 
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                onClick={() => {
                  window.open("https://github.com/yourusername/AutoFlow/issues", "_blank");
                  setIsProfileOpen(false);
                }}
              >
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

      {/* Settings Modal */}
      <ProfileSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        activeTab={activeSettingsTab}
      />

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
