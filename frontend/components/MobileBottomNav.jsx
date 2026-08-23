"use client"

export default function MobileBottomNav({
  items,
  pathname,
  onNavigate,
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
        border: '1px solid #E5DCD0',
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 10px 25px rgba(36,24,18,0.12)',
        padding: '8px 6px',
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        gap: '4px',
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
              border: active ? '1px solid #E5DCD0' : '1px solid transparent',
              borderRadius: '12px',
              background: active ? '#EDE6DC' : 'transparent',
              color: active ? '#EB5E3D' : '#736357',
              padding: '7px 2px 6px',
              minHeight: '56px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-space-grotesk, system-ui, sans-serif)',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon style={{ width: '19px', height: '19px', strokeWidth: active ? 2.5 : 2 }} />
            <span style={{ fontSize: '10px', fontWeight: active ? 800 : 600, lineHeight: 1.1 }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

