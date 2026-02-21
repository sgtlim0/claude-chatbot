export const config = { runtime: "edge", maxDuration: 60 };

const DEFAULT_MODEL = "gpt-4o";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  systemPrompt?: string;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { messages, model, systemPrompt } = (await req.json()) as ChatRequest;

    if (!messages?.length) {
      return new Response("messages required", { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return mockStream(messages);
    }

    let openaiRes: globalThis.Response;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || process.env.OPENAI_MODEL || DEFAULT_MODEL,
          max_tokens: 4096,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt || "You are a helpful, friendly assistant. Answer concisely and clearly." },
            ...messages,
          ],
        }),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      return new Response(`Failed to reach OpenAI: ${msg}`, { status: 502 });
    }

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return new Response(`OpenAI API error: ${openaiRes.status} ${errText}`, { status: 502 });
    }

    const reader = openaiRes.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
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
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                break;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(delta)}\n\n`)
                  );
                }
              } catch {}
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Server error: ${msg}`, { status: 500 });
  }
}

function mockStream(messages: ChatMessage[]): Response {
  const lastMsg = messages[messages.length - 1].content.toLowerCase();
  const turnCount = messages.filter((m) => m.role === "user").length;

  let reply: string;
  if (lastMsg.includes("hello") || lastMsg.includes("hi")) {
    reply = "Hello! I'm ChatGPT (mock mode). How can I help you today?";
  } else if (lastMsg.includes("name")) {
    reply = "I'm ChatGPT, powered by OpenAI. Mock mode — set OPENAI_API_KEY for real responses.";
  } else {
    reply = `Mock reply to: "${messages[messages.length - 1].content.slice(0, 50)}". Turn #${turnCount}. Set OPENAI_API_KEY for real responses.`;
  }

  const words = reply.split(" ");
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(word + " ")}\n\n`)
        );
        await new Promise((r) => setTimeout(r, 30));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
