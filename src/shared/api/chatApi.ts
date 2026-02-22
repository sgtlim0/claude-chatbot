import { ApiError } from '../lib/errors'

interface StreamChatParams {
  sessionId: string
  browserId: string
  message: string
  model: string
  systemPrompt?: string
  onChunk: (content: string) => void
  onError: (error: Error) => void
  onDone: () => void
  signal?: AbortSignal
}

export async function streamChat({
  sessionId,
  browserId,
  message,
  model,
  systemPrompt,
  onChunk,
  onError,
  onDone,
  signal,
}: StreamChatParams): Promise<void> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        browser_id: browserId,
        message,
        model,
        system_prompt: systemPrompt,
      }),
      signal,
    })

    if (!response.ok) {
      throw new ApiError(`Chat request failed: ${response.statusText}`, response.status)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          if (data === '[DONE]') {
            onDone()
            return
          }

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              onChunk(parsed.content)
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        }
      }
    }

    onDone()
  } catch (error) {
    if (error instanceof Error) {
      onError(error)
    } else {
      onError(new Error('Unknown error occurred'))
    }
  }
}