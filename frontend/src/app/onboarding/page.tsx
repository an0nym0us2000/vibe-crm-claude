/**
 * Onboarding Page
 * Multi-step wizard for workspace creation with AI
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress,
    Chip,
    Stack,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from "@mui/material";
import {
    Business,
    AutoAwesome,
    CheckCircle,
    ArrowForward,
    ArrowBack,
    Folder,
} from "@mui/icons-material";
import { getAccessToken } from "@/utils/supabase-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const steps = ["Company Info", "Describe Your Business", "Review CRM", "Complete"];

const industryTemplates = [
    { value: "real_estate", label: "Real Estate" },
    { value: "recruitment", label: "Recruitment" },
    { value: "consulting", label: "Consulting" },
    { value: "sales", label: "Sales" },
    { value: "custom", label: "Custom (with AI)" },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [companyName, setCompanyName] = useState("");
    const [industry, setIndustry] = useState("custom");
    const [businessDescription, setBusinessDescription] = useState("");
    const [generatedConfig, setGeneratedConfig] = useState<any>(null);

    const handleNext = async () => {
        setError(null);

        if (activeStep === 0 && !companyName) {
            setError("Please enter your company name");
            return;
        }

        if (activeStep === 1) {
            if (industry === "custom" && !businessDescription) {
                setError("Please describe your business");
                return;
            }

            // Generate CRM configuration
            await generateCRM();
        }

        if (activeStep === 2) {
            // Create workspace
            await createWorkspace();
        }

        if (activeStep < steps.length - 1) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        setError(null);
    };

    const generateCRM = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                throw new Error("No authentication token");
            }

            let endpoint = "";
            let body: any = {};

            if (industry === "custom") {
                // Use AI generation
                endpoint = `${API_URL}/ai/generate`;
                body = {
                    business_description: businessDescription,
                    num_entities: 4,
                };
            } else {
                // Use template
                endpoint = `${API_URL}/ai/templates/${industry}`;
            }

            const response = await fetch(endpoint, {
                method: industry === "custom" ? "POST" : "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: industry === "custom" ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                throw new Error("Failed to generate CRM configuration");
            }

            const result = await response.json();

            if (result.success) {
                setGeneratedConfig(result.data.config || result.data);
            } else {
                throw new Error(result.error?.message || "Generation failed");
            }
        } catch (err) {
            console.error("Error generating CRM:", err);
            setError(err instanceof Error ? err.message : "Failed to generate CRM");
        } finally {
            setLoading(false);
        }
    };

    const createWorkspace = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                throw new Error("No authentication token");
            }

            const response = await fetch(`${API_URL}/workspaces/generate`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    workspace_name: companyName,
                    business_description: businessDescription || `${industry} business`,
                    industry: industry !== "custom" ? industry : undefined,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create workspace");
            }

            const result = await response.json();

            if (result.success) {
                // Store workspace ID
                localStorage.setItem("currentWorkspaceId", result.data.workspace.id);

                // Move to completion step
                setActiveStep(steps.length - 1);

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000);
            } else {
                throw new Error(result.error?.message || "Failed to create workspace");
            }
        } catch (err) {
            console.error("Error creating workspace:", err);
            setError(err instanceof Error ? err.message : "Failed to create workspace");
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                // Company Info
                return (
                    <Box>
                        <Typography variant="h5" gutterBottom fontWeight={600}>
                            Let's set up your workspace
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 4 }}>
                            Tell us about your company
                        </Typography>

                        <TextField
                            fullWidth
                            label="Company Name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g., Acme Corporation"
                            required
                            autoFocus
                            sx={{ mb: 3 }}
                        />

                        <FormControl component="fieldset" sx={{ width: "100%" }}>
                            <FormLabel component="legend" sx={{ mb: 2 }}>
                                Industry
                            </FormLabel>
                            <RadioGroup
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                            >
                                {industryTemplates.map((template) => (
                                    <FormControlLabel
                                        key={template.value}
                                        value={template.value}
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                {template.label}
                                                {template.value === "custom" && (
                                                    <Chip
                                                        label="AI-Powered"
                                                        size="small"
                                                        color="primary"
                                                        icon={<AutoAwesome />}
                                                    />
                                                )}
                                            </Box>
                                        }
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                    </Box>
                );

            case 1:
                // Business Description
                return (
                    <Box>
                        <Typography variant="h5" gutterBottom fontWeight={600}>
                            {industry === "custom" ? "Describe your business" : "Ready to generate"}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 4 }}>
                            {industry === "custom"
                                ? "Our AI will generate a custom CRM based on your description"
                                : `We'll create a CRM using our ${industryTemplates.find(t => t.value === industry)?.label} template`}
                        </Typography>

                        {industry === "custom" ? (
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                label="Business Description"
                                value={businessDescription}
                                onChange={(e) => setBusinessDescription(e.target.value)}
                                placeholder="Describe your business, what you do, and what you need to track. For example: 'We are a real estate agency managing residential properties, buyers, sellers, and viewing appointments in urban areas.'"
                                required
                                autoFocus
                                helperText="Be specific about what you want to manage in your CRM"
                            />
                        ) : (
                            <Alert severity="info" icon={<Folder />}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Using {industryTemplates.find(t => t.value === industry)?.label} Template
                                </Typography>
                                <Typography variant="body2">
                                    This template includes pre-configured entities and fields optimized for your industry.
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                );

            case 2:
                // Review Generated CRM
                return (
                    <Box>
                        <Typography variant="h5" gutterBottom fontWeight={600}>
                            Your CRM is ready!
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 4 }}>
                            Review the generated entities and fields
                        </Typography>

                        {loading ? (
                            <Box sx={{ textAlign: "center", py: 6 }}>
                                <CircularProgress size={48} sx={{ mb: 2 }} />
                                <Typography color="text.secondary">
                                    Generating your CRM...
                                </Typography>
                            </Box>
                        ) : generatedConfig ? (
                            <Box>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    Generated {generatedConfig.entities?.length || 0} entities with fields and automations!
                                </Alert>

                                <List>
                                    {generatedConfig.entities?.map((entity: any, index: number) => (
                                        <Box key={index}>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <CheckCircle color="success" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" fontWeight={600}>
                                                            {entity.display_name}
                                                        </Typography>
                                                    }
                                                    secondary={`${entity.fields?.length || 0} fields • ${entity.views_config?.available_views?.length || 0} views`}
                                                />
                                            </ListItem>
                                            {index < (generatedConfig.entities?.length || 0) - 1 && <Divider />}
                                        </Box>
                                    ))}
                                </List>

                                {generatedConfig.suggested_automations?.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            + {generatedConfig.suggested_automations.length} automation suggestions
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Alert severity="error">
                                Failed to generate CRM configuration
                            </Alert>
                        )}
                    </Box>
                );

            case 3:
                // Complete
                return (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <CheckCircle
                            sx={{ fontSize: 80, color: "success.main", mb: 2 }}
                        />
                        <Typography variant="h4" gutterBottom fontWeight={600}>
                            All Set!
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Your workspace has been created successfully.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Redirecting to dashboard...
                        </Typography>
                        <CircularProgress sx={{ mt: 2 }} />
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "grey.50",
                py: 4,
                px: 2,
            }}
        >
            <Box sx={{ maxWidth: 800, mx: "auto" }}>
                {/* Header */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                            mb: 1,
                            fontWeight: 700,
                            background: "linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)",
                            backgroundClip: "text",
                            textFillColor: "transparent",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        SmartCRM
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Let's build your perfect CRM
                    </Typography>
                </Box>

                {/* Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Content Card */}
                <Card sx={{ boxShadow: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        {renderStepContent()}

                        {/* Navigation Buttons */}
                        {activeStep < steps.length - 1 && (
                            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                                <Button
                                    disabled={activeStep === 0}
                                    onClick={handleBack}
                                    startIcon={<ArrowBack />}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                    disabled={loading}
                                    endIcon={loading ? <CircularProgress size={20} /> : <ArrowForward />}
                                    sx={{ minWidth: 150 }}
                                >
                                    {activeStep === steps.length - 2 ? "Create Workspace" : "Continue"}
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
