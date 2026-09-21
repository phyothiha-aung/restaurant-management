import type { HTMLAttributes } from "react";

type BadgeTone = "gold" | "red" | "neutral" | "success";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  gold: "bg-brand-gold-soft text-brand-gold-dark",
  red: "bg-brand-red-soft text-brand-red",
  neutral: "bg-line-soft text-muted",
  success: "bg-success-soft text-success",
};

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
