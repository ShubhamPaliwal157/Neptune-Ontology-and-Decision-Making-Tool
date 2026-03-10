import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const job_id   = searchParams.get('job_id')
  const user_id  = searchParams.get('user_id')

  if (!job_id || !user_id) {
    return NextResponse.json({ error: 'Missing job_id or user_id' }, { status: 400 })
  }

  const { data: job, error } = await supabaseAdmin
    .from('processing_jobs')
    .select('*')
    .eq('id', job_id)
    .eq('owner_id', user_id)
    .single()

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({
    status:       job.status,
    progress:     job.progress,
    current_step: job.current_step,
    sources_total: job.sources_total,
    sources_done:  job.sources_done,
    error_message: job.error_message,
    updated_at:    job.updated_at,
  })
}