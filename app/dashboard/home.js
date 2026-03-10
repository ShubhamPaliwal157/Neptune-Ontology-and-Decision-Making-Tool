'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/app/dashboard/page'

function Stars() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const set = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    set(); window.addEventListener('resize', set)
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.9 + 0.15,
      a: Math.random() * 0.35 + 0.08,
      s: Math.random() * 0.006 + 0.002,
      p: Math.random() * Math.PI * 2,
    }))
    let t = 0, frame
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        ctx.beginPath()
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${Math.max(0, s.a + Math.sin(t * s.s + s.p) * 0.1)})`
        ctx.fill()
      })
      t++; frame = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', set) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

const DOMAIN_COLORS = {
  geopolitics: '#c94040', economics: '#c87c3a', defense: '#b85a30',
  technology: '#3d7bd4', climate: '#2a9e58', society: '#7050b8',
}

function WorkspaceCard({ workspace, size = 'normal' }) {
  const isLarge = size === 'large'
  const domains = workspace.domains || []
  const lastOpened = workspace.last_opened_at
    ? new Date(workspace.last_opened_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
    : 'Never opened'

  return (
    <Link href={`/workspace/${workspace.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(11,18,40,0.9) 0%, rgba(7,11,28,0.95) 100%)',
          border: '1px solid rgba(58,110,200,0.2)',
          borderTop: '2px solid rgba(61,123,212,0.45)',
          padding: isLarge ? '24px' : '18px 20px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'hidden',
          height: isLarge ? 210 : 170,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(61,123,212,0.5)'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(61,123,212,0.15)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(58,110,200,0.2)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(180deg, rgba(61,123,212,0.07) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: workspace.is_active ? '#2a9e58' : '#4a6b8a',
              boxShadow: workspace.is_active ? '0 0 6px #2a9e58' : 'none',
            }} />
            <span style={{ fontSize: 11, letterSpacing: 1, color: '#6a9aba' }}>
              {workspace.is_collaborative ? '◈ COLLABORATIVE' : '○ PERSONAL'}
            </span>
            {workspace.member_count > 1 && (
              <span style={{ fontSize: 11, color: '#5a8ec4' }}>
                · {workspace.member_count} members
              </span>
            )}
          </div>

          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: isLarge ? 26 : 22,
            letterSpacing: 3,
            color: '#ddeeff',
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            {workspace.name.toUpperCase()}
          </div>

          {workspace.description && (
            <div style={{
              fontSize: 12, color: '#6a9aba', lineHeight: 1.6,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {workspace.description}
            </div>
          )}
        </div>

        <div>
          {domains.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {domains.map(d => (
                <div key={d} title={d} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: DOMAIN_COLORS[d] || '#3d7bd4',
                  boxShadow: `0 0 5px ${DOMAIN_COLORS[d] || '#3d7bd4'}99`,
                }} />
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#4a6b8a' }}>
              {workspace.node_count || 0} entities · {workspace.edge_count || 0} relations
            </span>
            <span style={{ fontSize: 11, color: '#4a6b8a' }}>
              {lastOpened}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function CreateWorkspaceButton({ onClick, size = 'normal' }) {
  const isLarge = size === 'large'
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px dashed rgba(61,123,212,0.3)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        height: isLarge ? 210 : 170,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(61,123,212,0.6)'
        e.currentTarget.style.background = 'rgba(61,123,212,0.05)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(61,123,212,0.3)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{ fontSize: 28, color: 'rgba(61,123,212,0.6)', lineHeight: 1 }}>+</div>
      <div style={{ fontSize: 13, letterSpacing: 2, color: '#6a9aba' }}>NEW WORKSPACE</div>
    </button>
  )
}

function AllWorkspacesModal({ workspaces, onClose, onCreateNew }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(3,5,12,0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 32,
        animation: 'fade-in-up 0.2s ease forwards',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 960, maxHeight: '80vh',
        background: 'linear-gradient(160deg, rgba(11,18,40,0.98), rgba(7,11,28,0.98))',
        border: '1px solid rgba(58,110,200,0.2)',
        borderTop: '2px solid rgba(61,123,212,0.5)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(58,110,200,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', letterSpacing: 4, color: '#ddeeff', marginBottom: 4 }}>
              ALL WORKSPACES
            </div>
            <div style={{ fontSize: 13, color: '#6a9aba' }}>
              {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#6a9aba',
            fontSize: 24, padding: 4, lineHeight: 1, transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ddeeff'}
          onMouseLeave={e => e.currentTarget.style.color = '#6a9aba'}
          >×</button>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
          alignContent: 'start',
        }}>
          {workspaces.map(ws => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
          <CreateWorkspaceButton onClick={onCreateNew} />
        </div>
      </div>
    </div>
  )
}

function DashboardHome() {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showAll, setShowAll]        = useState(false)
  const [greeting, setGreeting]      = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING')
  }, [])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('last_opened_at', { ascending: false, nullsFirst: false })
      setWorkspaces(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const [processingJob, setProcessingJob] = useState(null)

  // Poll processing status if redirected from workspace creation
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const processingWsId = params.get('processing')
    if (!processingWsId || !user) return

    // Find the job for this workspace
    const findAndPoll = async () => {
      const res  = await fetch(`/api/process/status?workspace_id=${processingWsId}&user_id=${user.id}`)
      // status endpoint needs job_id — get latest job for workspace via supabase
      const { data: job } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('workspace_id', processingWsId)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!job) return
      setProcessingJob(job)

      if (job.status === 'running' || job.status === 'pending') {
        const poll = setInterval(async () => {
          const statusRes  = await fetch(`/api/process/status?job_id=${job.id}&user_id=${user.id}`)
          const statusData = await statusRes.json()
          setProcessingJob(prev => ({ ...prev, ...statusData }))
          if (statusData.status === 'done' || statusData.status === 'error') {
            clearInterval(poll)
            // Reload workspaces to get updated node/edge counts
            const { data } = await supabase
              .from('workspaces').select('*').eq('owner_id', user.id)
              .order('last_opened_at', { ascending: false, nullsFirst: false })
            setWorkspaces(data || [])
          }
        }, 2500)
        return () => clearInterval(poll)
      }
    }

    findAndPoll()
  }, [user])
  const hasMany   = workspaces.length > 2
  const recentTwo = workspaces.slice(0, 2)
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'ANALYST'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#03050c', fontFamily: 'var(--font-mono)',
      position: 'relative',
    }}>
      <Stars />

      {/* Top bar */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 32px',
        borderBottom: '1px solid rgba(58,110,200,0.12)',
        background: 'rgba(3,5,12,0.75)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#2558b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 17, color: '#c8e4ff',
            boxShadow: '0 0 10px rgba(61,123,212,0.4)',
          }}>N</div>
          <span style={{ fontSize: 13, letterSpacing: 3, color: '#7aaeee', fontWeight: 600 }}>NEPTUNE</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 13, color: '#6a9aba' }}>
            {user?.email}
          </span>
          <button onClick={handleSignOut} style={{
            background: 'transparent', border: '1px solid rgba(58,110,200,0.25)',
            color: '#6a9aba', fontSize: 12, letterSpacing: 1, padding: '6px 14px',
            fontFamily: 'var(--font-mono)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#c94040'; e.currentTarget.style.borderColor = 'rgba(201,64,64,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6a9aba'; e.currentTarget.style.borderColor = 'rgba(58,110,200,0.25)' }}
          >Sign Out</button>
        </div>
      </div>

      {/* Processing banner */}
      {processingJob && processingJob.status !== 'done' && (
        <div style={{
          position: 'relative', zIndex: 9,
          padding: '10px 32px',
          background: processingJob.status === 'error'
            ? 'rgba(201,64,64,0.08)'
            : 'rgba(37,88,184,0.08)',
          borderBottom: `1px solid ${processingJob.status === 'error' ? 'rgba(201,64,64,0.2)' : 'rgba(61,123,212,0.2)'}`,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {/* Progress bar */}
          <div style={{ flex: 1, height: 2, background: 'rgba(58,110,200,0.15)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${processingJob.progress || 0}%`,
              background: processingJob.status === 'error' ? '#c94040' : '#3d7bd4',
              transition: 'width 0.6s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, color: processingJob.status === 'error' ? '#c94040' : '#6a9aba', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
            {processingJob.status === 'error'
              ? `⚠ Processing failed — ${processingJob.error_message}`
              : `⟳ ${processingJob.current_step || 'Processing...'} (${processingJob.progress || 0}%)`}
          </span>
        </div>
      )}
      {processingJob?.status === 'done' && (
        <div style={{
          position: 'relative', zIndex: 9,
          padding: '10px 32px',
          background: 'rgba(42,158,88,0.07)',
          borderBottom: '1px solid rgba(42,158,88,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: '#2a9e58', letterSpacing: 0.5 }}>✓ Workspace processed — knowledge graph is ready</span>
          <button onClick={() => setProcessingJob(null)} style={{ background: 'none', border: 'none', color: '#4a6b8a', fontSize: 16, cursor: 'pointer', padding: 0 }}>×</button>
        </div>
      )}

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 5,
        height: 'calc(100vh - 59px)',
        display: 'flex', flexDirection: 'column',
        padding: '52px 64px 32px',
        overflow: 'hidden',
      }}>

        {/* Greeting */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 13, letterSpacing: 3, color: '#5a8ec4', marginBottom: 8 }}>
            {greeting}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 48, letterSpacing: 6, color: '#ddeeff', lineHeight: 1,
          }}>
            {firstName.toUpperCase()}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: '#3d7bd4',
                animation: `pulse-dot 0.8s ${i*0.15}s infinite`,
              }} />
            ))}
          </div>
        ) : (
          <>
            {/* Section label */}
            <div style={{
              fontSize: 12, letterSpacing: 2, color: '#5a8ec4', marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              RECENT WORKSPACES
              <div style={{ flex: 1, height: 1, background: 'rgba(58,110,200,0.15)', maxWidth: 300 }} />
            </div>

            {/* Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min((workspaces.length === 0 ? 1 : recentTwo.length) + (hasMany ? 0 : 1), 3)}, minmax(0, 320px))`,
              gap: 16, maxWidth: 1000,
            }}>
              {recentTwo.map(ws => (
                <WorkspaceCard key={ws.id} workspace={ws} size="large" />
              ))}
              {!hasMany && (
                <CreateWorkspaceButton onClick={() => window.location.href = '/dashboard/new'} size="large" />
              )}
            </div>

            {/* View all */}
            {hasMany && (
              <button
                onClick={() => setShowAll(true)}
                style={{
                  marginTop: 20, background: 'transparent',
                  border: '1px solid rgba(58,110,200,0.25)',
                  color: '#6a9aba', fontSize: 13, letterSpacing: 2,
                  padding: '10px 24px', fontFamily: 'var(--font-mono)',
                  transition: 'all 0.2s', alignSelf: 'flex-start',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#7aaeee'; e.currentTarget.style.borderColor = 'rgba(61,123,212,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6a9aba'; e.currentTarget.style.borderColor = 'rgba(58,110,200,0.25)' }}
              >
                VIEW ALL {workspaces.length} WORKSPACES →
              </button>
            )}
          </>
        )}

        {/* Preview workspace — bottom */}
        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(58,110,200,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: '#4a6b8a' }}>PREVIEW</span>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 18px',
                border: '1px solid rgba(61,123,212,0.25)',
                color: '#6a9aba', fontSize: 13, letterSpacing: 1,
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#a8d0f5'
                e.currentTarget.style.borderColor = 'rgba(61,123,212,0.5)'
                e.currentTarget.style.background = 'rgba(61,123,212,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#6a9aba'
                e.currentTarget.style.borderColor = 'rgba(61,123,212,0.25)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              ⬡ Neptune Preview Workspace
            </Link>
            <span style={{ fontSize: 11, color: '#4a6b8a' }}>No login required</span>
          </div>
        </div>
      </div>

      {showAll && (
        <AllWorkspacesModal
          workspaces={workspaces}
          onClose={() => setShowAll(false)}
          onCreateNew={() => { setShowAll(false); window.location.href = '/dashboard/new' }}
        />
      )}
    </div>
  )
}

export default withAuth(DashboardHome)