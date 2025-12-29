/**
 * Automations Management Page
 * List, create, and manage workspace automations
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Switch,
    IconButton,
    Menu,
    MenuItem,
    Alert,
    LinearProgress,
    Chip,
    Dialog,
    DialogContent,
    Grid,
} from "@mui/material";
import {
    Add,
    MoreVert,
    Edit,
    Delete,
    PlayArrow,
    Stop,
    BoltOutlined,
} from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";
import { getAccessToken } from "@/utils/supabase-client";
import { AutomationBuilder } from "@/components/automation/AutomationBuilder";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Automation {
    id: string;
    name: string;
    entity_id: string;
    trigger_type: string;
    trigger_config: any;
    action_type: string;
    action_config: any;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export default function AutomationsPage() {
    const router = useRouter();
    const { currentWorkspace, entities, isLoading: workspaceLoading } = useWorkspace();

    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});
    const [builderOpen, setBuilderOpen] = useState(false);
    const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);

    // Load automations
    const loadAutomations = async () => {
        if (!currentWorkspace) return;

        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace.id}/automations`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || "Failed to load automations");
            }

            if (result.success) {
                setAutomations(result.data.automations || []);
            }
        } catch (err: any) {
            console.error("Load automations error:", err);
            setError(err.message || "Failed to load automations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentWorkspace) {
            loadAutomations();
        }
    }, [currentWorkspace]);

    // Toggle automation status
    const handleToggleActive = async (automationId: string, currentStatus: boolean) => {
        try {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace?.id}/automations/${automationId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        is_active: !currentStatus,
                    }),
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error?.message || "Failed to update automation");
            }

            setSuccessMessage(`Automation ${!currentStatus ? "enabled" : "disabled"}`);
            loadAutomations();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error("Toggle error:", err);
            setError(err.message || "Failed to update automation");
        }
    };

    // Delete automation
    const handleDelete = async (automationId: string) => {
        if (!confirm("Are you sure you want to delete this automation?")) return;

        try {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace?.id}/automations/${automationId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error?.message || "Failed to delete automation");
            }

            setSuccessMessage("Automation deleted successfully");
            loadAutomations();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error("Delete error:", err);
            setError(err.message || "Failed to delete automation");
        }
    };

    // Create automation
    const handleCreate = async (automation: any) => {
        try {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace?.id}/automations`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(automation),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || "Failed to create automation");
            }

            setSuccessMessage("Automation created successfully");
            setBuilderOpen(false);
            loadAutomations();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error("Create error:", err);
            throw err;
        }
    };

    const getEntityName = (entityId: string) => {
        return entities.find((e) => e.id === entityId)?.display_name || "Unknown";
    };

    const getTriggerLabel = (type: string) => {
        const labels: Record<string, string> = {
            status_changed: "Status Changes",
            record_created: "New Record Created",
            field_updated: "Field Updated",
            record_deleted: "Record Deleted",
        };
        return labels[type] || type;
    };

    const getActionLabel = (type: string) => {
        const labels: Record<string, string> = {
            send_email: "Send Email",
            create_task: "Create Task",
            webhook: "Call Webhook",
            update_field: "Update Field",
        };
        return labels[type] || type;
    };

    if (workspaceLoading || loading) {
        return (
            <Box>
                <Typography variant="h5" gutterBottom>
                    Loading...
                </Typography>
                <LinearProgress />
            </Box>
        );
    }

    // Check if user is admin or owner
    const canManageAutomations =
        currentWorkspace?.user_role === "owner" ||
        currentWorkspace?.user_role === "admin";

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight={700}>
                        Automations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Automate repetitive tasks and workflows
                    </Typography>
                </Box>
                {canManageAutomations && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setEditingAutomation(null);
                            setBuilderOpen(true);
                        }}
                    >
                        Create Automation
                    </Button>
                )}
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            )}
            {!canManageAutomations && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Only admins and owners can create or manage automations.
                </Alert>
            )}

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <BoltOutlined sx={{ mr: 1, color: "primary.main" }} />
                                <Typography variant="body2" color="text.secondary">
                                    Total Automations
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700}>
                                {automations.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <PlayArrow sx={{ mr: 1, color: "success.main" }} />
                                <Typography variant="body2" color="text.secondary">
                                    Active
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700} color="success.main">
                                {automations.filter((a) => a.is_active).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <Stop sx={{ mr: 1, color: "warning.main" }} />
                                <Typography variant="body2" color="text.secondary">
                                    Inactive
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700} color="warning.main">
                                {automations.filter((a) => !a.is_active).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Automations List */}
            <Box>
                {automations.length === 0 ? (
                    <Card>
                        <CardContent sx={{ textAlign: "center", py: 8 }}>
                            <BoltOutlined sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                No automations yet
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Create your first automation to start automating your workflows
                            </Typography>
                            {canManageAutomations && (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => setBuilderOpen(true)}
                                >
                                    Create Automation
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Box sx={{ display: "grid", gap: 2 }}>
                        {automations.map((automation) => (
                            <Card key={automation.id} variant="outlined">
                                <CardContent>
                                    <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                <Typography variant="h6" fontWeight={600}>
                                                    {automation.name}
                                                </Typography>
                                                <Chip
                                                    label={automation.is_active ? "Active" : "Inactive"}
                                                    size="small"
                                                    color={automation.is_active ? "success" : "default"}
                                                />
                                            </Box>

                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {getEntityName(automation.entity_id)}
                                            </Typography>

                                            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                                <Chip
                                                    label={`When: ${getTriggerLabel(automation.trigger_type)}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    →
                                                </Typography>
                                                <Chip
                                                    label={`Then: ${getActionLabel(automation.action_type)}`}
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                />
                                            </Box>
                                        </Box>

                                        {canManageAutomations && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Switch
                                                    checked={automation.is_active}
                                                    onChange={() =>
                                                        handleToggleActive(automation.id, automation.is_active)
                                                    }
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) =>
                                                        setAnchorEl({ ...anchorEl, [automation.id]: e.currentTarget })
                                                    }
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                                <Menu
                                                    anchorEl={anchorEl[automation.id]}
                                                    open={Boolean(anchorEl[automation.id])}
                                                    onClose={() =>
                                                        setAnchorEl({ ...anchorEl, [automation.id]: null })
                                                    }
                                                >
                                                    <MenuItem
                                                        onClick={() => {
                                                            setEditingAutomation(automation);
                                                            setBuilderOpen(true);
                                                            setAnchorEl({ ...anchorEl, [automation.id]: null });
                                                        }}
                                                    >
                                                        <Edit fontSize="small" sx={{ mr: 1 }} />
                                                        Edit
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={() => {
                                                            handleDelete(automation.id);
                                                            setAnchorEl({ ...anchorEl, [automation.id]: null });
                                                        }}
                                                        sx={{ color: "error.main" }}
                                                    >
                                                        <Delete fontSize="small" sx={{ mr: 1 }} />
                                                        Delete
                                                    </MenuItem>
                                                </Menu>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Builder Dialog */}
            <Dialog
                open={builderOpen}
                onClose={() => setBuilderOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogContent sx={{ p: 3 }}>
                    <AutomationBuilder
                        onSave={handleCreate}
                        onCancel={() => setBuilderOpen(false)}
                        initialData={editingAutomation}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
}
