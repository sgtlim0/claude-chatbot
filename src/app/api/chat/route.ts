export const runtime = 'edge'

export async function POST(request: Request) {
  const body = await request.json()
  const backendUrl = process.env.MODAL_BACKEND_URL || 'http://localhost:8000'

  try {
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Backend request failed' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Pass through the SSE stream
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}