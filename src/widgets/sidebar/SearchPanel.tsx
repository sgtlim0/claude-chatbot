import { useChatStore } from "@/shared/store/chatStore";
import { searchMessages } from "@/features/search/searchMessages";

interface SearchPanelProps {
  onClose: () => void;
}

export function SearchPanel({ onClose }: SearchPanelProps) {
  const { sessions, searchQuery, switchSession } = useChatStore();
  const results = searchMessages(sessions, searchQuery);

  if (results.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-3">
        <div className="py-8 text-center text-text-muted text-[13px]">
          No results found
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-1.5" role="list">
      {results.slice(0, 50).map((r, i) => (
        <div
          key={`${r.sessionId}-${r.message.id}-${i}`}
          role="listitem"
          className="px-3 py-2 mx-1.5 mb-px rounded-lg cursor-pointer hover:bg-sidebar-hover transition-colors"
          onClick={() => {
            switchSession(r.sessionId);
            onClose();
          }}
        >
          <div className="text-[11px] text-accent mb-0.5 font-medium">{r.sessionTitle}</div>
          <div className="text-[12px] text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap">
            {r.message.content.slice(0, 80)}
          </div>
        </div>
      ))}
    </div>
  );
}
