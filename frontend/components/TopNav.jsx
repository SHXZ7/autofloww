"use client"
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '../stores/authStore'
import {
  BoltIcon,
  RectangleStackIcon,
  DocumentDuplicateIcon,
  PlayCircleIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'

const NAV_LINKS = [
  { href: '/',             label: 'Flow',         icon: BoltIcon,             iconColor: '#F59E0B' },
  { href: '/workflows',    label: 'Workflows',    icon: RectangleStackIcon,   iconColor: '#3B82F6' },
  { href: '/templates',    label: 'Templates',    icon: DocumentDuplicateIcon,iconColor: '#8B5CF6' },
  { href: '/runs',         label: 'Runs',         icon: PlayCircleIcon,        iconColor: '#22C55E' },
  { href: '/integrations', label: 'Integrations', icon: PuzzlePieceIcon,       iconColor: '#EC4899' },
  { href: '/settings',     label: 'Settings',     icon: Cog6ToothIcon,         iconColor: '#64748b' },
]

function NavItem({ href, label, Icon, isActive, open, iconColor }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}
    title={!open ? label : undefined}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: open ? '10px 14px' : '10px',
          borderRadius: '8px', cursor: 'pointer',
          justifyContent: open ? 'flex-start' : 'center',
          background: isActive ? '#1e293b' : 'transparent',
          color: isActive ? '#F1F5F9' : '#64748b',
          fontSize: '14.5px', fontWeight: isActive ? '500' : '400',
          whiteSpace: 'nowrap', overflow: 'hidden',
          transition: 'background 0.12s ease, color 0.12s ease',
        }}
        onMouseEnter={e => {
          if (!isActive) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#94a3b8' }
        }}
        onMouseLeave={e => {
          if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }
        }}
      >
        <Icon style={{ width: '20px', height: '20px', flexShrink: 0, color: iconColor }} />
        {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: isActive ? '#F1F5F9' : '#94a3b8' }}>{label}</span>}
      </div>
    </Link>
  )
}

export default function TopNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <nav
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{
        width: open ? '240px' : '64px',
        minWidth: open ? '240px' : '64px',
        height: '100%',
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        zIndex: 50,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: open ? '20px 16px 18px' : '20px 14px 18px',
        flexShrink: 0, overflow: 'hidden',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '800', color: 'white',
          boxShadow: '0 0 14px rgba(59,130,246,0.3)',
        }}>AF</div>
        <span style={{
          fontSize: '15px', fontWeight: '700', color: '#F1F5F9',
          letterSpacing: '-0.3px', whiteSpace: 'nowrap',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.18s ease',
          pointerEvents: 'none',
        }}>AutoFlow</span>
      </div>

      {/* Top divider */}
      <div style={{ height: '1px', background: '#1e293b', margin: '0 10px 10px', flexShrink: 0 }} />

      {/* Nav links */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_LINKS.map(({ href, label, icon: Icon, iconColor }) => {
          const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
          return <NavItem key={href} href={href} label={label} Icon={Icon} isActive={isActive} open={open} iconColor={iconColor} />
        })}
      </div>

      {/* Bottom section */}
      <div style={{ padding: '8px', borderTop: '1px solid #1e293b', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>

        {/* User row — only when expanded */}
        {user && (
          <Link href="/settings" style={{ textDecoration: 'none', display: open ? 'block' : 'none' }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                overflow: 'hidden',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700', color: 'white',
              }}>
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
          </Link>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          title={!open ? 'Logout' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: open ? '10px 14px' : '10px',
            borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#64748b', fontSize: '14.5px',
            width: '100%', justifyContent: open ? 'flex-start' : 'center',
            fontFamily: "inherit",
            transition: 'background 0.12s ease, color 0.12s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
        >
          <ArrowLeftOnRectangleIcon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          {open && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>Logout</span>}
        </button>
      </div>
    </nav>
  )
}
