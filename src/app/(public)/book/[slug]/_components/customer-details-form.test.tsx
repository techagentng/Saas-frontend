import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CustomerDetailsForm } from "./customer-details-form";

describe("CustomerDetailsForm", () => {
  it("has real labels wired to inputs", () => {
    render(<CustomerDetailsForm onSubmit={vi.fn()} isPending={false} />);

    expect(screen.getByLabelText(/your name/i).tagName).toBe("INPUT");
    expect(screen.getByLabelText(/phone/i)).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
  });

  it("blocks submit and associates the error with the name field when empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CustomerDetailsForm onSubmit={onSubmit} isPending={false} />);

    await user.click(screen.getByRole("button", { name: /book appointment/i }));

    const name = screen.getByLabelText(/your name/i);
    expect(name).toHaveAttribute("aria-invalid", "true");
    const describedBy = name.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)).toHaveTextContent(/enter your name/i);
    expect(name).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a malformed email but accepts a blank one", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CustomerDetailsForm onSubmit={onSubmit} isPending={false} />);

    await user.type(screen.getByLabelText(/your name/i), "Jane");
    await user.type(screen.getByLabelText(/email/i), "nope");
    await user.click(screen.getByRole("button", { name: /book appointment/i }));
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/email/i));
    await user.click(screen.getByRole("button", { name: /book appointment/i }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "Jane" });
  });

  it("omits blank phone/email and trims values", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CustomerDetailsForm onSubmit={onSubmit} isPending={false} />);

    await user.type(screen.getByLabelText(/your name/i), "  Jane Customer  ");
    await user.type(screen.getByLabelText(/phone/i), " 08000000000 ");
    await user.click(screen.getByRole("button", { name: /book appointment/i }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Jane Customer", phone: "08000000000" });
  });

  it("shows a pending, disabled, aria-busy button while a booking is in flight", () => {
    render(<CustomerDetailsForm onSubmit={vi.fn()} isPending />);

    const button = screen.getByRole("button", { name: /booking…/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("surfaces a pre-mapped server error via role=alert", () => {
    render(
      <CustomerDetailsForm
        onSubmit={vi.fn()}
        isPending={false}
        serverError="We couldn't complete your booking. Please try again."
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't complete your booking/i);
  });
});
