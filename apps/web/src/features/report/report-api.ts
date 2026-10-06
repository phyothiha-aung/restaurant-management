import type {
  ApiSuccessResponse,
  FinancialReport,
} from "@restaurant-management/shared";
import apiClient from "../../lib/api-client";

export interface FinancialReportQuery {
  dateFrom: string;
  dateTo: string;
}

export const getFinancialReport = async (query: FinancialReportQuery) => {
  const response = await apiClient.get<ApiSuccessResponse<FinancialReport>>(
    "/api/reports/financial",
    { params: query },
  );
  return response.data.data;
};
