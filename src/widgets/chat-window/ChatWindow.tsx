/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useEffect, useRef } from "react";
import { useChatStore } from "@/shared/store/chatStore";
import { theme } from "@/shared/ui/theme";
import { MessageItem } from "./MessageItem";

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
`;

const Inner = styled.div`
  max-width: 768px;
  margin: 0 auto;
  padding: 0 24px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${theme.colors.textMuted};
  gap: 12px;
`;

const EmptyTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  margin: 0;
`;

const EmptySubtitle = styled.p`
  font-size: 14px;
  margin: 0;
`;

export function ChatWindow() {
  const { sessions, activeSessionId, isStreaming } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages =
    activeSessionId && sessions[activeSessionId]
      ? sessions[activeSessionId].messages
      : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <Container>
        <EmptyState>
          <EmptyTitle>AI Chat</EmptyTitle>
          <EmptySubtitle>Start a conversation by typing a message below.</EmptySubtitle>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Inner>
        {messages.map((msg, idx) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isLast={idx === messages.length - 1}
            isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "assistant"}
          />
        ))}
        <div ref={bottomRef} />
      </Inner>
    </Container>
  );
}
