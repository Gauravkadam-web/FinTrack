import { apiClient } from "@/lib/api-client";
import {
  AIBudgetForecastResponse,
  AICategorizeRequest,
  AICategorizeResponse,
  AIInsightsResponse,
  AIParseExpenseRequest,
  AIParsedExpenseResponse,
  AIReceiptScanRequest,
  AIReceiptScanResponse,
} from "@/types";

export async function categorizeExpense(
  payload: AICategorizeRequest
): Promise<AICategorizeResponse> {
  return apiClient<AICategorizeResponse>("ai/categorize", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function parseExpenseText(
  payload: AIParseExpenseRequest
): Promise<AIParsedExpenseResponse> {
  return apiClient<AIParsedExpenseResponse>("ai/parse-expense", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function scanReceipt(
  payload: AIReceiptScanRequest
): Promise<AIReceiptScanResponse> {
  return apiClient<AIReceiptScanResponse>("ai/scan-receipt", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAiInsights(
  period: string = "month"
): Promise<AIInsightsResponse> {
  return apiClient<AIInsightsResponse>(
    `ai/insights?period=${encodeURIComponent(period)}`
  );
}

export async function getBudgetForecast(): Promise<AIBudgetForecastResponse> {
  return apiClient<AIBudgetForecastResponse>("ai/budget-forecast");
}
