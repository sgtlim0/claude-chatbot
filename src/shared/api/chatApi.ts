import type { Message } from "@/entities/message/model";

interface StreamChatParams {
  messages: Pick<Message, "role" | "content">[];
  model: string;
  systemPrompt: string;
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
  tools?: boolean;
}

export async function streamChat({
  messages,
  model,
  systemPrompt,
  onChunk,
  onError,
  onDone,
  signal,
  tools = true,
}: StreamChatParams): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model, systemPrompt, tools }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    onError(`API error (${res.status}): ${text}`);
    onDone();
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("No response body");
    onDone();
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (typeof parsed === "string") {
            onChunk(parsed);
          } else if (parsed.error) {
            onError(parsed.error);
          }
        } catch {
          // skip malformed data
        }
      }
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      onError((err as Error).message);
    }
  }

  onDone();
}
