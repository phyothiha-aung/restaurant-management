import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Button } from "../ui/Button";

export function AppShell() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar border-r border-line lg:block">
        <Sidebar />
      </aside>

      {isNavigationOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            onClick={() => setIsNavigationOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="relative h-full w-[min(19rem,86vw)] border-r border-line shadow-2xl">
            <Sidebar
              onNavigate={() => setIsNavigationOpen(false)}
              onClose={() => setIsNavigationOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-sidebar">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2.5">
            <img
              className="h-9 w-9 rounded-full border border-brand-gold object-cover"
              src="/icon.jpg"
              alt=""
            />
            <span className="font-heading text-lg font-bold">Ann Htike</span>
          </div>
          <Button
            className="h-10 w-10 px-0"
            variant="outline"
            size="sm"
            onClick={() => setIsNavigationOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </Button>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-11">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
