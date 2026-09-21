import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] shadow-[var(--shadow-card)] ${className}`}
      {...props}
    />
  );
}
