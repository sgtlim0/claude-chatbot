import type { Message } from "@/entities/message/model";

const MODAL_API_URL =
  import.meta.env.VITE_API_URL ||
  "https://sgtlim0--cardnews-ai-chat-api-web-app.modal.run/chat";

interface StreamChatParams {
  messages: Pick<Message, "role" | "content">[];
  model: string;
  systemPrompt: string;
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export async function streamChat({
  messages,
  model,
  systemPrompt,
  onChunk,
  onError,
  onDone,
  signal,
}: StreamChatParams): Promise<void> {
  const apiMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  try {
    const res = await fetch(MODAL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages, model, systemPrompt }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text();
      onError(`API 오류 (${res.status}): ${text}`);
      onDone();
      return;
    }

    const data = await res.json();

    if (data.error) {
      onError(data.error);
      onDone();
      return;
    }

    const text = data.response || "";
    if (!text) {
      onError("응답이 비어있습니다");
      onDone();
      return;
    }

    const words = text.split(/(\s+)/);
    for (const word of words) {
      if (signal?.aborted) break;
      if (word) {
        onChunk(word);
        await new Promise((r) => setTimeout(r, 15));
      }
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      onError((err as Error).message);
    }
  }

  onDone();
}
