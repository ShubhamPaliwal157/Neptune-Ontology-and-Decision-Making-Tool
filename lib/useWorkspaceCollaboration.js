/**
 * React Hook for Collaborative Workspace Management
 * Handles real-time sync, permissions, and state updates
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'

export function useWorkspaceCollaboration(workspaceId) {
  const { user } = useAuth()
  const [role, setRole] = useState(null)
  const [members, setMembers] = useState([])
  const [sources, setSources] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const lastActivityTimestamp = useRef(null)
  const pollingInterval = useRef(null)

  // Fetch workspace role and initial data
  useEffect(() => {
    if (!workspaceId || !user) return

    async function loadWorkspaceData() {
      try {
        setLoading(true)
        
        console.log('[Collaboration Hook] Loading workspace data', { workspaceId, userId: user.id })
        
        // Get workspace with role
        const workspaceRes = await fetch(`/api/workspace/${workspaceId}?user_id=${user.id}`)
        const workspaceData = await workspaceRes.json()
        
        if (!workspaceRes.ok) {
          throw new Error(workspaceData.error || 'Failed to load workspace')
        }
        
        console.log('[Collaboration Hook] Workspace API response', {
          workspaceId,
          ownerId: workspaceData.workspace?.owner_id,
          ownerIdType: typeof workspaceData.workspace?.owner_id,
          currentUserId: user.id,
          userIdType: typeof user.id,
          roleFromAPI: workspaceData.role,
          isOwnerStrict: workspaceData.workspace?.owner_id === user.id,
          isOwnerNormalized: String(workspaceData.workspace?.owner_id) === String(user.id)
        })
        
        // CRITICAL: Owner check takes precedence (normalize types)
        let resolvedRole = workspaceData.role
        if (workspaceData.workspace?.owner_id && String(workspaceData.workspace.owner_id) === String(user.id)) {
          resolvedRole = 'owner'
          console.log('[Collaboration Hook] User is workspace owner, forcing role to "owner"')
        }
        
        setRole(resolvedRole)
        console.log('[Collaboration Hook] Final resolved role:', resolvedRole)

        // Load members
        const membersRes = await fetch(`/api/workspace/${workspaceId}/members?user_id=${user.id}`)
        const membersData = await membersRes.json()
        if (membersRes.ok) {
          setMembers(membersData.members || [])
          console.log('[Collaboration Hook] Members loaded:', membersData.members?.length || 0)
        }

        // Load sources
        const sourcesRes = await fetch(`/api/workspace/${workspaceId}/sources?user_id=${user.id}`)
        const sourcesData = await sourcesRes.json()
        if (sourcesRes.ok) {
          setSources(sourcesData.sources || [])
        }

        // Load recent activity
        const activityRes = await fetch(`/api/workspace/${workspaceId}/activity?user_id=${user.id}&limit=20`)
        const activityData = await activityRes.json()
        if (activityRes.ok) {
          setActivities(activityData.activities || [])
          if (activityData.activities?.length > 0) {
            lastActivityTimestamp.current = activityData.activities[0].created_at
          }
        }

        setError(null)
      } catch (err) {
        console.error('[workspace collaboration]', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadWorkspaceData()
  }, [workspaceId, user])

  // Poll for activity updates (real-time sync)
  useEffect(() => {
    if (!workspaceId || !user || !role) return

    let stopPolling = false

    async function pollActivity() {
      // Don't poll if we've been told to stop
      if (stopPolling) return

      try {
        const since = lastActivityTimestamp.current
        const url = `/api/workspace/${workspaceId}/activity?user_id=${user.id}&limit=10${since ? `&since=${since}` : ''}`
        
        const res = await fetch(url)
        
        // Handle 403 - stop polling
        if (res.status === 403) {
          console.error('[poll activity] Access denied (403) - stopping polling')
          stopPolling = true
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current)
            pollingInterval.current = null
          }
          return
        }

        // Handle other errors
        if (!res.ok) {
          console.error('[poll activity] HTTP error:', res.status, res.statusText)
          return
        }

        const data = await res.json()
        
        if (data.activities?.length > 0) {
          // New activities detected
          setActivities(prev => [...data.activities, ...prev])
          lastActivityTimestamp.current = data.activities[0].created_at
          
          // Trigger refresh based on activity type
          data.activities.forEach(activity => {
            if (activity.user_id !== user.id) {
              handleRemoteActivity(activity)
            }
          })
        }
      } catch (err) {
        console.error('[poll activity] Exception:', err)
      }
    }

    // Poll every 3 seconds
    pollingInterval.current = setInterval(pollActivity, 3000)

    return () => {
      stopPolling = true
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [workspaceId, user, role])

  // Handle remote activity from other users
  const handleRemoteActivity = useCallback((activity) => {
    switch (activity.action) {
      case 'source_added':
      case 'source_updated':
      case 'source_deleted':
        // Refresh sources
        refreshSources()
        break
      case 'member_added':
      case 'member_removed':
      case 'member_role_updated':
        // Refresh members
        refreshMembers()
        break
      case 'entity_added':
      case 'entity_deleted':
      case 'connection_added':
      case 'connection_deleted':
        // Notify parent to refresh graph
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('workspace:graph-updated', { 
            detail: { activity } 
          }))
        }
        break
    }
  }, [workspaceId, user])

  // Refresh sources
  const refreshSources = useCallback(async () => {
    if (!workspaceId || !user) return
    
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/sources?user_id=${user.id}`)
      const data = await res.json()
      if (res.ok) {
        setSources(data.sources || [])
      }
    } catch (err) {
      console.error('[refresh sources]', err)
    }
  }, [workspaceId, user])

  // Refresh members
  const refreshMembers = useCallback(async () => {
    if (!workspaceId || !user) return
    
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members?user_id=${user.id}`)
      const data = await res.json()
      if (res.ok) {
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error('[refresh members]', err)
    }
  }, [workspaceId, user])

  // Add source
  const addSource = useCallback(async (sourceData) => {
    if (!workspaceId || !user) return { success: false, error: 'Not authenticated' }
    
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ...sourceData }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSources(prev => [data.source, ...prev])
        return { success: true, source: data.source }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [workspaceId, user])

  // Update source
  const updateSource = useCallback(async (sourceId, updates) => {
    if (!workspaceId || !user) return { success: false, error: 'Not authenticated' }
    
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/sources`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, source_id: sourceId, updates }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSources(prev => prev.map(s => s.id === sourceId ? data.source : s))
        return { success: true, source: data.source }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [workspaceId, user])

  // Delete source
  const deleteSource = useCallback(async (sourceId) => {
    if (!workspaceId || !user) return { success: false, error: 'Not authenticated' }
    
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/sources`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, source_id: sourceId }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSources(prev => prev.filter(s => s.id !== sourceId))
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [workspaceId, user])

  // Invite member
  const inviteMember = useCallback(async (email, role = 'editor') => {
    if (!workspaceId || !user) return { success: false, error: 'Not authenticated' }
    
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, email, role }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        return { success: true, invite: data.invite, inviteUrl: data.inviteUrl }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [workspaceId, user])

  // Remove member
  const removeMember = useCallback(async (memberId) => {
    if (!workspaceId || !user) return { success: false, error: 'Not authenticated' }
    
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, member_id: memberId }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [workspaceId, user])

  // Update member role
  const updateMemberRole = useCallback(async (memberId, newRole) => {
    if (!workspaceId || !user) return { success: false, error: 'Not authenticated' }
    
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, member_id: memberId, new_role: newRole }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? data.member : m))
        return { success: true, member: data.member }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [workspaceId, user])

  // Log activity
  const logActivity = useCallback(async (action, entityType, entityId, entityData) => {
    if (!workspaceId || !user) return
    
    try {
      await fetch(`/api/workspace/${workspaceId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          action,
          entity_type: entityType,
          entity_id: entityId,
          entity_data: entityData,
        }),
      })
    } catch (err) {
      console.error('[log activity]', err)
    }
  }, [workspaceId, user])

  // Permission checks
  const canEdit = role === 'owner' || role === 'editor'
  const canManage = role === 'owner'
  const canView = role !== null

  return {
    // State
    role,
    members,
    sources,
    activities,
    loading,
    error,
    
    // Permissions
    canEdit,
    canManage,
    canView,
    
    // Actions
    addSource,
    updateSource,
    deleteSource,
    inviteMember,
    removeMember,
    updateMemberRole,
    logActivity,
    refreshSources,
    refreshMembers,
  }
}
