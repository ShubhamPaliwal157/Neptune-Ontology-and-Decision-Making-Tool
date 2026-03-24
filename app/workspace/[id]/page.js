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

  const [activeView, setActiveView]         = useState('graph')
  const [selectedNode, setSelectedNode]     = useState(null)
  const [activeDecision, setActiveDecision] = useState(0)

  // Graph data loaded from the API
  const [graphData, setGraphData]   = useState(null)   // { nodes, edges }
  const [loadState, setLoadState]   = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMsg, setErrorMsg]     = useState('')

  // Workspace metadata & real feed/decisions
  const [workspace, setWorkspace]     = useState(null)
  const [feedData, setFeedData]       = useState(null)
  const [decisionsData, setDecisionsData] = useState(null)
  const [graphContext, setGraphContext] = useState(null)

  // ── Load graph + context in parallel ───────────────────────────────────────
  useEffect(() => {
    if (!id || !user) return

    async function load() {
      try {
        const [graphRes, ctxRes] = await Promise.all([
          fetch(`/api/workspace/${id}/graph${user?.id ? `?user_id=${user.id}` : ''}`),
          fetch(`/api/workspace/${id}/context`),
        ])

        if (!graphRes.ok) {
          const body = await graphRes.json()
          throw new Error(body.error || 'Failed to load graph')
        }

        const graphRaw = await graphRes.json()

        // Normalise field names: pipeline saves `name`, components expect `label`
        const nodes = (graphRaw.nodes || []).map(n => ({
          ...n,
          label: n.label || n.name,
        }))
        const edges = graphRaw.edges || []

        setGraphData({ nodes, edges })

        // Build graphContext for AI queries
        const ctx = {
          nodeCount:     nodes.length,
          edgeCount:     edges.length,
          sampleNodes:   nodes.slice(0, 30).map(n => n.label || n.name),
          workspaceName: graphRaw.workspace_name || 'Intelligence Workspace',
          domains:       graphRaw.domains || [],
        }
        setGraphContext(ctx)

        // Context (feed + decisions + workspace meta) — non-blocking
        if (ctxRes.ok) {
          const ctxData = await ctxRes.json()
          setWorkspace(ctxData.workspace || { id, name: graphRaw.workspace_name || 'Workspace' })
          setFeedData(ctxData.feed || null)
          setDecisionsData(ctxData.decisions || null)
          // Enrich graphContext with workspace metadata from context
          if (ctxData.workspace) {
            setGraphContext(prev => ({
              ...prev,
              workspaceName: ctxData.workspace.name || prev.workspaceName,
              domains:       ctxData.workspace.domains || prev.domains,
            }))
          }
        } else {
          setWorkspace({ id, name: graphRaw.workspace_name || 'Workspace' })
        }

        setLoadState('ready')
      } catch (err) {
        setErrorMsg(err.message)
        setLoadState('error')
      }
    }

    load()
  }, [id, user])

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

  // ── Main workspace UI ───────────────────────────────────────────────────────
  return (
    <main style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', position: 'relative',
      background: 'var(--bg-base)',
    }}>
      <NeptuneBackground />

      <div style={{
        display: 'flex', height: '100vh',
        position: 'relative', zIndex: 1,
      }}>
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          workspaceName={workspace?.name}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {activeView === 'graph' && (
            <>
              <FeedPanel feedData={feedData} />
              <GraphCanvas
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                graphData={graphData}
              />
              <NodePanel
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                graphData={graphData}
                graphContext={graphContext}
              />
            </>
          )}
          {activeView === 'decisions' && (
            <DecisionWorkspace
              decisionsData={decisionsData}
              graphContext={graphContext}
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

