"use client";

import type { Metadata } from "next";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "../providers/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { authProvider } from "@/providers/auth-provider";
import { dataProvider } from "@/providers/data-provider";
import { notificationProvider } from "@/providers/notification-provider";
import { SnackbarProvider } from "notistack";

// Wrapper component to properly use the notification provider hook
function RefineWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider}
            authProvider={authProvider}
            notificationProvider={notificationProvider}
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                useNewQueryKeys: true,
                projectId: "vibe-crm",
                disableTelemetry: true,
            }}
        >
            {children}
        </Refine>
    );
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Create QueryClient instance
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 1,
            },
        },
    }));

    return (
        <html lang="en">
            <body>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider>
                        <SnackbarProvider
                            maxSnack={3}
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                        >
                            <RefineWrapper>
                                <CssBaseline />
                                <GlobalStyles
                                    styles={{
                                        html: { WebkitFontSmoothing: "auto" },
                                    }}
                                />
                                {children}
                            </RefineWrapper>
                        </SnackbarProvider>
                    </ThemeProvider>
                </QueryClientProvider>
            </body>
        </html>
    );
}
