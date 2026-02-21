/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { memo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Copy, Check, Trash2, RefreshCw, Wrench } from "lucide-react";
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
  position: relative;
  group: message;
`;

const Bubble = styled.div<{ role: string }>`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: ${theme.radius.lg};
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  color: ${theme.colors.textPrimary};
  background: ${(p) =>
    p.role === "user"
      ? theme.colors.userBubble
      : p.role === "tool"
      ? "#065f46"
      : theme.colors.assistantBubble};
  border: ${(p) =>
    p.role === "assistant" ? `1px solid ${theme.colors.border}` : "none"};
  ${(p) =>
    p.role === "user"
      ? `border-bottom-right-radius: 4px;`
      : `border-bottom-left-radius: 4px;`}

  p { margin: 0 0 8px; &:last-child { margin-bottom: 0; } }
  ul, ol { margin: 4px 0 8px 20px; }
  table {
    border-collapse: collapse;
    margin: 8px 0;
    width: 100%;
    th, td {
      border: 1px solid ${theme.colors.border};
      padding: 6px 10px;
      font-size: 13px;
    }
    th { background: ${theme.colors.bgTertiary}; }
  }
  pre {
    background: #0f172a;
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
    position: relative;
  }
  code {
    font-family: "Fira Code", "Consolas", monospace;
    font-size: 13px;
  }
  :not(pre) > code {
    background: ${theme.colors.bgTertiary};
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
  blockquote {
    border-left: 3px solid ${theme.colors.accent};
    margin: 8px 0;
    padding: 4px 12px;
    color: ${theme.colors.textSecondary};
  }
  a { color: ${theme.colors.accent}; }
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
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: ${(p) => (p.role === "user" ? "flex-end" : "flex-start")};
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.15s;
`;

const Wrapper = styled.div`
  &:hover ${Actions} {
    opacity: 1;
  }
`;

const ActionBtn = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  &:hover {
    color: ${theme.colors.textPrimary};
    background: ${theme.colors.bgTertiary};
  }
`;

const CopyCodeBtn = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  background: ${theme.colors.bgTertiary};
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.15s;
  &:hover {
    color: ${theme.colors.textPrimary};
  }
`;

const PreWrapper = styled.div`
  position: relative;
  &:hover ${CopyCodeBtn} {
    opacity: 1;
  }
`;

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  onDelete?: (id: string) => void;
  onRetry?: (content: string) => void;
}

function MessageItemRaw({ message, isStreaming, onDelete, onRetry }: MessageItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.content]);

  const safeContent = message.content || "";

  const roleLabel =
    message.role === "user" ? "You" : message.role === "tool" ? "Tool" : "AI";

  return (
    <Wrapper>
      <RoleLabel role={message.role}>
        {message.role === "tool" && <Wrench size={11} />}
        {roleLabel}
      </RoleLabel>
      <Row role={message.role}>
        <Bubble role={message.role}>
          {message.role === "user" ? (
            safeContent
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre({ children }) {
                  return (
                    <PreWrapper>
                      <CopyCodeBtn
                        onClick={() => {
                          const el = document.createElement("div");
                          if (typeof children === "object") {
                            // extract text from code child
                            const codeChild = (children as any)?.props?.children;
                            navigator.clipboard.writeText(
                              typeof codeChild === "string" ? codeChild : String(codeChild ?? "")
                            );
                          }
                        }}
                      >
                        <Copy size={11} /> Copy
                      </CopyCodeBtn>
                      <pre>{children}</pre>
                    </PreWrapper>
                  );
                },
              }}
            >
              {safeContent}
            </ReactMarkdown>
          )}
          {isStreaming && <Cursor />}
        </Bubble>
      </Row>
      {!isStreaming && (
        <Actions>
          <ActionBtn onClick={handleCopy}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </ActionBtn>
          {onDelete && (
            <ActionBtn onClick={() => onDelete(message.id)}>
              <Trash2 size={12} /> Delete
            </ActionBtn>
          )}
          {onRetry && message.role === "user" && (
            <ActionBtn onClick={() => onRetry(message.content)}>
              <RefreshCw size={12} /> Retry
            </ActionBtn>
          )}
        </Actions>
      )}
    </Wrapper>
  );
}

export const MessageItem = memo(MessageItemRaw);
