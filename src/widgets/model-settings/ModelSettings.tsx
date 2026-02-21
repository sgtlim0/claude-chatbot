import { useEffect, useRef } from "react";
import { useSettingsStore, AVAILABLE_MODELS } from "@/shared/store/settingsStore";
import { X } from "lucide-react";

interface ModelSettingsProps {
  onClose: () => void;
}

export function ModelSettings({ onClose }: ModelSettingsProps) {
  const { model, systemPrompt, temperature, setModel, setSystemPrompt, setTemperature } =
    useSettingsStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="bg-bg-primary border border-border rounded-2xl p-6 w-[440px] max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="m-0 text-base text-text-primary font-semibold">Settings</h2>
          <button
            className="bg-transparent border-none text-text-muted cursor-pointer p-1 rounded-lg hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
          Model
        </label>
        <select
          className="w-full p-2.5 bg-bg-secondary border border-border rounded-xl text-text-primary text-[13px] outline-none mb-5 focus:border-accent appearance-none cursor-pointer"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          aria-label="Select model"
        >
          {AVAILABLE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
          System Prompt
        </label>
        <textarea
          className="w-full p-3 bg-bg-secondary border border-border rounded-xl text-text-primary text-[13px] font-inherit outline-none resize-y min-h-[80px] mb-5 focus:border-accent"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Customize the assistant's behavior..."
          aria-label="System prompt"
        />

        <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
          Temperature: {temperature}
        </label>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[11px] text-text-muted">Precise</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="flex-1 accent-accent h-1.5"
            aria-label="Temperature"
          />
          <span className="text-[11px] text-text-muted">Creative</span>
        </div>

        <div className="flex justify-end">
          <button
            className="px-5 py-2 rounded-xl text-[13px] cursor-pointer border-none bg-text-primary text-white hover:bg-text-secondary transition-colors"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
