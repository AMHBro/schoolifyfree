// Central Dashboard — الإنتاج: عيّن VITE_API_BASE_URL في Vercel (رابط الباك إند على Vercel بدون / في النهاية)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : "");

// Generic fetch wrapper with error handling and auto-authentication
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from localStorage
  const token = localStorage.getItem("central_admin_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let serverMessage = "";
    try {
      const errorPayload = await response.json();
      if (errorPayload?.message && typeof errorPayload.message === "string") {
        serverMessage = errorPayload.message;
      }
    } catch {
      // Ignore non-JSON error payloads
    }

    // If auth becomes invalid (expired/stale token), reset session and force re-login
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("central_admin_token");
      localStorage.removeItem("central_admin_data");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    throw new Error(
      serverMessage ||
        `API Error: ${response.status} ${response.statusText || "Request failed"}`
    );
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: (credentials: {
    username: string;
    password: string;
  }): Promise<{
    success: boolean;
    data: {
      token: string;
      admin: {
        id: string;
        username: string;
        name: string;
        email?: string;
      };
    };
    message?: string;
  }> =>
    fetchAPI("/auth/central/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
};

// Schools API
export const schoolsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      schools: Array<{
        id: string;
        username: string;
        schoolName: string;
        schoolCode: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        _count: {
          teachers: number;
          students: number;
          stages: number;
          activationKeys: number;
        };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const queryString = queryParams.toString();
    return fetchAPI(`/central/schools${queryString ? `?${queryString}` : ""}`);
  },

  getById: (
    id: string
  ): Promise<{
    success: boolean;
    data: {
      school: {
        id: string;
        username: string;
        password: string;
        schoolName: string;
        schoolCode: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        _count: {
          teachers: number;
          students: number;
          stages: number;
          activationKeys: number;
        };
      };
    };
  }> => fetchAPI(`/central/schools/${id}`),

  create: (data: {
    username: string;
    password: string;
    schoolName: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      school: {
        id: string;
        username: string;
        schoolName: string;
        schoolCode: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    };
  }> =>
    fetchAPI("/central/schools", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  toggleStatus: (
    id: string
  ): Promise<{
    success: boolean;
    message: string;
  }> =>
    fetchAPI(`/central/schools/${id}/toggle-status`, {
      method: "PATCH",
    }),

  updatePhone: (
    id: string,
    contactPhone: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      school: {
        id: string;
        username: string;
        schoolName: string;
        schoolCode: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    };
  }> =>
    fetchAPI(`/central/schools/${id}/phone`, {
      method: "PATCH",
      body: JSON.stringify({ contactPhone }),
    }),

  getActivationKeys: (id: string) =>
    fetchAPI(`/central/schools/${id}/activation-keys`),

  generateActivationKeys: (
    id: string,
    data: { count: number; expiresAt: string }
  ) =>
    fetchAPI(`/central/schools/${id}/activation-keys`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteActivationKeys: (id: string, keyIds: string[]) =>
    fetchAPI(`/central/schools/${id}/activation-keys/bulk`, {
      method: "DELETE",
      body: JSON.stringify({ keyIds }),
    }),

  deleteActivationKey: (id: string, keyId: string) =>
    fetchAPI(`/central/schools/${id}/activation-keys/${keyId}`, {
      method: "DELETE",
    }),

  updateActivationKeyExpiration: (
    id: string,
    keyId: string,
    expiresAt: string
  ) =>
    fetchAPI(`/central/schools/${id}/activation-keys/${keyId}/expiration`, {
      method: "PATCH",
      body: JSON.stringify({ expiresAt }),
    }),
};

// Requests API
export const requestsAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    const qs = queryParams.toString();
    return fetchAPI(`/central/requests${qs ? `?${qs}` : ""}`);
  },
  updateStatus: (id: string, status: string) =>
    fetchAPI(`/central/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export { API_BASE_URL };
