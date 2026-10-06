import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getAppConfig } from "./app-config-api";
import { AppConfigContext } from "./app-config-context";

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ["app-config"],
    queryFn: getAppConfig,
    staleTime: Infinity,
    retry: 1,
  });

  if (query.isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas text-sm font-semibold text-muted">
        Loading restaurant settings…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6">
        <div className="max-w-md rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-extrabold text-ink">Could not load restaurant settings</h1>
          <p className="mt-2 text-sm text-muted">Check that the API is running and try again.</p>
          <button className="mt-5 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white" onClick={() => void query.refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppConfigContext.Provider value={query.data}>
      {children}
    </AppConfigContext.Provider>
  );
}
