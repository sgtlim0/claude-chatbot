'use client'

import { X } from 'lucide-react'
import { useChatStore } from '@/shared/store/chatStore'
import { SettingsTab } from './SettingsTab'
import { TestTab } from './TestTab'

export function RightPanel() {
  const { rightPanel, setRightPanel } = useChatStore()

  if (!rightPanel) return null

  return (
    <aside className="w-[340px] min-w-[340px] bg-bg-secondary border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRightPanel('settings')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-colors ${
              rightPanel === 'settings'
                ? 'bg-accent/15 text-accent'
                : 'bg-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setRightPanel('test')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-colors ${
              rightPanel === 'test'
                ? 'bg-accent/15 text-accent'
                : 'bg-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Tests
          </button>
        </div>
        <button
          onClick={() => setRightPanel(null)}
          className="p-1.5 rounded-lg bg-transparent border-none text-text-muted hover:text-text-primary hover:bg-bg-tertiary cursor-pointer transition-colors"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {rightPanel === 'settings' && <SettingsTab />}
        {rightPanel === 'test' && <TestTab />}
      </div>
    </aside>
  )
}
