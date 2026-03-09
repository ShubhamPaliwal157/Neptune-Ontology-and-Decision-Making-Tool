'use client'
import { useState, useEffect } from 'react'
import { getDomainColor } from '@/lib/graphUtils'
import { queryGroq } from '@/lib/groq'

export default function DecisionWorkspace({ activeDecision, setActiveDecision }) {
  const [decisions, setDecisions] = useState([])
  const [selected, setSelected]   = useState(null)
  const [activeScenario, setActiveScenario] = useState(0)
  const [aiQuery, setAiQuery]     = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [loading, setLoading]     = useState(false)
  const [activeTab, setActiveTab] = useState('evidence')

  useEffect(() => {
    fetch('/data/decisions.json').then(r => r.json()).then(data => {
      setDecisions(data)
      setSelected(data[activeDecision] || data[0])
    })
  }, [])

  useEffect(() => {
    if (decisions.length) {
      setSelected(decisions[activeDecision])
      setActiveScenario(0)
      setAiResponse('')
      setActiveTab('evidence')
    }
  }, [activeDecision, decisions])

  const handleAiQuery = async () => {
    if (!aiQuery.trim() || !selected) return
    setLoading(true)
    setAiResponse('')
    try {
      const ctx = { nodeCount: 165, edgeCount: 819, sampleNodes: ['India', 'China', 'USA', 'NATO', 'BRICS'] }
      const prompt = `Decision context: "${selected.title}"\n\nSummary: ${selected.summary}\n\nUser query: ${aiQuery}`
      const res = await queryGroq(prompt, ctx)
      setAiResponse(res)
    } catch {
      setAiResponse('Analysis failed. Check API key configuration.')
    }
    setLoading(false)
  }

  if (!selected) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)' }}>LOADING...</div>
    </div>
  )

  const color       = getDomainColor(selected.domain)
  const scenario    = selected.scenarios[activeScenario]
  const riskColors  = { LOW: '#2a9e58', MEDIUM: '#b89a30', HIGH: '#c87c3a', CRITICAL: '#c94040' }
  const priColors   = { CRITICAL: '#c94040', HIGH: '#c87c3a', MEDIUM: '#b89a30', LOW: '#2a9e58' }

  return (
    <div style={{ flex: 1, display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Decision list sidebar ── */}
      <div style={{
        width: 260, flexShrink: 0,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)', flexShrink: 0
        }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-secondary)' }}>
            ◈ DECISION WORKSPACE
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 3 }}>
            {decisions.length} ACTIVE CASES
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {decisions.map((d, i) => {
            const dc = getDomainColor(d.domain)
            const isActive = i === activeDecision
            return (
              <div key={d.id}
                onClick={() => setActiveDecision(i)}
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: isActive ? `2px solid ${dc}` : '2px solid transparent',
                  background: isActive ? `${dc}08` : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{
                    fontSize: 7, letterSpacing: 1,
                    padding: '1px 5px',
                    border: `1px solid ${priColors[d.priority]}44`,
                    color: priColors[d.priority]
                  }}>{d.priority}</span>
                  <span style={{ fontSize: 7, color: 'var(--text-dim)' }}>{d.id}</span>
                </div>
                <div style={{
                  fontSize: 10, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  lineHeight: 1.5, marginBottom: 5, fontWeight: isActive ? 500 : 400
                }}>
                  {d.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 7, color: dc, letterSpacing: 1 }}>{d.domain.toUpperCase()}</span>
                  <span style={{ fontSize: 7, color: 'var(--text-dim)' }}>{d.deadline}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main decision view ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Decision header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{
                  fontSize: 7, letterSpacing: 1,
                  padding: '2px 8px',
                  border: `1px solid ${priColors[selected.priority]}44`,
                  color: priColors[selected.priority]
                }}>{selected.priority}</span>
                <span style={{ fontSize: 7, color: 'var(--text-dim)' }}>{selected.id}</span>
                <span style={{ fontSize: 7, color: 'var(--text-dim)' }}>OWNER: {selected.owner}</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 18,
                letterSpacing: 2, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 6
              }}>
                {selected.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 700 }}>
                {selected.summary}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
              <div style={{ fontSize: 7, color: 'var(--text-dim)', marginBottom: 3 }}>DEADLINE</div>
              <div style={{ fontSize: 10, color: '#c94040', letterSpacing: 1 }}>{selected.deadline}</div>
              <div style={{
                marginTop: 8, fontSize: 7, letterSpacing: 1,
                padding: '3px 8px',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)'
              }}>{selected.status}</div>
            </div>
          </div>

          {/* Active alerts */}
          {selected.alerts?.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selected.alerts.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px',
                  background: `${riskColors[a.severity]}0c`,
                  border: `1px solid ${riskColors[a.severity]}33`,
                  fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.4,
                  maxWidth: 380
                }}>
                  <span style={{ color: riskColors[a.severity], fontWeight: 700, fontSize: 7 }}>{a.severity}</span>
                  <span>{a.text}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 8, flexShrink: 0 }}>{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-panel)', flexShrink: 0
        }}>
          {[['evidence', 'EVIDENCE'], ['scenarios', 'SCENARIOS'], ['watchlist', 'WATCHLIST'], ['history', 'PRECEDENTS'], ['ai', 'AI ANALYSIS']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding: '9px 16px', background: 'transparent', border: 'none',
              borderBottom: activeTab === id ? `2px solid ${color}` : '2px solid transparent',
              color: activeTab === id ? 'var(--text-primary)' : 'var(--text-dim)',
              fontSize: 8, letterSpacing: 2, marginBottom: -1
            }}>{label}</button>
          ))}
        </div>

        {/* Tab body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── EVIDENCE ── */}
          {activeTab === 'evidence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.evidence?.map(ev => {
                const typeColors = {
                  FACT: '#3d7bd4', INTELLIGENCE: '#c87c3a', RISK: '#c94040',
                  FORECAST: '#7050b8', SIGNAL: '#2a9e58'
                }
                const tc = typeColors[ev.type] || '#3d7bd4'
                const supColors = { JOIN: '#2a9e58', RESPOND: '#2a9e58', ACCELERATE: '#2a9e58', CAUTION: '#c87c3a', WAIT: '#b89a30', NEUTRAL: '#64748b' }
                return (
                  <div key={ev.id} style={{
                    padding: 14, background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderLeft: `2px solid ${tc}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 7, letterSpacing: 1, padding: '1px 5px',
                        border: `1px solid ${tc}44`, color: tc
                      }}>{ev.type}</span>
                      <span style={{ fontSize: 7, color: 'var(--text-dim)' }}>
                        {ev.confidence}% CONFIDENCE · {ev.impact} IMPACT
                      </span>
                      <span style={{
                        marginLeft: 'auto', fontSize: 7, letterSpacing: 1,
                        color: supColors[ev.supports] || '#64748b',
                        padding: '1px 5px', border: `1px solid ${supColors[ev.supports]}44`
                      }}>→ {ev.supports}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 8 }}>
                      {ev.claim}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ev.sources?.map((src, si) => (
                        <span key={si} style={{
                          fontSize: 7, padding: '2px 6px',
                          background: src.verified ? 'rgba(42,158,88,0.08)' : 'rgba(200,124,58,0.08)',
                          border: `1px solid ${src.verified ? '#2a9e5844' : '#c87c3a44'}`,
                          color: src.verified ? '#2a9e58' : '#c87c3a'
                        }}>
                          {src.verified ? '✓' : '?'} {src.name}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 7, color: 'var(--text-dim)', marginTop: 6 }}>{ev.timestamp}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── SCENARIOS ── */}
          {activeTab === 'scenarios' && (
            <div>
              {/* Scenario selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {selected.scenarios?.map((sc, i) => (
                  <button key={sc.id} onClick={() => setActiveScenario(i)} style={{
                    flex: 1, padding: '10px 8px',
                    background: activeScenario === i ? `${sc.color}14` : 'var(--bg-card)',
                    border: `1px solid ${activeScenario === i ? sc.color + '55' : 'var(--border)'}`,
                    color: activeScenario === i ? sc.color : 'var(--text-dim)',
                    fontSize: 8, letterSpacing: 1, lineHeight: 1.5,
                    transition: 'all 0.15s', cursor: 'pointer'
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 2, marginBottom: 3 }}>
                      {sc.title}
                    </div>
                    <div style={{ fontSize: 7, opacity: 0.7 }}>{sc.subtitle}</div>
                  </button>
                ))}
              </div>

              {/* Scenario detail */}
              {scenario && (
                <div style={{ animation: 'fade-in-up 0.2s ease forwards' }}>
                  {/* Outcomes grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {scenario.outcomes?.map((out, i) => (
                      <div key={i} style={{
                        padding: 12, background: 'var(--bg-card)',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 5 }}>
                          {out.label.toUpperCase()}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-display)', fontSize: 20,
                          letterSpacing: 1, color: out.color
                        }}>
                          {out.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Risk */}
                  <div style={{
                    padding: 14, background: 'var(--bg-card)',
                    border: `1px solid ${riskColors[scenario.riskLevel]}33`,
                    borderLeft: `2px solid ${riskColors[scenario.riskLevel]}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 7, letterSpacing: 1, color: riskColors[scenario.riskLevel] }}>
                        {scenario.riskLevel} RISK
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {scenario.risk}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── WATCHLIST ── */}
          {activeTab === 'watchlist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.watchlist?.map((w, i) => (
                <div key={i} style={{
                  padding: 14, background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: 12, alignItems: 'start'
                }}>
                  <div>
                    <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4 }}>
                      INDICATOR
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-primary)', fontWeight: 500 }}>
                      {w.label}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Current: {w.current}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4 }}>
                      ESCALATION THRESHOLD
                    </div>
                    <div style={{ fontSize: 9, color: '#c87c3a', lineHeight: 1.5 }}>
                      {w.threshold}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PRECEDENTS ── */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.past_decisions?.map((pd, i) => (
                <div key={i} style={{
                  padding: 14, background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderLeft: `2px solid ${pd.color}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 8, color: pd.color, letterSpacing: 1, fontWeight: 700 }}>
                      {pd.outcome}
                    </span>
                    <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>{pd.date}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-primary)', marginBottom: 5, fontWeight: 500 }}>
                    {pd.title}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {pd.detail}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── AI ANALYSIS ── */}
          {activeTab === 'ai' && (
            <div>
              <textarea
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiQuery() } }}
                placeholder={`Ask Neptune AI about this decision...`}
                style={{
                  width: '100%', height: 72, resize: 'none',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 10, padding: 10,
                  outline: 'none', lineHeight: 1.6
                }}
              />
              <button onClick={handleAiQuery} disabled={loading} style={{
                width: '100%', marginTop: 8, padding: '10px',
                background: loading ? 'transparent' : `${color}14`,
                border: `1px solid ${color}44`,
                color, fontSize: 9, letterSpacing: 2,
                transition: 'all 0.2s', opacity: loading ? 0.6 : 1
              }}>
                {loading ? 'QUERYING NEPTUNE AI...' : '⚡ ANALYSE WITH NEPTUNE AI'}
              </button>

              {loading && (
                <div style={{ padding: '24px 0', display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: '50%', background: color,
                      animation: `pulse-dot 0.8s ${i * 0.15}s infinite`
                    }} />
                  ))}
                </div>
              )}

              {aiResponse && !loading && (
                <div style={{
                  marginTop: 14, padding: 16,
                  background: 'var(--bg-card)',
                  border: `1px solid ${color}22`,
                  borderLeft: `2px solid ${color}88`,
                  fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8
                }}>{aiResponse}</div>
              )}

              {!aiResponse && !loading && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 10 }}>
                    SUGGESTED ANALYSIS
                  </div>
                  {[
                    `What is the recommended course of action and why?`,
                    `Which scenario has the best risk-adjusted outcome?`,
                    `What key intelligence is missing from this assessment?`,
                    `What are the second-order consequences we may be missing?`,
                  ].map((q, i) => (
                    <div key={i}
                      onClick={() => { setAiQuery(q); setTimeout(handleAiQuery, 50) }}
                      style={{
                        padding: '8px 12px', marginBottom: 6, cursor: 'pointer',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5,
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
    </div>
  )
}