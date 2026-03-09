'use client'

const NAV = [
  { id: 'graph',     icon: '⬡', label: 'GRAPH' },
  { id: 'decisions', icon: '◈', label: 'DECISIONS' },
]

const DOMAINS = [
  { color: '#c94040', label: 'GEO' },
  { color: '#c87c3a', label: 'ECO' },
  { color: '#b85a30', label: 'DEF' },
  { color: '#3d7bd4', label: 'TEC' },
  { color: '#2a9e58', label: 'CLI' },
  { color: '#7050b8', label: 'SOC' },
]

export default function Sidebar({ activeView, setActiveView }) {
  return (
    <div style={{
      width: 56, height: '100vh',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 14, paddingBottom: 14,
      gap: 4, flexShrink: 0
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'var(--neptune-core)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 18,
        color: '#c8ddf5', marginBottom: 16, flexShrink: 0,
        boxShadow: '0 0 12px rgba(61,123,212,0.4)'
      }}>N</div>

      {NAV.map(item => (
        <button key={item.id} onClick={() => setActiveView(item.id)}
          title={item.label}
          style={{
            width: 40, height: 40, border: 'none',
            background: activeView === item.id ? 'rgba(61,123,212,0.12)' : 'transparent',
            borderLeft: activeView === item.id ? '2px solid var(--neptune-mid)' : '2px solid transparent',
            color: activeView === item.id ? 'var(--neptune-light)' : 'var(--text-dim)',
            fontSize: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (activeView !== item.id) e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={e => { if (activeView !== item.id) e.currentTarget.style.color = 'var(--text-dim)' }}
        >
          {item.icon}
        </button>
      ))}

      <div style={{ width: 20, height: 1, background: 'var(--border)', margin: '8px 0' }} />

      {DOMAINS.map((d, i) => (
        <div key={i} title={d.label} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: d.color, margin: '3px 0', opacity: 0.7,
          boxShadow: `0 0 5px ${d.color}55`
        }} />
      ))}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 1.8s infinite' }} />
        <div style={{ fontSize: 7, color: 'var(--text-dim)', letterSpacing: 1, writingMode: 'vertical-rl' }}>LIVE</div>
      </div>
    </div>
  )
}