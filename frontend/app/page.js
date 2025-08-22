"use client"
import { useCallback, useEffect } from "react"
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
import ProfileBar from "../components/ProfileBar"
import AuthPage from "../components/auth/AuthPage"
import WorkflowControls from "../components/WorkflowControls"
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'

// Dynamically import particle background to avoid SSR issues
const ParticleBackground = dynamic(() => import("../components/ParticleBackground"), {
  ssr: false
})

const nodeTypes = {
  default: CustomNode,
}

export default function Home() {
  const { nodes, edges, setNodes, setEdges } = useFlowStore()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const router = useRouter()

  // Check authentication on app load
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          .loading-container {
            font-family: 'Inter', sans-serif;
          }
          
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
            50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.6); }
          }
          
          .pulse-glow {
            animation: pulse-glow 2s infinite;
          }
        `}</style>
        <div className="loading-container text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-xl flex items-center justify-center mx-auto mb-4 pulse-glow">
            <span className="text-white font-bold text-2xl">AF</span>
          </div>
          <div className="text-white text-lg font-medium">Loading AutoFlow...</div>
        </div>
      </div>
    )
  }

  // Only redirect if we're explicitly not authenticated
  // This prevents redirection when refreshing
  if (isAuthenticated === false) {
    return null // Will redirect to homepage via the useEffect
  }

  // Show main app - either authenticated or still determining auth status
  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] font-['Inter']">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0a;
        }
        
        .glow {
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .neon-border {
          border: 1px solid transparent;
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(255, 107, 53, 0.3)) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: exclude;
        }
        
        /* ReactFlow custom styling */
        .react-flow__node {
          background: transparent !important;
          border: none !important;
          color: white !important;
          font-family: 'Inter', sans-serif !important;
        }
        
        .react-flow__node-default {
          background: transparent !important;
          border: none !important;
          color: white !important;
          font-family: 'Inter', sans-serif !important;
        }
        
        .react-flow__handle {
          background: rgba(0, 212, 255, 0.6) !important;
          border: 2px solid #ffffff !important;
          width: 12px !important;
          height: 12px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
        }
        
        .react-flow__handle-top {
          top: -6px !important;
        }
        
        .react-flow__handle-bottom {
          bottom: -6px !important;
        }
        
        .react-flow__handle-connecting {
          background: #00D4FF !important;
        }
        
        .react-flow__handle-valid {
          background: #2ecc71 !important;
        }
        
        .react-flow__edge {
          stroke: #00D4FF !important;
        }
        
        .react-flow__edge-path {
          stroke: #00D4FF !important;
          stroke-dasharray: none !important;
          stroke-width: 2px !important;
        }
        
        .react-flow__connection-line {
          stroke: #00D4FF !important;
        }
        
        .react-flow__arrowhead {
          fill: #00D4FF !important;
          stroke: #00D4FF !important;
        }
        
        .react-flow__edge-textwrapper {
          background: rgba(10, 10, 10, 0.8) !important;
          color: white !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          border: 1px solid rgba(0, 212, 255, 0.3) !important;
        }
        
        .react-flow svg defs marker path {
          fill: #00D4FF !important;
          stroke: #00D4FF !important;
        }
        
        .react-flow__edge.animated .react-flow__edge-path {
          stroke-dasharray: none !important;
          animation: none !important;
        }
        
        .react-flow__controls {
          background: rgba(20, 20, 20, 0.7) !important;
          border: 1px solid rgba(0, 212, 255, 0.2) !important;
          border-radius: 8px !important;
          padding: 4px !important;
        }
        
        .react-flow__controls button {
          background: rgba(40, 40, 40, 0.8) !important;
          border: 1px solid rgba(0, 212, 255, 0.2) !important;
          color: #ffffff !important;
          border-radius: 4px !important;
          margin: 2px !important;
        }
        
        .react-flow__controls button:hover {
          background: rgba(60, 60, 60, 0.8) !important;
        }
        
        .react-flow__background {
          background: #0a0a0a !important;
        }
        
        .react-flow__node > div {
          background: transparent !important;
        }
        
        .react-flow__node * {
          color: inherit !important;
        }
      `}</style>
      
      {/* Background Particles */}
      <ParticleBackground />
      
      {/* Profile Bar */}
      <ProfileBar />
      
      {/* Workflow Controls */}
      <WorkflowControls />
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-80 border-r border-white/10">
          <NodeSidebar />
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#0a0a0a]"
            style={{ background: '#0a0a0a' }}
            connectionLineStyle={{ stroke: "#00D4FF", strokeWidth: 2 }}
            defaultEdgeOptions={{
              style: { stroke: "#00D4FF", strokeWidth: 2 },
              type: "smoothstep",
              animated: false,
              markerEnd: {
                type: 'arrowclosed',
                color: '#00D4FF',
                width: 20,
                height: 20
              }
            }}
          >
            <Background 
              color="#333" 
              gap={20} 
              size={1.5} 
              variant="dots"
            />
            <Controls 
              className="glass border border-[#404040]"
              style={{ 
                background: 'rgba(20, 20, 20, 0.7)', 
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.1)'
              }}
            />
          </ReactFlow>
          
          {/* Grid overlay with reduced opacity */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00D4FF" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
