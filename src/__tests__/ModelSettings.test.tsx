import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModelSettings } from "@/widgets/model-settings/ModelSettings";

describe("ModelSettings", () => {
  it("renders settings dialog", () => {
    render(<ModelSettings onClose={vi.fn()} />);
    expect(screen.getByText("Settings")).toBeDefined();
    expect(screen.getByLabelText("Select model")).toBeDefined();
    expect(screen.getByLabelText("System prompt")).toBeDefined();
    expect(screen.getByLabelText("Temperature")).toBeDefined();
  });

  it("has correct ARIA attributes", () => {
    render(<ModelSettings onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<ModelSettings onClose={onClose} />);
    fireEvent.click(screen.getByText("Done"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<ModelSettings onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay clicked", () => {
    const onClose = vi.fn();
    render(<ModelSettings onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalled();
  });
});
