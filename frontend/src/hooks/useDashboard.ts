"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AverageSpendResponse,
  DashboardComparisonResponse,
  DashboardSummaryResponse,
  DashboardTrendResponse,
  TopCategoriesResponse,
} from "@/types";
import * as dashboardApi from "@/lib/api/dashboard";
import { getCurrentMonthStr } from "@/lib/utils";

export function useDashboard(initialMonth?: string) {
  const [month, setMonth] = useState<string>(initialMonth || getCurrentMonthStr());
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("daily");

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [trend, setTrend] = useState<DashboardTrendResponse | null>(null);
  const [comparison, setComparison] = useState<DashboardComparisonResponse | null>(null);
  const [topCategories, setTopCategories] = useState<TopCategoriesResponse | null>(null);
  const [averageSpend, setAverageSpend] = useState<AverageSpendResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (targetMonth: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const [summaryRes, compRes, topRes, avgRes] = await Promise.all([
        dashboardApi.getDashboardSummary(targetMonth),
        dashboardApi.getDashboardComparison(targetMonth),
        dashboardApi.getTopCategories(targetMonth, 5),
        dashboardApi.getAverageSpend("daily"),
      ]);

      setSummary(summaryRes);
      setComparison(compRes);
      setTopCategories(topRes);
      setAverageSpend(avgRes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTrendData = useCallback(
    async (targetGranularity: "daily" | "weekly" | "monthly", targetMonth: string) => {
      try {
        setIsTrendLoading(true);
        const trendRes = await dashboardApi.getDashboardTrend(
          targetGranularity,
          targetGranularity === "daily" ? targetMonth : undefined
        );
        setTrend(trendRes);
      } catch (err) {
        console.error("Failed to load trend data", err);
      } finally {
        setIsTrendLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchDashboardData(month);
  }, [month, fetchDashboardData]);

  useEffect(() => {
    fetchTrendData(granularity, month);
  }, [granularity, month, fetchTrendData]);

  const refreshAll = useCallback(() => {
    fetchDashboardData(month);
    fetchTrendData(granularity, month);
  }, [fetchDashboardData, fetchTrendData, granularity, month]);

  return {
    month,
    setMonth,
    granularity,
    setGranularity,
    summary,
    trend,
    comparison,
    topCategories,
    averageSpend,
    isLoading,
    isTrendLoading,
    error,
    refreshAll,
  };
}
