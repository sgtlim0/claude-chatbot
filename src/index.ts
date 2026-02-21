import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Chat } from "./chat.js";

const SYSTEM_PROMPT = `You are a helpful, friendly assistant. Answer concisely and clearly.`;

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const mock = !apiKey;

  const chat = new Chat({
    systemPrompt: SYSTEM_PROMPT,
    mock,
    apiKey: apiKey ?? undefined,
  });

  const rl = readline.createInterface({ input, output });

  if (mock) {
    console.log("[Mock mode: no OPENAI_API_KEY found]\n");
  } else {
    console.log("[ChatGPT mode: connected]\n");
  }
  console.log("ChatGPT Chatbot (type /quit to exit, /reset to clear history)\n");

  rl.on("close", () => {
    console.log("\nBye!");
    process.exit(0);
  });

  for await (const userInput of rl) {
    const trimmed = userInput.trim();

    if (!trimmed) {
      process.stdout.write("You: ");
      continue;
    }

    if (trimmed === "/quit") {
      console.log("Bye!");
      rl.close();
      return;
    }

    if (trimmed === "/reset") {
      chat.reset();
      console.log("(conversation reset)\n");
      process.stdout.write("You: ");
      continue;
    }

    process.stdout.write("\nChatGPT: ");

    try {
      for await (const chunk of chat.sendStream(trimmed)) {
        process.stdout.write(chunk);
      }
      console.log("\n");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${message}\n`);
    }

    process.stdout.write("You: ");
  }
}

main();
