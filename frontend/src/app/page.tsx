/**
 * Landing Page
 * Main landing page with hero, features, pricing, and CTA sections
 */
import { Box, Container, Typography, Button } from "@mui/material";
import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { AutoAwesome } from "@mui/icons-material";

export default function LandingPage() {
    return (
        <Box>
            {/* Hero Section */}
            <Hero />

            {/* Features Section */}
            <Features />

            {/* Pricing Section */}
            <Pricing />

            {/* Final CTA Section */}
            <Box
                sx={{
                    py: { xs: 8, md: 12 },
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    textAlign: "center",
                }}
            >
                <Container maxWidth="md">
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: "2rem", md: "3rem" },
                            fontWeight: 800,
                            mb: 2,
                        }}
                    >
                        Ready to transform your business?
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 4,
                            opacity: 0.95,
                        }}
                    >
                        Join thousands of businesses managing their customer relationships better with SmartCRM.
                        Start your free trial today.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                        <Button
                            component={Link}
                            href="/register"
                            variant="contained"
                            size="large"
                            startIcon={<AutoAwesome />}
                            sx={{
                                bgcolor: "white",
                                color: "#667eea",
                                px: 4,
                                py: 1.5,
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                borderRadius: 2,
                                "&:hover": {
                                    bgcolor: "white",
                                    transform: "translateY(-2px)",
                                },
                            }}
                        >
                            Start Free Trial
                        </Button>
                        <Button
                            component={Link}
                            href="/login"
                            variant="outlined"
                            size="large"
                            sx={{
                                borderColor: "white",
                                color: "white",
                                px: 4,
                                py: 1.5,
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                borderRadius: 2,
                                borderWidth: 2,
                                "&:hover": {
                                    borderWidth: 2,
                                    bgcolor: "rgba(255,255,255,0.1)",
                                    borderColor: "white",
                                },
                            }}
                        >
                            Sign In
                        </Button>
                    </Box>

                    {/* Trust indicators */}
                    <Box sx={{ mt: 6, pt: 4, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                        <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                            ⭐ 4.9/5 from 500+ reviews • �� 99.9% uptime • 🔒 SOC 2 compliant
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    py: 4,
                    bgcolor: "grey.900",
                    color: "grey.400",
                    textAlign: "center",
                }}
            >
                <Container>
                    <Typography variant="body2">
                        © 2025 SmartCRM Builder. All rights reserved. •{" "}
                        <Link href="/privacy" style={{ color: "inherit" }}>
                            Privacy
                        </Link>{" "}
                        •{" "}
                        <Link href="/terms" style={{ color: "inherit" }}>
                            Terms
                        </Link>
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
}
