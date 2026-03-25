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
  
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  if (error || !data) return null
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
