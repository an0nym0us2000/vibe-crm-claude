/**
 * Analytics Dashboard Page  
 * Dashboard with metrics, charts, and activity feed
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Alert,
    LinearProgress,
} from "@mui/material";
import {
    Add,
    Folder,
    TrendingUp,
    People,
    AutoAwesome,
} from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";
import { MetricsGrid } from "@/components/dashboard/MetricsCards";
import { TrendChart, EntityBarChart, StatusPieChart } from "@/components/dashboard/Charts";

interface DashboardStats {
    total_records: number;
    total_entities: number;
    recent_records: number;
    active_automations: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const { currentWorkspace, entities, isLoading: workspaceLoading } = useWorkspace();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load dashboard stats
    useEffect(() => {
        const loadStats = async () => {
            if (!currentWorkspace) return;

            setLoading(true);
            try {
                // Calculate stats from entities
                const totalRecords = entities.reduce((sum, entity) => sum + (entity.record_count || 0), 0);

                setStats({
                    total_records: totalRecords,
                    total_entities: entities.length,
                    recent_records: Math.floor(totalRecords * 0.2), // Mock: 20% recent
                    active_automations: 0, // TODO: Fetch from API
                });
            } catch (err: any) {
                console.error("Error loading stats:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (!workspaceLoading && currentWorkspace) {
            loadStats();
        }
    }, [currentWorkspace, entities, workspaceLoading]);

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

    if (!currentWorkspace) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h5" gutterBottom>
                    No Workspace Selected
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Please select or create a workspace to get started
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => router.push("/onboarding")}
                >
                    Create Workspace
                </Button>
            </Box>
        );
    }

    // Prepare metrics data
    const metrics = [
        {
            title: "Total Records",
            value: stats?.total_records.toLocaleString() || "0",
            icon: <Folder />,
            trend: {
                value: "+12%",
                isPositive: true,
            },
            color: "primary.main",
        },
        {
            title: "Entities",
            value: stats?.total_entities || 0,
            icon: <Folder />,
            color: "success.main",
        },
        {
            title: "Recent Activity",
            value: stats?.recent_records.toLocaleString() || "0",
            icon: <TrendingUp />,
            trend: {
                value: "+8%",
                isPositive: true,
            },
            color: "info.main",
        },
        {
            title: "Active Automations",
            value: stats?.active_automations || 0,
            icon: <AutoAwesome />,
            color: "warning.main",
        },
    ];

    // Prepare chart data
    const trendData = [
        { name: "Mon", value: 12 },
        { name: "Tue", value: 19 },
        { name: "Wed", value: 15 },
        { name: "Thu", value: 25 },
        { name: "Fri", value: 22 },
        { name: "Sat", value: 18 },
        { name: "Sun", value: 20 },
    ];

    const entityData = entities.slice(0, 5).map(entity => ({
        name: entity.display_name,
        value: entity.record_count || 0,
    }));

    // Mock status distribution (in production, fetch from API)
    const statusData = [
        { name: "Active", value: 45 },
        { name: "Pending", value: 30 },
        { name: "Completed", value: 20 },
        { name: "Archived", value: 5 },
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight={700}>
                    Welcome back!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Here's what's happening in {currentWorkspace.name}
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Metrics Cards */}
            <Box sx={{ mb: 4 }}>
                <MetricsGrid metrics={metrics} loading={loading} />
            </Box>

            {/* Charts Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={8}>
                    <TrendChart
                        data={trendData}
                        title="Records Created This Week"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={12} lg={4}>
                    <StatusPieChart
                        data={statusData}
                        title="Status Distribution"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            {/* Entity Comparison & Recent Activity */}
            <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                    <EntityBarChart
                        data={entityData}
                        title="Records by Entity"
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    Your Entities
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={() => router.push("/dashboard/entities")}
                                >
                                    View All
                                </Button>
                            </Box>

                            {entities.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <Typography color="text.secondary" gutterBottom>
                                        No entities yet
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={() => router.push("/onboarding")}
                                        sx={{ mt: 1 }}
                                    >
                                        Create Entity
                                    </Button>
                                </Box>
                            ) : (
                                <List>
                                    {entities.slice(0, 5).map((entity) => (
                                        <ListItem
                                            key={entity.id}
                                            sx={{
                                                cursor: "pointer",
                                                borderRadius: 1,
                                                "&:hover": {
                                                    bgcolor: "grey.50",
                                                },
                                            }}
                                            onClick={() => router.push(`/dashboard/${entity.entity_name}`)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: "primary.main" }}>
                                                    <Folder />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={entity.display_name}
                                                secondary={`${entity.record_count || 0} records`}
                                            />
                                            <Chip
                                                label="View"
                                                size="small"
                                                onClick={() => router.push(`/dashboard/${entity.entity_name}`)}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
