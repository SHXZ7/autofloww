"use client"
import FlowCanvas from "../components/FlowCanvas"
import NodeSidebar from "../components/NodeSidebar"

export default function AutoFlowStudio() {
  return (
    <div className="h-screen bg-[#1e1e1e] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-[#2a2a2a] border-r border-[#404040] flex-shrink-0">
        <NodeSidebar />
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <FlowCanvas />
      </div>
    </div>
  )
}
