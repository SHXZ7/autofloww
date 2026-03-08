"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'
import TopNav from '../../components/TopNav'
import ProfileSettings from '../../components/ProfileSettings'

const GLOBAL_CSS = `
    *, *::before, *::after { box-sizing: border-box; }
  body { font-family: var(--font-space-grotesk, system-ui, sans-serif); background: #020617; margin: 0; -webkit-font-smoothing: antialiased; }
  html.light body { background: #f8fafc !important; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(51,65,85,0.8); border-radius: 8px; }
  .int-card:hover { background: #1e293b !important; border-color: #334155 !important; }
  html.light .int-card:hover { background: #e2e8f0 !important; border-color: #cbd5e1 !important; }
  .int-card { transition: background 0.15s ease, border-color 0.15s ease; }
  .config-btn:hover { background: rgba(59,130,246,0.2) !important; color: #3B82F6 !important; }
`

const INTEGRATIONS = [
  {
    id: 'groq',
    name: 'Groq / AI Models',
    desc: 'Powers all AI nodes — GPT, Llama, Gemini, Claude, Mistral — via the Groq inference engine.',
    icon: '🤖',
    color: '#3B82F6',
    category: 'AI',
    docsUrl: 'https://console.groq.com/',
    settingsTab: 'api',
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    desc: 'Read and write spreadsheet data directly from your automation workflows.',
    icon: '📊',
    color: '#34d399',
    category: 'Data',
    docsUrl: 'https://developers.google.com/sheets',
    settingsTab: 'api',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    desc: 'Upload, download, and manage files in Google Drive from your workflows.',
    icon: '📁',
    color: '#fbbf24',
    category: 'Data',
    docsUrl: 'https://developers.google.com/drive',
    settingsTab: 'api',
  },
  {
    id: 'gmail',
    name: 'Gmail / SMTP',
    desc: 'Send automated emails using Gmail or any SMTP-compatible provider.',
    icon: '📧',
    color: '#60a5fa',
    category: 'Communication',
    docsUrl: 'https://support.google.com/mail/answer/185833',
    settingsTab: 'api',
  },
  {
    id: 'discord',
    name: 'Discord',
    desc: 'Post messages and alerts to Discord channels via webhook or bot token.',
    icon: '💬',
    color: '#818cf8',
    category: 'Communication',
    docsUrl: 'https://discord.com/developers/docs',
    settingsTab: 'api',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    desc: 'Send SMS and WhatsApp messages programmatically via Twilio.',
    icon: '📱',
    color: '#fb7185',
    category: 'Communication',
    docsUrl: 'https://www.twilio.com/docs',
    settingsTab: 'api',
  },
  {
    id: 'stability',
    name: 'Stability AI',
    desc: 'Generate high-quality images using Stability AI\'s image generation API.',
    icon: '🎨',
    color: '#f472b6',
    category: 'AI',
    docsUrl: 'https://stability.ai/docs',
    settingsTab: 'api',
  },
  {
    id: 'webhook',
    name: 'Webhooks',
    desc: 'Trigger workflows from external services using inbound webhook endpoints.',
    icon: '🪝',
    color: '#FF6B35',
    category: 'Automation',
    docsUrl: '#',
    settingsTab: 'api',
  },
]

const CATEGORIES = ['All', 'AI', 'Communication', 'Data', 'Automation']

export default function IntegrationsPage() {
  const router = useRouter()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const [filter, setFilter] = useState('All')
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => {
    if (!loading && isAuthenticated === false) router.push('/homepage')
  }, [loading, isAuthenticated, router])

  const filtered = filter === 'All' ? INTEGRATIONS : INTEGRATIONS.filter(i => i.category === filter)

  if (loading || !isAuthenticated) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', background: '#020617', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)" }}>
      <style jsx global>{GLOBAL_CSS}</style>
      <TopNav />

      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F1F5F9', margin: 0, letterSpacing: '-0.4px' }}>Integrations</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Connect external services — configure API keys in Settings → API Keys
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '5px 14px', borderRadius: '20px',
                border: `1px solid ${filter === cat ? 'rgba(59,130,246,0.4)' : '#1e293b'}`,

                background: filter === cat ? 'rgba(59,130,246,0.12)' : '#0f172a',
                color: filter === cat ? '#3B82F6' : '#64748b',
                fontSize: '12.5px', fontWeight: '500', cursor: 'pointer',
                fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", transition: 'all 0.12s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Integration grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map(integration => (
            <div
              key={integration.id}
              className="int-card"
              style={{
                background: '#0f172a', border: '1px solid #1e293b',
                borderRadius: '12px', padding: '20px',
              }}
            >
              {/* Icon + name row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', flexShrink: 0, borderRadius: '9px',
                  background: `${integration.color}18`,
                  border: `1px solid ${integration.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px',
                }}>
                  {integration.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#e2e8f0', marginBottom: '3px' }}>{integration.name}</div>
                  <span style={{
                    fontSize: '10.5px', fontWeight: '500', padding: '2px 7px', borderRadius: '10px',
                    background: '#1e293b', color: '#64748b',
                  }}>
                    {integration.category}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.55', margin: '0 0 16px' }}>
                {integration.desc}
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="config-btn"
                  onClick={() => setSettingsOpen(true)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: '6px',
                    border: '1px solid rgba(59,130,246,0.3)',
                    background: 'rgba(59,130,246,0.08)', color: '#3B82F6',
                    fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", transition: 'all 0.12s ease',
                  }}
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
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
