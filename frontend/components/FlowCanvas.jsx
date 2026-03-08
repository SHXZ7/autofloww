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
      className="h-screen w-full"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#334155 #0f172a",
      }}
    >
      <style jsx>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        .react-flow__node { font-family: inherit; }
        .react-flow__edge-path { stroke: #3B82F6; stroke-width: 2.5; filter: drop-shadow(0 0 6px rgba(59,130,246,0.55)); }
        .react-flow__edge.selected .react-flow__edge-path { stroke: #93C5FD; stroke-width: 2.5; filter: drop-shadow(0 0 8px rgba(147,197,253,0.7)); }
        .react-flow__edge:hover .react-flow__edge-path { stroke: #60A5FA; filter: drop-shadow(0 0 8px rgba(96,165,250,0.7)); }
        .react-flow__connection-line { stroke: #3B82F6; stroke-width: 2.5; stroke-dasharray: 6 3; filter: drop-shadow(0 0 4px rgba(59,130,246,0.5)); }
        .react-flow__handle { border: 2.5px solid #ffffff; width: 12px; height: 12px; box-shadow: 0 0 6px rgba(59,130,246,0.6); }
        .react-flow__handle:hover { transform: translateX(-50%) scale(1.3) !important; box-shadow: 0 0 10px rgba(59,130,246,0.9); }
        .react-flow__handle-connecting { background: #60A5FA !important; box-shadow: 0 0 10px rgba(96,165,250,0.9) !important; }
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
            style: { stroke: "#3B82F6", strokeWidth: 2.5 },
            type: "bezier",
            markerEnd: {
              type: "arrowclosed",
              color: "#3B82F6",
              width: 16,
              height: 16,
            },
          }}
        >
          <MiniMap
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
            }}
            nodeColor={(node) => {
              const nodeTypeColors = {
                gpt: "#8B5CF6", claude: "#8B5CF6", llama: "#8B5CF6", gemini: "#8B5CF6", mistral: "#8B5CF6",
                email: "#22C55E", discord: "#22C55E", twilio: "#22C55E", social_media: "#22C55E",
                webhook: "#3B82F6", google_sheets: "#3B82F6", file_upload: "#3B82F6",
                schedule: "#F59E0B", image_generation: "#F59E0B",
                document_parser: "#06B6D4", report_generator: "#06B6D4",
              }
              return nodeTypeColors[node.type] || "#64748b"
            }}
          />
          <Controls
            style={{
              button: {
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                color: "#F1F5F9",
              },
            }}
          />
          <Background color="rgba(148,163,184,0.12)" gap={20} size={1} style={{ backgroundColor: "#020617" }} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
