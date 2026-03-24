/**
 * queryGroq — proxies through /api/ai/query (server-side) so GROQ_API_KEY
 * is never exposed in the browser bundle.
 */
export async function queryGroq(prompt, graphContext) {
  const res = await fetch('/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, graphContext }),
  })

  if (!res.ok) throw new Error(`AI query failed: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.response
}