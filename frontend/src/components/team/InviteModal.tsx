/**
 * Invite Modal Component
 * Modal dialog for inviting new team members
 */
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Alert,
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";
import { getAccessToken } from "@/utils/supabase-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface InviteModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const roleDescriptions = {
    admin: {
        label: "Admin",
        description: "Can manage team, entities, and all workspace settings",
        permissions: [
            "Manage team members",
            "Create and edit entities",
            "Configure automations",
            "View all records",
        ],
    },
    member: {
        label: "Member",
        description: "Can view and edit records",
        permissions: [
            "View all records",
            "Create and edit records",
            "Cannot manage team",
            "Cannot edit workspace settings",
        ],
    },
};

export function InviteModal({ open, onClose, onSuccess }: InviteModalProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "member">("member");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { currentWorkspace } = useWorkspace();

    const handleClose = () => {
        if (!loading) {
            setEmail("");
            setRole("member");
            setMessage("");
            setError(null);
            setSuccess(null);
            onClose();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace?.id}/invite`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        email,
                        role,
                        message: message || undefined,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error?.message ||
                    data.detail ||
                    "Failed to invite member"
                );
            }

            if (data.success) {
                setSuccess(
                    data.data?.status === "added"
                        ? `${email} has been added to the workspace`
                        : `Invitation sent to ${email}`
                );
                setEmail("");
                setRole("member");
                setMessage("");

                // Wait a bit then close and refresh
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                throw new Error(data.error?.message || "Failed to invite member");
            }
        } catch (err: any) {
            console.error("Invite error:", err);
            setError(err.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Typography variant="h6" fontWeight={600}>
                    Invite Team Member
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Add a new member to {currentWorkspace?.name}
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        margin="normal"
                        placeholder="colleague@example.com"
                        helperText="We'll send them an invitation to join your workspace"
                    />

                    <TextField
                        fullWidth
                        select
                        label="Role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as "admin" | "member")}
                        margin="normal"
                        required
                    >
                        {Object.entries(roleDescriptions).map(([key, value]) => (
                            <MenuItem key={key} value={key}>
                                <Box>
                                    <Typography variant="body1" fontWeight={600}>
                                        {value.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {value.description}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Role Permissions */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            {roleDescriptions[role].label} Permissions
                        </Typography>
                        <List dense>
                            {roleDescriptions[role].permissions.map((permission, index) => (
                                <ListItem key={index} sx={{ py: 0.5 }}>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <CheckCircle fontSize="small" color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={permission}
                                        primaryTypographyProps={{ variant: "body2" }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>

                    <TextField
                        fullWidth
                        label="Personal Message (Optional)"
                        multiline
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        margin="normal"
                        placeholder="Hey! I'd like to invite you to join our workspace..."
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !email}
                        sx={{ minWidth: 120 }}
                    >
                        {loading ? "Sending..." : "Send Invitation"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
