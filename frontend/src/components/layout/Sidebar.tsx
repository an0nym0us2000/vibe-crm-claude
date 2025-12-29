/**
 * Sidebar Component
 * Dynamic navigation based on workspace entities
 */
"use client";

import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Box,
    Typography,
    Skeleton,
    Chip,
    Tooltip,
    IconButton,
    Collapse,
} from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import * as Icons from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";
import { useState } from "react";

const DRAWER_WIDTH = 260;

// Map entity icons to MUI icons
const getIcon = (iconName: string) => {
    // Remove "Icon" suffix if present
    const cleanName = iconName.replace(/Icon$/, "");

    // Try to find the icon in MUI icons
    const Icon = (Icons as any)[cleanName] ||
        (Icons as any)[iconName] ||
        Icons.Folder;

    return <Icon />;
};

export function Sidebar() {
    const { currentWorkspace, entities, isLoading } = useWorkspace();
    const router = useRouter();
    const pathname = usePathname();
    const [entitiesExpanded, setEntitiesExpanded] = useState(true);

    const isPathActive = (path: string) => {
        return pathname === path || pathname.startsWith(path + "/");
    };

    if (isLoading) {
        return (
            <Drawer
                variant="permanent"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: DRAWER_WIDTH,
                        boxSizing: "border-box",
                        borderRight: "1px solid",
                        borderColor: "divider",
                    },
                }}
            >
                <Box sx={{ p: 2, pt: 3 }}>
                    <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={40} />
                </Box>
            </Drawer>
        );
    }

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: DRAWER_WIDTH,
                    boxSizing: "border-box",
                    borderRight: "1px solid",
                    borderColor: "divider",
                    bgcolor: "grey.50",
                },
            }}
        >
            <Box sx={{ overflow: "auto", pt: 2 }}>
                <List>
                    {/* Dashboard */}
                    <ListItem disablePadding>
                        <ListItemButton
                            selected={pathname === "/dashboard"}
                            onClick={() => router.push("/dashboard")}
                            sx={{
                                mx: 1,
                                borderRadius: 1,
                                "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "white",
                                    "&:hover": {
                                        bgcolor: "primary.dark",
                                    },
                                    "& .MuiListItemIcon-root": {
                                        color: "white",
                                    },
                                },
                            }}
                        >
                            <ListItemIcon>
                                <Icons.Dashboard />
                            </ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItemButton>
                    </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Entities Section */}
                <Box sx={{ px: 2, mb: 1 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{ letterSpacing: 0.5 }}
                        >
                            ENTITIES
                        </Typography>
                        <Chip
                            label={entities.length}
                            size="small"
                            sx={{ height: 18, fontSize: "0.7rem" }}
                        />
                    </Box>
                </Box>

                <List>
                    {entities.length === 0 ? (
                        <ListItem>
                            <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                No entities yet
                            </Typography>
                        </ListItem>
                    ) : (
                        entities.map((entity) => {
                            const entityPath = `/dashboard/${entity.entity_name}`;
                            const isActive = isPathActive(entityPath);

                            return (
                                <Tooltip
                                    key={entity.id}
                                    title={entity.description || entity.display_name}
                                    placement="right"
                                    arrow
                                >
                                    <ListItem disablePadding>
                                        <ListItemButton
                                            selected={isActive}
                                            onClick={() => router.push(entityPath)}
                                            sx={{
                                                mx: 1,
                                                borderRadius: 1,
                                                "&.Mui-selected": {
                                                    bgcolor: "primary.main",
                                                    color: "white",
                                                    "&:hover": {
                                                        bgcolor: "primary.dark",
                                                    },
                                                    "& .MuiListItemIcon-root": {
                                                        color: "white",
                                                    },
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                {getIcon(entity.icon)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={entity.display_name}
                                                primaryTypographyProps={{
                                                    variant: "body2",
                                                    fontWeight: isActive ? 600 : 400,
                                                }}
                                            />
                                            {entity.record_count !== undefined && (
                                                <Chip
                                                    label={entity.record_count}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: "0.7rem",
                                                        bgcolor: isActive ? "rgba(255,255,255,0.2)" : "grey.200",
                                                        color: isActive ? "white" : "text.secondary",
                                                    }}
                                                />
                                            )}
                                        </ListItemButton>
                                    </ListItem>
                                </Tooltip>
                            );
                        })
                    )}
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Management Section (Admin/Owner only) */}
                {currentWorkspace && (currentWorkspace.user_role === "owner" || currentWorkspace.user_role === "admin") && (
                    <>
                        <Box sx={{ px: 2, mb: 1 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{ letterSpacing: 0.5 }}
                            >
                                MANAGEMENT
                            </Typography>
                        </Box>
                        <List>
                            <ListItem disablePadding>
                                <ListItemButton
                                    selected={isPathActive("/dashboard/team")}
                                    onClick={() => router.push("/dashboard/team")}
                                    sx={{
                                        mx: 1,
                                        borderRadius: 1,
                                        "&.Mui-selected": {
                                            bgcolor: "primary.main",
                                            color: "white",
                                            "&:hover": {
                                                bgcolor: "primary.dark",
                                            },
                                            "& .MuiListItemIcon-root": {
                                                color: "white",
                                            },
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Icons.People />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Team"
                                        primaryTypographyProps={{ variant: "body2" }}
                                    />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton
                                    selected={isPathActive("/dashboard/automations")}
                                    onClick={() => router.push("/dashboard/automations")}
                                    sx={{
                                        mx: 1,
                                        borderRadius: 1,
                                        "&.Mui-selected": {
                                            bgcolor: "primary.main",
                                            color: "white",
                                            "&:hover": {
                                                bgcolor: "primary.dark",
                                            },
                                            "& .MuiListItemIcon-root": {
                                                color: "white",
                                            },
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Icons.AutoMode />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Automations"
                                        primaryTypographyProps={{ variant: "body2" }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </List>
                        <Divider sx={{ my: 2 }} />
                    </>
                )}

                {/* Settings */}
                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            selected={isPathActive("/dashboard/settings")}
                            onClick={() => router.push("/dashboard/settings")}
                            sx={{
                                mx: 1,
                                borderRadius: 1,
                                "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "white",
                                    "&:hover": {
                                        bgcolor: "primary.dark",
                                    },
                                    "& .MuiListItemIcon-root": {
                                        color: "white",
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <Icons.Settings />
                            </ListItemIcon>
                            <ListItemText
                                primary="Settings"
                                primaryTypographyProps={{ variant: "body2" }}
                            />
                        </ListItemButton>
                    </ListItem>
                </List>

                {/* Workspace Info (Footer) */}
                {currentWorkspace && (
                    <Box sx={{ p: 2, mt: "auto", bgcolor: "grey.100", borderRadius: 1, m: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            Current Workspace
                        </Typography>
                        <Typography variant="body2" fontWeight={600} noWrap>
                            {currentWorkspace.name}
                        </Typography>
                        <Chip
                            label={currentWorkspace.user_role}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 0.5, height: 20, fontSize: "0.7rem" }}
                        />
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}
