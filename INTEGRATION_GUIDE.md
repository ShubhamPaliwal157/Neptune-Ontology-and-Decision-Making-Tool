# Integration & Implementation Guide

## Files Modified

### 1. `/components/graph/NodePanel.js` (658 lines)
**Complete rewrite of tab system and UI**

#### What Changed:
- Tab structure: 2 tabs → 3 tabs (overview, ai, links)
- Default tab: connections → overview
- Added state: showAddEntity, newEntityName, newEntityDomain, newRelationship
- Added handlers: handleDeleteEntity, handleRemoveEdge, handleAddEntity
- Enhanced styling: glassmorphic throughout
- New components: entity creation form, delete footer button

#### Key Functions:

**handleDeleteEntity()**
```javascript
// Removes selected node and all connected edges
// Shows confirmation dialog first
// Deselects panel afterward
// Updates parent state if setGraphData available
```

**handleRemoveEdge(edge)**
```javascript
// Removes specific edge (relationship)
// Does NOT delete connected entities
// Updates connected list immediately
// Updates tab label count
```

**handleAddEntity()**
```javascript
// Creates new node with:
//   - id: name.toUpperCase().replace(/\s+/g, '_')
//   - label: newEntityName
//   - domain: selected domain
//   - type: 'entity'
//   - size: 8
//   - tags: []
//
// Creates edge connecting selectedNode to new node
// Updates parent state or local state
// Resets form
```

#### Glassmorphic Styling:
```javascript
const glassCardStyle = {
  background: 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '14px',
  padding: '12px',
  marginBottom: '10px',
}
```

---

### 2. `/app/workspace/[id]/page.js` (167 lines)
**Minimal changes to pass graph state management**

#### What Changed:
```javascript
// Before:
<NodePanel
  selectedNode={selectedNode}
  setSelectedNode={setSelectedNode}
  graphData={graphData}
/>

// After:
<NodePanel
  selectedNode={selectedNode}
  setSelectedNode={setSelectedNode}
  graphData={graphData}
  setGraphData={setGraphData}  // ← Added
/>
```

**Why:** Allows NodePanel to update the parent's graphData state, which triggers GraphCanvas to re-render with new data.

---

## How It Works Together

### Data Flow
```
WorkspacePage (parent)
├── state: graphData
├── state: setGraphData
│
└── NodePanel
    ├── receives: graphData, setGraphData
    ├── local state: nodes, edges (synced from graphData)
    │
    ├── handleAddEntity()
    │   └── calls setGraphData({ nodes, edges })
    │       └── parent updates graphData state
    │
    ├── handleRemoveEdge()
    │   └── calls setGraphData({ nodes, edges })
    │       └── parent updates graphData state
    │
    └── handleDeleteEntity()
        └── calls setGraphData({ nodes, edges })
            └── parent updates graphData state
                └── GraphCanvas detects change
                    └── Reinitializes with new data
                        └── Canvas rerenders automatically
```

### State Synchronization

**NodePanel automatically stays in sync:**
```javascript
useEffect(() => {
  if (graphData) {
    setNodes(graphData.nodes || [])
    setEdges(graphData.edges || [])
    return
  }
  // Fallback: load from static data
  Promise.all([...]).then(([n, e]) => { setNodes(n); setEdges(e) })
}, [graphData])  // ← Triggers when parent updates graphData
```

**Connected list updates:**
```javascript
useEffect(() => {
  if (!selectedNode) return
  setConnected(getConnectedNodes(selectedNode.id, edges, nodes))
  setAiResponse('')
  setTab('overview')
}, [selectedNode, edges, nodes])  // ← Updates when edges/nodes change
```

---

## Usage Examples

### Basic Setup (Workspace with Mutations)
```javascript
'use client'
import { useState } from 'react'
import NodePanel from '@/components/graph/NodePanel'
import GraphCanvas from '@/components/graph/GraphCanvas'

export default function MyWorkspace() {
  const [graphData, setGraphData] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  // Load graph data from API
  useEffect(() => {
    fetch('/api/graph').then(r => r.json()).then(setGraphData)
  }, [])

  return (
    <div style={{ display: 'flex' }}>
      <GraphCanvas
        graphData={graphData}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
      />
      <NodePanel
        graphData={graphData}
        setGraphData={setGraphData}  // ← Enables mutations
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
      />
    </div>
  )
}
```

### Demo Mode (Read-Only)
```javascript
<NodePanel
  graphData={null}  // Uses static data
  selectedNode={selectedNode}
  setSelectedNode={setSelectedNode}
  // No setGraphData → read-only mode
/>
```

---

## API Integration Points

### When Adding Entity
If you need to persist to API:

```javascript
// In handleAddEntity(), after creating the node and edge:
// Call API to save:
await fetch('/api/workspace/graph', {
  method: 'POST',
  body: JSON.stringify({
    nodes: updatedNodes,
    edges: updatedEdges,
  })
})
```

### When Removing Edge
```javascript
// In handleRemoveEdge():
await fetch('/api/workspace/graph/edge', {
  method: 'DELETE',
  body: JSON.stringify({ edge: edgeToRemove })
})
```

### When Deleting Entity
```javascript
// In handleDeleteEntity():
await fetch('/api/workspace/graph/node', {
  method: 'DELETE',
  body: JSON.stringify({ nodeId: selectedNode.id })
})
```

---

## Styling Customization

### Change Glass Blur Amount
```javascript
// In NodePanel.js, modify:
const glassCardStyle = {
  backdropFilter: 'blur(28px)',  // ← Increase for more blur
  // ...
}
```

### Change Panel Color
```javascript
// Main panel background:
background: 'rgba(8, 13, 31, 0.8)'  // ← Adjust opacity or color
```

### Change Sub-card Opacity
```javascript
const glassCardStyle = {
  background: 'rgba(255, 255, 255, 0.06)',  // ← Increase for more opaque
  // ...
}
```

### Change Border Colors
```javascript
border: '1px solid rgba(255, 255, 255, 0.12)'  // ← Increase opacity
```

---

## Common Customizations

### Add Custom Description Template
```javascript
// In OVERVIEW TAB, Description block:
<div style={glassCardStyle}>
  <div style={glassCardTitleStyle}>Description</div>
  <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
    {selectedNode.description || 
     `${selectedNode.label} is a key ${selectedNode.type} in ${selectedNode.domain}.
      Established in 2020, it maintains strategic importance...`}
  </p>
</div>
```

### Add Image/Video Support
```javascript
// In OVERVIEW TAB, after Description:
{selectedNode.imageUrl && (
  <div style={glassCardStyle}>
    <img src={selectedNode.imageUrl} style={{ width: '100%', borderRadius: 12 }} />
  </div>
)}

{selectedNode.videoUrl && (
  <div style={glassCardStyle}>
    <iframe 
      src={selectedNode.videoUrl} 
      style={{ width: '100%', height: 180, borderRadius: 12 }}
    />
  </div>
)}
```

### Extend Domain List
```javascript
// In entity creation form, select options:
<select value={newEntityDomain} onChange={e => setNewEntityDomain(e.target.value)}>
  <option value="geopolitics">Geopolitics</option>
  <option value="economics">Economics</option>
  <option value="custom_domain">Custom Domain</option>  // ← Add here
</select>
```

### Add Confirmation on Edge Removal
```javascript
// In handleRemoveEdge():
const handleRemoveEdge = (edgeToRemove) => {
  if (!window.confirm('Remove this relationship?')) return  // ← Add this
  // ... rest of function
}
```

---

## Troubleshooting

### Graph Not Updating After Adding Entity
**Check:**
1. Is `setGraphData` being passed to NodePanel?
2. Is GraphCanvas subscribed to `graphData` in useEffect?
3. Are nodes/edges properly structured?

**Solution:**
```javascript
// Verify in parent component:
<NodePanel
  graphData={graphData}
  setGraphData={setGraphData}  // ← Must be passed
/>
```

### Glass Effect Not Visible
**Check:**
1. Is `backdropFilter` property spelled correctly?
2. Is `-webkit-backdropFilter` for Safari?
3. Is blur value high enough?

**Solution:**
```javascript
backdropFilter: 'blur(24px)',
WebkitBackdropFilter: 'blur(24px)',  // ← Both required
```

### Hover Effects Not Working
**Check:**
1. Are onMouseEnter/onMouseLeave functions defined?
2. Are styles being applied to correct element?
3. Is transition property set?

**Solution:**
```javascript
style={{
  transition: 'all 0.2s ease',  // ← Add this
  // ...
}}
onMouseEnter={e => {
  e.currentTarget.style.transform = 'translateY(-2px)'
}}
onMouseLeave={e => {
  e.currentTarget.style.transform = 'translateY(0)'
}}
```

### Form Inputs Not Appearing
**Check:**
1. Is `showAddEntity` state true?
2. Are input styles correctly applied?
3. Is form structure correct?

**Solution:**
```javascript
{!showAddEntity ? (
  <button>➕ ADD ENTITY</button>  // ← Collapsed
) : (
  <div>
    {/* Form here */}
  </div>  // ← Expanded
)}
```

---

## Performance Optimization Tips

### Memoize Connected Nodes
```javascript
const connected = useMemo(
  () => getConnectedNodes(selectedNode?.id, edges, nodes),
  [selectedNode?.id, edges, nodes]
)
```

### Debounce AI Queries
```javascript
import { useCallback, useRef } from 'react'

const handleQuery = useCallback(
  debounce(async () => {
    // ... query logic
  }, 500),
  [selectedNode]
)

function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
```

### Lazy Load AI Analysis
```javascript
const [aiLoaded, setAiLoaded] = useState(false)

useEffect(() => {
  if (tab !== 'ai') return  // ← Don't load if not visible
  setAiLoaded(true)
}, [tab])
```

---

## Accessibility Improvements

### Add ARIA Labels
```javascript
<button 
  onClick={handleAddEntity}
  aria-label="Add new entity to graph"
  title="Add new entity to graph"
>
  ➕ ADD ENTITY
</button>
```

### Keyboard Navigation
```javascript
onKeyDown={e => {
  if (e.key === 'Enter') handleAddEntity()
  if (e.key === 'Escape') setShowAddEntity(false)
}}
```

### Focus Management
```javascript
<input 
  ref={inputRef}
  autoFocus
  onBlur={() => {
    if (!newEntityName.trim()) setShowAddEntity(false)
  }}
/>
```

---

## Testing Guide

### Unit Test: handleAddEntity
```javascript
test('handleAddEntity creates new node and edge', () => {
  const { getByText, getByPlaceholderText } = render(
    <NodePanel selectedNode={mockNode} />
  )
  
  fireEvent.click(getByText('➕ ADD ENTITY'))
  fireEvent.change(getByPlaceholderText('Entity name...'), { target: { value: 'New Entity' } })
  fireEvent.click(getByText('✓ SAVE'))
  
  // Assert node and edge created
  expect(mockNodes.length).toBe(initialLength + 1)
  expect(mockEdges.length).toBe(initialLength + 1)
})
```

### Integration Test: Graph Update
```javascript
test('graph updates when entity is added', async () => {
  const { container } = render(
    <Workspace graphData={mockGraphData} />
  )
  
  // Add entity
  fireEvent.click(getByText('➕ ADD ENTITY'))
  // ... fill form
  fireEvent.click(getByText('✓ SAVE'))
  
  // Check if GraphCanvas received update
  await waitFor(() => {
    const nodes = container.querySelector('[data-node-count]')
    expect(nodes.textContent).toBe('51')  // 50 + 1
  })
})
```

---

## Deployment Checklist

- [ ] No console errors in development
- [ ] No TypeScript/ESLint warnings
- [ ] Glass effect visible on target browsers
- [ ] Hover effects work on mouse/touch
- [ ] Delete confirmation works
- [ ] Form validation prevents empty submissions
- [ ] Graph updates immediately after mutations
- [ ] No memory leaks (check DevTools)
- [ ] Performance acceptable on slow devices
- [ ] Mobile layout preserved
- [ ] Accessibility tests pass
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)

---

## Support & Questions

For questions about:
- **Styling:** Check VISUAL_GUIDE.md
- **Features:** Check ENHANCEMENTS_SUMMARY.md
- **Architecture:** Check this file

All modifications maintain backward compatibility with existing components.

**Last Updated:** March 24, 2026  
**Version:** 1.0 Production Ready
