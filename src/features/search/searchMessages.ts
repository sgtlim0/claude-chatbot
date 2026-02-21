import type { ChatSession, Message } from "@/entities/message/model";

export interface SearchResult {
  sessionId: string;
  sessionTitle: string;
  message: Message;
}

export function searchMessages(
  sessions: Record<string, ChatSession>,
  query: string
): SearchResult[] {
  if (!query.trim()) return [];

  const lower = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const session of Object.values(sessions)) {
    for (const msg of session.messages) {
      if (msg.content.toLowerCase().includes(lower)) {
        results.push({
          sessionId: session.id,
          sessionTitle: session.title,
          message: msg,
        });
      }
    }
  }

  return results.sort((a, b) => b.message.timestamp - a.message.timestamp);
}
