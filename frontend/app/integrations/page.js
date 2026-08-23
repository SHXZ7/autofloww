"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'
import TopNav from '../../components/TopNav'
import ProfileSettings from '../../components/ProfileSettings'
import MobileBottomNav from '../../components/MobileBottomNav'
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
  .int-card { transition: all 0.15s ease; }
  .int-card:hover { background: #EDE6DC !important; border-color: #EB5E3D !important; transform: translateY(-2px); }
  .config-btn { transition: all 0.15s ease; }
  .config-btn:hover { background: #EB5E3D !important; color: #FFFFFF !important; border-color: #EB5E3D !important; }
`

const INTEGRATIONS = [
  {
    id: 'groq',
    name: 'Groq / AI Models',
    desc: 'Powers all AI nodes — GPT, Llama, Gemini, Claude, Mistral — via the Groq inference engine.',
    icon: '🤖',
    color: '#DDA449',
    category: 'AI',
    docsUrl: 'https://console.groq.com/',
    settingsTab: 'api',
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    desc: 'Read and write spreadsheet data directly from your automation workflows.',
    icon: '📊',
    color: '#2EA38D',
    category: 'Data',
    docsUrl: 'https://developers.google.com/sheets',
    settingsTab: 'api',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    desc: 'Upload, download, and manage files in Google Drive from your workflows.',
    icon: '📁',
    color: '#DDA449',
    category: 'Data',
    docsUrl: 'https://developers.google.com/drive',
    settingsTab: 'api',
  },
  {
    id: 'gmail',
    name: 'Gmail / SMTP',
    desc: 'Send automated emails using Gmail or any SMTP-compatible provider.',
    icon: '📧',
    color: '#5B9EB5',
    category: 'Communication',
    docsUrl: 'https://support.google.com/mail/answer/185833',
    settingsTab: 'api',
  },
  {
    id: 'discord',
    name: 'Discord',
    desc: 'Post messages and alerts to Discord channels via webhook or bot token.',
    icon: '💬',
    color: '#5B9EB5',
    category: 'Communication',
    docsUrl: 'https://discord.com/developers/docs',
    settingsTab: 'api',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Cloud API',
    desc: 'Send WhatsApp messages directly through Meta WhatsApp Cloud API.',
    icon: '📱',
    color: '#2EA38D',
    category: 'Communication',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    settingsTab: 'api',
  },
  {
    id: 'stability',
    name: 'Stability AI',
    desc: 'Generate high-quality images using Stability AI\'s image generation API.',
    icon: '🎨',
    color: '#EB5E3D',
    category: 'AI',
    docsUrl: 'https://stability.ai/docs',
    settingsTab: 'api',
  },
  {
    id: 'webhook',
    name: 'Webhooks',
    desc: 'Trigger workflows from external services using inbound webhook endpoints.',
    icon: '🪝',
    color: '#EB5E3D',
    category: 'Automation',
    docsUrl: '#',
    settingsTab: 'api',
  },
]

const CATEGORIES = ['All', 'AI', 'Communication', 'Data', 'Automation']

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Flow', icon: BoltIcon },
  { href: '/workflows', label: 'Workflows', icon: RectangleStackIcon },
  { href: '/templates', label: 'Templates', icon: DocumentDuplicateIcon },
  { href: '/runs', label: 'Runs', icon: PlayCircleIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
]

export default function IntegrationsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const [filter, setFilter] = useState('All')
  const [settingsOpen, setSettingsOpen] = useState(false)
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

  const filtered = filter === 'All' ? INTEGRATIONS : INTEGRATIONS.filter(i => i.category === filter)

  if (loading || !isAuthenticated) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: isMobile ? '100dvh' : '100vh', background: '#F6F1EA', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", overflow: 'hidden' }}>
      <style jsx global>{GLOBAL_CSS}</style>
      {!isMobile && <TopNav />}

      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '18px 14px 96px' : '32px 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '18px' : '28px' }}>
          <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '800', color: '#241812', margin: 0, letterSpacing: '-0.02em' }}>Integrations</h1>
          <p style={{ fontSize: '13px', color: '#736357', margin: '4px 0 0', fontWeight: '500' }}>
            Connect external services and manage API credentials in Settings → API Keys
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '6px 16px', borderRadius: '20px',
                border: '1px solid #E5DCD0',
                background: filter === cat ? '#EB5E3D' : '#EDE6DC',
                color: filter === cat ? '#FFFFFF' : '#241812',
                fontSize: '12.5px', fontWeight: '700', cursor: 'pointer',
                fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Integration grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
          {filtered.map(integration => (
            <div
              key={integration.id}
              className="int-card"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5DCD0',
                borderRadius: '16px', padding: isMobile ? '16px' : '22px',
                boxShadow: '0 4px 16px rgba(36,24,18,0.04)',
              }}
            >
              {/* Icon + name row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '42px', height: '42px', flexShrink: 0, borderRadius: '12px',
                  background: '#EDE6DC',
                  border: '1px solid #E5DCD0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px',
                }}>
                  {integration.icon}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#241812', marginBottom: '4px' }}>{integration.name}</div>
                  <span style={{
                    fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                    background: '#EDE6DC', color: '#736357', border: '1px solid #E5DCD0',
                  }}>
                    {integration.category}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: '#736357', lineHeight: '1.55', margin: '0 0 18px', fontWeight: '500' }}>
                {integration.desc}
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="config-btn"
                  onClick={() => setSettingsOpen(true)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: '10px',
                    border: '1px solid #E5DCD0',
                    background: '#EDE6DC', color: '#241812',
                    fontSize: '12.5px', fontWeight: '700', cursor: 'pointer',
                    fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                  }}
                >
                  Configure Key →
                </button>
              </div>
            </div>
          ))}
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

      {/* Reuse ProfileSettings modal at API Keys tab */}
      <ProfileSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        activeTab="api"
      />
    </div>
  )
}
