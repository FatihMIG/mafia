import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-mafia-panel2 bg-mafia-panel p-6 shadow-lg shadow-black/40 ${className}`}
      {...props}
    />
  );
}
