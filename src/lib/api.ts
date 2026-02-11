import { getAuthHeaders } from "@/lib/auth";

// Base URL from environment or default to empty (relative)
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiRequest(
    method: string,
    path: string,
    data?: unknown
): Promise<Response> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
        ...getAuthHeaders(),
    };

    if (data) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
    });

    return res;
}

export async function fetchJson<T>(path: string): Promise<T> {
    const res = await apiRequest("GET", path);
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "An error occurred" }));
        throw new Error(error.message || `Request failed with status ${res.status}`);
    }
    return res.json();
}
