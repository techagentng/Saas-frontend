"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DialogProps = {
  title: string;
  /** Optional supporting copy, wired to `aria-describedby` so it is announced with the title. */
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Rendered in a right-aligned row at the foot of the dialog. */
  footer?: ReactNode;
};

/**
 * Modal dialog built on plain elements rather than `<dialog>`: the native
 * element's `showModal()` is not implemented in jsdom, so a component test
 * could not open one — and a dialog whose open state is untestable is exactly
 * the wrong place to hide the archive confirmation.
 *
 * Accessibility, in full: `role="dialog"` + `aria-modal`, labelled by its
 * heading and described by its supporting copy; focus moves to the first
 * focusable control on open and is restored to the invoking element on close;
 * Tab cycles within the dialog; Escape closes; the backdrop is a real button
 * with an accessible name rather than a click-handling div; and page scroll is
 * locked while it is open.
 */
export function Dialog({ title, description, onClose, children, footer }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Captured before focus moves into the dialog, and restored on unmount, so
  // dismissing returns the user to the control they opened it from rather
  // than to the top of the document.
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // The dialog is portaled to its own host under <body>, and every sibling of
  // that host is hidden from the accessibility tree while it is open. Without
  // that, a screen reader still reaches the page behind the modal — the "Add
  // service" button that opened the dialog stays announced alongside the
  // dialog's own submit button, which is exactly the ambiguity `aria-modal`
  // promises is not there.
  //
  // The host is built in a lazy state initializer rather than in an effect so
  // the very first render can already portal into it: creating a detached node
  // touches nothing in the document, and the effect below is what actually
  // attaches it. `document` is guarded because this module is prerendered on
  // the server, where a Dialog is never mounted (it only ever opens from a
  // click), so there is no markup for the null branch to mismatch against.
  const [container] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.createElement("div")
  );

  useEffect(() => {
    if (!container) return;

    document.body.appendChild(container);

    const siblings = Array.from(document.body.children).filter((child) => child !== container);
    const restore = siblings.map((sibling) => ({
      element: sibling,
      previous: sibling.getAttribute("aria-hidden"),
    }));
    for (const sibling of siblings) sibling.setAttribute("aria-hidden", "true");

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? panelRef.current)?.focus();

    return () => {
      for (const { element, previous } of restore) {
        if (previous === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", previous);
      }
      document.body.style.overflow = overflow;
      container.remove();
      previouslyFocused.current?.focus();
    };
  }, [container]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!container) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={`Close ${title}`}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-xl outline-none sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>,
    container
  );
}
