"use client"

export default function MobileBottomNav({
  items,
  pathname,
  onNavigate,
  isLight = false,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '10px',
        right: '10px',
        bottom: '10px',
        zIndex: 60,
        borderRadius: '16px',
        border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
        background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: isLight ? '0 10px 24px rgba(15,23,42,0.15)' : '0 12px 26px rgba(2,6,23,0.55)',
        padding: '8px 6px',
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        gap: '2px',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon
        const active = item.href === '/'
          ? pathname === '/'
          : pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <button
            key={item.href}
            onClick={() => onNavigate(item.href)}
            style={{
              border: 'none',
              borderRadius: '10px',
              background: active ? (isLight ? '#dbeafe' : 'rgba(37,99,235,0.18)') : 'transparent',
              color: active ? '#3B82F6' : (isLight ? '#64748b' : '#94a3b8'),
              padding: '7px 2px 6px',
              minHeight: '58px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              cursor: 'pointer',
              fontFamily: 'var(--font-space-grotesk, system-ui, sans-serif)',
            }}
          >
            <Icon style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '9.5px', fontWeight: active ? 700 : 500, lineHeight: 1.1 }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
