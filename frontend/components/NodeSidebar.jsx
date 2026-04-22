"use client"
import { useFlowStore } from "../stores/flowStore"
import { useAuthStore } from "../stores/authStore"
import { useState, useEffect } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline"


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
    utilities: false,
  })
  const [isLight, setIsLight] = useState(false)
  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains('light'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  const API_BASE_URL = 'http://172.20.10.2:8000'

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
      title: "AI",
      icon: "/images/ai.png",
      accent: "#8B5CF6",
      nodes: [
        { type: "gpt",    label: "GPT",    icon: "/images/gpt.png",    color: "bg-[#00D4FF]" },
        { type: "claude", label: "Claude", icon: "/images/claude.png", color: "bg-[#00D4FF]" },
        { type: "gemini", label: "Gemini", icon: "/images/gemini.png", color: "bg-[#00D4FF]" },
      ],
    },
    integrations: {
      title: "Integrations",
      icon: "/images/integrations.png",
      accent: "#3B82F6",
      nodes: [
        { type: "webhook", label: "Webhook", icon: "/images/webhook.png", color: "bg-[#FF6B35]" },
        {
          type: "google_sheets",
          label: "Google Sheets",
          icon: "/images/google_sheets.png",
          color: "bg-[#FF6B35]",
          config: {
            id: Date.now().toString(),
            type: "google_sheets",
            position: { x: 0, y: 0 },
            data: { label: "Google Sheets Node", spreadsheet_id: "", range: "Sheet1!A1", values: [] },
          },
        },
        {
          type: "file_upload",
          label: "File Upload",
          icon: "/images/file_upload.png",
          color: "bg-[#FF6B35]",
          config: {
            id: Date.now().toString(),
            type: "file_upload",
            position: { x: 0, y: 0 },
            data: { label: "File Upload Node", path: "", name: "", mime_type: "", service: "google_drive" },
          },
        },
      ],
    },
    communication: {
      title: "Communication",
      icon: "/images/communication.png",
      accent: "#22C55E",
      nodes: [
        { type: "email", label: "Email", icon: "/images/email.png", color: "bg-[#6c5ce7]" },
        {
          type: "discord",
          label: "Discord",
          icon: "/images/discord.png",
          color: "bg-[#6c5ce7]",
          config: {
            id: Date.now().toString(),
            type: "discord",
            position: { x: 0, y: 0 },
            data: { label: "Discord Node", webhook_url: "", message: "", username: "AutoFlow Bot" },
          },
        },
        {
          type: "whatsapp",
          label: "WhatsApp",
          icon: "/images/sms.png",
          color: "bg-[#6c5ce7]",
          config: {
            id: Date.now().toString(),
            type: "whatsapp",
            position: { x: 0, y: 0 },
            data: { label: "WhatsApp Node", to: "", message: "" },
          },
        },
      ],
    },
    automation: {
      title: "Automation",
      icon: "/images/automation.png",
      accent: "#F59E0B",
      nodes: [
        {
          type: "schedule",
          label: "Schedule",
          icon: "/images/schedule.png",
          color: "bg-[#9b59b6]",
          config: {
            id: Date.now().toString(),
            type: "schedule",
            position: { x: 0, y: 0 },
            data: { label: "Schedule Node", cron: "0 9 * * *" },
          },
        },
        {
          type: "gmail_trigger",
          label: "Gmail Trigger",
          icon: "/images/email.png",
          color: "bg-[#9b59b6]",
          config: {
            id: Date.now().toString(),
            type: "gmail_trigger",
            position: { x: 0, y: 0 },
            data: { label: "Gmail Trigger Node", query: "", label_filter: "INBOX", poll_interval: 1 },
          },
        },
        {
          type: "delay",
          label: "Delay",
          icon: "/images/delay.png",
          color: "bg-[#9b59b6]",
          config: {
            id: Date.now().toString(),
            type: "delay",
            position: { x: 0, y: 0 },
            data: { label: "Delay Node", seconds: 5 },
          },
        },
      ],
    },
    utilities: {
      title: "Utilities",
      icon: "/images/utilities.png",
      accent: "#06B6D4",
      nodes: [
        {
          type: "image_generation",
          label: "Image Generation",
          icon: "/images/gemini.png",
          color: "bg-[#1abc9c]",
          config: {
            id: Date.now().toString(),
            type: "image_generation",
            position: { x: 0, y: 0 },
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
          label: "Document Parser",
          icon: "/images/document_parser.png",
          color: "bg-[#1abc9c]",
          config: {
            id: Date.now().toString(),
            type: "document_parser",
            position: { x: 0, y: 0 },
            data: { label: "Document Parser Node", file_path: "", supported_types: "PDF, Word, Excel, Text" },
          },
        },
        {
          type: "report_generator",
          label: "Report Generator",
          icon: "/images/report_generator.png",
          color: "bg-[#1abc9c]",
          config: {
            id: Date.now().toString(),
            type: "report_generator",
            position: { x: 0, y: 0 },
            data: {
              label: "Report Generator Node",
              title: "AutoFlow Report",
              content: "# Workflow Report\n\nThis report was generated automatically by AutoFlow.\n\n## Summary\n\nWorkflow executed successfully.",
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
    <div className="h-full flex flex-col" style={{background: isLight ? '#f8fafc' : '#0f172a', fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)"}}>
      <style jsx>{`
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.9);
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

      {/* Search */}
      <div style={{padding:'14px 12px 10px', borderBottom:`1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`, flexShrink:0}}>
        <input
          type="text"
          placeholder="Search nodes…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width:'100%', boxSizing:'border-box',
            background: isLight ? '#ffffff' : '#1e293b',
            border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
            borderRadius:'8px', padding:'8px 12px',
            color: isLight ? '#1e293b' : '#F1F5F9', fontSize:'14px',
            fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)",
            outline:'none',
          }}
        />
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto" style={{padding:'10px', display:'flex', flexDirection:'column', gap:'4px'}}>
        {Object.entries(filteredCategories).map(([key, category]) => (
          <div key={key} className="space-y-2">
            {/* Category Header */}
            <button
              onClick={() => toggleSection(key)}
              style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'9px 10px', borderRadius:'8px', border:'none',
                background: expandedSections[key]
                  ? (isLight ? 'rgba(226,232,240,0.8)' : 'rgba(30,41,59,0.8)')
                  : 'transparent',
                cursor:'pointer', transition:'background 0.12s',
              }}
              onMouseEnter={e => { if (!expandedSections[key]) e.currentTarget.style.background = isLight ? 'rgba(226,232,240,0.5)' : 'rgba(30,41,59,0.5)' }}
              onMouseLeave={e => { if (!expandedSections[key]) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{display:'flex', alignItems:'center', gap:'7px'}}>
                {category.icon.startsWith('/') ? <img src={category.icon} alt="" style={{width:'20px', height:'20px', objectFit:'contain', flexShrink:0}} /> : <span style={{fontSize:'16px'}}>{category.icon}</span>}
                <span style={{fontSize:'14.5px', fontWeight:'600', color: expandedSections[key] ? (isLight ? '#1e293b' : '#F1F5F9') : (isLight ? '#475569' : '#64748b'), fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)"}}>{category.title}</span>
                <span style={{fontSize:'12px', color: isLight ? '#94a3b8' : '#475569', fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)"}}> ({category.nodes.length})</span>
              </div>
              {expandedSections[key]
                ? <ChevronDownIcon style={{width:'15px', height:'15px', color: isLight ? '#64748b' : '#64748b'}} />
                : <ChevronRightIcon style={{width:'15px', height:'15px', color: isLight ? '#94a3b8' : '#475569'}} />
              }
            </button>

            {/* Category Nodes */}
            {expandedSections[key] && (
              <div style={{display:'flex', flexWrap:'wrap', gap:'6px', padding:'6px 4px 8px'}}>
                {category.nodes.map((node) => {
                  const accent = category.accent || '#64748b'
                  return (
                  <button
                    key={node.type}
                    onClick={() => handleAddNode(node.config || node.type)}
                    disabled={isAdding}
                    title={node.label}
                    style={{
                      display:'flex', alignItems:'center', gap:'6px',
                      padding:'7px 12px',
                      borderRadius:'6px',
                      border:`1px solid ${accent}33`,
                      background:`${accent}14`,
                      color: isAdding ? '#334155' : accent,
                      fontSize:'13.5px', fontWeight:'500',
                      fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)",
                      cursor: isAdding ? 'not-allowed' : 'pointer',
                      transition:'background 0.12s, color 0.12s, border-color 0.12s',
                      whiteSpace:'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (!isAdding) {
                        e.currentTarget.style.background = `${accent}28`
                        e.currentTarget.style.borderColor = `${accent}66`
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = `${accent}14`
                      e.currentTarget.style.borderColor = `${accent}33`
                    }}
                  >
                    {node.icon.startsWith('/')
                      ? <img src={node.icon} alt="" style={{width:'16px', height:'16px', objectFit:'contain', flexShrink:0}} />
                      : <span style={{fontSize:'15px'}}>{node.icon}</span>
                    }
                    {node.label}
                  </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>


    </div>
  )
}
