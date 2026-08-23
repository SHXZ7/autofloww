"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'
import TopNav from '../../components/TopNav'
import MobileBottomNav from '../../components/MobileBottomNav'
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, ClockIcon, PlayIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import {
  BoltIcon,
  RectangleStackIcon,
  DocumentDuplicateIcon,
  PlayCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: var(--font-space-grotesk, system-ui, sans-serif); background: #F6F1EA; margin: 0; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #E5DCD0; border-radius: 8px; }
  .run-row { transition: background 0.12s ease; }
  .run-row:hover { background: #EDE6DC !important; }
  .logs-btn:hover { background: #E5DCD0 !important; color: #EB5E3D !important; border-color: #EB5E3D !important; }
`

const STATUS_STYLES = {
  success: { color: '#2EA38D', bg: 'rgba(46,163,141,0.12)', border: 'rgba(46,163,141,0.25)', icon: CheckCircleIcon, label: 'Success' },
  failed:  { color: '#E05252', bg: 'rgba(224,82,82,0.12)',  border: 'rgba(224,82,82,0.25)',  icon: XCircleIcon,     label: 'Failed'  },
  running: { color: '#EB5E3D', bg: 'rgba(235,94,61,0.12)', border: 'rgba(235,94,61,0.25)', icon: ArrowPathIcon,   label: 'Running' },
  pending: { color: '#DDA449', bg: 'rgba(221,164,73,0.12)', border: 'rgba(221,164,73,0.25)', icon: ClockIcon,      label: 'Pending' },
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://autoflow-f6hga9djg0a5b4fj.uaenorth-01.azurewebsites.net'

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Flow', icon: BoltIcon },
  { href: '/workflows', label: 'Workflows', icon: RectangleStackIcon },
  { href: '/templates', label: 'Templates', icon: DocumentDuplicateIcon },
  { href: '/runs', label: 'Runs', icon: PlayCircleIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
]

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
  const pathname = usePathname()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const [runs, setRuns] = useState([])
  const [fetching, setFetching] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedRun, setExpandedRun] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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

  const colors = {
    pageBg: '#F6F1EA',
    panelBg: '#FFFFFF',
    panelBorder: '#E5DCD0',
    heading: '#241812',
    text: '#241812',
    muted: '#736357',
    tabBg: '#EDE6DC',
    tabActiveBg: '#EB5E3D',
    rowExpandedBg: '#F6F1EA',
    logsSectionBg: '#F6F1EA',
    logsBoxBg: '#FFFFFF',
  }

  if (loading || !isAuthenticated) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: isMobile ? '100dvh' : '100vh', background: colors.pageBg, fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", overflow: 'hidden' }}>
      <style jsx global>{GLOBAL_CSS}</style>
      {!isMobile && <TopNav />}

      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '18px 14px 96px' : '32px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: isMobile ? '18px' : '28px', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '800', color: colors.heading, margin: 0, letterSpacing: '-0.02em' }}>Execution History</h1>
            <p style={{ fontSize: '13px', color: colors.muted, margin: '4px 0 0', fontWeight: '500' }}>Monitor every workflow run and inspect logs</p>
          </div>
          <button
            onClick={fetchRuns}
            disabled={fetching}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '10px', border: `1px solid ${colors.panelBorder}`,
              background: '#EDE6DC', color: '#241812', fontSize: '13px', fontWeight: '700', cursor: fetching ? 'default' : 'pointer',
              fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
              opacity: fetching ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!fetching) { e.currentTarget.style.background = '#E5DCD0'; e.currentTarget.style.color = '#EB5E3D' } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#EDE6DC'; e.currentTarget.style.color = '#241812' }}
          >
            <ArrowPathIcon style={{ width: '15px', height: '15px', strokeWidth: 2, animation: fetching ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: colors.tabBg, borderRadius: '12px', padding: '4px', width: isMobile ? '100%' : 'fit-content', border: `1px solid ${colors.panelBorder}`, overflowX: 'auto' }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                minWidth: isMobile ? '72px' : 'auto',
                background: statusFilter === tab ? colors.tabActiveBg : 'transparent',
                color: statusFilter === tab ? '#FFFFFF' : colors.muted,
                fontSize: '12.5px', fontWeight: statusFilter === tab ? '700' : '600',
                fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(36,24,18,0.04)' }}>
          {/* Table header */}
          {!isMobile && (
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 80px',
            padding: '14px 20px', borderBottom: `1px solid ${colors.panelBorder}`,
            background: '#F6F1EA',
          }}>
            {['Workflow', 'Status', 'Started', 'Duration', 'Logs'].map(h => (
              <span key={h} style={{ fontSize: '11px', fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
            ))}
          </div>
          )}

          {fetching ? (
            <div style={{ padding: '48px', textAlign: 'center', color: colors.muted, fontSize: '13px', fontWeight: '500' }}>Loading executions…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '72px 0', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EDE6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#EB5E3D' }}>
                <PlayIcon style={{ width: '22px', height: '22px' }} />
              </div>
              <div style={{ color: colors.heading, fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>No executions yet</div>
              <div style={{ color: colors.muted, fontSize: '13px' }}>Run a workflow to see logs and history here</div>
            </div>
          ) : (
            filtered.map((run, i) => {
              const s = STATUS_STYLES[run.status?.toLowerCase()] || STATUS_STYLES.pending
              const StatusIcon = s.icon
              const isExpanded = expandedRun === (run._id || i)
              const toggleExpand = () => setExpandedRun(isExpanded ? null : (run._id || i))
              return (
                <div key={run._id || i} style={{ borderBottom: `1px solid ${colors.panelBorder}` }}>
                  {/* Row */}
                  <div
                    className="run-row"
                    style={{
                      display: isMobile ? 'flex' : 'grid',
                      gridTemplateColumns: isMobile ? undefined : '2fr 1fr 1.5fr 1fr 80px',
                      flexDirection: isMobile ? 'column' : undefined,
                      gap: isMobile ? '10px' : undefined,
                      padding: isMobile ? '14px 14px' : '14px 20px',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      background: isExpanded ? colors.rowExpandedBg : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '13.5px', color: colors.text, fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '12px' }}>
                      {run.workflow_name || run.name || 'Unnamed Workflow'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '3px 10px', borderRadius: '20px', background: s.bg,
                          color: s.color, border: `1px solid ${s.border || 'transparent'}`,
                          fontSize: '11.5px', fontWeight: '700',
                        }}>
                          <StatusIcon style={{ width: '12px', height: '12px' }} />
                          {s.label}
                        </span>
                      </span>
                      <span style={{ fontSize: '12.5px', color: colors.muted, fontWeight: '500' }}>
                        {formatDate(run.created_at)}
                      </span>
                      <span style={{ fontSize: '12.5px', color: colors.muted, fontWeight: '500' }}>
                        {formatDuration(run.duration_ms)}
                      </span>
                    </div>
                    <span>
                      <button
                        className="logs-btn"
                        onClick={toggleExpand}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '5px 12px', borderRadius: '8px', border: `1px solid ${colors.panelBorder}`,
                          background: isExpanded ? '#EDE6DC' : '#F6F1EA',
                          color: isExpanded ? '#EB5E3D' : colors.heading,
                          fontSize: '11.5px', fontWeight: '700', cursor: 'pointer',
                          fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                          transition: 'all 0.15s ease',
                          borderColor: isExpanded ? '#EB5E3D' : colors.panelBorder,
                        }}
                      >
                        {isExpanded
                          ? <ChevronDownIcon style={{ width: '12px', height: '12px' }} />
                          : <ChevronRightIcon style={{ width: '12px', height: '12px' }} />
                        }
                        View
                      </button>
                    </span>
                  </div>

                  {/* Expanded logs */}
                  {isExpanded && (
                    <div style={{ padding: isMobile ? '0 14px 16px' : '0 20px 18px', background: colors.logsSectionBg }}>
                      <div style={{
                        background: colors.logsBoxBg, border: `1px solid ${colors.panelBorder}`, borderRadius: '12px',
                        padding: '14px 16px', fontSize: '12px', fontFamily: 'monospace',
                        color: colors.text, maxHeight: isMobile ? '180px' : '260px', overflowY: 'auto',
                        boxShadow: '0 2px 8px rgba(36,24,18,0.03)',
                      }}>
                        {run.result && typeof run.result === 'object' ? (
                          Object.entries(run.result).map(([nodeId, val]) => (
                            <div key={nodeId} style={{ marginBottom: '10px' }}>
                              <span style={{ color: '#EB5E3D', fontWeight: 700 }}>Node {nodeId}</span>
                              <span style={{ color: colors.muted }}> → </span>
                              <span style={{
                                color: typeof val === 'string' && val.toLowerCase().startsWith('error') ? '#E05252' : '#2EA38D',
                                fontWeight: 600,
                              }}>
                                {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: colors.muted }}>{run.result ? JSON.stringify(run.result) : 'No output recorded'}</span>
                        )}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: colors.muted, fontWeight: '600' }}>
                        {run.nodes?.length || 0} nodes · {run.edges?.length || 0} edges
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {isMobile && (
          <MobileBottomNav
            items={MOBILE_NAV_ITEMS}
            pathname={pathname}
            onNavigate={(href) => router.push(href)}
            isLight={true}
          />
        )}
      </div>
    </div>
  )
}
