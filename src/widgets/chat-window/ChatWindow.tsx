import { useEffect, useRef, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown } from "lucide-react";
import { useChatStore } from "@/shared/store/chatStore";
import { sendMessage } from "@/features/send-message/sendMessage";
import { MessageItem } from "./MessageItem";
import { SkeletonLoader } from "@/widgets/skeleton/SkeletonLoader";

function estimateMessageSize(msg: { content: string; role: string; sources?: unknown[] }): number {
  const baseHeight = 80;
  const charsPerLine = 80;
  const lineHeight = 24;
  const lines = Math.ceil(msg.content.length / charsPerLine);
  const contentHeight = lines * lineHeight;
  const sourcesHeight = msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 ? 100 : 0;
  return Math.max(baseHeight, contentHeight + sourcesHeight + 60);
}

export function ChatWindow() {
  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const editMessage = useChatStore((s) => s.editMessage);

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
    estimateSize: (index) => estimateMessageSize(messages[index]),
    overscan: 5,
  });

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
      isAutoScrolling.current = true;
      setShowScrollBtn(false);
    }
  }, [messages.length, virtualizer]);

  useEffect(() => {
    if (isAutoScrolling.current && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
    }
  }, [messages.length, messages[messages.length - 1]?.content, isStreaming, virtualizer]);

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

  const handleRetry = useCallback((content: string) => {
    sendMessage(content);
  }, []);

  const handleDelete = useCallback(
    (msgId: string) => {
      deleteMessage(msgId);
    },
    [deleteMessage]
  );

  const handleEdit = useCallback(
    (msgId: string, newContent: string) => {
      editMessage(msgId, newContent);
      sendMessage(newContent);
    },
    [editMessage]
  );

  const handleRelatedQuestionClick = useCallback((text: string) => {
    sendMessage(text);
  }, []);

  if (messages.length === 0) {
    return (
      <div ref={parentRef} className="flex-1 overflow-y-auto relative">
        <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
          <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
            <span className="text-accent text-lg font-semibold">C</span>
          </div>
          <h2 className="text-xl font-medium text-text-primary m-0">How can I help you today?</h2>
          <p className="text-[14px] text-text-muted m-0 max-w-md text-center leading-relaxed">
            Start a conversation by typing a message below. I can help with writing, analysis, coding, and more.
          </p>
        </div>
      </div>
    );
  }

  const lastMsg = messages[messages.length - 1];
  const showSkeleton = isStreaming && lastMsg?.role === "assistant" && lastMsg.content === "";

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto relative">
      <div
        className="max-w-[720px] mx-auto relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
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
              {showSkeleton && idx === messages.length - 1 ? (
                <SkeletonLoader />
              ) : (
                <MessageItem
                  message={msg}
                  isLast={idx === messages.length - 1}
                  isStreaming={
                    isStreaming && idx === messages.length - 1 && msg.role === "assistant"
                  }
                  onDelete={handleDelete}
                  onRetry={msg.role === "user" ? handleRetry : undefined}
                  onEdit={msg.role === "user" ? handleEdit : undefined}
                  onRelatedQuestionClick={handleRelatedQuestionClick}
                />
              )}
            </div>
          );
        })}
      </div>

      {showScrollBtn && (
        <button
          className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-bg-primary border border-border text-text-secondary cursor-pointer px-3.5 py-2 rounded-full text-[12px] flex items-center gap-1.5 z-10 shadow-sm hover:bg-bg-secondary transition-colors"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={13} /> New messages
        </button>
      )}
    </div>
  );
}
