"use client"
import { useState, useEffect } from "react"
import { useFlowStore } from "@/stores/flowStore"
import NodeWrapper from "../NodeWrapper"
import Select from "react-select"
import AsyncSelect from "react-select/async"
import { toast } from "react-hot-toast"

const EmailNode = ({ node, onChange, isSelected }) => {
  const { id, data, position } = node
  const { updateNodeData } = useFlowStore()

  const handleUpdate = (newData) => {
    updateNodeData(id, newData)
    if (onChange) onChange({ ...node, data: { ...data, ...newData } })
  }

  // Load options for AI models
  const loadModelOptions = async (inputValue) => {
    if (!inputValue) return []
    const response = await fetch(`http://localhost:8000/models/search?query=${inputValue}`)
    const data = await response.json()
    return data.models.map((model) => ({
      value: model.id,
      label: model.name,
    }))
  }

  return (
    <NodeWrapper node={node} isSelected={isSelected}>
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              To Email Address
            </label>
            <input
              type="email"
              value={data.to || ""}
              onChange={(e) => handleUpdate({ to: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
              placeholder="recipient@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={data.subject || "AutoFlow Notification"}
              onChange={(e) => handleUpdate({ subject: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Body
            </label>
            <textarea
              value={data.body || ""}
              onChange={(e) => handleUpdate({ body: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent h-24 resize-none"
              placeholder="Your email message here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Connect AI nodes to automatically include their responses in the email
            </p>
          </div>

          {/* Optional CC/BCC fields */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
              ⚙️ Advanced Options
            </summary>
            <div className="mt-2 space-y-2">
              <input
                type="email"
                value={data.cc || ""}
                onChange={(e) => handleUpdate({ cc: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                placeholder="CC: additional@example.com"
              />
              <input
                type="email"
                value={data.bcc || ""}
                onChange={(e) => handleUpdate({ bcc: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
                placeholder="BCC: hidden@example.com"
              />
            </div>
          </details>
        </div>
      </div>
    </NodeWrapper>
  )
}

export default EmailNode