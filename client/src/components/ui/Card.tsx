import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`nes-container is-rounded bg-mafia-panel text-mafia-text shadow-lg shadow-black/40 ${className}`}
      {...props}
    />
  );
}
