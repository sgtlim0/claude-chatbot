"use client";

import { useChatStore } from "@/shared/store/chatStore";
import { ConversationList } from "./ConversationList";
import { useState, useCallback } from "react";
import { Plus, Search, Settings, FlaskConical } from "lucide-react";
import { debounce } from "@/shared/lib/debounce";

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { createSession, searchQuery, setSearchQuery, setRightPanel } = useChatStore();
  const [localSearch, setLocalSearch] = useState("");

  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    [setSearchQuery]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSetSearch(value);
  };

  return (
    <aside
      className={`bg-sidebar-bg flex flex-col overflow-hidden transition-all duration-200 border-r border-border ${
        collapsed ? "w-0 min-w-0" : "w-[260px] min-w-[260px]"
      }`}
    >
      {/* Brand */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{
            background: "linear-gradient(135deg, #e8a838, #d4952e)",
            animation: "pulse-glow 3s ease-in-out infinite",
          }}
        >
          <span className="text-bg-primary">◈</span>
        </div>
        <span className="text-[15px] font-semibold text-text-primary font-serif">
          Aether Chat
        </span>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-1 pb-1">
        <button
          className="w-full py-2 px-3 bg-transparent text-accent border border-accent/20 rounded-lg text-[13px] font-medium cursor-pointer flex items-center gap-2.5 amber-glow hover:bg-accent/5 transition-colors"
          onClick={() => createSession()}
          aria-label="New chat"
        >
          <Plus size={16} />
          New chat
        </button>
      </div>

      {/* Search input (always visible) */}
      <div className="relative mx-3 my-2">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted flex items-center">
          <Search size={14} />
        </span>
        <input
          className="w-full py-2 pr-3 pl-8 bg-bg-secondary border border-border rounded-lg text-text-primary text-[13px] outline-none placeholder:text-text-muted focus:border-accent/50 transition-colors"
          placeholder="Search conversations..."
          value={localSearch}
          onChange={handleSearchChange}
          aria-label="Search messages"
        />
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList searchQuery={searchQuery} />
      </div>

      {/* Footer buttons */}
      <div className="px-3 py-2 border-t border-border flex gap-2">
        <button
          className="flex-1 py-2 px-3 bg-transparent text-text-secondary border-none rounded-lg text-[12px] cursor-pointer flex items-center justify-center gap-1.5 hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          onClick={() => setRightPanel("settings")}
          aria-label="Settings"
        >
          <Settings size={14} />
          Config
        </button>
        <button
          className="flex-1 py-2 px-3 bg-transparent text-text-secondary border-none rounded-lg text-[12px] cursor-pointer flex items-center justify-center gap-1.5 hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          onClick={() => setRightPanel("test")}
          aria-label="Tests"
        >
          <FlaskConical size={14} />
          Tests
        </button>
      </div>
    </aside>
  );
}
