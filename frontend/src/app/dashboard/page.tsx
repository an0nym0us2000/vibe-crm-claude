/**
 * Dashboard Home Page
 * Overview of workspace metrics and quick actions
 */
"use client";

import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Button,
    Stack,
    Chip,
    LinearProgress,
} from "@mui/material";
import {
    Add,
    TrendingUp,
    People,
    Folder,
    AutoAwesome,
} from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { currentWorkspace, entities, isLoading } = useWorkspace();
    const router = useRouter();

    if (isLoading) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
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

    // Calculate total records
    const totalRecords = entities.reduce((sum, entity) => sum + (entity.record_count || 0), 0);

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

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <Folder sx={{ mr: 1, color: "primary.main" }} />
                                <Typography variant="body2" color="text.secondary">
                                    Entities
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700}>
                                {entities.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Active entities
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <TrendingUp sx={{ mr: 1, color: "success.main" }} />
                                <Typography variant="body2" color="text.secondary">
                                    Total Records
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700}>
                                {totalRecords}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Across all entities
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <People sx={{ mr: 1, color: "info.main" }} />
                                <Typography variant="body2" color="text.secondary">
                                    Your Role
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700} sx={{ textTransform: "capitalize" }}>
                                {currentWorkspace.user_role}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                In this workspace
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <AutoAwesome sx={{ mr: 1, color: "warning.main" }} />
                                <Typography variant="body2" color="text.secondary">
                                    Plan
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700} sx={{ textTransform: "capitalize" }}>
                                {currentWorkspace.subscription_tier}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Subscription tier
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Entities List */}
            <Card>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Typography variant="h6" fontWeight={600}>
                            Your Entities
                        </Typography>
                        {(currentWorkspace.user_role === "owner" || currentWorkspace.user_role === "admin") && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Add />}
                                onClick={() => router.push("/dashboard/entities/create")}
                            >
                                Add Entity
                            </Button>
                        )}
                    </Box>

                    {entities.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <Typography color="text.secondary" gutterBottom>
                                No entities yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Create your first entity to start managing your data
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => router.push("/dashboard/entities/create")}
                            >
                                Create Entity
                            </Button>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {entities.map((entity) => (
                                <Grid item xs={12} sm={6} md={4} key={entity.id}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                                boxShadow: 2,
                                                transform: "translateY(-2px)",
                                            },
                                        }}
                                        onClick={() => router.push(`/dashboard/${entity.entity_name}`)}
                                    >
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                                {entity.display_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {entity.description || "No description"}
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Chip
                                                    label={`${entity.fields?.length || 0} fields`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={`${entity.record_count || 0} records`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
