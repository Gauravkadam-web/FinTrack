import { ApiError, ApiErrorResponse, TokenResponse } from "@/types";

function getApiBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!rawUrl) {
    return "http://localhost:8000/api/v1";
  }
  if (!rawUrl.endsWith("/api/v1")) {
    return `${rawUrl}/api/v1`;
  }
  return rawUrl;
}

const API_BASE_URL = getApiBaseUrl();

export class ApiClientError extends Error {
  code: string;
  status: number;
  field?: string | null;

  constructor(status: number, code: string, message: string, field?: string | null) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

// In-memory token management
let currentAccessToken: string | null = null;
let onAuthFailureCallback: (() => void) | null = null;
let onTokenRefreshedCallback: ((token: string) => void) | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setAuthCallbacks(
  onFailure: () => void,
  onTokenRefreshed: (token: string) => void
) {
  onAuthFailureCallback = onFailure;
  onTokenRefreshedCallback = onTokenRefreshed;
}

// Concurrency queue for token refresh
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  refreshQueue = [];
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, skipAuth, ...customConfig } = options;
  const cleanEndpoint = endpoint.replace(/^\/+/, "");

  let url = `${API_BASE_URL}/${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  // Attach Bearer token if present and not skipping auth
  if (!skipAuth && currentAccessToken && !reqHeaders["Authorization"]) {
    reqHeaders["Authorization"] = `Bearer ${currentAccessToken}`;
  }

  const config: RequestInit = {
    credentials: "include", // Required for HttpOnly refresh cookie sending cross-origin
    headers: reqHeaders,
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);

    // 204 No Content
    if (response.status === 204) {
      return null as unknown as T;
    }

    // 401 Unauthorized handling (token refresh flow)
    if (response.status === 401 && !skipAuth && !cleanEndpoint.startsWith("auth/")) {
      if (isRefreshing) {
        // Queue this request while refresh completes
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          reqHeaders["Authorization"] = `Bearer ${newToken}`;
          return apiClient<T>(endpoint, { ...options, headers: reqHeaders });
        });
      }

      isRefreshing = true;

      try {
        // Attempt silent refresh using HttpOnly cookie
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!refreshRes.ok) {
          throw new Error("Refresh failed");
        }

        const refreshData: TokenResponse = await refreshRes.json();
        const newToken = refreshData.access_token;
        setAccessToken(newToken);
        if (onTokenRefreshedCallback) {
          onTokenRefreshedCallback(newToken);
        }

        processQueue(null, newToken);

        // Retry original request
        reqHeaders["Authorization"] = `Bearer ${newToken}`;
        return apiClient<T>(endpoint, { ...options, headers: reqHeaders });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        if (onAuthFailureCallback) {
          onAuthFailureCallback();
        }
        throw new ApiClientError(401, "UNAUTHORIZED", "Session expired. Please log in again.");
      } finally {
        isRefreshing = false;
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errResponse = data as ApiErrorResponse | null;
      const errorCode = errResponse?.error?.code || `HTTP_${response.status}`;
      const errorMessage =
        errResponse?.error?.message || response.statusText || "Request failed";
      const errorField = errResponse?.error?.field;

      throw new ApiClientError(response.status, errorCode, errorMessage, errorField);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Unable to reach server. Please check backend connection."
    );
  }
}
