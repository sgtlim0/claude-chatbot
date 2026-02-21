import { useChatStore } from "@/shared/store/chatStore";
import { useSettingsStore } from "@/shared/store/settingsStore";
import { streamChat } from "@/shared/api/chatApi";
import { generateId } from "@/shared/lib/generateId";
import type { Message } from "@/entities/message/model";

let abortController: AbortController | null = null;

export function abortCurrentStream() {
  abortController?.abort();
  abortController = null;
  useChatStore.getState().setStreaming(false);
}

export async function sendMessage(content: string): Promise<void> {
  const chatStore = useChatStore.getState();
  const settings = useSettingsStore.getState();

  if (chatStore.isStreaming) return;
  if (!content.trim()) return;

  let sessionId = chatStore.activeSessionId;
  if (!sessionId) {
    sessionId = chatStore.createSession();
  }

  const userMessage: Message = {
    id: generateId(),
    role: "user",
    content: content.trim(),
    timestamp: Date.now(),
  };

  const assistantMessage: Message = {
    id: generateId(),
    role: "assistant",
    content: "",
    timestamp: Date.now(),
  };

  chatStore.addMessage(userMessage);
  chatStore.addMessage(assistantMessage);
  chatStore.setStreaming(true);

  abortController = new AbortController();

  const currentMessages = useChatStore.getState().getActiveMessages();
  const apiMessages = currentMessages.slice(0, -1).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  await streamChat({
    messages: apiMessages,
    model: settings.model,
    systemPrompt: settings.systemPrompt,
    signal: abortController.signal,
    onChunk: (chunk) => {
      useChatStore.getState().appendToLastMessage(chunk);
    },
    onError: (error) => {
      useChatStore.getState().appendToLastMessage(`\n[Error: ${error}]`);
    },
    onDone: () => {
      useChatStore.getState().finishStreaming();
      abortController = null;
    },
  });
}
