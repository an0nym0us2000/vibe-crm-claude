/**
 * Login Page
 * User authentication with email/password
 */
"use client";

import { useState } from "react";
import { useLogin } from "@refinedev/core";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Link as MuiLink,
    Alert,
    Divider,
    Stack,
    IconButton,
    InputAdornment,
} from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    Google as GoogleIcon,
} from "@mui/icons-material";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { mutate: login, isLoading, error } = useLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login({ email, password });
    };

    const handleGoogleLogin = () => {
        // TODO: Implement Google OAuth
        console.log("Google login not implemented yet");
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                bgcolor: "grey.50",
                py: 4,
                px: 2,
            }}
        >
            {/* Logo/Brand */}
            <Typography
                variant="h3"
                component="h1"
                sx={{
                    mb: 4,
                    fontWeight: 700,
                    background: "linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)",
                    backgroundClip: "text",
                    textFillColor: "transparent",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
            >
                SmartCRM
            </Typography>

            <Card sx={{ maxWidth: 450, width: "100%", boxShadow: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography
                        variant="h4"
                        gutterBottom
                        textAlign="center"
                        fontWeight={600}
                    >
                        Welcome Back
                    </Typography>
                    <Typography
                        color="text.secondary"
                        textAlign="center"
                        sx={{ mb: 4 }}
                    >
                        Sign in to your SmartCRM account
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {(error as any)?.message || "Invalid email or password"}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                            autoComplete="email"
                            autoFocus
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                            autoComplete="current-password"
                            sx={{ mb: 1 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{ textAlign: "right", mb: 3 }}>
                            <MuiLink
                                component={Link}
                                href="/forgot-password"
                                variant="body2"
                                sx={{ textDecoration: "none" }}
                            >
                                Forgot password?
                            </MuiLink>
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isLoading}
                            sx={{
                                py: 1.5,
                                fontWeight: 600,
                                textTransform: "none",
                                fontSize: "1rem",
                            }}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </Box>

                    <Divider sx={{ my: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            OR
                        </Typography>
                    </Divider>

                    <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleLogin}
                        sx={{
                            py: 1.5,
                            textTransform: "none",
                            fontSize: "1rem",
                            borderColor: "grey.300",
                            color: "text.primary",
                            "&:hover": {
                                borderColor: "grey.400",
                                bgcolor: "grey.50",
                            },
                        }}
                    >
                        Sign in with Google
                    </Button>

                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            Don't have an account?{" "}
                            <MuiLink
                                component={Link}
                                href="/register"
                                sx={{
                                    fontWeight: 600,
                                    textDecoration: "none",
                                }}
                            >
                                Sign up for free
                            </MuiLink>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 4, textAlign: "center" }}
            >
                By signing in, you agree to our{" "}
                <MuiLink href="#" sx={{ textDecoration: "none" }}>
                    Terms of Service
                </MuiLink>{" "}
                and{" "}
                <MuiLink href="#" sx={{ textDecoration: "none" }}>
                    Privacy Policy
                </MuiLink>
            </Typography>
        </Box>
    );
}
