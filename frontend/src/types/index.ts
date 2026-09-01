export type PaymentMode = "cash" | "card" | "upi" | "other";

export type BudgetStatus = "on_track" | "near_limit" | "over_budget";

export type AuthProvider = "local" | "google";

export interface User {
  id: string;
  email: string;
  display_name: string;
  email_verified: boolean;
  auth_provider: AuthProvider;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Category {
  id: string;
  name: string;
  is_system: boolean;
  expense_count: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  title: string;
  category_id: string;
  category_name?: string | null;
  amount: number | string;
  expense_date: string;
  notes?: string | null;
  payment_mode?: PaymentMode | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseListResponse {
  items: Expense[];
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
}

export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  payment_mode?: PaymentMode;
  sort_by?: "amount" | "date" | "category";
  sort_order?: "asc" | "desc";
}

export interface Budget {
  id: string;
  category_id?: string | null;
  category_name?: string | null;
  period_month: string;
  limit_amount: number | string;
  spent: number | string;
  remaining: number | string;
  status: BudgetStatus;
  created_at: string;
  updated_at: string;
}

export interface BudgetListResponse {
  month: string;
  overall: Budget | null;
  categories: Budget[];
  total_budget: number | string;
  total_spent: number | string;
  total_remaining: number | string;
}

export interface CategoryBreakdownItem {
  category_id: string;
  category_name: string;
  amount: number | string;
  percentage: number;
}

export interface BudgetSnapshot {
  id?: string | null;
  limit_amount: number | string;
  spent: number | string;
  remaining: number | string;
  status: BudgetStatus;
  percentage_used: number;
}

export interface DashboardSummaryResponse {
  month: string;
  total_spent: number | string;
  expense_count: number;
  recent_expenses: Expense[];
  category_breakdown: CategoryBreakdownItem[];
  budget_snapshot?: BudgetSnapshot | null;
}

export interface DashboardTrendItem {
  label: string;
  amount: number | string;
}

export interface DashboardTrendResponse {
  granularity: "daily" | "weekly" | "monthly";
  month?: string | null;
  items: DashboardTrendItem[];
}

export interface DashboardComparisonResponse {
  current_month: string;
  previous_month: string;
  current_total: number | string;
  previous_total: number | string;
  difference: number | string;
  percentage_change?: number | null;
}

export interface TopCategoryItem {
  rank: number;
  category_id: string;
  category_name: string;
  total_spent: number | string;
  percentage_of_total: number;
}

export interface TopCategoriesResponse {
  month: string;
  items: TopCategoryItem[];
}

export interface AverageSpendResponse {
  period: "daily" | "weekly";
  average_amount: number | string;
  total_spent: number | string;
  units_count: number;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string | null;
}

export interface ApiErrorResponse {
  error: ApiError;
}
