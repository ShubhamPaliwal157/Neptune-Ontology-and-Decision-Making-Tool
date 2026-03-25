'use client'
import { useState, useEffect, useRef } from 'react'
import { queryGroq } from '@/lib/groq'
import { getConnectedNodes, getDomainColor, formatRelationship } from '@/lib/graphUtils'

// Glassmorphic sub-card styling for content blocks
const glassCardStyle = {
  background: 'linear-gradient(135deg, rgba(11, 18, 40, 0.6) 0%, rgba(8, 13, 31, 0.7) 100%)',
  border: '1px solid rgba(61, 123, 212, 0.15)',
  borderRadius: '14px',
  padding: '12px',
  marginBottom: '10px',
  backgroundImage: 'linear-gradient(135deg, rgba(61, 123, 212, 0.06) 0%, transparent 60%)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
}

const glassCardTitleStyle = {
  fontSize: 9,
  letterSpacing: 1.5,
  color: 'var(--text-dim)',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const COUNTRY_CODES = {
  'India': 'in', 'China': 'cn', 'United States': 'us', 'USA': 'us',
  'Russia': 'ru', 'Pakistan': 'pk', 'United Kingdom': 'gb', 'France': 'fr',
  'Germany': 'de', 'Japan': 'jp', 'South Korea': 'kr', 'Iran': 'ir',
  'Saudi Arabia': 'sa', 'UAE': 'ae', 'Israel': 'il', 'Turkey': 'tr',
  'Brazil': 'br', 'Malaysia': 'my', 'Vietnam': 'vn', 'Thailand': 'th',
  'Bangladesh': 'bd', 'Libya': 'ly', 'Niger': 'ne', 'Moldova': 'md',
  'Estonia': 'ee', 'Afghanistan': 'af', 'Honduras': 'hn',
}

function EntityAvatar({ label, color }) {
  const code = COUNTRY_CODES[label]
  const initials = label.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: 36, height: 36, flexShrink: 0, position: 'relative' }}>
      {code ? (
        <img
          src={`https://flagcdn.com/w40/${code}.png`}
          alt={label}
          style={{
            width: 36, height: 36, objectFit: 'cover',
            borderRadius: 4, border: `1px solid ${color}44`,
            filter: 'brightness(0.85) saturate(0.9)'
          }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
        />
      ) : null}
      <div style={{
        width: 36, height: 36, borderRadius: 4,
        background: `${color}22`, border: `1px solid ${color}44`,
        display: code ? 'none' : 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, color, letterSpacing: 1
      }}>{initials}</div>
    </div>
  )
}

export default function NodePanel({ selectedNode, setSelectedNode, graphData, graphContext, setGraphData }) {
  const [edges, setEdges]           = useState([])
  const [nodes, setNodes]           = useState([])
  const [connected, setConnected]   = useState([])
  const [query, setQuery]           = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [loading, setLoading]       = useState(false)
  const [tab, setTab]               = useState('overview')
  const [showAddEntity, setShowAddEntity] = useState(false)
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityDomain, setNewEntityDomain] = useState('geopolitics')
  const [newRelationship, setNewRelationship] = useState('')
  const inputRef = useRef(null)

  // Workspace-aware description — generated once per node, cached by node id
  const [nodeDesc, setNodeDesc]         = useState('')
  const [nodeDescLoading, setNodeDescLoading] = useState(false)
  const descCacheRef = useRef({})

  useEffect(() => {
    if (graphData) {
      setNodes(graphData.nodes || [])
      setEdges(graphData.edges || [])
      return
    }
    Promise.all([
      fetch('/data/nodes.json').then(r => r.json()),
      fetch('/data/edges.json').then(r => r.json()),
    ]).then(([n, e]) => { setNodes(n); setEdges(e) })
  }, [graphData])

  // Reset on node change
  useEffect(() => {
    if (!selectedNode) return
    setConnected(getConnectedNodes(selectedNode.id, edges, nodes))
    setAiResponse('')
    setTab('overview')
    setNodeDesc('')
    // Start loading immediately — we know a description will be generated
    setNodeDescLoading(true)
  }, [selectedNode])

  // Update connected nodes when edges/nodes data loads
  useEffect(() => {
    if (!selectedNode || !nodes.length) return
    setConnected(getConnectedNodes(selectedNode.id, edges, nodes))
  }, [edges, nodes])
  useEffect(() => {
    // Wait for a real workspace name — not the generic fallback
    if (!selectedNode || !graphContext?.workspaceName || graphContext.workspaceName === 'Intelligence Workspace') return

    const cacheKey = `${selectedNode.id}__${graphContext.workspaceName}`
    if (descCacheRef.current[cacheKey]) {
      setNodeDesc(descCacheRef.current[cacheKey])
      return
    }

    setNodeDescLoading(true)
    setNodeDesc('')

    const connectedNames = getConnectedNodes(selectedNode.id, edges, nodes)
      .slice(0, 6)
      .map(c => c.node.label)
      .join(', ')

    const domains = (graphContext.domains || []).join(', ') || 'general'
    const prompt = `In 2-3 sentences, describe "${selectedNode.label}" specifically in the context of the "${graphContext.workspaceName}" workspace (domains: ${domains}). Focus only on its role and significance within these domains — do NOT give a generic description. ${connectedNames ? `It is connected to: ${connectedNames}.` : ''} Be concise and intelligence-focused.`

    fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        graphContext,
        systemOverride: `You are a strategic intelligence analyst. Describe an entity strictly in the context of the given workspace topic and domains. Never give a generic geographic or encyclopedic description. Always tie the description to the workspace subject matter. 2-3 sentences max.`,
      }),
    })
      .then(r => r.json())
      .then(data => {
        const desc = data.response || selectedNode.description || ''
        descCacheRef.current[cacheKey] = desc
        setNodeDesc(desc)
      })
      .catch(() => setNodeDesc(selectedNode.description || ''))
      .finally(() => setNodeDescLoading(false))
  }, [selectedNode, graphContext])

  const handleQuery = async () => {
    if (!query.trim()) return
    setLoading(true)
    setAiResponse('')
    setTab('ai')
    try {
      const ctx = graphContext || {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        sampleNodes: nodes.slice(0, 30).map(n => n.label),
      }
      const prompt = selectedNode
        ? `Context: Analyzing entity "${selectedNode.label}" (${selectedNode.domain}, ${selectedNode.type}). It has ${connected.length} direct connections in the knowledge graph.\n\nUser query: ${query}`
        : query
      const res = await queryGroq(prompt, ctx)
      setAiResponse(res)
    } catch (e) {
      setAiResponse('Intelligence query failed. Check API key configuration.')
    }
    setLoading(false)
  }

  // Delete entity node and all connected edges
  const handleDeleteEntity = () => {
    if (!selectedNode || !window.confirm(`Delete "${selectedNode.label}" and all its relationships?`)) return
    
    const newEdges = edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id)
    const newNodes = nodes.filter(n => n.id !== selectedNode.id)
    
    if (setGraphData) {
      setGraphData({ nodes: newNodes, edges: newEdges })
    } else {
      setEdges(newEdges)
      setNodes(newNodes)
    }
    setSelectedNode(null)
  }

  // Remove single edge (relationship) between nodes
  const handleRemoveEdge = (edgeToRemove) => {
    const newEdges = edges.filter(e => e !== edgeToRemove)
    
    if (setGraphData) {
      setGraphData({ nodes, edges: newEdges })
    } else {
      setEdges(newEdges)
    }
    setConnected(getConnectedNodes(selectedNode.id, newEdges, nodes))
  }

  // Add new entity with relationship
  const handleAddEntity = () => {
    if (!newEntityName.trim() || !newRelationship.trim()) {
      alert('Please enter entity name and relationship')
      return
    }

    // Create new node
    const newNode = {
      id: newEntityName.toUpperCase().replace(/\s+/g, '_'),
      label: newEntityName,
      domain: newEntityDomain,
      type: 'entity',
      size: 8,
      tags: [],
    }

    // Create bidirectional edge
    const newEdge = {
      source: selectedNode.id,
      target: newNode.id,
      relationship: newRelationship.toUpperCase().replace(/\s+/g, '_'),
    }

    const updatedNodes = [...nodes, newNode]
    const updatedEdges = [...edges, newEdge]

    if (setGraphData) {
      setGraphData({ nodes: updatedNodes, edges: updatedEdges })
    } else {
      setNodes(updatedNodes)
      setEdges(updatedEdges)
    }
    setConnected(getConnectedNodes(selectedNode.id, updatedEdges, updatedNodes))
    
    // Reset form
    setNewEntityName('')
    setNewRelationship('')
    setShowAddEntity(false)
  }

  const color = selectedNode ? getDomainColor(selectedNode.domain) : '#3d7bd4'

  if (!selectedNode) return (
    <div style={{
      width: 300, height: '100vh', flexShrink: 0,
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      <div style={{ fontSize: 28, opacity: 0.1, marginBottom: 12 }}>◈</div>
      <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', textAlign: 'center' }}>
        SELECT AN ENTITY<br />TO INSPECT
      </div>
      <div style={{ marginTop: 40, width: '100%' }}>
        <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 8 }}>
          AI INTELLIGENCE QUERY
        </div>
        <textarea
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery() } }}
          placeholder="Ask anything about the graph..."
          style={{
            width: '100%', height: 72, resize: 'none',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', fontSize: 10, padding: 8,
            outline: 'none', lineHeight: 1.6
          }}
        />
        <button onClick={handleQuery} disabled={loading} style={{
          width: '100%', marginTop: 6, padding: '7px',
          background: 'transparent', border: '1px solid var(--border-mid)',
          color: 'var(--neptune-light)', fontSize: 9, letterSpacing: 2,
          opacity: loading ? 0.5 : 1
        }}>
          {loading ? 'QUERYING...' : '⚡ QUERY NEPTUNE AI'}
        </button>
        {aiResponse && (
          <div style={{
            marginTop: 10, padding: 10, background: 'var(--bg-card)',
            border: '1px solid var(--border)', fontSize: 10,
            color: 'var(--text-secondary)', lineHeight: 1.7,
            maxHeight: 280, overflowY: 'auto'
          }}>{aiResponse}</div>
        )}
        {loading && (
          <div style={{ marginTop: 10, display: 'flex', gap: 4, justifyContent: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 4, height: 4, borderRadius: '50%',
                background: 'var(--neptune-mid)',
                animation: `pulse-dot 1s ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{
      width: 300, height: '100vh', flexShrink: 0,
      background: 'linear-gradient(180deg, rgba(11, 18, 40, 0.85) 0%, rgba(8, 13, 31, 0.92) 100%)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      borderLeft: '1px solid rgba(61, 123, 212, 0.15)',
      display: 'flex', flexDirection: 'column',
      animation: 'fade-in-up 0.25s ease forwards',
      overflow: 'hidden',
      backgroundImage: 'linear-gradient(135deg, rgba(61, 123, 212, 0.08) 0%, transparent 60%)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid rgba(61, 123, 212, 0.12)',
        background: 'rgba(11, 18, 40, 0.6)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: color, boxShadow: `0 0 6px ${color}`
              }} />
              <div style={{ fontSize: 8, letterSpacing: 2, color, textTransform: 'uppercase' }}>
                {selectedNode.domain} · {selectedNode.type}
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 20,
              letterSpacing: 2, color: 'var(--text-primary)', lineHeight: 1.2
            }}>
              {selectedNode.label}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 3, letterSpacing: 1 }}>
              ID: {selectedNode.id}
            </div>
          </div>
          <button onClick={() => setSelectedNode(null)} style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-dim)', fontSize: 16, padding: 4,
            lineHeight: 1
          }}>×</button>
        </div>

        {/* Tags */}
        {selectedNode.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
            {selectedNode.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{
                fontSize: 8, letterSpacing: 1, padding: '2px 6px',
                border: `1px solid ${color}44`, color, textTransform: 'uppercase'
              }}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(61, 123, 212, 0.12)',
        flexShrink: 0, background: 'rgba(11, 18, 40, 0.4)'
      }}>
        {[
          ['overview', 'OVERVIEW'],
          ['ai', 'AI ANALYSIS'],
          ['links', `LINKS (${connected.length})`],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '8px 0', background: 'transparent',
            border: 'none', borderBottom: tab === id ? `2px solid ${color}` : '2px solid transparent',
            color: tab === id ? 'var(--text-primary)' : 'var(--text-dim)',
            fontSize: 8, letterSpacing: 2, marginBottom: -1
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Description */}
            <div style={glassCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={glassCardTitleStyle}>Description</div>
                {nodeDescLoading && (
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: color, animation: `pulse-dot 0.8s ${i*0.15}s infinite` }} />
                    ))}
                  </div>
                )}
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {nodeDescLoading
                  ? <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Generating workspace-aware description...</span>
                  : nodeDesc || `${selectedNode.label} is a ${selectedNode.type} entity in the ${selectedNode.domain} domain.`
                }
              </p>
            </div>

            {/* Metadata */}
            <div style={glassCardStyle}>
              <div style={glassCardTitleStyle}>Entity Details</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Type:</span> {selectedNode.type}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-dim)' }}>Domain:</span> {selectedNode.domain}
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Connections:</span> {connected.length}
                </div>
              </div>
            </div>

            {/* Tags */}
            {selectedNode.tags?.length > 0 && (
              <div style={glassCardStyle}>
                <div style={glassCardTitleStyle}>Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedNode.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 8, letterSpacing: 1, padding: '4px 8px',
                      background: `${color}22`, border: `1px solid ${color}44`,
                      color, borderRadius: 8, textTransform: 'uppercase'
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Add Entity Section */}
            <div style={glassCardStyle}>
              <div style={glassCardTitleStyle}>Create Connection</div>
              {!showAddEntity ? (
                <button onClick={() => setShowAddEntity(true)} style={{
                  width: '100%', padding: '8px',
                  background: 'linear-gradient(135deg, rgba(61,123,212,0.25), rgba(61,123,212,0.08))',
                  border: '1px solid rgba(61,123,212,0.5)',
                  color: '#c8e4ff', fontSize: 9, letterSpacing: 1.5, borderRadius: 8,
                  transition: 'all 0.2s', cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(61,123,212,0.25)'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(61,123,212,0.35), rgba(61,123,212,0.12))'
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(61,123,212,0.4)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(61,123,212,0.25), rgba(61,123,212,0.08))'
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(61,123,212,0.25)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  ➕ ADD ENTITY
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Entity name..."
                    value={newEntityName}
                    onChange={e => setNewEntityName(e.target.value)}
                    style={{
                      padding: '6px 8px', fontSize: 9,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      borderRadius: 6, outline: 'none'
                    }}
                  />
                  <select
                    value={newEntityDomain}
                    onChange={e => setNewEntityDomain(e.target.value)}
                    style={{
                      padding: '6px 8px', fontSize: 9,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      borderRadius: 6, outline: 'none'
                    }}
                  >
                    <option value="geopolitics">Geopolitics</option>
                    <option value="economics">Economics</option>
                    <option value="defense">Defense</option>
                    <option value="technology">Technology</option>
                    <option value="climate">Climate</option>
                    <option value="society">Society</option>
                    <option value="organization">Organization</option>
                    <option value="person">Person</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Relationship (e.g., ALLIED_WITH)..."
                    value={newRelationship}
                    onChange={e => setNewRelationship(e.target.value)}
                    style={{
                      padding: '6px 8px', fontSize: 9,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      borderRadius: 6, outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleAddEntity} style={{
                      flex: 1, padding: '6px', fontSize: 8,
                      background: 'linear-gradient(135deg, rgba(61,123,212,0.25), rgba(61,123,212,0.08))',
                      border: '1px solid rgba(61,123,212,0.5)',
                      color: '#c8e4ff', borderRadius: 6, cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 0 12px rgba(61,123,212,0.25)'
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(61,123,212,0.35), rgba(61,123,212,0.12))'
                        e.currentTarget.style.boxShadow = '0 0 16px rgba(61,123,212,0.4)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(61,123,212,0.25), rgba(61,123,212,0.08))'
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(61,123,212,0.25)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      ✓ SAVE
                    </button>
                    <button onClick={() => setShowAddEntity(false)} style={{
                      flex: 1, padding: '6px', fontSize: 8,
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--text-dim)', borderRadius: 6, cursor: 'pointer'
                    }}>
                      ✕ CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Events */}
            <div style={glassCardStyle}>
              <div style={glassCardTitleStyle}>Recent Events</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { date: '2 days ago', title: 'Strategic Announcement', desc: 'Major policy decision announced' },
                  { date: '5 days ago', title: 'Trade Agreement', desc: 'Bilateral agreement signed with partners' },
                  { date: '1 week ago', title: 'Policy Update', desc: 'New regulatory framework issued' }
                ].map((item, i) => (
                  <div key={i} style={{
                    paddingBottom: i < 2 ? 8 : 0,
                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: 'rgba(240,244,255,0.85)', fontWeight: 500 }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: 8, color: 'rgba(240,244,255,0.5)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {item.date}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, color: 'rgba(240,244,255,0.65)', lineHeight: 1.4 }}>
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Media */}
            <div style={glassCardStyle}>
              <div style={glassCardTitleStyle}>Media</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { type: 'image', label: 'Image', icon: '🖼' },
                  { type: 'video', label: 'Video', icon: '▶' },
                  { type: 'document', label: 'Document', icon: '📄' },
                  { type: 'chart', label: 'Analytics', icon: '📊' }
                ].map((media, i) => (
                  <div key={i} style={{
                    padding: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(61,123,212,0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                  }}
                  >
                    <span style={{ fontSize: 14, opacity: 0.5 }}>{media.icon}</span>
                    <span style={{ fontSize: 8, color: 'rgba(240,244,255,0.6)', letterSpacing: 0.5 }}>
                      {media.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* External Links */}
            <div style={glassCardStyle}>
              <div style={glassCardTitleStyle}>External Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { 
                    label: 'Wikipedia', 
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(selectedNode.label.replace(/ /g, '_'))}`, 
                    icon: '🌐' 
                  },
                  { 
                    label: 'Google Search', 
                    url: `https://www.google.com/search?q=${encodeURIComponent(selectedNode.label)}`, 
                    icon: '🔍' 
                  },
                  { 
                    label: 'News Archive', 
                    url: `https://news.google.com/search?q=${encodeURIComponent(selectedNode.label)}`, 
                    icon: '📰' 
                  }
                ].map((link, i) => (
                  <a key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      // Ensure external navigation
                      e.stopPropagation()
                    }}
                    style={{
                      fontSize: 10,
                      color: '#3d7bd4',
                      textDecoration: 'none',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(61,123,212,0.05)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#c8e4ff'
                      e.currentTarget.style.background = 'rgba(61,123,212,0.12)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#3d7bd4'
                      e.currentTarget.style.background = 'rgba(61,123,212,0.05)'
                    }}
                  >
                    <span style={{ fontSize: 12, opacity: 0.55 }}>{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    <span style={{ fontSize: 8, opacity: 0.6 }}>→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI ANALYSIS TAB */}
        {tab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery() } }}
              placeholder={`Ask about ${selectedNode.label}...`}
              style={{
                width: '100%', height: 64, resize: 'none',
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 10, padding: 8,
                outline: 'none', lineHeight: 1.6, borderRadius: 8
              }}
            />
            <button onClick={handleQuery} disabled={loading} style={{
              width: '100%', padding: '8px',
              background: loading ? 'transparent' : 'linear-gradient(135deg, rgba(61,123,212,0.25), rgba(61,123,212,0.08))',
              border: `1px solid rgba(61,123,212,0.5)`,
              color: '#c8e4ff', fontSize: 9, letterSpacing: 2,
              transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
              borderRadius: 8, cursor: loading ? 'default' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 12px rgba(61,123,212,0.25)'
            }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(61,123,212,0.35), rgba(61,123,212,0.12))'
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(61,123,212,0.4)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(61,123,212,0.25), rgba(61,123,212,0.08))'
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(61,123,212,0.25)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {loading ? 'QUERYING NEPTUNE AI...' : '⚡ ANALYSE'}
            </button>

            {loading && (
              <div style={{ padding: '20px 0', display: 'flex', gap: 5, justifyContent: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: color,
                    animation: `pulse-dot 0.8s ${i * 0.15}s infinite`
                  }} />
                ))}
              </div>
            )}

            {aiResponse && !loading && (
              <div style={{
                ...glassCardStyle,
                borderLeft: `2px solid ${color}88`,
                background: `${color}08`
              }}>
                <div style={glassCardTitleStyle}>Analysis Result</div>
                <div style={{
                  fontSize: 10, color: 'var(--text-secondary)',
                  lineHeight: 1.75
                }}>
                  {aiResponse}
                </div>
              </div>
            )}

            {!aiResponse && !loading && (
              <div style={{ marginTop: 8 }}>
                <div style={glassCardTitleStyle}>Suggested Queries</div>
                {[
                  `What is ${selectedNode.label}'s strategic significance?`,
                  `Key risks involving ${selectedNode.label}?`,
                  `How does ${selectedNode.label} connect to global supply chains?`,
                ].map((q, i) => (
                  <div key={i}
                    onClick={() => { setQuery(q); setTimeout(handleQuery, 50) }}
                    style={{
                      padding: '8px', marginBottom: 6, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                      fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.5,
                      borderRadius: 8, transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = `${color}44`
                      e.currentTarget.style.background = `${color}12`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    }}
                  >{q}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LINKS TAB */}
        {tab === 'links' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {connected.length === 0 && (
              <div style={{
                ...glassCardStyle,
                textAlign: 'center',
                padding: '16px 12px'
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>
                  NO CONNECTIONS
                </div>
              </div>
            )}

            {connected.map(({ node, edge, direction }, i) => {
              const nColor = getDomainColor(node.domain)
              return (
                <div
                  key={i}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    ...glassCardStyle,
                    borderLeft: `2px solid ${nColor}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.borderColor = nColor
                    e.currentTarget.style.background = `${nColor}12`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = `${nColor}`
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 3 }}>
                      {node.label}
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4 }}>
                      {direction === 'out' ? '→' : '←'} {formatRelationship(edge.relationship)}
                    </div>
                    <span style={{
                      fontSize: 7, letterSpacing: 1, padding: '3px 6px',
                      background: `${nColor}18`, border: `1px solid ${nColor}44`,
                      color: nColor, textTransform: 'uppercase', borderRadius: 6,
                      display: 'inline-block'
                    }}>
                      {node.domain}
                    </span>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleRemoveEdge(edge)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: 14,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      transition: 'color 0.2s',
                      lineHeight: 1
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c94040'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Delete Entity Footer Button */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(61, 123, 212, 0.12)',
        flexShrink: 0,
        background: 'rgba(11, 18, 40, 0.5)'
      }}>
        <button onClick={handleDeleteEntity} style={{
          width: '100%', padding: '8px',
          background: 'linear-gradient(135deg, rgba(61,123,212,0.25), rgba(61,123,212,0.08))',
          border: '1px solid rgba(61,123,212,0.5)',
          color: '#c8e4ff', fontSize: 9, letterSpacing: 2,
          borderRadius: 8, cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 0 12px rgba(61,123,212,0.25)'
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(61,123,212,0.35), rgba(61,123,212,0.12))'
            e.currentTarget.style.boxShadow = '0 0 16px rgba(61,123,212,0.4)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(61,123,212,0.25), rgba(61,123,212,0.08))'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(61,123,212,0.25)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          🗑 DELETE ENTITY
        </button>
      </div>
    </div>
  )
}