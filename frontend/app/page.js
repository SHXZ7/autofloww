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
import AuthPage from "../components/auth/AuthPage"
import WorkflowControls from "../components/WorkflowControls"
import TopNav from "../components/TopNav"
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'

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
  file_upload:      CustomNode,
  twilio:           CustomNode,
  image_generation: CustomNode,
  document_parser:  CustomNode,
  discord:          CustomNode,
  report_generator: CustomNode,
  social_media:     CustomNode,
}

export default function Home() {
  const { nodes, edges, setNodes, setEdges, model, setModel, availableModels, loadTemplate } = useFlowStore()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const router = useRouter()
  const [isLight, setIsLight] = useState(false)
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

  // Show main app
  return (
    <div style={{display:'flex', flexDirection:'row', height:'100vh', background:'#020617', fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)", overflow:'hidden'}}>
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
      `}</style>

      {/* Particle Background */}
      <ParticleBackground />

      {/* ── Left Sidebar Nav ── */}
      <TopNav />

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
        padding: '0 14px',
        flexShrink: 0,
        zIndex: 39,
      }}>
        <WorkflowControls />
      </div>

      {/* ── Main Content ── */}
      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
        {/* Left Sidebar – node palette */}
        <div style={{
          width:'230px', minWidth:'230px',
          borderRight:`1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          background: isLight ? '#f8fafc' : '#0f172a', overflow:'hidden',
          display:'flex', flexDirection:'column', flexShrink:0,
        }}>
          <NodeSidebar />
        </div>

        {/* Canvas */}
        <div style={{flex:1, position:'relative', overflow:'hidden'}} className="rf-canvas-bg">
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
        </div>

        {/* Right Panel – model + stats */}
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
                  <span style={{fontSize:'12px', color: isLight ? '#64748b' : '#64748b'}}>{label}</span>
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
      </div>
      </div>
    </div>
  )
}
