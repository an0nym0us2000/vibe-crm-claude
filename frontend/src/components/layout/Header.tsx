/**
 * Header Component
 * Top navigation bar with workspace switcher and user menu
 */
"use client";

import { useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Box,
    Button,
    Divider,
    Badge,
    Chip,
} from "@mui/material";
import {
    KeyboardArrowDown,
    AccountCircle,
    People,
    Logout,
    Settings,
    Add,
} from "@mui/icons-material";
import { useLogout, useGetIdentity } from "@refinedev/core";
import { useWorkspace } from "@/contexts/workspace-context";
import { useRouter } from "next/navigation";

export function Header() {
    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
    const [workspaceMenuAnchor, setWorkspaceMenuAnchor] = useState<null | HTMLElement>(null);

    const { data: identity } = useGetIdentity();
    const { mutate: logout } = useLogout();
    const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
    const router = useRouter();

    // User menu handlers
    const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    // Workspace menu handlers
    const handleWorkspaceMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setWorkspaceMenuAnchor(event.currentTarget);
    };

    const handleWorkspaceMenuClose = () => {
        setWorkspaceMenuAnchor(null);
    };

    const handleLogout = () => {
        logout();
        handleUserMenuClose();
    };

    const handleSwitchWorkspace = async (workspaceId: string) => {
        await switchWorkspace(workspaceId);
        handleWorkspaceMenuClose();
        router.push("/dashboard");
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "owner":
                return "error";
            case "admin":
                return "primary";
            default:
                return "default";
        }
    };

    return (
        <AppBar
            position="sticky"
            color="default"
            elevation={1}
            sx={{
                bgcolor: "white",
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar>
                {/* Logo */}
                <Typography
                    variant="h6"
                    sx={{
                        flexGrow: 0,
                        mr: 4,
                        fontWeight: 700,
                        background: "linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)",
                        backgroundClip: "text",
                        textFillColor: "transparent",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        cursor: "pointer",
                    }}
                    onClick={() => router.push("/dashboard")}
                >
                    SmartCRM
                </Typography>

                {/* Workspace Switcher */}
                {currentWorkspace && (
                    <>
                        <Button
                            onClick={handleWorkspaceMenuClick}
                            endIcon={<KeyboardArrowDown />}
                            sx={{
                                textTransform: "none",
                                color: "text.primary",
                                "&:hover": {
                                    bgcolor: "grey.100",
                                },
                            }}
                        >
                            <Box sx={{ textAlign: "left", mr: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Workspace
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {currentWorkspace.name}
                                </Typography>
                            </Box>
                            {currentWorkspace.user_role && (
                                <Chip
                                    label={currentWorkspace.user_role}
                                    size="small"
                                    color={getRoleColor(currentWorkspace.user_role)}
                                    sx={{ ml: 1 }}
                                />
                            )}
                        </Button>

                        <Menu
                            anchorEl={workspaceMenuAnchor}
                            open={Boolean(workspaceMenuAnchor)}
                            onClose={handleWorkspaceMenuClose}
                            PaperProps={{
                                sx: { minWidth: 280, mt: 1 },
                            }}
                        >
                            <MenuItem disabled sx={{ opacity: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    YOUR WORKSPACES
                                </Typography>
                            </MenuItem>
                            {workspaces.map((workspace) => (
                                <MenuItem
                                    key={workspace.id}
                                    selected={workspace.id === currentWorkspace.id}
                                    onClick={() => handleSwitchWorkspace(workspace.id)}
                                    sx={{ py: 1.5 }}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" fontWeight={500}>
                                            {workspace.name}
                                        </Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                            <Chip
                                                label={workspace.user_role || "member"}
                                                size="small"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: "0.7rem" }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {workspace.subscription_tier}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </MenuItem>
                            ))}
                            <Divider sx={{ my: 1 }} />
                            <MenuItem
                                onClick={() => {
                                    handleWorkspaceMenuClose();
                                    router.push("/onboarding");
                                }}
                            >
                                <Add sx={{ mr: 1 }} />
                                <Typography>Create New Workspace</Typography>
                            </MenuItem>
                        </Menu>
                    </>
                )}

                <Box sx={{ flexGrow: 1 }} />

                {/* Team Management Button (Admin/Owner only) */}
                {currentWorkspace && (currentWorkspace.user_role === "owner" || currentWorkspace.user_role === "admin") && (
                    <IconButton
                        color="inherit"
                        onClick={() => router.push("/dashboard/team")}
                        sx={{ mr: 1 }}
                        title="Team Management"
                    >
                        <Badge badgeContent={0} color="primary">
                            <People />
                        </Badge>
                    </IconButton>
                )}

                {/* User Menu */}
                <IconButton onClick={handleUserMenuClick} color="inherit">
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "primary.main",
                            fontSize: "1rem",
                        }}
                    >
                        {identity?.full_name?.charAt(0)?.toUpperCase() ||
                            identity?.email?.charAt(0)?.toUpperCase() ||
                            "U"}
                    </Avatar>
                </IconButton>

                <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    PaperProps={{
                        sx: { minWidth: 240, mt: 1 },
                    }}
                >
                    <MenuItem disabled sx={{ opacity: 1, py: 1.5 }}>
                        <Box>
                            <Typography variant="body1" fontWeight={600}>
                                {identity?.full_name || "User"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {identity?.email}
                            </Typography>
                        </Box>
                    </MenuItem>
                    <Divider />
                    <MenuItem
                        onClick={() => {
                            handleUserMenuClose();
                            router.push("/dashboard/profile");
                        }}
                    >
                        <AccountCircle sx={{ mr: 2 }} fontSize="small" />
                        <Typography>Profile</Typography>
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            handleUserMenuClose();
                            router.push("/dashboard/settings");
                        }}
                    >
                        <Settings sx={{ mr: 2 }} fontSize="small" />
                        <Typography>Settings</Typography>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                        <Logout sx={{ mr: 2 }} fontSize="small" />
                        <Typography>Logout</Typography>
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}
