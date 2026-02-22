export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  timestamp: number
  model?: string
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  pinned: boolean
  updatedAt: number
}

export interface TestResult {
  id: string
  label: string
  prompt: string
  response: string
  latencyMs: number
  tokenCount: number
  status: 'pass' | 'fail' | 'error'
  timestamp: number
  model: string
}
