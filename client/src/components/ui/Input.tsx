import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`nes-input font-pixel text-xl ${className}`} {...props} />;
}
