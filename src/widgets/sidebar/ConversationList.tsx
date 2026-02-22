'use client'

import React from 'react'
import { MessageSquare, Pin, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useChatStore } from '@/shared/store/chatStore'
import { useSettingsStore, AVAILABLE_MODELS } from '@/shared/store/settingsStore'
import { Highlight } from '@/features/search/Highlight'

interface ConversationListProps {
  searchQuery: string
}

export function ConversationList({ searchQuery }: ConversationListProps) {
  const { sessions, activeSessionId, switchSession, deleteSession, togglePin } = useChatStore()

  const sortedSessions = Object.values(sessions)
    .filter((session) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        session.title.toLowerCase().includes(q) ||
        session.messages.some((m) => m.content.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Delete this conversation?')) {
      deleteSession(id)
    }
  }

  const handlePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    togglePin(id)
  }

  if (sortedSessions.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-text-muted">
          {searchQuery ? 'No results found' : 'No conversations yet'}
        </p>
      </div>
    )
  }

  return (
    <div className="px-2 py-1">
      {sortedSessions.map((session) => {
        const isActive = session.id === activeSessionId
        const relativeTime = formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })

        return (
          <button
            key={session.id}
            onClick={() => switchSession(session.id)}
            className={`w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg transition-colors text-left group mb-0.5 border-none cursor-pointer ${
              isActive
                ? 'bg-sidebar-active border-l-2 border-l-accent'
                : 'bg-transparent hover:bg-sidebar-hover'
            }`}
          >
            {session.pinned && (
              <Pin className="w-3 h-3 text-accent fill-current flex-shrink-0 mt-1" />
            )}
            {!session.pinned && (
              <MessageSquare className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <div className={`text-[13px] truncate ${isActive ? 'text-accent font-medium' : 'text-text-primary'}`}>
                <Highlight text={session.title} query={searchQuery} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-text-muted">
                  {session.messages.length} msgs
                </span>
                <span className="text-[11px] text-text-muted">
                  {relativeTime}
                </span>
              </div>
            </div>

            {/* Hover actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={(e) => handlePin(e, session.id)}
                className="p-1 rounded hover:bg-bg-tertiary bg-transparent border-none cursor-pointer"
                aria-label={session.pinned ? 'Unpin' : 'Pin'}
              >
                <Pin className={`w-3 h-3 ${session.pinned ? 'text-accent' : 'text-text-muted'}`} />
              </button>
              <button
                onClick={(e) => handleDelete(e, session.id)}
                className="p-1 rounded hover:bg-bg-tertiary bg-transparent border-none cursor-pointer"
                aria-label="Delete"
              >
                <Trash2 className="w-3 h-3 text-text-muted hover:text-danger" />
              </button>
            </div>
          </button>
        )
      })}
    </div>
  )
}
