import { ChatSession } from '@/entities/message'

export async function migrateLocalStorage(browserId: string): Promise<void> {
  const raw = localStorage.getItem('ai-chat-sessions')
  if (!raw) return

  try {
    const data = JSON.parse(raw)
    const sessions = data.state?.sessions || {}

    for (const session of Object.values(sessions) as ChatSession[]) {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...session,
          browser_id: browserId,
        }),
      })
    }

    // Remove old localStorage data after successful migration
    localStorage.removeItem('ai-chat-sessions')
    console.log('Successfully migrated localStorage data to backend')
  } catch (error) {
    console.error('Failed to migrate localStorage:', error)
  }
}