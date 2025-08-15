"use client"
import { useFlowStore } from "../stores/flowStore"
import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon, PlayIcon, ListBulletIcon, StopIcon } from "@heroicons/react/24/outline"

export default function NodeSidebar() {
  const { addNode, nodes, edges, model, setModel, availableModels } = useFlowStore()
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSections, setExpandedSections] = useState({
    ai: true,
    integrations: true,
    communication: true,
    automation: true,
  })

  const runWorkflow = async () => {
    try {
      console.log("Starting workflow with nodes:", nodes)
      console.log("Starting workflow with edges:", edges)

      if (nodes.length === 0) {
        alert("No nodes to run. Please add some nodes first.")
        return
      }

      const response = await fetch("http://localhost:8000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      })

      console.log("Response status:", response.status)
      const result = await response.json()
      console.log("Execution result:", result)

      if (response.ok) {
        alert("Workflow Run Successfully!\nResults: " + JSON.stringify(result.message, null, 2))
      } else {
        alert("Workflow Failed: " + JSON.stringify(result, null, 2))
      }
    } catch (error) {
      console.error("Workflow execution error:", error)
      alert("Failed to run workflow: " + error.message)
    }
  }

  const stopScheduledWorkflow = async (workflowId) => {
    try {
      console.log(`Attempting to stop workflow: ${workflowId}`)
      const response = await fetch(`http://localhost:8000/schedule/stop/${workflowId}`, {
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
      const response = await fetch("http://localhost:8000/schedule/list")
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
        { type: "gpt", label: "GPT", icon: "➕", color: "bg-[#4a90e2]" },
        { type: "llama", label: "Llama", icon: "🦙", color: "bg-[#4a90e2]" },
        { type: "gemini", label: "Gemini", icon: "💎", color: "bg-[#4a90e2]" },
        { type: "claude", label: "Claude", icon: "🤖", color: "bg-[#4a90e2]" },
        { type: "mistral", label: "Mistral", icon: "🌪️", color: "bg-[#4a90e2]" },
      ],
    },
    integrations: {
      title: "Integrations",
      icon: "🔗",
      nodes: [
        { type: "webhook", label: "Webhook", icon: "🪝", color: "bg-[#f39c12]" },
        {
          type: "google_sheets",
          label: "Google Sheets",
          icon: "📊",
          color: "bg-[#f39c12]",
          config: {
            id: Date.now().toString(),
            type: "google_sheets",
            position: { x: 250, y: 150 },
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
          color: "bg-[#f39c12]",
          config: {
            id: Date.now().toString(),
            type: "file_upload",
            position: { x: 250, y: 200 },
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
        { type: "email", label: "Email", icon: "📧", color: "bg-[#2ecc71]" },
        {
          type: "discord",
          label: "Discord",
          icon: "💬",
          color: "bg-[#2ecc71]",
          config: {
            id: Date.now().toString(),
            type: "discord",
            position: { x: 250, y: 400 },
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
          color: "bg-[#2ecc71]",
          config: {
            id: Date.now().toString(),
            type: "twilio",
            position: { x: 250, y: 250 },
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
          color: "bg-[#2ecc71]",
          config: {
            id: Date.now().toString(),
            type: "social_media",
            position: { x: 250, y: 500 },
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
            position: { x: 250, y: 100 },
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
            position: { x: 250, y: 300 },
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
            position: { x: 250, y: 350 },
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
            position: { x: 250, y: 450 },
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
    <div
      className="h-full bg-[#2a2a2a] flex flex-col"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#666666 #252525",
      }}
    >
      <style jsx>{`
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #252525;
        }
        ::-webkit-scrollbar-thumb {
          background: #666666;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #888888;
        }
        
        /* Glassmorphism effect */
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Custom pulse animation */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Header */}
      <div className="p-4 border-b border-[#404040]">
        <h1 className="text-xl font-bold text-white mb-4">AutoFlow Studio</h1>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Model Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#cccccc] mb-2">Default AI Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
          >
            {availableModels.map((m) => (
              <option key={m} value={m} className="bg-[#3a3a3a]">
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
              className="w-full flex items-center justify-between p-2 bg-[#252525] hover:bg-[#3a3a3a] rounded-lg transition-all duration-200 group"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{category.icon}</span>
                <span className="text-white font-medium">{category.title}</span>
                <span className="text-[#999999] text-sm">({category.nodes.length})</span>
              </div>
              {expandedSections[key] ? (
                <ChevronDownIcon className="w-4 h-4 text-[#cccccc] group-hover:text-white transition-colors" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-[#cccccc] group-hover:text-white transition-colors" />
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
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg border border-[#404040] hover:border-[#ff6d6d] hover:shadow-lg hover:shadow-[#ff6d6d]/20 transition-all duration-200 transform hover:scale-[1.02] ${
                      isAdding ? "opacity-50 cursor-not-allowed" : "hover:bg-[#3a3a3a]"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 ${node.color} rounded-lg flex items-center justify-center text-white text-sm font-medium shadow-lg`}
                    >
                      {node.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">{node.label}</div>
                      <div className="text-[#999999] text-xs">Add {node.label.toLowerCase()} node</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[#404040] space-y-3">
        {/* Run Workflow Button */}
        <button
          onClick={runWorkflow}
          className="w-full bg-gradient-to-r from-[#ff6d6d] to-[#ff9500] hover:from-[#ff5252] hover:to-[#ff8f00] text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#ff6d6d]/30 flex items-center justify-center space-x-2"
        >
          <PlayIcon className="w-5 h-5" />
          <span>Run Workflow</span>
        </button>

        {/* Scheduled Workflows */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#cccccc]">Scheduled Workflows</h3>

          <button
            onClick={listScheduledWorkflows}
            className="w-full bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
          >
            <ListBulletIcon className="w-4 h-4" />
            <span>List Workflows</span>
          </button>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Workflow ID to stop"
              id="stopWorkflowId"
              className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            />
            <button
              onClick={() => {
                const workflowId = document.getElementById("stopWorkflowId").value
                if (workflowId) stopScheduledWorkflow(workflowId)
              }}
              className="w-full bg-[#e74c3c] hover:bg-[#c0392b] text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
            >
              <StopIcon className="w-4 h-4" />
              <span>Stop Workflow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
