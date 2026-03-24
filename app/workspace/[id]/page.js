'use client'
import { useState, useEffect } from 'react'
import { use } from 'react'
import { withAuth } from '@/app/dashboard/withAuth'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/ui/Sidebar'
import GraphCanvas from '@/components/graph/GraphCanvas'
import FeedPanel from '@/components/ui/FeedPanel'
import NodePanel from '@/components/graph/NodePanel'
import DecisionWorkspace from '@/components/workspace/DecisionWorkspace'
import NeptuneBackground from '@/components/ui/NeptuneBackground'

function WorkspacePage({ params }) {
  const { id } = use(params)
  const { user } = useAuth()

  const [activeView, setActiveView]     = useState('graph')
  const [selectedNode, setSelectedNode] = useState(null)
  const [activeDecision, setActiveDecision] = useState(0)

  // Graph data loaded from the API
  const [graphData, setGraphData]   = useState(null)   // { nodes, edges }
  const [loadState, setLoadState]   = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMsg, setErrorMsg]     = useState('')

  // Workspace metadata (name, domain, etc.)
  const [workspace, setWorkspace]   = useState(null)

  // ── Load workspace metadata + graph on mount ────────────────────────────────
  useEffect(() => {
    if (!id) return

    async function load() {
      try {
        // Load graph data
        const res = await fetch(`/api/workspace/${id}/graph`)
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error || 'Failed to load graph')
        }
        const data = await res.json()

        // Normalise field names: pipeline saves `name`, components expect `label`
        const nodes = (data.nodes || []).map(n => ({
          ...n,
          label: n.label || n.name,
        }))

        setGraphData({ nodes, edges: data.edges || [] })
        setWorkspace({ id, name: data.workspace_name || 'Workspace' })
        setLoadState('ready')
      } catch (err) {
        setErrorMsg(err.message)
        setLoadState('error')
      }
    }

    load()
  }, [id])

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loadState === 'loading') {
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
          LOADING INTELLIGENCE GRAPH
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#3d7bd4',
              animation: `pulse-dot 0.8s ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Error screen ────────────────────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#03050c',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', gap: 16,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 28,
          letterSpacing: 8, color: '#c94040',
        }}>NEPTUNE</div>
        <div style={{
          fontSize: 9, letterSpacing: 3, color: '#c94040',
          padding: '4px 12px', border: '1px solid rgba(200,60,60,0.3)',
        }}>
          GRAPH UNAVAILABLE
        </div>
        <p style={{ fontSize: 11, color: '#4a6b8a', maxWidth: 360, textAlign: 'center', lineHeight: 1.8 }}>
          {errorMsg || 'Could not load the workspace graph.'}
          <br />
          The workspace may still be processing — check the dashboard.
        </p>
        <a href="/dashboard" style={{
          fontSize: 10, letterSpacing: 3, color: '#3d7bd4',
          textDecoration: 'none', border: '1px solid rgba(61,123,212,0.3)',
          padding: '8px 20px', marginTop: 8,
          transition: 'all 0.2s',
        }}>← BACK TO DASHBOARD</a>
      </div>
    )
  }

  // ── Main workspace UI (mirrors app/page.js but uses real data) ──────────────
  return (
    <main style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', position: 'relative',
      background: 'var(--bg-base)',
      fontFamily: '"Sora", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <NeptuneBackground />

      <div style={{
        display: 'flex', height: '100vh',
        position: 'relative', zIndex: 1,
      }}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {activeView === 'graph' && (
            <>
              <div style={{
                width: 280, flexShrink: 0,
                background: 'rgba(4,6,14,0.6)', // match image transparency
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 2px 24px 0 rgba(8,13,31,0.08)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04), transparent 60%)',
                display: 'flex', flexDirection: 'column',
                zIndex: 2
              }}>
                <FeedPanel />
              </div>
              <GraphCanvas
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                graphData={graphData}
              />
              <div style={{
                width: 320, flexShrink: 0,
                background: 'rgba(4,6,14,0.6)', // match image transparency
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 2px 24px 0 rgba(8,13,31,0.08)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04), transparent 60%)',
                display: 'flex', flexDirection: 'column',
                zIndex: 2
              }}>
                <NodePanel
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                  graphData={graphData}
                  setGraphData={setGraphData}
                />
              </div>
            </>
          )}
          {activeView === 'decisions' && (
            <DecisionWorkspace
              activeDecision={activeDecision}
              setActiveDecision={setActiveDecision}
            />
          )}
        </div>
      </div>
    </main>
  )
}

export default withAuth(WorkspacePage)