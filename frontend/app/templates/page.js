"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'
import TopNav from '../../components/TopNav'
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
  body { font-family: var(--font-space-grotesk, system-ui, sans-serif); background: #020617; margin: 0; -webkit-font-smoothing: antialiased; }
  html.light body { background: #f8fafc !important; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(51,65,85,0.8); border-radius: 8px; }
  .tpl-card:hover { background: #1e293b !important; border-color: #334155 !important; transform: translateY(-2px); }
  html.light .tpl-card:hover { background: #e2e8f0 !important; border-color: #cbd5e1 !important; }
  .tpl-card { transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease; }
  .pill-active { background: rgba(59,130,246,0.15) !important; color: #3B82F6 !important; border-color: rgba(59,130,246,0.3) !important; }
`

const API_BASE_URL = 'http://172.20.10.2:8000'

// Helper: build edge
const edge = (id, source, target) => ({ id, source, target })

const TEMPLATES = [
  {
    id: 1, category: 'AI', icon: '🤖', level: 'Starter', title: 'AI Content Generator',
    desc: 'Generate blog posts, captions, and copy with GPT on a schedule and send instantly.',
    tags: ['GPT', 'Email', 'Schedule'],
    useCase: 'Daily newsletter and content teams',
    nodes: [
      { id: 'n1', type: 'schedule', position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 9 * * *' } },
      { id: 'n2', type: 'gpt',      position: { x: 160, y: 300 }, data: { label: 'GPT Content Writer', model: 'openai/gpt-4o', prompt: 'Write a short engaging blog post about the latest AI trends.' } },
      { id: 'n3', type: 'email',    position: { x: 160, y: 500 }, data: { label: 'Email Node', to: '', subject: 'Your Daily AI Content', body: '' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 2, category: 'AI', icon: '📋', level: 'Starter', title: 'Document Summarizer',
    desc: 'Upload any document and get an AI-powered summary via email.',
    tags: ['Claude', 'Email'],
    useCase: 'Quick doc reviews for legal and ops',
    nodes: [
      { id: 'n1', type: 'document_parser', position: { x: 160, y: 100 }, data: { label: 'Document Parser', file_path: '', supported_types: 'PDF, Word, Excel, Text' } },
      { id: 'n2', type: 'gpt',             position: { x: 160, y: 300 }, data: { label: 'AI Summarizer', model: 'anthropic/claude-3-opus', prompt: 'Summarize the following document content concisely:' } },
      { id: 'n3', type: 'email',           position: { x: 160, y: 500 }, data: { label: 'Email Summary', to: '', subject: 'Document Summary', body: '' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 3, category: 'AI', icon: '🎨', level: 'Intermediate', title: 'AI Image Pipeline',
    desc: 'Generate images from prompts and save them to Google Drive.',
    tags: ['DALL·E', 'Drive'],
    useCase: 'Creative teams producing campaign assets',
    nodes: [
      { id: 'n1', type: 'schedule',         position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 10 * * *' } },
      { id: 'n2', type: 'image_generation', position: { x: 160, y: 300 }, data: { label: 'Image Generator', prompt: 'A stunning futuristic city skyline at sunset', provider: 'openai', size: '1024x1024', quality: 'standard' } },
      { id: 'n3', type: 'file_upload',      position: { x: 160, y: 500 }, data: { label: 'Save to Drive', path: '', name: 'generated_image.png', mime_type: 'image/png', service: 'google_drive' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 4, category: 'Support', icon: '📧', level: 'Intermediate', title: 'Smart Email Responder',
    desc: 'Auto-respond to incoming requests with AI drafts and notify team channels.',
    tags: ['Webhook', 'GPT', 'Email', 'Discord'],
    useCase: 'Customer support and shared inbox automation',
    nodes: [
      { id: 'n1', type: 'webhook', position: { x: 160, y: 100 }, data: { label: 'Incoming Email Hook', webhook_url: `${API_BASE_URL}/webhook/trigger/n1`, method: 'POST', description: 'Triggered when email arrives' } },
      { id: 'n2', type: 'gpt',     position: { x: 160, y: 300 }, data: { label: 'Draft Reply', model: 'openai/gpt-4o', prompt: 'Write a professional email reply to:' } },
      { id: 'n3', type: 'email',   position: { x: 160, y: 500 }, data: { label: 'Send Reply', to: '', subject: 'Re: Your Message', body: '' } },
      { id: 'n4', type: 'discord', position: { x: 430, y: 500 }, data: { label: 'Team Notification', webhook_url: '', message: 'Support reply sent for incoming request.', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4')],
  },
  {
    id: 5, category: 'Communication', icon: '💬', level: 'Starter', title: 'Discord Notifier',
    desc: 'Post automated updates and alerts to a Discord channel.',
    tags: ['Discord', 'Webhook'],
    useCase: 'Ops and engineering notifications',
    nodes: [
      { id: 'n1', type: 'schedule', position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 9 * * 1-5' } },
      { id: 'n2', type: 'discord',  position: { x: 160, y: 300 }, data: { label: 'Discord Alert', webhook_url: '', message: '🚀 Daily AutoFlow update! Check out what\'s new.', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2')],
  },
  {
    id: 6, category: 'Communication', icon: '📱', level: 'Starter', title: 'WhatsApp Alerts',
    desc: 'Send WhatsApp messages via Meta WhatsApp Cloud API to any contact.',
    tags: ['WhatsApp', 'Schedule'],
    useCase: 'Executive and field-team alerts',
    nodes: [
      { id: 'n1', type: 'schedule', position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 8 * * *' } },
      { id: 'n2', type: 'whatsapp', position: { x: 160, y: 300 }, data: { label: 'WhatsApp Alert', to: '', message: 'Good morning! Your AutoFlow daily digest is ready.' } },
    ],
    edges: [edge('e1', 'n1', 'n2')],
  },
  {
    id: 7, category: 'Data', icon: '📊', level: 'Intermediate', title: 'Sheet Data Processor',
    desc: 'Pull data from Google Sheets, process it with AI, and write back.',
    tags: ['G-Sheets', 'Gemini'],
    useCase: 'Automated analysis for reporting teams',
    nodes: [
      { id: 'n1', type: 'schedule',      position: { x: 160,  y: 100 }, data: { label: 'Schedule Node', cron: '0 7 * * *' } },
      { id: 'n2', type: 'google_sheets', position: { x: 160,  y: 300 }, data: { label: 'Read Sheet', spreadsheet_id: '', range: 'Sheet1!A:Z', values: [] } },
      { id: 'n3', type: 'gpt',           position: { x: 160,  y: 500 }, data: { label: 'Analyze Data', model: 'google/gemini-pro', prompt: 'Analyze this spreadsheet data and provide a brief summary:' } },
      { id: 'n4', type: 'google_sheets', position: { x: 400,  y: 500 }, data: { label: 'Write Results', spreadsheet_id: '', range: 'Sheet2!A1', values: [] } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4')],
  },
  {
    id: 8, category: 'Data', icon: '📁', level: 'Starter', title: 'File Organizer',
    desc: 'Upload files to Google Drive automatically on a schedule.',
    tags: ['Drive', 'Schedule'],
    useCase: 'Archiving documents and media',
    nodes: [
      { id: 'n1', type: 'schedule',    position: { x: 160, y: 100 }, data: { label: 'Schedule Node', cron: '0 12 * * *' } },
      { id: 'n2', type: 'file_upload', position: { x: 160, y: 300 }, data: { label: 'Upload to Drive', path: '', name: '', mime_type: '', service: 'google_drive' } },
      { id: 'n3', type: 'discord',     position: { x: 160, y: 500 }, data: { label: 'Notify Upload', webhook_url: '', message: '📁 File uploaded to Google Drive successfully!', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 9, category: 'Automation', icon: '⏰', level: 'Intermediate', title: 'Daily Report Bot',
    desc: 'Generate and email a daily AI-written report on a cron schedule.',
    tags: ['Schedule', 'Email', 'GPT'],
    useCase: 'Executive daily briefings',
    nodes: [
      { id: 'n1', type: 'schedule',          position: { x: 160, y: 80  }, data: { label: 'Daily Trigger', cron: '0 8 * * *' } },
      { id: 'n2', type: 'gpt',               position: { x: 160, y: 250 }, data: { label: 'Write Report', model: 'openai/gpt-4o', prompt: 'Write a concise daily operations report covering key metrics and highlights for today.' } },
      { id: 'n3', type: 'report_generator',  position: { x: 160, y: 420 }, data: { label: 'Generate PDF', title: 'Daily Report', content: '', format: 'pdf' } },
      { id: 'n4', type: 'email',             position: { x: 160, y: 590 }, data: { label: 'Email Report', to: '', subject: 'Daily Report — AutoFlow', body: 'Please find the daily report attached.' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4')],
  },
  {
    id: 10, category: 'Automation', icon: '🔗', level: 'Starter', title: 'Webhook Processor',
    desc: 'Receive a webhook, process the payload with AI, then notify.',
    tags: ['Webhook', 'Discord'],
    useCase: 'Instant event interpretation and routing',
    nodes: [
      { id: 'n1', type: 'webhook', position: { x: 160, y: 100 }, data: { label: 'Receive Webhook', webhook_url: `${API_BASE_URL}/webhook/trigger/n1`, method: 'POST', description: 'Incoming event trigger' } },
      { id: 'n2', type: 'gpt',     position: { x: 160, y: 300 }, data: { label: 'Process Payload', model: 'openai/gpt-4o', prompt: 'Analyze this webhook payload and summarize the key event:' } },
      { id: 'n3', type: 'discord', position: { x: 160, y: 500 }, data: { label: 'Discord Notify', webhook_url: '', message: '', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 11, category: 'Marketing', icon: '📲', level: 'Intermediate', title: 'Social Media Autoposter',
    desc: 'Auto-post AI-generated content to social platforms daily.',
    tags: ['Social', 'Schedule', 'GPT'],
    useCase: 'Marketing publishing workflows',
    nodes: [
      { id: 'n1', type: 'schedule',    position: { x: 160, y: 100 }, data: { label: 'Daily Schedule', cron: '0 10 * * *' } },
      { id: 'n2', type: 'gpt',         position: { x: 160, y: 300 }, data: { label: 'Generate Post', model: 'openai/gpt-4o', prompt: 'Write an engaging social media post about AI automation. Keep it under 280 characters.' } },
      { id: 'n3', type: 'social_media',position: { x: 160, y: 500 }, data: { label: 'Post to Twitter', platform: 'twitter', content: '', image_path: '', webhook_url: '' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 12, category: 'AI', icon: '🌪️', level: 'Starter', title: 'Mistral Q&A Bot',
    desc: 'Set up a fast Mistral-powered Q&A workflow via webhook.',
    tags: ['Mistral', 'Webhook'],
    useCase: 'Fast auto-answer endpoint for internal tools',
    nodes: [
      { id: 'n1', type: 'webhook', position: { x: 160, y: 100 }, data: { label: 'Question Hook', webhook_url: `${API_BASE_URL}/webhook/trigger/n1`, method: 'POST', description: 'Receives incoming question' } },
      { id: 'n2', type: 'gpt',     position: { x: 160, y: 300 }, data: { label: 'Mistral Answer', model: 'mistral/mistral-7b-instruct', prompt: 'Answer the following question concisely and accurately:' } },
      { id: 'n3', type: 'discord', position: { x: 160, y: 500 }, data: { label: 'Post Answer', webhook_url: '', message: '', username: 'Mistral Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3')],
  },
  {
    id: 13, category: 'Sales', icon: '🧲', level: 'Advanced', title: 'Inbound Lead Qualification',
    desc: 'Capture inbound form leads, score them with AI, log to Sheets, and alert sales.',
    tags: ['Webhook', 'GPT', 'G-Sheets', 'Email', 'Discord'],
    useCase: 'Revenue teams triaging inbound leads',
    nodes: [
      { id: 'n1', type: 'webhook',       position: { x: 160, y: 100 }, data: { label: 'Lead Form Webhook', webhook_url: `${API_BASE_URL}/webhook/trigger/n1`, method: 'POST', description: 'Inbound lead capture' } },
      { id: 'n2', type: 'gpt',           position: { x: 160, y: 280 }, data: { label: 'Lead Scoring AI', model: 'openai/gpt-4o', prompt: 'Score this lead from 1-100 and return reasoning plus qualification status.' } },
      { id: 'n3', type: 'google_sheets', position: { x: 160, y: 460 }, data: { label: 'Log Lead', spreadsheet_id: '', range: 'Leads!A1', values: [] } },
      { id: 'n4', type: 'email',         position: { x: 430, y: 460 }, data: { label: 'Email Sales', to: '', subject: 'New Qualified Lead', body: '' } },
      { id: 'n5', type: 'discord',       position: { x: 700, y: 460 }, data: { label: 'Sales Channel Alert', webhook_url: '', message: 'New lead processed and logged.', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4'), edge('e4', 'n4', 'n5')],
  },
  {
    id: 14, category: 'Support', icon: '📮', level: 'Advanced', title: 'Gmail Ticket Digest',
    desc: 'Poll Gmail support inbox, summarize priority tickets, and send morning digest.',
    tags: ['Gmail Trigger', 'GPT', 'Email', 'Discord'],
    useCase: 'Support team handoff and daily standup',
    nodes: [
      { id: 'n1', type: 'gmail_trigger', position: { x: 160, y: 100 }, data: { label: 'Support Inbox Trigger', query: 'label:inbox subject:(issue OR ticket)', label_filter: 'INBOX', poll_interval: 5 } },
      { id: 'n2', type: 'gpt',           position: { x: 160, y: 280 }, data: { label: 'Ticket Summarizer', model: 'openai/gpt-4o', prompt: 'Summarize the email issue, customer tone, urgency, and next best action.' } },
      { id: 'n3', type: 'email',         position: { x: 160, y: 460 }, data: { label: 'Send Digest', to: '', subject: 'Support Ticket Digest', body: '' } },
      { id: 'n4', type: 'discord',       position: { x: 430, y: 460 }, data: { label: 'Support Channel Ping', webhook_url: '', message: 'New support digest generated.', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4')],
  },
  {
    id: 15, category: 'Data', icon: '🧾', level: 'Advanced', title: 'Invoice Extraction Pipeline',
    desc: 'Parse invoices, extract structured fields with AI, push to Sheets, and notify finance.',
    tags: ['Document Parser', 'GPT', 'G-Sheets', 'Email'],
    useCase: 'Finance back-office automation',
    nodes: [
      { id: 'n1', type: 'document_parser', position: { x: 160, y: 100 }, data: { label: 'Parse Invoice', file_path: '' } },
      { id: 'n2', type: 'gpt',             position: { x: 160, y: 280 }, data: { label: 'Extract Invoice Fields', model: 'openai/gpt-4o', prompt: 'Extract vendor, invoice number, due date, currency, total, tax, and line-item summary.' } },
      { id: 'n3', type: 'google_sheets',   position: { x: 160, y: 460 }, data: { label: 'Write to AP Sheet', spreadsheet_id: '', range: 'Invoices!A1', values: [] } },
      { id: 'n4', type: 'email',           position: { x: 430, y: 460 }, data: { label: 'Notify Finance', to: '', subject: 'Invoice Processed', body: '' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4')],
  },
  {
    id: 16, category: 'Marketing', icon: '🚀', level: 'Advanced', title: 'Launch Asset Factory',
    desc: 'Generate launch copy + visuals, archive assets to Drive, then auto-post to social.',
    tags: ['Schedule', 'GPT', 'DALL·E', 'Drive', 'Social'],
    useCase: 'Product marketing launch days',
    nodes: [
      { id: 'n1', type: 'schedule',         position: { x: 160, y: 100 }, data: { label: 'Launch Trigger', cron: '0 9 * * 1' } },
      { id: 'n2', type: 'gpt',              position: { x: 160, y: 260 }, data: { label: 'Write Launch Copy', model: 'openai/gpt-4o', prompt: 'Write launch copy for LinkedIn, X, and email teaser with CTA.' } },
      { id: 'n3', type: 'image_generation', position: { x: 160, y: 420 }, data: { label: 'Generate Hero Visual', prompt: 'A clean product launch hero visual with modern gradient and UI mockup', provider: 'openai', size: '1024x1024', quality: 'standard' } },
      { id: 'n4', type: 'file_upload',      position: { x: 430, y: 420 }, data: { label: 'Archive in Drive', path: '', name: 'launch_asset.png', mime_type: 'image/png', service: 'google_drive' } },
      { id: 'n5', type: 'social_media',     position: { x: 700, y: 420 }, data: { label: 'Publish to Social', platform: 'twitter', content: '', image_path: '', webhook_url: '' } },
      { id: 'n6', type: 'discord',          position: { x: 970, y: 420 }, data: { label: 'Marketing Team Ping', webhook_url: '', message: 'Launch asset pipeline complete and posted.', username: 'AutoFlow Bot' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4'), edge('e4', 'n4', 'n5'), edge('e5', 'n5', 'n6')],
  },
  {
    id: 17, category: 'Automation', icon: '🛠️', level: 'Advanced', title: 'Incident Triage Workflow',
    desc: 'Analyze incident payloads, create a response summary, and escalate over multiple channels.',
    tags: ['Webhook', 'GPT', 'Delay', 'Discord', 'Email', 'WhatsApp'],
    useCase: 'SRE and incident response teams',
    nodes: [
      { id: 'n1', type: 'webhook',  position: { x: 160, y: 100 }, data: { label: 'Incident Webhook', webhook_url: `${API_BASE_URL}/webhook/trigger/n1`, method: 'POST', description: 'Receives incident payload from monitoring tool' } },
      { id: 'n2', type: 'gpt',      position: { x: 160, y: 260 }, data: { label: 'Incident Classifier', model: 'openai/gpt-4o', prompt: 'Classify severity (SEV1-4), probable root cause, impact, and recommended response owner.' } },
      { id: 'n3', type: 'delay',    position: { x: 160, y: 420 }, data: { label: 'Escalation Delay', duration: 10, unit: 'minutes' } },
      { id: 'n4', type: 'discord',  position: { x: 430, y: 420 }, data: { label: 'Incident Channel Alert', webhook_url: '', message: '', username: 'AutoFlow Bot' } },
      { id: 'n5', type: 'email',    position: { x: 700, y: 420 }, data: { label: 'Email On-Call', to: '', subject: 'Incident Escalation', body: '' } },
      { id: 'n6', type: 'whatsapp', position: { x: 970, y: 420 }, data: { label: 'WhatsApp Escalation', to: '', message: 'Incident escalation generated. Check Discord/Email now.' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4'), edge('e4', 'n4', 'n5'), edge('e5', 'n5', 'n6')],
  },
  {
    id: 18, category: 'Data', icon: '📈', level: 'Advanced', title: 'Weekly KPI Board Update',
    desc: 'Read KPI sheet, generate narrative insights, write executive summary, and distribute.',
    tags: ['Schedule', 'G-Sheets', 'GPT', 'Email'],
    useCase: 'Leadership reporting and PMO',
    nodes: [
      { id: 'n1', type: 'schedule',      position: { x: 160, y: 100 }, data: { label: 'Weekly Trigger', cron: '0 8 * * 1' } },
      { id: 'n2', type: 'google_sheets', position: { x: 160, y: 260 }, data: { label: 'Read KPI Source', spreadsheet_id: '', range: 'Metrics!A:Z', values: [] } },
      { id: 'n3', type: 'gpt',           position: { x: 160, y: 420 }, data: { label: 'Generate Insight Narrative', model: 'openai/gpt-4o', prompt: 'Create an executive KPI narrative: wins, risks, anomalies, and recommended actions.' } },
      { id: 'n4', type: 'google_sheets', position: { x: 430, y: 420 }, data: { label: 'Write Executive Summary', spreadsheet_id: '', range: 'ExecSummary!A1', values: [] } },
      { id: 'n5', type: 'email',         position: { x: 700, y: 420 }, data: { label: 'Send KPI Digest', to: '', subject: 'Weekly KPI Executive Digest', body: '' } },
    ],
    edges: [edge('e1', 'n1', 'n2'), edge('e2', 'n2', 'n3'), edge('e3', 'n3', 'n4'), edge('e4', 'n4', 'n5')],
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(TEMPLATES.map((t) => t.category)))]
const LEVELS = ['All', 'Starter', 'Intermediate', 'Advanced']

const TAG_COLORS = {
  GPT: '#3B82F6', Llama: '#3B82F6', Claude: '#a78bfa', Gemini: '#4ade80',
  Mistral: '#fb923c', 'DALL·E': '#f472b6', Email: '#60a5fa', Discord: '#818cf8',
  WhatsApp: '#fb7185', 'G-Sheets': '#34d399', Drive: '#fbbf24', Webhook: '#FF6B35',
  Schedule: '#c084fc', Social: '#f87171',
}

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Flow', icon: BoltIcon },
  { href: '/workflows', label: 'Workflows', icon: RectangleStackIcon },
  { href: '/templates', label: 'Templates', icon: DocumentDuplicateIcon },
  { href: '/runs', label: 'Runs', icon: PlayCircleIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
]

export default function TemplatesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const [active, setActive] = useState('All')
  const [level, setLevel] = useState('All')
  const [query, setQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains('light'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => {
    if (!loading && isAuthenticated === false) router.push('/homepage')
  }, [loading, isAuthenticated, router])

  const filtered = TEMPLATES.filter((t) => {
    const categoryMatch = active === 'All' || t.category === active
    const levelMatch = level === 'All' || t.level === level
    const q = query.trim().toLowerCase()
    const searchMatch = !q
      || t.title.toLowerCase().includes(q)
      || t.desc.toLowerCase().includes(q)
      || t.tags.join(' ').toLowerCase().includes(q)
      || (t.useCase || '').toLowerCase().includes(q)

    return categoryMatch && levelMatch && searchMatch
  })

  const colors = isLight
    ? {
        pageBg: '#f8fafc',
        heading: '#0f172a',
        muted: '#64748b',
        panelBg: '#ffffff',
        panelBorder: '#cbd5e1',
        inputBg: '#ffffff',
        inputBorder: '#cbd5e1',
        inputText: '#0f172a',
        pillBg: '#f1f5f9',
        pillText: '#64748b',
        cardBg: '#ffffff',
        cardBorder: '#cbd5e1',
        cardTitle: '#0f172a',
        cardDesc: '#475569',
        metaText: '#64748b',
        buttonBg: 'rgba(59,130,246,0.12)',
      }
    : {
        pageBg: '#020617',
        heading: '#F1F5F9',
        muted: '#64748b',
        panelBg: '#0f172a',
        panelBorder: '#1e293b',
        inputBg: '#0f172a',
        inputBorder: '#1e293b',
        inputText: '#e2e8f0',
        pillBg: '#1e293b',
        pillText: '#64748b',
        cardBg: '#0f172a',
        cardBorder: '#1e293b',
        cardTitle: '#e2e8f0',
        cardDesc: '#64748b',
        metaText: '#475569',
        buttonBg: 'rgba(59,130,246,0.1)',
      }

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
    <div style={{ display: 'flex', flexDirection: 'row', height: isMobile ? '100dvh' : '100vh', background: colors.pageBg, fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", overflow: 'hidden' }}>
      <style jsx global>{GLOBAL_CSS}</style>
      {!isMobile && <TopNav />}

      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '18px 12px 96px' : '32px 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '18px' : '28px' }}>
          <h1 style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: '700', color: colors.heading, margin: 0, letterSpacing: '-0.4px' }}>Templates</h1>
          <p style={{ fontSize: isMobile ? '12px' : '13px', color: colors.muted, margin: '4px 0 0' }}>
            Start with production-ready automations — from quick wins to advanced multi-step pipelines
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates by use-case, tags, or title..."
            style={{
              width: '100%', maxWidth: isMobile ? '100%' : '520px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: `1px solid ${colors.inputBorder}`,
              outline: 'none',
              background: colors.inputBg,
              color: colors.inputText,
              fontSize: '13px',
              fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
            }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={active === cat ? 'pill-active' : ''}
              onClick={() => setActive(cat)}
              style={{
                padding: '5px 14px', borderRadius: '20px', border: `1px solid ${colors.panelBorder}`,
                background: colors.pillBg, color: colors.pillText, fontSize: '12.5px',
                fontWeight: '500', cursor: 'pointer', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                transition: 'all 0.12s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Complexity pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {LEVELS.map(lvl => (
            <button
              key={lvl}
              className={level === lvl ? 'pill-active' : ''}
              onClick={() => setLevel(lvl)}
              style={{
                padding: '5px 14px', borderRadius: '20px', border: `1px solid ${colors.panelBorder}`,
                background: colors.pillBg, color: colors.pillText, fontSize: '12.5px',
                fontWeight: '500', cursor: 'pointer', fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                transition: 'all 0.12s ease',
              }}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map(t => (
            <div
              key={t.id}
              className="tpl-card"
              style={{
                background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
                borderRadius: '12px', padding: isMobile ? '16px' : '20px',
              }}
            >
              <div style={{ fontSize: '26px', marginBottom: '12px' }}>{t.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '7px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.cardTitle }}>{t.title}</div>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: '600',
                  color: t.level === 'Advanced' ? '#fb923c' : t.level === 'Intermediate' ? '#a78bfa' : '#60a5fa',
                  border: `1px solid ${t.level === 'Advanced' ? '#fb923c55' : t.level === 'Intermediate' ? '#a78bfa55' : '#60a5fa55'}`,
                  borderRadius: '999px',
                  padding: '2px 8px',
                  whiteSpace: 'nowrap',
                }}>{t.level}</span>
              </div>
              <div style={{ fontSize: '12.5px', color: colors.cardDesc, lineHeight: '1.55', marginBottom: '14px' }}>{t.desc}</div>
              <div style={{ fontSize: '11.5px', color: colors.metaText, marginBottom: '12px' }}>
                <strong style={{ color: colors.muted, fontWeight: 600 }}>Best for:</strong> {t.useCase}
              </div>
              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
                {t.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '10px',
                    background: `rgba(${TAG_COLORS[tag] ? '0,212,255' : '255,255,255'},0.07)`,
                    color: TAG_COLORS[tag] || colors.pillText, border: `1px solid ${TAG_COLORS[tag] ? TAG_COLORS[tag] + '30' : colors.panelBorder}`,

                  }}>{tag}</span>
                ))}
              </div>
              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11.5px', color: colors.metaText }}>{t.nodes.length} nodes · {t.category}</span>
                <button
                  onClick={() => handleUse(t)}
                  style={{
                    padding: '5px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: colors.buttonBg, color: '#3B82F6',
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

        {isMobile && (
          <MobileBottomNav
            items={MOBILE_NAV_ITEMS}
            pathname={pathname}
            onNavigate={(href) => router.push(href)}
            isLight={isLight}
          />
        )}
      </div>
    </div>
  )
}
