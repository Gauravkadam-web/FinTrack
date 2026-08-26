import { apiClient } from "@/lib/api-client";
import {
  AverageSpendResponse,
  DashboardComparisonResponse,
  DashboardSummaryResponse,
  DashboardTrendResponse,
  TopCategoriesResponse,
} from "@/types";

export async function getDashboardSummary(
  month?: string
): Promise<DashboardSummaryResponse> {
  return apiClient<DashboardSummaryResponse>("dashboard/summary", {
    params: { month },
  });
}

export async function getDashboardTrend(
  granularity: "daily" | "weekly" | "monthly" = "daily",
  month?: string
): Promise<DashboardTrendResponse> {
  return apiClient<DashboardTrendResponse>("dashboard/trend", {
    params: { granularity, month },
  });
}

export async function getDashboardComparison(
  month?: string
): Promise<DashboardComparisonResponse> {
  return apiClient<DashboardComparisonResponse>("dashboard/comparison", {
    params: { month },
  });
}

export async function getTopCategories(
  month?: string,
  limit: number = 5
): Promise<TopCategoriesResponse> {
  return apiClient<TopCategoriesResponse>("dashboard/top-categories", {
    params: { month, limit },
  });
}

export async function getAverageSpend(
  period: "daily" | "weekly" = "daily"
): Promise<AverageSpendResponse> {
  return apiClient<AverageSpendResponse>("dashboard/average-spend", {
    params: { period },
  });
}
