/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useState } from "react";
import { Sidebar } from "@/widgets/sidebar/Sidebar";
import { ChatWindow } from "@/widgets/chat-window/ChatWindow";
import { MessageInput } from "@/widgets/message-input/MessageInput";
import { ModelSettings } from "@/widgets/model-settings/ModelSettings";
import { useSettingsStore } from "@/shared/store/settingsStore";
import { useChatStore } from "@/shared/store/chatStore";
import {
  exportSessionMarkdown,
  exportSessionJson,
  exportAllSessionsJson,
} from "@/features/export-chat/exportChat";
import { theme } from "@/shared/ui/theme";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Settings,
  Download,
  FileText,
  FileJson,
} from "lucide-react";

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

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  padding: 6px;
  border-radius: ${theme.radius.sm};
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
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

const DropdownWrapper = styled.div`
  position: relative;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: ${theme.colors.bgSecondary};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  padding: 4px;
  min-width: 160px;
  z-index: 50;
  box-shadow: ${theme.shadow.md};
`;

const DropdownItem = styled.button`
  width: 100%;
  background: none;
  border: none;
  color: ${theme.colors.textPrimary};
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    background: ${theme.colors.bgTertiary};
  }
`;

export function ChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const model = useSettingsStore((s) => s.model);
  const { sessions, activeSessionId } = useChatStore();
  const activeSession = activeSessionId ? sessions[activeSessionId] : null;

  return (
    <Layout>
      <Sidebar collapsed={sidebarCollapsed} />
      <Main>
        <TopBar>
          <TopBarLeft>
            <IconBtn onClick={() => setSidebarCollapsed((v) => !v)}>
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </IconBtn>
            <ModelBadge>{model}</ModelBadge>
          </TopBarLeft>
          <TopBarRight>
            <DropdownWrapper>
              <IconBtn onClick={() => setShowExport((v) => !v)}>
                <Download size={16} /> Export
              </IconBtn>
              {showExport && (
                <Dropdown>
                  {activeSession && (
                    <>
                      <DropdownItem
                        onClick={() => {
                          exportSessionMarkdown(activeSession);
                          setShowExport(false);
                        }}
                      >
                        <FileText size={14} /> Export as Markdown
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => {
                          exportSessionJson(activeSession);
                          setShowExport(false);
                        }}
                      >
                        <FileJson size={14} /> Export as JSON
                      </DropdownItem>
                    </>
                  )}
                  <DropdownItem
                    onClick={() => {
                      exportAllSessionsJson(sessions);
                      setShowExport(false);
                    }}
                  >
                    <Download size={14} /> Export All (JSON)
                  </DropdownItem>
                </Dropdown>
              )}
            </DropdownWrapper>
            <IconBtn onClick={() => setShowSettings(true)}>
              <Settings size={16} /> Settings
            </IconBtn>
          </TopBarRight>
        </TopBar>
        <ChatWindow />
        <MessageInput />
      </Main>

      {showSettings && <ModelSettings onClose={() => setShowSettings(false)} />}
    </Layout>
  );
}
