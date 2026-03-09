export function getConnectedNodes(nodeId, edges, nodes) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
  const connected = []
  edges.forEach(e => {
    if (e.source === nodeId && nodeMap[e.target]) {
      connected.push({ node: nodeMap[e.target], edge: e, direction: 'out' })
    } else if (e.target === nodeId && nodeMap[e.source]) {
      connected.push({ node: nodeMap[e.source], edge: e, direction: 'in' })
    }
  })
  return connected
}

export function getDomainColor(domain) {
  const colors = {
    geopolitics:  '#c94040',
    economics:    '#c87c3a',
    defense:      '#b85a30',
    technology:   '#3d7bd4',
    climate:      '#2a9e58',
    society:      '#7050b8',
    organization: '#b89a30',
    person:       '#2a9e80',
  }
  return colors[domain] || '#3d7bd4'
}

export function formatRelationship(rel) {
  return rel?.replace(/_/g, ' ').toLowerCase() || 'related to'
}