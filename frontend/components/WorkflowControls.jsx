"use client"
import { useState, useEffect } from "react"
import { useFlowStore } from "../stores/flowStore"
import { DocumentIcon, PlusIcon, FolderIcon, TrashIcon } from "@heroicons/react/24/outline"

export default function WorkflowControls() {
  const {
    saveWorkflow,
    loadWorkflows,
    loadWorkflow,
    deleteWorkflow,
    newWorkflow,
    savedWorkflows,
    currentWorkflowId
  } = useFlowStore()
  
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState(null)
  const [workflowName, setWorkflowName] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadWorkflows()
  }, [loadWorkflows])

  const handleSave = async () => {
    if (!workflowName.trim()) return
    
    setSaving(true)
    const result = await saveWorkflow(workflowName)
    setSaving(false)
    
    if (result.success) {
      setShowSaveDialog(false)
      setWorkflowName("")
      alert("Workflow saved successfully!")
    } else {
      alert(`Failed to save workflow: ${result.error}`)
    }
  }

  const handleLoad = async (workflowId) => {
    const result = await loadWorkflow(workflowId)
    if (result.success) {
      setShowLoadDialog(false)
      alert("Workflow loaded successfully!")
    } else {
      alert(`Failed to load workflow: ${result.error}`)
    }
  }

  const handleDeleteClick = (workflow) => {
    setWorkflowToDelete(workflow)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!workflowToDelete) return
    
    setDeleting(true)
    const result = await deleteWorkflow(workflowToDelete._id)
    setDeleting(false)
    
    if (result.success) {
      setShowDeleteDialog(false)
      setWorkflowToDelete(null)
      alert("Workflow deleted successfully!")
      // Refresh the workflow list
      loadWorkflows()
    } else {
      alert(`Failed to delete workflow: ${result.error}`)
    }
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-[#0a0a0a] border-b border-white/10">
      {/* New Workflow */}
      <button
        onClick={newWorkflow}
        className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
      >
        <PlusIcon className="w-4 h-4" />
        <span>New</span>
      </button>

      {/* Save Workflow */}
      <button
        onClick={() => setShowSaveDialog(true)}
        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 text-white rounded-lg transition-all"
      >
        <DocumentIcon className="w-4 h-4" />
        <span>Save</span>
      </button>

      {/* Load Workflow */}
      <button
        onClick={() => setShowLoadDialog(true)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
      >
        <FolderIcon className="w-4 h-4" />
        <span>Load ({savedWorkflows.length})</span>
      </button>

      {/* Current workflow indicator */}
      {currentWorkflowId && (
        <div className="text-gray-400 text-sm ml-2 px-3 py-1 bg-white/5 rounded-lg">
          Current: {savedWorkflows.find(w => w._id === currentWorkflowId)?.name || "Saved Workflow"}
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-white/10 w-96 shadow-xl shadow-[#00D4FF]/5">
            <h3 className="text-white text-lg font-semibold mb-4">Save Workflow</h3>
            <input
              type="text"
              placeholder="Enter workflow name..."
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 mb-4 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={!workflowName.trim() || saving}
                className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] hover:opacity-90 text-white py-2 rounded-lg disabled:opacity-50 transition-opacity"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white py-2 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-white/10 w-96 max-h-[80vh] overflow-y-auto shadow-xl shadow-[#00D4FF]/5">
            <h3 className="text-white text-lg font-semibold mb-4">Load Workflow</h3>
            {savedWorkflows.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No saved workflows</p>
            ) : (
              <div className="space-y-2">
                {savedWorkflows.map((workflow) => (
                  <div key={workflow._id} className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLoad(workflow._id)}
                      className="flex-1 text-left p-3 glass hover:bg-white/10 rounded-lg transition-all"
                    >
                      <div className="text-white font-medium">{workflow.name}</div>
                      <div className="text-gray-400 text-sm">
                        {new Date(workflow.updated_at).toLocaleDateString()} • {workflow.nodes?.length || 0} nodes
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(workflow)}
                      className="p-2 bg-[#FF6B35]/20 hover:bg-[#FF6B35]/40 text-[#FF6B35] rounded-lg transition-all"
                      title="Delete workflow"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLoadDialog(false)}
              className="w-full mt-4 bg-white/10 hover:bg-white/15 text-white py-2 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && workflowToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-white/10 w-96 shadow-xl shadow-[#00D4FF]/5">
            <h3 className="text-white text-lg font-semibold mb-4">Delete Workflow</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete "<span className="font-medium text-white">{workflowToDelete.name}</span>"?
            </p>
            <p className="text-gray-400 text-sm mb-6">
              This action cannot be undone. The workflow and all its execution history will be permanently removed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white py-2 rounded-lg disabled:opacity-50 transition-all"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setWorkflowToDelete(null)
                }}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white py-2 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
