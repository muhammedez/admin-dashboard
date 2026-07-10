const BASE = "/api"

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  return entries.length ? "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : ""
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || "Request failed")
  }
  return res.json()
}

export const api = {
  products: {
    list: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
      request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/products${qs(params || {})}`),
    get: (id: string) => request<any>(`/products/${id}`),
    create: (data: any) => request<any>(`/products`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: "DELETE" }),
  },
  customers: {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/customers${qs(params || {})}`),
    get: (id: string) => request<any>(`/customers/${id}`),
    create: (data: any) => request<any>(`/customers`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/customers/${id}`, { method: "DELETE" }),
  },
  stats: {
    get: (params?: { from?: string; to?: string }) =>
      request<{ stats: any; revenueData: any[]; categoryRevenue: any[]; paymentMethods: any[] }>(`/stats${qs(params || {})}`),
  },
  transactions: {
    list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
      request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/transactions${qs(params || {})}`),
    get: (id: string) => request<any>(`/transactions/${id}`),
    create: (data: any) => request<any>(`/transactions`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/transactions/${id}`, { method: "DELETE" }),
  },
}
