"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'
import TopNav from '../../components/TopNav'

const GLOBAL_CSS = `
    *, *::before, *::after { box-sizing: border-box; }
  body { font-family: var(--font-space-grotesk, system-ui, sans-serif); background: #020617; margin: 0; -webkit-font-smoothing: antialiased; }
  html.light body { background: #f8fafc !important; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(51,65,85,0.8); border-radius: 8px; }
  .tpl-card:hover { background: #1e293b !important; border-color: #334155 !important; transform: translateY(-2px); }
  html.light .tpl-card:hover { background: #e2e8f0 !important; border-color: #cbd5e1 !important; }
  .tpl-card { transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease; }
  .pill-active { background: rgba(59,130,246,0.15) !important; color: #3B82F6 !important; border-color: rgba(59,130,246,0.3) !important; }
`

const API_BASE_URL = 'https://shxz7-autoflow.hf.space'

// Helper: build edge
const edge = (id, source, target) => ({ id, source, target })

const TEMPLATES = [
  {
    id: 1, category: 'AI', icon: '🤖', title: 'AI Content Generator',
    desc: 'Generate blog posts, captions, and copy with GPT or Llama.',
    tags: ['GPT', 'Llama'],
    nodes: [
      { id: 'n1', type: 'schedule', position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 9 * * *' } },
      { id: 'n2', type: 'gpt',      position: { x: 160, y: 300 }, data: { label: 'GPT Content Writer', model: 'openai/gpt-4o', prompt: 'Write a short engaging blog post about the latest AI trends.' } },
      { id: 'n3', type: 'email',    position: { x: 160, y: 500 }, data: { label: 'Email Node', to: '', subject: 'Your Daily AI Content', body: '' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 2, category: 'AI', icon: '📋', title: 'Document Summarizer',
    desc: 'Upload any document and get an AI-powered summary via email.',
    tags: ['Claude', 'Email'],
    nodes: [
      { id: 'n1', type: 'document_parser', position: { x: 160, y: 100 }, data: { label: 'Document Parser', file_path: '', supported_types: 'PDF, Word, Excel, Text' } },
      { id: 'n2', type: 'gpt',             position: { x: 160, y: 300 }, data: { label: 'AI Summarizer', model: 'anthropic/claude-3-opus', prompt: 'Summarize the following document content concisely:' } },
      { id: 'n3', type: 'email',           position: { x: 160, y: 500 }, data: { label: 'Email Summary', to: '', subject: 'Document Summary', body: '' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 3, category: 'AI', icon: '🎨', title: 'AI Image Pipeline',
    desc: 'Generate images from prompts and save them to Google Drive.',
    tags: ['DALL·E', 'Drive'],
    nodes: [
      { id: 'n1', type: 'schedule',         position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 10 * * *' } },
      { id: 'n2', type: 'image_generation', position: { x: 160, y: 300 }, data: { label: 'Image Generator', prompt: 'A stunning futuristic city skyline at sunset', provider: 'openai', size: '1024x1024', quality: 'standard' } },
      { id: 'n3', type: 'file_upload',      position: { x: 160, y: 500 }, data: { label: 'Save to Drive', path: '', name: 'generated_image.png', mime_type: 'image/png', service: 'google_drive' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 4, category: 'Communication', icon: '📧', title: 'Email Responder',
    desc: 'Auto-respond to incoming emails using an AI-generated reply.',
    tags: ['Email', 'GPT'],
    nodes: [
      { id: 'n1', type: 'webhook', position: { x: 160, y: 100 }, data: { label: 'Incoming Email Hook', webhook_url: `${API_BASE_URL}/webhook/trigger/n1`, method: 'POST', description: 'Triggered when email arrives' } },
      { id: 'n2', type: 'gpt',     position: { x: 160, y: 300 }, data: { label: 'Draft Reply', model: 'openai/gpt-4o', prompt: 'Write a professional email reply to:' } },
      { id: 'n3', type: 'email',   position: { x: 160, y: 500 }, data: { label: 'Send Reply', to: '', subject: 'Re: Your Message', body: '' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 5, category: 'Communication', icon: '💬', title: 'Discord Notifier',
    desc: 'Post automated updates and alerts to a Discord channel.',
    tags: ['Discord', 'Webhook'],
    nodes: [
      { id: 'n1', type: 'schedule', position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 9 * * 1-5' } },
      { id: 'n2', type: 'discord',  position: { x: 160, y: 300 }, data: { label: 'Discord Alert', webhook_url: '', message: '🚀 Daily AutoFlow update! Check out what\'s new.', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2')],
  },
  {
    id: 6, category: 'Communication', icon: '📱', title: 'WhatsApp Alerts',
    desc: 'Send WhatsApp messages via Twilio to any contact.',
    tags: ['Twilio', 'Schedule'],
    nodes: [
      { id: 'n1', type: 'schedule', position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 8 * * *' } },
      { id: 'n2', type: 'twilio',   position: { x: 160, y: 300 }, data: { label: 'WhatsApp Alert', mode: 'whatsapp', to: '', message: '👋 Good morning! Your AutoFlow daily digest is ready.' } },
    ],
    edges: [edge('e1', 'n1', 'n2')],
  },
  {
    id: 7, category: 'Data', icon: '📊', title: 'Sheet Data Processor',
    desc: 'Pull data from Google Sheets, process it with AI, and write back.',
    tags: ['G-Sheets', 'Gemini'],
    nodes: [
      { id: 'n1', type: 'schedule',      position: { x: 160,  y: 100 }, data: { label: 'Schedule Node', cron: '0 7 * * *' } },
      { id: 'n2', type: 'google_sheets', position: { x: 160,  y: 300 }, data: { label: 'Read Sheet', spreadsheet_id: '', range: 'Sheet1!A:Z', values: [] } },
      { id: 'n3', type: 'gpt',           position: { x: 160,  y: 500 }, data: { label: 'Analyze Data', model: 'google/gemini-pro', prompt: 'Analyze this spreadsheet data and provide a brief summary:' } },
      { id: 'n4', type: 'google_sheets', position: { x: 400,  y: 500 }, data: { label: 'Write Results', spreadsheet_id: '', range: 'Sheet2!A1', values: [] } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4')],
  },
  {
    id: 8, category: 'Data', icon: '📁', title: 'File Organizer',
    desc: 'Upload files to Google Drive automatically on a schedule.',
    tags: ['Drive', 'Schedule'],
    nodes: [
      { id: 'n1', type: 'schedule',    position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 12 * * *' } },
      { id: 'n2', type: 'file_upload', position: { x: 160, y: 300 }, data: { label: 'Upload to Drive', path: '', name: '', mime_type: '', service: 'google_drive' } },
      { id: 'n3', type: 'discord',     position: { x: 160, y: 500 }, data: { label: 'Notify Upload', webhook_url: '', message: '📁 File uploaded to Google Drive successfully!', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 9, category: 'Automation', icon: '⏰', title: 'Daily Report Bot',
    desc: 'Generate and email a daily AI-written report on a cron schedule.',
    tags: ['Schedule', 'Email', 'GPT'],
    nodes: [
      { id: 'n1', type: 'schedule',          position: { x: 160, y: 80  }, data: { label: 'Daily Trigger', cron: '0 8 * * *' } },
      { id: 'n2', type: 'gpt',               position: { x: 160, y: 250 }, data: { label: 'Write Report', model: 'openai/gpt-4o', prompt: 'Write a concise daily operations report covering key metrics and highlights for today.' } },
      { id: 'n3', type: 'report_generator',  position: { x: 160, y: 420 }, data: { label: 'Generate PDF', title: 'Daily Report', content: '', format: 'pdf' } },
      { id: 'n4', type: 'email',             position: { x: 160, y: 590 }, data: { label: 'Email Report', to: '', subject: 'Daily Report — AutoFlow', body: 'Please find the daily report attached.' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4')],
  },
  {
    id: 10, category: 'Automation', icon: '🔗', title: 'Webhook Processor',
    desc: 'Receive a webhook, process the payload with AI, then notify.',
    tags: ['Webhook', 'Discord'],
    nodes: [
      { id: 'n1', type: 'webhook', position: { x: 160, y: 100 }, data: { label: 'Receive Webhook', webhook_url: `${API_BASE_URL}/webhook/trigger/n1`, method: 'POST', description: 'Incoming event trigger' } },
      { id: 'n2', type: 'gpt',     position: { x: 160, y: 300 }, data: { label: 'Process Payload', model: 'openai/gpt-4o', prompt: 'Analyze this webhook payload and summarize the key event:' } },
      { id: 'n3', type: 'discord', position: { x: 160, y: 500 }, data: { label: 'Discord Notify', webhook_url: '', message: '', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 11, category: 'Automation', icon: '📲', title: 'Social Media Autoposter',
    desc: 'Auto-post AI-generated content to social platforms daily.',
    tags: ['Social', 'Schedule', 'GPT'],
    nodes: [
      { id: 'n1', type: 'schedule',    position: { x: 160, y: 100 }, data: { label: 'Daily Schedule', cron: '0 10 * * *' } },
      { id: 'n2', type: 'gpt',         position: { x: 160, y: 300 }, data: { label: 'Generate Post', model: 'openai/gpt-4o', prompt: 'Write an engaging social media post about AI automation. Keep it under 280 characters.' } },
      { id: 'n3', type: 'social_media',position: { x: 160, y: 500 }, data: { label: 'Post to Twitter', platform: 'twitter', content: '', image_path: '', webhook_url: '' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 12, category: 'AI', icon: '🌪️', title: 'Mistral Q&A Bot',
    desc: 'Set up a fast Mistral-powered Q&A workflow via webhook.',
    tags: ['Mistral', 'Webhook'],
    nodes: [
      { id: 'n1', type: 'webhook', position: { x: 160, y: 100 }, data: { label: 'Question Hook', webhook_url: `${API_BASE_URL}/webhook/trigger/n1`, method: 'POST', description: 'Receives incoming question' } },
      { id: 'n2', type: 'gpt',     position: { x: 160, y: 300 }, data: { label: 'Mistral Answer', model: 'mistral/mistral-7b-instruct', prompt: 'Answer the following question concisely and accurately:' } },
      { id: 'n3', type: 'discord', position: { x: 160, y: 500 }, data: { label: 'Post Answer', webhook_url: '', message: '', username: 'Mistral Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
]

const CATEGORIES = ['All', 'AI', 'Communication', 'Data', 'Automation']

const TAG_COLORS = {
  GPT: '#3B82F6', Llama: '#3B82F6', Claude: '#a78bfa', Gemini: '#4ade80',
  Mistral: '#fb923c', 'DALL·E': '#f472b6', Email: '#60a5fa', Discord: '#818cf8',
  Twilio: '#fb7185', 'G-Sheets': '#34d399', Drive: '#fbbf24', Webhook: '#FF6B35',
  Schedule: '#c084fc', Social: '#f87171',
}

export default function TemplatesPage() {
  const router = useRouter()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const [active, setActive] = useState('All')

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => {
    if (!loading && isAuthenticated === false) router.push('/homepage')
  }, [loading, isAuthenticated, router])

  const filtered = active === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === active)

  const handleUse = (template) => {
    try {
      localStorage.setItem('af_pending_template', JSON.stringify({
        nodes: template.nodes,
        edges: template.edges,
      }))
    } catch (e) { /* ignore */ }
    router.push('/')
  }

  if (loading || !isAuthenticated) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', background: '#020617', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)" }}>
      <style jsx global>{GLOBAL_CSS}</style>
      <TopNav />

      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F1F5F9', margin: 0, letterSpacing: '-0.4px' }}>Templates</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Start with a ready-made automation — customise it in the editor
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={active === cat ? 'pill-active' : ''}
              onClick={() => setActive(cat)}
              style={{
                padding: '5px 14px', borderRadius: '20px', border: '1px solid #1e293b',
                background: '#1e293b', color: '#64748b', fontSize: '12.5px',
                fontWeight: '500', cursor: 'pointer', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                transition: 'all 0.12s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map(t => (
            <div
              key={t.id}
              className="tpl-card"
              style={{
                background: '#0f172a', border: '1px solid #1e293b',
                borderRadius: '12px', padding: '20px',
              }}
            >
              <div style={{ fontSize: '26px', marginBottom: '12px' }}>{t.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '7px' }}>{t.title}</div>
              <div style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.55', marginBottom: '14px' }}>{t.desc}</div>
              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
                {t.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '10px',
                    background: `rgba(${TAG_COLORS[tag] ? '0,212,255' : '255,255,255'},0.07)`,
                    color: TAG_COLORS[tag] || '#64748b', border: `1px solid ${TAG_COLORS[tag] ? TAG_COLORS[tag] + '30' : '#1e293b'}`,

                  }}>{tag}</span>
                ))}
              </div>
              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11.5px', color: '#475569' }}>{t.nodes.length} nodes</span>
                <button
                  onClick={() => handleUse(t)}
                  style={{
                    padding: '5px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                    fontSize: '12px', fontWeight: '500', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                    transition: 'background 0.12s ease',
                  }}
                >
                  Use template →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
