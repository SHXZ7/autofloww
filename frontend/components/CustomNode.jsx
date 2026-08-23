"use client"
import { Handle, Position } from "reactflow"
import { useState, useEffect } from "react"
import { CogIcon } from "@heroicons/react/24/outline"
import { useFlowStore } from "../stores/flowStore"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://autoflow-f6hga9djg0a5b4fj.uaenorth-01.azurewebsites.net'

export default function CustomNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(data)
  const [isDocUploading, setIsDocUploading] = useState(false)
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === 'undefined') return false
    return (localStorage.getItem('theme') || 'dark') === 'light'
  })
  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains('light'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  
  const CATEGORY_COLORS = {
    AI:            { accent: "#DDA449", bg: "rgba(221,164,73,0.12)",  bgLight: "#FFFFFF",  border: "#E5DCD0" },
    Integration:   { accent: "#5B9EB5", bg: "rgba(91,158,181,0.12)",  bgLight: "#FFFFFF",  border: "#E5DCD0" },
    Communication: { accent: "#319D84", bg: "rgba(49,157,132,0.12)",  bgLight: "#FFFFFF",  border: "#E5DCD0" },
    Automation:    { accent: "#EB5E3D", bg: "rgba(235,94,61,0.12)",   bgLight: "#FFFFFF",  border: "#E5DCD0" },
    Data:          { accent: "#9B5A53", bg: "rgba(155,90,83,0.12)",   bgLight: "#FFFFFF",  border: "#E5DCD0" },
    Unknown:       { accent: "#736357", bg: "rgba(115,99,87,0.12)",   bgLight: "#FFFFFF",  border: "#E5DCD0" },
  }

  const handleSave = () => {
    Object.assign(data, formData)
    updateNodeData(id, formData)
    setIsEditing(false)
  }

  // Get node type info
  const getNodeTypeInfo = () => {
    const nodeTypeMap = {
      gpt:              { icon: '/images/gpt.png',              category: 'AI'            },
      llama:            { icon: '/images/gpt.png',              category: 'AI'            },
      gemini:           { icon: '/images/gemini.png',           category: 'AI'            },
      claude:           { icon: '/images/claude.png',           category: 'AI'            },
      mistral:          { icon: '/images/gpt.png',              category: 'AI'            },
      email:            { icon: '/images/email.png',            category: 'Communication' },
      discord:          { icon: '/images/discord.png',          category: 'Communication' },
      whatsapp:         { icon: '/images/sms.png',              category: 'Communication' },
      social_media:     { icon: '/images/sms.png',              category: 'Communication' },
      webhook:          { icon: '/images/webhook.png',          category: 'Integration'   },
      google_sheets:    { icon: '/images/google_sheets.png',    category: 'Integration'   },
      file_upload:      { icon: '/images/file_upload.png',      category: 'Integration'   },
      schedule:         { icon: '/images/schedule.png',         category: 'Automation'    },
      gmail_trigger:    { icon: '/images/email.png',            category: 'Automation'    },
      delay:            { icon: '/images/delay.png',            category: 'Automation'    },
      image_generation: { icon: '/images/gemini.png',           category: 'Automation'    },
      document_parser:  { icon: '/images/document_parser.png',  category: 'Data'          },
      report_generator: { icon: '/images/report_generator.png', category: 'Data'          },
    }

        // Try to determine node type from data properties
    let nodeType = "default"
    if (data.model !== undefined)
      nodeType = data.label?.toLowerCase().includes("gpt")
        ? "gpt"
        : data.label?.toLowerCase().includes("llama")
          ? "llama"
          : data.label?.toLowerCase().includes("gemini")
            ? "gemini"
            : data.label?.toLowerCase().includes("claude")
              ? "claude"
              : data.label?.toLowerCase().includes("mistral")
                ? "mistral"
                : "gpt"
    else if (data.subject !== undefined || data.body !== undefined) nodeType = "email"
    else if (data.webhook_url !== undefined && data.method !== undefined) nodeType = "webhook"
    else if (data.webhook_url !== undefined && data.username !== undefined && !data.method) nodeType = "discord"
    else if (data.spreadsheet_id !== undefined) nodeType = "google_sheets"
    else if (data.cron !== undefined) nodeType = "schedule"
    else if (data.query !== undefined && data.label_filter !== undefined && data.poll_interval !== undefined) nodeType = "gmail_trigger"
    else if (data.service !== undefined || data.path !== undefined) nodeType = "file_upload"
    else if (data.message !== undefined && data.to !== undefined && data.subject === undefined && data.body === undefined) nodeType = "whatsapp"
    else if (data.prompt !== undefined && data.provider !== undefined) nodeType = "image_generation"
    else if (data.supported_types !== undefined || data.file_path !== undefined) nodeType = "document_parser"
    else if (data.title !== undefined && data.format !== undefined) nodeType = "report_generator"
    else if (data.platform !== undefined) nodeType = "social_media"

    return nodeTypeMap[nodeType] || { icon: '?', category: 'Unknown' }
  }

  const nodeInfo = getNodeTypeInfo()
  const catColors = CATEGORY_COLORS[nodeInfo.category] || CATEGORY_COLORS.Unknown

  const renderEditForm = () => {
    if (data.model !== undefined) {
      // AI Model Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Prompt</label>
            <textarea
              value={formData.prompt || formData.label || ""}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value, label: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 resize-none text-xs"
              rows={3}
              placeholder="Enter your prompt..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Model</label>
            <select
              value={formData.model || ""}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs font-medium"
            >
              <option value="openai/gpt-4o">GPT-4o</option>
              <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B</option>
              <option value="google/gemini-pro">Gemini Pro</option>
              <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
              <option value="mistral/mistral-7b-instruct">Mistral 7B</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#241812]">Temperature</label>
              <span className="text-[11px] font-bold text-[#EB5E3D] bg-[#EDE6DC] px-2 py-0.5 rounded-md border border-[#E5DCD0]">
                {formData.temperature !== undefined ? formData.temperature : 0.7}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.temperature !== undefined ? formData.temperature : 0.7}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full cursor-pointer accent-[#EB5E3D]"
              style={{
                height: '8px',
                borderRadius: '6px',
                background: `linear-gradient(to right, #EB5E3D ${((formData.temperature !== undefined ? formData.temperature : 0.7) * 100)}%, #EDE6DC ${((formData.temperature !== undefined ? formData.temperature : 0.7) * 100)}%)`,
                border: '1px solid #E5DCD0',
                outline: 'none',
              }}
            />
            <div className="flex justify-between text-[10px] text-[#736357] font-semibold mt-1">
              <span>0.0 (Precise)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>
        </div>
      )
    } else if (data.webhook_url !== undefined && data.method !== undefined) {
      // Webhook Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Description</label>
            <input
              type="text"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs"
              placeholder="Webhook description"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Method</label>
            <select
              value={formData.method || "POST"}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs font-medium"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Webhook URL</label>
            <input
              type="text"
              value={formData.webhook_url || ""}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs"
              placeholder={`${API_BASE_URL}/webhook/trigger/${id}`}
            />
            <div className="text-[11px] text-[#736357] mt-1">
              Webhook URL will be auto-registered when workflow runs
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Request Body (JSON)</label>
            <textarea
              value={formData.body || ""}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 resize-none font-mono text-xs"
              rows={3}
              placeholder='{"key": "value"}'
            />
          </div>
        </div>
      )
    } else if (data.username !== undefined && data.webhook_url !== undefined && !data.method) {
      // Discord Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Webhook URL</label>
            <input
              type="text"
              value={formData.webhook_url || ""}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs"
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Message</label>
            <textarea
              value={formData.message || ""}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 resize-none text-xs"
              rows={3}
              placeholder="Message to send to Discord..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Bot Username</label>
            <input
              type="text"
              value={formData.username || "AutoFlow Bot"}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs"
              placeholder="AutoFlow Bot"
            />
          </div>
        </div>
      )
    } else if (data.subject !== undefined || data.body !== undefined) {
      // Email Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">To</label>
            <input
              type="email"
              value={formData.to || ""}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject || ""}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
              placeholder="Email subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Body</label>
            <textarea
              value={formData.body || ""}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="Email content..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">From Email (Optional)</label>
            <input
              type="email"
              value={formData.from || ""}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
              placeholder="sender@example.com (optional)"
            />
          </div>
        </div>
      )
    } else if (data.prompt !== undefined && data.provider !== undefined) {
      // Image Generation Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Prompt</label>
            <textarea
              value={formData.prompt || ""}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 resize-none text-xs"
              rows={3}
              placeholder="A beautiful sunset over mountains..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Provider</label>
            <select
              value={formData.provider || "openai"}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs font-medium"
            >
              <option value="openai">OpenAI DALL-E</option>
              <option value="stability">Stability AI</option>
              <option value="huggingface">Hugging Face</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Size</label>
            <select
              value={formData.size || "1024x1024"}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs font-medium"
            >
              <option value="1024x1024">1024x1024</option>
              <option value="1792x1024">1792x1024</option>
              <option value="1024x1792">1024x1792</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Quality</label>
            <select
              value={formData.quality || "standard"}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs font-medium"
            >
              <option value="standard">Standard</option>
              <option value="hd">HD</option>
            </select>
          </div>
        </div>
      )
    } else if (data.message !== undefined && data.to !== undefined && data.subject === undefined && data.body === undefined) {
      // WhatsApp Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Phone Number</label>
            <input
              type="text"
              value={formData.to || ""}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs"
              placeholder="+919876543210"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Message</label>
            <textarea
              value={formData.message || ""}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 resize-none text-xs"
              rows={3}
              placeholder="Type your message..."
            />
          </div>
        </div>
      )
    } else if (data.spreadsheet_id !== undefined) {
      // Google Sheets Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Spreadsheet ID</label>
            <input
              type="text"
              value={formData.spreadsheet_id || ""}
              onChange={(e) => setFormData({ ...formData, spreadsheet_id: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs"
              placeholder="Google Sheets ID"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Range</label>
            <input
              type="text"
              value={formData.range || "Sheet1!A1"}
              onChange={(e) => setFormData({ ...formData, range: e.target.value })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 text-xs"
              placeholder="Sheet1!A1:C10"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#241812] mb-1.5">Values (comma-separated)</label>
            <textarea
              value={formData.values ? (Array.isArray(formData.values) ? formData.values.join(", ") : formData.values) : ""}
              onChange={(e) => setFormData({ ...formData, values: e.target.value.split(",").map(v => v.trim()) })}
              className="w-full bg-[#F6F1EA] border border-[#E5DCD0] rounded-xl px-3 py-2 text-[#241812] placeholder-[#736357] focus:outline-none focus:ring-1 focus:ring-[#EB5E3D] focus:border-[#EB5E3D] transition-all duration-200 resize-none text-xs"
              rows={2}
              placeholder="Value1, Value2, Value3"
            />
          </div>
        </div>
      )
    } else if (data.cron !== undefined) {
      // Schedule Node - Visual Builder
      const detectType = (cron) => {
        if (!cron) return 'daily'
        if (cron === '* * * * *') return 'every_minute'
        if (cron === '0 * * * *') return 'every_hour'
        if (/^\d+ \*\/\d+ \* \* \*$/.test(cron)) return 'every_n_hours'
        if (/^\d+ \d+ \* \* \*$/.test(cron)) return 'daily'
        if (/^\d+ \d+ \* \* \d+$/.test(cron)) return 'weekly'
        if (/^\d+ \d+ \d+ \* \*$/.test(cron)) return 'monthly'
        return 'custom'
      }
      const scheduleType = formData.scheduleType || detectType(formData.cron)
      const scheduleHour = formData.scheduleHour !== undefined ? formData.scheduleHour : '9'
      const scheduleMinute = formData.scheduleMinute !== undefined ? formData.scheduleMinute : '0'
      const scheduleDay = formData.scheduleDay !== undefined ? formData.scheduleDay : '1'
      const scheduleInterval = formData.scheduleInterval || '2'

      const buildCron = (t, h, m, d, n) => {
        switch (t) {
          case 'every_minute': return '* * * * *'
          case 'every_hour': return '0 * * * *'
          case 'every_n_hours': return `0 */${n} * * *`
          case 'daily': return `${m} ${h} * * *`
          case 'weekly': return `${m} ${h} * * ${d}`
          case 'monthly': return `${m} ${h} ${d} * *`
          default: return formData.cron
        }
      }

      const handleScheduleChange = (field, value) => {
        const u = { ...formData, [field]: value }
        const t = field === 'scheduleType' ? value : u.scheduleType || scheduleType
        const h = field === 'scheduleHour' ? value : u.scheduleHour || scheduleHour
        const m = field === 'scheduleMinute' ? value : u.scheduleMinute || scheduleMinute
        const d = field === 'scheduleDay' ? value : u.scheduleDay || scheduleDay
        const n = field === 'scheduleInterval' ? value : u.scheduleInterval || scheduleInterval
        if (field !== 'cron' && t !== 'custom') u.cron = buildCron(t, h, m, d, n)
        if (field === 'scheduleType') {
          u.scheduleType = value
          if (value !== 'custom') u.cron = buildCron(value, h, m, d, n)
        }
        setFormData(u)
      }

      const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const DAY_FULL = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']
      const fmtTime = (h, m) => {
        const hr = parseInt(h); const mn = String(m).padStart(2, '0')
        const period = hr >= 12 ? 'PM' : 'AM'; const dh = hr % 12 || 12
        return `${dh}:${mn} ${period}`
      }
      const getPreview = () => {
        switch (scheduleType) {
          case 'every_minute': return 'Runs every minute'
          case 'every_hour': return 'Runs every hour, on the hour'
          case 'every_n_hours': return `Runs every ${scheduleInterval} hours`
          case 'daily': return `Runs daily at ${fmtTime(scheduleHour, scheduleMinute)}`
          case 'weekly': return `Runs every ${DAY_FULL[scheduleDay] || 'week'} at ${fmtTime(scheduleHour, scheduleMinute)}`
          case 'monthly': return `Runs on the ${scheduleDay}${['','st','nd','rd'][scheduleDay] || 'th'} of each month at ${fmtTime(scheduleHour, scheduleMinute)}`
          default: return `Custom: ${formData.cron || '�'}`
        }
      }

      return (
        <div className="p-4 space-y-3">
          {/* Schedule Type */}
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5 uppercase tracking-wide">Repeat</label>
            <select
              value={scheduleType}
              onChange={(e) => handleScheduleChange('scheduleType', e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
            >
              <option value="every_minute">?  Every Minute</option>
              <option value="every_hour">??  Every Hour</option>
              <option value="every_n_hours">??  Every N Hours</option>
              <option value="daily">??  Daily</option>
              <option value="weekly">??  Weekly</option>
              <option value="monthly">???  Monthly</option>
              <option value="custom">??  Custom (Cron)</option>
            </select>
          </div>

          {/* Interval for every_n_hours */}
          {scheduleType === 'every_n_hours' && (
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5 uppercase tracking-wide">Interval</label>
              <div className="flex items-center gap-2">
                <select
                  value={scheduleInterval}
                  onChange={(e) => handleScheduleChange('scheduleInterval', e.target.value)}
                  className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
                >
                  {[2, 3, 4, 6, 8, 12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-[#64748b] text-sm">hours between runs</span>
              </div>
            </div>
          )}

          {/* Time picker */}
          {['daily', 'weekly', 'monthly'].includes(scheduleType) && (
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5 uppercase tracking-wide">Time</label>
              <div className="flex gap-2">
                <select
                  value={scheduleHour}
                  onChange={(e) => handleScheduleChange('scheduleHour', e.target.value)}
                  className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {h === 0 ? '12:00 AM (midnight)' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM (noon)' : `${h - 12}:00 PM`}
                    </option>
                  ))}
                </select>
                <select
                  value={scheduleMinute}
                  onChange={(e) => handleScheduleChange('scheduleMinute', e.target.value)}
                  className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
                >
                  {[0, 15, 30, 45].map(m => <option key={m} value={m}>:{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Day of week for weekly */}
          {scheduleType === 'weekly' && (
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5 uppercase tracking-wide">Day</label>
              <div className="grid grid-cols-7 gap-1">
                {DAY_LABELS.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => handleScheduleChange('scheduleDay', String(i))}
                    className={`py-1.5 rounded text-xs font-semibold transition-all ${
                      String(i) === String(scheduleDay)
                        ? 'bg-[#3B82F6] text-white shadow-md'
                        : 'bg-[#1e293b] text-[#64748b] hover:bg-[#334155] hover:text-[#94a3b8]'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of month for monthly */}
          {scheduleType === 'monthly' && (
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5 uppercase tracking-wide">Day of Month</label>
              <select
                value={scheduleDay}
                onChange={(e) => handleScheduleChange('scheduleDay', e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>
                    {d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of the month
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom cron */}
          {scheduleType === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5 uppercase tracking-wide">Cron Expression</label>
              <input
                type="text"
                value={formData.cron || ''}
                onChange={(e) => handleScheduleChange('cron', e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                placeholder="0 9 * * *"
              />
              <div className="text-xs text-[#475569] mt-1">Format: minute � hour � day � month � weekday</div>
            </div>
          )}

          {/* Live preview */}
          <div className="bg-[#0f172a] border border-[#1e3a5f] rounded-lg p-3 flex items-start gap-2">
            <span className="text-[#3B82F6] text-sm mt-0.5">?</span>
            <div>
              <div className="text-[#93c5fd] text-sm font-medium">{getPreview()}</div>
              {scheduleType !== 'custom' && (
                <div className="text-[#475569] font-mono text-xs mt-0.5">{formData.cron}</div>
              )}
            </div>
          </div>
        </div>
      )
    } else if (data.query !== undefined && data.label_filter !== undefined && data.poll_interval !== undefined) {
      // Gmail Trigger Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Search Query (optional)</label>
            <input
              type="text"
              value={formData.query || ""}
              onChange={(e) => setFormData({ ...formData, query: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
              placeholder="from:client@company.com subject:invoice"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Label Filter</label>
            <select
              value={formData.label_filter || "INBOX"}
              onChange={(e) => setFormData({ ...formData, label_filter: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
            >
              <option value="INBOX">INBOX</option>
              <option value="IMPORTANT">IMPORTANT</option>
              <option value="CATEGORY_PRIMARY">CATEGORY_PRIMARY</option>
              <option value="UNREAD">UNREAD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Poll Interval (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={formData.poll_interval || 1}
              onChange={(e) => setFormData({ ...formData, poll_interval: Math.max(1, Number(e.target.value) || 1) })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
            />
            <div className="text-xs text-[#64748b] mt-1">
              This checks the logged-in user's Gmail OAuth token and triggers workflow on new emails.
            </div>
          </div>
        </div>
      )
    } else if (data.service !== undefined || data.path !== undefined) {
      // File Upload Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Upload File</label>
            <input
              type="file"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  try {
                    // Show loading state
                    setFormData({
                      ...formData,
                      uploading: true,
                      error: null
                    });
                    
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);
                    
                    // Get auth token
                    const token = localStorage.getItem("token")
                    const headers = token ? { "Authorization": `Bearer ${token}` } : {}
                    
                    const response = await fetch(`${API_BASE_URL}/upload`, {
                      method: 'POST',
                      headers: headers,
                      body: uploadFormData,
                    });
                    
                    const result = await response.json();
                    
                    if (result.error) {
                      setFormData({
                        ...formData,
                        uploading: false,
                        error: result.error
                      });
                      alert('Upload failed: ' + result.error);
                      return;
                    }
                    
                    setFormData({
                      ...formData,
                      name: result.filename,
                      mime_type: result.mime_type,
                      path: result.file_path,
                      uploading: false,
                      error: null
                    });
                    
                  } catch (error) {
                    setFormData({
                      ...formData,
                      uploading: false,
                      error: error.message
                    });
                    alert('Upload failed: ' + error.message);
                  }
                }
              }}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
              disabled={formData.uploading}
            />
            {formData.uploading && (
              <div className="text-xs text-[#3B82F6] mt-1">Uploading file...</div>
            )}
            {formData.error && (
              <div className="text-xs text-[#e74c3c] mt-1">Error: {formData.error}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Service</label>
            <select
              value={formData.service || "google_drive"}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
            >
              <option value="google_drive">Google Drive</option>
              <option value="dropbox">Dropbox</option>
              <option value="onedrive">OneDrive</option>
            </select>
          </div>
          {formData.path ? (
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Selected File</label>
              <div className="text-xs text-emerald-400 bg-[#1e293b] p-2 rounded">
                📁 {formData.name || 'File uploaded'}
              </div>
              <div className="text-xs text-[#64748b] mt-1">
                Path: {formData.path}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#e74c3c] bg-[#1e293b] p-2 rounded">
              ⚠️ No file selected. Please upload a file to enable this node.
            </div>
          )}
        </div>
      )
    } else if (data.supported_types !== undefined || data.file_path !== undefined) {
      // Document Parser Node
      return (
        <div className="p-4 space-y-3">
          {/* Current file status */}
          {formData.filename ? (
            <div className="flex items-center justify-between bg-[#0f172a] border border-emerald-500/30 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-emerald-400 text-sm flex-shrink-0">??</span>
                <span className="text-emerald-300 text-xs font-medium truncate">{formData.filename}</span>
              </div>
              <button
                onClick={() => setFormData({ ...formData, file_path: '', filename: '' })}
                className="text-[#64748b] hover:text-red-400 transition-colors text-xs flex-shrink-0 ml-2"
                title="Remove file"
              >?</button>
            </div>
          ) : (
            <div className="bg-[#0f172a] border border-[#334155] border-dashed rounded-lg px-3 py-2">
              <p className="text-[#475569] text-xs text-center">No document selected</p>
            </div>
          )}

          {/* Upload area */}
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5 uppercase tracking-wide">
              {formData.filename ? 'Replace Document' : 'Upload Document'}
            </label>
            <label className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed cursor-pointer transition-all text-sm font-medium ${
              isDocUploading
                ? 'border-[#334155] text-[#475569] bg-[#0f172a] cursor-not-allowed'
                : 'border-[#3B82F6]/50 text-[#3B82F6] bg-[#1e40af]/10 hover:bg-[#1e40af]/20 hover:border-[#3B82F6]'
            }`}>
              {isDocUploading ? (
                <><span className="animate-spin text-base">?</span> Uploading�</>
              ) : (
                <><span>??</span> Choose file to upload</>
              )}
              <input
                type="file"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.md,.csv"
                className="hidden"
                disabled={isDocUploading}
                onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  setIsDocUploading(true)
                  try {
                    const fd = new FormData()
                    fd.append('file', file)
                    const token = localStorage.getItem('token')
                    const res = await fetch(`${API_BASE_URL}/upload`, {
                      method: 'POST',
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                      body: fd,
                    })
                    const result = await res.json()
                    if (result.error) { alert('Upload failed: ' + result.error); return }
                    setFormData({ ...formData, file_path: result.file_path, filename: result.filename })
                  } catch (err) {
                    alert('Upload failed: ' + err.message)
                  } finally {
                    setIsDocUploading(false)
                  }
                }}
              />
            </label>
          </div>

          <div className="bg-[#0f172a] rounded-lg px-3 py-2">
            <p className="text-[#475569] text-xs font-semibold uppercase tracking-wide mb-1">Supported formats</p>
            <p className="text-[#64748b] text-xs">PDF � Word (.docx) � Excel (.xlsx) � Text (.txt/.md) � CSV</p>
          </div>

          {/* Tip for scheduled workflows */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
            <p className="text-amber-400/80 text-xs">?? Upload a document here so it can be parsed automatically when this workflow runs on schedule.</p>
          </div>
        </div>
      )
    } else if (data.title !== undefined && data.format !== undefined) {
      // Report Generator Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Report Title</label>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
              placeholder="Monthly Report"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Content Template</label>
            <textarea
              value={formData.content || ""}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200 resize-none"
              rows={4}
              placeholder="# Report Title&#10;&#10;## Summary&#10;Content from connected nodes will be added here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Format</label>
            <select
              value={formData.format || "pdf"}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
            >
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
              <option value="docx">Word Document</option>
            </select>
          </div>
        </div>
      )
    } else if (data.platform !== undefined) {
      // Social Media Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Platform</label>
            <select
              value={formData.platform || "twitter"}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
            >
              <option value="twitter">Twitter</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="discord">Discord (Test)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Content</label>
            <textarea
              value={formData.content || ""}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="What's happening? Content from AI nodes will be added automatically..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Image Path (Optional)</label>
            <input
              type="text"
              value={formData.image_path || ""}
              onChange={(e) => setFormData({ ...formData, image_path: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
              placeholder="Path to image file or leave empty to use connected image generation"
            />
          </div>
          {formData.platform === 'discord' && (
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Discord Webhook URL (for testing)</label>
              <input
                type="text"
                value={formData.webhook_url || ""}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
          )}
        </div>
      )
    } else {
      // Default fallback with similar styling
      return (
        <div className="p-4">
          <div className="text-sm text-[#64748b]">Configure this node by editing its properties</div>
        </div>
      )
    }
  }

  if (isEditing) {
    return (
      <div
        className="rounded-xl shadow-2xl min-w-80 backdrop-blur-sm"
        style={{ backgroundColor: isLight ? '#ffffff' : '#0f172a', border: `2px solid ${catColors.border}`, boxShadow: isLight ? `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${catColors.border}` : `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${catColors.border}` }}
      >

        <Handle
          type="target"
          position={Position.Top}
          style={{
            backgroundColor: catColors.accent,
            border: "2px solid #ffffff",
            width: "12px",
            height: "12px",
          }}
        />

        {/* Header */}
        <div className="px-4 py-3.5 border-b rounded-t-xl" style={{ backgroundColor: '#EDE6DC', borderColor: '#E5DCD0' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shadow-md font-bold shrink-0" style={{ backgroundColor: catColors.accent }}
              >
                {nodeInfo.icon && nodeInfo.icon.startsWith('/') ? (
                  <img src={nodeInfo.icon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                ) : (nodeInfo.icon || '⚡')}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-extrabold text-sm tracking-tight leading-snug truncate" style={{ color: '#241812' }}>{data.label || data.name || nodeInfo.category + ' Node'}</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: '#736357' }}>{nodeInfo.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-h-96 overflow-y-auto bg-white">{renderEditForm()}</div>

        {/* Actions */}
        <div className="p-4 border-t rounded-b-xl flex gap-3" style={{ backgroundColor: '#F6F1EA', borderColor: '#E5DCD0' }}>
          <button
            onClick={handleSave}
            className="flex-1 text-white font-bold text-xs py-2.5 rounded-lg transition-all shadow-md hover:opacity-90 cursor-pointer" style={{ backgroundColor: '#EB5E3D' }}
          >
            Save Changes
          </button>
          <button
            onClick={() => setIsEditing(false)}
            style={{
              flex: 1, fontWeight: '600', padding: '8px 16px', borderRadius: '8px',
              transition: 'all 0.15s ease',
              backgroundColor: '#EDE6DC',
              color: '#241812',
              border: '1px solid #E5DCD0',
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '12px',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E5DCD0'; e.currentTarget.style.color = '#EB5E3D' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#EDE6DC'; e.currentTarget.style.color = '#241812' }}
          >
            Cancel
          </button>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            backgroundColor: catColors.accent,
            border: "2px solid #ffffff",
            width: "12px",
            height: "12px",
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-xl min-w-48 cursor-pointer transition-all duration-200"
      onDoubleClick={() => setIsEditing(true)}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5DCD0',
        borderLeft: '4px solid ' + catColors.accent,
        borderRadius: '14px',
        minWidth: '210px',
        color: '#241812',
        boxShadow: '0 4px 20px rgba(36,24,18,0.06)'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          backgroundColor: catColors.accent,
          border: "2px solid #ffffff",
          width: "12px",
          height: "12px",
        }}
      />

      {/* Header */}
      <div 
        className="px-3.5 py-3 border-b rounded-t-xl" style={{ backgroundColor: '#EDE6DC', borderColor: '#E5DCD0', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs shrink-0" style={{ backgroundColor: catColors.accent }}
            >
              {nodeInfo.icon && nodeInfo.icon.startsWith('/') ? (
                <img src={nodeInfo.icon} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
              ) : (
                <span className="text-xs text-white">{nodeInfo.icon || '⚡'}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-extrabold text-sm tracking-tight leading-snug truncate" style={{ color: '#241812' }}>{data.label || data.name || nodeInfo.category + ' Node'}</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: '#736357' }}>{nodeInfo.category}</p>
            </div>
          </div>
          <CogIcon className="w-4 h-4 text-[#736357] hover:text-[#EB5E3D] transition-colors shrink-0" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 bg-white rounded-b-xl">
        {data.model && (
          <div 
            className="text-xs font-semibold text-[#241812] bg-[#F6F1EA] px-2.5 py-1 rounded-md border border-[#E5DCD0]"
          >
            Model: {data.model.split("/").pop()}
          </div>
        )}
        {data.to && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            To: {data.to}
          </div>
        )}
        {data.webhook_url && data.method && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ? {data.description || "Webhook"}
          </div>
        )}
        {data.webhook_url && data.username && !data.method && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ??{data.username}
          </div>
        )}
        {data.spreadsheet_id && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ?? {data.range} 
          </div>
        )}
        {data.cron && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ? {data.cron}
          </div>
        )}
        {data.service && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ?? {data.name || data.service}
          </div>
        )}
        {data.mode && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ?? {data.mode.toUpperCase()}
          </div>
        )}
        {data.prompt && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ?? {data.provider}: {data.size}
          </div>
        )}
        {data.subject && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ?? {data.subject}
          </div>
        )}
        {data.supported_types && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ?? {data.filename || "No file selected"}
          </div>
        )}
        {data.title && data.format && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ?? {data.format.toUpperCase()} Report
          </div>
        )}
        {data.platform && (
          <div 
            className="text-xs text-[#94a3b8] bg-[#1e293b] px-2 py-1 rounded"
            style={{ backgroundColor: isLight ? '#f5f3ef' : '#1e293b', color: isLight ? '#52525b' : '#94a3b8', border: isLight ? '1px solid #e8e4de' : 'none' }}
          >
            ?? {data.platform.charAt(0).toUpperCase() + data.platform.slice(1)}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          backgroundColor: catColors.accent,
          border: "2px solid #ffffff",
          width: "12px",
          height: "12px",
        }}
      />
    </div>
  )
}
