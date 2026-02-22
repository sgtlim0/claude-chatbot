'use client'

import React, { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import { Copy, Check, Edit2, Trash2, RotateCcw } from 'lucide-react'
import { Message } from '@/entities/message'
import { useChatStore } from '@/shared/store/chatStore'
import { sendMessage } from '@/features/send-message'
import { Highlight } from '@/features/search/Highlight'
import '@/app/highlight.css'

interface MessageItemProps {
  message: Message
  searchQuery?: string
}

export const MessageItem = memo(function MessageItem({ message, searchQuery = '' }: MessageItemProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const { activeSessionId, deleteMessage, isStreaming } = useChatStore()

  const isUser = message.role === 'user'
  const isCurrentlyStreaming = isStreaming && !isUser && message.content.length > 0
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    if (activeSessionId) {
      deleteMessage(activeSessionId, message.id)
    }
  }

  const handleRetry = async () => {
    if (message.role === 'user') {
      await sendMessage(message.content)
    }
  }

  const handleEdit = async () => {
    if (isEditing && editContent !== message.content && activeSessionId) {
      const session = useChatStore.getState().sessions[activeSessionId]
      const messageIndex = session.messages.findIndex(m => m.id === message.id)

      for (let i = session.messages.length - 1; i >= messageIndex; i--) {
        deleteMessage(activeSessionId, session.messages[i].id)
      }

      await sendMessage(editContent)
    }
    setIsEditing(!isEditing)
  }

  return (
    <div
      className={`group px-6 py-4 ${
        isUser ? 'bg-transparent' : 'bg-bg-secondary/50'
      }`}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
              isUser
                ? 'bg-user-bubble text-accent'
                : 'bg-accent/20 text-accent'
            }`}
          >
            {isUser ? 'U' : 'A'}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-medium text-text-primary">
                {isUser ? 'You' : 'Aether'}
              </span>
              <span className="text-[11px] text-text-muted">{time}</span>
              {message.model && (
                <span className="text-[10px] text-text-muted font-mono bg-bg-tertiary px-1.5 py-0.5 rounded">
                  {message.model.split('.').pop()?.split('-').slice(0, 2).join(' ') || message.model}
                </span>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-bg-input text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 text-[14px]"
                rows={4}
                autoFocus
              />
            ) : (
              <div className={`prose prose-sm max-w-none prose-dark ${isCurrentlyStreaming ? 'streaming-cursor' : ''}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeSanitize]}
                  components={{
                    pre: ({ children }) => (
                      <pre className="bg-[#0a0f1a] text-gray-100 rounded-lg p-4 overflow-x-auto border border-border">
                        {children}
                      </pre>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isInline = !className
                      return isInline ? (
                        <code className="bg-bg-tertiary text-accent px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-bg-tertiary transition-colors bg-transparent border-none cursor-pointer"
                title="Copy"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-text-muted" />
                )}
              </button>

              {isUser && (
                <button
                  onClick={handleEdit}
                  className="p-1.5 rounded hover:bg-bg-tertiary transition-colors bg-transparent border-none cursor-pointer"
                  title={isEditing ? 'Save' : 'Edit'}
                >
                  <Edit2 className="w-3.5 h-3.5 text-text-muted" />
                </button>
              )}

              <button
                onClick={handleRetry}
                className="p-1.5 rounded hover:bg-bg-tertiary transition-colors bg-transparent border-none cursor-pointer"
                title="Retry"
              >
                <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
              </button>

              <button
                onClick={handleDelete}
                className="p-1.5 rounded hover:bg-bg-tertiary transition-colors bg-transparent border-none cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5 text-text-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
