import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "@/shared/store/chatStore";

describe("chatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      sessions: {},
      activeSessionId: null,
      isStreaming: false,
      searchQuery: "",
    });
  });

  it("creates a new session", () => {
    const id = useChatStore.getState().createSession();
    const state = useChatStore.getState();

    expect(state.activeSessionId).toBe(id);
    expect(state.sessions[id]).toBeDefined();
    expect(state.sessions[id].title).toBe("New Chat");
    expect(state.sessions[id].messages).toEqual([]);
  });

  it("adds messages to active session", () => {
    const id = useChatStore.getState().createSession();
    const msg = {
      id: "msg-1",
      role: "user" as const,
      content: "Hello world",
      timestamp: Date.now(),
    };

    useChatStore.getState().addMessage(msg);
    const state = useChatStore.getState();

    expect(state.sessions[id].messages).toHaveLength(1);
    expect(state.sessions[id].messages[0].content).toBe("Hello world");
  });

  it("auto-generates session title from first user message", () => {
    const id = useChatStore.getState().createSession();
    useChatStore.getState().addMessage({
      id: "msg-1",
      role: "user",
      content: "Tell me about TypeScript",
      timestamp: Date.now(),
    });

    expect(useChatStore.getState().sessions[id].title).toBe(
      "Tell me about TypeScript"
    );
  });

  it("appends to last message", () => {
    useChatStore.getState().createSession();
    useChatStore.getState().addMessage({
      id: "msg-1",
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    });

    useChatStore.getState().appendToLastMessage("Hello ");
    useChatStore.getState().appendToLastMessage("World");

    const msgs = useChatStore.getState().getActiveMessages();
    expect(msgs[0].content).toBe("Hello World");
  });

  it("deletes a session", () => {
    const id1 = useChatStore.getState().createSession();
    const id2 = useChatStore.getState().createSession();

    useChatStore.getState().deleteSession(id2);
    const state = useChatStore.getState();

    expect(state.sessions[id2]).toBeUndefined();
    expect(state.sessions[id1]).toBeDefined();
  });

  it("switches active session on delete if current was deleted", () => {
    const id1 = useChatStore.getState().createSession();
    const id2 = useChatStore.getState().createSession();
    useChatStore.getState().switchSession(id2);

    useChatStore.getState().deleteSession(id2);

    expect(useChatStore.getState().activeSessionId).toBe(id1);
  });

  it("renames a session", () => {
    const id = useChatStore.getState().createSession();
    useChatStore.getState().renameSession(id, "My Custom Title");

    expect(useChatStore.getState().sessions[id].title).toBe("My Custom Title");
  });
});
