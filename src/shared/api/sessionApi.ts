import { ChatSession } from '@/entities/message'
import { ApiError } from '../lib/errors'

export async function fetchSessions(browserId: string): Promise<ChatSession[]> {
  const response = await fetch(`/api/sessions?browser_id=${browserId}`)

  if (!response.ok) {
    throw new ApiError(`Failed to fetch sessions: ${response.statusText}`, response.status)
  }

  return response.json()
}

export async function fetchSession(id: string): Promise<ChatSession> {
  const response = await fetch(`/api/sessions/${id}`)

  if (!response.ok) {
    throw new ApiError(`Failed to fetch session: ${response.statusText}`, response.status)
  }

  return response.json()
}

export async function createSession(browserId: string): Promise<ChatSession> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      browser_id: browserId,
      title: '새 대화',
    }),
  })

  if (!response.ok) {
    throw new ApiError(`Failed to create session: ${response.statusText}`, response.status)
  }

  return response.json()
}

export async function updateSession(id: string, data: Partial<ChatSession>): Promise<ChatSession> {
  const response = await fetch(`/api/sessions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new ApiError(`Failed to update session: ${response.statusText}`, response.status)
  }

  return response.json()
}

export async function deleteSession(id: string): Promise<void> {
  const response = await fetch(`/api/sessions/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 204) {
    throw new ApiError(`Failed to delete session: ${response.statusText}`, response.status)
  }
}