/**
 * Dynamic Entity List Page
 * Generic list page that adapts to any entity schema
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Button,
    Typography,
    Card,
    LinearProgress,
    Alert,
    Chip,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams } from "@mui/x-data-grid";
import {
    Add,
    Edit,
    Delete,
    Visibility,
    FileDownload,
} from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";
import { getAccessToken } from "@/utils/supabase-client";
import type { Entity, FieldDefinition } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Record {
    id: string;
    data: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

export default function EntityListPage({
    params,
}: {
    params: { entityName: string };
}) {
    const router = useRouter();
    const { currentWorkspace, entities, isLoading: workspaceLoading } = useWorkspace();

    const [entityConfig, setEntityConfig] = useState<Entity | null>(null);
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [total, setTotal] = useState(0);

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
                `${API_URL}/workspaces/${currentWorkspace.id}/entities/${entityConfig.id}/records?page=${page + 1}&per_page=${pageSize}`,
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
                setTotal(result.data.pagination?.total || 0);
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
    }, [entityConfig, currentWorkspace, page, pageSize]);

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace?.id}/entities/${entityConfig?.id}/records/${id}`,
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
            loadRecords();
        } catch (err: any) {
            console.error("Delete error:", err);
            alert(err.message || "Failed to delete record");
        }
    };

    // Render cell value based on field type
    const renderCellValue = (value: any, field: FieldDefinition) => {
        if (value === null || value === undefined) return "";

        switch (field.type) {
            case "email":
                return <a href={`mailto:${value}`} style={{ color: "#1976d2" }}>{value}</a>;

            case "phone":
                return <a href={`tel:${value}`} style={{ color: "#1976d2" }}>{value}</a>;

            case "url":
                return (
                    <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2" }}>
                        {value}
                    </a>
                );

            case "select":
                return <Chip label={value} size="small" color="primary" variant="outlined" />;

            case "multiselect":
                return Array.isArray(value) ? (
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {value.map((v, i) => (
                            <Chip key={i} label={v} size="small" />
                        ))}
                    </Box>
                ) : value;

            case "checkbox":
                return value ? "✓ Yes" : "✗ No";

            case "date":
                return value ? new Date(value).toLocaleDateString() : "";

            case "datetime":
                return value ? new Date(value).toLocaleString() : "";

            case "currency":
                return value ? `$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "";

            case "number":
                return value ? parseFloat(value).toLocaleString() : "";

            default:
                return String(value);
        }
    };

    // Generate columns from entity config
    const columns: GridColDef[] = [
        ...(entityConfig?.fields.slice(0, 6).map((field) => ({
            field: field.name,
            headerName: field.display_name,
            flex: 1,
            minWidth: 150,
            valueGetter: (params: any) => params.row.data?.[field.name],
            renderCell: (params: any) => {
                const value = params.row.data?.[field.name];
                return renderCellValue(value, field);
            },
        })) || []),
        {
            field: "created_at",
            headerName: "Created",
            width: 150,
            valueGetter: (params: any) => new Date(params.row.created_at).toLocaleDateString(),
        },
        {
            field: "actions",
            type: "actions",
            headerName: "Actions",
            width: 120,
            getActions: (params: GridRowParams) => [
                <GridActionsCellItem
                    key="view"
                    icon={<Visibility />}
                    label="View"
                    onClick={() =>
                        router.push(`/dashboard/${params.entityName}/show/${params.id}`)
                    }
                />,
                <GridActionsCellItem
                    key="edit"
                    icon={<Edit />}
                    label="Edit"
                    onClick={() =>
                        router.push(`/dashboard/${params.entityName}/edit/${params.id}`)
                    }
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<Delete />}
                    label="Delete"
                    onClick={() => handleDelete(params.id as string)}
                    showInMenu
                />,
            ],
        },
    ];

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

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight={700}>
                        {entityConfig.display_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {entityConfig.description || `Manage your ${entityConfig.display_name.toLowerCase()}`}
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={() => alert("Export functionality coming soon")}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => router.push(`/dashboard/${params.entityName}/create`)}
                    >
                        Create New
                    </Button>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Data Grid */}
            <Card>
                <DataGrid
                    rows={records}
                    columns={columns}
                    loading={loading}
                    pagination
                    paginationMode="server"
                    page={page}
                    pageSize={pageSize}
                    rowCount={total}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    autoHeight
                    disableSelectionOnClick
                    sx={{
                        "& .MuiDataGrid-cell": {
                            borderBottom: "1px solid #f0f0f0",
                        },
                        "& .MuiDataGrid-columnHeaders": {
                            bgcolor: "grey.50",
                            borderBottom: "2px solid #e0e0e0",
                        },
                    }}
                />
            </Card>

            {/* Empty State */}
            {!loading && records.length === 0 && (
                <Box sx={{ textAlign: "center", py: 8 }}>
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
        </Box>
    );
}
