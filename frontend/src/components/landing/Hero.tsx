/**
 * Landing Page Hero Section
 * Animated hero with gradient background and CTAs
 */
"use client";

import { Box, Button, Container, Typography, keyframes } from "@mui/material";
import { AutoAwesome, PlayArrow } from "@mui/icons-material";
import Link from "next/link";

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

export function Hero() {
    return (
        <Box
            sx={{
                position: "relative",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                py: { xs: 10, md: 15 },
                overflow: "hidden",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                },
            }}
        >
            <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
                <Box
                    sx={{
                        textAlign: "center",
                        animation: `${fadeIn} 1s ease-out`,
                    }}
                >
                    {/* Badge */}
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            bgcolor: "rgba(255,255,255,0.2)",
                            backdropFilter: "blur(10px)",
                            px: 3,
                            py: 1,
                            borderRadius: 50,
                            mb: 3,
                        }}
                    >
                        <AutoAwesome sx={{ fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={600}>
                            Powered by GPT-4
                        </Typography>
                    </Box>

                    {/* Main Heading */}
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
                            fontWeight: 800,
                            mb: 2,
                            lineHeight: 1.2,
                        }}
                    >
                        Build Your Custom CRM
                        <br />
                        in{" "}
                        <Box
                            component="span"
                            sx={{
                                background: "linear-gradient(90deg, #FFD700, #FFA500)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            30 Seconds
                        </Box>
                    </Typography>

                    {/* Subheading */}
                    <Typography
                        variant="h5"
                        sx={{
                            fontSize: { xs: "1.1rem", md: "1.5rem" },
                            mb: 5,
                            opacity: 0.95,
                            maxWidth: 700,
                            mx: "auto",
                        }}
                    >
                        AI-powered CRM builder for small businesses. Describe your needs,
                        get a fully customized system. No coding required.
                    </Typography>

                    {/* CTA Buttons */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "center",
                            flexWrap: "wrap",
                            mb: 6,
                        }}
                    >
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
                                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                                transition: "all 0.3s",
                                "&:hover": {
                                    bgcolor: "white",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                                },
                            }}
                        >
                            Start Free Trial
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<PlayArrow />}
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
                            Watch Demo
                        </Button>
                    </Box>

                    {/* Social Proof */}
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                        <Box>
                            <Typography variant="h4" fontWeight={700}>
                                1,000+
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Active Users
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={700}>
                                50,000+
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Records Managed
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={700}>
                                99.9%
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Uptime
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Floating Elements */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "20%",
                        right: "10%",
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.1)",
                        animation: `${float} 6s ease-in-out infinite`,
                        display: { xs: "none", md: "block" },
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: "30%",
                        left: "5%",
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.1)",
                        animation: `${float} 4s ease-in-out infinite`,
                        animationDelay: "1s",
                        display: { xs: "none", md: "block" },
                    }}
                />
            </Container>
        </Box>
    );
}
