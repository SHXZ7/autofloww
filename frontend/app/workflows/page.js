"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'
import { useFlowStore } from '../../stores/flowStore'
import TopNav from '../../components/TopNav'
import { PlusIcon, TrashIcon, PencilSquareIcon, ClockIcon, CircleStackIcon } from '@heroicons/react/24/outline'

const GLOBAL_CSS = `
    *, *::before, *::after { box-sizing: border-box; }
  body { font-family: var(--font-space-grotesk, system-ui, sans-serif); background: #020617; margin: 0; -webkit-font-smoothing: antialiased; }
  html.light body { background: #f8fafc !important; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(51,65,85,0.8); border-radius: 8px; }
  .wf-card:hover { background: #1e293b !important; border-color: #334155 !important; }
  html.light .wf-card:hover { background: #e2e8f0 !important; border-color: #cbd5e1 !important; }
  .wf-card:hover .wf-card-edit { opacity: 1 !important; }
  .wf-card-edit { opacity: 0; transition: opacity 0.15s ease; }
  .wf-del:hover { background: rgba(255,107,53,0.2) !important; color: #FF6B35 !important; }
  .gradient-text { background: linear-gradient(135deg, #00D4FF, #FF6B35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
`

export default function WorkflowsPage() {
  const router = useRouter()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const { savedWorkflows, loadWorkflows, loadWorkflow, deleteWorkflow, newWorkflow } = useFlowStore()
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => {
    if (!loading && isAuthenticated === false) router.push('/homepage')
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) loadWorkflows()
  }, [isAuthenticated, loadWorkflows])

  const handleOpen = async (id) => {
    await loadWorkflow(id)
    router.push('/')
  }

  const handleNew = () => {
    newWorkflow()
    router.push('/')
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this workflow?')) return
    setDeleting(id)
    await deleteWorkflow(id)
    await loadWorkflows()
    setDeleting(null)
  }

  const filtered = (savedWorkflows || []).filter(w =>
    w.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading || !isAuthenticated) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', background: '#020617', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)" }}>
      <style jsx global>{GLOBAL_CSS}</style>
      <TopNav />

      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F1F5F9', margin: 0, letterSpacing: '-0.4px' }}>Workflows</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              {savedWorkflows.length} workflow{savedWorkflows.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleNew}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: '#3B82F6',
              color: 'white', fontSize: '13px', fontWeight: '600',
              boxShadow: '0 0 20px rgba(59,130,246,0.25)',
            }}
          >
            <PlusIcon style={{ width: '15px', height: '15px' }} />
            New Workflow
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search workflows..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: '380px',
            background: '#1e293b', border: '1px solid #1e293b',
            borderRadius: '8px', padding: '8px 14px',
            color: '#ccc', fontSize: '13px', outline: 'none',
            marginBottom: '24px', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
          }}
        />

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚡</div>
            <div style={{ color: '#475569', fontSize: '15px', fontWeight: '500', marginBottom: '8px' }}>
              {search ? 'No workflows match your search' : 'No workflows yet'}
            </div>
            <div style={{ color: '#475569', fontSize: '13px', marginBottom: '24px' }}>
              {search ? 'Try a different search term' : 'Create your first automation workflow'}
            </div>
            {!search && (
              <button onClick={handleNew} style={{
                padding: '9px 20px', borderRadius: '8px', border: '1px solid #334155',
                background: '#1e293b', color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
              }}>
                + Create workflow
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {filtered.map(w => (
              <div
                key={w._id}
                className="wf-card"
                onClick={() => handleOpen(w._id)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px', padding: '20px',
                  cursor: 'pointer', transition: 'background 0.15s ease, border-color 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '9px', marginBottom: '14px',
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(255,107,53,0.15) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CircleStackIcon style={{ width: '18px', height: '18px', color: '#3B82F6' }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px', paddingRight: '28px' }}>
                  {w.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CircleStackIcon style={{ width: '11px', height: '11px' }} />
                    {w.nodes?.length || 0} node{w.nodes?.length !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ClockIcon style={{ width: '11px', height: '11px' }} />
                    {new Date(w.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {/* Action buttons */}
                <div style={{ position: 'absolute', top: '16px', right: '14px', display: 'flex', gap: '4px' }}>
                  <button
                    className="wf-card-edit"
                    onClick={e => { e.stopPropagation(); handleOpen(w._id) }}
                    style={{
                      padding: '4px 6px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                      background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                    }}
                    title="Edit"
                  >
                    <PencilSquareIcon style={{ width: '13px', height: '13px' }} />
                  </button>
                  <button
                    className="wf-del"
                    onClick={e => handleDelete(e, w._id)}
                    disabled={deleting === w._id}
                    style={{
                      padding: '4px 6px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                      background: '#1e293b', color: '#64748b',
                      transition: 'background 0.12s ease, color 0.12s ease',
                    }}
                    title="Delete"
                  >
                    <TrashIcon style={{ width: '13px', height: '13px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
