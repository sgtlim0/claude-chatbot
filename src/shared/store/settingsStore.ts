import { create } from "zustand";
import { persist } from "zustand/middleware";

export const AVAILABLE_MODELS = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
] as const;

interface SettingsState {
  model: string;
  systemPrompt: string;
  temperature: number;
  setModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      model: "gpt-4o-mini",
      systemPrompt: "You are a helpful, friendly assistant. Answer concisely and clearly.",
      temperature: 0.7,
      setModel: (model) => set({ model }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setTemperature: (temperature) => set({ temperature }),
    }),
    {
      name: "ai-chat-settings",
    }
  )
);
