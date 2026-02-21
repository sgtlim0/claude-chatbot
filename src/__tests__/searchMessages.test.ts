import { describe, it, expect } from "vitest";
import { searchMessages } from "@/features/search/searchMessages";
import type { ChatSession } from "@/entities/message/model";

const mockSessions: Record<string, ChatSession> = {
  "s1": {
    id: "s1",
    title: "TypeScript Chat",
    createdAt: 1000,
    messages: [
      { id: "m1", role: "user", content: "Tell me about TypeScript", timestamp: 1001 },
      { id: "m2", role: "assistant", content: "TypeScript is a superset of JavaScript", timestamp: 1002 },
    ],
  },
  "s2": {
    id: "s2",
    title: "Python Chat",
    createdAt: 2000,
    messages: [
      { id: "m3", role: "user", content: "What is Python?", timestamp: 2001 },
      { id: "m4", role: "assistant", content: "Python is a programming language", timestamp: 2002 },
    ],
  },
};

describe("searchMessages", () => {
  it("returns empty results for empty query", () => {
    expect(searchMessages(mockSessions, "")).toEqual([]);
    expect(searchMessages(mockSessions, "  ")).toEqual([]);
  });

  it("finds messages matching query", () => {
    const results = searchMessages(mockSessions, "TypeScript");
    expect(results).toHaveLength(2);
    expect(results[0].sessionId).toBe("s1");
  });

  it("searches case-insensitively", () => {
    const results = searchMessages(mockSessions, "python");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns results sorted by timestamp descending", () => {
    const results = searchMessages(mockSessions, "programming");
    expect(results).toHaveLength(1);
    expect(results[0].message.id).toBe("m4");
  });

  it("returns empty for no matches", () => {
    expect(searchMessages(mockSessions, "nonexistent")).toEqual([]);
  });
});
