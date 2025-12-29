/**
 * Landing Page Features Section
 * Feature cards with icons and descriptions
 */
"use client";

import { Box, Container, Grid, Typography, Card, CardContent } from "@mui/material";
import {
    AutoAwesome,
    Speed,
    Lock,
    ViewKanban,
    BarChart,
    Group,
    Bolt,
    CloudDone,
} from "@mui/icons-material";

const features = [
    {
        icon: <AutoAwesome sx={{ fontSize: 50 }} />,
        title: "AI-Powered Generation",
        description:
            "Describe your business in plain English. Our GPT-4 powered engine creates a complete CRM tailored to your needs in seconds.",
        color: "#667eea",
    },
    {
        icon: <Speed sx={{ fontSize: 50 }} />,
        title: "Lightning Fast Setup",
        description:
            "Go from signup to managing customers in under 5 minutes. No complex configuration or training required.",
        color: "#f093fb",
    },
    {
        icon: <Lock sx={{ fontSize: 50 }} />,
        title: "Enterprise Security",
        description:
            "Bank-level encryption, row-level security, and JWT authentication. Your data is always safe and private.",
        color: "#4facfe",
    },
    {
        icon: <ViewKanban sx={{ fontSize: 50 }} />,
        title: "Multiple Views",
        description:
            "Table, Kanban, and Analytics views. Visualize your data the way that works best for you.",
        color: "#43e97b",
    },
    {
        icon: <BarChart sx={{ fontSize: 50 }} />,
        title: "Analytics Dashboard",
        description:
            "Beautiful charts and metrics to track your business performance. See trends and make data-driven decisions.",
        color: "#fa709a",
    },
    {
        icon: <Bolt sx={{ fontSize: 50 }} />,
        title: "Workflow Automation",
        description:
            "Automate repetitive tasks with our visual builder. Send emails, call webhooks, and update records automatically.",
        color: "#feca57",
    },
    {
        icon: <Group sx={{ fontSize: 50 }} />,
        title: "Team Collaboration",
        description:
            "Invite team members, assign roles, and work together. Owner, Admin, and Member permissions included.",
        color: "#ff6b6b",
    },
    {
        icon: <CloudDone sx={{ fontSize: 50 }} />,
        title: "Cloud-Based",
        description:
            "Access your CRM from anywhere, on any device. Powered by Supabase for 99.9% uptime and reliability.",
        color: "#00d2ff",
    },
];

export function Features() {
    return (
        <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "grey.50" }}>
            <Container maxWidth="lg">
                {/* Section Header */}
                <Box sx={{ textAlign: "center", mb: 8 }}>
                    <Typography
                        variant="overline"
                        sx={{
                            color: "primary.main",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            letterSpacing: 2,
                        }}
                    >
                        FEATURES
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: "2rem", md: "3rem" },
                            fontWeight: 800,
                            mb: 2,
                            mt: 1,
                        }}
                    >
                        Everything you need to manage customers
                    </Typography>
                    <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{ maxWidth: 700, mx: "auto" }}
                    >
                        From AI-powered setup to advanced automations, SmartCRM has all the
                        tools you need to grow your business.
                    </Typography>
                </Box>

                {/* Feature Grid */}
                <Grid container spacing={4}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card
                                sx={{
                                    height: "100%",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    "&:hover": {
                                        transform: "translateY(-8px)",
                                        boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
                                        borderColor: feature.color,
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box
                                        sx={{
                                            width: 70,
                                            height: 70,
                                            borderRadius: 2,
                                            bgcolor: `${feature.color}15`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mb: 2,
                                            color: feature.color,
                                        }}
                                    >
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h6" fontWeight={700} gutterBottom>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Trust Badge */}
                <Box sx={{ textAlign: "center", mt: 10 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        TRUSTED BY LEADING BUSINESSES
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 4,
                            flexWrap: "wrap",
                            mt: 3,
                            opacity: 0.6,
                        }}
                    >
                        {["Startup Inc", "Growth Co", "Scale LLC", "Enterprise Corp"].map(
                            (company) => (
                                <Typography
                                    key={company}
                                    variant="h6"
                                    sx={{ fontWeight: 700, color: "text.secondary" }}
                                >
                                    {company}
                                </Typography>
                            )
                        )}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
