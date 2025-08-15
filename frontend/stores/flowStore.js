// stores/flowStore.js
import { create } from "zustand"
import { nanoid } from "nanoid"

export const useFlowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  model: "openai/gpt-4o",
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
  setEdges: (edges) => set({ edges }),

  setModel: (model) => set({ model }),

  updateNodeData: (id, newData) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...newData } } : node)),
    })),

  addNode: (typeOrNodeObject) => {
    const id = nanoid(6)
    const currentNodes = get().nodes

    let newNode

    // Handle object passed directly (like Google Sheets node)
    if (typeof typeOrNodeObject === "object") {
      newNode = {
        ...typeOrNodeObject,
        id: typeOrNodeObject.id || id,
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
          webhook_url: `http://localhost:8000/webhook/trigger/${id}`,
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
          x: Math.random() * 400,
          y: Math.random() * 300,
        },
      }
    }

    set({ nodes: [...currentNodes, newNode] })
  },
}))
