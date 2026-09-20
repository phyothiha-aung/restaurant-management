import { LogOut, UtensilsCrossed } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { logout } from "../features/auth/auth-services";

export function HomePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <main className="min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 sm:px-16">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg rounded-bl-sm bg-[#283b37] text-[var(--surface)]">
          <UtensilsCrossed size={17} />
        </div>
        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--line-soft)] hover:text-[var(--ink)]"
          onClick={() => void logout()}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
      <section className="max-w-3xl px-5 py-20 sm:px-36 sm:py-40">
        <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          Service desk
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-5xl font-bold leading-none tracking-tight sm:text-7xl">
          Good to see you, {user?.name.split(" ")[0]}.
        </h1>
        <p className="mt-6 max-w-lg text-base text-[var(--muted)] sm:text-lg">
          Your restaurant workspace is ready. Operations tools will appear here
          as they come online.
        </p>
      </section>
    </main>
  );
}
