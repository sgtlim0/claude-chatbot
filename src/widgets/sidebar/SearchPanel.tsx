/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useChatStore } from "@/shared/store/chatStore";
import { searchMessages } from "@/features/search/searchMessages";
import { theme } from "@/shared/ui/theme";

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
`;

const ResultItem = styled.div`
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: ${theme.radius.md};
  cursor: pointer;
  &:hover {
    background: ${theme.colors.sidebarHover};
  }
`;

const SessionTitle = styled.div`
  font-size: 11px;
  color: ${theme.colors.accent};
  margin-bottom: 4px;
`;

const Snippet = styled.div`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NoResults = styled.div`
  padding: 20px;
  text-align: center;
  color: ${theme.colors.textMuted};
  font-size: 13px;
`;

interface SearchPanelProps {
  onClose: () => void;
}

export function SearchPanel({ onClose }: SearchPanelProps) {
  const { sessions, searchQuery, switchSession } = useChatStore();
  const results = searchMessages(sessions, searchQuery);

  if (results.length === 0) {
    return (
      <Container>
        <NoResults>No results found</NoResults>
      </Container>
    );
  }

  return (
    <Container>
      {results.slice(0, 50).map((r, i) => (
        <ResultItem
          key={`${r.sessionId}-${r.message.id}-${i}`}
          onClick={() => {
            switchSession(r.sessionId);
            onClose();
          }}
        >
          <SessionTitle>{r.sessionTitle}</SessionTitle>
          <Snippet>{r.message.content.slice(0, 80)}</Snippet>
        </ResultItem>
      ))}
    </Container>
  );
}
