import type { HTMLAttributes } from "react";

type BadgeTone = "gold" | "red" | "neutral" | "success";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  gold: "bg-[var(--brand-gold-soft)] text-[var(--brand-gold-dark)]",
  red: "bg-[var(--brand-red-soft)] text-[var(--brand-red)]",
  neutral: "bg-[var(--line-soft)] text-[var(--muted)]",
  success: "bg-[#e9f7ef] text-[var(--success)]",
};

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
