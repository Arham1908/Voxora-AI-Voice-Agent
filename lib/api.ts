const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

function buildApiUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${normalizedEndpoint}`;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const defaultHeaders: HeadersInit = {
        "Content-Type": "application/json",
    };

    // Support either token-based auth or cookie-based auth.
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
        (defaultHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildApiUrl(endpoint), {
        credentials: "include",
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    if (!response.ok) {
        let errorMessage = `API Error (${response.status})`;
        const contentType = response.headers.get("content-type") || "";

        try {
            if (contentType.includes("application/json")) {
                const errorData = await response.json();
                errorMessage =
                    errorData?.message ||
                    errorData?.detail ||
                    errorData?.error ||
                    errorMessage;
            } else {
                const text = (await response.text()).trim();
                if (text) {
                    errorMessage = text.slice(0, 200);
                }
            }
        } catch {
            // Keep default error message when error payload parsing fails.
        }

        if (response.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("access_token");
            }
            throw new Error(errorMessage || "Unauthorized. Please sign in or provide a valid API token.");
        }
        throw new Error(errorMessage);
    }

    // 204 No Content — nothing to parse
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return undefined;
    }

    return response.json();
}

export const api = {
    getOrders: (params?: { page?: number; pageSize?: number }) => {
        const p = new URLSearchParams();
        if (params?.page) p.append("page", String(params.page));
        if (params?.pageSize) p.append("page_size", String(params.pageSize));
        const qs = p.toString();
        return fetchWithAuth(`/orders/${qs ? "?" + qs : ""}`);
    },
    getMenu: (params?: { page?: number; pageSize?: number; categoryId?: string }) => {
        const p = new URLSearchParams();
        if (params?.page) p.append("page", String(params.page));
        if (params?.pageSize) p.append("page_size", String(params.pageSize));
        if (params?.categoryId) p.append("category", params.categoryId);
        const qs = p.toString();
        return fetchWithAuth(`/menu/${qs ? "?" + qs : ""}`);
    },
    getCategories: () => fetchWithAuth("/menu/categories/"),
    createCategory: (data: { name: string; description?: string }) =>
        fetchWithAuth("/menu/categories/", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteCategory: (id: string | number) =>
        fetchWithAuth(`/menu/categories/?id=${id}`, {
            method: "DELETE",
        }),
    getStats: () => fetchWithAuth('/order_stats/'),
    getRevenueStats: () => fetchWithAuth('/Revenue_Performance/'),
    getSalesDistribution: () => fetchWithAuth('/Sales_Distribution/'),
    createMenuItem: (data: { name: string; cost: number; category?: number; id?: string }) =>
        fetchWithAuth("/menu/", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteMenuItem: (id: string) =>
        fetchWithAuth(`/menu/?id=${id}`, {
            method: "DELETE",
        }),

    // ── Calls ─────────────────────────────────────────────────────────────────
    getCalls: (params?: { page?: number; pageSize?: number }) => {
        const p = new URLSearchParams();
        if (params?.page) p.append("page", String(params.page));
        if (params?.pageSize) p.append("page_size", String(params.pageSize));
        const qs = p.toString();
        return fetchWithAuth(`/calls/${qs ? "?" + qs : ""}`);
    },
    getCallStatus: (conversationId: string) => fetchWithAuth(`/calls/status/${conversationId}/`),

    // ── Appointments ─────────────────────────────────────────────────────────
    getAppointments: (params?: { page?: number; pageSize?: number }) => {
        const p = new URLSearchParams();
        if (params?.page) p.append("page", String(params.page));
        if (params?.pageSize) p.append("page_size", String(params.pageSize));
        const qs = p.toString();
        return fetchWithAuth(`/appointment/all/${qs ? "?" + qs : ""}`);
    },

    // ── Appointment Schedules ────────────────────────────────────────────────
    getSchedules: () =>
        fetchWithAuth("/appointment/schedule/"),

    createSchedule: (data: import("@/types/schedule").SchedulePayload) =>
        fetchWithAuth("/appointment/schedule/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    updateSchedule: (id: number, data: import("@/types/schedule").SchedulePayload) =>
        fetchWithAuth(`/appointment/schedule/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    deleteSchedule: (id: number) =>
        fetchWithAuth(`/appointment/schedule/${id}/`, {
            method: "DELETE",
        }),

    // ── Gemini AI Analytics ────────────────────────────────────────────────
    getGeminiCosts: () => fetchWithAuth("/gemini-costs/"),
    getGeminiHistory: (agentType?: string, params?: { page?: number; pageSize?: number }) => {
        const p = new URLSearchParams();
        if (agentType) p.append("agent_type", agentType);
        if (params?.page) p.append("page", String(params.page));
        if (params?.pageSize) p.append("page_size", String(params.pageSize));
        const qs = p.toString();
        return fetchWithAuth(`/gemini-history/${qs ? "?" + qs : ""}`);
    },
};
