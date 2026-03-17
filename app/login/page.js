'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function Stars() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const stars = Array.from({ length: 260 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.1 + 0.2,
      a: Math.random() * 0.4 + 0.08,
      s: Math.random() * 0.007 + 0.002,
      p: Math.random() * Math.PI * 2,
    }))
    let t = 0, frame
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#03050c'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        const a = s.a + Math.sin(t * s.s + s.p) * 0.12
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${Math.max(0, a)})`
        ctx.fill()
      })
      t++
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Session confirmed — full page replace so proxy picks up the cookie
    if (data.session) {
      window.location.href = next
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(8,13,31,0.8)',
    border: '1px solid rgba(58,110,200,0.2)',
    borderRadius: 2,
    color: '#ddeeff',
    fontSize: 12,
    padding: '11px 14px',
    outline: 'none',
    fontFamily: 'var(--font-mono)',
    transition: 'border-color 0.2s',
  }

  return (
    <>
      <div style={{ fontSize: 9, letterSpacing: 3, color: '#3a5878', marginBottom: 24 }}>
        SIGN IN TO YOUR WORKSPACE
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div>
          <label style={{ fontSize: 8, letterSpacing: 2, color: '#3a5878', display: 'block', marginBottom: 6 }}>
            EMAIL ADDRESS
          </label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required autoComplete="email" placeholder="analyst@organisation.gov"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(61,123,212,0.55)'}
            onBlur={e  => e.target.style.borderColor = 'rgba(58,110,200,0.2)'}
          />
        </div>

        <div>
          <label style={{ fontSize: 8, letterSpacing: 2, color: '#3a5878', display: 'block', marginBottom: 6 }}>
            PASSWORD
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••••••"
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => e.target.style.borderColor = 'rgba(61,123,212,0.55)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(58,110,200,0.2)'}
            />
            <button type="button" onClick={() => setShowPass(v => !v)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#3a5878', fontSize: 11, padding: 2,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#7aaeee'}
            onMouseLeave={e => e.currentTarget.style.color = '#3a5878'}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            fontSize: 9, color: '#c94040', letterSpacing: 1,
            padding: '8px 12px',
            background: 'rgba(201,64,64,0.08)',
            border: '1px solid rgba(201,64,64,0.2)',
          }}>
            ⚠ {error.toUpperCase()}
          </div>
        )}

        <div style={{ textAlign: 'right', marginTop: -6 }}>
          <Link href="/forgot-password" style={{
            fontSize: 8, color: '#3a5878', letterSpacing: 1, textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#7aaeee'}
          onMouseLeave={e => e.currentTarget.style.color = '#3a5878'}
          >
            FORGOT PASSWORD?
          </Link>
        </div>

        <button
          type="submit" disabled={loading}
          style={{
            width: '100%', marginTop: 6, padding: '13px',
            background: loading ? 'rgba(61,123,212,0.06)' : 'transparent',
            border: '1px solid rgba(100,160,240,0.35)',
            color: '#c8e4ff', fontSize: 10, fontWeight: 600, letterSpacing: 4,
            transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
            fontFamily: 'var(--font-mono)',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(61,123,212,0.1)' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'transparent' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#3d7bd4', display: 'inline-block',
                    animation: `pulse-dot 0.8s ${i * 0.15}s infinite`,
                  }} />
                ))}
              </span>
              AUTHENTICATING
            </span>
          ) : 'ENTER WORKSPACE →'}
        </button>
      </form>

      <div style={{
        height: 1, margin: '28px 0 24px',
        background: 'linear-gradient(90deg, transparent, rgba(58,110,200,0.15), transparent)',
      }} />

      <div style={{ textAlign: 'center', fontSize: 9, color: '#3a5878', letterSpacing: 1, marginBottom: 16 }}>
        NO ACCOUNT?{' '}
        <Link href="/signup" style={{
          color: '#7aaeee', textDecoration: 'none', letterSpacing: 2,
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#c8e4ff'}
        onMouseLeave={e => e.currentTarget.style.color = '#7aaeee'}
        >
          CREATE ONE →
        </Link>
      </div>

      {/* Footer links */}
      {/* Footer */}
      <div style={{ marginTop: 28, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <a href="/terms" style={{ fontSize: 10, letterSpacing: 1, color: '#2a3a50', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color='#7aaeee'}
          onMouseLeave={e => e.currentTarget.style.color='#2a3a50'}
        >Terms</a>
        <span style={{ color: '#2a3a50', margin: '0 10px', fontSize: 10 }}>·</span>
        <a href="/privacy" style={{ fontSize: 10, letterSpacing: 1, color: '#2a3a50', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color='#7aaeee'}
          onMouseLeave={e => e.currentTarget.style.color='#2a3a50'}
        >Privacy</a>
      </div>

      {/* Preview workspace — prominent button */}
      <Link
        href="/"
        style={{
          display: 'block', textAlign: 'center',
          padding: '10px 0',
          border: '1px solid rgba(61,123,212,0.28)',
          color: '#7aaeee',
          fontSize: 10, letterSpacing: 2,
          textDecoration: 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(61,123,212,0.08)'
          e.currentTarget.style.borderColor = 'rgba(61,123,212,0.55)'
          e.currentTarget.style.color = '#c8e4ff'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(61,123,212,0.28)'
          e.currentTarget.style.color = '#7aaeee'
        }}
      >
        ⬡ VIEW PREVIEW WORKSPACE
      </Link>
    </>
  )
}

export default function LoginPage() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#03050c', fontFamily: 'var(--font-mono)',
      position: 'relative', overflow: 'hidden',
    }}>
      <Stars />

      <div style={{
        position: 'relative', zIndex: 1, width: 400,
        background: 'linear-gradient(160deg, rgba(11,18,40,0.96) 0%, rgba(7,11,28,0.96) 100%)',
        border: '1px solid rgba(58,110,200,0.16)',
        borderTop: '2px solid rgba(61,123,212,0.55)',
        padding: '44px 44px 40px',
        backdropFilter: 'blur(20px)',
        animation: 'modal-rise 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      }}>

        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 10,
            color: '#c8e4ff', lineHeight: 1, marginBottom: 5,
          }}>NEPTUNE</div>
          <div style={{ fontSize: 8, letterSpacing: 4, color: '#3d7bd4' }}>
            GLOBAL INTELLIGENCE ENGINE
          </div>
        </div>

        <div style={{
          height: 1, marginBottom: 32,
          background: 'linear-gradient(90deg, transparent, rgba(61,123,212,0.4), transparent)',
        }} />

        {/* useSearchParams requires Suspense boundary */}
        <Suspense fallback={<div style={{ color: '#3a5878', fontSize: 9, letterSpacing: 2, textAlign: 'center' }}>LOADING...</div>}>
          <LoginForm />
        </Suspense>

      </div>
    </div>
  )
}