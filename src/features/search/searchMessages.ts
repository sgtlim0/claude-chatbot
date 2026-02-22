import { ChatSession, Message } from '@/entities/message'

export interface SearchResult {
  sessionId: string
  sessionTitle: string
  message: Message
  matchedText: string
}

export function searchMessages(
  sessions: Record<string, ChatSession>,
  query: string
): SearchResult[] {
  if (!query.trim()) return []

  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()

  for (const [sessionId, session] of Object.entries(sessions)) {
    for (const message of session.messages) {
      if (message.content.toLowerCase().includes(lowerQuery)) {
        results.push({
          sessionId,
          sessionTitle: session.title,
          message,
          matchedText: getMatchedText(message.content, query),
        })
      }
    }
  }

  return results
}

function getMatchedText(content: string, query: string): string {
  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerContent.indexOf(lowerQuery)

  if (index === -1) return content.slice(0, 100)

  const start = Math.max(0, index - 50)
  const end = Math.min(content.length, index + query.length + 50)
  let text = content.slice(start, end)

  if (start > 0) text = '...' + text
  if (end < content.length) text = text + '...'

  return text
}