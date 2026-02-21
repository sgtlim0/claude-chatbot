import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o";

export interface ChatOptions {
  model?: string;
  systemPrompt?: string;
  mock?: boolean;
  apiKey?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export class Chat {
  private client: OpenAI | null;
  private messages: Message[] = [];
  private model: string;
  private systemPrompt: string | undefined;
  private mock: boolean;

  constructor(options: ChatOptions = {}) {
    this.mock = options.mock ?? false;
    this.model = options.model ?? DEFAULT_MODEL;
    this.systemPrompt = options.systemPrompt;

    if (this.mock) {
      this.client = null;
    } else {
      this.client = new OpenAI({ apiKey: options.apiKey });
    }
  }

  async *sendStream(userMessage: string): AsyncGenerator<string> {
    this.messages.push({ role: "user", content: userMessage });

    if (this.mock) {
      yield* this.mockStream(userMessage);
      return;
    }

    const stream = await this.client!.chat.completions.create({
      model: this.model,
      max_tokens: 4096,
      stream: true,
      messages: [
        ...(this.systemPrompt
          ? [{ role: "system" as const, content: this.systemPrompt }]
          : []),
        ...this.messages,
      ],
    });

    const chunks: string[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        chunks.push(delta);
        yield delta;
      }
    }

    this.messages.push({ role: "assistant", content: chunks.join("") });
  }

  private async *mockStream(userMessage: string): AsyncGenerator<string> {
    const prevCount = this.messages.filter((m) => m.role === "user").length;
    const reply = this.generateMockReply(userMessage, prevCount);

    const words = reply.split(" ");
    const chunks: string[] = [];

    for (const word of words) {
      const chunk = (chunks.length > 0 ? " " : "") + word;
      chunks.push(chunk);
      yield chunk;
      if (process.stdin.isTTY) {
        await delay(30 + Math.random() * 50);
      }
    }

    this.messages.push({ role: "assistant", content: chunks.join("") });
  }

  private generateMockReply(input: string, turnCount: number): string {
    const lower = input.toLowerCase();

    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      return "Hello! I'm ChatGPT (mock mode). How can I help you today?";
    }
    if (lower.includes("name")) {
      return "I'm ChatGPT, powered by OpenAI. Currently in mock mode for testing.";
    }
    if (lower.includes("remember") || lower.includes("said")) {
      if (turnCount > 1) {
        const firstMsg = this.messages.find((m) => m.role === "user")?.content ?? "";
        return `From our conversation, your first message was: "${firstMsg}". I keep track of our full conversation history.`;
      }
      return "This is the start of our conversation, so there's nothing to recall yet!";
    }

    const responses = [
      `That's an interesting point about "${input.slice(0, 40)}". In mock mode, I simulate streaming token by token.`,
      `You said: "${input.slice(0, 40)}". This is turn #${turnCount}. The multi-turn history is working correctly!`,
      `Great question! This mock response simulates streaming. Your message had ${input.length} characters.`,
    ];

    return responses[turnCount % responses.length];
  }

  reset(): void {
    this.messages = [];
  }

  get history(): ReadonlyArray<Message> {
    return this.messages;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
