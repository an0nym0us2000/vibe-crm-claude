/**
 * Team Management Page
 * Manage workspace team members and invitations
 */
"use client";

import { useState, useEffect } from "react";
import {
    Box,
    Button,
    Typography,
    Alert,
    Grid,
    Card,
    CardContent,
    Skeleton,
    Chip,
    Divider,
} from "@mui/material";
import {
    Add,
    People,
    MailOutline,
} from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";
import { getAccessToken } from "@/utils/supabase-client";
import { InviteModal } from "@/components/team/InviteModal";
import { MemberCard } from "@/components/team/MemberCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Member {
    user_id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    role: string;
    joined_at: string;
    invited_by?: string;
}

export default function TeamPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { currentWorkspace } = useWorkspace();

    const loadMembers = async () => {
        if (!currentWorkspace) return;

        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace.id}/members`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error?.message ||
                    data.detail ||
                    "Failed to load team members"
                );
            }

            if (data.success) {
                setMembers(data.data.members || []);
            } else {
                throw new Error(data.error?.message || "Failed to load team members");
            }
        } catch (err: any) {
            console.error("Load members error:", err);
            setError(err.message || "Failed to load team members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, [currentWorkspace]);

    const handleRemoveMember = async (userId: string) => {
        setError(null);
        setSuccessMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace?.id}/members/${userId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error?.message ||
                    data.detail ||
                    "Failed to remove member"
                );
            }

            setSuccessMessage("Member removed successfully");
            loadMembers();

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error("Remove member error:", err);
            setError(err.message || "Failed to remove member");
        }
    };

    const handleChangeRole = async (userId: string, newRole: string) => {
        setError(null);
        setSuccessMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace?.id}/members/${userId}/role`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ role: newRole }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error?.message ||
                    data.detail ||
                    "Failed to change role"
                );
            }

            setSuccessMessage(`Role updated to ${newRole}`);
            loadMembers();

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error("Change role error:", err);
            setError(err.message || "Failed to change member role");
        }
    };

    const canManageMembers =
        currentWorkspace?.user_role === "owner" ||
        currentWorkspace?.user_role === "admin";

    const ownerCount = members.filter(m => m.role === "owner").length;
    const adminCount = members.filter(m => m.role === "admin").length;
    const memberCount = members.filter(m => m.role === "member").length;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box>
                        <Typography variant="h4" gutterBottom fontWeight={700}>
                            Team Members
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage your workspace team and permissions
                        </Typography>
                    </Box>
                    {canManageMembers && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setInviteModalOpen(true)}
                            size="large"
                        >
                            Invite Member
                        </Button>
                    )}
                </Box>

                {/* Stats */}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={4} md={3}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                    <People sx={{ mr: 1, color: "primary.main" }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Total Members
                                    </Typography>
                                </Box>
                                <Typography variant="h4" fontWeight={700}>
                                    {members.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={8} md={9}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Role Distribution
                                </Typography>
                                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                    <Chip
                                        label={`${ownerCount} Owner${ownerCount !== 1 ? 's' : ''}`}
                                        color="error"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`${adminCount} Admin${adminCount !== 1 ? 's' : ''}`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`${memberCount} Member${memberCount !== 1 ? 's' : ''}`}
                                        variant="outlined"
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            )}
            {!canManageMembers && (
                <Alert severity="info" sx={{ mb: 3 }} icon={<MailOutline />}>
                    Only admins and owners can invite or manage team members.
                </Alert>
            )}

            {/* Members List */}
            <Box>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
                    Team Members ({members.length})
                </Typography>

                {loading ? (
                    <Box sx={{ display: "grid", gap: 2 }}>
                        {[1, 2, 3].map((i) => (
                            <Card key={i} variant="outlined">
                                <CardContent>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                        <Skeleton variant="circular" width={48} height={48} />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Skeleton variant="text" width="40%" />
                                            <Skeleton variant="text" width="60%" />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                ) : members.length === 0 ? (
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: "center", py: 6 }}>
                            <People sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                No team members yet
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Invite your first team member to get started
                            </Typography>
                            {canManageMembers && (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => setInviteModalOpen(true)}
                                >
                                    Invite Member
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Box sx={{ display: "grid", gap: 2 }}>
                        {members.map((member) => (
                            <MemberCard
                                key={member.user_id}
                                member={member}
                                currentUserRole={currentWorkspace?.user_role || "member"}
                                canManage={canManageMembers}
                                onChangeRole={handleChangeRole}
                                onRemove={handleRemoveMember}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {/* Invite Modal */}
            <InviteModal
                open={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                onSuccess={() => {
                    setInviteModalOpen(false);
                    setSuccessMessage("Invitation sent successfully!");
                    loadMembers();
                    setTimeout(() => setSuccessMessage(null), 3000);
                }}
            />
        </Box>
    );
}
