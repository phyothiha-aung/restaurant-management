import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-red)] text-white shadow-sm hover:bg-[var(--brand-red-dark)]",
  secondary:
    "bg-[var(--brand-gold)] text-[#33250b] shadow-sm hover:bg-[#c69825]",
  outline:
    "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand-gold)] hover:bg-[var(--brand-gold-soft)]",
  ghost:
    "bg-transparent text-[var(--muted)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)]",
  danger: "bg-[var(--danger)] text-white hover:bg-[#8f1c14]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingLabel = "Please wait...",
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)] disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
