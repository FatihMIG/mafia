import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-mafia-accent text-white hover:bg-red-700 disabled:bg-mafia-panel2",
  secondary: "bg-mafia-panel2 text-mafia-text hover:bg-mafia-panel disabled:opacity-50",
  danger: "bg-red-900 text-white hover:bg-red-800 disabled:opacity-50",
  ghost: "bg-transparent text-mafia-muted hover:text-mafia-text disabled:opacity-50",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 font-medium tracking-wide transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
