/**
 * Metrics Cards Component
 * Reusable metric cards with icons and trends
 */
"use client";

import {
    Card,
    CardContent,
    Box,
    Typography,
    Skeleton,
} from "@mui/material";
import {
    TrendingUp,
    TrendingDown,
} from "@mui/icons-material";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    loading?: boolean;
    color?: string;
}

export function MetricCard({
    title,
    value,
    icon,
    trend,
    loading,
    color = "primary.main",
}: MetricCardProps) {
    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" height={40} />
                    <Skeleton variant="text" width="30%" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            sx={{
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                },
            }}
        >
            <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                            {value}
                        </Typography>
                        {trend && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {trend.isPositive ? (
                                    <TrendingUp fontSize="small" sx={{ color: "success.main" }} />
                                ) : (
                                    <TrendingDown fontSize="small" sx={{ color: "error.main" }} />
                                )}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: trend.isPositive ? "success.main" : "error.main",
                                        fontWeight: 600,
                                    }}
                                >
                                    {trend.value}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    vs last month
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Box
                        sx={{
                            bgcolor: color,
                            color: "white",
                            p: 1.5,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

interface MetricsGridProps {
    metrics: MetricCardProps[];
    loading?: boolean;
}

export function MetricsGrid({ metrics, loading }: MetricsGridProps) {
    return (
        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} loading={loading} />
            ))}
        </Box>
    );
}
