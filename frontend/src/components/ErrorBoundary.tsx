/**
 * React Error Boundary
 * Catches errors in component tree and displays fallback UI
 */
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    Alert,
} from "@mui/material";
import { Error as ErrorIcon, Refresh } from "@mui/icons-material";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console and error tracking service
        console.error("Error caught by boundary:", error, errorInfo);

        // You can also log to an error reporting service here
        // logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "400px",
                        p: 3,
                    }}
                >
                    <Card sx={{ maxWidth: 600, width: "100%" }}>
                        <CardContent sx={{ textAlign: "center", p: 4 }}>
                            <ErrorIcon
                                sx={{ fontSize: 64, color: "error.main", mb: 2 }}
                            />

                            <Typography variant="h4" gutterBottom fontWeight={700}>
                                Oops! Something went wrong
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                We're sorry, but something unexpected happened. Please try refreshing the page.
                            </Typography>

                            {process.env.NODE_ENV === "development" && this.state.error && (
                                <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Error Details:
                                    </Typography>
                                    <Typography variant="body2" component="pre" sx={{ fontSize: "0.75rem" }}>
                                        {this.state.error.toString()}
                                    </Typography>
                                    {this.state.errorInfo && (
                                        <Typography variant="body2" component="pre" sx={{ fontSize: "0.65rem", mt: 1 }}>
                                            {this.state.errorInfo.componentStack}
                                        </Typography>
                                    )}
                                </Alert>
                            )}

                            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Refresh />}
                                    onClick={() => window.location.reload()}
                                    size="large"
                                >
                                    Refresh Page
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={this.handleReset}
                                    size="large"
                                >
                                    Try Again
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            );
        }

        return this.props.children;
    }
}

// Higher-order component for easier use
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
