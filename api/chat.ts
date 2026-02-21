import OpenAI from "openai";

export const config = { runtime: "edge", maxDuration: 60 };

const DEFAULT_MODEL = "gpt-4o";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return new OpenAI({ apiKey });
  }
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { messages } = (await req.json()) as ChatRequest;

  if (!messages?.length) {
    return new Response("messages required", { status: 400 });
  }

  const client = getClient();
  if (!client) {
    return mockStream(messages);
  }

  const stream = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    max_tokens: 4096,
    stream: true,
    messages: [
      { role: "system", content: "You are a helpful, friendly assistant. Answer concisely and clearly." },
      ...messages,
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(delta)}\n\n`)
            );
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
