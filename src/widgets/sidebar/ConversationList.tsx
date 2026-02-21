/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useChatStore } from "@/shared/store/chatStore";
import { theme } from "@/shared/ui/theme";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { isToday, isYesterday, isThisWeek, isThisMonth, format } from "date-fns";
import type { ChatSession } from "@/entities/message/model";

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
`;

const GroupLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  padding: 12px 12px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Item = styled.div<{ active: boolean }>`
  padding: 10px 12px;
  margin-bottom: 2px;
  border-radius: ${theme.radius.md};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${(p) => (p.active ? theme.colors.sidebarActive : "transparent")};
  &:hover {
    background: ${(p) =>
      p.active ? theme.colors.sidebarActive : theme.colors.sidebarHover};
  }
`;

const Title = styled.span`
  font-size: 13px;
  color: ${theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const PinIcon = styled.span`
  color: ${theme.colors.accent};
  margin-right: 4px;
  display: flex;
  align-items: center;
`;

const Actions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  ${Item}:hover & {
    opacity: 1;
  }
`;

const ActionBtn = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  &:hover {
    color: ${theme.colors.textPrimary};
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DeleteBtn = styled(ActionBtn)`
  &:hover {
    color: ${theme.colors.danger};
    background: rgba(239, 68, 68, 0.1);
  }
`;

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
      <List>
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: theme.colors.textMuted,
            fontSize: "13px",
          }}
        >
          No conversations yet
        </div>
      </List>
    );
  }

  const groups = groupSessions(allSessions);

  return (
    <List>
      {groups.map((group) => (
        <div key={group.label}>
          <GroupLabel>{group.label}</GroupLabel>
          {group.items.map((session) => (
            <Item
              key={session.id}
              active={session.id === activeSessionId}
              onClick={() => switchSession(session.id)}
            >
              {session.pinned && (
                <PinIcon>
                  <Pin size={12} />
                </PinIcon>
              )}
              <Title>{session.title}</Title>
              <Actions>
                <ActionBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(session.id);
                  }}
                  title={session.pinned ? "Unpin" : "Pin"}
                >
                  {session.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                </ActionBtn>
                <DeleteBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </DeleteBtn>
              </Actions>
            </Item>
          ))}
        </div>
      ))}
    </List>
  );
}
