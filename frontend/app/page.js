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

const nodeTypes = {
  default: CustomNode,
}

export default function Home() {
  const { nodes, edges, setNodes, setEdges } = useFlowStore()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const router = useRouter()

  // Redirect unauthenticated users to homepage
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/homepage')
    }
  }, [loading, isAuthenticated, router])

  // Check authentication on app load
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Handle authentication errors
  useEffect(() => {
    const handleAuthError = () => {
      if (!isAuthenticated && !loading) {
        console.log("User not authenticated, redirecting to login")
      }
    }
    
    handleAuthError()
  }, [isAuthenticated, loading])

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
        style: { stroke: "#ff6d6d", strokeWidth: 2 },
        animated: false, // Remove animation
        markerEnd: {
          type: 'arrowclosed',
          color: '#ff6d6d',
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
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#ff6d6d] to-[#ff9500] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">AF</span>
          </div>
          <div className="text-white text-lg">Loading AutoFlow...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to homepage
  }

  // Show main app if authenticated
  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a]">
      <style jsx global>{`
        /* Override ReactFlow default styles */
        .react-flow__node {
          background: transparent !important;
          border: none !important;
          color: white !important;
        }
        
        .react-flow__node-default {
          background: transparent !important;
          border: none !important;
          color: white !important;
        }
        
        .react-flow__handle {
          background: #666666 !important;
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
          background: #ff6d6d !important;
        }
        
        .react-flow__handle-valid {
          background: #2ecc71 !important;
        }
        
        .react-flow__edge {
          stroke: #ff6d6d !important;
        }
        
        .react-flow__edge-path {
          stroke: #ff6d6d !important;
          stroke-dasharray: none !important; /* Remove dash animation */
        }
        
        .react-flow__connection-line {
          stroke: #ff6d6d !important;
        }
        
        /* Arrow marker styles */
        .react-flow__arrowhead {
          fill: #ff6d6d !important;
          stroke: #ff6d6d !important;
        }
        
        .react-flow__edge-textwrapper {
          background: rgba(42, 42, 42, 0.9) !important;
          color: white !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
        }
        
        /* Custom arrow marker */
        .react-flow svg defs marker path {
          fill: #ff6d6d !important;
          stroke: #ff6d6d !important;
        }
        
        /* Remove edge animations */
        .react-flow__edge.animated .react-flow__edge-path {
          stroke-dasharray: none !important;
          animation: none !important;
        }
        
        .react-flow__controls {
          background: #2a2a2a !important;
          border: 1px solid #404040 !important;
        }
        
        .react-flow__controls button {
          background: #3a3a3a !important;
          border: 1px solid #666666 !important;
          color: #ffffff !important;
        }
        
        .react-flow__controls button:hover {
          background: #4a4a4a !important;
        }
        
        .react-flow__background {
          background: #1a1a1a !important;
        }
        
        /* Ensure nodes don't have any white backgrounds */
        .react-flow__node > div {
          background: transparent !important;
        }
        
        /* Remove any default node styling */
        .react-flow__node * {
          color: inherit !important;
        }
      `}</style>
      
      {/* Profile Bar */}
      <ProfileBar />
      
      {/* Workflow Controls */}
      <WorkflowControls />
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-80 border-r border-[#404040]">
          <NodeSidebar />
        </div>

        {/* Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#1a1a1a]"
            style={{ background: '#1a1a1a' }}
            connectionLineStyle={{ stroke: "#ff6d6d", strokeWidth: 2 }}
            defaultEdgeOptions={{
              style: { stroke: "#ff6d6d", strokeWidth: 2 },
              type: "smoothstep",
              animated: false, // Remove animation
              markerEnd: {
                type: 'arrowclosed',
                color: '#ff6d6d',
                width: 20,
                height: 20
              }
            }}
          >
            <Background color="#333" gap={20} />
            <Controls 
              className="bg-[#2a2a2a] border border-[#404040]"
              style={{ background: '#2a2a2a', border: '1px solid #404040' }}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
