import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

// NES.css variant classes; "ghost" has no nes-btn equivalent so it stays a
// plain text control instead of a bordered pixel button.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "nes-btn is-primary",
  secondary: "nes-btn",
  danger: "nes-btn is-error",
  ghost: "bg-transparent text-mafia-onDarkMuted hover:text-mafia-onDark underline-offset-4 hover:underline disabled:opacity-50",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  // nes-btn's disabled look requires both the HTML attribute and this class.
  const disabledClass = variant !== "ghost" && disabled ? "is-disabled" : "";
  return (
    <button
      className={`font-pixel text-xl tracking-wide disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${disabledClass} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
