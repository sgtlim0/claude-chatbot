'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import { useChatStore } from '@/shared/store/chatStore'
import { useSettingsStore, AVAILABLE_MODELS } from '@/shared/store/settingsStore'
import { sendMessage, stopStreaming } from '@/features/send-message'

export function MessageInput() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isStreaming } = useChatStore()
  const { model } = useSettingsStore()

  const currentModel = AVAILABLE_MODELS.find(m => m.id === model) || AVAILABLE_MODELS[0]

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isStreaming) {
      const message = input.trim()
      setInput('')
      await sendMessage(message)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleStop = () => {
    stopStreaming()
  }

  return (
    <div className="border-t border-border bg-bg-primary">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
        <div className="relative bg-bg-secondary border border-border rounded-xl overflow-hidden focus-within:border-accent/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="w-full p-4 pr-16 bg-transparent text-text-primary resize-none focus:outline-none min-h-[56px] max-h-[200px] text-[14px] placeholder:text-text-muted border-none"
            disabled={isStreaming}
            rows={1}
          />

          <div className="absolute right-3 bottom-3">
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                className="p-2 bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors border-none cursor-pointer"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 bg-accent text-bg-primary rounded-lg hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-none cursor-pointer font-semibold"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Model hint */}
        <div className="text-center mt-2">
          <span className="text-[11px] text-text-muted font-mono">
            {currentModel.name}
          </span>
        </div>
      </form>
    </div>
  )
}
