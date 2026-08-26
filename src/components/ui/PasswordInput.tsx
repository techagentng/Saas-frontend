"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

type PasswordInputProps = {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
};

/**
 * Password field with a show/hide toggle. Shared by login and register so
 * both behave identically.
 *
 * Accessibility notes: the toggle is `type="button"` so it can never submit
 * the form, carries an aria-label that states the action it will perform,
 * and exposes `aria-pressed` so screen readers announce the current state.
 * `aria-controls` ties it to the field it governs. The icon itself is
 * decorative and hidden from assistive technology. Extra right padding keeps
 * typed text from running underneath the button.
 */
export function PasswordInput({ id, className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        id={id}
        type={isVisible ? "text" : "password"}
        className={cn(className, "pr-12")}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        aria-controls={id}
        // Not disabled while the form submits: revealing what you typed is
        // still useful (and harmless) while a request is in flight.
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition-colors hover:text-slate-600 focus-visible:text-slate-600"
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
