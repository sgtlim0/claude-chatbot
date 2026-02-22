import { useChatStore } from '@/shared/store/chatStore'
import { useSettingsStore } from '@/shared/store/settingsStore'
import { generateId } from '@/shared/lib/generateId'
import { streamChat } from '@/shared/api/chatApi'
import { DEFAULT_SYSTEM_PROMPT } from '@/shared/lib/constants'
import type { Message } from '@/entities/message'

export async function sendMessage(content: string): Promise<void> {
  const chatStore = useChatStore.getState()
  const settingsStore = useSettingsStore.getState()

  let sessionId = chatStore.activeSessionId

  // Create new session if none exists
  if (!sessionId) {
    await chatStore.createSession()
    sessionId = chatStore.activeSessionId
    if (!sessionId) {
      throw new Error('Failed to create session')
    }
  }

  // Add user message
  const userMessage: Message = {
    id: generateId(),
    role: 'user',
    content,
    timestamp: Date.now(),
  }

  chatStore.addMessage(sessionId, userMessage)

  // Update session title if it's the first message
  const session = chatStore.sessions[sessionId]
  if (session.messages.length === 1) {
    const title = content.slice(0, 30) + (content.length > 30 ? '...' : '')
    chatStore.renameSession(sessionId, title)
  }

  // Add assistant message placeholder
  const assistantMessage: Message = {
    id: generateId(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    model: settingsStore.model,
  }

  chatStore.addMessage(sessionId, assistantMessage)
  chatStore.setStreaming(true)

  const abortController = new AbortController()

  try {
    await streamChat({
      sessionId,
      browserId: chatStore.browserId,
      message: content,
      model: settingsStore.model,
      systemPrompt: settingsStore.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      onChunk: (chunk) => {
        chatStore.appendToLastMessage(sessionId!, chunk)
      },
      onError: (error) => {
        console.error('Streaming error:', error)
        chatStore.updateLastMessage(sessionId!, 'Error: Failed to generate response')
        chatStore.finishStreaming()
      },
      onDone: () => {
        chatStore.finishStreaming()
      },
      signal: abortController.signal,
    })
  } catch (error) {
    console.error('Send message error:', error)
    chatStore.updateLastMessage(sessionId, 'Error: Failed to send message')
    chatStore.finishStreaming()
  }
}

export function stopStreaming(): void {
  const chatStore = useChatStore.getState()
  chatStore.finishStreaming()
}