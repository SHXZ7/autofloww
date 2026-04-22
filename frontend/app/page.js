"use client"
import { useCallback, useEffect, useState } from "react"
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow"
import "reactflow/dist/style.css"
import { useFlowStore } from "../stores/flowStore"
import { useAuthStore } from "../stores/authStore"
import CustomNode from "../components/CustomNode"
import NodeSidebar from "../components/NodeSidebar"
import WorkflowControls from "../components/WorkflowControls"
import TopNav from "../components/TopNav"
import MobileBottomNav from "../components/MobileBottomNav"
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic'
import {
  BoltIcon,
  RectangleStackIcon,
  DocumentDuplicateIcon,
  PlayCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

// Dynamically import particle background to avoid SSR issues
const ParticleBackground = dynamic(() => import("../components/ParticleBackground"), {
  ssr: false
})

const nodeTypes = {
  default:          CustomNode,
  gpt:              CustomNode,
  llama:            CustomNode,
  gemini:           CustomNode,
  claude:           CustomNode,
  mistral:          CustomNode,
  email:            CustomNode,
  webhook:          CustomNode,
  google_sheets:    CustomNode,
  schedule:         CustomNode,
  gmail_trigger:    CustomNode,
  delay:            CustomNode,
  file_upload:      CustomNode,
  whatsapp:         CustomNode,
  image_generation: CustomNode,
  document_parser:  CustomNode,
  discord:          CustomNode,
  report_generator: CustomNode,
  social_media:     CustomNode,
}

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Flow', icon: BoltIcon },
  { href: '/workflows', label: 'Workflows', icon: RectangleStackIcon },
  { href: '/templates', label: 'Templates', icon: DocumentDuplicateIcon },
  { href: '/runs', label: 'Runs', icon: PlayCircleIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
]

export default function Home() {
  const { nodes, edges, setNodes, setEdges, model, setModel, availableModels, loadTemplate } = useFlowStore()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isLight, setIsLight] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState("")
  const [dockCollapsed, setDockCollapsed] = useState(false)
  const [pendingWorkflow, setPendingWorkflow] = useState(null)
  const [pendingSummary, setPendingSummary] = useState("")
  const [lastAction, setLastAction] = useState(null)
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [onboardingStatus, setOnboardingStatus] = useState({
    checking: false,
    hasGoogleToken: false,
    hasRunWorkflow: false,
  })
  const [isMobile, setIsMobile] = useState(false)
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false)
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://autofloww-production.up.railway.app"
  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains('light'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Check authentication on app load
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Load pending template from localStorage (set by template page before navigation)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('af_pending_template')
      if (raw) {
        localStorage.removeItem('af_pending_template')
        const { nodes: tNodes, edges: tEdges } = JSON.parse(raw)
        if (tNodes && tNodes.length > 0) {
          loadTemplate(tNodes, tEdges || [])
        }
      }
    } catch (e) { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect unauthenticated users to homepage ONLY WHEN we're sure they're not authenticated
  // (Don't redirect when still loading)
  useEffect(() => {
    // Only redirect if we've finished checking authentication and user is not authenticated
    if (!loading && isAuthenticated === false) {
      router.push('/homepage')
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem('af_onboarding_dismissed') === '1'
      setOnboardingDismissed(isDismissed)
    } catch (_) {
      setOnboardingDismissed(false)
    }
  }, [])

  const refreshOnboardingStatus = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setOnboardingStatus((prev) => ({ ...prev, checking: true }))
    try {
      const [keysRes, runsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/api-keys`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/executions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const keysData = keysRes.ok ? await keysRes.json() : { apiKeys: {} }
      const runsData = runsRes.ok ? await runsRes.json() : []

      const keys = keysData?.apiKeys || {}
      const hasGoogleToken = Boolean(
        keys.google_token_json?.isActive ||
        keys.gmail_token_json?.isActive ||
        keys.google?.isActive
      )

      const executionList = Array.isArray(runsData) ? runsData : (runsData?.executions || [])
      const hasRunWorkflow = executionList.length > 0

      setOnboardingStatus({ checking: false, hasGoogleToken, hasRunWorkflow })
    } catch (_) {
      setOnboardingStatus((prev) => ({ ...prev, checking: false }))
    }
  }, [API_BASE_URL])

  useEffect(() => {
    if (!isAuthenticated || onboardingDismissed) return
    refreshOnboardingStatus()
  }, [isAuthenticated, onboardingDismissed, refreshOnboardingStatus])

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 900)
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setMobilePaletteOpen(false)
      setMobileInspectorOpen(false)
    }
  }, [isMobile])

  const dismissOnboarding = () => {
    setOnboardingDismissed(true)
    try {
      localStorage.setItem('af_onboarding_dismissed', '1')
    } catch (_) {
      // ignore storage write errors
    }
  }

  const onNodesChange = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, nodes)
      setNodes(updatedNodes)
    },
    [nodes, setNodes]
  )

  const onEdgesChange = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, edges)
      setEdges(updatedEdges)
    },
    [edges, setEdges]
  )

  const onConnect = useCallback(
    (connection) => {
      const newEdge = {
        ...connection,
        id: `${connection.source}-${connection.target}`,
        type: "smoothstep",
        style: { stroke: "#00D4FF", strokeWidth: 2 },
        animated: false,
        markerEnd: {
          type: 'arrowclosed',
          color: '#00D4FF',
          width: 20,
          height: 20
        }
      }
      setEdges(addEdge(newEdge, edges))
    },
    [edges, setEdges]
  )

  const loadGeneratedWorkflow = useCallback((workflow) => {
    const mappedNodes = (workflow.nodes || []).map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position || { x: 100, y: 100 },
      data: n.data || {},
    }))

    const mappedEdges = (workflow.edges || []).map((e) => ({
      id: e.id || `e_${e.source}_${e.target}`,
      source: e.source,
      target: e.target,
    }))

    setNodes(mappedNodes)
    setEdges(mappedEdges)
  }, [setNodes, setEdges])

  const summarizeWorkflow = useCallback((workflow) => {
    const labels = (workflow?.nodes || []).map((n) => n?.data?.label || n?.type || "Node")
    return labels.length ? labels.join(" -> ") : "Empty workflow"
  }, [])

  const requestWorkflow = useCallback(async (endpoint, payload, actionMeta) => {
    setIsGenerating(true)
    setGenerateError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "Failed to generate workflow")
      }

      setPendingWorkflow({ nodes: data.nodes || [], edges: data.edges || [] })
      setPendingSummary(summarizeWorkflow(data))
      setLastAction(actionMeta)
    } catch (err) {
      setGenerateError(err?.message || "Failed to generate workflow. Try again.")
      alert("Failed to generate workflow. Try again.")
    } finally {
      setIsGenerating(false)
    }
  }, [API_BASE_URL, summarizeWorkflow])

  const handleGenerate = useCallback(async () => {
    const userPrompt = prompt.trim()
    if (!userPrompt || isGenerating) return

    await requestWorkflow(
      "/workflows/generate",
      { request: userPrompt, model },
      { kind: "generate", request: userPrompt }
    )
  }, [prompt, isGenerating, model, requestWorkflow])

  const handleModify = useCallback(async () => {
    const instruction = prompt.trim()
    if (!instruction || isGenerating) return
    if (!nodes.length) {
      alert("Add or generate a workflow first before modifying.")
      return
    }

    await requestWorkflow(
      "/workflows/modify",
      {
        instruction,
        model,
        workflow: { nodes, edges },
      },
      { kind: "modify", instruction }
    )
  }, [prompt, isGenerating, nodes, edges, model, requestWorkflow])

  const handleRegenerate = useCallback(async () => {
    if (!lastAction || isGenerating) return

    if (lastAction.kind === "modify") {
      await requestWorkflow(
        "/workflows/modify",
        {
          instruction: lastAction.instruction,
          model,
          workflow: { nodes, edges },
        },
        lastAction
      )
      return
    }

    await requestWorkflow(
      "/workflows/generate",
      { request: lastAction.request, model },
      lastAction
    )
  }, [lastAction, isGenerating, model, nodes, edges, requestWorkflow])

  const handleConfirmPreview = useCallback(() => {
    if (!pendingWorkflow) return
    loadGeneratedWorkflow(pendingWorkflow)
    setPendingWorkflow(null)
    setPendingSummary("")
    setGenerateError("")
  }, [pendingWorkflow, loadGeneratedWorkflow])

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)"}}>
        <style jsx>{`

          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 24px rgba(59,130,246,0.25), 0 0 56px rgba(59,130,246,0.08); }
            50% { box-shadow: 0 0 36px rgba(59,130,246,0.45), 0 0 72px rgba(59,130,246,0.15); }
          }
          @keyframes loader-dot {
            0%, 100% { opacity: 0.2; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-3px); }
          }
        `}</style>
        <div style={{textAlign:'center'}}>
          <div style={{
            width:'52px', height:'52px',
            background:'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            borderRadius:'14px',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px auto',
            animation:'pulse-glow 2.2s ease-in-out infinite',
          }}>
            <span style={{color:'white', fontWeight:800, fontSize:'17px', letterSpacing:'-0.5px'}}>AF</span>
          </div>
          <div style={{color:'rgba(241,245,249,0.4)', fontSize:'11px', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px'}}>Loading</div>
          <div style={{display:'flex', justifyContent:'center', gap:'6px'}}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width:'5px', height:'5px', borderRadius:'50%',
                background:'rgba(59,130,246,0.8)',
                animation:`loader-dot 1.1s ease-in-out ${i * 0.18}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Only redirect if we're explicitly not authenticated
  // This prevents redirection when refreshing
  if (isAuthenticated === false) {
    return null // Will redirect to homepage via the useEffect
  }

  const hasWorkflowNodes = nodes.length > 0
  const showOnboardingBanner = !onboardingDismissed &&
    (!onboardingStatus.hasGoogleToken || !hasWorkflowNodes || !onboardingStatus.hasRunWorkflow)

  // Show main app
  return (
    <div style={{display:'flex', flexDirection:'row', height:isMobile ? '100dvh' : '100vh', background:'#020617', fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)", overflow:'hidden'}}>
      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; }

        body {
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          background: #020617;
          margin: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Scrollbars */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(51,65,85,0.8); border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(71,85,105,0.9); }

        /* Utility classes */
        .gradient-text {
          background: linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid #334155;
        }
        html.light .glass {
          background: #ffffff;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          border: 1px solid #e2e8f0;
        }

        .glow { box-shadow: 0 0 20px rgba(59, 130, 246, 0.25); }

        /* ReactFlow nodes */
        .react-flow__node {
          background: transparent !important;
          border: none !important;
          color: white !important;
          font-family: var(--font-space-grotesk, system-ui, sans-serif) !important;
        }
        .react-flow__node-default {
          background: transparent !important;
          border: none !important;
          color: white !important;
          font-family: var(--font-space-grotesk, system-ui, sans-serif) !important;
        }
        .react-flow__node > div { background: transparent !important; }
        .react-flow__node * { color: inherit !important; }

        /* Handles */
        .react-flow__handle {
          background: rgba(59, 130, 246, 0.35) !important;
          border: 1.5px solid rgba(148,163,184,0.65) !important;
          width: 10px !important;
          height: 10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          transition: background 0.12s ease, transform 0.12s ease !important;
        }
        .react-flow__handle:hover {
          background: #3B82F6 !important;
          transform: translateX(-50%) scale(1.35) !important;
        }
        .react-flow__handle-top { top: -5px !important; }
        .react-flow__handle-bottom { bottom: -5px !important; }
        .react-flow__handle-connecting { background: #3B82F6 !important; }
        .react-flow__handle-valid { background: #22c55e !important; }

        /* Edges */
        .react-flow__edge-path {
          stroke: rgba(59, 130, 246, 0.65) !important;
          stroke-width: 1.5px !important;
        }
        .react-flow__connection-line {
          stroke: rgba(59, 130, 246, 0.9) !important;
          stroke-width: 1.5px !important;
        }
        .react-flow svg defs marker path {
          fill: rgba(59, 130, 246, 0.65) !important;
          stroke: rgba(59, 130, 246, 0.65) !important;
        }
        .react-flow__edge.animated .react-flow__edge-path {
          stroke-dasharray: none !important;
          animation: none !important;
        }

        /* Controls panel */
        .react-flow__controls {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 10px !important;
          padding: 3px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          overflow: hidden !important;
        }
        .react-flow__controls button {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid #334155 !important;
          color: #64748b !important;
          border-radius: 0 !important;
          margin: 0 !important;
          width: 28px !important;
          height: 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: color 0.12s ease, background 0.12s ease !important;
        }
        .react-flow__controls button:last-child { border-bottom: none !important; }
        .react-flow__controls button:hover {
          background: rgba(59,130,246,0.1) !important;
          color: #F1F5F9 !important;
        }

        .react-flow__background { background: #020617 !important; }
        .react-flow__selection {
          background: rgba(59, 130, 246, 0.06) !important;
          border: 1px dashed rgba(59, 130, 246, 0.4) !important;
        }

        /* ── Light mode ── */
        html.light body { background: #f8fafc !important; }
        html.light .rf-canvas-bg { background: #f1f5f9 !important; }
        html.light .react-flow__background { background: #f1f5f9 !important; }
        html.light .react-flow { background: #f1f5f9 !important; }
        html.light .react-flow__pane { background: #f1f5f9 !important; }
        html.light .react-flow__controls {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        html.light .react-flow__controls button {
          border-bottom-color: #e2e8f0 !important;
          color: #475569 !important;
        }
        html.light .react-flow__controls button:hover {
          background: rgba(59,130,246,0.08) !important;
          color: #1e293b !important;
        }

        @media (max-width: 900px) {
          .react-flow__controls {
            left: 12px !important;
            bottom: 102px !important;
            transform: scale(0.92);
            transform-origin: bottom left;
          }
        }
      `}</style>

      {/* Particle Background */}
      <ParticleBackground />

      {/* ── Left Sidebar Nav ── */}
      {!isMobile && <TopNav />}

      {/* ── Content Area ── */}
      <div style={{display:'flex', flexDirection:'column', flex:1, overflow:'hidden'}}>
      {/* ── Canvas Toolbar ── */}
      <div style={{
        height: '48px',
        minHeight: '48px',
        background: isLight ? '#f8fafc' : '#0f172a',
        borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 8px' : '0 14px',
        flexShrink: 0,
        zIndex: 39,
      }}>
        <div style={{ width:'100%', overflowX: 'hidden', overflowY:'hidden' }}>
          <div style={{ minWidth: 'unset' }}>
            <WorkflowControls />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{display:'flex', flex:1, overflow:'hidden', position:'relative'}}>
        {showOnboardingBanner && (
          <div style={{
            position: 'absolute',
            top: isMobile ? '56px' : '62px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: isMobile ? 'calc(100% - 20px)' : 'min(980px, calc(100% - 56px))',
            zIndex: 42,
            borderRadius: '14px',
            border: `1px solid ${isLight ? '#bfdbfe' : '#1d4ed8'}`,
            background: isLight
              ? 'linear-gradient(135deg, rgba(219,234,254,0.95), rgba(239,246,255,0.96))'
              : 'linear-gradient(135deg, rgba(30,58,138,0.42), rgba(15,23,42,0.9))',
            boxShadow: isLight
              ? '0 10px 24px rgba(30,58,138,0.15)'
              : '0 16px 36px rgba(15,23,42,0.55)',
            padding: isMobile ? '12px' : '14px 16px',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}>
            <div style={{display:'flex', alignItems:'start', justifyContent:'space-between', gap:'12px'}}>
              <div>
                <div style={{fontSize:'14px', fontWeight:700, color: isLight ? '#1e3a8a' : '#dbeafe', marginBottom:'4px'}}>
                  Get Started: Connect your account in 3 quick steps
                </div>
                <div style={{fontSize:'12px', color: isLight ? '#334155' : '#bfdbfe'}}>
                  This setup ensures Gmail, Sheets, and Drive run using your own Google account.
                </div>
              </div>
              <button
                onClick={dismissOnboarding}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: isLight ? '#64748b' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                }}
                title="Dismiss"
              >
                x
              </button>
            </div>

            <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap:'10px', marginTop:'12px'}}>
              <div style={{padding:'10px', borderRadius:'10px', border:`1px solid ${isLight ? '#bfdbfe' : '#334155'}`, background:isLight ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.55)'}}>
                <div style={{fontSize:'11px', color:isLight ? '#475569' : '#94a3b8', marginBottom:'4px'}}>Step 1</div>
                <div style={{fontSize:'12px', fontWeight:600, color:isLight ? '#1e293b' : '#e2e8f0'}}>Connect Google token</div>
                <div style={{fontSize:'11px', marginTop:'6px', color: onboardingStatus.hasGoogleToken ? '#22c55e' : '#f59e0b'}}>
                  {onboardingStatus.hasGoogleToken ? 'Completed' : 'Pending'}
                </div>
              </div>

              <div style={{padding:'10px', borderRadius:'10px', border:`1px solid ${isLight ? '#bfdbfe' : '#334155'}`, background:isLight ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.55)'}}>
                <div style={{fontSize:'11px', color:isLight ? '#475569' : '#94a3b8', marginBottom:'4px'}}>Step 2</div>
                <div style={{fontSize:'12px', fontWeight:600, color:isLight ? '#1e293b' : '#e2e8f0'}}>Build a workflow</div>
                <div style={{fontSize:'11px', marginTop:'6px', color: hasWorkflowNodes ? '#22c55e' : '#f59e0b'}}>
                  {hasWorkflowNodes ? 'Completed' : 'Pending'}
                </div>
              </div>

              <div style={{padding:'10px', borderRadius:'10px', border:`1px solid ${isLight ? '#bfdbfe' : '#334155'}`, background:isLight ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.55)'}}>
                <div style={{fontSize:'11px', color:isLight ? '#475569' : '#94a3b8', marginBottom:'4px'}}>Step 3</div>
                <div style={{fontSize:'12px', fontWeight:600, color:isLight ? '#1e293b' : '#e2e8f0'}}>Run once</div>
                <div style={{fontSize:'11px', marginTop:'6px', color: onboardingStatus.hasRunWorkflow ? '#22c55e' : '#f59e0b'}}>
                  {onboardingStatus.hasRunWorkflow ? 'Completed' : 'Pending'}
                </div>
              </div>
            </div>

            <div style={{display:'flex', gap:'8px', marginTop:'12px', flexWrap: isMobile ? 'wrap' : 'nowrap'}}>
              <button
                onClick={() => router.push('/settings')}
                style={{
                  border:'none',
                  borderRadius:'8px',
                  background:'#2563eb',
                  color:'#fff',
                  padding:'8px 12px',
                  fontSize:'12px',
                  fontWeight:600,
                  cursor:'pointer',
                }}
              >
                Open API Keys
              </button>
              <button
                onClick={refreshOnboardingStatus}
                style={{
                  border:`1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                  borderRadius:'8px',
                  background:isLight ? '#ffffff' : '#1e293b',
                  color:isLight ? '#334155' : '#cbd5e1',
                  padding:'8px 12px',
                  fontSize:'12px',
                  fontWeight:600,
                  cursor:'pointer',
                }}
              >
                {onboardingStatus.checking ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>
          </div>
        )}

        {/* Left Sidebar – node palette (desktop) */}
        {!isMobile && (
          <div style={{
            width:'230px', minWidth:'230px',
            borderRight:`1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
            background: isLight ? '#f8fafc' : '#0f172a', overflow:'hidden',
            display:'flex', flexDirection:'column', flexShrink:0,
          }}>
            <NodeSidebar />
          </div>
        )}

        {/* Canvas */}
        <div style={{flex:1, position:'relative', overflow:'hidden'}} className="rf-canvas-bg">
          {isMobile && (
            <div style={{
              position:'absolute',
              top: showOnboardingBanner ? '210px' : '12px',
              left:'10px',
              right:'10px',
              zIndex: 31,
              display:'flex',
              justifyContent:'space-between',
              pointerEvents:'none',
            }}>
              <button
                onClick={() => {
                  setMobilePaletteOpen((prev) => !prev)
                  setMobileInspectorOpen(false)
                }}
                style={{
                  pointerEvents:'auto',
                  border:'none',
                  borderRadius:'9px',
                  background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.92)',
                  color: isLight ? '#0f172a' : '#e2e8f0',
                  borderWidth:'1px',
                  borderStyle:'solid',
                  borderColor: isLight ? '#cbd5e1' : '#334155',
                  padding:'8px 10px',
                  fontSize:'12px',
                  fontWeight:700,
                  cursor:'pointer',
                  fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)",
                }}
              >
                {mobilePaletteOpen ? 'Close Nodes' : 'Nodes'}
              </button>

              <button
                onClick={() => {
                  setMobileInspectorOpen((prev) => !prev)
                  setMobilePaletteOpen(false)
                }}
                style={{
                  pointerEvents:'auto',
                  border:'none',
                  borderRadius:'9px',
                  background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.92)',
                  color: isLight ? '#0f172a' : '#e2e8f0',
                  borderWidth:'1px',
                  borderStyle:'solid',
                  borderColor: isLight ? '#cbd5e1' : '#334155',
                  padding:'8px 10px',
                  fontSize:'12px',
                  fontWeight:700,
                  cursor:'pointer',
                  fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)",
                }}
              >
                {mobileInspectorOpen ? 'Close Panel' : 'Panel'}
              </button>
            </div>
          )}

          {isMobile && mobilePaletteOpen && (
            <div style={{
              position:'absolute',
              top: showOnboardingBanner ? '250px' : '54px',
              left:'10px',
              right:'10px',
              bottom:'98px',
              zIndex: 34,
              borderRadius:'12px',
              overflow:'hidden',
              border:`1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              boxShadow: isLight ? '0 10px 30px rgba(15,23,42,0.18)' : '0 14px 36px rgba(2,6,23,0.55)',
            }}>
              <NodeSidebar />
            </div>
          )}

          {isMobile && mobileInspectorOpen && (
            <div style={{
              position:'absolute',
              top: showOnboardingBanner ? '250px' : '54px',
              left:'10px',
              right:'10px',
              bottom:'98px',
              zIndex: 34,
              borderRadius:'12px',
              border:`1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              background: isLight ? 'rgba(248,250,252,0.98)' : 'rgba(15,23,42,0.97)',
              boxShadow: isLight ? '0 10px 30px rgba(15,23,42,0.18)' : '0 14px 36px rgba(2,6,23,0.55)',
              overflowY:'auto',
              padding:'12px',
            }}>
              <div style={{fontSize:'10px', fontWeight:'700', color: isLight ? '#94a3b8' : '#64748b', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px'}}>AI Model</div>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                style={{
                  width:'100%', boxSizing:'border-box',
                  background: isLight ? '#ffffff' : '#1e293b',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                  borderRadius:'7px', padding:'8px 10px',
                  color: isLight ? '#1e293b' : '#F1F5F9', fontSize:'13px',
                  fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)", outline:'none',
                  cursor:'pointer',
                }}
              >
                {availableModels.map(m => (
                  <option key={m} value={m} style={{background: isLight ? '#ffffff' : '#1e293b'}}>{m}</option>
                ))}
              </select>

              <div style={{height:'1px', background: isLight ? '#e2e8f0' : '#1e293b', margin:'12px 0'}} />

              <div style={{fontSize:'10px', fontWeight:'700', color: isLight ? '#94a3b8' : '#64748b', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px'}}>Canvas</div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                {[
                  { label:'Nodes', value: nodes.length },
                  { label:'Edges', value: edges.length },
                ].map(({label, value}) => (
                  <div key={label} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'9px 10px', borderRadius:'7px',
                    background: isLight ? '#f1f5f9' : 'rgba(30,41,59,0.5)',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                  }}>
                    <span style={{fontSize:'12px', color:'#64748b'}}>{label}</span>
                    <span style={{fontSize:'13px', fontWeight:'600', color: value > 0 ? '#3B82F6' : (isLight ? '#cbd5e1' : '#334155')}}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{height:'1px', background: isLight ? '#e2e8f0' : '#1e293b', margin:'12px 0'}} />

              <div style={{fontSize:'10px', fontWeight:'700', color: isLight ? '#94a3b8' : '#64748b', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px'}}>Tips</div>
              <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                {[
                  'Tap a node chip to add it to canvas',
                  'Drag from a node handle to connect',
                  'Use toolbar to save or run',
                ].map((tip, i) => (
                  <div key={i} style={{display:'flex', gap:'7px', alignItems:'flex-start'}}>
                    <div style={{width:'4px', height:'4px', borderRadius:'50%', background:'rgba(59,130,246,0.5)', flexShrink:0, marginTop:'6px'}} />
                    <span style={{fontSize:'12px', color: isLight ? '#64748b' : '#94a3b8', lineHeight:'1.5'}}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            style={{ width: '100%', height: '100%' }}
            connectionLineStyle={{ stroke: 'rgba(59,130,246,0.9)', strokeWidth: 1.5 }}
            defaultEdgeOptions={{
              style: { stroke: 'rgba(59,130,246,0.65)', strokeWidth: 1.5 },
              type: 'smoothstep',
              animated: false,
              markerEnd: {
                type: 'arrowclosed',
                color: 'rgba(59,130,246,0.65)',
                width: 16,
                height: 16,
              }
            }}
          >
            <Background
              color="rgba(148,163,184,0.12)"
              gap={24}
              size={1}
              variant="dots"
            />
            <Controls
              style={{
                background: '#0e0e0e',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />
          </ReactFlow>

          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: isMobile ? '98px' : '12px',
            transform: 'translateX(-50%)',
            width: isMobile ? 'calc(100% - 16px)' : 'min(760px, calc(100% - 24px))',
            zIndex: 20,
            pointerEvents: 'none',
          }}>
            {dockCollapsed ? (
              <button
                onClick={() => setDockCollapsed(false)}
                title="Expand workflow generator"
                style={{
                  pointerEvents: 'auto',
                  width: isMobile ? '36px' : '42px',
                  height: isMobile ? '36px' : '42px',
                  borderRadius: '999px',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.9)',
                  color: isLight ? '#2563eb' : '#38bdf8',
                  cursor: 'pointer',
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 700,
                  display: 'block',
                  margin: isMobile ? '0 0 0 auto' : '0 auto',
                  boxShadow: isLight
                    ? '0 6px 18px rgba(15,23,42,0.14)'
                    : '0 8px 20px rgba(2,6,23,0.55)',
                }}
              >
                ⚡
              </button>
            ) : (
            <div style={{
              pointerEvents: 'auto',
              borderRadius: '12px',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(51,65,85,0.85)'}`,
              background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: isLight
                ? '0 6px 24px rgba(15,23,42,0.12)'
                : '0 10px 28px rgba(2,6,23,0.55)',
              padding: '10px',
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <input
                  placeholder="Describe your workflow..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleGenerate()
                    }
                  }}
                  style={{
                    flex: isMobile ? '1 1 100%' : 1,
                    height: '40px',
                    borderRadius: '9px',
                    border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                    background: isLight ? '#ffffff' : '#0b1220',
                    color: isLight ? '#0f172a' : '#e2e8f0',
                    padding: '0 12px',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                  }}
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  style={{
                    height: '40px',
                    minWidth: isMobile ? 'calc(50% - 4px)' : '150px',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                    background: isGenerating || !prompt.trim()
                      ? (isLight ? '#cbd5e1' : '#334155')
                      : 'linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)',
                    color: isGenerating || !prompt.trim()
                      ? (isLight ? '#64748b' : '#94a3b8')
                      : '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    transition: 'all 0.15s ease',
                    boxShadow: isGenerating || !prompt.trim() ? 'none' : '0 6px 20px rgba(37,99,235,0.35)',
                    fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                  }}
                >
                  {isGenerating ? 'Generating...' : 'Generate Workflow'}
                </button>
                <button
                  onClick={handleModify}
                  disabled={isGenerating || !prompt.trim() || !nodes.length}
                  title={nodes.length ? "Modify current workflow using this prompt" : "Add nodes first, then modify"}
                  style={{
                    height: '40px',
                    minWidth: isMobile ? 'calc(50% - 4px)' : '88px',
                    borderRadius: '9px',
                    border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                    background: isGenerating || !prompt.trim() || !nodes.length
                      ? (isLight ? '#e2e8f0' : '#334155')
                      : (isLight ? '#f8fafc' : '#0b1220'),
                    color: isGenerating || !prompt.trim() || !nodes.length
                      ? (isLight ? '#94a3b8' : '#94a3b8')
                      : (isLight ? '#0f172a' : '#e2e8f0'),
                    cursor: isGenerating || !prompt.trim() || !nodes.length ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                  }}
                >
                  Modify
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating || !lastAction}
                  title="Regenerate last AI result"
                  style={{
                    height: '40px',
                    minWidth: isMobile ? 'calc(50% - 4px)' : '108px',
                    borderRadius: '9px',
                    border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                    background: isLight ? '#ffffff' : '#0b1220',
                    color: isLight ? '#1e293b' : '#cbd5e1',
                    cursor: isGenerating || !lastAction ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                  }}
                >
                  Regenerate
                </button>
                <button
                  onClick={() => setDockCollapsed(true)}
                  title="Collapse workflow generator"
                  style={{
                    height: '40px',
                    minWidth: isMobile ? 'calc(50% - 4px)' : '40px',
                    borderRadius: '9px',
                    border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                    background: isLight ? '#ffffff' : '#0b1220',
                    color: isLight ? '#475569' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '18px',
                    lineHeight: 1,
                    fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                  }}
                >
                  -
                </button>
              </div>

              {pendingWorkflow && (
                <div style={{
                  marginTop: '8px',
                  borderRadius: '9px',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  background: isLight ? '#ffffff' : '#0b1220',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexDirection: isMobile ? 'column' : 'row',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: isLight ? '#334155' : '#cbd5e1',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    Generated workflow: {pendingSummary}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={handleConfirmPreview}
                      style={{
                        height: '30px',
                        borderRadius: '7px',
                        border: 'none',
                        background: '#16a34a',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '0 10px',
                        cursor: 'pointer',
                        fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      style={{
                        height: '30px',
                        borderRadius: '7px',
                        border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                        background: isLight ? '#f8fafc' : '#1e293b',
                        color: isLight ? '#334155' : '#e2e8f0',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '0 10px',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                      }}
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}

              {(isGenerating || generateError) && (
                <div style={{
                  marginTop: '7px',
                  fontSize: '11px',
                  color: generateError
                    ? (isLight ? '#b91c1c' : '#fda4af')
                    : (isLight ? '#475569' : '#94a3b8'),
                  paddingLeft: '2px',
                }}>
                  {isGenerating ? 'Generating workflow...' : generateError}
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Right Panel – model + stats */}
        {!isMobile && (
        <div style={{
          width:'200px', minWidth:'200px',
          borderLeft:`1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          background: isLight ? '#f8fafc' : '#0f172a', display:'flex', flexDirection:'column',
          flexShrink:0, padding:'14px 12px', gap:'16px', overflowY:'auto',
          fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)",
        }}>
          {/* Section: AI Model */}
          <div>
            <div style={{fontSize:'10px', fontWeight:'700', color: isLight ? '#94a3b8' : '#64748b', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px'}}>AI Model</div>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{
                width:'100%', boxSizing:'border-box',
                background: isLight ? '#ffffff' : '#1e293b',
                border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                borderRadius:'7px', padding:'6px 8px',
                color: isLight ? '#1e293b' : '#F1F5F9', fontSize:'12px',
                fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)", outline:'none',
                cursor:'pointer',
              }}
            >
              {availableModels.map(m => (
                <option key={m} value={m} style={{background: isLight ? '#ffffff' : '#1e293b'}}>{m}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div style={{height:'1px', background: isLight ? '#e2e8f0' : '#1e293b'}} />

          {/* Section: Canvas Stats */}
          <div>
            <div style={{fontSize:'10px', fontWeight:'700', color: isLight ? '#94a3b8' : '#64748b', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px'}}>Canvas</div>
            <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
              {[
                { label:'Nodes', value: nodes.length },
                { label:'Edges', value: edges.length },
              ].map(({label, value}) => (
                <div key={label} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'6px 10px', borderRadius:'7px',
                  background: isLight ? '#f1f5f9' : 'rgba(30,41,59,0.5)',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                }}>
                  <span style={{fontSize:'12px', color:'#64748b'}}>{label}</span>
                  <span style={{fontSize:'13px', fontWeight:'600', color: value > 0 ? '#3B82F6' : (isLight ? '#cbd5e1' : '#334155')}}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{height:'1px', background: isLight ? '#e2e8f0' : '#1e293b'}} />

          {/* Section: Tips */}
          <div>
            <div style={{fontSize:'10px', fontWeight:'700', color: isLight ? '#94a3b8' : '#64748b', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px'}}>Tips</div>
            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
              {[
                'Click a node chip to add it to canvas',
                'Drag from a node handle to connect',
                'Use toolbar to Save or Run',
              ].map((tip, i) => (
                <div key={i} style={{display:'flex', gap:'7px', alignItems:'flex-start'}}>
                  <div style={{width:'4px', height:'4px', borderRadius:'50%', background:'rgba(59,130,246,0.5)', flexShrink:0, marginTop:'5px'}} />
                  <span style={{fontSize:'11px', color: isLight ? '#94a3b8' : '#475569', lineHeight:'1.5'}}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {isMobile && (
          <MobileBottomNav
            items={MOBILE_NAV_ITEMS}
            pathname={pathname}
            onNavigate={(href) => router.push(href)}
            isLight={isLight}
          />
        )}
      </div>
      </div>
    </div>
  )
}
