/**
 * Workspace Permissions & Access Control
 * Handles role-based permissions for collaborative workspaces
 */

import { getSupabase } from './supabase'

export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
}

export const PERMISSIONS = {
  // Workspace management
  DELETE_WORKSPACE: [ROLES.OWNER],
  EDIT_WORKSPACE_METADATA: [ROLES.OWNER],
  MANAGE_MEMBERS: [ROLES.OWNER],
  
  // Content editing
  ADD_ENTITY: [ROLES.OWNER, ROLES.EDITOR],
  EDIT_ENTITY: [ROLES.OWNER, ROLES.EDITOR],
  DELETE_ENTITY: [ROLES.OWNER, ROLES.EDITOR],
  ADD_CONNECTION: [ROLES.OWNER, ROLES.EDITOR],
  DELETE_CONNECTION: [ROLES.OWNER, ROLES.EDITOR],
  
  // Source management
  ADD_SOURCE: [ROLES.OWNER, ROLES.EDITOR],
  EDIT_SOURCE: [ROLES.OWNER, ROLES.EDITOR],
  DELETE_SOURCE: [ROLES.OWNER, ROLES.EDITOR],
  
  // Read access
  VIEW_WORKSPACE: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER],
  VIEW_GRAPH: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER],
}

/**
 * Get user's role in a workspace
 */
export async function getUserRole(workspaceId, userId) {
  const supabase = getSupabase()
  
  console.log('[getUserRole] Called with:', {
    workspaceId,
    userId,
    userIdType: typeof userId,
    userIdLength: userId?.length
  })
  
  // First check if user is the owner
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()
  
  console.log('[getUserRole] Workspace query result:', {
    workspace,
    wsError,
    ownerId: workspace?.owner_id,
    ownerIdType: typeof workspace?.owner_id,
    ownerIdLength: workspace?.owner_id?.length
  })
  
  // Normalize comparison to handle string vs UUID type mismatches
  if (workspace?.owner_id && String(workspace.owner_id) === String(userId)) {
    console.log('[getUserRole] User is owner - returning "owner"')
    return 'owner'
  }
  
  console.log('[getUserRole] Not owner, checking workspace_members table')
  
  // Then check workspace_members table
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  console.log('[getUserRole] Member query result:', {
    data,
    error,
    role: data?.role
  })
  
  if (error || !data) {
    console.log('[getUserRole] No member found, returning null')
    return null
  }
  
  console.log('[getUserRole] Returning role:', data.role)
  return data.role
}

/**
 * Check if user has specific permission in workspace
 */
export async function hasPermission(workspaceId, userId, permission) {
  const role = await getUserRole(workspaceId, userId)
  if (!role) return false
  
  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles?.includes(role) || false
}

/**
 * Get workspace with user's role
 */
export async function getWorkspaceWithRole(workspaceId, userId) {
  const supabase = getSupabase()
  
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
  
  if (workspaceError || !workspace) {
    return { workspace: null, role: null, error: workspaceError }
  }
  
  const role = await getUserRole(workspaceId, userId)
  
  return { workspace, role, error: null }
}

/**
 * Get all members of a workspace
 */
export async function getWorkspaceMembers(workspaceId) {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      *,
      user:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
  
  return { members: data || [], error }
}

/**
 * Verify user can perform action (throws error if not)
 */
export async function requirePermission(workspaceId, userId, permission) {
  const allowed = await hasPermission(workspaceId, userId, permission)
  
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`)
  }
  
  return true
}
