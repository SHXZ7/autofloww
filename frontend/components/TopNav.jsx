"use client"
import { useState, useEffect } from 'react'
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
  SparklesIcon,
} from '@heroicons/react/24/outline'

const NAV_LINKS = [
  { href: '/',             label: 'Flow',         icon: BoltIcon,             iconColor: '#EB5E3D' },
  { href: '/workflows',    label: 'Workflows',    icon: RectangleStackIcon,   iconColor: '#5B9EB5' },
  { href: '/templates',    label: 'Templates',    icon: DocumentDuplicateIcon,iconColor: '#DDA449' },
  { href: '/runs',         label: 'Runs',         icon: PlayCircleIcon,        iconColor: '#2EA38D' },
  { href: '/integrations', label: 'Integrations', icon: PuzzlePieceIcon,       iconColor: '#9B5A53' },
  { href: '/settings',     label: 'Settings',     icon: Cog6ToothIcon,         iconColor: '#736357' },
]

function NavItem({ href, label, Icon, isActive, open, iconColor }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}
    title={!open ? label : undefined}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: open ? '10px 14px' : '10px',
          borderRadius: '12px', cursor: 'pointer',
          justifyContent: open ? 'flex-start' : 'center',
          background: isActive ? '#EDE6DC' : 'transparent',
          color: isActive ? '#241812' : '#736357',
          border: isActive ? '1px solid #E5DCD0' : '1px solid transparent',
          fontSize: '14px', fontWeight: isActive ? '700' : '500',
          whiteSpace: 'nowrap', overflow: 'hidden',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          if (!isActive) { e.currentTarget.style.background = '#F6F1EA'; e.currentTarget.style.color = '#241812' }
        }}
        onMouseLeave={e => {
          if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#736357' }
        }}
      >
        <Icon style={{ width: '20px', height: '20px', flexShrink: 0, color: isActive ? '#EB5E3D' : iconColor }} />
        {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: isActive ? '#241812' : '#736357' }}>{label}</span>}
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
        width: open ? '230px' : '68px',
        minWidth: open ? '230px' : '68px',
        height: '100%',
        background: '#FFFFFF',
        borderRight: '1px solid #E5DCD0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        zIndex: 50,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>

      {/* Brand Robot Logo */}
      <Link href="/homepage" style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: open ? '20px 16px' : '20px 14px',
          flexShrink: 0,
          overflow: 'hidden',
          cursor: 'pointer',
        }}>
          <div style={{ width: '36px', height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 32 32" fill="none" style={{ width: '100%', height: '100%' }}>
              <rect x="9" y="5" width="14" height="10" rx="2.5" fill="#241812" />
              <circle cx="13.5" cy="10" r="1.3" fill="#F6F1EA" />
              <circle cx="18.5" cy="10" r="1.3" fill="#F6F1EA" />
              <rect x="14.5" y="1.5" width="3" height="3.5" rx="1" fill="#241812" />
              <rect x="6" y="17" width="20" height="11" rx="3.5" fill="#241812" />
              <rect x="2" y="18.5" width="3" height="7" rx="1.5" fill="#241812" />
              <rect x="27" y="18.5" width="3" height="7" rx="1.5" fill="#241812" />
              <circle cx="16" cy="22.5" r="1.5" fill="#EB5E3D" />
            </svg>
          </div>
          <span style={{
            fontSize: '18px',
            fontWeight: '800',
            color: '#241812',
            letterSpacing: '-0.5px',
            whiteSpace: 'nowrap',
            opacity: open ? 1 : 0,
            transition: 'opacity 0.18s ease',
          }}>autoflow</span>
        </div>
      </Link>

      {/* Top divider */}
      <div style={{ height: '1px', background: '#E5DCD0', margin: '0 12px 14px' }} />

      {/* Main navigation list */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '0 10px',
        flex: 1,
      }}>
        {NAV_LINKS.map(link => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            Icon={link.icon}
            iconColor={link.iconColor}
            isActive={pathname === link.href}
            open={open}
          />
        ))}
      </div>

      {/* Bottom section with User profile & Logout */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid #E5DCD0',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {/* User profile snippet */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: open ? '8px 10px' : '8px',
          borderRadius: '12px',
          background: '#F6F1EA',
          justifyContent: open ? 'flex-start' : 'center',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#241812',
            color: '#F6F1EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            flexShrink: 0,
          }}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          {open && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#241812', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.name || 'Workspace User'}
              </div>
              <div style={{ fontSize: '10px', color: '#736357', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email || 'user@autoflow.com'}
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: open ? '8px 12px' : '8px',
            borderRadius: '10px',
            border: 'none',
            background: 'transparent',
            color: '#736357',
            cursor: 'pointer',
            justifyContent: open ? 'flex-start' : 'center',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EDE6DC'; e.currentTarget.style.color = '#EB5E3D' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#736357' }}
        >
          <ArrowLeftOnRectangleIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          {open && <span>Sign Out</span>}
        </button>
      </div>

    </nav>
  )
}
