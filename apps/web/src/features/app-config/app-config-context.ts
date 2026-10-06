import type { AppConfig } from "@restaurant-management/shared";
import { createContext, useContext } from "react";

export const AppConfigContext = createContext<AppConfig | null>(null);

export function useAppConfig() {
  const config = useContext(AppConfigContext);
  if (!config) throw new Error("useAppConfig must be used inside AppConfigProvider");
  return config;
}
