import { NextResponse } from 'next/server'

// Auth protection is handled client-side in each protected page via useAuth().
// The proxy is intentionally a passthrough — Supabase stores sessions in
// localStorage by default in the browser, which server-side middleware
// cannot read, causing redirect loops.
export function proxy() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/workspace/:path*'],
}