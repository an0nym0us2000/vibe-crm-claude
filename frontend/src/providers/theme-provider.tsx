"use client";

import { ThemeProvider as MUIThemeProvider, createTheme } from "@mui/material/styles";
import { ReactNode } from "react";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#667eea",
            light: "#8b9cf5",
            dark: "#4c63d2",
        },
        secondary: {
            main: "#764ba2",
            light: "#9370db",
            dark: "#5a3881",
        },
        background: {
            default: "#f5f7fa",
            paper: "#ffffff",
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 600,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
                },
            },
        },
    },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    return <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>;
}
