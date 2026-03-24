#!/usr/bin/env node

/**
 * Graph Data Deduplication Script
 * 
 * This script merges duplicate entities in the graph data files.
 * Run this to clean up existing nodes.json and edges.json files.
 * 
 * Usage:
 *   node scripts/deduplicate-graph-data.js
 */

const fs = require('fs')
const path = require('path')

// Import deduplication logic (simplified version for Node.js)
function normalizeEntityName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
}

function mergeDuplicateNodes(nodes, edges) {
  const nodeMap = new Map()
  const mergeMap = new Map()
  const deduplicatedNodes = []
  
  // Group nodes by normalized name
  nodes.forEach(node => {
    const normalizedName = normalizeEntityName(node.label || node.name)
    const canonicalId = normalizedName.toUpperCase()
    
    if (!nodeMap.has(canonicalId)) {
      const canonicalNode = {
        ...node,
        id: canonicalId,
        label: node.label || node.name,
      }
      nodeMap.set(canonicalId, canonicalNode)
      deduplicatedNodes.push(canonicalNode)
      mergeMap.set(node.id, canonicalId)
    } else {
      const canonical = nodeMap.get(canonicalId)
      mergeMap.set(node.id, canonicalId)
      
      if (node.tags && Array.isArray(node.tags)) {
        canonical.tags = [...new Set([...(canonical.tags || []), ...node.tags])]
      }
      
      if (node.size && node.size > (canonical.size || 0)) {
        canonical.size = node.size
      }
      
      if (node.description && !canonical.description) {
        canonical.description = node.description
      }
    }
  })
  
  // Update edges
  const deduplicatedEdges = []
  const edgeSet = new Set()
  
  edges.forEach(edge => {
    const canonicalSource = mergeMap.get(edge.source) || edge.source
    const canonicalTarget = mergeMap.get(edge.target) || edge.target
    
    if (canonicalSource === canonicalTarget) return
    
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

// Main execution
async function main() {
  const dataDir = path.join(process.cwd(), 'public', 'data')
  const nodesPath = path.join(dataDir, 'nodes.json')
  const edgesPath = path.join(dataDir, 'edges.json')
  
  console.log('🔍 Reading graph data files...')
  
  // Read files
  const nodes = JSON.parse(fs.readFileSync(nodesPath, 'utf8'))
  const edges = JSON.parse(fs.readFileSync(edgesPath, 'utf8'))
  
  console.log(`📊 Original data: ${nodes.length} nodes, ${edges.length} edges`)
  
  // Deduplicate
  console.log('🔄 Deduplicating entities...')
  const result = mergeDuplicateNodes(nodes, edges)
  
  console.log(`✅ Deduplicated data: ${result.nodes.length} nodes, ${result.edges.length} edges`)
  console.log(`🎯 Merged ${result.mergeCount} duplicate entities`)
  
  if (result.mergeCount === 0) {
    console.log('✨ No duplicates found! Data is already clean.')
    return
  }
  
  // Create backups
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(dataDir, 'backups')
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  const nodesBackup = path.join(backupDir, `nodes-${timestamp}.json`)
  const edgesBackup = path.join(backupDir, `edges-${timestamp}.json`)
  
  console.log('💾 Creating backups...')
  fs.copyFileSync(nodesPath, nodesBackup)
  fs.copyFileSync(edgesPath, edgesBackup)
  console.log(`   Backup: ${nodesBackup}`)
  console.log(`   Backup: ${edgesBackup}`)
  
  // Write deduplicated data
  console.log('💾 Writing deduplicated data...')
  fs.writeFileSync(nodesPath, JSON.stringify(result.nodes, null, 2))
  fs.writeFileSync(edgesPath, JSON.stringify(result.edges, null, 2))
  
  console.log('✅ Deduplication complete!')
  console.log(`   Removed ${result.mergeCount} duplicate nodes`)
  console.log(`   Removed ${edges.length - result.edges.length} duplicate edges`)
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
