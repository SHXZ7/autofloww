"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'
import { useFlowStore } from '../../stores/flowStore'
import TopNav from '../../components/TopNav'
import MobileBottomNav from '../../components/MobileBottomNav'
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ClockIcon,
  CircleStackIcon,
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
  .wf-card { transition: all 0.15s ease; }
  .wf-card:hover { background: #EDE6DC !important; border-color: #EB5E3D !important; transform: translateY(-2px); }
  .wf-card:hover .wf-card-edit { opacity: 1 !important; }
  .wf-card-edit { opacity: 0; transition: opacity 0.15s ease; }
  .wf-del:hover { background: rgba(235,94,61,0.15) !important; color: #EB5E3D !important; }
`

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Flow', icon: BoltIcon },
  { href: '/workflows', label: 'Workflows', icon: RectangleStackIcon },
  { href: '/templates', label: 'Templates', icon: DocumentDuplicateIcon },
  { href: '/runs', label: 'Runs', icon: PlayCircleIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
]

export default function WorkflowsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const { savedWorkflows, loadWorkflows, loadWorkflow, deleteWorkflow, newWorkflow } = useFlowStore()
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
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
    <div style={{ display: 'flex', flexDirection: 'row', height: isMobile ? '100dvh' : '100vh', background: '#F6F1EA', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", overflow: 'hidden' }}>
      <style jsx global>{GLOBAL_CSS}</style>
      {!isMobile && <TopNav />}

      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '18px 14px 96px' : '32px 40px' }}>
        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexDirection: isMobile ? 'column' : 'row',
          marginBottom: isMobile ? '18px' : '28px',
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '800', color: '#241812', margin: 0, letterSpacing: '-0.02em' }}>Workflows</h1>
            <p style={{ fontSize: '13px', color: '#736357', margin: '4px 0 0', fontWeight: '500' }}>
              {savedWorkflows.length} saved workflow{savedWorkflows.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleNew}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: isMobile ? '10px 14px' : '9px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: '#EB5E3D',
              color: 'white', fontSize: isMobile ? '12.5px' : '13.5px', fontWeight: '700',
              boxShadow: '0 4px 14px rgba(235,94,61,0.25)',
              transition: 'all 0.15s ease',
              fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#D94F2F'}
            onMouseLeave={e => e.currentTarget.style.background = '#EB5E3D'}
          >
            <PlusIcon style={{ width: '16px', height: '16px', strokeWidth: 2.5 }} />
            New Workflow
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search workflows…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: isMobile ? '100%' : '380px',
            background: '#FFFFFF',
            border: '1px solid #E5DCD0',
            borderRadius: '12px', padding: '10px 14px',
            color: '#241812', fontSize: '13px', outline: 'none',
            marginBottom: isMobile ? '16px' : '24px', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
            boxShadow: '0 2px 8px rgba(36,24,18,0.03)',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#EB5E3D'}
          onBlur={e => e.currentTarget.style.borderColor = '#E5DCD0'}
        />

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? '48px 16px' : '80px 24px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5DCD0', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EDE6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#EB5E3D', fontSize: '20px' }}>⚡</div>
            <div style={{ color: '#241812', fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>
              {search ? 'No workflows match your search' : 'No workflows yet'}
            </div>
            <div style={{ color: '#736357', fontSize: '13px', marginBottom: '20px' }}>
              {search ? 'Try a different search keyword' : 'Create your first automation workflow to get started'}
            </div>
            {!search && (
              <button onClick={handleNew} style={{
                padding: '9px 20px', borderRadius: '10px', border: '1px solid #E5DCD0',
                background: '#EDE6DC', color: '#241812', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E5DCD0'; e.currentTarget.style.color = '#EB5E3D' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#EDE6DC'; e.currentTarget.style.color = '#241812' }}
              >
                + Create workflow
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
            {filtered.map(w => (
              <div
                key={w._id}
                className="wf-card"
                onClick={() => handleOpen(w._id)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5DCD0',
                  borderRadius: '16px', padding: isMobile ? '16px' : '20px',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 4px 16px rgba(36,24,18,0.04)',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', marginBottom: '14px',
                  background: '#EDE6DC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CircleStackIcon style={{ width: '20px', height: '20px', color: '#EB5E3D' }} />
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#241812', marginBottom: '8px', paddingRight: '32px' }}>
                  {w.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#736357', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}>
                    <CircleStackIcon style={{ width: '12px', height: '12px', color: '#EB5E3D' }} />
                    {w.nodes?.length || 0} node{w.nodes?.length !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '12px', color: '#736357', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}>
                    <ClockIcon style={{ width: '12px', height: '12px', color: '#736357' }} />
                    {new Date(w.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {/* Action buttons */}
                <div style={{ position: 'absolute', top: '16px', right: '14px', display: 'flex', gap: '6px' }}>
                  <button
                    className="wf-card-edit"
                    onClick={e => { e.stopPropagation(); handleOpen(w._id) }}
                    style={{
                      padding: '5px 7px', borderRadius: '6px', border: '1px solid #E5DCD0', cursor: 'pointer',
                      background: '#EDE6DC', color: '#241812',
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
                      padding: '5px 7px', borderRadius: '6px', border: '1px solid #E5DCD0', cursor: 'pointer',
                      background: '#EDE6DC', color: '#736357',
                      transition: 'all 0.12s ease',
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
