'use client'
import { useState, useEffect, useRef } from 'react'

const TYPE_COLORS = {
  THREAT:      '#c94040',
  CYBER:       '#c94040',
  ECONOMIC:    '#c87c3a',
  GEOPOLITICAL:'#3d7bd4',
  DIPLOMATIC:  '#7050b8',
  SIGNAL:      '#2a9e58',
  CLIMATE:     '#2a9e58',
  SPACE:       '#3d7bd4',
}

export default function FeedPanel() {
  const [items, setItems]       = useState([])
  const [visible, setVisible]   = useState([])
  const [alerts, setAlerts]     = useState([])
  const [alertPool] = useState([
    { id: 1, sev: 'CRITICAL', text: 'TSMC contract window closing — 11 days remaining', time: '08:41' },
    { id: 2, sev: 'HIGH',     text: 'PLA engineering battalion moving toward LAC corridor', time: '06:12' },
    { id: 3, sev: 'HIGH',     text: 'OPEC+ emergency meeting — surprise cut likely', time: '09:15' },
    { id: 4, sev: 'MEDIUM',   text: 'INR hits 84.6/USD — RBI intervention watch', time: '07:30' },
    { id: 5, sev: 'CRITICAL', text: 'Pakistan test-fires Shaheen-III MRBM — 3rd test this year', time: '05:50' },
    { id: 6, sev: 'HIGH',     text: 'APT41 lateral movement detected in PSU networks', time: '03:44' },
  ])
  const feedRef = useRef(null)
  const tickRef = useRef(0)

  useEffect(() => {
    fetch('/data/feed.json').then(r => r.json()).then(data => {
      setItems(data)
      setVisible(data.slice(0, 6))
    })
  }, [])

  // Reveal feed items progressively
  useEffect(() => {
    if (!items.length) return
    const interval = setInterval(() => {
      tickRef.current += 1
      const count = Math.min(6 + tickRef.current * 2, items.length)
      setVisible(items.slice(0, count))
      if (feedRef.current) feedRef.current.scrollTop = 0
    }, 5000)
    return () => clearInterval(interval)
  }, [items])

  // Stagger alerts
  useEffect(() => {
    alertPool.forEach((alert, i) => {
      setTimeout(() => {
        setAlerts(prev => [alert, ...prev].slice(0, 4))
      }, i * 22000 + 3000)
    })
  }, [])

  const sevColor = (sev) => ({
    CRITICAL: '#c94040', HIGH: '#c87c3a', MEDIUM: '#b89a30', LOW: '#2a9e58'
  })[sev] || '#3d7bd4'

  return (
    <div style={{
      width: 268, height: '100vh', flexShrink: 0,
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#c94040', animation: 'pulse-dot 1.2s infinite'
            }} />
            <span style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-secondary)' }}>
              INTEL FEED
            </span>
          </div>
          <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>
            {visible.length}/{items.length}
          </span>
        </div>
      </div>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{
              padding: '7px 14px',
              borderBottom: '1px solid var(--border)',
              borderLeft: `2px solid ${sevColor(alert.sev)}`,
              background: `${sevColor(alert.sev)}08`,
              animation: 'fade-in-up 0.4s ease forwards'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: 7, letterSpacing: 1,
                  color: sevColor(alert.sev), fontWeight: 700
                }}>{alert.sev}</span>
                <span style={{ fontSize: 7, color: 'var(--text-dim)' }}>{alert.time}</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {alert.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed items */}
      <div ref={feedRef} style={{ flex: 1, overflowY: 'auto' }}>
        {visible.map((item, i) => {
          const color = TYPE_COLORS[item.type] || '#3d7bd4'
          return (
            <div key={item.id} style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border)',
              animation: 'fade-in-up 0.3s ease forwards',
              cursor: 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Type + time row */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 5
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 7, letterSpacing: 1, color,
                    padding: '1px 5px', border: `1px solid ${color}44`
                  }}>{item.type}</span>
                  <span style={{ fontSize: 7, color: 'var(--text-dim)', letterSpacing: 1 }}>
                    {item.domain?.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: 7, color: 'var(--text-dim)' }}>{item.timestamp}</span>
              </div>

              {/* Text */}
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.text}
              </div>

              {/* Confidence */}
              <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  flex: 1, height: 2,
                  background: 'var(--border)',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${item.confidence}%`,
                    background: color, opacity: 0.6
                  }} />
                </div>
                <span style={{ fontSize: 7, color: 'var(--text-dim)', letterSpacing: 1 }}>
                  {item.confidence}% CONF
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 14px', flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', gap: 6
      }}>
        <div style={{
          width: 4, height: 4, borderRadius: '50%',
          background: '#2a9e58', animation: 'pulse-dot 2s infinite'
        }} />
        <span style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1 }}>
          LIVE · UPDATING EVERY 5S
        </span>
      </div>
    </div>
  )
}