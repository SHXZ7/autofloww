"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'
import TopNav from '../../components/TopNav'
import ProfileSettings from '../../components/ProfileSettings'
import MobileBottomNav from '../../components/MobileBottomNav'
import {
  UserCircleIcon,
  KeyIcon,
  LockClosedIcon,
  RectangleGroupIcon,
  CreditCardIcon,
  SunIcon,
  MoonIcon,
  BoltIcon,
  RectangleStackIcon,
  DocumentDuplicateIcon,
  PlayCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const GLOBAL_CSS = `
    *, *::before, *::after { box-sizing: border-box; }
  body { font-family: var(--font-space-grotesk, system-ui, sans-serif); background: #020617; margin: 0; -webkit-font-smoothing: antialiased; }
  html.light body { background: #f8fafc !important; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(51,65,85,0.8); border-radius: 8px; }
  html.light ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.8); }
  .setting-row:hover { background: rgba(30,41,59,0.7) !important; }
  html.light .setting-row:hover { background: rgba(226,232,240,0.9) !important; }
  .setting-row { transition: background 0.12s ease; }
  html.light .settings-page-bg { background: #f8fafc !important; }
  html.light .settings-heading { color: #0f172a !important; }
  html.light .settings-acc-card { background: #ffffff !important; border-color: #e2e8f0 !important; }
  html.light .acc-user-name { color: #1e293b !important; }
  html.light .settings-list-card { background: #ffffff !important; border-color: #e2e8f0 !important; }
  html.light .setting-row { border-bottom-color: #e2e8f0 !important; }
  html.light .setting-icon-box { background: #f1f5f9 !important; border-color: #e2e8f0 !important; }
  html.light .setting-row-title { color: #1e293b !important; }
  html.light .setting-badge { background: #e2e8f0 !important; color: #475569 !important; }
`

const SETTINGS_SECTIONS = [
  {
    id: 'profile',
    icon: UserCircleIcon,
    title: 'Profile',
    desc: 'Update your name, email, and profile information',
    tab: 'profile',
  },
  {
    id: 'api',
    icon: KeyIcon,
    title: 'API Keys',
    desc: 'Manage API keys for Groq, Google Sheets, Discord, WhatsApp, and more',
    tab: 'api',
  },
  {
    id: 'password',
    icon: LockClosedIcon,
    title: 'Password & Security',
    desc: 'Change your password and manage account security settings',
    tab: 'password',
  },
  {
    id: 'workspace',
    icon: RectangleGroupIcon,
    title: 'Workspace',
    desc: 'Configure your workspace name, preferences, and team settings',
    tab: 'workspace',
  },
  {
    id: 'billing',
    icon: CreditCardIcon,
    title: 'Billing & Plan',
    desc: 'Manage your subscription, upgrade your plan, and view invoices',
    tab: 'billing',
    badge: 'Coming Soon',
  },
]

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Flow', icon: BoltIcon },
  { href: '/workflows', label: 'Workflows', icon: RectangleStackIcon },
  { href: '/templates', label: 'Templates', icon: DocumentDuplicateIcon },
  { href: '/runs', label: 'Runs', icon: PlayCircleIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
]

export default function SettingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading, checkAuth, user } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [theme, setTheme] = useState('dark')
  const [connectNotice, setConnectNotice] = useState({ type: '', text: '' })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setTheme(saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('light', next === 'light')
  }

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => {
    if (!loading && isAuthenticated === false) router.push('/homepage')
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const status = params.get('google_connect')
    if (!status) return

    const message = params.get('message')
    const isSuccess = status === 'success'

    setConnectNotice({
      type: isSuccess ? 'success' : 'error',
      text: message || (isSuccess ? 'Google account connected successfully.' : 'Google connection failed.'),
    })
    setActiveTab('api')
    setModalOpen(true)

    const timeout = setTimeout(() => {
      setConnectNotice({ type: '', text: '' })
    }, 5000)

    router.replace('/settings')
    return () => clearTimeout(timeout)
  }, [router])

  const openTab = (tab) => {
    if (tab === 'billing') return
    setActiveTab(tab)
    setModalOpen(true)
  }

  if (loading || !isAuthenticated) return null

  return (
    <div className="settings-page-bg" style={{ display: 'flex', flexDirection: 'row', height: isMobile ? '100dvh' : '100vh', background: '#020617', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", overflow: 'hidden' }}>
      <style jsx global>{GLOBAL_CSS}</style>
      {!isMobile && <TopNav />}

      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '18px 12px 96px' : '32px 40px' }}>
        {connectNotice.text && (
          <div style={{
            marginBottom: '16px',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '12px',
            border: connectNotice.type === 'success' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)',
            background: connectNotice.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: connectNotice.type === 'success' ? '#22c55e' : '#f87171',
          }}>
            {connectNotice.text}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: isMobile ? '22px' : '36px' }}>
          <h1 className="settings-heading" style={{ fontSize: '22px', fontWeight: '700', color: '#F1F5F9', margin: 0, letterSpacing: '-0.4px' }}>Settings</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Manage your account, API keys, and workspace preferences
          </p>
        </div>

        {/* Account card */}
        <div className="settings-acc-card" style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '12px', padding: isMobile ? '16px' : '20px 24px', marginBottom: '28px',
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}>
          <div style={{
            width: '48px', height: '48px', flexShrink: 0, borderRadius: '50%',
            background: '#3B82F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '700', color: 'white',
          }}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div className="acc-user-name" style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '3px' }}>
              {user?.name || 'AutoFlow User'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>{user?.email || 'user@autoflow.com'}</div>
          </div>
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
            background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
            border: '1px solid rgba(59,130,246,0.3)',
          }}>
            Free Plan
          </span>
        </div>

        {/* Settings sections */}
        <div className="settings-list-card" style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          {/* Theme toggle row */}
          <div
            className="setting-row"
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '18px 24px',
              borderBottom: '1px solid #1e293b',
              cursor: 'pointer',
            }}
          >
            <div className="setting-icon-box" style={{
              width: '36px', height: '36px', flexShrink: 0, borderRadius: '8px',
              background: '#1e293b', border: '1px solid #1e293b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {theme === 'dark'
                ? <MoonIcon style={{ width: '17px', height: '17px', color: '#64748b' }} />
                : <SunIcon style={{ width: '17px', height: '17px', color: '#64748b' }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="setting-row-title" style={{ fontSize: '13.5px', fontWeight: '500', color: '#94a3b8' }}>Appearance</span>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                Currently {theme === 'dark' ? 'Dark' : 'Light'} mode — click to switch
              </div>
            </div>
            <div style={{
              position: 'relative', width: '40px', height: '22px', borderRadius: '11px',
              background: theme === 'light' ? '#3B82F6' : '#334155',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: '3px',
                left: theme === 'light' ? '21px' : '3px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
              }} />
            </div>
          </div>
          {SETTINGS_SECTIONS.map((section, i) => {
            const Icon = section.icon
            const isLast = i === SETTINGS_SECTIONS.length - 1
            return (
              <div
                key={section.id}
                className={section.tab === 'billing' ? '' : 'setting-row'}
                onClick={() => openTab(section.tab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: isMobile ? '16px 14px' : '18px 24px',
                  borderBottom: isLast ? 'none' : '1px solid #1e293b',
                  cursor: section.tab === 'billing' ? 'default' : 'pointer',
                  opacity: section.tab === 'billing' ? 0.45 : 1,
                }}
              >
                <div className="setting-icon-box" style={{
                  width: '36px', height: '36px', flexShrink: 0, borderRadius: '8px',
                  background: '#1e293b', border: '1px solid #1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon style={{ width: '17px', height: '17px', color: '#64748b' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="setting-row-title" style={{ fontSize: '13.5px', fontWeight: '500', color: '#94a3b8' }}>{section.title}</span>
                    {section.badge && (
                      <span className="setting-badge" style={{
                        fontSize: '10px', fontWeight: '600', padding: '2px 7px',
                        borderRadius: '10px', background: '#1e293b', color: '#64748b',
                      }}>
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{section.desc}</div>
                </div>
                {section.tab !== 'billing' && (
                  <span style={{ color: '#475569', fontSize: '18px', flexShrink: 0 }}>›</span>
                )}
              </div>
            )
          })}
        </div>

        {isMobile && (
          <MobileBottomNav
            items={MOBILE_NAV_ITEMS}
            pathname={pathname}
            onNavigate={(href) => router.push(href)}
            isLight={theme === 'light'}
          />
        )}
      </div>

      {/* ProfileSettings modal */}
      <ProfileSettings
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        activeTab={activeTab}
      />
    </div>
  )
}
