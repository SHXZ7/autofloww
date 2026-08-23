"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PlayIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  CommandLineIcon,
  XMarkIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  DocumentChartBarIcon,
  MegaphoneIcon,
  LinkIcon,
  ClockIcon,
  CpuChipIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline"

// Initial preloaded nodes
const DEFAULT_PRESETS = {
  ai_pipeline: [
    {
      id: "node_1",
      type: "trigger",
      title: "Inbound Webhook",
      app: "Webhook",
      icon: "webhook",
      x: 60,
      y: 120,
      status: "idle",
      config: { event: "POST /v1/leads" },
      color: "#2EA38D",
    },
    {
      id: "node_2",
      type: "ai",
      title: "Claude 3.5 Sonnet",
      app: "Anthropic",
      icon: "ai",
      x: 340,
      y: 80,
      status: "idle",
      config: { model: "claude-3-5-sonnet", temp: "0.7" },
      color: "#EB5E3D",
    },
    {
      id: "node_3",
      type: "action",
      title: "Google Sheets Sync",
      app: "Sheets",
      icon: "sheets",
      x: 640,
      y: 60,
      status: "idle",
      config: { sheet: "Q3_Customers_CRM" },
      color: "#2EA38D",
    },
    {
      id: "node_4",
      type: "action",
      title: "Discord Notification",
      app: "Discord",
      icon: "discord",
      x: 640,
      y: 240,
      status: "idle",
      config: { channel: "#leads-stream" },
      color: "#5865F2",
    },
  ],
  support_bot: [
    {
      id: "node_1",
      type: "trigger",
      title: "Gmail Support Trigger",
      app: "Gmail",
      icon: "gmail",
      x: 60,
      y: 130,
      status: "idle",
      config: { label: "INBOX" },
      color: "#EB5E3D",
    },
    {
      id: "node_2",
      type: "ai",
      title: "GPT-4o Vision & Text",
      app: "OpenAI",
      icon: "ai",
      x: 360,
      y: 130,
      status: "idle",
      config: { prompt: "Analyze sentiment & draft reply" },
      color: "#241812",
    },
    {
      id: "node_3",
      type: "action",
      title: "Send Gmail Reply",
      app: "Gmail",
      icon: "gmail",
      x: 660,
      y: 130,
      status: "idle",
      config: { action: "draft_and_send" },
      color: "#EB5E3D",
    },
  ],
}

const DEFAULT_CONNECTIONS = {
  ai_pipeline: [
    { id: "c1", from: "node_1", to: "node_2" },
    { id: "c2", from: "node_2", to: "node_3" },
    { id: "c3", from: "node_2", to: "node_4" },
  ],
  support_bot: [
    { id: "c1", from: "node_1", to: "node_2" },
    { id: "c2", from: "node_2", to: "node_3" },
  ],
}

const AVAILABLE_NODE_TEMPLATES = [
  { type: "trigger", title: "Gmail Trigger", app: "Gmail", icon: "gmail", color: "#EB5E3D", config: { filter: "has:attachment" } },
  { type: "trigger", title: "Cron Schedule", app: "Schedule", icon: "clock", color: "#8A7C72", config: { cron: "0 9 * * *" } },
  { type: "ai", title: "Gemini 1.5 Pro", app: "Google AI", icon: "ai", color: "#2EA38D", config: { task: "Structured Extraction" } },
  { type: "ai", title: "Llama 3.3 70B", app: "Meta AI", icon: "ai", color: "#241812", config: { mode: "Reasoning & Summary" } },
  { type: "action", title: "PostgreSQL DB", app: "Database", icon: "db", color: "#736357", config: { table: "audit_logs" } },
  { type: "action", title: "Slack Message", app: "Slack", icon: "discord", color: "#5865F2", config: { target: "#operations" } },
]

export default function InteractiveWorkflowPlayground() {
  const [currentPreset, setCurrentPreset] = useState("ai_pipeline")
  const [nodes, setNodes] = useState(DEFAULT_PRESETS.ai_pipeline)
  const [connections, setConnections] = useState(DEFAULT_CONNECTIONS.ai_pipeline)
  const [activeConnectingNode, setActiveConnectingNode] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [executionLogs, setExecutionLogs] = useState([])
  const [showLogDrawer, setShowLogDrawer] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState(null)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef(null)

  // Switch presets
  const handleSelectPreset = (presetKey) => {
    setCurrentPreset(presetKey)
    setNodes(JSON.parse(JSON.stringify(DEFAULT_PRESETS[presetKey])))
    setConnections(JSON.parse(JSON.stringify(DEFAULT_CONNECTIONS[presetKey])))
    setExecutionLogs([])
    setIsRunning(false)
  }

  // Handle Dragging
  const handleMouseDownNode = (e, nodeId) => {
    e.stopPropagation()
    const node = nodes.find((n) => n.id === nodeId)
    if (!node || !canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    setDraggedNodeId(nodeId)
    setMouseOffset({
      x: e.clientX - canvasRect.left - node.x,
      y: e.clientY - canvasRect.top - node.y,
    })
  }

  const handleMouseMove = (e) => {
    if (!draggedNodeId || !canvasRef.current) return
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const newX = Math.max(10, Math.min(canvasRect.width - 240, e.clientX - canvasRect.left - mouseOffset.x))
    const newY = Math.max(10, Math.min(canvasRect.height - 130, e.clientY - canvasRect.top - mouseOffset.y))

    setNodes((prev) =>
      prev.map((n) => (n.id === draggedNodeId ? { ...n, x: Math.round(newX), y: Math.round(newY) } : n))
    )
  }

  const handleMouseUp = () => {
    setDraggedNodeId(null)
  }

  // Connect Nodes
  const handlePortClick = (e, nodeId, isOutput) => {
    e.stopPropagation()
    if (isOutput) {
      setActiveConnectingNode(nodeId)
    } else {
      if (activeConnectingNode && activeConnectingNode !== nodeId) {
        const exists = connections.some((c) => c.from === activeConnectingNode && c.to === nodeId)
        if (!exists) {
          setConnections((prev) => [
            ...prev,
            { id: `c_${Date.now()}`, from: activeConnectingNode, to: nodeId },
          ])
        }
        setActiveConnectingNode(null)
      }
    }
  }

  // Delete Connection
  const handleDeleteConnection = (connId) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId))
  }

  // Add Node from Template
  const handleAddNode = (template) => {
    const newNode = {
      id: `node_${Date.now()}`,
      ...template,
      x: 100 + (nodes.length % 3) * 180,
      y: 120 + Math.floor(nodes.length / 3) * 60,
      status: "idle",
    }
    setNodes((prev) => [...prev, newNode])
  }

  // Delete Node
  const handleDeleteNode = (e, nodeId) => {
    e.stopPropagation()
    setNodes((prev) => prev.filter((n) => n.id !== nodeId))
    setConnections((prev) => prev.filter((c) => c.from !== nodeId && c.to !== nodeId))
  }

  // Reset Canvas
  const handleReset = () => {
    handleSelectPreset(currentPreset)
  }

  // Execute Workflow Simulation
  const handleRunWorkflow = async () => {
    if (isRunning || nodes.length === 0) return
    setIsRunning(true)
    setExecutionLogs([])

    const addLog = (text, type = "info") => {
      const time = new Date().toLocaleTimeString()
      setExecutionLogs((prev) => [...prev, { time, text, type }])
    }

    addLog("⚡ [Initiating Execution] Graph topological check passed. 0 cyclic loops.", "info")

    // Reset status
    setNodes((prev) => prev.map((n) => ({ ...n, status: "idle" })))

    // Execute step by step
    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i]
      
      setNodes((prev) =>
        prev.map((n) => (n.id === currentNode.id ? { ...n, status: "running" } : n))
      )
      addLog(`▶ [Executing] Node #${i + 1}: ${currentNode.title} (${currentNode.app})...`, "running")

      await new Promise((r) => setTimeout(r, 650))

      setNodes((prev) =>
        prev.map((n) => (n.id === currentNode.id ? { ...n, status: "success" } : n))
      )
      addLog(`✓ [Success 200 OK] ${currentNode.title} finished in ${Math.floor(Math.random() * 180 + 30)}ms`, "success")
    }

    addLog("✨ [Workflow Complete] All nodes dispatched successfully without errors.", "success")
    setIsRunning(false)
  }

  // Render Icon helper
  const renderAppIcon = (iconName) => {
    switch (iconName) {
      case "gmail":
        return <EnvelopeIcon className="w-4 h-4 text-[#EB5E3D]" />
      case "sheets":
        return <DocumentChartBarIcon className="w-4 h-4 text-[#2EA38D]" />
      case "discord":
        return <MegaphoneIcon className="w-4 h-4 text-[#5865F2]" />
      case "webhook":
        return <LinkIcon className="w-4 h-4 text-[#EB5E3D]" />
      case "clock":
        return <ClockIcon className="w-4 h-4 text-[#8A7C72]" />
      default:
        return <CpuChipIcon className="w-4 h-4 text-[#241812]" />
    }
  }

  return (
    <section className={`py-16 sm:py-24 bg-[#F6F1EA] transition-all ${isFullscreen ? "fixed inset-0 z-50 p-4 sm:p-8 overflow-auto" : ""}`} style={{ backgroundColor: "#F6F1EA" }}>
      <div className="max-w-[1560px] mx-auto px-4 sm:px-8 md:px-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EDE6DC] border border-[#E5DCD0] text-xs font-semibold text-[#EB5E3D] mb-4 shadow-2xs">
            <SparklesIcon className="w-4 h-4" />
            LIVE INTERACTIVE PLAYGROUND
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#241812] tracking-tight leading-[1.08] mb-4">
            Try building a workflow right now
          </h2>
          <p className="text-sm sm:text-base text-[#736357] leading-relaxed max-w-2xl mx-auto">
            Drag nodes, click ports to wire triggers and AI models, or hit <strong>Run Simulation</strong> to watch real-time execution in action.
          </p>
        </div>

        {/* Playground Container Frame */}
        <div className="bg-[#EDE6DC] rounded-[36px] sm:rounded-[44px] border border-[#E5DCD0] shadow-[0_12px_48px_rgba(36,24,18,0.06)] overflow-hidden flex flex-col">
          
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 py-4 bg-[#EDE6DC] border-b border-[#E5DCD0]">
            
            {/* Presets & Add Node */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-xs font-bold text-[#736357] uppercase tracking-wider hidden sm:inline">
                Preset:
              </span>
              <button
                onClick={() => handleSelectPreset("ai_pipeline")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  currentPreset === "ai_pipeline"
                    ? "bg-[#241812] text-white border-[#241812] shadow-xs"
                    : "bg-[#F6F1EA] text-[#736357] border-[#E5DCD0] hover:border-[#241812]"
                }`}
              >
                Lead Triage & AI Summary
              </button>
              <button
                onClick={() => handleSelectPreset("support_bot")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  currentPreset === "support_bot"
                    ? "bg-[#241812] text-white border-[#241812] shadow-xs"
                    : "bg-[#F6F1EA] text-[#736357] border-[#E5DCD0] hover:border-[#241812]"
                }`}
              >
                Gmail Support Auto-Reply
              </button>

              {/* Add Node Dropdown Button / List */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F6F1EA] text-[#241812] border border-[#E5DCD0] hover:border-[#241812] transition-all shadow-2xs">
                  <PlusIcon className="w-3.5 h-3.5 text-[#EB5E3D]" />
                  + Add Node
                </button>

                {/* Dropdown Menu */}
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl p-2 border border-[#E5DCD0] shadow-xl z-30 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all">
                  <div className="text-[10px] font-bold text-[#8A7C72] px-2.5 py-1 uppercase tracking-wider">
                    Add to Canvas
                  </div>
                  {AVAILABLE_NODE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      onClick={() => handleAddNode(tmpl)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold text-[#241812] hover:bg-[#F6F1EA] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {renderAppIcon(tmpl.icon)}
                        <span>{tmpl.title}</span>
                      </div>
                      <PlusIcon className="w-3.5 h-3.5 text-[#736357]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Run & Canvas Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleReset}
                title="Reset Canvas"
                className="p-2 rounded-full bg-[#F6F1EA] text-[#736357] hover:text-[#241812] border border-[#E5DCD0] hover:border-[#241812] transition-all shadow-2xs"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                className="p-2 rounded-full bg-[#F6F1EA] text-[#736357] hover:text-[#241812] border border-[#E5DCD0] hover:border-[#241812] transition-all shadow-2xs hidden sm:block"
              >
                {isFullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
              </button>

              {/* Run Workflow CTA */}
              <button
                onClick={handleRunWorkflow}
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#EB5E3D] hover:bg-[#D94F2F] text-white text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <PlayIcon className="w-3.5 h-3.5 fill-white" />
                {isRunning ? "Simulating Execution..." : "Run Simulation"}
              </button>
            </div>
          </div>

          {/* Interactive Canvas Viewport */}
          <div
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative w-full h-[460px] sm:h-[500px] bg-[#F6F1EA] overflow-hidden select-none cursor-crosshair"
            style={{
              backgroundImage: `radial-gradient(#E5DCD0 1.2px, transparent 1.2px)`,
              backgroundSize: "24px 24px",
            }}
          >
            {/* Connecting SVG Wires */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EB5E3D" />
                  <stop offset="100%" stopColor="#2EA38D" />
                </linearGradient>
              </defs>
              {connections.map((conn) => {
                const fromNode = nodes.find((n) => n.id === conn.from)
                const toNode = nodes.find((n) => n.id === conn.to)
                if (!fromNode || !toNode) return null

                const startX = fromNode.x + 220
                const startY = fromNode.y + 45
                const endX = toNode.x
                const endY = toNode.y + 45

                const dx = Math.abs(endX - startX) * 0.5
                const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`

                const isConnectedToRunning = fromNode.status === "running" || toNode.status === "running"

                return (
                  <g key={conn.id} className="cursor-pointer pointer-events-auto" onClick={() => handleDeleteConnection(conn.id)}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#E5DCD0"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isConnectedToRunning ? "url(#wireGradient)" : "#241812"}
                      strokeWidth="2.5"
                      strokeDasharray={isConnectedToRunning ? "6, 4" : "none"}
                      className={isConnectedToRunning ? "animate-pulse" : ""}
                    />
                    {isRunning && (
                      <circle r="4" fill="#EB5E3D">
                        <animateMotion path={pathData} dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Hint Notice */}
            <div className="absolute top-4 left-6 z-20 pointer-events-none bg-[#EDE6DC]/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#E5DCD0] text-[11px] text-[#736357] font-medium">
              💡 Drag nodes to move · Click right dot to wire · Click wires to disconnect
            </div>

            {/* Active Port Connection Indicator Banner */}
            {activeConnectingNode && (
              <div className="absolute top-4 right-6 z-20 bg-[#EB5E3D] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md animate-bounce">
                Click a left port (input dot) to connect!
              </div>
            )}

            {/* Draggable Nodes */}
            {nodes.map((node) => {
              const isSelectedForConnect = activeConnectingNode === node.id

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                  style={{
                    transform: `translate(${node.x}px, ${node.y}px)`,
                  }}
                  className={`absolute top-0 left-0 w-[220px] bg-white rounded-2xl border shadow-sm transition-shadow z-20 cursor-grab active:cursor-grabbing ${
                    node.status === "running"
                      ? "border-[#EB5E3D] ring-2 ring-[#EB5E3D]/30 shadow-md"
                      : node.status === "success"
                      ? "border-[#2EA38D] ring-2 ring-[#2EA38D]/20 shadow-xs"
                      : isSelectedForConnect
                      ? "border-[#EB5E3D] ring-2 ring-[#EB5E3D]/40"
                      : "border-[#E5DCD0] hover:border-[#241812]"
                  }`}
                >
                  {/* Left Port (Input) */}
                  <div
                    onClick={(e) => handlePortClick(e, node.id, false)}
                    title="Input Port (Connect here)"
                    className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#EDE6DC] border-2 border-[#241812] flex items-center justify-center hover:scale-125 transition-transform cursor-pointer z-30"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#241812]" />
                  </div>

                  {/* Right Port (Output) */}
                  <div
                    onClick={(e) => handlePortClick(e, node.id, true)}
                    title="Output Port (Drag wire from here)"
                    className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#EDE6DC] border-2 border-[#EB5E3D] flex items-center justify-center hover:scale-125 transition-transform cursor-pointer z-30"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#EB5E3D]" />
                  </div>

                  {/* Node Header */}
                  <div className="p-3 border-b border-[#F6F1EA] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderAppIcon(node.icon)}
                      <div>
                        <div className="text-xs font-bold text-[#241812] leading-tight truncate w-28">
                          {node.title}
                        </div>
                        <div className="text-[10px] text-[#8A7C72]">{node.app}</div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteNode(e, node.id)}
                      className="p-1 text-[#8A7C72] hover:text-[#EB5E3D] rounded-md transition-colors"
                      title="Delete Node"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Node Status Indicator */}
                  <div className="px-3 py-2 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-[#8A7C72] truncate max-w-[120px]">
                      {Object.values(node.config)[0]}
                    </span>

                    {node.status === "running" ? (
                      <span className="flex items-center gap-1 font-bold text-[#EB5E3D]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EB5E3D] animate-ping" />
                        Run...
                      </span>
                    ) : node.status === "success" ? (
                      <span className="flex items-center gap-1 font-bold text-[#2EA38D]">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        200 OK
                      </span>
                    ) : (
                      <span className="text-[#8A7C72]">Ready</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Real-time Execution Telemetry Console Bar */}
          <div className="bg-[#241812] text-white border-t border-[#362720] px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CommandLineIcon className="w-4 h-4 text-[#EB5E3D]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#A89F97]">
                  Execution Stream Log
                </span>
                {isRunning && (
                  <span className="text-[10px] font-mono text-[#2EA38D] bg-[#2EA38D]/20 px-2 py-0.5 rounded-full animate-pulse">
                    ACTIVE TELEMETRY
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowLogDrawer(!showLogDrawer)}
                className="text-xs text-[#A89F97] hover:text-white transition-colors underline"
              >
                {showLogDrawer ? "Hide Console" : "Show Console"}
              </button>
            </div>

            {/* Log Drawer */}
            <AnimatePresence>
              {showLogDrawer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2.5 max-h-28 overflow-y-auto font-mono text-[11px] space-y-1 text-[#E0D7D0] pr-2 scrollbar-thin"
                >
                  {executionLogs.length === 0 ? (
                    <div className="text-[#736357] py-1">
                      Ready to execute. Click <strong>"Run Simulation"</strong> above to inspect live pipeline events.
                    </div>
                  ) : (
                    executionLogs.map((log, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 ${
                          log.type === "success"
                            ? "text-[#2EA38D]"
                            : log.type === "running"
                            ? "text-[#EB5E3D]"
                            : "text-[#E0D7D0]"
                        }`}
                      >
                        <span className="text-[#736357] text-[10px]">{log.time}</span>
                        <span>{log.text}</span>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  )
}
