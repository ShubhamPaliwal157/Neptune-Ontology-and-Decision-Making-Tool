'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

/* ─────────────────────────────────────── data ─────────────────── */
const FEATURES = [
  { icon: '⬡', title: 'Knowledge Graphs',        accent: '#3d7bd4', glow: 'rgba(61,123,212,0.18)',  desc: 'Every entity, relationship and connection — rendered as a live, interactive 3D graph with domain clustering and force-directed physics. 165+ entity types, 819+ relationship patterns.' },
  { icon: '◈', title: 'Decision Intelligence',    accent: '#7050b8', glow: 'rgba(112,80,184,0.18)', desc: 'Structured evidence trails, probability-weighted scenarios, watchlists and historical precedents for every critical decision. Full audit history with source attribution.' },
  { icon: '⚡', title: 'AI Analysis',              accent: '#2a9e58', glow: 'rgba(42,158,88,0.18)',  desc: 'Ask Neptune anything about your graph. Get decision-grade intelligence grounded in your specific knowledge base — not generic answers. Powered by frontier language models.' },
  { icon: '⟳', title: 'Live Monitoring',          accent: '#c87c3a', glow: 'rgba(200,124,58,0.18)', desc: 'Continuously monitors your sources. Detects new entities, relationship shifts, and signal changes — alerts you before others notice. Configurable thresholds per domain.' },
  { icon: '◉', title: 'Collaborative Workspaces', accent: '#22d3ee', glow: 'rgba(34,211,238,0.18)', desc: 'Invite analysts, set role-based access controls, and work on the same intelligence graph simultaneously. Real-time presence indicators, shared annotations, and team decision frameworks.' },
  { icon: '⊛', title: 'Cascade Detection',        accent: '#c94040', glow: 'rgba(201,64,64,0.18)',  desc: 'When a new event enters your graph, Neptune traverses N-hop relationships to surface affected decisions, triggered watchlist indicators, and downstream geopolitical consequences.' },
]

const STATS = [
  { end: 165, suffix: '+', label: 'Entity Types'   },
  { end: 819, suffix: '+', label: 'Relationships'  },
  { end: 6,   suffix: '',  label: 'Intel Domains'  },
  { end: 60,  suffix: 's', label: 'To First Graph' },
]

const STEPS = [
  { n: '01', accent: '#3d7bd4', subtitle: 'Workspace Configuration', title: 'Define Your Scope',
    desc:   'Name your workspace and set its intelligence scope. Choose from six specialised domains — Geopolitics, Economics, Defense, Technology, Climate, and Society. Set a classification level, configure your storage backend, and link Google Drive for automatic output sync.',
    detail: 'Neptune supports multi-domain workspaces, so your analysis is never siloed. A geopolitical event automatically surfaces its economic and technological implications within the same graph.' },
  { n: '02', accent: '#7050b8', subtitle: 'Intelligent Ingestion', title: 'Add Sources',
    desc:   'Paste any combination of source URLs, RSS feeds, document uploads, or topic keywords. Neptune handles all scraping, cleaning, and text extraction — managing rate limits and format inconsistencies automatically.',
    detail: 'Raw source content is processed, structured, and immediately deleted. Only the extracted intelligence — entities, relationships, and context — is retained in your workspace.' },
  { n: '03', accent: '#2a9e58', subtitle: 'Live Intelligence Graph', title: 'Analyse & Act',
    desc:   'Your knowledge graph goes live in under 60 seconds. Explore entities and relationships in a 3D interactive canvas. Click any node to inspect connections, run AI queries, or build structured decision frameworks with evidence tracking and scenario modelling.',
    detail: 'Neptune AI is grounded in your specific graph — not generic training data. Every answer carries full citation chains back to the original source document.' },
]

const DOMAINS = [
  { label: 'GEO', color: '#c94040', name: 'Geopolitics' },
  { label: 'ECO', color: '#c87c3a', name: 'Economics'   },
  { label: 'DEF', color: '#b85a30', name: 'Defense'     },
  { label: 'TEC', color: '#3d7bd4', name: 'Technology'  },
  { label: 'CLI', color: '#2a9e58', name: 'Climate'     },
  { label: 'SOC', color: '#7050b8', name: 'Society'     },
]

const FOOTER_LINKS = {
  Product: [{ l: 'Demo Workspace', h: '/preview' }, { l: 'Sign Up', h: '/signup' }, { l: 'Sign In', h: '/login' }],
  Legal:   [{ l: 'Privacy Policy', h: '/privacy' }, { l: 'Terms of Service', h: '/terms' }, { l: 'Cookie Policy', h: '/privacy' }],
}



/* ─────────────────────────────────────── TiltCard ─────────────── */
function TiltCard({ children, style, accent = '#3d7bd4' }) {
  const ref = useRef(null), raf = useRef(null)
  const target = useRef({ rx:0, ry:0 }), current = useRef({ rx:0, ry:0 })
  const onMove = useCallback((e) => {
    const card = ref.current; if (!card) return
    const rect = card.getBoundingClientRect()
    target.current.rx = ((e.clientY - rect.top  - rect.height/2) / (rect.height/2)) * -9
    target.current.ry = ((e.clientX - rect.left - rect.width /2) / (rect.width /2)) *  9
  }, [])
  const onEnter = useCallback(() => {
    const card = ref.current; if (!card) return
    cancelAnimationFrame(raf.current)
    const loop = () => {
      current.current.rx += (target.current.rx - current.current.rx) * 0.12
      current.current.ry += (target.current.ry - current.current.ry) * 0.12
      card.style.transform  = `perspective(900px) rotateX(${current.current.rx}deg) rotateY(${current.current.ry}deg) scale(1.025)`
      card.style.boxShadow  = `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.1)`
      raf.current = requestAnimationFrame(loop)
    }
    loop()
  }, [accent])
  const onLeave = useCallback(() => {
    cancelAnimationFrame(raf.current)
    target.current = { rx:0, ry:0 }
    const card = ref.current; if (!card) return
    const reset = () => {
      current.current.rx += (0 - current.current.rx) * 0.14
      current.current.ry += (0 - current.current.ry) * 0.14
      if (Math.abs(current.current.rx) < 0.04 && Math.abs(current.current.ry) < 0.04) {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)'
        card.style.boxShadow = ''; return
      }
      card.style.transform = `perspective(900px) rotateX(${current.current.rx}deg) rotateY(${current.current.ry}deg) scale(1)`
      raf.current = requestAnimationFrame(reset)
    }
    reset()
  }, [])
  return <div ref={ref} style={{ ...style, willChange:'transform', transition:'box-shadow 0.3s ease' }} onMouseMove={onMove} onMouseEnter={onEnter} onMouseLeave={onLeave}>{children}</div>
}

/* ─────────────────────────────────────── WorkflowStep ─────────── */
function WorkflowStep({ step, index }) {
  const ref    = useRef(null)
  const isEven = index % 2 === 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('wf-step-in'); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="wf-step" style={{ display:'flex', alignItems:'center', gap:'4vw', flexDirection: isEven ? 'row' : 'row-reverse' }}>

      {/* Big number side */}
      <div className="wf-num-col" style={{ flex:'0 0 36%', display:'flex', alignItems:'center', justifyContent: isEven ? 'flex-start' : 'flex-end', position:'relative' }}>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle, ${step.accent}15 0%, transparent 70%)`, filter:'blur(40px)', pointerEvents:'none' }} />
        <div className="wf-num" style={{ fontFamily:'"Sora",sans-serif', fontSize:'clamp(110px,15vw,220px)', fontWeight:800, color:`${step.accent}14`, lineHeight:0.85, letterSpacing:'-0.05em', userSelect:'none', position:'relative', zIndex:1, transition:'color 0.4s ease' }}>
          {step.n}
        </div>
      </div>

      {/* Accent divider */}
      <div className="wf-divider" style={{ width:1, alignSelf:'stretch', minHeight:200, background:`linear-gradient(to bottom, transparent, ${step.accent}45, transparent)`, flexShrink:0 }} />

      {/* Text content */}
      <div style={{ flex:1, maxWidth:540, padding:'32px 0' }}>
        <div className="wf-label" style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:22, padding:'5px 14px', borderRadius:999, background:`${step.accent}10`, border:`1px solid ${step.accent}28` }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:step.accent, boxShadow:`0 0 8px ${step.accent}` }} />
          <span style={{ fontSize:10, letterSpacing:4, color:step.accent, textTransform:'uppercase' }}>{step.subtitle}</span>
        </div>
        <h3 className="wf-title" style={{ fontFamily:'"Sora",sans-serif', fontSize:'clamp(26px,3vw,46px)', fontWeight:700, color:'#f0f4ff', lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:18 }}>
          {step.title}
        </h3>
        <p className="wf-desc" style={{ fontSize:16, color:'rgba(240,244,255,0.62)', lineHeight:1.82, marginBottom:22 }}>
          {step.desc}
        </p>
        <div style={{ width:36, height:1, background:`${step.accent}55`, marginBottom:18 }} />
        <p className="wf-detail" style={{ fontSize:14, color:'rgba(240,244,255,0.35)', lineHeight:1.82 }}>
          {step.detail}
        </p>
      </div>

    </div>
  )
}

const glass = { background:'rgba(255,255,255,0.040)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', border:'1px solid rgba(255,255,255,0.082)' }

/* ─────────────────────────────────────── page ─────────────────── */
export default function LandingPage() {
  const [navSolid, setNavSolid] = useState(false)
  const [counts,   setCounts]   = useState(STATS.map(() => 0))

  const orbRef    = useRef(null)
  const mouseRef  = useRef({ x:600, y:400 })
  const orbPosRef = useRef({ x:600, y:400 })
  const rafRef    = useRef(null)
  const statsRef  = useRef(null)

  /* 1 — override globals.css overflow:hidden */
  useEffect(() => {
    const h = document.documentElement, b = document.body
    h.style.setProperty('overflow', 'auto', 'important')
    h.style.setProperty('height',   'auto', 'important')
    b.style.setProperty('overflow', 'auto', 'important')
    b.style.setProperty('height',   'auto', 'important')
    return () => {
      h.style.removeProperty('overflow'); h.style.removeProperty('height')
      b.style.removeProperty('overflow'); b.style.removeProperty('height')
    }
  }, [])

  /* 2 — cursor orb */
  useEffect(() => {
    const move = e => { mouseRef.current = { x:e.clientX, y:e.clientY } }
    window.addEventListener('mousemove', move, { passive:true })
    const tick = () => {
      orbPosRef.current.x += (mouseRef.current.x - orbPosRef.current.x) * 0.055
      orbPosRef.current.y += (mouseRef.current.y - orbPosRef.current.y) * 0.055
      if (orbRef.current) orbRef.current.style.transform = `translate(${orbPosRef.current.x-360}px, ${orbPosRef.current.y-360}px)`
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(rafRef.current) }
  }, [])

  /* 3 — nav solid on scroll */
  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive:true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  /* 4 — stats counter */
  useEffect(() => {
    if (!statsRef.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      STATS.forEach((stat, idx) => {
        const dur = 1500, t0 = performance.now()
        const tick = now => {
          const p    = Math.min((now - t0) / dur, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setCounts(prev => { const n = [...prev]; n[idx] = Math.round(ease * stat.end); return n })
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
    }, { threshold:0.3 })
    obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  /* 5 — generic reveal observer */
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        const delay = Number(e.target.dataset.delay || 0)
        setTimeout(() => e.target.classList.add('lp-in'), delay)
        obs.unobserve(e.target)
      })
    }, { threshold: 0, rootMargin: '0px 0px -4% 0px' })
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })

  return (
    <div style={{ width:'100%', minHeight:'100vh', background:'#060810', fontFamily:'"DM Sans",sans-serif', color:'#f0f4ff', position:'relative' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        html, body { overflow: auto !important; height: auto !important; scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; }
        ::selection { background: rgba(61,123,212,0.38); color: #f0f4ff; }

        @keyframes lp-orb-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
        @keyframes lp-ring-cw     { to { transform: rotate(360deg);  } }
        @keyframes lp-ring-ccw    { to { transform: rotate(-360deg); } }
        @keyframes lp-fade-up     { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes lp-scroll-line { 0%,100%{opacity:0.15} 50%{opacity:0.5} }
        @keyframes lp-live-dot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes lp-hero-txt    { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes lp-badge-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(42,158,88,0.4)} 60%{box-shadow:0 0 0 7px rgba(42,158,88,0)} }
        @keyframes wf-grow-line   { from{transform:scaleY(0);opacity:0} to{transform:scaleY(1);opacity:1} }

        /* ── generic reveal ── */
        [data-reveal] {
          opacity:0; transform:translateY(110px);
          transition: opacity 1.8s cubic-bezier(0.16,1,0.3,1), transform 1.8s cubic-bezier(0.16,1,0.3,1);
          transition-delay: 0.1s;
        }
        [data-reveal].lp-in { opacity:1; transform:translateY(0); }
        [data-reveal="heading"] {
          opacity:0; transform:translateY(140px);
          transition: opacity 2.2s cubic-bezier(0.16,1,0.3,1), transform 2.2s cubic-bezier(0.16,1,0.3,1);
          transition-delay: 0.05s;
        }
        [data-reveal="heading"].lp-in { opacity:1; transform:translateY(0); }
        [data-reveal="card"] {
          opacity:0; transform:translateY(100px) scale(0.95);
          transition: opacity 2.0s cubic-bezier(0.16,1,0.3,1), transform 2.0s cubic-bezier(0.22,1.1,0.36,1);
        }
        [data-reveal="card"].lp-in { opacity:1; transform:translateY(0) scale(1); }
        [data-reveal="label"] {
          opacity:0; transform:translateX(-72px);
          transition: opacity 1.6s cubic-bezier(0.16,1,0.3,1), transform 1.6s cubic-bezier(0.16,1,0.3,1);
        }
        [data-reveal="label"].lp-in { opacity:1; transform:translateX(0); }
        [data-reveal="stat"] {
          opacity:0; transform:translateY(70px);
          transition: opacity 1.5s cubic-bezier(0.16,1,0.3,1), transform 1.5s cubic-bezier(0.34,1.4,0.64,1);
        }
        [data-reveal="stat"].lp-in { opacity:1; transform:translateY(0); }

        /* ── workflow step reveal — whole block slides up ── */
        .wf-step {
          opacity: 0;
          transform: translateY(140px);
          transition:
            opacity   1.8s cubic-bezier(0.16, 1, 0.3, 1),
            transform 1.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .wf-step.wf-step-in { opacity:1; transform:translateY(0); }

        /* stagger children once step is in */
        .wf-step .wf-label,
        .wf-step .wf-title,
        .wf-step .wf-desc,
        .wf-step .wf-detail  { opacity:0; transform:translateY(40px); transition: opacity 0.01s, transform 0.01s; }

        .wf-step.wf-step-in .wf-label  { animation: lp-fade-up 0.9s  cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .wf-step.wf-step-in .wf-title  { animation: lp-fade-up 1.0s  cubic-bezier(0.16,1,0.3,1) 0.38s both; }
        .wf-step.wf-step-in .wf-desc   { animation: lp-fade-up 1.0s  cubic-bezier(0.16,1,0.3,1) 0.56s both; }
        .wf-step.wf-step-in .wf-detail { animation: lp-fade-up 1.0s  cubic-bezier(0.16,1,0.3,1) 0.72s both; }
        .wf-step.wf-step-in .wf-num    { animation: lp-fade-up 1.2s  cubic-bezier(0.16,1,0.3,1) 0.08s both; }
        .wf-step.wf-step-in .wf-divider {
          transform-origin: top center;
          animation: wf-grow-line 1.4s cubic-bezier(0.16,1,0.3,1) 0.28s both;
        }

        /* ── buttons ── */
        .lp-btn-pri { display:inline-flex;align-items:center;gap:8px;padding:13px 28px;font-family:"DM Sans",sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;color:#c8e4ff;text-decoration:none;background:rgba(61,123,212,0.18);border:1px solid rgba(61,123,212,0.52);border-radius:6px;position:relative;overflow:hidden;transition:background .25s,border-color .25s,transform .2s,box-shadow .25s; }
        .lp-btn-pri::after { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.09) 0%,transparent 55%);pointer-events:none;border-radius:6px; }
        .lp-btn-pri:hover { background:rgba(61,123,212,0.30);border-color:rgba(61,123,212,0.9);transform:translateY(-2px);box-shadow:0 14px 40px rgba(61,123,212,0.30); }
        .lp-btn-sec { display:inline-flex;align-items:center;gap:8px;padding:13px 28px;font-family:"DM Sans",sans-serif;font-size:13px;letter-spacing:2px;color:rgba(240,244,255,0.58);text-decoration:none;background:transparent;border:1px solid rgba(255,255,255,0.1);border-radius:6px;transition:all .25s; }
        .lp-btn-sec:hover { border-color:rgba(255,255,255,0.26);color:#f0f4ff;background:rgba(255,255,255,0.04);transform:translateY(-2px); }

        /* ── nav ── */
        .lp-nav-btn  { font-size:13px;font-weight:500;color:rgba(240,244,255,0.55);background:none;border:none;font-family:"DM Sans",sans-serif;cursor:pointer;padding:6px 2px;transition:color .2s; }
        .lp-nav-btn:hover  { color:#f0f4ff; }
        .lp-nav-link { font-size:13px;font-weight:500;color:rgba(240,244,255,0.55);text-decoration:none;padding:6px 2px;transition:color .2s; }
        .lp-nav-link:hover { color:#f0f4ff; }

        /* ── feature cards ── */
        .feat-icon { width:54px;height:54px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:22px;transition:transform .35s cubic-bezier(0.34,1.56,0.64,1),box-shadow .25s; }
        .feat-card:hover .feat-icon { transform:scale(1.14) translateY(-3px); }
        .feat-card { padding:32px 28px;border-radius:16px;position:relative;overflow:hidden;cursor:default;height:100%; }
        .feat-card::before { content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,0.055) 0%,transparent 55%);pointer-events:none; }
        .feat-bar { position:absolute;bottom:0;left:0;right:0;height:2px;border-radius:0 0 16px 16px; }

        /* ── stats ── */
        .stat-cell { padding:40px 24px;text-align:center;cursor:default;transition:transform .25s cubic-bezier(.34,1.56,.64,1); }
        .stat-cell:hover { transform:translateY(-5px); }
        .stat-cell:hover .stat-num { text-shadow:0 0 40px rgba(61,123,212,0.6); }
        .stat-num { transition:text-shadow .3s ease; }

        /* ── domains ── */
        .domain-tile { padding:20px 22px;border-radius:12px;flex:1;min-width:130px;cursor:default;position:relative;overflow:hidden; }
        .domain-tile::before { content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,0.048) 0%,transparent 52%);pointer-events:none; }

        /* ── footer ── */
        .footer-link { font-size:13px;color:rgba(240,244,255,0.32);text-decoration:none;transition:color .2s; }
        .footer-link:hover { color:rgba(240,244,255,0.78); }

        /* ── workflow ── */
        .wf-section-inner { padding:0 5vw; max-width:1240px; margin:0 auto; }
        .wf-connector { width:1px; height:72px; margin:0 auto; background:linear-gradient(to bottom,rgba(255,255,255,0.04),rgba(255,255,255,0.1),rgba(255,255,255,0.04)); }

        /* ══════════════════════ RESPONSIVE ══════════════════════════ */

        @media (max-width: 960px) {
          .hero-row   { flex-direction:column !important; text-align:center !important; align-items:center !important; }
          .hero-ctas, .hero-pills { justify-content:center !important; }
          .hero-orbit { display:none !important; }
          .feat-grid  { grid-template-columns:1fr 1fr !important; }
          .stats-grid { grid-template-columns:1fr 1fr !important; }
          .dom-row    { flex-wrap:wrap !important; }
          .wf-step    { flex-direction:column !important; gap:20px !important; }
          .wf-num-col { flex:unset !important; justify-content:flex-start !important; }
          .wf-divider { display:none !important; }
          .footer-grid { grid-template-columns:1fr 1fr !important; gap:32px !important; }
          .footer-brand { grid-column:1/-1 !important; }
          section, .features-section, .domains-section { padding-left:32px !important; padding-right:32px !important; }
          .wf-section-inner { padding:0 32px !important; }
        }

        @media (max-width: 640px) {
          nav { padding:0 20px !important; height:56px !important; }
          .nav-links { display:none !important; }
          .hero-section { padding:72px 20px 60px !important; min-height:auto !important; }
          .feat-grid  { grid-template-columns:1fr !important; }
          .stats-grid { grid-template-columns:1fr 1fr !important; }
          .stat-cell  { padding:24px 16px !important; }
          .stat-num   { font-size:40px !important; }
          .features-section { padding:60px 20px !important; }
          .wf-section { padding:60px 0 80px !important; }
          .wf-section-inner { padding:0 20px !important; }
          .wf-num     { font-size:80px !important; }
          .feat-card  { padding:24px 18px !important; }
          .domains-section { padding:60px 20px !important; }
          .cta-section     { padding:0 20px 60px !important; }
          .cta-inner       { padding:48px 24px !important; border-radius:16px !important; }
          .footer-section  { padding:40px 20px 24px !important; }
          .footer-grid     { grid-template-columns:1fr !important; gap:28px !important; }
          .lp-btn-pri, .lp-btn-sec { padding:11px 18px !important; font-size:11px !important; }
          .dom-row    { gap:8px !important; }
          .domain-tile { min-width:calc(50% - 4px) !important; }
        }

        @media (max-width: 400px) {
          .stats-grid { grid-template-columns:1fr !important; }
          .stat-cell  { border-right:none !important; border-bottom:1px solid rgba(255,255,255,0.055) !important; }
        }
      `}</style>

      {/* cursor orb */}
      <div ref={orbRef} style={{ position:'fixed',top:0,left:0,width:720,height:720,borderRadius:'50%',background:'radial-gradient(circle,rgba(61,123,212,0.38) 0%,rgba(112,80,184,0.22) 28%,rgba(61,123,212,0.10) 52%,transparent 70%)',filter:'blur(38px)',pointerEvents:'none',zIndex:2,willChange:'transform',mixBlendMode:'screen' }}/>
      <div style={{ position:'fixed',top:-180,right:-180,width:680,height:680,borderRadius:'50%',background:'radial-gradient(circle,rgba(112,80,184,0.11) 0%,transparent 70%)',filter:'blur(90px)',pointerEvents:'none',zIndex:0,animation:'lp-orb-breathe 9s ease-in-out infinite' }}/>
      <div style={{ position:'fixed',bottom:-280,left:-160,width:760,height:760,borderRadius:'50%',background:'radial-gradient(circle,rgba(42,158,88,0.06) 0%,transparent 70%)',filter:'blur(100px)',pointerEvents:'none',zIndex:0,animation:'lp-orb-breathe 13s ease-in-out 3s infinite' }}/>
      <div style={{ position:'fixed',inset:0,zIndex:0,pointerEvents:'none',backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.02) 1px,transparent 1px)',backgroundSize:'28px 28px' }}/>
      <div style={{ position:'fixed',inset:0,zIndex:0,pointerEvents:'none' }}>
        <video autoPlay loop muted playsInline style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.28 }}>
          <source src="/videos/neptune-bg.mp4" type="video/mp4" />
        </video>
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(4,6,16,.68) 0%,rgba(4,6,16,.18) 35%,rgba(4,6,16,.78) 75%,#060810 100%)' }} />
      </div>

      {/* ══ NAV ══════════════════════════════════════════════════════════ */}
      <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 48px',height:64,background:navSolid?'rgba(6,8,18,0.52)':'transparent',backdropFilter:navSolid?'blur(24px) saturate(160%)':'none',WebkitBackdropFilter:navSolid?'blur(24px) saturate(160%)':'none',borderBottom:navSolid?'1px solid rgba(255,255,255,0.07)':'1px solid transparent',transition:'all 0.4s ease' }}>
        <div style={{ display:'flex',alignItems:'center',gap:14 }}>
          <span style={{ fontFamily:'"Sora",sans-serif',fontSize:15,fontWeight:800,color:'#f0f4ff',letterSpacing:'0.28em',textTransform:'uppercase' }}>NEPTUNE</span>
          <span style={{ fontSize:8,letterSpacing:2,color:'rgba(240,244,255,0.28)',padding:'2px 7px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:3 }}>BETA</span>
        </div>
        <div className="nav-links" style={{ display:'flex',alignItems:'center',gap:32 }}>
          <button className="lp-nav-btn" onClick={() => scrollTo('features')}>Features</button>
          <button className="lp-nav-btn" onClick={() => scrollTo('how')}>How It Works</button>
          <Link href="/preview" className="lp-nav-link">Demo</Link>
          <div style={{ width:1,height:16,background:'rgba(255,255,255,0.09)' }}/>
          <Link href="/login" className="lp-nav-link">Sign In</Link>
          <Link href="/signup" className="lp-btn-pri" style={{ padding:'8px 20px',fontSize:12,letterSpacing:2 }}>GET ACCESS</Link>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════════ */}
      <section className="hero-section" style={{ position:'relative',zIndex:1,minHeight:'100vh',display:'flex',alignItems:'center',padding:'100px 48px 80px',maxWidth:1240,margin:'0 auto' }}>
        <div className="hero-row" style={{ display:'flex',flexDirection:'column',alignItems:'flex-start',justifyContent:'center',gap:56,width:'100%',maxWidth:720 }}>
          <div style={{ flex:1,maxWidth:720 }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:9,padding:'6px 16px',marginBottom:32,background:'rgba(42,158,88,0.1)',border:'1px solid rgba(42,158,88,0.28)',borderRadius:999,animation:'lp-fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards, lp-badge-pulse 2.8s ease-in-out 0.8s infinite' }}>
              <div style={{ width:7,height:7,borderRadius:'50%',background:'#2a9e58',boxShadow:'0 0 8px #2a9e58',animation:'lp-live-dot 1.4s ease-in-out infinite' }}/>
              <span style={{ fontSize:11,fontWeight:600,letterSpacing:3,color:'#2a9e58' }}>LIVE</span>
              <div style={{ width:1,height:12,background:'rgba(42,158,88,0.3)' }}/>
              <span style={{ fontSize:10,letterSpacing:2,color:'rgba(42,158,88,0.65)' }}>INTELLIGENCE PLATFORM</span>
            </div>
            <div style={{ fontFamily:'"Sora",sans-serif',fontSize:'clamp(64px,10vw,132px)',letterSpacing:'0.04em',lineHeight:0.9,marginBottom:18,background:'linear-gradient(130deg,#f0f4ff 0%,#c8e4ff 25%,#7aaeee 50%,#3d7bd4 70%,#c8e4ff 100%)',backgroundSize:'240% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'lp-hero-txt 7s linear infinite, lp-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>NEPTUNE</div>
            <div style={{ fontSize:12,letterSpacing:'0.42em',color:'rgba(240,244,255,0.4)',marginBottom:28,animation:'lp-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}>GLOBAL INTELLIGENCE ENGINE</div>
            <p style={{ fontSize:18,lineHeight:1.75,color:'rgba(240,244,255,0.68)',maxWidth:500,marginBottom:40,fontWeight:300,animation:'lp-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both' }}>Turn any set of sources into a live knowledge graph. Track entities, relationships, and decisions — powered by AI.</p>
            <div className="hero-ctas" style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:48,animation:'lp-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.42s both' }}>
              <Link href="/signup" className="lp-btn-pri">CREATE WORKSPACE →</Link>
              <Link href="/preview" className="lp-btn-sec">⬡ VIEW DEMO</Link>
            </div>
            <div className="hero-pills" style={{ display:'flex',gap:10,flexWrap:'wrap',animation:'lp-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.55s both' }}>
              {DOMAINS.map(d => (
                <div key={d.label} style={{ display:'inline-flex',alignItems:'center',gap:7,padding:'5px 13px',borderRadius:999,background:`${d.color}13`,border:`1px solid ${d.color}2e`,fontSize:9,letterSpacing:2,color:d.color }}>
                  <div style={{ width:5,height:5,borderRadius:'50%',background:d.color,boxShadow:`0 0 7px ${d.color}` }}/>
                  {d.label}
                </div>
              ))}
            </div>
          </div>

        </div>
        <div style={{ position:'absolute',bottom:28,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:8,letterSpacing:4,color:'rgba(240,244,255,0.2)' }}>SCROLL</span>
          <div style={{ width:1,height:36,background:'linear-gradient(to bottom,rgba(240,244,255,0.25),transparent)',animation:'lp-scroll-line 2.5s ease-in-out infinite' }}/>
        </div>
      </section>

      {/* ══ STATS ════════════════════════════════════════════════════════ */}
      <div ref={statsRef} style={{ position:'relative',zIndex:1,padding:'0 48px',maxWidth:1240,margin:'0 auto',marginBottom:32 }}>
        <div style={{ ...glass,borderRadius:20 }}>
          <div className="stats-grid" style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)' }}>
            {STATS.map((stat,i) => (
              <div key={i} data-reveal="stat" data-delay={i*90} className="stat-cell" style={{ borderRight:i<3?'1px solid rgba(255,255,255,0.055)':'none' }}>
                <div className="stat-num" style={{ fontFamily:'"Sora",sans-serif',fontSize:58,letterSpacing:2,color:'#c8e4ff',lineHeight:1,marginBottom:8 }}>{counts[i]}{stat.suffix}</div>
                <div style={{ fontSize:10,letterSpacing:3,color:'rgba(240,244,255,0.32)' }}>{stat.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FEATURES ═════════════════════════════════════════════════════ */}
      <section id="features" className="features-section" style={{ position:'relative',zIndex:1,padding:'88px 48px',maxWidth:1240,margin:'0 auto' }}>
        <div data-reveal="heading" style={{ marginBottom:64,maxWidth:540 }}>
          <div style={{ fontSize:10,letterSpacing:4,color:'#3d7bd4',marginBottom:14 }}>CAPABILITIES</div>
          <div style={{ fontFamily:'"Sora",sans-serif',fontSize:'clamp(34px,4vw,56px)',fontWeight:700,letterSpacing:'-0.02em',lineHeight:1,color:'#f0f4ff',marginBottom:16 }}>Built for Analysts</div>
          <p style={{ fontSize:15,color:'rgba(240,244,255,0.52)',lineHeight:1.8 }}>Everything you need to track complex geopolitical, economic, and strategic intelligence — in one workspace.</p>
        </div>
        <div className="feat-grid" style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16 }}>
          {FEATURES.map((f,i) => (
            <div key={i} data-reveal="card" data-delay={i*120}>
              <TiltCard accent={f.accent} style={{ ...glass,borderRadius:16,height:'100%',overflow:'hidden' }}>
                <div className="feat-card">
                  <div className="feat-icon" style={{ background:`${f.accent}18`,border:`1px solid ${f.accent}30`,boxShadow:`0 0 22px ${f.glow}` }}>
                    <span style={{ color:f.accent }}>{f.icon}</span>
                  </div>
                  <div style={{ fontFamily:'"Sora",sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.01em',color:'#f0f4ff',marginBottom:12 }}>{f.title}</div>
                  <p style={{ fontSize:13,color:'rgba(240,244,255,0.55)',lineHeight:1.82 }}>{f.desc}</p>
                  <div className="feat-bar" style={{ background:`linear-gradient(90deg,${f.accent}00,${f.accent}80,${f.accent}00)` }}/>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </section>

      {/* ══ WORKFLOW ═════════════════════════════════════════════════════ */}
      <section id="how" className="wf-section" style={{ position:'relative', zIndex:1, padding:'100px 0 120px', background:'#060810' }}>
        {/* subtle grid overlay */}
        <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.014) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)' }}/>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)' }}/>

        {/* Header */}
        <div className="wf-section-inner" style={{ marginBottom:96 }}>
          <div data-reveal="label" style={{ fontSize:10,letterSpacing:4,color:'rgba(61,123,212,0.75)',marginBottom:12 }}>WORKFLOW</div>
          <div data-reveal="heading" style={{ fontFamily:'"Sora",sans-serif',fontSize:'clamp(32px,4vw,54px)',fontWeight:700,letterSpacing:'-0.02em',color:'#f0f4ff',lineHeight:1.1,marginBottom:16 }}>
            Three Steps to Insight
          </div>
          <p data-reveal style={{ fontSize:15,color:'rgba(240,244,255,0.44)',maxWidth:440,lineHeight:1.8 }}>
            From raw sources to an actionable knowledge graph — in under a minute.
          </p>
        </div>

        {/* Steps stacked */}
        <div className="wf-section-inner" style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {STEPS.map((step, i) => (
            <div key={i}>
              <WorkflowStep step={step} index={i} />
              {i < STEPS.length - 1 && (
                <div style={{ display:'flex', justifyContent:'center', padding:'52px 0' }}>
                  <div className="wf-connector" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══ DOMAINS ══════════════════════════════════════════════════════ */}
      <section className="domains-section" style={{ position:'relative',zIndex:1,padding:'100px 48px',maxWidth:1240,margin:'0 auto' }}>
        <div data-reveal style={{ ...glass,borderRadius:22,padding:'52px 48px',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(61,123,212,0.04) 0%,transparent 60%)',pointerEvents:'none' }}/>
          <div style={{ position:'relative',zIndex:1 }}>
            <div style={{ fontSize:10,letterSpacing:4,color:'#3d7bd4',marginBottom:12 }}>COVERAGE</div>
            <div style={{ fontFamily:'"Sora",sans-serif',fontSize:'clamp(28px,3vw,46px)',fontWeight:700,letterSpacing:'-0.02em',color:'#f0f4ff',marginBottom:10 }}>Six Intelligence Domains</div>
            <p style={{ fontSize:14,color:'rgba(240,244,255,0.48)',marginBottom:40,maxWidth:480 }}>Every workspace spans up to six specialised domains. Neptune applies domain-specific entity models to each source for more precise extraction.</p>
            <div className="dom-row" style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
              {DOMAINS.map(d => (
                <TiltCard key={d.label} accent={d.color} style={{ flex:1,minWidth:130,background:`${d.color}0d`,border:`1px solid ${d.color}24`,borderRadius:12 }}>
                  <div className="domain-tile">
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                      <div style={{ width:8,height:8,borderRadius:'50%',background:d.color,boxShadow:`0 0 9px ${d.color}` }}/>
                      <span style={{ fontSize:9,letterSpacing:3,color:d.color }}>{d.label}</span>
                    </div>
                    <div style={{ fontFamily:'"Sora",sans-serif',fontSize:18,fontWeight:700,letterSpacing:'-0.01em',color:'#f0f4ff' }}>{d.name}</div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════ */}
      <section className="cta-section" style={{ position:'relative',zIndex:1,padding:'0 48px 100px',maxWidth:1240,margin:'0 auto' }}>
        <div data-reveal="card" className="cta-inner" style={{ ...glass,borderRadius:24,padding:'88px 56px',textAlign:'center',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:-80,left:'50%',marginLeft:-280,width:560,height:280,background:'radial-gradient(ellipse,rgba(61,123,212,0.16) 0%,transparent 70%)',pointerEvents:'none' }}/>
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,255,255,0.038) 0%,transparent 50%)',pointerEvents:'none',borderRadius:24 }}/>
          <div style={{ position:'relative',zIndex:1 }}>
            <div style={{ fontSize:10,letterSpacing:4,color:'#3d7bd4',marginBottom:18 }}>GET STARTED</div>
            <div style={{ fontFamily:'"Sora",sans-serif',fontSize:'clamp(44px,6.5vw,84px)',fontWeight:700,letterSpacing:'-0.02em',lineHeight:0.92,color:'#f0f4ff',marginBottom:22 }}>Ready to Begin?</div>
            <p style={{ fontSize:16,color:'rgba(240,244,255,0.52)',lineHeight:1.78,maxWidth:440,margin:'0 auto 40px' }}>Create your first workspace in minutes. Add sources. Neptune builds your knowledge graph automatically.</p>
            <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:24 }}>
              <Link href="/signup" className="lp-btn-pri" style={{ fontSize:12 }}>CREATE FREE ACCOUNT →</Link>
              <Link href="/login" className="lp-btn-sec">SIGN IN</Link>
            </div>
            <p style={{ fontSize:11,color:'rgba(240,244,255,0.22)',letterSpacing:1 }}>No credit card required · Free to start · Google Drive integration available</p>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="footer-section" style={{ position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,0.048)',background:'rgba(4,5,12,0.7)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',padding:'56px 48px 36px' }}>
        <div style={{ maxWidth:1240,margin:'0 auto' }}>
          <div className="footer-grid" style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:48,marginBottom:52 }}>
            <div className="footer-brand">
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:18 }}>
                <span style={{ fontFamily:'"Sora",sans-serif',fontSize:14,fontWeight:800,color:'rgba(240,244,255,0.55)',letterSpacing:'0.28em',textTransform:'uppercase' }}>NEPTUNE</span>
              </div>
              <p style={{ fontSize:14,color:'rgba(240,244,255,0.32)',lineHeight:1.78,marginBottom:28,maxWidth:300 }}>A geopolitical intelligence platform that turns raw sources into live knowledge graphs for analysts and decision-makers.</p>
              <div style={{ display:'flex',gap:7,flexWrap:'wrap' }}>
                {DOMAINS.map(d => <div key={d.label} style={{ padding:'3px 9px',borderRadius:3,background:`${d.color}0e`,border:`1px solid ${d.color}30`,fontSize:9,fontWeight:700,letterSpacing:'.08em',color:d.color }}>{d.label}</div>)}
              </div>
            </div>
            {Object.entries(FOOTER_LINKS).map(([heading,links]) => (
              <div key={heading}>
                <div style={{ fontFamily:'"Sora",sans-serif',fontSize:11,fontWeight:700,letterSpacing:'.15em',color:'rgba(240,244,255,0.55)',marginBottom:20,textTransform:'uppercase' }}>{heading}</div>
                <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                  {links.map(({l,h}) => <a key={l} href={h} className="footer-link">{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ height:1,background:'rgba(255,255,255,0.048)',marginBottom:28 }}/>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14 }}>
            <div style={{ fontSize:12,color:'rgba(240,244,255,0.22)' }}>© 2026 Neptune Intelligence Ltd. All rights reserved.</div>
            <div style={{ display:'flex',gap:24 }}>
              {[{l:'Privacy',h:'/privacy'},{l:'Terms',h:'/terms'},{l:'Cookies',h:'/privacy'}].map(({l,h}) => (
                <Link key={l} href={h} className="footer-link">{l}</Link>
              ))}
            </div>
            <div style={{ fontSize:11,color:'rgba(240,244,255,0.16)',letterSpacing:'.04em' }}>v1.0</div>
          </div>
        </div>
      </footer>
    </div>
  )
}