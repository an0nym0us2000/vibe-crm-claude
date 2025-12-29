/**
 * Dashboard Layout
 * Main layout wrapper with header and sidebar
 */
"use client";

import { Box, CssBaseline } from "@mui/material";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/utils/supabase-client";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const { data } = await supabaseClient.auth.getSession();
            if (!data.session) {
                router.push("/login");
            }
        };

        checkAuth();

        // Listen for auth changes
        const { data: authListener } = supabaseClient.auth.onAuthStateChange(
            (event, session) => {
                if (event === "SIGNED_OUT" || !session) {
                    router.push("/login");
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router]);

    return (
        <>
            <CssBaseline />
            <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
                <Header />
                <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
                    <Sidebar />
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            p: 3,
                            overflow: "auto",
                            bgcolor: "grey.50",
                        }}
                    >
                        {children}
                    </Box>
                </Box>
            </Box>
        </>
    );
}
