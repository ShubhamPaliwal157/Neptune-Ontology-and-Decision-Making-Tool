'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const FEATURES = [
  { icon: '⬡', label: 'Knowledge Graphs', desc: 'Entities and relationships extracted from any source, rendered as an interactive 3D graph.' },
  { icon: '◈', label: 'Decision Intelligence', desc: 'Structured evidence, scenarios, watchlists and precedents for every tracked decision.' },
  { icon: '⚡', label: 'AI Analysis', desc: 'Ask Neptune AI anything about the graph. Get decision-grade intelligence answers instantly.' },
  { icon: '⟳', label: 'Live Ingestion', desc: 'Continuously monitors your sources and alerts you when the graph changes significantly.' },
]

const STATS = [
  { value: '165+', label: 'ENTITY TYPES' },
  { value: '819+', label: 'RELATIONSHIPS' },
  { value: '6', label: 'INTELLIGENCE DOMAINS' },
  { value: '<60s', label: 'TO FIRST GRAPH' },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: '#03050c',
      fontFamily: 'var(--font-mono)',
      color: '#c8e4ff',
      overflowX: 'hidden',
    }}>

      {/* ── Video background ───────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      }}>
        <video autoPlay loop muted playsInline style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', opacity: 0.55,
        }}>
          <source src="/videos/neptune-bg.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay — heavier at bottom so text is readable */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(3,5,12,0.55) 0%, rgba(3,5,12,0.30) 35%, rgba(3,5,12,0.70) 70%, rgba(3,5,12,0.97) 100%)',
        }} />
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px',
        height: 60,
        background: scrolled ? 'rgba(3,5,12,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(58,110,200,0.12)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: '#2558b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 17, color: '#c8e4ff',
            boxShadow: '0 0 12px rgba(61,123,212,0.5)',
          }}>N</div>
          <span style={{ fontSize: 14, letterSpacing: 4, color: '#c8e4ff', fontWeight: 600 }}>
            NEPTUNE
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/preview" style={{
            fontSize: 11, letterSpacing: 2, color: '#6a9aba',
            textDecoration: 'none', padding: '8px 14px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#c8e4ff'}
          onMouseLeave={e => e.currentTarget.style.color = '#6a9aba'}
          >DEMO</Link>

          <Link href="/login" style={{
            fontSize: 11, letterSpacing: 2, color: '#6a9aba',
            textDecoration: 'none', padding: '8px 14px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#c8e4ff'}
          onMouseLeave={e => e.currentTarget.style.color = '#6a9aba'}
          >SIGN IN</Link>

          <Link href="/signup" style={{
            fontSize: 11, letterSpacing: 2, color: '#c8e4ff',
            textDecoration: 'none', padding: '8px 18px',
            border: '1px solid rgba(61,123,212,0.45)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(61,123,212,0.15)'
            e.currentTarget.style.borderColor = 'rgba(61,123,212,0.8)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(61,123,212,0.45)'
          }}
          >GET ACCESS</Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 32px 80px',
        textAlign: 'center',
      }}>

        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', marginBottom: 32,
          border: '1px solid rgba(42,158,88,0.25)',
          background: 'rgba(42,158,88,0.06)',
          fontSize: 9, letterSpacing: 3, color: '#2a9e58',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#2a9e58', display: 'inline-block',
            animation: 'pulse-dot 1.6s infinite',
          }} />
          PROTOTYPE BUILD · OPEN BETA
        </div>

        {/* Main title */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(64px, 12vw, 120px)',
          letterSpacing: '0.12em',
          color: '#ddeeff',
          lineHeight: 0.95,
          marginBottom: 12,
        }}>
          NEPTUNE
        </div>

        <div style={{
          fontSize: 'clamp(11px, 1.5vw, 14px)',
          letterSpacing: '0.4em',
          color: '#3d7bd4',
          marginBottom: 32,
        }}>
          GLOBAL INTELLIGENCE ENGINE
        </div>

        {/* Divider */}
        <div style={{
          width: 120, height: 1, marginBottom: 32,
          background: 'linear-gradient(90deg, transparent, rgba(61,123,212,0.5), transparent)',
        }} />

        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(13px, 1.8vw, 16px)',
          color: '#8ab0cc',
          lineHeight: 1.8,
          maxWidth: 560,
          marginBottom: 48,
        }}>
          Turn any set of sources into a live knowledge graph.
          Track entities, relationships, and decisions — powered by AI.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          <Link href="/signup" style={{
            padding: '14px 36px',
            background: 'rgba(61,123,212,0.14)',
            border: '1px solid rgba(61,123,212,0.55)',
            color: '#c8e4ff',
            fontSize: 11, letterSpacing: 3, fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.2s',
            fontFamily: 'var(--font-mono)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(61,123,212,0.28)'
            e.currentTarget.style.borderColor = 'rgba(61,123,212,0.9)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(61,123,212,0.14)'
            e.currentTarget.style.borderColor = 'rgba(61,123,212,0.55)'
          }}
          >
            CREATE WORKSPACE →
          </Link>

          <Link href="/login" style={{
            padding: '14px 36px',
            background: 'transparent',
            border: '1px solid rgba(58,110,200,0.2)',
            color: '#6a9aba',
            fontSize: 11, letterSpacing: 3,
            textDecoration: 'none', transition: 'all 0.2s',
            fontFamily: 'var(--font-mono)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(58,110,200,0.45)'
            e.currentTarget.style.color = '#c8e4ff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(58,110,200,0.2)'
            e.currentTarget.style.color = '#6a9aba'
          }}
          >
            SIGN IN
          </Link>
        </div>

        <Link href="/preview" style={{
          fontSize: 10, letterSpacing: 2, color: '#4a6b8a',
          textDecoration: 'none', transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#7aaeee'}
        onMouseLeave={e => e.currentTarget.style.color = '#4a6b8a'}
        >
          ⬡ explore demo workspace without signing in
        </Link>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(58,110,200,0.1)',
        borderBottom: '1px solid rgba(58,110,200,0.1)',
        background: 'rgba(4,8,22,0.7)',
        backdropFilter: 'blur(12px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
      }}>
        {STATS.map((stat, i) => (
          <div key={i} style={{
            padding: '28px 0', textAlign: 'center',
            borderRight: i < 3 ? '1px solid rgba(58,110,200,0.1)' : 'none',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36, letterSpacing: 3, color: '#7aaeee',
              lineHeight: 1, marginBottom: 6,
            }}>{stat.value}</div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: '#3a5878' }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '96px 48px',
        maxWidth: 1100, margin: '0 auto',
      }}>
        <div style={{
          fontSize: 9, letterSpacing: 4, color: '#3d7bd4',
          textAlign: 'center', marginBottom: 56,
        }}>
          CAPABILITIES
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 2,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: '32px 28px',
              background: 'rgba(8,13,31,0.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(58,110,200,0.1)',
              borderTop: '2px solid rgba(61,123,212,0.2)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(11,18,42,0.8)'
              e.currentTarget.style.borderTopColor = 'rgba(61,123,212,0.55)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(8,13,31,0.55)'
              e.currentTarget.style.borderTopColor = 'rgba(61,123,212,0.2)'
            }}
            >
              <div style={{ fontSize: 22, marginBottom: 14, color: '#3d7bd4' }}>{f.icon}</div>
              <div style={{
                fontSize: 11, letterSpacing: 2, color: '#c8e4ff',
                marginBottom: 10, fontWeight: 600,
              }}>{f.label}</div>
              <div style={{ fontSize: 12, color: '#6a9aba', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '80px 48px',
        textAlign: 'center',
        borderTop: '1px solid rgba(58,110,200,0.08)',
        background: 'rgba(4,8,22,0.5)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 5vw, 48px)',
          letterSpacing: '0.12em',
          color: '#ddeeff', marginBottom: 16,
        }}>
          READY TO BEGIN?
        </div>
        <p style={{ fontSize: 13, color: '#6a9aba', marginBottom: 36, lineHeight: 1.7 }}>
          Create a workspace in minutes. Add your sources.<br />
          Neptune handles the rest.
        </p>
        <Link href="/signup" style={{
          display: 'inline-block',
          padding: '14px 48px',
          background: 'rgba(61,123,212,0.14)',
          border: '1px solid rgba(61,123,212,0.55)',
          color: '#c8e4ff',
          fontSize: 11, letterSpacing: 3, fontWeight: 600,
          textDecoration: 'none', transition: 'all 0.2s',
          fontFamily: 'var(--font-mono)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(61,123,212,0.28)'
          e.currentTarget.style.borderColor = 'rgba(61,123,212,0.9)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(61,123,212,0.14)'
          e.currentTarget.style.borderColor = 'rgba(61,123,212,0.55)'
        }}
        >
          CREATE FREE ACCOUNT →
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(58,110,200,0.1)',
        background: 'rgba(3,5,12,0.9)',
        padding: '32px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        {/* Left: brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: '#2558b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 12, color: '#c8e4ff',
          }}>N</div>
          <span style={{ fontSize: 11, letterSpacing: 3, color: '#4a6b8a' }}>NEPTUNE</span>
          <span style={{ fontSize: 11, color: '#2a3a50', marginLeft: 8 }}>© 2026</span>
        </div>

        {/* Center: links */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Demo', href: '/preview' },
            { label: 'Sign In', href: '/login' },
            { label: 'Sign Up', href: '/signup' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
          ].map(link => (
            <Link key={link.href} href={link.href} style={{
              fontSize: 11, letterSpacing: 1, color: '#3a5878',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#7aaeee'}
            onMouseLeave={e => e.currentTarget.style.color = '#3a5878'}
            >{link.label}</Link>
          ))}
        </div>

        {/* Right: version */}
        <div style={{ fontSize: 10, color: '#2a3a50', letterSpacing: 1 }}>
          v0.1 · Prototype Build
        </div>
      </footer>
    </div>
  )
}