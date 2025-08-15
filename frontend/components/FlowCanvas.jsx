"use client"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow"
import "reactflow/dist/style.css"
import { useFlowStore } from "../stores/flowStore"
import { useEffect } from "react"
import CustomNode from "./CustomNode"

const nodeTypes = {
  gpt: CustomNode,
  llama: CustomNode,
  gemini: CustomNode,
  claude: CustomNode,
  mistral: CustomNode,
  email: CustomNode,
  webhook: CustomNode,
  google_sheets: CustomNode,
  schedule: CustomNode,
  file_upload: CustomNode,
  twilio: CustomNode,
  image_generation: CustomNode,
  document_parser: CustomNode,
  discord: CustomNode,
  report_generator: CustomNode,
  social_media: CustomNode,
}

export default function FlowCanvas() {
  const { nodes, edges, setNodes, setEdges } = useFlowStore()
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([])
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([])

  // Sync store nodes with ReactFlow nodes
  useEffect(() => {
    setReactFlowNodes(nodes)
  }, [nodes, setReactFlowNodes])

  // Sync store edges with ReactFlow edges
  useEffect(() => {
    setReactFlowEdges(edges)
  }, [edges, setReactFlowEdges])

  const onConnect = (params) => {
    const newEdges = addEdge(params, reactFlowEdges)
    setReactFlowEdges(newEdges)
    setEdges(newEdges)
  }

  return (
    <div
      className="h-screen w-full bg-[#1e1e1e]"
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
        
        /* ReactFlow custom styles */
        .react-flow__node {
          font-family: inherit;
        }
        .react-flow__edge-path {
          stroke: #888888;
          stroke-width: 2;
        }
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #ff6d6d;
        }
        .react-flow__connection-line {
          stroke: #ff6d6d;
          stroke-width: 2;
        }
        .react-flow__handle {
          border: 2px solid #ffffff;
          width: 12px;
          height: 12px;
        }
        .react-flow__handle-connecting {
          background: #ff6d6d !important;
        }
      `}</style>

      <ReactFlowProvider>
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            style: { stroke: "#888888", strokeWidth: 2 },
            type: "smoothstep",
            markerEnd: {
              type: "arrowclosed",
              color: "#888888",
            },
          }}
        >
          <MiniMap
            style={{
              backgroundColor: "#252525",
              border: "1px solid #404040",
            }}
            nodeColor={(node) => {
              const nodeTypeColors = {
                gpt: "#4a90e2",
                claude: "#4a90e2",
                llama: "#4a90e2",
                gemini: "#4a90e2",
                mistral: "#4a90e2",
                email: "#2ecc71",
                discord: "#2ecc71",
                twilio: "#2ecc71",
                social_media: "#2ecc71",
                webhook: "#f39c12",
                google_sheets: "#f39c12",
                file_upload: "#f39c12",
                schedule: "#9b59b6",
                image_generation: "#9b59b6",
                document_parser: "#1abc9c",
                report_generator: "#1abc9c",
              }
              return nodeTypeColors[node.type] || "#666666"
            }}
          />
          <Controls
            style={{
              button: {
                backgroundColor: "#3a3a3a",
                border: "1px solid #666666",
                color: "#ffffff",
              },
            }}
          />
          <Background color="#404040" gap={20} size={1} style={{ backgroundColor: "#1e1e1e" }} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
