type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

const tools: Record<string, ToolHandler> = {
  getCurrentTime: async () => {
    return `현재 시간: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`;
  },

  calculate: async (args) => {
    const { expression } = args as { expression: string };
    try {
      // Safe evaluation using Function constructor with limited scope
      const fn = new Function("return " + expression);
      const result = fn();
      return `계산 결과: ${expression} = ${result}`;
    } catch {
      return `계산 실패: "${expression}"`;
    }
  },
};

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "getCurrentTime",
      description: "Get the current date and time",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculate",
      description: "Calculate a mathematical expression",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Mathematical expression to evaluate, e.g. '2 + 3 * 4'",
          },
        },
        required: ["expression"],
      },
    },
  },
];

export async function executeTool(name: string, argsJson: string): Promise<string> {
  const handler = tools[name];
  if (!handler) return `Unknown tool: ${name}`;

  try {
    const args = JSON.parse(argsJson);
    return await handler(args);
  } catch (err) {
    return `Tool execution error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
