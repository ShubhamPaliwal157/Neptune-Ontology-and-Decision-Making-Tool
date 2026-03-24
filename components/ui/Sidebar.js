'use client'

const NAV = [
  { id: 'graph',     icon: '⬡', label: 'GRAPH' },
  { id: 'decisions', icon: '◈', label: 'DECISIONS' },
]

export default function Sidebar({ activeView, setActiveView }) {
  return (
    <div style={{
      width: 56, height: '100vh',
      background: 'rgba(8, 13, 31, 0.6)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.04)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 24, paddingBottom: 24,
      flexShrink: 0,
      position: 'relative'
    }}>
      {/* Navigation Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setActiveView(item.id)}
            title={item.label}
            style={{
              width: 40, height: 40, border: 'none',
              background: activeView === item.id ? 'rgba(61,123,212,0.15)' : 'transparent',
              borderLeft: activeView === item.id ? '2px solid rgba(61,123,212,0.6)' : '2px solid transparent',
              color: activeView === item.id ? 'rgba(200,228,255,0.9)' : 'rgba(61,123,212,0.5)',
              fontSize: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.15s', cursor: 'pointer',
              borderRadius: 4
            }}
            onMouseEnter={e => { if (activeView !== item.id) e.currentTarget.style.color = 'rgba(61,123,212,0.7)' }}
            onMouseLeave={e => { if (activeView !== item.id) e.currentTarget.style.color = 'rgba(61,123,212,0.5)' }}
          >
            {item.icon}
          </button>
        ))}
      </div>        {/* Branding - Vertical Rotated Text */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 20,
          gap: 12
        }}>
          {['E', 'N', 'U', 'T', 'P', 'E', 'N'].map((letter, i) => (
            <div key={i} style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              fontWeight: 300,
              color: 'rgba(240,244,255,0.6)',
              textShadow: '0 0 6px rgba(61,123,212,0.12)',
              transform: 'rotate(-90deg)',
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}>
              {letter}
            </div>
          ))}
      </div>
    </div>
  )
}