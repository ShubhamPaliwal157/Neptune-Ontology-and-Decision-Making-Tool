'use client'
import { useEffect, useRef, useState } from 'react'
import { mergeDuplicateNodes } from '@/lib/graphUtils'

const DOMAIN_COLORS = {
  geopolitics:  '#c94040',
  economics:    '#c87c3a',
  defense:      '#b85a30',
  technology:   '#3d7bd4',
  climate:      '#2a9e58',
  society:      '#7050b8',
  organization: '#b89a30',
  person:       '#2a9e80',
}

const CLUSTER_POS = {
  geopolitics:  { cx:   0, cy:   0 },
  economics:    { cx: 280, cy: 180 },
  defense:      { cx:-280, cy:-180 },
  technology:   { cx: 280, cy:-180 },
  climate:      { cx:-280, cy: 180 },
  society:      { cx:   0, cy: 280 },
  organization: { cx:   0, cy:-280 },
  person:       { cx: 180, cy:   0 },
}

// Major nodes that should stay large
const MAJOR_NODES = new Set([
  'IND','CHN','USA','RUS','PAK','GBR','FRA','DEU','JPN','KOR',
  'NATO','UN','EU','BRICS','QUAD','SCO','G20','OPEC',
  'AI_RACE','CLIMATE_CRISIS','SEMICONDUCTORS','UKRAINE_WAR','OIL_SUPPLY',
  'NVIDIA','TSMC','ISRO','NASA','OPENAI',
])

function getNodeSize(node) {
  if (MAJOR_NODES.has(node.id)) return node.size || 12
  // 70% of nodes get reduced to 40-55% of their original size
  return Math.max(4, (node.size || 10) * 0.45)
}

export default function GraphCanvas({ selectedNode, setSelectedNode, graphData, initialEntityId }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({
    nodes: [], edges: [],
    rot: { x: 0.3, y: 0 },
    vel: { x: 0, y: 0 },
    drag: { active: false, lastX: 0, lastY: 0 },
    autoRotate: true,
    zoom: 1,
    hoveredNode: null,
    revealIndex: 0,
    visibleEdges: [],
    frame: null,
    t: 0,
    filter: null,
    stars: [],
  })
  const [filter, setFilter] = useState(null)
  const [stats, setStats]   = useState({ nodes: 0, edges: 0 })
  const [hovered, setHovered] = useState(null)
  const [nodesLoaded, setNodesLoaded] = useState(0)

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const dataPromise = graphData
      ? Promise.resolve([graphData.nodes, graphData.edges])
      : Promise.all([
          fetch('/data/nodes.json').then(r => r.json()),
          fetch('/data/edges.json').then(r => r.json()),
        ])

    dataPromise.then(([rawNodes, rawEdges]) => {
      // Apply deduplication before processing
      const deduplicated = mergeDuplicateNodes(rawNodes, rawEdges)
      
      if (deduplicated.mergeCount > 0) {
        console.log(`GraphCanvas: Merged ${deduplicated.mergeCount} duplicate entities`)
        // Update parent state with deduplicated data
        if (setGraphData) {
          setGraphData({ nodes: deduplicated.nodes, edges: deduplicated.edges })
        }
      }
      
      const nodes = deduplicated.nodes
      const edges = deduplicated.edges
      const s = stateRef.current

      // Preserve existing positions for nodes that already exist
      const existingPositions = new Map()
      if (s.nodes) {
        s.nodes.forEach(n => {
          existingPositions.set(n.id, { fx: n.fx, fy: n.fy, fz: n.fz })
        })
      }

      nodes.forEach(n => {
        const existing = existingPositions.get(n.id)
        if (existing) {
          // Keep existing position
          n.fx = existing.fx
          n.fy = existing.fy
          n.fz = existing.fz
        } else {
          // New node - initialize position near center with slight randomness
          n.fx = (Math.random() - 0.5) * 100
          n.fy = (Math.random() - 0.5) * 100
          n.fz = (Math.random() - 0.5) * 50
        }
        n.vx = 0; n.vy = 0; n.vz = 0
      })

      const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

      // Only run full layout if this is initial load or significant change
      const isInitialLoad = !s.nodes || s.nodes.length === 0
      const layoutTicks = isInitialLoad ? 120 : 30

      for (let tick = 0; tick < layoutTicks; tick++) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j]
            const dx = b.fx - a.fx, dy = b.fy - a.fy, dz = b.fz - a.fz
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1
            const force = Math.min(8000 / (dist * dist), 4)
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            const fz = (dz / dist) * force * 0.3
            a.vx -= fx; a.vy -= fy; a.vz -= fz
            b.vx += fx; b.vy += fy; b.vz += fz
          }
        }
        edges.forEach(e => {
          const a = nodeMap[e.source], b = nodeMap[e.target]
          if (!a || !b) return
          const dx = b.fx - a.fx, dy = b.fy - a.fy, dz = b.fz - a.fz
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1
          const force = dist * 0.008
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          const fz = (dz / dist) * force
          a.vx += fx; a.vy += fy; a.vz += fz
          b.vx -= fx; b.vy -= fy; b.vz -= fz
        })
        nodes.forEach(n => {
          const cluster = CLUSTER_POS[n.domain] || { cx: 0, cy: 0 }
          n.vx += (cluster.cx - n.fx) * 0.006
          n.vy += (cluster.cy - n.fy) * 0.006
          n.vx *= 0.8; n.vy *= 0.8; n.vz *= 0.8
          n.fx += n.vx; n.fy += n.vy; n.fz += n.vz
        })
      }

      s.nodes = nodes
      s.edges = edges
      s.visibleEdges = edges.slice(0, 200)
      s.revealIndex  = 200
      setStats({ nodes: nodes.length, edges: edges.length })
      setNodesLoaded(nodes.length)
    })
  }, [graphData, setGraphData])

  useEffect(() => { stateRef.current.filter = filter }, [filter])

  // Auto-select node from URL param once data is loaded
  useEffect(() => {
    if (!initialEntityId || !nodesLoaded) return
    const node = stateRef.current.nodes.find(n => n.id === initialEntityId)
    if (node) setSelectedNode(node)
  }, [initialEntityId, nodesLoaded])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Generate background stars on resize
      stateRef.current.stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 0.9 + 0.2,
        baseAlpha: Math.random() * 0.35 + 0.05,
        blinkSpeed: Math.random() * 0.012 + 0.003,
        phase: Math.random() * Math.PI * 2,
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    /**
     * project — 3D perspective projection with rotation
     * 
     * Transforms 3D graph coordinates (x, y, z) into 2D screen coordinates (sx, sy)
     * with perspective foreshortening and rotation applied.
     * 
     * @param {number} x - X coordinate in graph space
     * @param {number} y - Y coordinate in graph space
     * @param {number} z - Z coordinate in graph space
     * @param {number} rotX - Rotation angle around X axis (pitch)
     * @param {number} rotY - Rotation angle around Y axis (yaw)
     * 
     * @returns {Object} { sx, sy, scale, depth }
     *   - sx, sy: Screen coordinates
     *   - scale: Perspective scale factor (for node sizing)
     *   - depth: Z-depth after rotation (for sorting)
     */
    const project = (x, y, z, rotX, rotY) => {
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
      const y1 = y * cosX - z * sinX
      const z1 = y * sinX + z * cosX
      const x2 = x * cosY + z1 * sinY
      const z2 = -x * sinY + z1 * cosY
      const fov   = 900
      const zoom  = stateRef.current.zoom
      const scale = (fov / (fov + z2 + 300)) * zoom
      return { sx: canvas.width / 2 + x2 * scale, sy: canvas.height / 2 + y1 * scale, scale, depth: z2 }
    }

    const draw = () => {
      const s = stateRef.current
      s.t += 1

      // Inertia: apply velocity when not dragging, decay it
      if (!s.drag.active) {
        if (Math.abs(s.vel.y) > 0.0001 || Math.abs(s.vel.x) > 0.0001) {
          s.rot.y += s.vel.y
          s.rot.x = Math.max(-0.8, Math.min(0.8, s.rot.x + s.vel.x))
          s.vel.y *= 0.93
          s.vel.x *= 0.93
        } else if (s.autoRotate) {
          s.rot.y += 0.0012
        }
      }

      if (s.revealIndex < s.edges.length && s.t % 6 === 0) {
        s.revealIndex = Math.min(s.revealIndex + 4, s.edges.length)
        s.visibleEdges = s.edges.slice(0, s.revealIndex)
      }

      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // ── Deep space background ──────────────────────────────────────────────
      // Subtle radial vignette
      const vignette = ctx.createRadialGradient(W/2, H/2, H * 0.1, W/2, H/2, W * 0.75)
      vignette.addColorStop(0, 'rgba(10,16,38,0.0)')
      vignette.addColorStop(1, 'rgba(2,4,12,0.55)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, W, H)

      // Nebula blobs — very subtle
      const nebula1 = ctx.createRadialGradient(W * 0.25, H * 0.3, 0, W * 0.25, H * 0.3, W * 0.28)
      nebula1.addColorStop(0, 'rgba(37,88,184,0.04)')
      nebula1.addColorStop(1, 'rgba(37,88,184,0)')
      ctx.fillStyle = nebula1
      ctx.fillRect(0, 0, W, H)

      const nebula2 = ctx.createRadialGradient(W * 0.72, H * 0.65, 0, W * 0.72, H * 0.65, W * 0.22)
      nebula2.addColorStop(0, 'rgba(90,30,120,0.03)')
      nebula2.addColorStop(1, 'rgba(90,30,120,0)')
      ctx.fillStyle = nebula2
      ctx.fillRect(0, 0, W, H)

      // ── Background stars ───────────────────────────────────────────────────
      s.stars.forEach(star => {
        const alpha = star.baseAlpha + Math.sin(s.t * star.blinkSpeed + star.phase) * 0.12
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(168,210,255,${Math.max(0, Math.min(0.55, alpha))})`
        ctx.fill()
      })

      const { nodes, visibleEdges, rot, filter } = s
      if (!nodes.length) { s.frame = requestAnimationFrame(draw); return }

      const projected = nodes.map(n => ({
        ...n, ...project(n.fx, n.fy, n.fz, rot.x, rot.y)
      }))
      projected.sort((a, b) => a.depth - b.depth)
      const projMap = Object.fromEntries(projected.map(p => [p.id, p]))
      const activeId = selectedNode?.id

      // ── Edges ──────────────────────────────────────────────────────────────
      visibleEdges.forEach(e => {
        const a = projMap[e.source], b = projMap[e.target]
        if (!a || !b) return
        if (filter && a.domain !== filter && b.domain !== filter) return

        const isActive = activeId && (e.source === activeId || e.target === activeId)
        const color    = e.color || '#3d7bd4'

        // Draw edge with glow for active
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)

        if (isActive) {
          // Glowing active edge
          ctx.strokeStyle = color + 'bb'
          ctx.lineWidth   = 1.4
          ctx.shadowColor = color
          ctx.shadowBlur  = 8
          ctx.stroke()
          ctx.shadowBlur = 0
          // Second thinner bright line on top
          ctx.beginPath()
          ctx.moveTo(a.sx, a.sy)
          ctx.lineTo(b.sx, b.sy)
          ctx.strokeStyle = color + 'ff'
          ctx.lineWidth   = 0.5
          ctx.stroke()
        } else {
          // Regular edge — visible but not dominant
          ctx.strokeStyle = color + '55'
          ctx.lineWidth   = 0.9
          ctx.stroke()
        }
      })

      // ── Nodes ──────────────────────────────────────────────────────────────
      projected.forEach(n => {
        if (filter && n.domain !== filter) return

        const isSelected = n.id === activeId
        const isHovered  = n.id === s.hoveredNode
        const color      = DOMAIN_COLORS[n.domain] || '#3d7bd4'
        const baseSize   = getNodeSize(n) * n.scale
        const pulse      = isSelected ? Math.sin(s.t * 0.05) * 0.12 + 1 : 1
        const size       = baseSize * (isSelected ? 1.5 : isHovered ? 1.2 : 1) * pulse

        // Soft outer glow (subtle)
        const glowR = size * 2.8
        const grd   = ctx.createRadialGradient(n.sx, n.sy, size * 0.5, n.sx, n.sy, glowR)
        grd.addColorStop(0, color + '28')
        grd.addColorStop(1, color + '00')
        ctx.beginPath()
        ctx.arc(n.sx, n.sy, glowR, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Core fill
        ctx.beginPath()
        ctx.arc(n.sx, n.sy, size, 0, Math.PI * 2)
        ctx.fillStyle = color + 'b0'
        ctx.shadowColor = color
        ctx.shadowBlur  = isSelected ? 18 : isHovered ? 12 : 4
        ctx.fill()

        // Border stroke — crisp ring
        ctx.beginPath()
        ctx.arc(n.sx, n.sy, size, 0, Math.PI * 2)
        ctx.strokeStyle = isSelected
          ? color + 'ff'
          : isHovered
            ? color + 'cc'
            : color + '88'
        ctx.lineWidth = isSelected ? 1.5 : isHovered ? 1.2 : 0.8
        ctx.shadowBlur = 0
        ctx.stroke()

        // Inner highlight dot
        if (size > 4) {
          ctx.beginPath()
          ctx.arc(n.sx - size * 0.28, n.sy - size * 0.28, size * 0.22, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.14)'
          ctx.fill()
        }

        // Selection ring
        if (isSelected) {
          const ringR = size * 2.1 + Math.sin(s.t * 0.07) * 2
          ctx.beginPath()
          ctx.arc(n.sx, n.sy, ringR, 0, Math.PI * 2)
          ctx.strokeStyle = color + '44'
          ctx.lineWidth   = 1
          ctx.setLineDash([3, 5])
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Label — only show for larger/selected/hovered nodes
        const minScaleForLabel = MAJOR_NODES.has(n.id) ? 0.3 : 0.65
        const labelAlpha = isSelected || isHovered
          ? 1
          : n.scale > minScaleForLabel ? Math.min(1, (n.scale - minScaleForLabel) * 3) : 0

        if (labelAlpha > 0.08) {
          const fontSize = Math.max(8, 9 * n.scale)
          ctx.font      = `${isSelected ? 600 : 400} ${fontSize}px IBM Plex Mono`
          ctx.fillStyle = `rgba(200,221,245,${labelAlpha})`
          ctx.textAlign = 'center'
          ctx.shadowColor = 'rgba(0,0,0,0.8)'
          ctx.shadowBlur  = 3
          ctx.fillText(n.label, n.sx, n.sy + size + 11)
          ctx.shadowBlur  = 0
        }
      })

      // ── Orbiting particles on selected ────────────────────────────────────
      if (activeId) {
        const sel = projMap[activeId]
        if (sel) {
          const color = DOMAIN_COLORS[sel.domain] || '#3d7bd4'
          const r     = getNodeSize(sel) * sel.scale * 2.8 * 1.5
          for (let i = 0; i < 3; i++) {
            const angle = s.t * 0.04 + (i * Math.PI * 2) / 3
            const px = sel.sx + Math.cos(angle) * r
            const py = sel.sy + Math.sin(angle) * r * 0.5
            ctx.beginPath()
            ctx.arc(px, py, 2, 0, Math.PI * 2)
            ctx.fillStyle   = color
            ctx.shadowColor = color
            ctx.shadowBlur  = 8
            ctx.fill()
            ctx.shadowBlur  = 0
          }
        }
      }

      s.frame = requestAnimationFrame(draw)
    }

    stateRef.current.frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(stateRef.current.frame)
      window.removeEventListener('resize', resize)
    }
  }, [selectedNode])

  // ── Mouse handlers ─────────────────────────────────────────────────────────
  const getHit = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const mx     = (e.clientX - rect.left) * (canvas.width  / rect.width)
    const my     = (e.clientY - rect.top)  * (canvas.height / rect.height)
    const s      = stateRef.current
    const { rot, zoom } = s

    let hit = null, best = Infinity
    s.nodes.forEach(n => {
      const cosX = Math.cos(rot.x), sinX = Math.sin(rot.x)
      const cosY = Math.cos(rot.y), sinY = Math.sin(rot.y)
      const y1 = n.fy * cosX - n.fz * sinX
      const z1 = n.fy * sinX + n.fz * cosX
      const x2 = n.fx * cosY + z1 * sinY
      const z2 = -n.fx * sinY + z1 * cosY
      const scale = (900 / (900 + z2 + 300)) * zoom
      const sx    = canvas.width  / 2 + x2 * scale
      const sy    = canvas.height / 2 + y1 * scale
      const size  = getNodeSize(n) * scale
      const dist  = Math.hypot(mx - sx, my - sy)
      if (dist < size * 2.5 && dist < best) { best = dist; hit = n }
    })
    return hit
  }

  const onMouseMove = (e) => {
    const s = stateRef.current
    if (s.drag.active) {
      const dx = e.clientX - s.drag.lastX
      const dy = e.clientY - s.drag.lastY
      s.rot.y += dx * 0.004
      s.rot.x  = Math.max(-0.8, Math.min(0.8, s.rot.x + dy * 0.004))
      // Track velocity for inertia
      s.vel.y = dx * 0.004
      s.vel.x = dy * 0.004
      s.drag.lastX = e.clientX
      s.drag.lastY = e.clientY
      s.autoRotate = false
    }
    const hit = getHit(e)
    s.hoveredNode = hit?.id || null
    setHovered(hit?.label || null)
    canvasRef.current.style.cursor = hit ? 'pointer' : 'grab'
  }

  const onMouseDown  = (e) => {
    const s = stateRef.current
    s.drag = { active: true, lastX: e.clientX, lastY: e.clientY }
    s.vel  = { x: 0, y: 0 }
    s.autoRotate = false
  }
  const onMouseUp    = () => { stateRef.current.drag.active = false }
  const onMouseLeave = () => {
    stateRef.current.drag.active = false
    stateRef.current.hoveredNode = null
    setHovered(null)
  }
  const onClick = (e) => { const hit = getHit(e); if (hit) setSelectedNode(hit) }
  const onWheel = (e) => {
    e.preventDefault()
    stateRef.current.zoom = Math.max(0.3, Math.min(2.8, stateRef.current.zoom - e.deltaY * 0.001))
  }

  return (
    <div style={{ flex: 1, position: 'relative', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(4,6,14,0.6)', backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-secondary)' }}>◈ KNOWLEDGE GRAPH</span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{stats.nodes} ENTITIES · {stats.edges} RELATIONSHIPS</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['↻ AUTO', () => { stateRef.current.autoRotate = !stateRef.current.autoRotate }],
            ['⊙ RESET', () => { stateRef.current.zoom = 1; stateRef.current.rot = { x: 0.3, y: 0 } }]
          ].map(([label, fn]) => (
            <button key={label} onClick={fn} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', padding: '3px 10px',
              fontSize: 9, letterSpacing: 1, transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Domain filters */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%',
        transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: 5,
        background: 'rgba(4,6,14,0.75)', backdropFilter: 'blur(8px)',
        padding: '7px 12px', border: '1px solid var(--border)'
      }}>
        <button onClick={() => setFilter(null)} style={{
          background: !filter ? 'rgba(61,123,212,0.12)' : 'transparent',
          border: `1px solid ${!filter ? 'rgba(61,123,212,0.35)' : 'var(--border)'}`,
          color: !filter ? 'var(--neptune-light)' : 'var(--text-dim)',
          padding: '3px 10px', fontSize: 9, letterSpacing: 1
        }}>ALL</button>
        {Object.entries(DOMAIN_COLORS).map(([domain, color]) => (
          <button key={domain} onClick={() => setFilter(filter === domain ? null : domain)} style={{
            background: filter === domain ? color + '18' : 'transparent',
            border: `1px solid ${filter === domain ? color + '55' : 'var(--border)'}`,
            color: filter === domain ? color : 'var(--text-dim)',
            padding: '3px 10px', fontSize: 9, letterSpacing: 1,
          }}>{domain.slice(0, 3).toUpperCase()}</button>
        ))}
      </div>

      {/* Hover label */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 52, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10,
          background: 'rgba(8,13,31,0.92)', border: '1px solid var(--border-mid)',
          padding: '4px 14px', fontSize: 10, color: 'var(--neptune-pale)',
          letterSpacing: 1, pointerEvents: 'none'
        }}>
          {hovered} — click to inspect
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        onWheel={onWheel}
      />
    </div>
  )
}