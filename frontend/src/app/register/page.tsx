/**
 * Registration Page
 * New user signup with company information
 */
"use client";

import { useState } from "react";
import { useRegister } from "@refinedev/core";
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
    IconButton,
    InputAdornment,
    LinearProgress,
} from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    Google as GoogleIcon,
    CheckCircle,
} from "@mui/icons-material";
import Link from "next/link";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        company_name: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const { mutate: register, isLoading, error, isSuccess } = useRegister<{
        email: string;
        password: string;
        full_name: string;
        company_name: string;
    }>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("📝 Form submitted with data:", formData);
        register(formData);
    };

    const handleGoogleSignup = () => {
        // TODO: Implement Google OAuth
        console.log("Google signup not implemented yet");
    };

    // Password strength indicator
    const getPasswordStrength = (password: string): number => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
        if (password.match(/[0-9]/)) strength += 25;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 25;
        return strength;
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const getStrengthColor = () => {
        if (passwordStrength >= 75) return "success";
        if (passwordStrength >= 50) return "warning";
        return "error";
    };

    if (isSuccess) {
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
                <Card sx={{ maxWidth: 450, width: "100%", boxShadow: 3 }}>
                    <CardContent sx={{ p: 4, textAlign: "center" }}>
                        <CheckCircle
                            sx={{ fontSize: 64, color: "success.main", mb: 2 }}
                        />
                        <Typography variant="h5" gutterBottom fontWeight={600}>
                            Account Created!
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Please check your email to verify your account before signing in.
                        </Typography>
                        <Button
                            component={Link}
                            href="/login"
                            variant="contained"
                            size="large"
                            fullWidth
                        >
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        );
    }

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
                        Get Started Free
                    </Typography>
                    <Typography
                        color="text.secondary"
                        textAlign="center"
                        sx={{ mb: 4 }}
                    >
                        Create your SmartCRM account
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {(error as any)?.message || "Registration failed. Please try again."}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Full Name"
                            value={formData.full_name}
                            onChange={(e) =>
                                setFormData({ ...formData, full_name: e.target.value })
                            }
                            margin="normal"
                            required
                            autoComplete="name"
                            autoFocus
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            margin="normal"
                            required
                            autoComplete="email"
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            margin="normal"
                            required
                            autoComplete="new-password"
                            helperText="At least 8 characters with uppercase, lowercase, and numbers"
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

                        {formData.password && (
                            <Box sx={{ mb: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={passwordStrength}
                                    color={getStrengthColor()}
                                    sx={{ height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Password strength:{" "}
                                    {passwordStrength >= 75
                                        ? "Strong"
                                        : passwordStrength >= 50
                                            ? "Medium"
                                            : "Weak"}
                                </Typography>
                            </Box>
                        )}

                        <TextField
                            fullWidth
                            label="Company Name (Optional)"
                            value={formData.company_name}
                            onChange={(e) =>
                                setFormData({ ...formData, company_name: e.target.value })
                            }
                            margin="normal"
                            autoComplete="organization"
                            sx={{ mb: 3 }}
                        />

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
                            {isLoading ? "Creating account..." : "Create Account"}
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
                        onClick={handleGoogleSignup}
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
                        Sign up with Google
                    </Button>

                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{" "}
                            <MuiLink
                                component={Link}
                                href="/login"
                                sx={{
                                    fontWeight: 600,
                                    textDecoration: "none",
                                }}
                            >
                                Sign in
                            </MuiLink>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 4, textAlign: "center", maxWidth: 400 }}
            >
                By creating an account, you agree to our{" "}
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
