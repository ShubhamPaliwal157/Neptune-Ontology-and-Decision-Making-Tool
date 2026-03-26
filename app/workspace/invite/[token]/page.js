'use client'
import { useState, useEffect, use } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WorkspaceInvitePage({ params }) {
  const { token } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteData, setInviteData] = useState(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!user) {
      // Redirect to login with return URL
      window.location.href = `/login?redirect=/workspace/invite/${token}`
      return
    }

    // Fetch invite details
    async function loadInvite() {
      try {
        const res = await fetch(`/api/workspace/invite/${token}`)
        const data = await res.json()
        
        if (!res.ok) {
          setError(data.error || 'Invalid or expired invite')
          setLoading(false)
          return
        }
        
        setInviteData(data)
        setLoading(false)
      } catch (err) {
        setError('Failed to load invite')
        setLoading(false)
      }
    }

    loadInvite()
  }, [token, user])

  const handleAccept = async () => {
    setAccepting(true)
    setError('')
    
    try {
      const res = await fetch(`/api/workspace/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Failed to accept invite')
        setAccepting(false)
        return
      }
      
      // Redirect to workspace
      router.push(`/workspace/${inviteData.workspace_id}`)
    } catch (err) {
      setError('Failed to accept invite')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#03050c',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', gap: 20,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 32,
          letterSpacing: 10, color: '#3d7bd4',
        }}>NEPTUNE</div>
        <div style={{ fontSize: 9, letterSpacing: 4, color: '#4a6b8a' }}>
          LOADING INVITE
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#03050c',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', gap: 20,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 28,
          letterSpacing: 8, color: '#c94040',
        }}>NEPTUNE</div>
        <div style={{
          fontSize: 9, letterSpacing: 3, color: '#c94040',
          padding: '4px 12px', border: '1px solid rgba(200,60,60,0.3)',
        }}>
          INVITE UNAVAILABLE
        </div>
        <p style={{ fontSize: 11, color: '#4a6b8a', maxWidth: 360, textAlign: 'center', lineHeight: 1.8 }}>
          {error}
        </p>
        <Link href="/dashboard" style={{
          fontSize: 10, letterSpacing: 3, color: '#3d7bd4',
          textDecoration: 'none', border: '1px solid rgba(61,123,212,0.3)',
          padding: '8px 20px', marginTop: 8,
          transition: 'all 0.2s',
        }}>← BACK TO DASHBOARD</Link>
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#03050c',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', gap: 24,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 32,
        letterSpacing: 10, color: '#3d7bd4',
      }}>NEPTUNE</div>
      
      <div style={{
        maxWidth: 480, padding: '32px',
        background: 'rgba(11, 18, 40, 0.6)',
        border: '1px solid rgba(61, 123, 212, 0.15)',
        borderRadius: 8,
      }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6b8a', marginBottom: 12 }}>
          WORKSPACE INVITE
        </div>
        <div style={{ fontSize: 20, color: '#ddeeff', marginBottom: 8, fontFamily: 'var(--font-display)', letterSpacing: 2 }}>
          {inviteData?.workspace_name}
        </div>
        <div style={{ fontSize: 12, color: '#6a9aba', marginBottom: 20, lineHeight: 1.6 }}>
          You've been invited to join this workspace as a {inviteData?.role}.
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={handleAccept}
            disabled={accepting}
            style={{
              flex: 1, padding: '12px 24px',
              background: accepting ? 'transparent' : 'rgba(42,158,88,0.12)',
              border: `1px solid ${accepting ? 'rgba(58,110,200,0.15)' : 'rgba(42,158,88,0.5)'}`,
              color: accepting ? '#4a6b8a' : '#2a9e58',
              fontSize: 13, fontWeight: 600, letterSpacing: 1,
              fontFamily: 'var(--font-mono)',
              cursor: accepting ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {accepting ? 'ACCEPTING...' : 'ACCEPT INVITE'}
          </button>
          
          <Link href="/dashboard" style={{
            flex: 1, padding: '12px 24px',
            background: 'transparent',
            border: '1px solid rgba(58,110,200,0.2)',
            color: '#6a9aba',
            fontSize: 13, letterSpacing: 1,
            fontFamily: 'var(--font-mono)',
            textDecoration: 'none',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}>
            DECLINE
          </Link>
        </div>
      </div>
    </div>
  )
}
