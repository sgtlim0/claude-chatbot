/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useChatStore } from "@/shared/store/chatStore";
import { theme } from "@/shared/ui/theme";

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
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

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  ${Item}:hover & {
    opacity: 1;
  }
  &:hover {
    color: ${theme.colors.danger};
    background: rgba(239, 68, 68, 0.1);
  }
`;

export function ConversationList() {
  const { sessions, activeSessionId, switchSession, deleteSession } =
    useChatStore();

  const sorted = Object.values(sessions).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  if (sorted.length === 0) {
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

  return (
    <List>
      {sorted.map((session) => (
        <Item
          key={session.id}
          active={session.id === activeSessionId}
          onClick={() => switchSession(session.id)}
        >
          <Title>{session.title}</Title>
          <DeleteBtn
            onClick={(e) => {
              e.stopPropagation();
              deleteSession(session.id);
            }}
          >
            ×
          </DeleteBtn>
        </Item>
      ))}
    </List>
  );
}
