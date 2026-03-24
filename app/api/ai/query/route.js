import { NextResponse } from 'next/server'

/**
 * POST /api/ai/query
 * Server-side proxy for all Groq AI calls.
 * Keeps GROQ_API_KEY off the client entirely.
 *
 * Body: { prompt, graphContext, systemOverride? }
 * graphContext: { nodeCount, edgeCount, sampleNodes, workspaceName?, domains? }
 */
export async function POST(request) {
  try {
    const { prompt, graphContext, systemOverride } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const ctx = graphContext || {}
    const systemPrompt = systemOverride || buildSystemPrompt(ctx)

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('[ai/query] Groq error:', err)
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 })
    }

    const data = await groqRes.json()
    const text = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({ response: text })
  } catch (err) {
    console.error('[ai/query] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function buildSystemPrompt(ctx) {
  const nodeCount = ctx.nodeCount || 0
  const edgeCount = ctx.edgeCount || 0
  const sampleNodes = (ctx.sampleNodes || []).slice(0, 20).join(', ')
  const workspaceName = ctx.workspaceName || 'Active Intelligence Workspace'
  const domains = (ctx.domains || ['geopolitics', 'economics', 'defense']).join(', ')

  return `You are Neptune — an AI-powered strategic intelligence analyst.

You have access to a live knowledge graph for workspace: "${workspaceName}".
Graph contains ${nodeCount} entities and ${edgeCount} relationships.
Domains covered: ${domains}.
Key entities in graph: ${sampleNodes || 'loading...'}.

Your role:
- Provide decision-grade intelligence analysis for senior government analysts and policymakers.
- Be precise, direct, and structured. Lead with the key finding.
- Cite specific entities from the knowledge graph when relevant.
- Identify strategic implications, not just descriptions.
- Format in 2-4 concise paragraphs. End with one clear actionable implication.
- Never hedge excessively. Confidence and clarity are valued.`
}
