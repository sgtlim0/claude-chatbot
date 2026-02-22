"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/widgets/sidebar/Sidebar";
import { ChatWindow } from "@/widgets/chat-window/ChatWindow";
import { MessageInput } from "@/widgets/message-input/MessageInput";
import { RightPanel } from "@/widgets/right-panel/RightPanel";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useChatStore } from "@/shared/store/chatStore";
import { useSettingsStore, AVAILABLE_MODELS } from "@/shared/store/settingsStore";
import {
  exportSessionMarkdown,
  exportSessionJson,
  exportAllSessionsJson,
} from "@/features/export-chat/exportChat";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Settings,
  FlaskConical,
  Download,
  FileText,
  FileJson,
  Radio,
} from "lucide-react";

export default function ChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { sessions, activeSessionId, isStreaming, rightPanel, setRightPanel, initStore } = useChatStore();
  const { model } = useSettingsStore();
  const activeSession = activeSessionId ? sessions[activeSessionId] : null;
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === model) || AVAILABLE_MODELS[0];

  useEffect(() => {
    initStore();
  }, [initStore]);

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative aether-grid">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-2 bg-bg-primary/80 backdrop-blur-sm border-b border-border relative z-10">
          <div className="flex items-center gap-2">
            <button
              className="bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded-lg hover:bg-bg-tertiary hover:text-text-primary transition-colors"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Model badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-tertiary rounded-lg">
              <span className="text-[12px] font-mono text-text-secondary">
                {currentModel.name}
              </span>
            </div>

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 rounded-lg">
                <Radio size={12} className="text-accent animate-pulse" />
                <span className="text-[11px] text-accent font-mono">Streaming</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Export dropdown */}
            <div className="relative">
              <button
                className="bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded-lg hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                onClick={() => setShowExport((v) => !v)}
                aria-label="Export options"
              >
                <Download size={16} />
              </button>
              {showExport && (
                <div className="absolute top-full right-0 mt-1 bg-bg-secondary border border-border rounded-xl p-1.5 min-w-[180px] z-50 shadow-lg">
                  {activeSession && (
                    <>
                      <button
                        className="w-full bg-transparent border-none text-text-primary px-3 py-2 text-[13px] cursor-pointer rounded-lg flex items-center gap-2 hover:bg-bg-tertiary transition-colors"
                        onClick={() => {
                          exportSessionMarkdown(activeSession);
                          setShowExport(false);
                        }}
                      >
                        <FileText size={14} className="text-text-muted" /> Markdown
                      </button>
                      <button
                        className="w-full bg-transparent border-none text-text-primary px-3 py-2 text-[13px] cursor-pointer rounded-lg flex items-center gap-2 hover:bg-bg-tertiary transition-colors"
                        onClick={() => {
                          exportSessionJson(activeSession);
                          setShowExport(false);
                        }}
                      >
                        <FileJson size={14} className="text-text-muted" /> JSON
                      </button>
                    </>
                  )}
                  <button
                    className="w-full bg-transparent border-none text-text-primary px-3 py-2 text-[13px] cursor-pointer rounded-lg flex items-center gap-2 hover:bg-bg-tertiary transition-colors"
                    onClick={() => {
                      exportAllSessionsJson(sessions);
                      setShowExport(false);
                    }}
                  >
                    <Download size={14} className="text-text-muted" /> Export all
                  </button>
                </div>
              )}
            </div>

            {/* Config toggle */}
            <button
              className={`bg-transparent border-none cursor-pointer p-1.5 rounded-lg transition-colors ${
                rightPanel === "settings"
                  ? "text-accent bg-accent/10"
                  : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
              }`}
              onClick={() => setRightPanel(rightPanel === "settings" ? null : "settings")}
              aria-label="Toggle settings"
            >
              <Settings size={16} />
            </button>

            {/* Tests toggle */}
            <button
              className={`bg-transparent border-none cursor-pointer p-1.5 rounded-lg transition-colors ${
                rightPanel === "test"
                  ? "text-accent bg-accent/10"
                  : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
              }`}
              onClick={() => setRightPanel(rightPanel === "test" ? null : "test")}
              aria-label="Toggle tests"
            >
              <FlaskConical size={16} />
            </button>
          </div>
        </header>

        {/* Chat area */}
        <ErrorBoundary>
          <ChatWindow />
        </ErrorBoundary>
        <ErrorBoundary>
          <MessageInput />
        </ErrorBoundary>
      </div>

      {/* Right Panel */}
      <RightPanel />
    </div>
  );
}
