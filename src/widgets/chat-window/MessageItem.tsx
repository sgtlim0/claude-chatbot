/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import type { Message } from "@/entities/message/model";
import { theme } from "@/shared/ui/theme";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Row = styled.div<{ role: string }>`
  display: flex;
  justify-content: ${(p) => (p.role === "user" ? "flex-end" : "flex-start")};
  margin-bottom: 16px;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Bubble = styled.div<{ role: string }>`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: ${theme.radius.lg};
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${theme.colors.textPrimary};
  background: ${(p) =>
    p.role === "user" ? theme.colors.userBubble : theme.colors.assistantBubble};
  border: ${(p) =>
    p.role === "assistant" ? `1px solid ${theme.colors.border}` : "none"};
  ${(p) =>
    p.role === "user"
      ? `border-bottom-right-radius: 4px;`
      : `border-bottom-left-radius: 4px;`}
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

const Cursor = styled.span`
  display: inline-block;
  width: 6px;
  height: 16px;
  background: ${theme.colors.accent};
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ${blink} 0.8s infinite;
`;

const RoleLabel = styled.div<{ role: string }>`
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  margin-bottom: 4px;
  text-align: ${(p) => (p.role === "user" ? "right" : "left")};
`;

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
}

export function MessageItem({ message, isStreaming }: MessageItemProps) {
  return (
    <div>
      <RoleLabel role={message.role}>
        {message.role === "user" ? "You" : "AI"}
      </RoleLabel>
      <Row role={message.role}>
        <Bubble role={message.role}>
          {message.content || (isStreaming ? "" : "...")}
          {isStreaming && <Cursor />}
        </Bubble>
      </Row>
    </div>
  );
}
