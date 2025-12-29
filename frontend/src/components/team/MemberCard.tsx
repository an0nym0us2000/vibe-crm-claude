/**
 * Member Card Component
 * Display team member information with actions
 */
"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    Box,
    Avatar,
    Typography,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from "@mui/material";
import {
    MoreVert,
    AdminPanelSettings,
    PersonOff,
    SwapHoriz,
    Person,
} from "@mui/icons-material";

interface Member {
    user_id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    role: string;
    joined_at: string;
    invited_by?: string;
}

interface MemberCardProps {
    member: Member;
    currentUserRole: string;
    canManage: boolean;
    onChangeRole: (userId: string, newRole: string) => void;
    onRemove: (userId: string) => void;
}

const getRoleBadgeColor = (role: string) => {
    switch (role) {
        case "owner":
            return "error";
        case "admin":
            return "primary";
        default:
            return "default";
    }
};

const getRoleIcon = (role: string) => {
    switch (role) {
        case "owner":
            return <AdminPanelSettings fontSize="small" />;
        case "admin":
            return <AdminPanelSettings fontSize="small" />;
        default:
            return <Person fontSize="small" />;
    }
};

export function MemberCard({
    member,
    currentUserRole,
    canManage,
    onChangeRole,
    onRemove,
}: MemberCardProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleChangeRole = (newRole: string) => {
        onChangeRole(member.user_id, newRole);
        handleMenuClose();
    };

    const handleRemove = () => {
        if (confirm(`Are you sure you want to remove ${member.full_name || member.email}?`)) {
            onRemove(member.user_id);
        }
        handleMenuClose();
    };

    const getInitials = () => {
        if (member.full_name) {
            return member.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return member.email.charAt(0).toUpperCase();
    };

    const formatJoinedDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Joined today";
        if (diffDays === 1) return "Joined yesterday";
        if (diffDays < 7) return `Joined ${diffDays} days ago`;
        if (diffDays < 30) return `Joined ${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const isOwner = member.role === "owner";
    const canModifyThisMember = canManage && !isOwner && currentUserRole === "owner";
    const canRemoveThisMember = canManage && !isOwner;

    return (
        <Card
            variant="outlined"
            sx={{
                transition: "all 0.2s",
                "&:hover": {
                    boxShadow: 2,
                    borderColor: "primary.main",
                },
            }}
        >
            <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* Avatar */}
                    <Avatar
                        src={member.avatar_url || undefined}
                        sx={{
                            width: 48,
                            height: 48,
                            bgcolor: getRoleBadgeColor(member.role) + ".main",
                            fontSize: "1.2rem",
                            fontWeight: 600,
                        }}
                    >
                        {getInitials()}
                    </Avatar>

                    {/* Member Info */}
                    <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
                                {member.full_name || "No name"}
                            </Typography>
                            <Chip
                                icon={getRoleIcon(member.role)}
                                label={member.role}
                                color={getRoleBadgeColor(member.role)}
                                size="small"
                                sx={{ height: 24, textTransform: "capitalize" }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {member.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatJoinedDate(member.joined_at)}
                        </Typography>
                    </Box>

                    {/* Actions Menu */}
                    {(canModifyThisMember || canRemoveThisMember) && (
                        <>
                            <IconButton
                                onClick={handleMenuClick}
                                size="small"
                                sx={{
                                    "&:hover": {
                                        bgcolor: "primary.light",
                                        color: "primary.main",
                                    },
                                }}
                            >
                                <MoreVert />
                            </IconButton>

                            <Menu
                                anchorEl={anchorEl}
                                open={menuOpen}
                                onClose={handleMenuClose}
                                PaperProps={{
                                    sx: { minWidth: 200 },
                                }}
                            >
                                {canModifyThisMember && (
                                    <>
                                        <MenuItem onClick={() => handleChangeRole("admin")}>
                                            <ListItemIcon>
                                                <SwapHoriz fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Typography variant="body2">Make Admin</Typography>
                                            </ListItemText>
                                        </MenuItem>
                                        <MenuItem onClick={() => handleChangeRole("member")}>
                                            <ListItemIcon>
                                                <SwapHoriz fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Typography variant="body2">Make Member</Typography>
                                            </ListItemText>
                                        </MenuItem>
                                        <Divider />
                                    </>
                                )}
                                {canRemoveThisMember && (
                                    <MenuItem onClick={handleRemove} sx={{ color: "error.main" }}>
                                        <ListItemIcon>
                                            <PersonOff fontSize="small" color="error" />
                                        </ListItemIcon>
                                        <ListItemText>
                                            <Typography variant="body2">Remove from workspace</Typography>
                                        </ListItemText>
                                    </MenuItem>
                                )}
                            </Menu>
                        </>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
