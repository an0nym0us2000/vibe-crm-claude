/**
 * Refine Data Provider
 * Custom data provider with workspace support and auth headers
 */
"use client";

import { DataProvider } from "@refinedev/core";
import { getAccessToken } from "@/utils/supabase-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Build URL with query parameters
 */
const buildUrl = (path: string, params?: Record<string, string>) => {
    const url = new URL(`${API_URL}${path}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });
    }

    return url.toString();
};

/**
 * Make authenticated API request
 */
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = await getAccessToken();

    if (!token) {
        throw new Error("Authentication required");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.error?.message ||
            errorData.detail ||
            `HTTP ${response.status}: ${response.statusText}`
        );
    }

    return response.json();
};

export const dataProvider: DataProvider = {
    /**
     * Get list of records with pagination, filtering, and sorting
     */
    getList: async ({ resource, pagination, filters, sorters, meta }) => {
        const workspaceId = meta?.workspaceId;
        const entityId = meta?.entityId;

        if (!workspaceId || !entityId) {
            throw new Error("Workspace ID and Entity ID are required");
        }

        const params: Record<string, string> = {};

        // Pagination
        if (pagination) {
            params.page = String(pagination.current || 1);
            params.per_page = String(pagination.pageSize || 50);
        }

        // Sorting
        if (sorters && sorters.length > 0) {
            const sorter = sorters[0];
            params.sort_by = sorter.field;
            params.sort_order = sorter.order === "asc" ? "asc" : "desc";
        }

        // Filters
        if (filters && filters.length > 0) {
            const filterObj = filters.reduce((acc, filter) => {
                if (filter.operator === "eq" && filter.field && filter.value !== undefined) {
                    acc[filter.field] = filter.value;
                }
                return acc;
            }, {} as Record<string, any>);

            if (Object.keys(filterObj).length > 0) {
                params.filters = JSON.stringify(filterObj);
            }
        }

        const url = buildUrl(
            `/workspaces/${workspaceId}/entities/${entityId}/records`,
            params
        );

        const result = await fetchWithAuth(url);

        return {
            data: result.data.records || [],
            total: result.data.pagination?.total || 0,
        };
    },

    /**
     * Get one record by ID
     */
    getOne: async ({ resource, id, meta }) => {
        const workspaceId = meta?.workspaceId;
        const entityId = meta?.entityId;

        if (!workspaceId || !entityId) {
            throw new Error("Workspace ID and Entity ID are required");
        }

        const url = buildUrl(
            `/workspaces/${workspaceId}/entities/${entityId}/records/${id}`
        );

        const result = await fetchWithAuth(url);

        return {
            data: result.data.record,
        };
    },

    /**
     * Get many records by IDs
     */
    getMany: async ({ resource, ids, meta }) => {
        const workspaceId = meta?.workspaceId;
        const entityId = meta?.entityId;

        if (!workspaceId || !entityId) {
            throw new Error("Workspace ID and Entity ID are required");
        }

        // Fetch all records individually (could be optimized with bulk endpoint)
        const promises = ids.map(id =>
            fetchWithAuth(
                buildUrl(`/workspaces/${workspaceId}/entities/${entityId}/records/${id}`)
            )
        );

        const results = await Promise.all(promises);

        return {
            data: results.map(r => r.data.record),
        };
    },

    /**
     * Create new record
     */
    create: async ({ resource, variables, meta }) => {
        const workspaceId = meta?.workspaceId;
        const entityId = meta?.entityId;

        if (!workspaceId || !entityId) {
            throw new Error("Workspace ID and Entity ID are required");
        }

        const url = buildUrl(
            `/workspaces/${workspaceId}/entities/${entityId}/records`
        );

        const result = await fetchWithAuth(url, {
            method: "POST",
            body: JSON.stringify({
                data: variables,
                tags: meta?.tags || [],
            }),
        });

        return {
            data: result.data.record,
        };
    },

    /**
     * Create many records (bulk create)
     */
    createMany: async ({ resource, variables, meta }) => {
        const workspaceId = meta?.workspaceId;
        const entityId = meta?.entityId;

        if (!workspaceId || !entityId) {
            throw new Error("Workspace ID and Entity ID are required");
        }

        // Create records individually (could be optimized with bulk endpoint)
        const promises = variables.map(item =>
            fetchWithAuth(
                buildUrl(`/workspaces/${workspaceId}/entities/${entityId}/records`),
                {
                    method: "POST",
                    body: JSON.stringify({ data: item }),
                }
            )
        );

        const results = await Promise.all(promises);

        return {
            data: results.map(r => r.data.record),
        };
    },

    /**
     * Update record
     */
    update: async ({ resource, id, variables, meta }) => {
        const workspaceId = meta?.workspaceId;
        const entityId = meta?.entityId;

        if (!workspaceId || !entityId) {
            throw new Error("Workspace ID and Entity ID are required");
        }

        const url = buildUrl(
            `/workspaces/${workspaceId}/entities/${entityId}/records/${id}`
        );

        const result = await fetchWithAuth(url, {
            method: "PUT",
            body: JSON.stringify({
                data: variables,
                tags: meta?.tags,
                is_archived: meta?.is_archived,
            }),
        });

        return {
            data: result.data.record,
        };
    },

    /**
     * Update many records (bulk update)
     */
    updateMany: async ({ resource, ids, variables, meta }) => {
        const workspaceId = meta?.workspaceId;
        const entityId = meta?.entityId;

        if (!workspaceId || !entityId) {
            throw new Error("Workspace ID and Entity ID are required");
        }

        const url = buildUrl(
            `/workspaces/${workspaceId}/entities/${entityId}/records/bulk`
        );

        const result = await fetchWithAuth(url, {
            method: "PUT",
            body: JSON.stringify({
                record_ids: ids,
                data: variables,
            }),
        });

        return {
            data: [],
        };
    },

    /**
     * Delete record (soft delete/archive)
     */
    deleteOne: async ({ resource, id, meta }) => {
        const workspaceId = meta?.workspaceId;
        const entityId = meta?.entityId;

        if (!workspaceId || !entityId) {
            throw new Error("Workspace ID and Entity ID are required");
        }

        const url = buildUrl(
            `/workspaces/${workspaceId}/entities/${entityId}/records/${id}`
        );

        await fetchWithAuth(url, {
            method: "DELETE",
        });

        return {
            data: { id },
        };
    },

    /**
     * Delete many records (bulk delete/archive)
     */
    deleteMany: async ({ resource, ids, meta }) => {
        const workspaceId = meta?.workspaceId;
        const entityId = meta?.entityId;

        if (!workspaceId || !entityId) {
            throw new Error("Workspace ID and Entity ID are required");
        }

        const url = buildUrl(
            `/workspaces/${workspaceId}/entities/${entityId}/records/bulk`
        );

        await fetchWithAuth(url, {
            method: "DELETE",
            body: JSON.stringify({
                record_ids: ids,
            }),
        });

        return {
            data: [],
        };
    },

    /**
     * Get API URL
     */
    getApiUrl: () => API_URL,

    /**
     * Custom method to handle workspace-specific operations
     */
    custom: async ({ url, method, filters, sorters, payload, query, headers }) => {
        const token = await getAccessToken();

        if (!token) {
            throw new Error("Authentication required");
        }

        const requestUrl = new URL(`${API_URL}${url}`);

        // Add query parameters
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    requestUrl.searchParams.append(key, String(value));
                }
            });
        }

        const response = await fetch(requestUrl.toString(), {
            method: method || "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                ...headers,
            },
            body: payload ? JSON.stringify(payload) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message ||
                errorData.detail ||
                `HTTP ${response.status}`
            );
        }

        return await response.json();
    },
};
