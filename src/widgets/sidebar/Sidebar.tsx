/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useChatStore } from "@/shared/store/chatStore";
import { theme } from "@/shared/ui/theme";
import { ConversationList } from "./ConversationList";
import { SearchPanel } from "./SearchPanel";
import { useState } from "react";
import { Plus, Search } from "lucide-react";

const Container = styled.aside<{ collapsed: boolean }>`
  width: ${(p) => (p.collapsed ? "0" : "280px")};
  min-width: ${(p) => (p.collapsed ? "0" : "280px")};
  background: ${theme.colors.sidebarBg};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s, min-width 0.2s;
  border-right: 1px solid ${theme.colors.border};
`;

const Header = styled.div`
  padding: 16px;
  display: flex;
  gap: 8px;
`;

const NewChatBtn = styled.button`
  flex: 1;
  padding: 10px 16px;
  background: ${theme.colors.accent};
  color: white;
  border: none;
  border-radius: ${theme.radius.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  &:hover {
    background: ${theme.colors.accentHover};
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  margin: 0 16px 12px;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textMuted};
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 14px 10px 34px;
  background: ${theme.colors.bgTertiary};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.textPrimary};
  font-size: 13px;
  outline: none;
  &::placeholder {
    color: ${theme.colors.textMuted};
  }
  &:focus {
    border-color: ${theme.colors.accent};
  }
`;

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { createSession, searchQuery, setSearchQuery } = useChatStore();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <Container collapsed={collapsed}>
      <Header>
        <NewChatBtn onClick={() => createSession()}>
          <Plus size={16} /> New Chat
        </NewChatBtn>
      </Header>

      <SearchWrapper>
        <SearchIcon>
          <Search size={14} />
        </SearchIcon>
        <SearchInput
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearch(e.target.value.length > 0);
          }}
        />
      </SearchWrapper>

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
    </Container>
  );
}
