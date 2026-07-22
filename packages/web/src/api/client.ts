/// <reference types="vite/client" />

const BASE_URL = import.meta.env.VITE_API_URL || '';

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeout?: number;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const { body, timeout = 10000, ...init } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  const token = localStorage.getItem('omniplan_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      ...init,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('omniplan_token');
        window.dispatchEvent(new CustomEvent('auth:invalid'));
      }
      throw new ApiError(data.error || 'Request failed', res.status, data.details);
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    }
    throw new ApiError(err instanceof Error ? err.message : 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

export function get<T = unknown>(url: string): Promise<T> {
  return request<T>(url);
}

export function post<T = unknown>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body });
}

export function patch<T = unknown>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: 'PATCH', body });
}

export function del<T = unknown>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' });
}
