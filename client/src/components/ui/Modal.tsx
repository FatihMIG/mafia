import { useEffect } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="nes-container is-rounded relative w-full max-w-md bg-mafia-panel text-mafia-text shadow-lg shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 text-mafia-muted hover:text-mafia-text"
        >
          <Icon name="times" className="text-xl" />
        </button>
        <p className="mb-2 flex items-center gap-1.5 pr-6 font-semibold text-mafia-text">
          <Icon name="info-circle" /> {title}
        </p>
        <div className="text-sm text-mafia-muted">{children}</div>
      </div>
    </div>
  );
}
