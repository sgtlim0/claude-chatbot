import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageInput } from "@/widgets/message-input/MessageInput";

vi.mock("@/shared/store/chatStore", () => ({
  useChatStore: vi.fn((selector) => {
    const state = { isStreaming: false };
    return selector(state);
  }),
}));

vi.mock("@/features/send-message/sendMessage", () => ({
  sendMessage: vi.fn(),
  abortCurrentStream: vi.fn(),
}));

describe("MessageInput", () => {
  it("renders input and send button", () => {
    render(<MessageInput />);
    expect(screen.getByPlaceholderText("Message...")).toBeDefined();
    expect(screen.getByLabelText("Send message")).toBeDefined();
  });

  it("has correct aria labels", () => {
    render(<MessageInput />);
    expect(screen.getByLabelText("Message input")).toBeDefined();
    expect(screen.getByLabelText("Send message")).toBeDefined();
  });

  it("disables send when empty", () => {
    render(<MessageInput />);
    const btn = screen.getByLabelText("Send message");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("enables send when text entered", () => {
    render(<MessageInput />);
    const input = screen.getByPlaceholderText("Message...");
    fireEvent.change(input, { target: { value: "Hello" } });
    const btn = screen.getByLabelText("Send message");
    expect(btn.hasAttribute("disabled")).toBe(false);
  });
});
