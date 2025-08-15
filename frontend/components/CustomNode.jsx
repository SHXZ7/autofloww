"use client"
import { Handle, Position } from "reactflow"
import { useState } from "react"
import { CogIcon } from "@heroicons/react/24/outline"

export default function CustomNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(data)

  const handleSave = () => {
    Object.assign(data, formData)
    setIsEditing(false)
  }

  // Get node type color and icon
  const getNodeTypeInfo = () => {
    const nodeTypeMap = {
      gpt: { color: "#4a90e2", bgColor: "bg-[#4a90e2]", icon: "➕", category: "AI" },
      llama: { color: "#4a90e2", bgColor: "bg-[#4a90e2]", icon: "🦙", category: "AI" },
      gemini: { color: "#4a90e2", bgColor: "bg-[#4a90e2]", icon: "💎", category: "AI" },
      claude: { color: "#4a90e2", bgColor: "bg-[#4a90e2]", icon: "🤖", category: "AI" },
      mistral: { color: "#4a90e2", bgColor: "bg-[#4a90e2]", icon: "🌪️", category: "AI" },
      email: { color: "#2ecc71", bgColor: "bg-[#2ecc71]", icon: "📧", category: "Communication" },
      discord: { color: "#2ecc71", bgColor: "bg-[#2ecc71]", icon: "💬", category: "Communication" },
      twilio: { color: "#2ecc71", bgColor: "bg-[#2ecc71]", icon: "📱", category: "Communication" },
      social_media: { color: "#2ecc71", bgColor: "bg-[#2ecc71]", icon: "📱", category: "Communication" },
      webhook: { color: "#f39c12", bgColor: "bg-[#f39c12]", icon: "🪝", category: "Integration" },
      google_sheets: { color: "#f39c12", bgColor: "bg-[#f39c12]", icon: "📊", category: "Integration" },
      file_upload: { color: "#f39c12", bgColor: "bg-[#f39c12]", icon: "📁", category: "Integration" },
      schedule: { color: "#9b59b6", bgColor: "bg-[#9b59b6]", icon: "⏰", category: "Automation" },
      image_generation: { color: "#9b59b6", bgColor: "bg-[#9b59b6]", icon: "🎨", category: "Automation" },
      document_parser: { color: "#1abc9c", bgColor: "bg-[#1abc9c]", icon: "📄", category: "Data" },
      report_generator: { color: "#1abc9c", bgColor: "bg-[#1abc9c]", icon: "📊", category: "Data" },
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
    else if (data.service !== undefined || data.path !== undefined) nodeType = "file_upload"
    else if (data.mode !== undefined || (data.message !== undefined && data.to !== undefined)) nodeType = "twilio"
    else if (data.prompt !== undefined && data.provider !== undefined) nodeType = "image_generation"
    else if (data.supported_types !== undefined || data.file_path !== undefined) nodeType = "document_parser"
    else if (data.title !== undefined && data.format !== undefined) nodeType = "report_generator"
    else if (data.platform !== undefined) nodeType = "social_media"

    return nodeTypeMap[nodeType] || { color: "#666666", bgColor: "bg-[#666666]", icon: "⚙️", category: "Unknown" }
  }

  const nodeInfo = getNodeTypeInfo()

  const renderEditForm = () => {
    if (data.model !== undefined) {
      // AI Model Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Prompt</label>
            <textarea
              value={formData.prompt || formData.label || ""}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value, label: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="Enter your prompt..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Model</label>
            <select
              value={formData.model || ""}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            >
              <option value="openai/gpt-4o">GPT-4o</option>
              <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B</option>
              <option value="google/gemini-pro">Gemini Pro</option>
              <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
              <option value="mistral/mistral-7b-instruct">Mistral 7B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Temperature</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.temperature || 0.7}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#252525] rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-[#999999] text-center mt-1">Temperature: {formData.temperature || 0.7}</div>
          </div>
        </div>
      )
    } else if (data.webhook_url !== undefined && data.method !== undefined) {
      // Webhook Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Description</label>
            <input
              type="text"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="Webhook description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Method</label>
            <select
              value={formData.method || "POST"}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Webhook URL</label>
            <input
              type="text"
              value={formData.webhook_url || ""}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder={`http://localhost:8000/webhook/trigger/${id}`}
            />
            <div className="text-xs text-[#999999] mt-1">
              ℹ️ Webhook URL will be auto-registered when workflow runs
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Request Body (JSON)</label>
            <textarea
              value={formData.body || ""}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200 resize-none font-mono"
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
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Webhook URL</label>
            <input
              type="text"
              value={formData.webhook_url || ""}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Message</label>
            <textarea
              value={formData.message || ""}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="Message to send to Discord..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Bot Username</label>
            <input
              type="text"
              value={formData.username || "AutoFlow Bot"}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
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
            <label className="block text-sm font-medium text-[#cccccc] mb-2">To</label>
            <input
              type="email"
              value={formData.to || ""}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject || ""}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="Email subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Body</label>
            <textarea
              value={formData.body || ""}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="Email content..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">From Email (Optional)</label>
            <input
              type="email"
              value={formData.from || ""}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
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
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Prompt</label>
            <textarea
              value={formData.prompt || ""}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="A beautiful sunset over mountains..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Provider</label>
            <select
              value={formData.provider || "openai"}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            >
              <option value="openai">OpenAI DALL-E</option>
              <option value="stability">Stability AI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Size</label>
            <select
              value={formData.size || "1024x1024"}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            >
              <option value="1024x1024">1024x1024</option>
              <option value="1792x1024">1792x1024</option>
              <option value="1024x1792">1024x1792</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Quality</label>
            <select
              value={formData.quality || "standard"}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            >
              <option value="standard">Standard</option>
              <option value="hd">HD</option>
            </select>
          </div>
        </div>
      )
    } else if (data.mode !== undefined || (data.message !== undefined && data.to !== undefined)) {
      // Twilio Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Mode</label>
            <select
              value={formData.mode || "whatsapp"}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Phone Number</label>
            <input
              type="text"
              value={formData.to || ""}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="+919876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Message</label>
            <textarea
              value={formData.message || ""}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200 resize-none"
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
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Spreadsheet ID</label>
            <input
              type="text"
              value={formData.spreadsheet_id || ""}
              onChange={(e) => setFormData({ ...formData, spreadsheet_id: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Range</label>
            <input
              type="text"
              value={formData.range || ""}
              onChange={(e) => setFormData({ ...formData, range: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="Sheet1!A1:C10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Values (comma-separated)</label>
            <textarea
              value={formData.values ? (Array.isArray(formData.values) ? formData.values.join(", ") : formData.values) : ""}
              onChange={(e) => setFormData({ ...formData, values: e.target.value.split(",").map(v => v.trim()) })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200 resize-none"
              rows={2}
              placeholder="Value1, Value2, Value3"
            />
          </div>
        </div>
      )
    } else if (data.cron !== undefined) {
      // Schedule Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Cron Expression</label>
            <input
              type="text"
              value={formData.cron || ""}
              onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="0 9 * * *"
            />
          </div>
          <div className="text-xs text-[#999999] bg-[#252525] p-2 rounded">
            <strong>Examples:</strong><br/>
            • "0 9 * * *" - Daily at 9 AM<br/>
            • "0 */2 * * *" - Every 2 hours<br/>
            • "0 0 * * 1" - Every Monday at midnight
          </div>
        </div>
      )
    } else if (data.service !== undefined || data.path !== undefined) {
      // File Upload Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Upload File</label>
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
                    
                    const response = await fetch('http://localhost:8000/upload', {
                      method: 'POST',
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
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              disabled={formData.uploading}
            />
            {formData.uploading && (
              <div className="text-xs text-[#ff6d6d] mt-1">Uploading file...</div>
            )}
            {formData.error && (
              <div className="text-xs text-[#e74c3c] mt-1">Error: {formData.error}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Service</label>
            <select
              value={formData.service || "google_drive"}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            >
              <option value="google_drive">Google Drive</option>
              <option value="dropbox">Dropbox</option>
              <option value="onedrive">OneDrive</option>
            </select>
          </div>
          {formData.path ? (
            <div>
              <label className="block text-sm font-medium text-[#cccccc] mb-2">Selected File</label>
              <div className="text-xs text-[#32d74b] bg-[#252525] p-2 rounded">
                📁 {formData.name || 'File uploaded'}
              </div>
              <div className="text-xs text-[#999999] mt-1">
                Path: {formData.path}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#e74c3c] bg-[#252525] p-2 rounded">
              ⚠️ No file selected. Please upload a file to enable this node.
            </div>
          )}
        </div>
      )
    } else if (data.supported_types !== undefined || data.file_path !== undefined) {
      // Document Parser Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Upload Document</label>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.md,.csv"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  try {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);
                    
                    const response = await fetch('http://localhost:8000/parse-document', {
                      method: 'POST',
                      body: uploadFormData,
                    });
                    
                    const result = await response.json();
                    
                    if (result.error) {
                      alert('Document parsing failed: ' + result.error);
                      return;
                    }
                    
                    setFormData({
                      ...formData,
                      file_path: result.file_path,
                      filename: result.filename
                    });
                    
                  } catch (error) {
                    alert('Document upload failed: ' + error.message);
                  }
                }
              }}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="text-xs text-[#999999] bg-[#252525] p-2 rounded">
            <strong>Supported formats:</strong> PDF, Word (.docx), Excel (.xlsx), Text (.txt), Markdown (.md), CSV
          </div>
          {formData.filename && (
            <div>
              <label className="block text-sm font-medium text-[#cccccc] mb-2">Selected File</label>
              <div className="text-xs text-[#32d74b] bg-[#252525] p-2 rounded">{formData.filename}</div>
            </div>
          )}
        </div>
      )
    } else if (data.title !== undefined && data.format !== undefined) {
      // Report Generator Node
      return (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Report Title</label>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="Monthly Report"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Content Template</label>
            <textarea
              value={formData.content || ""}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200 resize-none"
              rows={4}
              placeholder="# Report Title&#10;&#10;## Summary&#10;Content from connected nodes will be added here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Format</label>
            <select
              value={formData.format || "pdf"}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
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
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Platform</label>
            <select
              value={formData.platform || "twitter"}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
            >
              <option value="twitter">Twitter</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="discord">Discord (Test)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Content</label>
            <textarea
              value={formData.content || ""}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="What's happening? Content from AI nodes will be added automatically..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cccccc] mb-2">Image Path (Optional)</label>
            <input
              type="text"
              value={formData.image_path || ""}
              onChange={(e) => setFormData({ ...formData, image_path: e.target.value })}
              className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
              placeholder="Path to image file or leave empty to use connected image generation"
            />
          </div>
          {formData.platform === 'discord' && (
            <div>
              <label className="block text-sm font-medium text-[#cccccc] mb-2">Discord Webhook URL (for testing)</label>
              <input
                type="text"
                value={formData.webhook_url || ""}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                className="w-full bg-[#252525] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff6d6d] focus:border-transparent transition-all duration-200"
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
          <div className="text-sm text-[#999999]">Configure this node by editing its properties</div>
        </div>
      )
    }
  }

  if (isEditing) {
    return (
      <div className="bg-[#3a3a3a] border-2 border-[#ff6d6d] rounded-xl shadow-2xl shadow-[#ff6d6d]/20 min-w-80 backdrop-blur-sm">
        <style jsx>{`
          /* Glassmorphism effect for editing mode */
          .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}</style>

        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: nodeInfo.color,
            border: "2px solid #ffffff",
            width: "12px",
            height: "12px",
          }}
        />

        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#252525] to-[#3a3a3a] border-b border-[#666666] rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 ${nodeInfo.bgColor} rounded-lg flex items-center justify-center text-white text-sm shadow-lg`}
              >
                {nodeInfo.icon}
              </div>
              <div>
                <h3 className="font-semibold text-white">{data.label}</h3>
                <p className="text-xs text-[#999999]">{nodeInfo.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-h-96 overflow-y-auto">{renderEditForm()}</div>

        {/* Actions */}
        <div className="p-4 bg-[#252525] border-t border-[#666666] rounded-b-xl flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-[#ff6d6d] to-[#ff9500] hover:from-[#ff5252] hover:to-[#ff8f00] text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
          >
            Save Changes
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-[#666666] hover:bg-[#777777] text-white font-medium px-4 py-2 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: nodeInfo.color,
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
      className="bg-[#3a3a3a] border-2 border-[#666666] hover:border-[#ff6d6d] rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#ff6d6d]/10 min-w-48 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] backdrop-blur-sm"
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: nodeInfo.color,
          border: "2px solid #ffffff",
          width: "12px",
          height: "12px",
        }}
      />

      {/* Header */}
      <div className="p-3 bg-gradient-to-r from-[#252525] to-[#3a3a3a] border-b border-[#666666] rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-6 h-6 ${nodeInfo.bgColor} rounded-lg flex items-center justify-center text-white text-xs shadow-lg`}
            >
              {nodeInfo.icon}
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">{data.label}</h3>
              <p className="text-xs text-[#999999]">{nodeInfo.category}</p>
            </div>
          </div>
          <CogIcon className="w-4 h-4 text-[#999999] hover:text-[#ff6d6d] transition-colors" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {data.model && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">
            Model: {data.model.split("/").pop()}
          </div>
        )}
        {data.to && <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">To: {data.to}</div>}
        {data.webhook_url && data.method && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">
            🪝 {data.description || "Webhook"}
          </div>
        )}
        {data.webhook_url && data.username && !data.method && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">💬 {data.username}</div>
        )}
        {data.spreadsheet_id && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">📊 {data.range}</div>
        )}
        {data.cron && <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">⏰ {data.cron}</div>}
        {data.service && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">📁 {data.name || data.service}</div>
        )}
        {data.mode && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">📱 {data.mode.toUpperCase()}</div>
        )}
        {data.prompt && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">
            🎨 {data.provider}: {data.size}
          </div>
        )}
        {data.subject && <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">📧 {data.subject}</div>}
        {data.supported_types && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">
            📄 {data.filename || "No file selected"}
          </div>
        )}
        {data.title && data.format && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">
            📊 {data.format.toUpperCase()} Report
          </div>
        )}
        {data.platform && (
          <div className="text-xs text-[#cccccc] bg-[#252525] px-2 py-1 rounded">
            📱 {data.platform.charAt(0).toUpperCase() + data.platform.slice(1)}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: nodeInfo.color,
          border: "2px solid #ffffff",
          width: "12px",
          height: "12px",
        }}
      />
    </div>
  )
}
