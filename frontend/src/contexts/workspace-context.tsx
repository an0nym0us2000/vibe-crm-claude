/**
 * Workspace Context
 * Manages workspace state and entity loading
 */
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getAccessToken } from "@/utils/supabase-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Types
export interface Workspace {
    id: string;
    name: string;
    slug: string;
    description?: string;
    owner_id: string;
    subscription_tier: string;
    is_active: boolean;
    created_at: string;
    user_role?: string;
    user_joined_at?: string;
}

export interface Entity {
    id: string;
    workspace_id: string;
    entity_name: string;
    display_name: string;
    display_name_singular: string;
    icon: string;
    description?: string;
    fields: FieldDefinition[];
    views_config: ViewsConfig;
    is_active: boolean;
    created_at: string;
    record_count?: number;
}

export interface FieldDefinition {
    name: string;
    display_name: string;
    type: string;
    required?: boolean;
    options?: string[];
    placeholder?: string;
    help_text?: string;
    default_value?: any;
    validation?: Record<string, any>;
}

export interface ViewsConfig {
    available_views?: string[];
    default_view?: string;
    color?: string;
}

interface WorkspaceContextType {
    currentWorkspace: Workspace | null;
    workspaces: Workspace[];
    entities: Entity[];
    switchWorkspace: (workspaceId: string) => Promise<void>;
    loadWorkspaces: () => Promise<void>;
    loadEntities: () => Promise<void>;
    refreshWorkspace: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load all workspaces for current user
     */
    const loadWorkspaces = useCallback(async () => {
        try {
            setError(null);
            const token = await getAccessToken();

            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch(`${API_URL}/workspaces`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to load workspaces: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error?.message || "Failed to load workspaces");
            }

            const workspacesList = result.data.workspaces || [];
            setWorkspaces(workspacesList);

            // Set current workspace
            const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
            let selectedWorkspace = null;

            if (savedWorkspaceId) {
                selectedWorkspace = workspacesList.find((w: Workspace) => w.id === savedWorkspaceId);
            }

            if (!selectedWorkspace && workspacesList.length > 0) {
                selectedWorkspace = workspacesList[0];
            }

            if (selectedWorkspace) {
                setCurrentWorkspace(selectedWorkspace);
                localStorage.setItem("currentWorkspaceId", selectedWorkspace.id);
            }
        } catch (err) {
            console.error("Failed to load workspaces:", err);
            setError(err instanceof Error ? err.message : "Failed to load workspaces");
        }
    }, []);

    /**
     * Load entities for current workspace
     */
    const loadEntities = useCallback(async () => {
        if (!currentWorkspace) {
            setEntities([]);
            return;
        }

        try {
            setError(null);
            const token = await getAccessToken();

            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace.id}/entities`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to load entities: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error?.message || "Failed to load entities");
            }

            setEntities(result.data.entities || []);
        } catch (err) {
            console.error("Failed to load entities:", err);
            setError(err instanceof Error ? err.message : "Failed to load entities");
            setEntities([]);
        }
    }, [currentWorkspace]);

    /**
     * Switch to different workspace
     */
    const switchWorkspace = useCallback(async (workspaceId: string) => {
        const workspace = workspaces.find(w => w.id === workspaceId);

        if (!workspace) {
            console.error(`Workspace ${workspaceId} not found`);
            return;
        }

        setCurrentWorkspace(workspace);
        localStorage.setItem("currentWorkspaceId", workspaceId);
        setEntities([]);
    }, [workspaces]);

    /**
     * Refresh current workspace data
     */
    const refreshWorkspace = useCallback(async () => {
        await Promise.all([loadWorkspaces(), loadEntities()]);
    }, [loadWorkspaces, loadEntities]);

    // Load workspaces on mount
    useEffect(() => {
        loadWorkspaces().finally(() => setIsLoading(false));
    }, [loadWorkspaces]);

    // Load entities when workspace changes
    useEffect(() => {
        if (currentWorkspace) {
            loadEntities();
        }
    }, [currentWorkspace, loadEntities]);

    return (
        <WorkspaceContext.Provider
            value={{
                currentWorkspace,
                workspaces,
                entities,
                switchWorkspace,
                loadWorkspaces,
                loadEntities,
                refreshWorkspace,
                isLoading,
                error,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

/**
 * Hook to use workspace context
 */
export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);

    if (!context) {
        throw new Error("useWorkspace must be used within WorkspaceProvider");
    }

    return context;
};
