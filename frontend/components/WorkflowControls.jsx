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
    <div className="flex items-center space-x-2 p-2 bg-[#2a2a2a] border-b border-[#404040]">
      {/* New Workflow */}
      <button
        onClick={newWorkflow}
        className="flex items-center space-x-2 px-3 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white rounded-lg transition-all"
      >
        <PlusIcon className="w-4 h-4" />
        <span>New</span>
      </button>

      {/* Save Workflow */}
      <button
        onClick={() => setShowSaveDialog(true)}
        className="flex items-center space-x-2 px-3 py-2 bg-[#ff6d6d] hover:bg-[#ff5252] text-white rounded-lg transition-all"
      >
        <DocumentIcon className="w-4 h-4" />
        <span>Save</span>
      </button>

      {/* Load Workflow */}
      <button
        onClick={() => setShowLoadDialog(true)}
        className="flex items-center space-x-2 px-3 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white rounded-lg transition-all"
      >
        <FolderIcon className="w-4 h-4" />
        <span>Load ({savedWorkflows.length})</span>
      </button>

      {/* Current workflow indicator */}
      {currentWorkflowId && (
        <div className="text-[#999999] text-sm">
          Current: {savedWorkflows.find(w => w._id === currentWorkflowId)?.name || "Saved Workflow"}
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#666666] w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Save Workflow</h3>
            <input
              type="text"
              placeholder="Enter workflow name..."
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full bg-[#3a3a3a] border border-[#666666] rounded-lg px-3 py-2 text-white placeholder-[#999999] mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={!workflowName.trim() || saving}
                className="flex-1 bg-[#ff6d6d] hover:bg-[#ff5252] text-white py-2 rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 bg-[#666666] hover:bg-[#777777] text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#666666] w-96 max-h-96 overflow-y-auto">
            <h3 className="text-white text-lg font-semibold mb-4">Load Workflow</h3>
            {savedWorkflows.length === 0 ? (
              <p className="text-[#999999] text-center py-4">No saved workflows</p>
            ) : (
              <div className="space-y-2">
                {savedWorkflows.map((workflow) => (
                  <div key={workflow._id} className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLoad(workflow._id)}
                      className="flex-1 text-left p-3 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-lg transition-all"
                    >
                      <div className="text-white font-medium">{workflow.name}</div>
                      <div className="text-[#999999] text-sm">
                        {new Date(workflow.updated_at).toLocaleDateString()} • {workflow.nodes?.length || 0} nodes
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(workflow)}
                      className="p-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg transition-all"
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
              className="w-full mt-4 bg-[#666666] hover:bg-[#777777] text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && workflowToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#666666] w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Delete Workflow</h3>
            <p className="text-[#cccccc] mb-4">
              Are you sure you want to delete "<span className="font-medium text-white">{workflowToDelete.name}</span>"?
            </p>
            <p className="text-[#999999] text-sm mb-6">
              This action cannot be undone. The workflow and all its execution history will be permanently removed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 bg-[#e74c3c] hover:bg-[#c0392b] text-white py-2 rounded-lg disabled:opacity-50 transition-all"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setWorkflowToDelete(null)
                }}
                className="flex-1 bg-[#666666] hover:bg-[#777777] text-white py-2 rounded-lg transition-all"
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
