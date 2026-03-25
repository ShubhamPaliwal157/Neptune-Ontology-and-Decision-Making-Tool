'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/app/dashboard/withAuth'

const DOMAIN_COLORS = {
  geopolitics: '#c94040', economics: '#c87c3a', defense: '#b85a30',
  technology: '#3d7bd4', climate: '#2a9e58', society: '#7050b8',
}

// ── Ambient background orbs (matches landing page) ────────────────────────────
function AmbientBackground() {
  const orbRef    = useRef(null)
  const mouseRef  = useRef({ x: 600, y: 400 })
  const orbPosRef = useRef({ x: 600, y: 400 })
  const rafRef    = useRef(null)

  useEffect(() => {
    const move = e => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', move, { passive: true })
    const tick = () => {
      orbPosRef.current.x += (mouseRef.current.x - orbPosRef.current.x) * 0.055
      orbPosRef.current.y += (mouseRef.current.y - orbPosRef.current.y) * 0.055
      if (orbRef.current)
        orbRef.current.style.transform = `translate(${orbPosRef.current.x - 360}px, ${orbPosRef.current.y - 360}px)`
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <>
      {/* cursor-following orb */}
      <div ref={orbRef} style={{
        position: 'fixed', top: 0, left: 0, width: 720, height: 720, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(61,123,212,0.32) 0%,rgba(112,80,184,0.18) 28%,rgba(61,123,212,0.08) 52%,transparent 70%)',
        filter: 'blur(38px)', pointerEvents: 'none', zIndex: 0, willChange: 'transform', mixBlendMode: 'screen',
      }} />
      {/* static ambient blobs */}
      <div style={{ position: 'fixed', top: -180, right: -180, width: 680, height: 680, borderRadius: '50%', background: 'radial-gradient(circle,rgba(112,80,184,0.10) 0%,transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0, animation: 'db-breathe 9s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: -280, left: -160, width: 760, height: 760, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,158,88,0.05) 0%,transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0, animation: 'db-breathe 13s ease-in-out 3s infinite' }} />
      {/* dot grid */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
    </>
  )
}

// ── Workspace card — glassmorphic ─────────────────────────────────────────────
function WorkspaceCard({ workspace, size = 'normal', onDelete }) {
  const isLarge = size === 'large'
  const domains = workspace.domains || []
  const lastOpened = workspace.last_opened_at
    ? new Date(workspace.last_opened_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
    : 'Never opened'
  const [menuOpen, setMenuOpen]   = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [hovered, setHovered]     = useState(false)

  // pick a subtle accent from first domain
  const accent = DOMAIN_COLORS[domains[0]] || '#3d7bd4'

  return (
    <div style={{ position: 'relative' }}>
      {/* 3-dot menu */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o); setConfirming(false) }}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 20,
          width: 28, height: 28,
          background: menuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: '1px solid ' + (menuOpen ? 'rgba(255,255,255,0.15)' : 'transparent'),
          color: 'rgba(200,220,255,0.5)', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s', borderRadius: 4,
          letterSpacing: 2, paddingBottom: 4,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
        onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
      >&middot;&middot;&middot;</button>

      {/* Dropdown */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute', top: 42, right: 10, zIndex: 30,
            background: 'rgba(8,12,28,0.92)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 165, boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            borderRadius: 8,
          }}
          onMouseLeave={() => { setMenuOpen(false); setConfirming(false) }}
        >
          {!confirming ? (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirming(true) }}
              style={{
                width: '100%', padding: '10px 14px', background: 'transparent',
                border: 'none', color: '#c94040', fontSize: 11, letterSpacing: 1,
                textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s',
                borderRadius: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,64,64,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 11 }}>&#x2715;</span> DELETE WORKSPACE
            </button>
          ) : (
            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: 'rgba(200,220,255,0.5)', marginBottom: 8, letterSpacing: 0.5 }}>
                This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); setConfirming(false); onDelete && onDelete(workspace.id) }}
                  style={{ flex: 1, padding: '6px 0', background: 'rgba(201,64,64,0.15)', border: '1px solid rgba(201,64,64,0.4)', color: '#c94040', fontSize: 10, letterSpacing: 1, cursor: 'pointer', fontFamily: 'var(--font-mono)', borderRadius: 4 }}
                >CONFIRM</button>
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirming(false) }}
                  style={{ flex: 1, padding: '6px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(200,220,255,0.6)', fontSize: 10, letterSpacing: 1, cursor: 'pointer', fontFamily: 'var(--font-mono)', borderRadius: 4 }}
                >CANCEL</button>
              </div>
            </div>
          )}
        </div>
      )}

      <Link href={`/workspace/${workspace.id}`} style={{ textDecoration: 'none' }}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: hovered
              ? 'rgba(255,255,255,0.065)'
              : 'rgba(255,255,255,0.038)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: `1px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.075)'}`,
            borderTop: `2px solid ${hovered ? accent + 'cc' : accent + '55'}`,
            borderRadius: 16,
            padding: isLarge ? '24px' : '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            position: 'relative',
            overflow: 'hidden',
            height: isLarge ? 210 : 170,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: hovered
              ? `0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.08)`
              : '0 8px 32px rgba(0,0,0,0.25)',
            transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          }}
        >
          {/* shimmer overlay */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'linear-gradient(135deg,rgba(255,255,255,0.055) 0%,transparent 55%)', pointerEvents: 'none' }} />
          {/* accent glow top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: `linear-gradient(180deg,${accent}12 0%,transparent 100%)`, pointerEvents: 'none', borderRadius: '16px 16px 0 0' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: workspace.is_active ? '#2a9e58' : 'rgba(255,255,255,0.2)', boxShadow: workspace.is_active ? '0 0 8px #2a9e58' : 'none' }} />
              <span style={{ fontSize: 11, letterSpacing: 1, color: 'rgba(200,220,255,0.5)' }}>
                {workspace.is_collaborative ? '◈ COLLABORATIVE' : '○ PERSONAL'}
              </span>
              {workspace.member_count > 1 && (
                <span style={{ fontSize: 11, color: 'rgba(200,220,255,0.4)' }}>· {workspace.member_count} members</span>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: isLarge ? 26 : 22, letterSpacing: 3, color: '#f0f4ff', lineHeight: 1.1, marginBottom: 8 }}>
              {workspace.name.toUpperCase()}
            </div>
            {workspace.description && (
              <div style={{ fontSize: 12, color: 'rgba(200,220,255,0.45)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {workspace.description}
              </div>
            )}
          </div>

          <div>
            {domains.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {domains.map(d => (
                  <div key={d} title={d} style={{ width: 8, height: 8, borderRadius: '50%', background: DOMAIN_COLORS[d] || '#3d7bd4', boxShadow: `0 0 6px ${DOMAIN_COLORS[d] || '#3d7bd4'}99` }} />
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'rgba(200,220,255,0.3)' }}>{workspace.node_count || 0} entities · {workspace.edge_count || 0} relations</span>
              <span style={{ fontSize: 11, color: 'rgba(200,220,255,0.3)' }}>{lastOpened}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── Create workspace button — glass dashed ────────────────────────────────────
function CreateWorkspaceButton({ onClick, size = 'normal' }) {
  const isLarge = size === 'large'
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(61,123,212,0.07)' : 'rgba(255,255,255,0.018)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px dashed ${hovered ? 'rgba(61,123,212,0.55)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 16,
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        height: isLarge ? 210 : 170,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        width: '100%',
        boxShadow: hovered ? '0 8px 32px rgba(61,123,212,0.12)' : 'none',
      }}
    >
      <div style={{ fontSize: 28, color: hovered ? 'rgba(61,123,212,0.9)' : 'rgba(255,255,255,0.2)', lineHeight: 1, transition: 'color 0.2s' }}>+</div>
      <div style={{ fontSize: 13, letterSpacing: 2, color: hovered ? 'rgba(200,220,255,0.7)' : 'rgba(200,220,255,0.3)', transition: 'color 0.2s' }}>NEW WORKSPACE</div>
    </button>
  )
}

// ── All workspaces modal — glass ──────────────────────────────────────────────
function AllWorkspacesModal({ workspaces, onClose, onCreateNew, onDelete }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(3,5,12,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 960, maxHeight: '80vh',
        background: 'rgba(255,255,255,0.042)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.1)', borderTop: '2px solid rgba(61,123,212,0.5)',
        borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
      }}>
        {/* shimmer */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'linear-gradient(135deg,rgba(255,255,255,0.05) 0%,transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
          <div>
            <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', letterSpacing: 4, color: '#f0f4ff', marginBottom: 4 }}>ALL WORKSPACES</div>
            <div style={{ fontSize: 13, color: 'rgba(200,220,255,0.45)' }}>{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(200,220,255,0.6)', fontSize: 20, padding: '4px 10px', lineHeight: 1, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f0f4ff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(200,220,255,0.6)' }}
          >×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, alignContent: 'start', position: 'relative' }}>
          {workspaces.map(ws => <WorkspaceCard key={ws.id} workspace={ws} onDelete={onDelete} />)}
          <CreateWorkspaceButton onClick={onCreateNew} />
        </div>
      </div>
    </div>
  )
}

// ── Search result row ─────────────────────────────────────────────────────────
function SearchResultRow({ result }) {
  const color = DOMAIN_COLORS[result.entityDomain] || '#3d7bd4'
  const href  = `/workspace/${result.workspaceId}?entity=${result.entityId}`
  return (
    <a href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.12s', background: 'transparent' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(61,123,212,0.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: color, boxShadow: `0 0 5px ${color}99` }} />
      <span style={{ fontSize: 12, color: '#c8e4ff', letterSpacing: 0.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.entityName}</span>
      <span style={{ fontSize: 9, letterSpacing: 1, color: color, border: `1px solid ${color}55`, padding: '1px 6px', flexShrink: 0, borderRadius: 3 }}>{(result.entityType || 'concept').toUpperCase()}</span>
      <span style={{ fontSize: 10, color: 'rgba(200,220,255,0.3)', flexShrink: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.workspaceName}</span>
    </a>
  )
}

// ── Main dashboard component ──────────────────────────────────────────────────
function DashboardHome() {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showAll, setShowAll]        = useState(false)
  const [greeting, setGreeting]      = useState('')

  // Search state
  const [searchQuery, setSearchQuery]       = useState('')
  const [searchResults, setSearchResults]   = useState([])
  const [searchLoading, setSearchLoading]   = useState(false)
  const [showSearchDrop, setShowSearchDrop] = useState(false)
  const searchContainerRef = useRef(null)
  const searchDebounceRef  = useRef(null)

  const [processingJob, setProcessingJob] = useState(null)

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING')
  }, [])

  // Debounced search
  useEffect(() => {
    if (!user) return
    clearTimeout(searchDebounceRef.current)
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); setShowSearchDrop(false); return }
    setSearchLoading(true); setShowSearchDrop(true)
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}&user_id=${user.id}`)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch { setSearchResults([]) }
      finally { setSearchLoading(false) }
    }, 300)
    return () => clearTimeout(searchDebounceRef.current)
  }, [searchQuery, user])

  // Click-outside to dismiss search dropdown
  useEffect(() => {
    const handler = e => { if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowSearchDrop(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load workspaces
  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('workspaces').select('*').eq('owner_id', user.id).order('last_opened_at', { ascending: false, nullsFirst: false })
      setWorkspaces(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  // Poll processing status if redirected from workspace creation
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const processingWsId = params.get('processing')
    if (!processingWsId || !user) return
    const findAndPoll = async () => {
      const { data: job } = await supabase.from('processing_jobs').select('*').eq('workspace_id', processingWsId).eq('owner_id', user.id).order('created_at', { ascending: false }).limit(1).single()
      if (!job) return
      setProcessingJob(job)
      if (job.status === 'running' || job.status === 'pending') {
        const poll = setInterval(async () => {
          const statusRes  = await fetch(`/api/process/status?job_id=${job.id}&user_id=${user.id}`)
          const statusData = await statusRes.json()
          setProcessingJob(prev => ({ ...prev, ...statusData }))
          if (statusData.status === 'done' || statusData.status === 'error') {
            clearInterval(poll)
            const { data } = await supabase.from('workspaces').select('*').eq('owner_id', user.id).order('last_opened_at', { ascending: false, nullsFirst: false })
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

  const handleDelete = async (workspaceId) => {
    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId))
    try {
      await fetch(`/api/workspace/${workspaceId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) })
    } catch (err) {
      console.error('Delete failed', err)
      const { data } = await supabase.from('workspaces').select('*').eq('owner_id', user.id).order('last_opened_at', { ascending: false, nullsFirst: false })
      setWorkspaces(data || [])
    }
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.replace('/login') }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#060810', fontFamily: 'var(--font-mono)', position: 'relative' }}>

      <style>{`
        @keyframes db-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
        @keyframes db-fade-in  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
        .db-card-enter { animation: db-fade-in 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <AmbientBackground />

      {/* ── Top bar ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 64,
        background: 'rgba(6,8,18,0.52)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 140 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(37,88,184,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(61,123,212,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 17, color: '#c8e4ff', boxShadow: '0 0 14px rgba(61,123,212,0.35)' }}>N</div>
          <span style={{ fontSize: 13, letterSpacing: 3, color: 'rgba(240,244,255,0.85)', fontWeight: 600 }}>NEPTUNE</span>
        </div>

        {/* Search — center */}
        <div ref={searchContainerRef} style={{ position: 'relative', width: 340 }}>
          <input
            type="text"
            placeholder="SEARCH ENTITIES..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.length >= 2) setShowSearchDrop(true) }}
            onKeyDown={e => { if (e.key === 'Escape') { setShowSearchDrop(false); setSearchQuery('') } }}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#c8e4ff', fontSize: 11, letterSpacing: 2,
              padding: '8px 14px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(61,123,212,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          />
          {/* Search dropdown */}
          {showSearchDrop && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 100, background: 'rgba(8,12,28,0.94)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', maxHeight: 320, overflowY: 'auto' }}>
              {searchLoading ? (
                <div style={{ padding: '14px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#3d7bd4', animation: `pulse-dot 0.8s ${i*0.15}s infinite` }} />)}
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '14px 16px', fontSize: 10, letterSpacing: 2, color: 'rgba(200,220,255,0.3)' }}>NO ENTITIES FOUND</div>
              ) : (
                searchResults.map((r, i) => <SearchResultRow key={`${r.workspaceId}-${r.entityId}-${i}`} result={r} />)
              )}
            </div>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 140, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, color: 'rgba(200,220,255,0.4)' }}>{user?.email}</span>
          <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(200,220,255,0.6)', fontSize: 12, letterSpacing: 1, padding: '6px 14px', fontFamily: 'var(--font-mono)', transition: 'all 0.15s', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c94040'; e.currentTarget.style.borderColor = 'rgba(201,64,64,0.4)'; e.currentTarget.style.background = 'rgba(201,64,64,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,220,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >Sign Out</button>
        </div>
      </div>

      {/* ── Processing banner ── */}
      {processingJob && processingJob.status !== 'done' && (
        <div style={{ position: 'relative', zIndex: 9, padding: '10px 32px', background: processingJob.status === 'error' ? 'rgba(201,64,64,0.08)' : 'rgba(37,88,184,0.08)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${processingJob.status === 'error' ? 'rgba(201,64,64,0.2)' : 'rgba(61,123,212,0.15)'}`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${processingJob.progress || 0}%`, background: processingJob.status === 'error' ? '#c94040' : 'linear-gradient(90deg,#3d7bd4,#7050b8)', transition: 'width 0.6s ease', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 12, color: processingJob.status === 'error' ? '#c94040' : 'rgba(200,220,255,0.6)', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
            {processingJob.status === 'error' ? `⚠ Processing failed — ${processingJob.error_message}` : `⟳ ${processingJob.current_step || 'Processing...'} (${processingJob.progress || 0}%)`}
          </span>
        </div>
      )}
      {processingJob?.status === 'done' && (
        <div style={{ position: 'relative', zIndex: 9, padding: '10px 32px', background: 'rgba(42,158,88,0.07)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(42,158,88,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#2a9e58', letterSpacing: 0.5 }}>✓ Workspace processed — knowledge graph is ready</span>
          <button onClick={() => setProcessingJob(null)} style={{ background: 'none', border: 'none', color: 'rgba(200,220,255,0.4)', fontSize: 16, cursor: 'pointer', padding: 0 }}>×</button>
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ position: 'relative', zIndex: 5, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', padding: '52px 64px 32px', overflow: 'hidden' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 13, letterSpacing: 3, color: 'rgba(200,220,255,0.4)', marginBottom: 8 }}>{greeting}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 6, color: '#f0f4ff', lineHeight: 1, textShadow: '0 0 60px rgba(61,123,212,0.3)' }}>
            {firstName.toUpperCase()}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#3d7bd4', animation: `pulse-dot 0.8s ${i*0.15}s infinite` }} />)}
          </div>
        ) : (
          <>
            {/* Section label */}
            <div style={{ fontSize: 12, letterSpacing: 2, color: 'rgba(200,220,255,0.35)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              RECENT WORKSPACES
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)', maxWidth: 300 }} />
            </div>

            {/* Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((workspaces.length === 0 ? 1 : recentTwo.length) + (hasMany ? 0 : 1), 3)}, minmax(0, 320px))`, gap: 16, maxWidth: 1000 }}>
              {recentTwo.map(ws => <WorkspaceCard key={ws.id} workspace={ws} size="large" onDelete={handleDelete} />)}
              {!hasMany && <CreateWorkspaceButton onClick={() => window.location.href = '/dashboard/new'} size="large" />}
            </div>

            {/* View all */}
            {hasMany && (
              <button
                onClick={() => setShowAll(true)}
                style={{ marginTop: 20, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(200,220,255,0.55)', fontSize: 13, letterSpacing: 2, padding: '10px 24px', fontFamily: 'var(--font-mono)', transition: 'all 0.2s', alignSelf: 'flex-start', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#c8e4ff'; e.currentTarget.style.borderColor = 'rgba(61,123,212,0.4)'; e.currentTarget.style.background = 'rgba(61,123,212,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,220,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              >
                VIEW ALL {workspaces.length} WORKSPACES →
              </button>
            )}
          </>
        )}

        {/* Preview link — bottom */}
        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(200,220,255,0.25)' }}>PREVIEW</span>
            <Link
              href="/preview"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: 'rgba(200,220,255,0.5)', fontSize: 13, letterSpacing: 1, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#a8d0f5'; e.currentTarget.style.borderColor = 'rgba(61,123,212,0.4)'; e.currentTarget.style.background = 'rgba(61,123,212,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,220,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              ⬡ Neptune Preview Workspace
            </Link>
            <span style={{ fontSize: 11, color: 'rgba(200,220,255,0.25)' }}>No login required</span>
          </div>
        </div>
      </div>

      {showAll && (
        <AllWorkspacesModal
          workspaces={workspaces}
          onClose={() => setShowAll(false)}
          onCreateNew={() => { setShowAll(false); window.location.href = '/dashboard/new' }}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

export default withAuth(DashboardHome)
