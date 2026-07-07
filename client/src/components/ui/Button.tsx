import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "leather-surface bg-mafia-accent text-mafia-text hover:brightness-110 disabled:bg-mafia-panel2",
  secondary: "leather-surface bg-mafia-panel2 text-mafia-text hover:brightness-110 disabled:opacity-50",
  danger: "leather-surface bg-red-950 text-mafia-text hover:brightness-110 disabled:opacity-50",
  ghost: "bg-transparent text-mafia-muted hover:text-mafia-text disabled:opacity-50",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 font-medium tracking-wide transition-all disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
