import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/widgets/sidebar/Sidebar";

vi.mock("@/shared/store/chatStore", () => ({
  useChatStore: Object.assign(
    vi.fn((selector?: any) => {
      const state = {
        sessions: {},
        activeSessionId: null,
        createSession: vi.fn(),
        switchSession: vi.fn(),
        deleteSession: vi.fn(),
        togglePin: vi.fn(),
        searchQuery: "",
        setSearchQuery: vi.fn(),
      };
      return typeof selector === "function" ? selector(state) : state;
    }),
    {
      getState: vi.fn(() => ({
        sessions: {},
        activeSessionId: null,
        createSession: vi.fn(),
        switchSession: vi.fn(),
        deleteSession: vi.fn(),
        togglePin: vi.fn(),
        searchQuery: "",
        setSearchQuery: vi.fn(),
      })),
    }
  ),
}));

vi.mock("@/shared/lib/debounce", () => ({
  debounce: (fn: any) => fn,
}));

describe("Sidebar", () => {
  it("renders when not collapsed", () => {
    render(<Sidebar collapsed={false} />);
    expect(screen.getByText("New Chat")).toBeDefined();
    expect(screen.getByText("Search")).toBeDefined();
  });

  it("has correct aria labels", () => {
    render(<Sidebar collapsed={false} />);
    expect(screen.getByLabelText("New chat")).toBeDefined();
    expect(screen.getByLabelText("Search")).toBeDefined();
  });
});
