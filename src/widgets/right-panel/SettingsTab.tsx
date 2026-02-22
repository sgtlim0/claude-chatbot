'use client'

import { useSettingsStore, AVAILABLE_MODELS } from '@/shared/store/settingsStore'
import { SectionLabel } from '@/shared/ui/SectionLabel'

export function SettingsTab() {
  const {
    model, systemPrompt, temperature, maxTokens,
    setModel, setSystemPrompt, setTemperature, setMaxTokens,
  } = useSettingsStore()

  return (
    <div className="space-y-5">
      {/* Model */}
      <div>
        <SectionLabel>Model</SectionLabel>
        <div className="space-y-1.5">
          {AVAILABLE_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                m.id === model
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-border bg-bg-tertiary text-text-secondary hover:border-border hover:bg-bg-tertiary/80'
              }`}
            >
              <div className="text-[13px] font-medium">{m.name}</div>
              <div className="text-[11px] text-text-muted mt-0.5">{m.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <SectionLabel>System Prompt</SectionLabel>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Customize assistant behavior..."
          className="w-full p-3 bg-bg-tertiary border border-border rounded-lg text-text-primary text-[13px] resize-y min-h-[80px] focus:outline-none focus:border-accent/40 placeholder:text-text-muted transition-colors"
        />
      </div>

      {/* Temperature */}
      <div>
        <SectionLabel>Temperature: {temperature.toFixed(1)}</SectionLabel>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-text-muted font-mono">0.0</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="flex-1 h-1.5 accent-accent"
            aria-label="Temperature"
          />
          <span className="text-[11px] text-text-muted font-mono">2.0</span>
        </div>
        <div className="flex justify-between text-[10px] text-text-muted mt-1">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div>
        <SectionLabel>Max Tokens: {maxTokens}</SectionLabel>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-text-muted font-mono">256</span>
          <input
            type="range"
            min="256"
            max="4096"
            step="256"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="flex-1 h-1.5 accent-accent"
            aria-label="Max tokens"
          />
          <span className="text-[11px] text-text-muted font-mono">4096</span>
        </div>
      </div>
    </div>
  )
}
