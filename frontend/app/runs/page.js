"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'
import TopNav from '../../components/TopNav'
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, ClockIcon, PlayIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const GLOBAL_CSS = `
    *, *::before, *::after { box-sizing: border-box; }
  body { font-family: var(--font-space-grotesk, system-ui, sans-serif); background: #020617; margin: 0; -webkit-font-smoothing: antialiased; }
  html.light body { background: #f8fafc !important; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(51,65,85,0.8); border-radius: 8px; }
  .run-row:hover { background: rgba(15,23,42,0.6) !important; }
  html.light .run-row:hover { background: rgba(226,232,240,0.6) !important; }
  .run-row { transition: background 0.1s ease; }
  .logs-btn:hover { background: rgba(59,130,246,0.12) !important; color: #60a5fa !important; border-color: rgba(59,130,246,0.3) !important; }
`

const STATUS_STYLES = {
  success: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircleIcon, label: 'Success' },
  failed:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: XCircleIcon,     label: 'Failed'  },
  running: { color: '#3B82F6', bg: 'rgba(0,212,255,0.1)', icon: ArrowPathIcon,   label: 'Running' },
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: ClockIcon,      label: 'Pending' },
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function formatDuration(ms) {
  if (!ms && ms !== 0) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch { return dateStr }
}

export default function RunsPage() {
  const router = useRouter()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const [runs, setRuns] = useState([])
  const [fetching, setFetching] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedRun, setExpandedRun] = useState(null)

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => {
    if (!loading && isAuthenticated === false) router.push('/homepage')
  }, [loading, isAuthenticated, router])

  const fetchRuns = async () => {
    setFetching(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/executions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRuns(Array.isArray(data) ? data : data.executions || [])
      } else {
        setRuns([])
      }
    } catch {
      setRuns([])
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchRuns()
  }, [isAuthenticated])

  const STATUS_TABS = ['All', 'Success', 'Failed', 'Running']
  const filtered = statusFilter === 'All'
    ? runs
    : runs.filter(r => (r.status || '').toLowerCase() === statusFilter.toLowerCase())

  if (loading || !isAuthenticated) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', background: '#020617', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)" }}>
      <style jsx global>{GLOBAL_CSS}</style>
      <TopNav />

      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F1F5F9', margin: 0, letterSpacing: '-0.4px' }}>Execution History</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Monitor every workflow run and inspect logs</p>
          </div>
          <button
            onClick={fetchRuns}
            disabled={fetching}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '7px', border: '1px solid #1e293b',
              background: '#1e293b', color: '#64748b', fontSize: '13px', cursor: fetching ? 'default' : 'pointer',
              fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
              opacity: fetching ? 0.6 : 1,
            }}
          >
            <ArrowPathIcon style={{ width: '14px', height: '14px', animation: fetching ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: '#0f172a', borderRadius: '9px', padding: '3px', width: 'fit-content', border: '1px solid #1e293b' }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: statusFilter === tab ? '#1e293b' : 'transparent',
                color: statusFilter === tab ? '#F1F5F9' : '#64748b',
                fontSize: '12.5px', fontWeight: statusFilter === tab ? '500' : '400',
                fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", transition: 'all 0.12s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 80px',
            padding: '12px 20px', borderBottom: '1px solid #1e293b',
          }}>
            {['Workflow', 'Status', 'Started', 'Duration', 'Logs'].map(h => (
              <span key={h} style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
            ))}
          </div>

          {fetching ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>Loading executions...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '72px 0', textAlign: 'center' }}>
              <PlayIcon style={{ width: '32px', height: '32px', color: '#475569', margin: '0 auto 14px' }} />
              <div style={{ color: '#475569', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>No executions yet</div>
              <div style={{ color: '#475569', fontSize: '12.5px' }}>Run a workflow to see logs here</div>
            </div>
          ) : (
            filtered.map((run, i) => {
              const s = STATUS_STYLES[run.status?.toLowerCase()] || STATUS_STYLES.pending
              const StatusIcon = s.icon
              const isExpanded = expandedRun === (run._id || i)
              const toggleExpand = () => setExpandedRun(isExpanded ? null : (run._id || i))
              return (
                <div key={run._id || i} style={{ borderBottom: '1px solid #1e293b' }}>
                  {/* Row */}
                  <div
                    className="run-row"
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 80px',
                      padding: '13px 20px',
                      alignItems: 'center',
                      background: isExpanded ? 'rgba(15,23,42,0.7)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '12px' }}>
                      {run.workflow_name || run.name || 'Unnamed Workflow'}
                    </span>
                    <span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 9px', borderRadius: '20px', background: s.bg,
                        color: s.color, fontSize: '11.5px', fontWeight: '500',
                      }}>
                        <StatusIcon style={{ width: '11px', height: '11px' }} />
                        {s.label}
                      </span>
                    </span>
                    <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                      {formatDate(run.created_at)}
                    </span>
                    <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                      {formatDuration(run.duration_ms)}
                    </span>
                    <span>
                      <button
                        className="logs-btn"
                        onClick={toggleExpand}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '5px', border: '1px solid #1e293b',
                          background: isExpanded ? 'rgba(59,130,246,0.1)' : 'transparent',
                          color: isExpanded ? '#60a5fa' : '#64748b',
                          fontSize: '11.5px', cursor: 'pointer',
                          fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                          transition: 'all 0.12s ease',
                          borderColor: isExpanded ? 'rgba(59,130,246,0.3)' : '#1e293b',
                        }}
                      >
                        {isExpanded
                          ? <ChevronDownIcon style={{ width: '11px', height: '11px' }} />
                          : <ChevronRightIcon style={{ width: '11px', height: '11px' }} />
                        }
                        View
                      </button>
                    </span>
                  </div>

                  {/* Expanded logs */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 16px', background: 'rgba(2,6,23,0.6)' }}>
                      <div style={{
                        background: '#020617', border: '1px solid #1e293b', borderRadius: '8px',
                        padding: '14px 16px', fontSize: '12px', fontFamily: 'monospace',
                        color: '#94a3b8', maxHeight: '260px', overflowY: 'auto',
                      }}>
                        {run.result && typeof run.result === 'object' ? (
                          Object.entries(run.result).map(([nodeId, val]) => (
                            <div key={nodeId} style={{ marginBottom: '10px' }}>
                              <span style={{ color: '#3B82F6', fontWeight: 600 }}>Node {nodeId}</span>
                              <span style={{ color: '#475569' }}> → </span>
                              <span style={{
                                color: typeof val === 'string' && val.toLowerCase().startsWith('error') ? '#ef4444' : '#a3e635'
                              }}>
                                {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span>{run.result ? JSON.stringify(run.result) : 'No output recorded'}</span>
                        )}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569' }}>
                        {run.nodes?.length || 0} nodes · {run.edges?.length || 0} edges
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
