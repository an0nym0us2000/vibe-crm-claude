"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";
import { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
    return (
        <Card>
            <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" fontWeight="bold">
                            {value}
                        </Typography>
                        {trend && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: trend.isPositive ? "success.main" : "error.main",
                                    mt: 1,
                                }}
                            >
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </Typography>
                        )}
                    </Box>
                    {icon && (
                        <Box sx={{ color: "primary.main", opacity: 0.7 }}>
                            {icon}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
