'use client'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import GraphCanvas from '@/components/graph/GraphCanvas'
import FeedPanel from '@/components/ui/FeedPanel'
import NodePanel from '@/components/graph/NodePanel'
import DecisionWorkspace from '@/components/workspace/DecisionWorkspace'

function StarField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.1,
      o: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.008 + 0.002
    }))
    let frame, t = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 1
      stars.forEach(s => {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        const pulse = s.o + Math.sin(t * s.speed + s.x) * 0.15
        ctx.fillStyle = `rgba(168,210,255,${Math.min(0.75, Math.max(0.05, pulse))})`
        ctx.fill()
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

export default function Home() {
  const [dismissed, setDismissed] = useState(false)
  const [activeView, setActiveView] = useState('graph')
  const [selectedNode, setSelectedNode] = useState(null)
  const [activeDecision, setActiveDecision] = useState(0)

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'var(--bg-base)' }}>

      <StarField />

      {/* ── MODAL ── */}
      {!dismissed && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(4,6,14,0.88)',
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{
            position: 'absolute', width: 600, height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,88,184,0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'relative', zIndex: 1, width: 460,
            background: 'linear-gradient(160deg, #0b1228 0%, #080d1f 100%)',
            border: '1px solid rgba(100,160,240,0.14)',
            borderTop: '2px solid rgba(61,123,212,0.5)',
            padding: '40px 44px 36px',
            animation: 'modal-rise 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
          }}>

            {/* Title */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 44, letterSpacing: 10,
                color: 'var(--neptune-pale)', lineHeight: 1,
                marginBottom: 6
              }}>NEPTUNE</div>
              <div style={{ fontSize: 9, letterSpacing: 4, color: 'var(--neptune-mid)' }}>
                GLOBAL INTELLIGENCE ENGINE
              </div>
            </div>

            <div style={{
              width: '100%', height: 1,
              background: 'linear-gradient(90deg, rgba(61,123,212,0.4), transparent)',
              marginBottom: 24
            }} />

            {/* Dev badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '3px 10px', marginBottom: 22,
              border: '1px solid rgba(200,80,80,0.25)',
              fontSize: 9, letterSpacing: 2, color: '#a05050'
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#c94040',
                animation: 'pulse-dot 1.6s infinite',
                display: 'inline-block'
              }} />
              DEVELOPMENT PREVIEW — INTERNAL REVIEW ONLY
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.85, marginBottom: 28 }}>
              This workspace demonstrates Neptune's analytical capabilities using
              representative intelligence data drawn from open-source geopolitical,
              economic, and conflict event databases.
              <br /><br />
              Live ingestion, autonomous monitoring, and classified feed integration
              are in active development.
            </p>

            {/* Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              marginBottom: 32,
              border: '1px solid var(--border)',
            }}>
              {[['165', 'ENTITIES'], ['819+', 'RELATIONSHIPS'], ['30', 'FEED ITEMS']].map(([v, l], i) => (
                <div key={l} style={{
                  padding: '14px 0', textAlign: 'center',
                  borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: 2, color: 'var(--neptune-light)' }}>{v}</div>
                  <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 2, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setDismissed(true)}
              style={{
                width: '100%', padding: '13px',
                background: 'transparent',
                border: '1px solid rgba(100,160,240,0.3)',
                color: 'var(--neptune-pale)',
                fontSize: 11, fontWeight: 600, letterSpacing: 4,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(61,123,212,0.1)'
                e.currentTarget.style.borderColor = 'rgba(168,210,255,0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(100,160,240,0.3)'
              }}
            >
              ENTER WORKSPACE →
            </button>

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>
              Neptune v0.1 · Prototype Build · Confidential
            </div>
          </div>
        </div>
      )}

      {/* ── WORKSPACE ── */}
      <div style={{
        display: 'flex', height: '100vh',
        opacity: dismissed ? 1 : 0,
        transition: 'opacity 0.6s ease',
        position: 'relative', zIndex: 1
      }}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {activeView === 'graph' && (
            <>
              <FeedPanel />
              <GraphCanvas selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
              <NodePanel selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
            </>
          )}
          {activeView === 'decisions' && (
            <DecisionWorkspace
              activeDecision={activeDecision}
              setActiveDecision={setActiveDecision}
            />
          )}
        </div>
      </div>
    </main>
  )
}