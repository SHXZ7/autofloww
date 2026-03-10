"use client"
import { useState, useEffect, useRef } from "react"
import { useFlowStore } from "../stores/flowStore"
import {
  TrashIcon,
  PlayIcon,
  BugAntIcon,
  ClockIcon,
  FolderOpenIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  StopCircleIcon,
} from "@heroicons/react/24/outline"

const API_BASE_URL = 'https://shxz7-autoflow.hf.space'

// ── Toolbar button base styles ──────────────────────────────────────────────
function TBtn({ children, onClick, disabled, accent, success, danger, title, style, light }) {
  const [hov, setHov] = useState(false)
  const base = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '5px 13px', borderRadius: '7px', border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '13px', fontWeight: '500',
    fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
    transition: 'background 0.13s ease, color 0.13s ease, opacity 0.13s ease',
    whiteSpace: 'nowrap', flexShrink: 0,
    opacity: disabled ? 0.45 : 1,
    ...style,
  }
  const variant = accent ? {
    background: hov ? '#2563EB' : '#3B82F6',
    color: '#fff',
    boxShadow: hov ? '0 0 18px rgba(59,130,246,0.45)' : '0 0 10px rgba(59,130,246,0.2)',
  } : success ? {
    background: hov ? '#16A34A' : '#22C55E',
    color: '#fff',
    boxShadow: hov ? '0 0 14px rgba(34,197,94,0.4)' : '0 0 8px rgba(34,197,94,0.15)',
  } : danger ? {
    background: hov ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.1)',
    color: hov ? '#EF4444' : '#f87171',
    border: '1px solid rgba(239,68,68,0.3)',
  } : light ? {
    background: hov ? '#e2e8f0' : '#f1f5f9',
    color: hov ? '#1e293b' : '#475569',
    border: '1px solid #e2e8f0',
  } : {
    background: hov ? '#1e293b' : 'rgba(30,41,59,0.6)',
    color: hov ? '#F1F5F9' : '#94a3b8',
    border: '1px solid #334155',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{ ...base, ...variant }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  )
}

export default function WorkflowControls() {
  const {
    nodes, edges,
    saveWorkflow,
    loadWorkflows,
    loadWorkflow,
    deleteWorkflow,
    newWorkflow,
    savedWorkflows,
    currentWorkflowId,
  } = useFlowStore()

  // ── state ──────────────────────────────────────────────────────────────────
  const [showSaveDialog, setShowSaveDialog]       = useState(false)
  const [showLoadDialog, setShowLoadDialog]       = useState(false)
  const [showDeleteDialog, setShowDeleteDialog]   = useState(false)
  const [showVersionPanel, setShowVersionPanel]   = useState(false)
  const [workflowToDelete, setWorkflowToDelete]   = useState(null)
  const [workflowName, setWorkflowName]           = useState("")
  const [saving, setSaving]                       = useState(false)
  const [deleting, setDeleting]                   = useState(false)
  const [running, setRunning]                       = useState(false)
  const [stopping, setStopping]                     = useState(false)
  const [editingName, setEditingName]             = useState(false)
  const [nameInput, setNameInput]                 = useState("")
  const nameRef = useRef(null)
  const [isLight, setIsLight] = useState(false)
  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains('light'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => { loadWorkflows() }, [loadWorkflows])

  // keep nameInput in sync with current workflow
  const currentName = savedWorkflows.find(w => w._id === currentWorkflowId)?.name || null

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!workflowName.trim()) return
    setSaving(true)
    const result = await saveWorkflow(workflowName)
    setSaving(false)
    if (result.success) { setShowSaveDialog(false); setWorkflowName("") }
    else alert(`Failed to save: ${result.error}`)
  }

  const handleLoad = async (workflowId) => {
    const result = await loadWorkflow(workflowId)
    if (result.success) setShowLoadDialog(false)
    else alert(`Failed to load: ${result.error}`)
  }

  const handleDeleteClick  = (wf) => { setWorkflowToDelete(wf); setShowDeleteDialog(true) }
  const handleDeleteConfirm = async () => {
    if (!workflowToDelete) return
    setDeleting(true)
    const result = await deleteWorkflow(workflowToDelete._id)
    setDeleting(false)
    if (result.success) { setShowDeleteDialog(false); setWorkflowToDelete(null); loadWorkflows() }
    else alert(`Failed to delete: ${result.error}`)
  }

  const scheduleNodes = nodes.filter(n => n.type === 'schedule')

  const handleStopSchedule = async () => {
    if (scheduleNodes.length === 0) return
    const token = localStorage.getItem('token')
    setStopping(true)
    const results = []
    for (const node of scheduleNodes) {
      try {
        const res = await fetch(`${API_BASE_URL}/schedule/stop/scheduled_${node.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await res.json()
        results.push(data.message || data.error || 'Unknown')
      } catch (e) {
        results.push('Error: ' + e.message)
      }
    }
    setStopping(false)
    alert('Stop schedule results:\n' + results.join('\n'))
  }

  const handleRun = async () => {
    if (nodes.length === 0) { alert("No nodes to run."); return }
    const token = localStorage.getItem("token")
    if (!token) { alert("Authentication required."); return }
    setRunning(true)
    try {
      const res = await fetch(`${API_BASE_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          nodes,
          edges,
          name: currentName || "Unnamed Workflow",
          workflow_id: currentWorkflowId || null,
        }),
      })
      const result = await res.json()
      if (res.ok) alert("Workflow ran successfully!\n" + JSON.stringify(result.message, null, 2))
      else alert("Workflow failed: " + JSON.stringify(result, null, 2))
    } catch (e) { alert("Error: " + e.message) }
    setRunning(false)
  }

  const startEditName = () => {
    setNameInput(currentName || "")
    setEditingName(true)
    setTimeout(() => nameRef.current?.select(), 30)
  }
  const commitName = async () => {
    setEditingName(false)
    if (!nameInput.trim() || nameInput === currentName) return
    setSaving(true)
    await saveWorkflow(nameInput.trim())
    setSaving(false)
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', gap: '8px',
    }}>

      {/* ── LEFT: workflow name ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {/* New workflow */}
        <button
          onClick={newWorkflow}
          title="New Workflow"
          style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            width:'28px', height:'28px', borderRadius:'7px',
            border: isLight ? '1px solid #e2e8f0' : 'none',
            background: isLight ? '#f1f5f9' : 'rgba(30,41,59,0.6)', color:'#64748b', cursor:'pointer',
            flexShrink:0, transition:'background 0.13s, color 0.13s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=isLight?'#e2e8f0':'#1e293b';e.currentTarget.style.color=isLight?'#334155':'#94a3b8'}}
          onMouseLeave={e=>{e.currentTarget.style.background=isLight?'#f1f5f9':'rgba(30,41,59,0.6)';e.currentTarget.style.color='#64748b'}}
        >
          <PlusIcon style={{width:'14px',height:'14px'}} />
        </button>

        {/* Divider */}
        <div style={{width:'1px', height:'18px', background: isLight ? '#e2e8f0' : '#1e293b', flexShrink:0}} />

        {/* Workflow name pill */}
        <div style={{
          display:'flex', alignItems:'center', gap:'7px',
          padding:'4px 10px 4px 8px',
          borderRadius:'8px',
          background: isLight ? 'rgba(248,250,252,0.9)' : 'rgba(30,41,59,0.5)',
          border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
          minWidth:0, maxWidth:'220px',
        }}>
          <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#3B82F6',flexShrink:0,
            boxShadow:'0 0 6px rgba(59,130,246,0.6)'}} />
          {editingName ? (
            <input
              ref={nameRef}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if(e.key==='Enter') commitName(); if(e.key==='Escape') setEditingName(false) }}
              style={{
                background:'transparent', border:'none', outline:'none',
                color: isLight ? '#1e293b' : '#F1F5F9', fontSize:'13px', fontWeight:'500',
                fontFamily:"var(--font-space-grotesk, system-ui, sans-serif)", width:'140px',
              }}
              autoFocus
            />
          ) : (
            <span
              onClick={currentWorkflowId ? startEditName : undefined}
              style={{
                fontSize:'13px', fontWeight:'500',
                color: currentName ? (isLight ? '#1e293b' : '#F1F5F9') : (isLight ? '#94a3b8' : '#475569'),
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                cursor: currentWorkflowId ? 'text' : 'default',
                userSelect:'none',
              }}
            >
              {currentName || 'Untitled Workflow'}
            </span>
          )}
          {currentWorkflowId && !editingName && (
            <PencilIcon
              onClick={startEditName}
              style={{width:'11px',height:'11px',color:'#475569',cursor:'pointer',flexShrink:0,marginLeft:'2px'}}
            />
          )}
        </div>
      </div>

      {/* ── CENTER / RIGHT: action buttons ─────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>

        {/* Save */}
        <TBtn onClick={() => setShowSaveDialog(true)} disabled={saving} success title="Save workflow">
          <CheckIcon style={{width:'13px',height:'13px'}} />
          {saving ? 'Saving…' : 'Save'}
        </TBtn>

        {/* Load */}
        <TBtn onClick={() => setShowLoadDialog(true)} title="Load a workflow" light={isLight}>
          <FolderOpenIcon style={{width:'13px',height:'13px'}} />
          Load
          {savedWorkflows.length > 0 && (
            <span style={{
              fontSize:'10px', fontWeight:700,
              background: isLight ? '#e2e8f0' : '#1e293b',
              color: isLight ? '#475569' : '#64748b',
              padding:'1px 5px', borderRadius:'10px',
            }}>{savedWorkflows.length}</span>
          )}
        </TBtn>

        {/* Divider */}
        <div style={{width:'1px', height:'18px', background: isLight ? '#e2e8f0' : '#1e293b', flexShrink:0}} />

        {/* Debug */}
        <TBtn
          onClick={() => alert(`Canvas has ${nodes.length} node(s) and ${edges.length} edge(s).`)}
          title="Debug — inspect canvas state"
          light={isLight}
        >
          <BugAntIcon style={{width:'13px',height:'13px'}} />
          Debug
        </TBtn>

        {/* Version History */}
        <TBtn onClick={() => setShowVersionPanel(v => !v)} title="Version history" light={isLight}>
          <ClockIcon style={{width:'13px',height:'13px'}} />
          History
        </TBtn>

        {/* Divider */}
        <div style={{width:'1px', height:'18px', background: isLight ? '#e2e8f0' : '#1e293b', flexShrink:0}} />

        {/* Stop Schedule — only shown when schedule nodes exist */}
        {scheduleNodes.length > 0 && (
          <TBtn onClick={handleStopSchedule} disabled={stopping} danger title="Stop all scheduled runs for this workflow">
            <StopCircleIcon style={{width:'13px',height:'13px'}} />
            {stopping ? 'Stopping…' : 'Stop Schedule'}
          </TBtn>
        )}

        {/* Run — accent CTA */}
        <TBtn onClick={handleRun} disabled={running} accent title="Run workflow">
          <PlayIcon style={{width:'13px',height:'13px'}} />
          {running ? 'Running…' : 'Run'}
        </TBtn>
      </div>

      {/* ── Version History panel (inline dropdown) ────────────────────── */}
      {showVersionPanel && (
        <div style={{
          position:'fixed', top:'56px', right:'16px', zIndex:60,
          background: isLight ? '#ffffff' : '#0f172a',
          border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
          borderRadius:'12px', padding:'16px', width:'280px',
          boxShadow: isLight ? '0 16px 48px rgba(0,0,0,0.1)' : '0 16px 48px rgba(0,0,0,0.7)',
        }}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <span style={{fontSize:'13px',fontWeight:'600',color: isLight ? '#1e293b' : '#F1F5F9'}}>Version History</span>
            <button onClick={()=>setShowVersionPanel(false)} style={{background:'none',border:'none',color: isLight ? '#94a3b8' : '#64748b',cursor:'pointer',fontSize:'18px',lineHeight:1}}>×</button>
          </div>
          {savedWorkflows.length === 0
            ? <p style={{fontSize:'12px',color: isLight ? '#64748b' : '#475569',textAlign:'center',padding:'12px 0'}}>No saved versions yet</p>
            : savedWorkflows.map(wf => (
              <div key={wf._id} style={{
                display:'flex',alignItems:'center',gap:'10px',
                padding:'8px 10px',borderRadius:'8px',marginBottom:'4px',
                background: wf._id===currentWorkflowId ? 'rgba(59,130,246,0.1)' : (isLight ? '#f8fafc' : 'rgba(30,41,59,0.4)'),
                border: `1px solid ${wf._id===currentWorkflowId ? 'rgba(59,130,246,0.35)' : (isLight ? '#e2e8f0' : '#334155')}`,
              }}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:'500',color: isLight ? '#1e293b' : '#F1F5F9',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{wf.name}</div>
                  <div style={{fontSize:'11px',color: isLight ? '#64748b' : '#475569'}}>{new Date(wf.updated_at).toLocaleString()} · {wf.nodes?.length||0} nodes</div>
                </div>
                <button onClick={()=>{handleLoad(wf._id);setShowVersionPanel(false)}}
                  style={{fontSize:'11px',color:'#3B82F6',background:'none',border:'none',cursor:'pointer',padding:'2px 6px',borderRadius:'5px',whiteSpace:'nowrap'}}
                >Load</button>
                <button onClick={()=>{handleDeleteClick(wf);setShowVersionPanel(false)}}
                  style={{background:'none',border:'none',cursor:'pointer',color: isLight ? '#94a3b8' : '#475569',padding:'2px'}}
                ><TrashIcon style={{width:'12px',height:'12px'}}/></button>
              </div>
            ))
          }
        </div>
      )}

      {/* ── Save Dialog ───────────────────────────────────────────────── */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl w-96 shadow-xl"
            style={{border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`, background: isLight ? '#ffffff' : undefined}}>
            <h3 className="text-lg font-semibold mb-4" style={{color: isLight ? '#1e293b' : '#F1F5F9'}}>Save Workflow</h3>
            <input
              type="text"
              placeholder="Enter workflow name…"
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSave()}
              className="w-full rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: isLight ? '#f8fafc' : '#1e293b',
                border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                color: isLight ? '#1e293b' : '#F1F5F9',
              }}
              autoFocus
            />
            <div className="flex space-x-3">
              <button onClick={handleSave} disabled={!workflowName.trim()||saving}
                className="flex-1 text-white py-2 rounded-lg disabled:opacity-50 transition-all"
                style={{background: saving ? '#1d4ed8' : '#3B82F6'}}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={()=>setShowSaveDialog(false)}
                className="flex-1 py-2 rounded-lg transition-all"
                style={{
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                  color: isLight ? '#475569' : '#94a3b8',
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Load Dialog ───────────────────────────────────────────────── */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto shadow-xl"
            style={{border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`, background: isLight ? '#ffffff' : undefined}}>
            <h3 className="text-lg font-semibold mb-4" style={{color: isLight ? '#1e293b' : '#F1F5F9'}}>Load Workflow</h3>
            {savedWorkflows.length === 0
              ? <p className="text-center py-4" style={{color: isLight ? '#64748b' : '#94a3b8'}}>No saved workflows</p>
              : <div className="space-y-2">
                  {savedWorkflows.map(wf => (
                    <div key={wf._id} className="flex items-center space-x-2">
                      <button onClick={()=>handleLoad(wf._id)}
                        className="flex-1 text-left p-3 rounded-lg transition-all"
                        style={{
                          background: isLight ? '#f8fafc' : '#1e293b',
                          border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background=isLight?'#f1f5f9':'#293548'}
                        onMouseLeave={e=>e.currentTarget.style.background=isLight?'#f8fafc':'#1e293b'}>
                        <div className="font-medium" style={{color: isLight ? '#1e293b' : '#F1F5F9'}}>{wf.name}</div>
                        <div className="text-sm" style={{color: isLight ? '#64748b' : '#64748b'}}>
                          {new Date(wf.updated_at).toLocaleDateString()} · {wf.nodes?.length||0} nodes
                        </div>
                      </button>
                      <button onClick={()=>handleDeleteClick(wf)}
                        className="p-2 rounded-lg transition-all"
                        style={{background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.25)'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.2)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
            }
            <button onClick={()=>setShowLoadDialog(false)}
              className="w-full mt-4 py-2 rounded-lg transition-all"
              style={{
                background: isLight ? '#f1f5f9' : '#1e293b',
                border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                color: isLight ? '#475569' : '#94a3b8',
              }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────────── */}
      {showDeleteDialog && workflowToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl w-96 shadow-xl"
            style={{border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`, background: isLight ? '#ffffff' : undefined}}>
            <h3 className="text-lg font-semibold mb-4" style={{color: isLight ? '#1e293b' : '#F1F5F9'}}>Delete Workflow</h3>
            <p className="mb-4" style={{color: isLight ? '#475569' : '#cbd5e1'}}>
              Are you sure you want to delete "<span className="font-medium" style={{color: isLight ? '#1e293b' : '#F1F5F9'}}>{workflowToDelete.name}</span>"?
            </p>
            <p className="text-sm mb-6" style={{color: isLight ? '#94a3b8' : '#64748b'}}>This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button onClick={handleDeleteConfirm} disabled={deleting}
                className="flex-1 text-white py-2 rounded-lg disabled:opacity-50 transition-all"
                style={{background:'#EF4444'}}
                onMouseEnter={e=>e.currentTarget.style.background='#DC2626'}
                onMouseLeave={e=>e.currentTarget.style.background='#EF4444'}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={()=>{setShowDeleteDialog(false);setWorkflowToDelete(null)}}
                className="flex-1 py-2 rounded-lg transition-all"
                style={{
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                  color: isLight ? '#475569' : '#94a3b8',
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

