/**
 * Landing Page Pricing Section
 * Pricing tiers with feature comparison
 */
"use client";

import { Box, Container, Grid, Typography, Card, CardContent, Button, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Check, Star } from "@mui/icons-material";
import Link from "next/link";

const plans = [
    {
        name: "Free",
        price: 0,
        period: "/month",
        description: "Perfect for trying out SmartCRM",
        features: [
            "1 user",
            "100 records",
            "Basic templates",
            "Table view",
            "Community support",
        ],
        cta: "Get Started",
        href: "/register",
        highlighted: false,
    },
    {
        name: "Pro",
        price: 29,
        period: "/month",
        description: "Best for growing businesses",
        features: [
            "5 users",
            "10,000 records",
            "AI customization",
            "All views (Table, Kanban, Analytics)",
            "Workflow automation",
            "Priority support",
            "Custom fields",
        ],
        cta: "Start Free Trial",
        href: "/register",
        highlighted: true,
    },
    {
        name: "Business",
        price: 99,
        period: "/month",
        description: "For established teams",
        features: [
            "Unlimited users",
            "Unlimited records",
            "Advanced AI features",
            "Custom integrations",
            "API access",
            "Dedicated support",
            "SLA guarantee",
            "Custom training",
        ],
        cta: "Contact Sales",
        href: "/contact",
        highlighted: false,
    },
];

export function Pricing() {
    return (
        <Box sx={{ py: { xs: 8, md: 12 } }}>
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
                        PRICING
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
                        Simple, transparent pricing
                    </Typography>
                    <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{ maxWidth: 700, mx: "auto" }}
                    >
                        Start free, upgrade as you grow. No hidden fees, cancel anytime.
                    </Typography>
                </Box>

                {/* Pricing Cards */}
                <Grid container spacing={4} alignItems="stretch">
                    {plans.map((plan) => (
                        <Grid item xs={12} md={4} key={plan.name}>
                            <Card
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative",
                                    border: plan.highlighted ? "2px solid" : "1px solid",
                                    borderColor: plan.highlighted ? "primary.main" : "grey.200",
                                    boxShadow: plan.highlighted ? "0 8px 24px rgba(0,0,0,0.12)" : 1,
                                    transform: plan.highlighted ? "scale(1.05)" : "scale(1)",
                                    transition: "all 0.3s",
                                    "&:hover": {
                                        transform: plan.highlighted ? "scale(1.08)" : "scale(1.03)",
                                        boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                                    },
                                }}
                            >
                                {plan.highlighted && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: -12,
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            bgcolor: "primary.main",
                                            color: "white",
                                            px: 3,
                                            py: 0.5,
                                            borderRadius: 50,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                        }}
                                    >
                                        <Star sx={{ fontSize: 16 }} />
                                        <Typography variant="caption" fontWeight={700}>
                                            Most Popular
                                        </Typography>
                                    </Box>
                                )}

                                <CardContent sx={{ p: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                                    {/* Plan Name */}
                                    <Typography variant="h5" fontWeight={700} gutterBottom>
                                        {plan.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        {plan.description}
                                    </Typography>

                                    {/* Price */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography
                                            component="span"
                                            variant="h2"
                                            fontWeight={800}
                                            color={plan.highlighted ? "primary.main" : "text.primary"}
                                        >
                                            ${plan.price}
                                        </Typography>
                                        <Typography
                                            component="span"
                                            variant="body1"
                                            color="text.secondary"
                                        >
                                            {plan.period}
                                        </Typography>
                                    </Box>

                                    {/* CTA Button */}
                                    <Button
                                        component={Link}
                                        href={plan.href}
                                        variant={plan.highlighted ? "contained" : "outlined"}
                                        fullWidth
                                        size="large"
                                        sx={{
                                            mb: 3,
                                            py: 1.5,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {plan.cta}
                                    </Button>

                                    {/* Features List */}
                                    <List sx={{ flexGrow: 1 }}>
                                        {plan.features.map((feature, index) => (
                                            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <Check
                                                        sx={{
                                                            color: plan.highlighted ? "primary.main" : "success.main",
                                                            fontSize: 20,
                                                        }}
                                                    />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={feature}
                                                    primaryTypographyProps={{
                                                        variant: "body2",
                                                    }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* FAQ Note */}
                <Box sx={{ textAlign: "center", mt: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                        All plans include 14-day free trial. No credit card required. •{" "}
                        <Link href="/pricing" style={{ color: "inherit", fontWeight: 600 }}>
                            View detailed pricing
                        </Link>
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
