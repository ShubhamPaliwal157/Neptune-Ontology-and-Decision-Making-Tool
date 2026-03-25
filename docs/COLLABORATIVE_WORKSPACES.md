# Collaborative Workspaces & Editable Sources

Complete implementation guide for multi-user collaboration and source management.

## Overview

This implementation adds:
- Multi-user collaborative workspaces
- Role-based access control (Owner, Editor, Viewer)
- Invite system for adding members
- Full CRUD operations for sources
- Real-time activity sync
- Permission-based UI controls

## Database Schema

### New Tables

#### `workspace_members`
Tracks users who have access to a workspace.

```sql
- id: uuid (primary key)
- workspace_id: uuid (references workspaces)
- user_id: uuid (references auth.users)
- role: text (owner, editor, viewer)
- invited_by: uuid (references auth.users)
- invited_at: timestamptz
- joined_at: timestamptz
- status: text (pending, active, declined)
- created_at: timestamptz
```

#### `workspace_invites`
Manages pending invitations.

```sql
- id: uuid (primary key)
- workspace_id: uuid (references workspaces)
- invited_by: uuid (references auth.users)
- email: text
- role: text (editor, viewer)
- token: text (unique)
- expires_at: timestamptz
- accepted_at: timestamptz
- declined_at: timestamptz
- created_at: timestamptz
```

#### `workspace_activity`
Logs all workspace changes for real-time sync.

```sql
- id: uuid (primary key)
- workspace_id: uuid (references workspaces)
- user_id: uuid (references auth.users)
- action: text
- entity_type: text
- entity_id: text
- entity_data: jsonb
- created_at: timestamptz
```

### Updated Tables

#### `workspaces`
Added collaboration fields:
- `is_collaborative`: boolean
- `visibility`: text (private, team, public)

#### `workspace_sources`
Added CRUD support:
- `name`: text
- `description`: text
- `metadata`: jsonb
- `updated_at`: timestamptz
- `updated_by`: uuid

## Roles & Permissions

### Owner
- Delete workspace
- Manage members (invite, remove, change roles)
- Edit workspace metadata
- Add/edit/delete entities
- Add/edit/delete sources
- View everything

### Editor
- Add/edit/delete entities
- Add/edit/delete sources
- View everything
- Cannot manage members or delete workspace

### Viewer
- View workspace
- View graph
- View sources
- Cannot edit anything

## API Endpoints

### Workspace Management

#### `GET /api/workspace/[id]?user_id=xxx`
Get workspace details with user's role.

**Response:**
```json
{
  "workspace": { ... },
  "role": "owner" | "editor" | "viewer"
}
```

#### `PATCH /api/workspace/[id]`
Update workspace metadata (owner only).

**Request:**
```json
{
  "user_id": "uuid",
  "updates": {
    "name": "New Name",
    "description": "New description",
    "is_collaborative": true,
    "visibility": "team"
  }
}
```

### Member Management

#### `GET /api/workspace/[id]/members?user_id=xxx`
List all workspace members.

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "user_id": "uuid",
      "role": "owner",
      "status": "active",
      "user": {
        "email": "user@example.com"
      }
    }
  ]
}
```

#### `PATCH /api/workspace/[id]/members`
Update member role (owner only).

**Request:**
```json
{
  "user_id": "uuid",
  "member_id": "uuid",
  "new_role": "editor"
}
```

#### `DELETE /api/workspace/[id]/members`
Remove member (owner only).

**Request:**
```json
{
  "user_id": "uuid",
  "member_id": "uuid"
}
```

### Invite System

#### `POST /api/workspace/[id]/invite`
Create invite link (owner only).

**Request:**
```json
{
  "user_id": "uuid",
  "email": "invitee@example.com",
  "role": "editor"
}
```

**Response:**
```json
{
  "invite": { ... },
  "inviteUrl": "https://app.com/workspace/xxx/join?token=xxx",
  "success": true
}
```

#### `GET /api/workspace/[id]/invite?token=xxx`
Get invite details.

**Response:**
```json
{
  "invite": {
    "workspace": {
      "name": "Workspace Name"
    },
    "role": "editor",
    "expires_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `POST /api/workspace/[id]/members`
Accept invite.

**Request:**
```json
{
  "user_id": "uuid",
  "invite_token": "token"
}
```

### Source Management

#### `GET /api/workspace/[id]/sources?user_id=xxx`
List all sources.

**Response:**
```json
{
  "sources": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "type": "static",
      "url": "https://example.com",
      "name": "Example Source",
      "description": "Description",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/workspace/[id]/sources`
Add new source (owner/editor).

**Request:**
```json
{
  "user_id": "uuid",
  "type": "static",
  "url": "https://example.com",
  "name": "Source Name",
  "description": "Optional description",
  "metadata": {}
}
```

#### `PATCH /api/workspace/[id]/sources`
Update source (owner/editor).

**Request:**
```json
{
  "user_id": "uuid",
  "source_id": "uuid",
  "updates": {
    "name": "New Name",
    "description": "New description",
    "status": "active"
  }
}
```

#### `DELETE /api/workspace/[id]/sources`
Delete source (owner/editor).

**Request:**
```json
{
  "user_id": "uuid",
  "source_id": "uuid"
}
```

### Activity Log

#### `GET /api/workspace/[id]/activity?user_id=xxx&since=xxx&limit=50`
Get activity log for real-time sync.

**Response:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "user_id": "uuid",
      "action": "entity_added",
      "entity_type": "node",
      "entity_id": "NODE_123",
      "entity_data": { "label": "New Entity" },
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "email": "user@example.com"
      }
    }
  ]
}
```

#### `POST /api/workspace/[id]/activity`
Log activity.

**Request:**
```json
{
  "user_id": "uuid",
  "action": "entity_added",
  "entity_type": "node",
  "entity_id": "NODE_123",
  "entity_data": { "label": "New Entity" }
}
```

## React Hook Usage

### `useWorkspaceCollaboration(workspaceId)`

Comprehensive hook for managing collaborative workspace state.

```javascript
import { useWorkspaceCollaboration } from '@/lib/useWorkspaceCollaboration'

function WorkspaceComponent({ workspaceId }) {
  const {
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
  } = useWorkspaceCollaboration(workspaceId)

  // Add source
  const handleAddSource = async () => {
    const result = await addSource({
      type: 'static',
      url: 'https://example.com',
      name: 'Example',
      description: 'Description'
    })
    
    if (result.success) {
      console.log('Source added:', result.source)
    } else {
      console.error('Error:', result.error)
    }
  }

  // Invite member
  const handleInvite = async () => {
    const result = await inviteMember('user@example.com', 'editor')
    
    if (result.success) {
      console.log('Invite URL:', result.inviteUrl)
      // Copy to clipboard or send via email
    }
  }

  return (
    <div>
      <h1>Role: {role}</h1>
      
      {canManage && (
        <button onClick={handleInvite}>Invite Member</button>
      )}
      
      {canEdit && (
        <button onClick={handleAddSource}>Add Source</button>
      )}
      
      <ul>
        {sources.map(source => (
          <li key={source.id}>
            {source.name}
            {canEdit && (
              <button onClick={() => deleteSource(source.id)}>
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Real-Time Sync

The hook automatically polls for activity updates every 3 seconds and:

1. Detects changes made by other users
2. Updates local state (sources, members)
3. Dispatches custom events for graph updates

### Listen for Graph Updates

```javascript
useEffect(() => {
  const handleGraphUpdate = (event) => {
    const { activity } = event.detail
    console.log('Graph updated by:', activity.user_id)
    // Refresh graph data
    refreshGraph()
  }

  window.addEventListener('workspace:graph-updated', handleGraphUpdate)
  
  return () => {
    window.removeEventListener('workspace:graph-updated', handleGraphUpdate)
  }
}, [])
```

## Integration with Existing Code

### Update NodePanel to Log Activity

```javascript
import { useWorkspaceCollaboration } from '@/lib/useWorkspaceCollaboration'

function NodePanel({ workspaceId, ... }) {
  const { logActivity, canEdit } = useWorkspaceCollaboration(workspaceId)

  const handleAddEntity = async () => {
    // ... existing entity creation logic
    
    // Log activity
    await logActivity('entity_added', 'node', newNode.id, {
      label: newNode.label,
      domain: newNode.domain
    })
  }

  const handleDeleteEntity = async () => {
    // ... existing deletion logic
    
    // Log activity
    await logActivity('entity_deleted', 'node', selectedNode.id, {
      label: selectedNode.label
    })
  }

  return (
    <div>
      {canEdit ? (
        <button onClick={handleAddEntity}>Add Entity</button>
      ) : (
        <p>View-only mode</p>
      )}
    </div>
  )
}
```

### Update GraphCanvas to Listen for Changes

```javascript
function GraphCanvas({ workspaceId, ... }) {
  const { canEdit } = useWorkspaceCollaboration(workspaceId)

  useEffect(() => {
    const handleGraphUpdate = async (event) => {
      // Reload graph data when other users make changes
      await reloadGraphData()
    }

    window.addEventListener('workspace:graph-updated', handleGraphUpdate)
    return () => window.removeEventListener('workspace:graph-updated', handleGraphUpdate)
  }, [])

  return (
    <canvas 
      onClick={canEdit ? handleCanvasClick : undefined}
      style={{ cursor: canEdit ? 'pointer' : 'default' }}
    />
  )
}
```

## Deployment

### 1. Run Database Migrations

Execute the SQL in `database/schema-updates.sql` in your Supabase SQL editor.

### 2. Update Environment Variables

Ensure these are set:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Test Permissions

1. Create a workspace as User A
2. Invite User B as editor
3. Verify User B can edit but not manage members
4. Invite User C as viewer
5. Verify User C can only view

## Security Considerations

- All API routes verify user permissions before allowing actions
- Row Level Security (RLS) policies enforce database-level access control
- Invite tokens expire after 7 days
- Only owners can delete workspaces or manage members
- Activity logs are immutable (insert-only)

## Future Enhancements

- WebSocket support for instant updates (replace polling)
- Presence indicators (show who's currently viewing)
- Conflict resolution for simultaneous edits
- Audit trail with rollback capability
- Email notifications for invites
- Workspace templates
- Bulk member import

---

## Support

For issues or questions, refer to:
- API route implementations in `app/api/workspace/[id]/`
- Permission logic in `lib/workspacePermissions.js`
- React hook in `lib/useWorkspaceCollaboration.js`
