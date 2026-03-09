export async function queryGroq(prompt, graphContext) {
  const systemPrompt = `You are Neptune, an AI-powered global intelligence analyst with access to a live knowledge graph of ${graphContext.nodeCount} entities and ${graphContext.edgeCount} relationships spanning geopolitics, economics, defense, technology, climate, and society.

You provide concise, sourced, decision-grade intelligence analysis. Your tone is precise, analytical, and direct — like a senior intelligence briefer. Never hedge excessively. Lead with the key finding, then support it.

Current graph entities include: ${graphContext.sampleNodes.join(', ')}.

Format responses in 2-4 short paragraphs. Use specific data points when available. End with one actionable implication.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.4,
    })
  })

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}