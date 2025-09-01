// stores/flowStore.js
import { create } from "zustand"
import { nanoid } from "nanoid"

const API_BASE_URL =  "http://localhost:8000"

export const useFlowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  model: "openai/gpt-4o",
  currentWorkflowId: null,
  savedWorkflows: [],
  availableModels: [
    "openai/gpt-4o",
    "meta-llama/llama-3-8b-instruct",
    "google/gemini-pro",
    "anthropic/claude-3-opus",
    "mistral/mistral-7b-instruct",
  ],

  setNodes: (nodes) =>
    set({
      nodes: nodes.map((node) => ({
        ...node,
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
      })),
    }),
  setEdges: (edges) => set({ 
    edges: edges.map((edge, index) => ({
      ...edge,
      id: edge.id || `edge_${index}_${edge.source}_${edge.target}`, // Ensure ID exists
      markerEnd: {
        type: 'arrowclosed',
        color: '#ff6d6d',
        width: 20,
        height: 20
      },
      style: { stroke: "#ff6d6d", strokeWidth: 2 },
      animated: false
    }))
  }),

  setModel: (model) => set({ model }),

  updateNodeData: (id, newData) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...newData } } : node)),
    })),

  addNode: (typeOrNodeObject) => {
    const id = nanoid(6)
    const currentNodes = get().nodes

    // Calculate better positioning to avoid overlaps
    const gridSize = 200 // Spacing between nodes
    const maxCols = 4 // Max nodes per row
    const nodeCount = currentNodes.length
    const col = nodeCount % maxCols
    const row = Math.floor(nodeCount / maxCols)
    
    // Calculate position with some randomness but structured layout
    const baseX = 100 + (col * gridSize)
    const baseY = 100 + (row * gridSize)
    const randomOffsetX = Math.random() * 50 - 25 // -25 to +25
    const randomOffsetY = Math.random() * 50 - 25 // -25 to +25

    let newNode

    // Handle object passed directly (like Google Sheets node)
    if (typeof typeOrNodeObject === "object") {
      newNode = {
        ...typeOrNodeObject,
        id: typeOrNodeObject.id || id,
        position: typeOrNodeObject.position || { 
          x: baseX + randomOffsetX, 
          y: baseY + randomOffsetY 
        }
      }
    } else {
      // Handle string type
      const type = typeOrNodeObject
      let nodeData

      if (type === "email") {
        nodeData = {
          label: "EMAIL Node",
          to: "",
          subject: "AutoFlow Notification",
          body: "This is an automated email from AutoFlow.",
          from: "",
        }
      } else if (type === "webhook") {
        nodeData = {
          label: "WEBHOOK Node",
          webhook_url: `${API_BASE_URL}/webhook/trigger/${id}`,
          method: "POST",
          description: "Webhook trigger point",
        }
      } else if (type === "google_sheets") {
        nodeData = {
          label: "Google Sheets Node",
          spreadsheet_id: "",
          range: "Sheet1!A1",
          values: [],
        }
      } else if (type === "schedule") {
        nodeData = {
          label: "Schedule Node",
          cron: "0 9 * * *",
        }
      } else if (type === "file_upload") {
        nodeData = {
          label: "File Upload Node",
          path: "",
          name: "",
          mime_type: "",
          service: "google_drive",
          uploading: false,
          error: null
        }
      } else if (type === "twilio") {
        nodeData = {
          label: "Twilio Node",
          mode: "whatsapp",
          to: "",
          message: "",
        }
      } else if (type === "image_generation") {
        nodeData = {
          label: "Image Generation Node",
          prompt: "",
          provider: "openai",
          size: "1024x1024",
          quality: "standard",
        }
      } else if (type === "document_parser") {
        nodeData = {
          label: "Document Parser Node",
          file_path: "",
          supported_types: "PDF, Word, Excel, Text",
        }
      } else if (type === "discord") {
        nodeData = {
          label: "Discord Node",
          webhook_url: "",
          message: "",
          username: "AutoFlow Bot",
        }
      } else if (type === "report_generator") {
        nodeData = {
          label: "Report Generator Node",
          title: "AutoFlow Report",
          content:
            "# Workflow Report\n\nThis report was generated automatically by AutoFlow.\n\n## Summary\n\nWorkflow executed successfully.",
          format: "pdf",
        }
      } else if (type === "social_media") {
        nodeData = {
          label: "Social Media Node",
          platform: "twitter",
          content: "🚀 Posted automatically by AutoFlow!",
          image_path: "",
          webhook_url: "",
        }
      } else {
        nodeData = {
          label: `${type.toUpperCase()} Node`,
          model: get().model,
          prompt: "", // Add prompt field for AI nodes
        }
      }

      newNode = {
        id,
        type,
        data: nodeData,
        position: {
          x: baseX + randomOffsetX,
          y: baseY + randomOffsetY,
        },
      }
    }

    set({ nodes: [...currentNodes, newNode] })
  },

  // Save current workflow
  saveWorkflow: async (name) => {
    try {
      const { nodes, edges } = get()
      const token = localStorage.getItem("token")
      
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`${API_BASE_URL}/workflows/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name || `Workflow_${new Date().toISOString().slice(0, 16)}`,
          nodes,
          edges
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        set({ currentWorkflowId: result.workflow_id })
        await get().loadWorkflows() // Refresh workflow list
        return { success: true, workflowId: result.workflow_id }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Load all user workflows
  loadWorkflows: async () => {
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        return
      }

      const response = await fetch(`${API_BASE_URL}/workflows`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        set({ savedWorkflows: result.workflows })
      }
    } catch (error) {
      console.error("Failed to load workflows:", error)
    }
  },

  // Load a specific workflow
  loadWorkflow: async (workflowId) => {
    try {
      const { savedWorkflows } = get()
      const workflow = savedWorkflows.find(w => w._id === workflowId)
      
      if (workflow) {
        set({
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
          currentWorkflowId: workflowId
        })
        return { success: true }
      } else {
        return { success: false, error: "Workflow not found" }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Delete a workflow
  deleteWorkflow: async (workflowId) => {
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // If the deleted workflow was currently loaded, clear it
        const { currentWorkflowId } = get()
        if (currentWorkflowId === workflowId) {
          set({
            nodes: [],
            edges: [],
            currentWorkflowId: null
          })
        }
        
        // Refresh workflow list
        await get().loadWorkflows()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Create new workflow
  newWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      currentWorkflowId: null
    })
  },
}))
