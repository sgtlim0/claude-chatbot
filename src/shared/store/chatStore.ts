import { create } from 'zustand'
import { ChatSession, Message, TestResult } from '@/entities/message'
import { generateId } from '../lib/generateId'
import { getBrowserId } from '../lib/browserId'
import { migrateLocalStorage } from '../lib/migrateLocalStorage'
import * as sessionApi from '../api/sessionApi'

type RightPanel = null | 'settings' | 'test'

interface ChatStore {
  // State
  sessions: Record<string, ChatSession>
  activeSessionId: string | null
  isStreaming: boolean
  searchQuery: string
  browserId: string
  rightPanel: RightPanel
  testResults: TestResult[]

  // Actions
  initStore: () => Promise<void>
  createSession: () => Promise<void>
  switchSession: (id: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  addMessage: (sessionId: string, message: Message) => void
  appendToLastMessage: (sessionId: string, content: string) => void
  finishStreaming: () => void
  setStreaming: (isStreaming: boolean) => void
  setSearchQuery: (query: string) => void
  updateLastMessage: (sessionId: string, content: string) => void
  deleteMessage: (sessionId: string, messageId: string) => void
  setRightPanel: (panel: RightPanel) => void
  addTestResult: (result: TestResult) => void
  clearTestResults: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: {},
  activeSessionId: null,
  isStreaming: false,
  searchQuery: '',
  browserId: '',
  rightPanel: null,
  testResults: [],

  initStore: async () => {
    const browserId = getBrowserId()
    set({ browserId })

    // Migrate old localStorage data if exists
    await migrateLocalStorage(browserId)

    try {
      const sessions = await sessionApi.fetchSessions(browserId)
      const sessionsMap = sessions.reduce((acc, session) => {
        acc[session.id] = session
        return acc
      }, {} as Record<string, ChatSession>)

      set({ sessions: sessionsMap })

      // Set first session as active if exists
      if (sessions.length > 0) {
        set({ activeSessionId: sessions[0].id })
      }
    } catch (error) {
      console.error('Failed to initialize store:', error)
    }
  },

  createSession: async () => {
    const { browserId } = get()

    try {
      const newSession = await sessionApi.createSession(browserId)

      set((state) => ({
        sessions: {
          ...state.sessions,
          [newSession.id]: newSession,
        },
        activeSessionId: newSession.id,
      }))
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  },

  switchSession: async (id: string) => {
    const { sessions } = get()

    // If we don't have messages loaded, fetch them
    if (!sessions[id]?.messages || sessions[id].messages.length === 0) {
      try {
        const session = await sessionApi.fetchSession(id)
        set((state) => ({
          sessions: {
            ...state.sessions,
            [id]: session,
          },
          activeSessionId: id,
        }))
      } catch (error) {
        console.error('Failed to fetch session:', error)
        set({ activeSessionId: id })
      }
    } else {
      set({ activeSessionId: id })
    }
  },

  deleteSession: async (id: string) => {
    try {
      await sessionApi.deleteSession(id)

      set((state) => {
        const { [id]: deleted, ...remainingSessions } = state.sessions
        const sessionIds = Object.keys(remainingSessions)
        const newActiveId = state.activeSessionId === id
          ? (sessionIds.length > 0 ? sessionIds[0] : null)
          : state.activeSessionId

        return {
          sessions: remainingSessions,
          activeSessionId: newActiveId,
        }
      })
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  },

  renameSession: async (id: string, title: string) => {
    try {
      const updatedSession = await sessionApi.updateSession(id, { title })

      set((state) => ({
        sessions: {
          ...state.sessions,
          [id]: updatedSession,
        },
      }))
    } catch (error) {
      console.error('Failed to rename session:', error)
    }
  },

  togglePin: async (id: string) => {
    const { sessions } = get()
    const session = sessions[id]
    if (!session) return

    try {
      const updatedSession = await sessionApi.updateSession(id, {
        pinned: !session.pinned
      })

      set((state) => ({
        sessions: {
          ...state.sessions,
          [id]: updatedSession,
        },
      }))
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  },

  addMessage: (sessionId: string, message: Message) => {
    set((state) => {
      const session = state.sessions[sessionId]
      if (!session) return state

      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages: [...session.messages, message],
            updatedAt: Date.now(),
          },
        },
      }
    })
  },

  appendToLastMessage: (sessionId: string, content: string) => {
    set((state) => {
      const session = state.sessions[sessionId]
      if (!session || session.messages.length === 0) return state

      const messages = [...session.messages]
      const lastMessage = messages[messages.length - 1]

      if (lastMessage.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + content,
        }
      }

      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages,
            updatedAt: Date.now(),
          },
        },
      }
    })
  },

  updateLastMessage: (sessionId: string, content: string) => {
    set((state) => {
      const session = state.sessions[sessionId]
      if (!session || session.messages.length === 0) return state

      const messages = [...session.messages]
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content,
      }

      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages,
            updatedAt: Date.now(),
          },
        },
      }
    })
  },

  finishStreaming: () => {
    set({ isStreaming: false })
  },

  setStreaming: (isStreaming: boolean) => {
    set({ isStreaming })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  deleteMessage: (sessionId: string, messageId: string) => {
    set((state) => {
      const session = state.sessions[sessionId]
      if (!session) return state

      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages: session.messages.filter(msg => msg.id !== messageId),
            updatedAt: Date.now(),
          },
        },
      }
    })
  },

  setRightPanel: (panel: RightPanel) => {
    set({ rightPanel: panel })
  },

  addTestResult: (result: TestResult) => {
    set((state) => ({
      testResults: [result, ...state.testResults],
    }))
  },

  clearTestResults: () => {
    set({ testResults: [] })
  },
}))
