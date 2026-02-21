import { useChatStore } from "@/shared/store/chatStore";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { isToday, isYesterday, isThisWeek, isThisMonth, format } from "date-fns";
import type { ChatSession } from "@/entities/message/model";

function getDateGroup(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return "This Week";
  if (isThisMonth(date)) return "This Month";
  return format(date, "MMMM yyyy");
}

function groupSessions(sessions: ChatSession[]): { label: string; items: ChatSession[] }[] {
  const pinned = sessions.filter((s) => s.pinned);
  const unpinned = sessions.filter((s) => !s.pinned);

  const groups: { label: string; items: ChatSession[] }[] = [];

  if (pinned.length > 0) {
    groups.push({ label: "Pinned", items: pinned.sort((a, b) => b.createdAt - a.createdAt) });
  }

  const dateGroups: Record<string, ChatSession[]> = {};
  for (const s of unpinned.sort((a, b) => b.createdAt - a.createdAt)) {
    const group = getDateGroup(s.createdAt);
    if (!dateGroups[group]) dateGroups[group] = [];
    dateGroups[group].push(s);
  }

  for (const [label, items] of Object.entries(dateGroups)) {
    groups.push({ label, items });
  }

  return groups;
}

export function ConversationList() {
  const { sessions, activeSessionId, switchSession, deleteSession, togglePin } =
    useChatStore();

  const allSessions = Object.values(sessions);

  if (allSessions.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-3" role="list">
        <div className="py-8 text-center text-text-muted text-[13px]">
          No conversations yet
        </div>
      </div>
    );
  }

  const groups = groupSessions(allSessions);

  return (
    <div className="flex-1 overflow-y-auto px-1.5" role="list">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="text-[11px] font-medium text-text-muted px-3 pt-3 pb-1 tracking-wide">
            {group.label}
          </div>
          {group.items.map((session) => (
            <div
              key={session.id}
              role="listitem"
              className={`flex items-center justify-between px-3 py-2 mx-1.5 mb-px rounded-lg cursor-pointer group/item transition-colors ${
                session.id === activeSessionId
                  ? "bg-sidebar-active"
                  : "hover:bg-sidebar-hover"
              }`}
              onClick={() => switchSession(session.id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                {session.pinned && (
                  <span className="text-accent mr-1.5 flex items-center">
                    <Pin size={11} />
                  </span>
                )}
                <span className="text-[13px] text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
                  {session.title}
                </span>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <button
                  className="bg-transparent border-none text-text-muted cursor-pointer p-1 rounded flex items-center hover:text-text-primary hover:bg-black/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(session.id);
                  }}
                  title={session.pinned ? "Unpin" : "Pin"}
                  aria-label={session.pinned ? "Unpin conversation" : "Pin conversation"}
                >
                  {session.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
                <button
                  className="bg-transparent border-none text-text-muted cursor-pointer p-1 rounded flex items-center hover:text-danger hover:bg-danger/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  title="Delete"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
