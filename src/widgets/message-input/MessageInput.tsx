/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useState, useRef, useEffect } from "react";
import { sendMessage, abortCurrentStream } from "@/features/send-message/sendMessage";
import { useChatStore } from "@/shared/store/chatStore";
import { theme } from "@/shared/ui/theme";

const Container = styled.div`
  padding: 16px 24px 24px;
  background: ${theme.colors.bgPrimary};
`;

const Inner = styled.div`
  max-width: 768px;
  margin: 0 auto;
  display: flex;
  gap: 10px;
  align-items: flex-end;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 12px 16px;
  background: ${theme.colors.bgInput};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.lg};
  color: ${theme.colors.textPrimary};
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  min-height: 44px;
  max-height: 160px;
  line-height: 1.5;
  &::placeholder {
    color: ${theme.colors.textMuted};
  }
  &:focus {
    border-color: ${theme.colors.accent};
  }
`;

const SendBtn = styled.button<{ streaming?: boolean }>`
  padding: 12px 20px;
  background: ${(p) => (p.streaming ? theme.colors.danger : theme.colors.accent)};
  color: white;
  border: none;
  border-radius: ${theme.radius.lg};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background: ${(p) =>
      p.streaming ? theme.colors.dangerHover : theme.colors.accentHover};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function MessageInput() {
  const [text, setText] = useState("");
  const isStreaming = useChatStore((s) => s.isStreaming);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  const handleSend = async () => {
    if (isStreaming) {
      abortCurrentStream();
      return;
    }
    if (!text.trim()) return;
    const msg = text;
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  };

  return (
    <Container>
      <Inner>
        <TextArea
          ref={textareaRef}
          rows={1}
          placeholder="Type a message... (Shift+Enter for new line)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={false}
        />
        <SendBtn onClick={handleSend} streaming={isStreaming}>
          {isStreaming ? "Stop" : "Send"}
        </SendBtn>
      </Inner>
    </Container>
  );
}
