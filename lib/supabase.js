import { createClient } from '@supabase/supabase-js'

let client = null

export function getSupabase() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars missing')
    client = createClient(url, key)
  }
  return client
}

// Keep this as a named export so existing imports don't break,
// but it's now lazy — created on first access, not at import time
export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop]
  }
})

export default supabase