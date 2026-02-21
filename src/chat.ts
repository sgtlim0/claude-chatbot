import Anthropic from "@anthropic-ai/sdk";

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
  mock?: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export class Chat {
  private client: Anthropic | null;
  private messages: Message[] = [];
  private model: string;
  private maxTokens: number;
  private systemPrompt: string | undefined;
  private mock: boolean;

  constructor(options: ChatOptions = {}) {
    this.mock = options.mock ?? false;
    this.client = this.mock ? null : new Anthropic();
    this.model = options.model ?? "claude-opus-4-6";
    this.maxTokens = options.maxTokens ?? 4096;
    this.systemPrompt = options.systemPrompt;
  }

  async *sendStream(userMessage: string): AsyncGenerator<string> {
    this.messages.push({ role: "user", content: userMessage });

    if (this.mock) {
      yield* this.mockStream(userMessage);
      return;
    }

    const stream = this.client!.messages.stream({
      model: this.model,
      max_tokens: this.maxTokens,
      system: this.systemPrompt,
      messages: this.messages,
    });

    const chunks: string[] = [];

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        chunks.push(event.delta.text);
        yield event.delta.text;
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
      return "Hello! I'm Claude (mock mode). How can I help you today?";
    }
    if (lower.includes("name")) {
      return "I'm Claude, an AI assistant made by Anthropic. Currently running in mock mode for testing.";
    }
    if (lower.includes("how are you")) {
      return "I'm doing well, thank you for asking! I'm a mock instance, but my spirits are high.";
    }
    if (lower.includes("remember") || lower.includes("said")) {
      if (turnCount > 1) {
        const firstMsg = this.messages.find((m) => m.role === "user")?.content ?? "";
        return `From our conversation, your first message was: "${firstMsg}". I keep track of our full conversation history.`;
      }
      return "This is the start of our conversation, so there's nothing to recall yet!";
    }

    const responses = [
      `That's an interesting point about "${input.slice(0, 40)}". In mock mode, I echo your input and simulate streaming token by token.`,
      `You said: "${input.slice(0, 40)}". This is turn #${turnCount} of our conversation. The multi-turn history is working correctly!`,
      `Great question! This mock response simulates the Claude API streaming behavior. Your message had ${input.length} characters.`,
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
