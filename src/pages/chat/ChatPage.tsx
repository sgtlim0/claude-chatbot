/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useState } from "react";
import { Sidebar } from "@/widgets/sidebar/Sidebar";
import { ChatWindow } from "@/widgets/chat-window/ChatWindow";
import { MessageInput } from "@/widgets/message-input/MessageInput";
import { ModelSettings } from "@/widgets/model-settings/ModelSettings";
import { useSettingsStore } from "@/shared/store/settingsStore";
import { theme } from "@/shared/ui/theme";

const Layout = styled.div`
  display: flex;
  height: 100vh;
  background: ${theme.colors.bgPrimary};
  color: ${theme.colors.textPrimary};
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgPrimary};
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToggleBtn = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.textSecondary};
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: ${theme.radius.sm};
  &:hover {
    background: ${theme.colors.bgTertiary};
    color: ${theme.colors.textPrimary};
  }
`;

const ModelBadge = styled.span`
  font-size: 12px;
  padding: 4px 10px;
  background: ${theme.colors.bgTertiary};
  border-radius: 20px;
  color: ${theme.colors.textSecondary};
`;

const SettingsBtn = styled.button`
  background: none;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textSecondary};
  padding: 6px 14px;
  border-radius: ${theme.radius.md};
  font-size: 13px;
  cursor: pointer;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;

export function ChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const model = useSettingsStore((s) => s.model);

  return (
    <Layout>
      <Sidebar collapsed={sidebarCollapsed} />
      <Main>
        <TopBar>
          <TopBarLeft>
            <ToggleBtn onClick={() => setSidebarCollapsed((v) => !v)}>
              {sidebarCollapsed ? "☰" : "✕"}
            </ToggleBtn>
            <ModelBadge>{model}</ModelBadge>
          </TopBarLeft>
          <SettingsBtn onClick={() => setShowSettings(true)}>
            Settings
          </SettingsBtn>
        </TopBar>
        <ChatWindow />
        <MessageInput />
      </Main>

      {showSettings && <ModelSettings onClose={() => setShowSettings(false)} />}
    </Layout>
  );
}
