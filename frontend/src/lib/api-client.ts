import { ApiError, ApiErrorResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000/api/v1";

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
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, "")}`;

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

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return null as unknown as T;
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
