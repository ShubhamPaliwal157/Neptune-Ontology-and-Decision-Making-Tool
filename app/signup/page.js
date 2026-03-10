'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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

export default function SignupPage() {
  const router = useRouter()

  const [fullName,   setFullName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)
  const [loading,    setLoading]    = useState(false)

  const passwordStrength = (p) => {
    if (!p) return null
    if (p.length < 6)  return { label: 'TOO SHORT', color: '#c94040', w: '20%' }
    if (p.length < 10) return { label: 'WEAK',      color: '#c87c3a', w: '45%' }
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'MODERATE', color: '#b89a30', w: '68%' }
    return { label: 'STRONG', color: '#2a9e58', w: '100%' }
  }

  const strength = passwordStrength(password)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('PASSWORDS DO NOT MATCH')
      return
    }
    if (password.length < 8) {
      setError('PASSWORD MUST BE AT LEAST 8 CHARACTERS')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message.toUpperCase())
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#03050c', fontFamily: 'var(--font-mono)',
      position: 'relative', overflow: 'hidden',
    }}>
      <Stars />
      <div style={{
        position: 'relative', zIndex: 1, width: 400, textAlign: 'center',
        background: 'linear-gradient(160deg, rgba(11,18,40,0.96), rgba(7,11,28,0.96))',
        border: '1px solid rgba(58,110,200,0.16)',
        borderTop: '2px solid rgba(42,158,88,0.6)',
        padding: '52px 44px',
        backdropFilter: 'blur(20px)',
        animation: 'modal-rise 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>◈</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 6, color: '#2a9e58', marginBottom: 12 }}>
          ACCESS GRANTED
        </div>
        <div style={{ fontSize: 10, color: '#7a9fbe', lineHeight: 1.8, marginBottom: 32 }}>
          Verification link sent to<br />
          <span style={{ color: '#c8e4ff' }}>{email}</span><br /><br />
          Check your inbox and confirm your account to continue.
        </div>
        <a href="/login" style={{
          display: 'block', padding: '12px',
          border: '1px solid rgba(42,158,88,0.35)',
          color: '#2a9e58', fontSize: 9, letterSpacing: 3,
          textDecoration: 'none', transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(42,158,88,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          BACK TO LOGIN →
        </a>
      </div>
    </div>
  )

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#03050c', fontFamily: 'var(--font-mono)',
      position: 'relative', overflow: 'hidden',
    }}>
      <Stars />

      <div style={{
        position: 'relative', zIndex: 1,
        width: 400,
        background: 'linear-gradient(160deg, rgba(11,18,40,0.96) 0%, rgba(7,11,28,0.96) 100%)',
        border: '1px solid rgba(58,110,200,0.16)',
        borderTop: '2px solid rgba(61,123,212,0.55)',
        padding: '44px 44px 40px',
        backdropFilter: 'blur(20px)',
        animation: 'modal-rise 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 38, letterSpacing: 10,
            color: '#c8e4ff', lineHeight: 1, marginBottom: 5,
          }}>NEPTUNE</div>
          <div style={{ fontSize: 8, letterSpacing: 4, color: '#3d7bd4' }}>
            REQUEST ACCESS
          </div>
        </div>

        <div style={{
          height: 1, marginBottom: 28,
          background: 'linear-gradient(90deg, transparent, rgba(61,123,212,0.4), transparent)',
        }} />

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Full name */}
          <div>
            <label style={{ fontSize: 8, letterSpacing: 2, color: '#3a5878', display: 'block', marginBottom: 6 }}>
              FULL NAME
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Your name"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(61,123,212,0.55)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(58,110,200,0.2)'}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 8, letterSpacing: 2, color: '#3a5878', display: 'block', marginBottom: 6 }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="analyst@organisation.gov"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(61,123,212,0.55)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(58,110,200,0.2)'}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 8, letterSpacing: 2, color: '#3a5878', display: 'block', marginBottom: 6 }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = 'rgba(61,123,212,0.55)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(58,110,200,0.2)'}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#3a5878', fontSize: 11, padding: 2,
              }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {/* Strength bar */}
            {strength && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 2, background: 'rgba(58,110,200,0.12)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: strength.w, background: strength.color,
                    transition: 'width 0.3s, background 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 7, letterSpacing: 1, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ fontSize: 8, letterSpacing: 2, color: '#3a5878', display: 'block', marginBottom: 6 }}>
              CONFIRM PASSWORD
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repeat password"
              style={{
                ...inputStyle,
                borderColor: confirm && confirm !== password
                  ? 'rgba(201,64,64,0.4)'
                  : confirm && confirm === password
                    ? 'rgba(42,158,88,0.4)'
                    : 'rgba(58,110,200,0.2)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(61,123,212,0.55)'}
              onBlur={e  => e.target.style.borderColor = confirm !== password
                ? 'rgba(201,64,64,0.4)'
                : confirm === password && confirm
                  ? 'rgba(42,158,88,0.4)'
                  : 'rgba(58,110,200,0.2)'}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontSize: 9, color: '#c94040', letterSpacing: 1,
              padding: '8px 12px',
              background: 'rgba(201,64,64,0.08)',
              border: '1px solid rgba(201,64,64,0.2)',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', marginTop: 6, padding: '13px',
              background: 'transparent',
              border: '1px solid rgba(100,160,240,0.35)',
              color: '#c8e4ff',
              fontSize: 10, fontWeight: 600, letterSpacing: 4,
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'var(--font-mono)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(61,123,212,0.1)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'transparent' }}
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT →'}
          </button>
        </form>

        <div style={{
          height: 1, margin: '28px 0 22px',
          background: 'linear-gradient(90deg, transparent, rgba(58,110,200,0.15), transparent)',
        }} />

        <div style={{ textAlign: 'center', fontSize: 9, color: '#3a5878', letterSpacing: 1 }}>
          ALREADY HAVE ACCESS?{' '}
          <a href="/login" style={{
            color: '#7aaeee', textDecoration: 'none', letterSpacing: 2, transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#c8e4ff'}
          onMouseLeave={e => e.currentTarget.style.color = '#7aaeee'}
          >
            SIGN IN →
          </a>
        </div>
      </div>
    </div>
  )
}