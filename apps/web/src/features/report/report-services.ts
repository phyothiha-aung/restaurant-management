import type {
  ApiErrorResponse,
  FinancialReport,
} from "@restaurant-management/shared";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  getFinancialReport,
  type FinancialReportQuery,
} from "./report-api";

export const reportKeys = {
  all: ["reports"] as const,
  financial: (query: FinancialReportQuery) =>
    [...reportKeys.all, "financial", query] as const,
};

export const useFinancialReport = (query: FinancialReportQuery) =>
  useQuery<FinancialReport, AxiosError<ApiErrorResponse>>({
    queryKey: reportKeys.financial(query),
    queryFn: () => getFinancialReport(query),
    staleTime: 60_000,
  });
