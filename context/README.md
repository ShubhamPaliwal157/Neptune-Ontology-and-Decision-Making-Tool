# `context/` — React Context

## `context/AuthContext.js`

Provides Supabase authentication state to the entire component tree. Wraps the app in `layout.js`.

### How it works

On mount, `AuthProvider` calls `supabase.auth.getSession()` to load any existing session from `localStorage` (Supabase stores sessions there by default). It then subscribes to `onAuthStateChange` so that any login, logout, or token refresh automatically updates the context without a page reload.

### `AuthProvider` component

Wrap your app (or any subtree) with this to make auth state available:

```jsx
// layout.js — already done at the root
<AuthProvider>
  {children}
</AuthProvider>
```

Provides the context value `{ user, loading }`:

- `user` — the Supabase `User` object, or `null` if not authenticated. Key fields: `user.id` (UUID), `user.email`, `user.user_metadata.full_name`.
- `loading` — `true` while the initial session check is in progress. Always wait for `loading === false` before acting on `user` to avoid redirect flicker.

### `useAuth()` hook

```js
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <p>Not logged in</p>
  return <p>Hello, {user.user_metadata.full_name}</p>
}
```

### `withAuth(Component)` HOC

Defined in `app/dashboard/withAuth.js` (not in this file). Import from there. See `app/dashboard/withAuth.js` docs.

### Auth state lifecycle

```md
App loads
  └── AuthProvider mounts
        ├── getSession() → sets user (or null), sets loading = false
        └── onAuthStateChange listener active for session lifetime
              ├── User logs in  → user updated to User object
              ├── User logs out → user updated to null → withAuth redirects to /login
              └── Token refresh → user updated silently (no flicker)
```
