/**
 * Entity Kanban View Page
 * Kanban board view for pipeline management
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Button,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    Alert,
    LinearProgress,
    TextField,
    InputAdornment,
} from "@mui/material";
import {
    ViewKanban,
    TableRows,
    Add,
    Search,
} from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";
import { getAccessToken } from "@/utils/supabase-client";
import { KanbanBoard } from "@/components/entity/KanbanBoard";
import type { Entity } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Record {
    id: string;
    data: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

export default function EntityKanbanPage({
    params,
}: {
    params: { entityName: string };
}) {
    const router = useRouter();
    const { currentWorkspace, entities, isLoading: workspaceLoading } = useWorkspace();

    const [entityConfig, setEntityConfig] = useState<Entity | null>(null);
    const [records, setRecords] = useState<Record[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Find entity config from workspace
    useEffect(() => {
        const entity = entities.find((e) => e.entity_name === params.entityName);
        setEntityConfig(entity || null);
    }, [entities, params.entityName]);

    // Load records
    const loadRecords = async () => {
        if (!currentWorkspace || !entityConfig) return;

        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace.id}/entities/${entityConfig.id}/records?per_page=1000`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || "Failed to load records");
            }

            if (result.success) {
                setRecords(result.data.records || []);
                setFilteredRecords(result.data.records || []);
            }
        } catch (err: any) {
            console.error("Load records error:", err);
            setError(err.message || "Failed to load records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (entityConfig && currentWorkspace) {
            loadRecords();
        }
    }, [entityConfig, currentWorkspace]);

    // Filter records based on search
    useEffect(() => {
        if (!searchQuery) {
            setFilteredRecords(records);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = records.filter((record) => {
            return Object.values(record.data).some((value) =>
                String(value).toLowerCase().includes(query)
            );
        });
        setFilteredRecords(filtered);
    }, [searchQuery, records]);

    // Handle update record status
    const handleUpdateRecord = async (recordId: string, newStatus: string) => {
        if (!currentWorkspace || !entityConfig) return;

        try {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");

            const record = records.find((r) => r.id === recordId);
            if (!record) return;

            const statusField = entityConfig.fields.find(
                (f) => f.type === "select" && f.name.toLowerCase().includes("status")
            );
            if (!statusField) return;

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace.id}/entities/${entityConfig.id}/records/${recordId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        data: {
                            ...record.data,
                            [statusField.name]: newStatus,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error?.message || "Failed to update record");
            }

            // Refresh records
            await loadRecords();
        } catch (err: any) {
            console.error("Update error:", err);
            alert(err.message || "Failed to update record");
        }
    };

    // Handle delete
    const handleDeleteRecord = async (recordId: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace?.id}/entities/${entityConfig?.id}/records/${recordId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error?.message || "Failed to delete record");
            }

            // Refresh records
            await loadRecords();
        } catch (err: any) {
            console.error("Delete error:", err);
            alert(err.message || "Failed to delete record");
        }
    };

    // Find status field
    const statusField = entityConfig?.fields.find(
        (f) => f.type === "select" && f.name.toLowerCase().includes("status")
    );

    if (workspaceLoading || !entityConfig) {
        return (
            <Box>
                <Typography variant="h5" gutterBottom>
                    Loading...
                </Typography>
                <LinearProgress />
            </Box>
        );
    }

    if (!statusField) {
        return (
            <Box>
                <Alert severity="warning">
                    This entity does not have a status field. Kanban view requires a select field named "status" or containing "status".
                </Alert>
                <Button
                    variant="outlined"
                    onClick={() => router.push(`/dashboard/${params.entityName}`)}
                    sx={{ mt: 2 }}
                >
                    Back to Table View
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight={700}>
                        {entityConfig.display_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Pipeline view • Drag cards to update status
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {/* View Toggle */}
                    <ToggleButtonGroup
                        value="kanban"
                        exclusive
                        size="small"
                        onChange={(_, value) => {
                            if (value === "table") {
                                router.push(`/dashboard/${params.entityName}`);
                            }
                        }}
                    >
                        <ToggleButton value="table">
                            <TableRows fontSize="small" sx={{ mr: 0.5 }} />
                            Table
                        </ToggleButton>
                        <ToggleButton value="kanban">
                            <ViewKanban fontSize="small" sx={{ mr: 0.5 }} />
                            Kanban
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Create Button */}
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => router.push(`/dashboard/${params.entityName}/create`)}
                    >
                        Create New
                    </Button>
                </Box>
            </Box>

            {/* Search */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ maxWidth: 400 }}
                />
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Loading */}
            {loading ? (
                <Box>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading kanban board...
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Kanban Board */}
                    <KanbanBoard
                        entityName={params.entityName}
                        entityConfig={entityConfig}
                        records={filteredRecords}
                        statusField={statusField}
                        onUpdateRecord={handleUpdateRecord}
                        onDeleteRecord={handleDeleteRecord}
                    />

                    {/* Empty State */}
                    {records.length === 0 && (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                            <ViewKanban sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                No records yet
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Create your first {entityConfig.display_name_singular || entityConfig.display_name} to get started
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => router.push(`/dashboard/${params.entityName}/create`)}
                            >
                                Create {entityConfig.display_name_singular || "Record"}
                            </Button>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}
