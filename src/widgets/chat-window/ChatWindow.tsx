'use client'

import React, { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MessageItem } from './MessageItem'
import { SkeletonLoader } from '../skeleton/SkeletonLoader'
import { Dots } from '@/shared/ui/Dots'
import { useChatStore } from '@/shared/store/chatStore'
import { STARTER_PROMPTS } from '@/shared/lib/constants'
import { sendMessage } from '@/features/send-message'

export function ChatWindow() {
  const { sessions, activeSessionId, isStreaming, searchQuery } = useChatStore()
  const parentRef = useRef<HTMLDivElement>(null)
  const session = activeSessionId ? sessions[activeSessionId] : null
  const messages = session?.messages || []

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
        behavior: 'smooth',
      })
    }
  }, [messages.length, virtualizer])

  const handleStarterPrompt = async (prompt: string) => {
    await sendMessage(prompt)
  }

  // Empty / welcome state
  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center aether-grid">
        <div className="text-center max-w-2xl mx-auto px-6 relative z-10">
          {/* Glyph */}
          <div
            className="text-5xl mb-4 text-accent"
            style={{ animation: 'float 4s ease-in-out infinite' }}
          >
            ◈
          </div>

          <h1 className="text-3xl font-serif font-bold mb-2 text-text-primary">
            Aether Chat
          </h1>
          <p className="text-text-secondary mb-8">
            What would you like to explore today?
          </p>

          {/* Starter prompt chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {STARTER_PROMPTS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleStarterPrompt(item.prompt)}
                className="px-4 py-2 rounded-full border border-border bg-bg-secondary hover:bg-bg-tertiary hover:border-accent/30 transition-colors text-[13px] text-text-secondary hover:text-text-primary cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div ref={parentRef} className="h-full overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = messages[virtualItem.index]
            const isLast = virtualItem.index === messages.length - 1

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {isLast && isStreaming && message.role === 'assistant' && message.content === '' ? (
                  <div className="max-w-3xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Dots /> Thinking...
                    </div>
                  </div>
                ) : (
                  <MessageItem message={message} searchQuery={searchQuery} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
