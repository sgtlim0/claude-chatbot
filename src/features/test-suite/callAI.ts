import { TestResult } from '@/entities/message'
import { generateId } from '@/shared/lib/generateId'

interface CallAIParams {
  prompt: string
  label: string
  model: string
  systemPrompt?: string
}

export async function callAI({ prompt, label, model, systemPrompt }: CallAIParams): Promise<TestResult> {
  const startTime = performance.now()

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: `test-${generateId()}`,
        browser_id: 'test-runner',
        message: prompt,
        model,
        system_prompt: systemPrompt,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    let fullResponse = ''

    // Handle SSE stream and collect full response
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
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              fullResponse += parsed.content
            }
          } catch {
            // skip unparseable lines
          }
        }
      }
    }

    const latencyMs = Math.round(performance.now() - startTime)
    const tokenCount = Math.round(fullResponse.length / 4) // rough estimate

    return {
      id: generateId(),
      label,
      prompt,
      response: fullResponse,
      latencyMs,
      tokenCount,
      status: fullResponse.length > 0 ? 'pass' : 'fail',
      timestamp: Date.now(),
      model,
    }
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime)

    return {
      id: generateId(),
      label,
      prompt,
      response: error instanceof Error ? error.message : 'Unknown error',
      latencyMs,
      tokenCount: 0,
      status: 'error',
      timestamp: Date.now(),
      model,
    }
  }
}
