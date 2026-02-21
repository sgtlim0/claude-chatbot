export const config = { runtime: "edge", maxDuration: 60 };

const DEFAULT_MODEL = "gpt-4o";

interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: ToolCallMsg[];
  tool_call_id?: string;
}

interface ToolCallMsg {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  systemPrompt?: string;
  tools?: boolean;
}

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "getCurrentTime",
      description: "Get the current date and time",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Calculate a mathematical expression",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Mathematical expression to evaluate",
          },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "webSearch",
      description: "Search the web for current information. Use this when the user asks about current events, recent news, or real-time data.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
    },
  },
];

async function executeToolServer(name: string, argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    switch (name) {
      case "getCurrentTime":
        return `현재 시간: ${new Date().toISOString()}`;

      case "calculate": {
        const fn = new Function("return " + args.expression);
        return `계산 결과: ${args.expression} = ${fn()}`;
      }

      case "webSearch": {
        const bingKey = (globalThis as any).process?.env?.BING_API_KEY;
        if (!bingKey) {
          return `Web search results for "${args.query}":\n1. Web search is not configured. Set BING_API_KEY environment variable to enable real web search.\n2. This is a mock result for: ${args.query}`;
        }
        const res = await fetch(
          `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(args.query)}&count=5`,
          { headers: { "Ocp-Apim-Subscription-Key": bingKey } }
        );
        const data = await res.json();
        const results = data.webPages?.value?.slice(0, 5) ?? [];
        if (results.length === 0) return `No results found for "${args.query}"`;
        return results
          .map((r: any, i: number) => `${i + 1}. **${r.name}**\n   ${r.snippet}\n   ${r.url}`)
          .join("\n\n");
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { messages, model, systemPrompt, tools: enableTools } = (await req.json()) as ChatRequest;

    if (!messages?.length) {
      return new Response("messages required", { status: 400 });
    }

    const apiKey = (globalThis as any).process?.env?.OPENAI_API_KEY;
    if (!apiKey) {
      return mockStream(messages);
    }

    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt || "You are a helpful, friendly assistant. Answer concisely and clearly." },
      ...messages.map((m) => {
        if (m.role === "tool") {
          return { role: "tool" as const, content: m.content, tool_call_id: m.tool_call_id || "" };
        }
        return { role: m.role, content: m.content };
      }),
    ];

    const useTools = enableTools !== false;

    // Agent loop: handle tool calls iteratively, stream the final response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let currentMessages = apiMessages;
          let loopCount = 0;
          const MAX_LOOPS = 5;

          while (loopCount < MAX_LOOPS) {
            loopCount++;
            const body: Record<string, unknown> = {
              model: model || (globalThis as any).process?.env?.OPENAI_MODEL || DEFAULT_MODEL,
              max_tokens: 4096,
              messages: currentMessages,
            };

            if (useTools && loopCount <= MAX_LOOPS) {
              body.tools = TOOL_DEFINITIONS;
            }

            // For intermediate tool calls, don't stream. For final response, stream.
            body.stream = true;

            let openaiRes: globalThis.Response;
            try {
              openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
              });
            } catch (fetchErr) {
              const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Failed to reach OpenAI: ${msg}` })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            if (!openaiRes.ok) {
              const errText = await openaiRes.text();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `OpenAI API error: ${openaiRes.status} ${errText}` })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            // Parse the streaming response
            const reader = openaiRes.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let fullContent = "";
            let toolCallsAccum: Record<number, { id: string; name: string; args: string }> = {};
            let hasToolCalls = false;
            let finishReason = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (data === "[DONE]") break;

                try {
                  const parsed = JSON.parse(data);
                  const choice = parsed.choices?.[0];
                  if (!choice) continue;

                  finishReason = choice.finish_reason || finishReason;

                  const delta = choice.delta;
                  if (delta?.content) {
                    fullContent += delta.content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta.content)}\n\n`));
                  }

                  if (delta?.tool_calls) {
                    hasToolCalls = true;
                    for (const tc of delta.tool_calls) {
                      const idx = tc.index ?? 0;
                      if (!toolCallsAccum[idx]) {
                        toolCallsAccum[idx] = { id: tc.id || "", name: "", args: "" };
                      }
                      if (tc.id) toolCallsAccum[idx].id = tc.id;
                      if (tc.function?.name) toolCallsAccum[idx].name += tc.function.name;
                      if (tc.function?.arguments) toolCallsAccum[idx].args += tc.function.arguments;
                    }
                  }
                } catch {}
              }
            }

            if (hasToolCalls && finishReason === "tool_calls") {
              // Execute tools and loop
              const toolCalls = Object.values(toolCallsAccum);

              // Notify client about tool execution
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify("\n\n🔧 Tool 실행 중... ")}\n\n`
                )
              );

              // Add assistant message with tool_calls to conversation
              const assistantMsg: any = {
                role: "assistant",
                content: fullContent || null,
                tool_calls: toolCalls.map((tc) => ({
                  id: tc.id,
                  type: "function",
                  function: { name: tc.name, arguments: tc.args },
                })),
              };
              currentMessages = [...currentMessages, assistantMsg];

              // Execute each tool and add results
              for (const tc of toolCalls) {
                const result = await executeToolServer(tc.name, tc.args);

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify(`[${tc.name}] `)}\n\n`
                  )
                );

                currentMessages.push({
                  role: "tool",
                  content: result,
                  tool_call_id: tc.id,
                });
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify("\n\n")}\n\n`)
              );

              // Continue the loop for the next LLM call
              continue;
            }

            // No tool calls or end_turn — we're done
            break;
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
  } else if (lastMsg.includes("time") || lastMsg.includes("시간")) {
    reply = `🔧 Tool: getCurrentTime\n\n현재 시간: ${new Date().toISOString()}\n\nThe current time is shown above. Set OPENAI_API_KEY for real tool calling.`;
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
