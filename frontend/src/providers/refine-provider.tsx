/**
 * Refine Provider
 * Main Refine configuration with dynamic resources
 */
"use client";

import { Refine, ResourceProps } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { dataProvider } from "./data-provider";
import { authProvider } from "./auth-provider";
import { notificationProvider } from "./notification-provider";
import { useWorkspace } from "@/contexts/workspace-context";
import { useMemo } from "react";

// Icon mapping for entities
const getIconForEntity = (iconName: string) => {
    // This would map icon names to actual icon components
    // For now, we'll return the icon name
    return iconName;
};

export function RefineProvider({ children }: { children: React.ReactNode }) {
    const { currentWorkspace, entities, isLoading } = useWorkspace();

    // Convert entities to Refine resources
    const resources: ResourceProps[] = useMemo(() => {
        if (!currentWorkspace || !entities.length) {
            return [];
        }

        return entities.map(entity => ({
            name: entity.entity_name,
            list: `/workspaces/${currentWorkspace.id}/${entity.entity_name}`,
            create: `/workspaces/${currentWorkspace.id}/${entity.entity_name}/create`,
            edit: `/workspaces/${currentWorkspace.id}/${entity.entity_name}/edit/:id`,
            show: `/workspaces/${currentWorkspace.id}/${entity.entity_name}/show/:id`,
            meta: {
                workspaceId: currentWorkspace.id,
                entityId: entity.id,
                icon: getIconForEntity(entity.icon),
                label: entity.display_name,
                canDelete: true,
            },
            icon: entity.icon,
        }));
    }, [currentWorkspace, entities]);

    // Show loading state while workspace loads
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
            }}>
                Loading workspace...
            </div>
        );
    }

    return (
        <RefineKbarProvider>
            <Refine
                routerProvider={routerProvider}
                dataProvider={dataProvider}
                authProvider={authProvider}
                notificationProvider={notificationProvider}
                resources={resources}
                options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
                    useNewQueryKeys: true,
                    projectId: "vibe-crm",
                    disableTelemetry: true,
                }}
            >
                {children}
                <RefineKbar />
            </Refine>
        </RefineKbarProvider>
    );
}
