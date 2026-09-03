import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { todayLocalISODate } from "./date";
import { DatePicker } from "./date-picker";

describe("DatePicker", () => {
  it("floors selection at today via the native min attribute", () => {
    render(<DatePicker value={null} onChange={vi.fn()} />);

    const input = screen.getByLabelText(/appointment date/i);
    expect(input).toHaveAttribute("type", "date");
    expect(input).toHaveAttribute("min", todayLocalISODate());
  });

  it("reports a valid future date to the parent", async () => {
    const onChange = vi.fn();
    render(<DatePicker value={null} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText(/appointment date/i), "2030-06-15");

    expect(onChange).toHaveBeenLastCalledWith("2030-06-15");
  });

  it("does not report a past date", async () => {
    const onChange = vi.fn();
    render(<DatePicker value={null} onChange={onChange} />);

    // A date before `min`; the component's own guard rejects it even if the
    // browser control would allow the keystrokes.
    await userEvent.type(screen.getByLabelText(/appointment date/i), "2000-01-01");

    expect(onChange).not.toHaveBeenCalledWith("2000-01-01");
  });

  it("shows the current value", () => {
    render(<DatePicker value="2031-12-24" onChange={vi.fn()} />);
    expect(screen.getByLabelText(/appointment date/i)).toHaveValue("2031-12-24");
  });
});
