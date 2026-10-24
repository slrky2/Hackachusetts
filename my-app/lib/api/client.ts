/**
 * Lightweight fetch wrapper for calling internal Next.js API routes.
 * All requests include credentials (cookies) for session-based auth.
 */

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiClient<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "API request failed");
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiClient<T>(path),
  post: <T>(path: string, body: unknown) => apiClient<T>(path, { method: "POST", body }),
  put: <T>(path: string, body: unknown) => apiClient<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body: unknown) => apiClient<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiClient<T>(path, { method: "DELETE" }),
};
