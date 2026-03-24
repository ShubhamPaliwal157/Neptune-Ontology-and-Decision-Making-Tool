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

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY DEDUPLICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize entity name for deduplication
 * Converts to lowercase, removes special chars, trims whitespace
 */
export function normalizeEntityName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_')     // Replace spaces with underscores
}

/**
 * Generate unique entity ID from normalized name
 */
export function generateEntityId(name) {
  return normalizeEntityName(name).toUpperCase()
}

/**
 * Common entity aliases for deduplication
 * Maps abbreviations/variations to canonical names
 */
const ENTITY_ALIASES = {
  'bjp': 'bharatiya_janata_party',
  'inc': 'indian_national_congress',
  'congress': 'indian_national_congress',
  'usa': 'united_states',
  'us': 'united_states',
  'uk': 'united_kingdom',
  'uae': 'united_arab_emirates',
  'prc': 'china',
  'roc': 'taiwan',
  'dprk': 'north_korea',
  'rok': 'south_korea',
}

/**
 * Resolve entity name through alias mapping
 */
export function resolveEntityAlias(name) {
  const normalized = normalizeEntityName(name)
  return ENTITY_ALIASES[normalized] || normalized
}

/**
 * Find existing entity by name (with alias resolution)
 * Returns the existing node if found, null otherwise
 */
export function findExistingEntity(name, nodes) {
  const resolvedName = resolveEntityAlias(name)
  const targetId = resolvedName.toUpperCase()
  
  // Direct ID match
  const directMatch = nodes.find(n => n.id === targetId)
  if (directMatch) return directMatch
  
  // Normalized label match
  const normalizedMatch = nodes.find(n => 
    normalizeEntityName(n.label) === resolvedName ||
    normalizeEntityName(n.name) === resolvedName
  )
  if (normalizedMatch) return normalizedMatch
  
  return null
}

/**
 * Merge duplicate nodes into a single canonical node
 * Combines all relationships and removes duplicates
 */
export function mergeDuplicateNodes(nodes, edges) {
  const nodeMap = new Map()
  const mergeMap = new Map() // Maps old IDs to canonical IDs
  const deduplicatedNodes = []
  
  // Group nodes by normalized name
  nodes.forEach(node => {
    const normalizedName = normalizeEntityName(node.label || node.name)
    const canonicalId = normalizedName.toUpperCase()
    
    if (!nodeMap.has(canonicalId)) {
      // First occurrence - this becomes the canonical node
      const canonicalNode = {
        ...node,
        id: canonicalId,
        label: node.label || node.name,
      }
      nodeMap.set(canonicalId, canonicalNode)
      deduplicatedNodes.push(canonicalNode)
      mergeMap.set(node.id, canonicalId)
    } else {
      // Duplicate found - merge data into canonical node
      const canonical = nodeMap.get(canonicalId)
      mergeMap.set(node.id, canonicalId)
      
      // Merge tags
      if (node.tags && Array.isArray(node.tags)) {
        canonical.tags = [...new Set([...(canonical.tags || []), ...node.tags])]
      }
      
      // Keep larger size
      if (node.size && node.size > (canonical.size || 0)) {
        canonical.size = node.size
      }
      
      // Preserve description if canonical doesn't have one
      if (node.description && !canonical.description) {
        canonical.description = node.description
      }
    }
  })
  
  // Update all edges to reference canonical node IDs
  const deduplicatedEdges = []
  const edgeSet = new Set()
  
  edges.forEach(edge => {
    const canonicalSource = mergeMap.get(edge.source) || edge.source
    const canonicalTarget = mergeMap.get(edge.target) || edge.target
    
    // Skip self-loops
    if (canonicalSource === canonicalTarget) return
    
    // Create unique edge key to prevent duplicate relationships
    const edgeKey = `${canonicalSource}::${edge.relationship}::${canonicalTarget}`
    
    if (!edgeSet.has(edgeKey)) {
      edgeSet.add(edgeKey)
      deduplicatedEdges.push({
        ...edge,
        source: canonicalSource,
        target: canonicalTarget,
      })
    }
  })
  
  return {
    nodes: deduplicatedNodes,
    edges: deduplicatedEdges,
    mergeCount: nodes.length - deduplicatedNodes.length,
  }
}

/**
 * Validate and deduplicate before adding new entity
 * Returns { node, isNew, existingNode }
 */
export function validateNewEntity(name, domain, nodes) {
  const existingNode = findExistingEntity(name, nodes)
  
  if (existingNode) {
    return {
      node: existingNode,
      isNew: false,
      existingNode: existingNode,
    }
  }
  
  // Create new node with normalized ID
  const resolvedName = resolveEntityAlias(name)
  const newNode = {
    id: resolvedName.toUpperCase(),
    label: name.trim(),
    domain: domain || 'organization',
    type: 'entity',
    size: 8,
    tags: [],
  }
  
  return {
    node: newNode,
    isNew: true,
    existingNode: null,
  }
}

/**
 * Add entity with automatic deduplication
 * Returns updated graph data
 */
export function addEntityWithDeduplication(entityName, domain, relationship, sourceNodeId, nodes, edges) {
  const validation = validateNewEntity(entityName, domain, nodes)
  
  let updatedNodes = nodes
  if (validation.isNew) {
    updatedNodes = [...nodes, validation.node]
  }
  
  // Create edge (check for duplicates)
  const newEdge = {
    source: sourceNodeId,
    target: validation.node.id,
    relationship: relationship.toUpperCase().replace(/\s+/g, '_'),
  }
  
  // Check if edge already exists
  const edgeExists = edges.some(e => 
    e.source === newEdge.source && 
    e.target === newEdge.target && 
    e.relationship === newEdge.relationship
  )
  
  const updatedEdges = edgeExists ? edges : [...edges, newEdge]
  
  return {
    nodes: updatedNodes,
    edges: updatedEdges,
    addedNode: validation.node,
    wasNew: validation.isNew,
    existingNode: validation.existingNode,
  }
}