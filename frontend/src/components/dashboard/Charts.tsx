/**
 * Dashboard Charts Component
 * Reusable charts for analytics
 */
"use client";

import {
    Card,
    CardContent,
    Typography,
    Box,
    Skeleton,
} from "@mui/material";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

interface TrendChartProps {
    data: Array<{ name: string; value: number }>;
    title: string;
    loading?: boolean;
    dataKey?: string;
}

export function TrendChart({ data, title, loading, dataKey = "value" }: TrendChartProps) {
    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={300} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    {title}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e0e0e0",
                                borderRadius: 8,
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke="#1976d2"
                            strokeWidth={2}
                            dot={{ fill: "#1976d2", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface BarChartProps {
    data: Array<{ name: string; value: number }>;
    title: string;
    loading?: boolean;
    dataKey?: string;
}

export function EntityBarChart({ data, title, loading, dataKey = "value" }: BarChartProps) {
    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={300} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    {title}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e0e0e0",
                                borderRadius: 8,
                            }}
                        />
                        <Bar dataKey={dataKey} fill="#1976d2" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface PieChartProps {
    data: Array<{ name: string; value: number }>;
    title: string;
    loading?: boolean;
}

export function StatusPieChart({ data, title, loading }: PieChartProps) {
    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
                    <Skeleton variant="circular" width={300} height={300} sx={{ mx: "auto" }} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    {title}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e0e0e0",
                                borderRadius: 8,
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
