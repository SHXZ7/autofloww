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
  body { font-family: var(--font-space-grotesk, system-ui, sans-serif); background: #F6F1EA; margin: 0; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #E5DCD0; border-radius: 8px; }
  .setting-row { transition: background 0.12s ease; }
  .setting-row:hover { background: #EDE6DC !important; }
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
  const [connectNotice, setConnectNotice] = useState({ type: '', text: '' })
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
    <div style={{ display: 'flex', flexDirection: 'row', height: isMobile ? '100dvh' : '100vh', background: '#F6F1EA', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", overflow: 'hidden' }}>
      <style jsx global>{GLOBAL_CSS}</style>
      {!isMobile && <TopNav />}

      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '18px 14px 96px' : '32px 40px' }}>
        {connectNotice.text && (
          <div style={{
            marginBottom: '16px',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12.5px',
            fontWeight: '600',
            border: connectNotice.type === 'success' ? '1px solid rgba(46,163,141,0.35)' : '1px solid rgba(224,82,82,0.35)',
            background: connectNotice.type === 'success' ? 'rgba(46,163,141,0.12)' : 'rgba(224,82,82,0.12)',
            color: connectNotice.type === 'success' ? '#2EA38D' : '#E05252',
          }}>
            {connectNotice.text}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: isMobile ? '22px' : '32px' }}>
          <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '800', color: '#241812', margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ fontSize: '13px', color: '#736357', margin: '4px 0 0', fontWeight: '500' }}>
            Manage your account, API keys, and workspace preferences
          </p>
        </div>

        {/* Account card */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5DCD0',
          borderRadius: '16px', padding: isMobile ? '16px' : '20px 24px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: isMobile ? 'wrap' : 'nowrap',
          boxShadow: '0 4px 16px rgba(36,24,18,0.04)',
        }}>
          <div style={{
            width: '48px', height: '48px', flexShrink: 0, borderRadius: '12px',
            background: 'linear-gradient(135deg, #EB5E3D 0%, #D94F2F 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '800', color: 'white',
            boxShadow: '0 4px 14px rgba(235,94,61,0.25)',
          }}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#241812', marginBottom: '2px' }}>
              {user?.name || 'AutoFlow User'}
            </div>
            <div style={{ fontSize: '13px', color: '#736357', fontWeight: '500' }}>{user?.email || 'user@autoflow.com'}</div>
          </div>
          <span style={{
            fontSize: '11.5px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px',
            background: '#EDE6DC', color: '#241812',
            border: '1px solid #E5DCD0',
          }}>
            Free Plan
          </span>
        </div>

        {/* Settings sections */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5DCD0',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(36,24,18,0.04)',
        }}>
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
                  borderBottom: isLast ? 'none' : '1px solid #E5DCD0',
                  cursor: section.tab === 'billing' ? 'default' : 'pointer',
                  opacity: section.tab === 'billing' ? 0.5 : 1,
                }}
              >
                <div style={{
                  width: '38px', height: '38px', flexShrink: 0, borderRadius: '10px',
                  background: '#EDE6DC', border: '1px solid #E5DCD0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon style={{ width: '18px', height: '18px', color: '#EB5E3D' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#241812' }}>{section.title}</span>
                    {section.badge && (
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                        borderRadius: '10px', background: '#EDE6DC', color: '#736357',
                        border: '1px solid #E5DCD0',
                      }}>
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#736357', marginTop: '2px', fontWeight: '500' }}>{section.desc}</div>
                </div>
                {section.tab !== 'billing' && (
                  <span style={{ color: '#736357', fontSize: '20px', flexShrink: 0, fontWeight: '700' }}>›</span>
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
            isLight={true}
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
