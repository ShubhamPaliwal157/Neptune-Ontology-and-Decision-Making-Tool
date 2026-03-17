'use client'
import { useState, useEffect, useRef } from 'react'
import { queryGroq } from '@/lib/groq'
import { getConnectedNodes, getDomainColor, formatRelationship } from '@/lib/graphUtils'

export default function NodePanel({ selectedNode, setSelectedNode, graphData }) {
  const [edges, setEdges]         = useState([])
  const [nodes, setNodes]         = useState([])
  const [connected, setConnected] = useState([])
  const [query, setQuery]         = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState('connections')
  const inputRef = useRef(null)

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

  useEffect(() => {
    if (!selectedNode) return
    setConnected(getConnectedNodes(selectedNode.id, edges, nodes))
    setAiResponse('')
    setTab('connections')
  }, [selectedNode, edges, nodes])

  const handleQuery = async () => {
    if (!query.trim()) return
    setLoading(true)
    setAiResponse('')
    setTab('ai')
    try {
      const ctx = {
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
      {/* AI query even without selection */}
      <div style={{ marginTop: 40, width: '100%' }}>
        <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 8 }}>AI INTELLIGENCE QUERY</div>
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
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      animation: 'fade-in-up 0.25s ease forwards',
      overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
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
        display: 'flex', borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }}>
        {[['connections', `LINKS (${connected.length})`], ['ai', 'AI ANALYSIS']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '8px 0', background: 'transparent',
            border: 'none', borderBottom: tab === id ? `2px solid ${color}` : '2px solid transparent',
            color: tab === id ? 'var(--text-primary)' : 'var(--text-dim)',
            fontSize: 8, letterSpacing: 2, marginBottom: -1
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>

        {tab === 'connections' && (
          <>
            {connected.length === 0 && (
              <div style={{ padding: 20, fontSize: 9, color: 'var(--text-dim)', textAlign: 'center' }}>
                No direct connections in graph
              </div>
            )}
            {connected.map(({ node, edge, direction }, i) => {
              const nColor = getDomainColor(node.domain)
              return (
                <div key={i}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    padding: '8px 16px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: nColor, boxShadow: `0 0 4px ${nColor}`
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 2 }}>
                      {node.label}
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1 }}>
                      {direction === 'out' ? '→' : '←'} {formatRelationship(edge.relationship)}
                    </div>
                  </div>
                  <div style={{ fontSize: 7, color: nColor, letterSpacing: 1, flexShrink: 0 }}>
                    {node.domain?.slice(0, 3).toUpperCase()}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {tab === 'ai' && (
          <div style={{ padding: '0 14px' }}>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery() } }}
              placeholder={`Ask about ${selectedNode.label}...`}
              style={{
                width: '100%', height: 64, resize: 'none', marginBottom: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 10, padding: 8,
                outline: 'none', lineHeight: 1.6, marginTop: 8
              }}
            />
            <button onClick={handleQuery} disabled={loading} style={{
              width: '100%', padding: '8px',
              background: loading ? 'transparent' : `${color}18`,
              border: `1px solid ${color}44`,
              color, fontSize: 9, letterSpacing: 2,
              transition: 'all 0.2s', opacity: loading ? 0.6 : 1
            }}>
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
                marginTop: 12, padding: 12,
                background: 'var(--bg-card)',
                border: `1px solid ${color}22`,
                borderLeft: `2px solid ${color}88`,
                fontSize: 10, color: 'var(--text-secondary)',
                lineHeight: 1.75
              }}>
                {aiResponse}
              </div>
            )}

            {/* Suggested queries */}
            {!aiResponse && !loading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 8 }}>
                  SUGGESTED
                </div>
                {[
                  `What is ${selectedNode.label}'s strategic significance?`,
                  `Key risks involving ${selectedNode.label}?`,
                  `How does ${selectedNode.label} connect to global supply chains?`,
                ].map((q, i) => (
                  <div key={i}
                    onClick={() => { setQuery(q); setTimeout(handleQuery, 50) }}
                    style={{
                      padding: '7px 10px', marginBottom: 5, cursor: 'pointer',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.5,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = `${color}44`}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >{q}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}