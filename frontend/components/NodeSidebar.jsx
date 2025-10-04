"use client"
import { useFlowStore } from "../stores/flowStore"
import { useAuthStore } from "../stores/authStore"
import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon, PlayIcon, ListBulletIcon, StopIcon } from "@heroicons/react/24/outline"


export default function NodeSidebar() {
  const { addNode, nodes, edges, model, setModel, availableModels } = useFlowStore()
  const { isAuthenticated } = useAuthStore()
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSections, setExpandedSections] = useState({
    ai: false,
    integrations: false,
    communication: false,
    automation: false,
  })
  const API_BASE_URL = "https://autoflow-backend-pl6h.onrender.com/"

  const runWorkflow = async () => {
    try {
      console.log("Starting workflow with nodes:", nodes)
      console.log("Starting workflow with edges:", edges)

      if (nodes.length === 0) {
        alert("No nodes to run. Please add some nodes first.")
        return
      }

      // Get auth token
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Authentication required. Please login again.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/run`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ nodes, edges }),
      })

      console.log("Response status:", response.status)
      const result = await response.json()
      console.log("Execution result:", result)

      if (response.ok) {
        alert("Workflow Run Successfully!\nResults: " + JSON.stringify(result.message, null, 2))
      } else {
        if (response.status === 401 || response.status === 403) {
          alert("Authentication expired. Please login again.")
        } else {
          alert("Workflow Failed: " + JSON.stringify(result, null, 2))
        }
      }
    } catch (error) {
      console.error("Workflow execution error:", error)
      alert("Failed to run workflow: " + error.message)
    }
  }

  const stopScheduledWorkflow = async (workflowId) => {
    try {
      console.log(`Attempting to stop workflow: ${workflowId}`)
      const response = await fetch(`${API_BASE_URL}/schedule/stop/${workflowId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const result = await response.json()
      console.log("Stop response:", result)
      alert(result.message || result.error)
    } catch (error) {
      console.error("Stop workflow error:", error)
      alert("Failed to stop scheduled workflow")
    }
  }

  const listScheduledWorkflows = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/list`)
      const result = await response.json()
      console.log("Scheduled workflows:", result)
      alert(`Found ${result.count} scheduled workflows. Check console for details.`)
    } catch (error) {
      alert("Failed to list scheduled workflows")
    }
  }

  const handleAddNode = async (nodeConfig) => {
    if (isAdding) return
    setIsAdding(true)
    
    // If it's a config object with predefined position, calculate better position
    if (typeof nodeConfig === "object" && nodeConfig.position) {
      const currentNodes = nodes
      const gridSize = 200
      const maxCols = 4
      const nodeCount = currentNodes.length
      const col = nodeCount % maxCols
      const row = Math.floor(nodeCount / maxCols)
      
      const baseX = 100 + (col * gridSize)
      const baseY = 100 + (row * gridSize)
      const randomOffsetX = Math.random() * 50 - 25
      const randomOffsetY = Math.random() * 50 - 25
      
      nodeConfig.position = {
        x: baseX + randomOffsetX,
        y: baseY + randomOffsetY
      }
    }
    
    addNode(nodeConfig)
    setTimeout(() => setIsAdding(false), 500)
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const nodeCategories = {
    ai: {
      title: "AI Nodes",
      icon: "🤖",
      nodes: [
        { type: "gpt", label: "GPT", icon: "➕", color: "bg-[#00D4FF]" },
        { type: "llama", label: "Llama", icon: "🦙", color: "bg-[#00D4FF]" },
        { type: "gemini", label: "Gemini", icon: "💎", color: "bg-[#00D4FF]" },
        { type: "claude", label: "Claude", icon: "🤖", color: "bg-[#00D4FF]" },
        { type: "mistral", label: "Mistral", icon: "🌪️", color: "bg-[#00D4FF]" },
      ],
    },
    integrations: {
      title: "Integrations",
      icon: "🔗",
      nodes: [
        { type: "webhook", label: "Webhook", icon: "🪝", color: "bg-[#FF6B35]" },
        {
          type: "google_sheets",
          label: "Google Sheets",
          icon: "📊",
          color: "bg-[#FF6B35]",
          config: {
            id: Date.now().toString(),
            type: "google_sheets",
            position: { x: 0, y: 0 }, // Will be recalculated in handleAddNode
            data: {
              label: "Google Sheets Node",
              spreadsheet_id: "",
              range: "Sheet1!A1",
              values: [],
            },
          },
        },
        {
          type: "file_upload",
          label: "File Upload",
          icon: "📁",
          color: "bg-[#FF6B35]",
          config: {
            id: Date.now().toString(),
            type: "file_upload",
            position: { x: 0, y: 0 }, // Will be recalculated in handleAddNode
            data: {
              label: "File Upload Node",
              path: "",
              name: "",
              mime_type: "",
              service: "google_drive",
            },
          },
        },
      ],
    },
    communication: {
      title: "Communication",
      icon: "💬",
      nodes: [
        { type: "email", label: "Email", icon: "📧", color: "bg-[#6c5ce7]" },
        {
          type: "discord",
          label: "Discord",
          icon: "💬",
          color: "bg-[#6c5ce7]",
          config: {
            id: Date.now().toString(),
            type: "discord",
            position: { x: 0, y: 0 }, // Will be recalculated in handleAddNode
            data: {
              label: "Discord Node",
              webhook_url: "",
              message: "",
              username: "AutoFlow Bot",
            },
          },
        },
        {
          type: "twilio",
          label: "Twilio",
          icon: "📱",
          color: "bg-[#6c5ce7]",
          config: {
            id: Date.now().toString(),
            type: "twilio",
            position: { x: 0, y: 0 }, // Will be recalculated in handleAddNode
            data: {
              label: "Twilio Node",
              mode: "whatsapp",
              to: "",
              message: "",
            },
          },
        },
        {
          type: "social_media",
          label: "Social Media",
          icon: "📱",
          color: "bg-[#6c5ce7]",
          config: {
            id: Date.now().toString(),
            type: "social_media",
            position: { x: 0, y: 0 }, // Will be recalculated in handleAddNode
            data: {
              label: "Social Media Node",
              platform: "twitter",
              content: "🚀 Posted automatically by AutoFlow!",
              image_path: "",
              webhook_url: "",
            },
          },
        },
      ],
    },
    automation: {
      title: "Automation",
      icon: "⚡",
      nodes: [
        {
          type: "schedule",
          label: "Schedule",
          icon: "⏰",
          color: "bg-[#9b59b6]",
          config: {
            id: Date.now().toString(),
            type: "schedule",
            position: { x: 0, y: 0 }, // Will be recalculated in handleAddNode
            data: {
              label: "Schedule Node",
              cron: "0 9 * * *",
            },
          },
        },
        {
          type: "image_generation",
          label: "Image Gen",
          icon: "🎨",
          color: "bg-[#9b59b6]",
          config: {
            id: Date.now().toString(),
            type: "image_generation",
            position: { x: 0, y: 0 }, // Will be recalculated in handleAddNode
            data: {
              label: "Image Generation Node",
              prompt: "",
              provider: "openai",
              size: "1024x1024",
              quality: "standard",
            },
          },
        },
        {
          type: "document_parser",
          label: "Doc Parser",
          icon: "📄",
          color: "bg-[#1abc9c]",
          config: {
            id: Date.now().toString(),
            type: "document_parser",
            position: { x: 0, y: 0 }, // Will be recalculated in handleAddNode
            data: {
              label: "Document Parser Node",
              file_path: "",
              supported_types: "PDF, Word, Excel, Text",
            },
          },
        },
        {
          type: "report_generator",
          label: "Report Gen",
          icon: "📊",
          color: "bg-[#1abc9c]",
          config: {
            id: Date.now().toString(),
            type: "report_generator",
            position: { x: 0, y: 0 }, // Will be recalculated in handleAddNode
            data: {
              label: "Report Generator Node",
              title: "AutoFlow Report",
              content:
                "# Workflow Report\n\nThis report was generated automatically by AutoFlow.\n\n## Summary\n\nWorkflow executed successfully.",
              format: "pdf",
            },
          },
        },
      ],
    },
  }

  const filteredCategories = Object.entries(nodeCategories).reduce((acc, [key, category]) => {
    const filteredNodes = category.nodes.filter((node) => node.label.toLowerCase().includes(searchTerm.toLowerCase()))
    if (filteredNodes.length > 0) {
      acc[key] = { ...category, nodes: filteredNodes }
    }
    return acc
  }, {})

  return (
    <div className="h-full bg-[#0a0a0a] flex flex-col font-['Inter']">
      <style jsx>{`
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        /* Glassmorphism effect */
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Glow effects */
        .glow {
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
        }
        
        /* Pulse animation for run button */
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(0, 212, 255, 0.3); }
          50% { box-shadow: 0 0 25px rgba(0, 212, 255, 0.5); }
        }
        
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        
        /* Custom hover effect for nodes */
        .node-card {
          border: 1px solid transparent;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.03);
        }
        
        .node-card:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 212, 255, 0.5);
          background: rgba(255, 255, 255, 0.08);
        }
        
        /* Gradient border */
        .gradient-border {
          position: relative;
          border-radius: 0.5rem;
          background: rgba(10, 10, 10, 0.7);
          z-index: 1;
        }
        
        .gradient-border::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 0.6rem;
          padding: 1px;
          background: linear-gradient(to right, #00D4FF, #FF6B35);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: -1;
        }
      `}</style>

      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center mb-4">
          <h1 className="text-xl font-bold gradient-text flex-1">Workflow Nodes</h1>
          <div className="w-8 h-8 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] transition-all duration-200"
          />
        </div>

        {/* Model Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Default AI Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF] transition-all duration-200"
          >
            {availableModels.map((m) => (
              <option key={m} value={m} className="bg-[#151515]">
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(filteredCategories).map(([key, category]) => (
          <div key={key} className="space-y-2">
            {/* Category Header */}
            <button
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between p-2 glass rounded-lg transition-all duration-200 group"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{category.icon}</span>
                <span className="text-white font-medium">{category.title}</span>
                <span className="text-gray-400 text-sm">({category.nodes.length})</span>
              </div>
              {expandedSections[key] ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              )}
            </button>

            {/* Category Nodes */}
            {expandedSections[key] && (
              <div className="space-y-2 pl-2">
                {category.nodes.map((node) => (
                  <button
                    key={node.type}
                    onClick={() => handleAddNode(node.config || node.type)}
                    disabled={isAdding}
                    className={`w-full node-card flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      isAdding ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 ${node.color} rounded-lg flex items-center justify-center text-white text-sm font-medium shadow-lg`}
                    >
                      {node.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">{node.label}</div>
                      <div className="text-gray-400 text-xs">Add {node.label.toLowerCase()} node</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Run Workflow Button */}
        <button
          onClick={runWorkflow}
          className="w-full bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-300 pulse-glow flex items-center justify-center space-x-2"
        >
          <PlayIcon className="w-5 h-5" />
          <span>Run Workflow</span>
        </button>

        {/* Scheduled Workflows */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Scheduled Workflows</h3>

          <button
            onClick={listScheduledWorkflows}
            className="w-full bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
          >
            <ListBulletIcon className="w-4 h-4" />
            <span>List Workflows</span>
          </button>

          <div className="space-y-2">
            <div className="glass gradient-border rounded-lg p-3">
              <input
                type="text"
                placeholder="Workflow ID to stop"
                id="stopWorkflowId"
                className="w-full bg-transparent border-0 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-0"
              />
              <button
                onClick={() => {
                  const workflowId = document.getElementById("stopWorkflowId").value
                  if (workflowId) stopScheduledWorkflow(workflowId)
                }}
                className="w-full mt-2 bg-[#FF6B35]/80 hover:bg-[#FF6B35] text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
              >
                <StopIcon className="w-4 h-4" />
                <span>Stop Workflow</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
