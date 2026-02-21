import { memo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import "highlight.js/styles/github.css";
import { Copy, Check, Trash2, RefreshCw, Wrench, Pencil } from "lucide-react";
import type { Message } from "@/entities/message/model";
import { SourceCards } from "@/widgets/sources/SourceCards";
import { RelatedQuestions } from "@/widgets/related-questions/RelatedQuestions";
import { SearchBadge } from "@/widgets/search-badge/SearchBadge";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), "className"],
    span: [...(defaultSchema.attributes?.span || []), "className"],
  },
};

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  onDelete?: (id: string) => void;
  onRetry?: (content: string) => void;
  onEdit?: (id: string, content: string) => void;
  onRelatedQuestionClick?: (text: string) => void;
}

function MessageItemRaw({
  message,
  isStreaming,
  onDelete,
  onRetry,
  onEdit,
  onRelatedQuestionClick,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.content]);

  const handleEditSubmit = useCallback(() => {
    if (onEdit && editText.trim() !== message.content) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  }, [editText, message.id, message.content, onEdit]);

  const safeContent = message.content || "";
  const hasSources = message.sources && message.sources.length > 0;
  const hasRelatedQuestions = message.relatedQuestions && message.relatedQuestions.length > 0;

  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end mb-5 animate-[fadeIn_0.15s_ease-out] group">
        {isEditing ? (
          <div className="w-full max-w-[85%]">
            <textarea
              className="w-full p-3 border border-border rounded-xl bg-bg-primary text-text-primary text-sm resize-none outline-none focus:border-accent"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSubmit();
                }
                if (e.key === "Escape") setIsEditing(false);
              }}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-1.5 justify-end">
              <button
                className="text-[12px] text-text-muted hover:text-text-primary px-2.5 py-1 rounded-md transition-colors"
                onClick={() => setIsEditing(false)}
                aria-label="Cancel editing"
              >
                Cancel
              </button>
              <button
                className="text-[12px] text-white bg-accent hover:bg-accent-hover px-3 py-1 rounded-md transition-colors"
                onClick={handleEditSubmit}
                aria-label="Save edit"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md bg-user-bubble text-text-primary text-[14px] leading-relaxed break-words">
            {safeContent}
          </div>
        )}
        {!isStreaming && !isEditing && (
          <div className="flex gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary p-1 rounded-md transition-colors"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy message"}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            {onEdit && (
              <button
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary p-1 rounded-md transition-colors"
                onClick={() => {
                  setEditText(message.content);
                  setIsEditing(true);
                }}
                aria-label="Edit message"
              >
                <Pencil size={12} />
              </button>
            )}
            {onRetry && (
              <button
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary p-1 rounded-md transition-colors"
                onClick={() => onRetry(message.content)}
                aria-label="Retry message"
              >
                <RefreshCw size={12} />
              </button>
            )}
            {onDelete && (
              <button
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-danger p-1 rounded-md transition-colors"
                onClick={() => onDelete(message.id)}
                aria-label="Delete message"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (message.role === "tool") {
    return (
      <div className="mb-5 animate-[fadeIn_0.15s_ease-out]">
        <div className="flex items-center gap-1.5 mb-2">
          <Wrench size={12} className="text-text-muted" />
          <span className="text-[11px] font-medium text-text-muted">Tool Result</span>
        </div>
        <div className="max-w-[85%] px-4 py-3 rounded-xl bg-bg-secondary border border-border text-[13px] leading-relaxed break-words text-text-secondary">
          {safeContent}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="mb-6 animate-[fadeIn_0.15s_ease-out] group">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
          <span className="text-accent text-[11px] font-semibold">C</span>
        </div>
        <span className="text-[13px] font-medium text-text-primary">Assistant</span>
        {hasSources && <SearchBadge />}
      </div>

      {hasSources && <SourceCards sources={message.sources!} />}

      <div className="prose prose-sm max-w-none text-text-primary leading-[1.7] text-[14px]
        [&_p]:mb-3 [&_p:last-child]:mb-0
        [&_ul]:my-2 [&_ul]:ml-5 [&_ol]:my-2 [&_ol]:ml-5 [&_li]:mb-1
        [&_table]:border-collapse [&_table]:my-3 [&_table]:w-full
        [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-[13px] [&_th]:bg-bg-tertiary [&_th]:font-medium
        [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-[13px]
        [&_pre]:bg-bg-secondary [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre]:border [&_pre]:border-border
        [&_code]:font-mono [&_code]:text-[13px]
        [&_:not(pre)>code]:bg-bg-tertiary [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:text-[13px]
        [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:my-3 [&_blockquote]:px-4 [&_blockquote]:text-text-secondary [&_blockquote]:italic
        [&_a]:text-accent [&_a]:no-underline [&_a:hover]:underline
        [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-5 [&_h1]:mb-2
        [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2
        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5
      ">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, [rehypeSanitize, sanitizeSchema]]}
        >
          {safeContent}
        </ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 align-text-bottom animate-[blink_0.8s_infinite] rounded-full" />
        )}
      </div>

      {!isStreaming && hasRelatedQuestions && onRelatedQuestionClick && (
        <RelatedQuestions
          questions={message.relatedQuestions!}
          onQuestionClick={onRelatedQuestionClick}
        />
      )}

      {!isStreaming && (
        <div className="flex gap-0.5 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary p-1 rounded-md transition-colors"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy message"}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          {onDelete && (
            <button
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-danger p-1 rounded-md transition-colors"
              onClick={() => onDelete(message.id)}
              aria-label="Delete message"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export const MessageItem = memo(MessageItemRaw);
