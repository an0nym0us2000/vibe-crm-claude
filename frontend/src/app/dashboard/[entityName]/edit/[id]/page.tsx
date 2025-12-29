/**
 * Dynamic Entity Edit Page
 * Generic edit form that adapts to entity schema
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
    Box,
    Button,
    TextField,
    MenuItem,
    Card,
    CardContent,
    Typography,
    Checkbox,
    FormControlLabel,
    Alert,
    LinearProgress,
    Grid,
    Skeleton,
} from "@mui/material";
import { ArrowBack, Save } from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";
import { getAccessToken } from "@/utils/supabase-client";
import type { Entity, FieldDefinition } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Record {
    id: string;
    data: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

export default function EntityEditPage({
    params,
}: {
    params: { entityName: string; id: string };
}) {
    const router = useRouter();
    const { currentWorkspace, entities, isLoading: workspaceLoading } = useWorkspace();

    const [entityConfig, setEntityConfig] = useState<Entity | null>(null);
    const [record, setRecord] = useState<Record | null>(null);
    const [loadingRecord, setLoadingRecord] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    // Find entity config
    useEffect(() => {
        const entity = entities.find((e) => e.entity_name === params.entityName);
        setEntityConfig(entity || null);
    }, [entities, params.entityName]);

    // Load existing record
    useEffect(() => {
        const loadRecord = async () => {
            if (!currentWorkspace || !entityConfig) return;

            setLoadingRecord(true);
            setError(null);

            try {
                const token = await getAccessToken();
                if (!token) throw new Error("Not authenticated");

                const response = await fetch(
                    `${API_URL}/workspaces/${currentWorkspace.id}/entities/${entityConfig.id}/records/${params.id}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${token}`,
                        },
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error?.message || "Failed to load record");
                }

                if (result.success) {
                    const recordData = result.data.record;
                    setRecord(recordData);

                    // Pre-populate form
                    reset(recordData.data);
                }
            } catch (err: any) {
                console.error("Load record error:", err);
                setError(err.message || "Failed to load record");
            } finally {
                setLoadingRecord(false);
            }
        };

        if (entityConfig && currentWorkspace) {
            loadRecord();
        }
    }, [entityConfig, currentWorkspace, params.id, reset]);

    // Submit handler
    const onSubmit = async (formData: any) => {
        if (!currentWorkspace || !entityConfig) return;

        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace.id}/entities/${entityConfig.id}/records/${params.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ data: formData }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || "Failed to update record");
            }

            // Redirect to list page
            router.push(`/dashboard/${params.entityName}`);
        } catch (err: any) {
            console.error("Update error:", err);
            setError(err.message || "Failed to update record");
        } finally {
            setLoading(false);
        }
    };

    // Render field based on type (same as create page)
    const renderField = (field: FieldDefinition, { onChange, value }: any) => {
        const commonProps = {
            fullWidth: true,
            margin: "normal" as const,
            label: field.display_name,
            error: !!errors[field.name],
            helperText: errors[field.name]
                ? `${field.display_name} is required`
                : field.help_text || field.placeholder || "",
            required: field.required,
            placeholder: field.placeholder,
        };

        switch (field.type) {
            case "select":
                return (
                    <TextField
                        {...commonProps}
                        select
                        value={value || ""}
                        onChange={onChange}
                    >
                        {field.options?.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                );

            case "multiselect":
                return (
                    <TextField
                        {...commonProps}
                        select
                        SelectProps={{ multiple: true }}
                        value={value || []}
                        onChange={onChange}
                    >
                        {field.options?.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                );

            case "checkbox":
                return (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={value || false}
                                onChange={(e) => onChange(e.target.checked)}
                            />
                        }
                        label={field.display_name}
                        sx={{ mt: 2 }}
                    />
                );

            case "textarea":
                return (
                    <TextField
                        {...commonProps}
                        multiline
                        rows={4}
                        value={value || ""}
                        onChange={onChange}
                    />
                );

            case "date":
                return (
                    <TextField
                        {...commonProps}
                        type="date"
                        value={value || ""}
                        onChange={onChange}
                        InputLabelProps={{ shrink: true }}
                    />
                );

            case "datetime":
                return (
                    <TextField
                        {...commonProps}
                        type="datetime-local"
                        value={value || ""}
                        onChange={onChange}
                        InputLabelProps={{ shrink: true }}
                    />
                );

            case "email":
                return (
                    <TextField
                        {...commonProps}
                        type="email"
                        value={value || ""}
                        onChange={onChange}
                    />
                );

            case "phone":
                return (
                    <TextField
                        {...commonProps}
                        type="tel"
                        value={value || ""}
                        onChange={onChange}
                    />
                );

            case "url":
                return (
                    <TextField
                        {...commonProps}
                        type="url"
                        value={value || ""}
                        onChange={onChange}
                    />
                );

            case "number":
            case "currency":
                return (
                    <TextField
                        {...commonProps}
                        type="number"
                        value={value || ""}
                        onChange={onChange}
                        inputProps={{
                            step: field.type === "currency" ? "0.01" : "any",
                            min: field.validation?.min,
                            max: field.validation?.max,
                        }}
                    />
                );

            default:
                return (
                    <TextField
                        {...commonProps}
                        type="text"
                        value={value || ""}
                        onChange={onChange}
                        inputProps={{
                            maxLength: field.validation?.max_length,
                        }}
                    />
                );
        }
    };

    if (workspaceLoading || !entityConfig) {
        return (
            <Box>
                <Typography variant="h5" gutterBottom>
                    Loading...
                </Typography>
                <LinearProgress />
            </Box>
        );
    }

    if (loadingRecord) {
        return (
            <Box sx={{ maxWidth: 900, mx: "auto" }}>
                <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={400} />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 900, mx: "auto" }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.push(`/dashboard/${params.entityName}`)}
                    sx={{ mb: 2 }}
                >
                    Back to {entityConfig.display_name}
                </Button>
                <Typography variant="h4" gutterBottom fontWeight={700}>
                    Edit {entityConfig.display_name_singular || entityConfig.display_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Update the details below
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Form */}
            <Card>
                <CardContent sx={{ p: 4 }}>
                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={2}>
                            {entityConfig.fields.map((field) => (
                                <Grid item xs={12} sm={field.type === "textarea" ? 12 : 6} key={field.name}>
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        rules={{
                                            required: field.required,
                                            validate: (value) => {
                                                if (!field.required && !value) return true;

                                                if (field.type === "email" && value) {
                                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                    if (!emailRegex.test(value)) {
                                                        return "Invalid email address";
                                                    }
                                                }

                                                if (field.type === "url" && value) {
                                                    try {
                                                        new URL(value);
                                                    } catch {
                                                        return "Invalid URL";
                                                    }
                                                }

                                                return true;
                                            },
                                        }}
                                        defaultValue={record?.data[field.name] || field.default_value || ""}
                                        render={({ field: controllerField }) =>
                                            renderField(field, controllerField)
                                        }
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Metadata */}
                        {record && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Created: {new Date(record.created_at).toLocaleString()}
                                    {record.updated_at && ` • Last updated: ${new Date(record.updated_at).toLocaleString()}`}
                                </Typography>
                            </Box>
                        )}

                        {/* Actions */}
                        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                startIcon={<Save />}
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => router.push(`/dashboard/${params.entityName}`)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
