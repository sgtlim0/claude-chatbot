/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useEffect, useRef, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown } from "lucide-react";
import { useChatStore } from "@/shared/store/chatStore";
import { sendMessage } from "@/features/send-message/sendMessage";
import { theme } from "@/shared/ui/theme";
import { MessageItem } from "./MessageItem";

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  position: relative;
`;

const Inner = styled.div`
  max-width: 768px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  width: 100%;
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

const ScrollBtn = styled.button`
  position: absolute;
  bottom: 20px;
  right: 50%;
  transform: translateX(50%);
  background: ${theme.colors.bgTertiary};
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textPrimary};
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 10;
  box-shadow: ${theme.shadow.md};
  transition: background 0.15s;
  &:hover {
    background: ${theme.colors.border};
  }
`;

export function ChatWindow() {
  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const deleteMessage = useChatStore((s) => s.deleteMessage);

  const messages =
    activeSessionId && sessions[activeSessionId]
      ? sessions[activeSessionId].messages
      : [];

  const parentRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const isAutoScrolling = useRef(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
      isAutoScrolling.current = true;
      setShowScrollBtn(false);
    }
  }, [messages.length, virtualizer]);

  // Auto-scroll on new messages / streaming
  useEffect(() => {
    if (isAutoScrolling.current && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
    }
  }, [messages.length, messages[messages.length - 1]?.content, isStreaming, virtualizer]);

  // Detect manual scroll up
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      if (distanceFromBottom > 200) {
        isAutoScrolling.current = false;
        setShowScrollBtn(true);
      } else {
        isAutoScrolling.current = true;
        setShowScrollBtn(false);
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRetry = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    []
  );

  const handleDelete = useCallback(
    (msgId: string) => {
      deleteMessage(msgId);
    },
    [deleteMessage]
  );

  if (messages.length === 0) {
    return (
      <Container ref={parentRef}>
        <EmptyState>
          <EmptyTitle>AI Chat</EmptyTitle>
          <EmptySubtitle>Start a conversation by typing a message below.</EmptySubtitle>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container ref={parentRef}>
      <Inner
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const msg = messages[virtualRow.index];
          const idx = virtualRow.index;
          return (
            <div
              key={msg.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                padding: "0 24px",
              }}
            >
              <MessageItem
                message={msg}
                isLast={idx === messages.length - 1}
                isStreaming={
                  isStreaming && idx === messages.length - 1 && msg.role === "assistant"
                }
                onDelete={handleDelete}
                onRetry={handleRetry}
              />
            </div>
          );
        })}
      </Inner>

      {showScrollBtn && (
        <ScrollBtn onClick={scrollToBottom}>
          <ArrowDown size={14} /> Scroll to bottom
        </ScrollBtn>
      )}
    </Container>
  );
}
