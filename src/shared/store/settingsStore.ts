import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const AVAILABLE_MODELS = [
  { id: 'us.anthropic.claude-sonnet-4-20250514-v1:0', name: 'Sonnet 4', description: 'Most capable coding model' },
  { id: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Sonnet 3.5', description: 'Fast and efficient' },
  { id: 'us.anthropic.claude-3-5-haiku-20241022-v1:0', name: 'Haiku 3.5', description: 'Quick responses, light tasks' },
] as const

interface SettingsStore {
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  setModel: (model: string) => void
  setSystemPrompt: (prompt: string) => void
  setTemperature: (temperature: number) => void
  setMaxTokens: (maxTokens: number) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      model: AVAILABLE_MODELS[0].id,
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 1024,

      setModel: (model) => set({ model }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
    }),
    {
      name: 'ai-chat-settings',
    }
  )
)
