import { useChatStore } from "@/shared/store/chatStore";
import { ConversationList } from "./ConversationList";
import { SearchPanel } from "./SearchPanel";
import { useState, useCallback } from "react";
import {
  Plus,
  Search,
  MessageSquare,
  FolderOpen,
  FileCode,
  Sparkles,
} from "lucide-react";
import { debounce } from "@/shared/lib/debounce";

interface SidebarProps {
  collapsed: boolean;
}

const NAV_ITEMS = [
  { icon: MessageSquare, label: "Chats", id: "chats" },
  { icon: FolderOpen, label: "Projects", id: "projects" },
  { icon: Sparkles, label: "Artifacts", id: "artifacts" },
  { icon: FileCode, label: "Code", id: "code" },
] as const;

export function Sidebar({ collapsed }: SidebarProps) {
  const { createSession, searchQuery, setSearchQuery } = useChatStore();
  const [showSearch, setShowSearch] = useState(false);
  const [activeNav, setActiveNav] = useState<string>("chats");

  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
      setShowSearch(value.length > 0);
    }, 300),
    [setSearchQuery]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearch(value);
    if (value.length === 0) {
      setShowSearch(false);
    }
  };

  return (
    <aside
      className={`bg-sidebar-bg flex flex-col overflow-hidden transition-all duration-200 border-r border-border ${
        collapsed ? "w-0 min-w-0" : "w-[260px] min-w-[260px]"
      }`}
    >
      {/* New Chat + Search */}
      <div className="px-3 pt-3 pb-1 flex flex-col gap-1">
        <button
          className="w-full py-2 px-3 bg-transparent text-text-primary border-none rounded-lg text-[13px] font-medium cursor-pointer flex items-center gap-2.5 hover:bg-sidebar-hover transition-colors"
          onClick={() => createSession()}
          aria-label="New chat"
        >
          <Plus size={16} className="text-text-secondary" />
          New Chat
        </button>
        <button
          className="w-full py-2 px-3 bg-transparent text-text-primary border-none rounded-lg text-[13px] font-medium cursor-pointer flex items-center gap-2.5 hover:bg-sidebar-hover transition-colors"
          onClick={() => setShowSearch(true)}
          aria-label="Search"
        >
          <Search size={16} className="text-text-secondary" />
          Search
        </button>
      </div>

      {/* Nav Items */}
      <nav className="px-3 py-1 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            className={`w-full py-2 px-3 border-none rounded-lg text-[13px] cursor-pointer flex items-center gap-2.5 transition-colors ${
              activeNav === id
                ? "bg-sidebar-active text-text-primary font-medium"
                : "bg-transparent text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
            }`}
            onClick={() => setActiveNav(id)}
            aria-label={label}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mx-3 my-2 border-t border-border" />

      {/* Search input (expandable) */}
      {showSearch && (
        <div className="relative mx-3 mb-2">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted flex items-center">
            <Search size={14} />
          </span>
          <input
            className="w-full py-2 pr-3 pl-8 bg-bg-primary border border-border rounded-lg text-text-primary text-[13px] outline-none placeholder:text-text-muted focus:border-accent"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search messages"
            autoFocus
          />
        </div>
      )}

      {/* Recent Activity / Conversation List */}
      <div className="px-3 mb-1">
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider px-3">
          Recent
        </span>
      </div>

      {showSearch && searchQuery ? (
        <SearchPanel
          onClose={() => {
            setShowSearch(false);
            setSearchQuery("");
          }}
        />
      ) : (
        <ConversationList />
      )}
    </aside>
  );
}
