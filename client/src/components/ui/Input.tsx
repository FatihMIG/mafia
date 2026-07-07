import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-md border border-mafia-panel2 bg-mafia-panel px-3 py-2 text-mafia-text placeholder:text-mafia-muted focus:border-mafia-accent focus:outline-none ${className}`}
      {...props}
    />
  );
}
