/**
 * Automation Builder Component
 * Visual automation builder with triggers and actions
 */
"use client";

import { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    TextField,
    MenuItem,
    Button,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Chip,
    Alert,
    Divider,
    FormControl,
    InputLabel,
    Select,
    Paper,
} from "@mui/material";
import {
    AutoAwesome,
    BoltOutlined,
    CheckCircle,
} from "@mui/icons-material";
import { useWorkspace } from "@/contexts/workspace-context";

interface AutomationBuilderProps {
    onSave: (automation: any) => Promise<void>;
    onCancel: () => void;
    initialData?: any;
}

const steps = ["Choose Trigger", "Set Conditions", "Define Action"];

const triggerTypes = [
    {
        value: "status_changed",
        label: "Status Changes",
        description: "When a record's status field changes",
        icon: "🔄",
    },
    {
        value: "record_created",
        label: "New Record Created",
        description: "When a new record is added",
        icon: "✨",
    },
    {
        value: "field_updated",
        label: "Field Updated",
        description: "When any field value changes",
        icon: "✏️",
    },
    {
        value: "record_deleted",
        label: "Record Deleted",
        description: "When a record is archived or deleted",
        icon: "🗑️",
    },
];

const actionTypes = [
    {
        value: "send_email",
        label: "Send Email",
        description: "Send an email notification",
        icon: "📧",
    },
    {
        value: "create_task",
        label: "Create Task",
        description: "Create a new task or reminder",
        icon: "✅",
    },
    {
        value: "webhook",
        label: "Call Webhook",
        description: "Send data to external URL",
        icon: "🔗",
    },
    {
        value: "update_field",
        label: "Update Field",
        description: "Automatically update a field value",
        icon: "🔧",
    },
];

export function AutomationBuilder({
    onSave,
    onCancel,
    initialData,
}: AutomationBuilderProps) {
    const { currentWorkspace, entities } = useWorkspace();
    const [activeStep, setActiveStep] = useState(0);
    const [automation, setAutomation] = useState(
        initialData || {
            name: "",
            entity_id: "",
            trigger_type: "",
            trigger_config: {},
            action_type: "",
            action_config: {},
        }
    );
    const [error, setError] = useState<string | null>(null);

    const selectedEntity = entities.find((e) => e.id === automation.entity_id);

    const handleNext = () => {
        // Validation
        if (activeStep === 0 && !automation.trigger_type) {
            setError("Please select a trigger");
            return;
        }
        if (activeStep === 1 && !automation.entity_id) {
            setError("Please select an entity");
            return;
        }
        if (activeStep === 2 && !automation.action_type) {
            setError("Please select an action");
            return;
        }

        setError(null);
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleSave = async () => {
        if (!automation.name) {
            setError("Please enter an automation name");
            return;
        }

        try {
            await onSave(automation);
        } catch (err: any) {
            setError(err.message || "Failed to save automation");
        }
    };

    const renderTriggerStep = () => (
        <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                When should this automation run?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select the event that will trigger this automation
            </Typography>

            <Box sx={{ display: "grid", gap: 2 }}>
                {triggerTypes.map((trigger) => (
                    <Paper
                        key={trigger.value}
                        sx={{
                            p: 2,
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor:
                                automation.trigger_type === trigger.value
                                    ? "primary.main"
                                    : "grey.200",
                            "&:hover": {
                                borderColor: "primary.light",
                                bgcolor: "grey.50",
                            },
                        }}
                        onClick={() =>
                            setAutomation({ ...automation, trigger_type: trigger.value })
                        }
                    >
                        <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
                            <Typography sx={{ fontSize: "2rem" }}>{trigger.icon}</Typography>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {trigger.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {trigger.description}
                                </Typography>
                            </Box>
                            {automation.trigger_type === trigger.value && (
                                <CheckCircle color="primary" />
                            )}
                        </Box>
                    </Paper>
                ))}
            </Box>
        </Box>
    );

    const renderConditionsStep = () => (
        <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                Set up conditions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Specify when and how this automation should run
            </Typography>

            <TextField
                fullWidth
                label="Automation Name"
                value={automation.name}
                onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
                margin="normal"
                required
                placeholder="e.g., Send welcome email to new leads"
            />

            <FormControl fullWidth margin="normal" required>
                <InputLabel>Entity</InputLabel>
                <Select
                    value={automation.entity_id}
                    onChange={(e) =>
                        setAutomation({ ...automation, entity_id: e.target.value })
                    }
                    label="Entity"
                >
                    {entities.map((entity) => (
                        <MenuItem key={entity.id} value={entity.id}>
                            {entity.display_name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {automation.trigger_type === "status_changed" && selectedEntity && (
                <>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>From Status (Optional)</InputLabel>
                        <Select
                            value={automation.trigger_config.from_status || ""}
                            onChange={(e) =>
                                setAutomation({
                                    ...automation,
                                    trigger_config: {
                                        ...automation.trigger_config,
                                        from_status: e.target.value,
                                    },
                                })
                            }
                            label="From Status (Optional)"
                        >
                            <MenuItem value="">Any Status</MenuItem>
                            {selectedEntity.fields
                                .find((f) => f.type === "select" && f.name.includes("status"))
                                ?.options?.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel>To Status</InputLabel>
                        <Select
                            value={automation.trigger_config.to_status || ""}
                            onChange={(e) =>
                                setAutomation({
                                    ...automation,
                                    trigger_config: {
                                        ...automation.trigger_config,
                                        to_status: e.target.value,
                                    },
                                })
                            }
                            label="To Status"
                        >
                            {selectedEntity.fields
                                .find((f) => f.type === "select" && f.name.includes("status"))
                                ?.options?.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </>
            )}

            {automation.trigger_type === "field_updated" && selectedEntity && (
                <FormControl fullWidth margin="normal" required>
                    <InputLabel>Field to Watch</InputLabel>
                    <Select
                        value={automation.trigger_config.field_name || ""}
                        onChange={(e) =>
                            setAutomation({
                                ...automation,
                                trigger_config: {
                                    ...automation.trigger_config,
                                    field_name: e.target.value,
                                },
                            })
                        }
                        label="Field to Watch"
                    >
                        {selectedEntity.fields.map((field) => (
                            <MenuItem key={field.name} value={field.name}>
                                {field.display_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    );

    const renderActionStep = () => (
        <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                What should happen?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose the action to perform when the trigger conditions are met
            </Typography>

            <Box sx={{ display: "grid", gap: 2, mb: 3 }}>
                {actionTypes.map((action) => (
                    <Paper
                        key={action.value}
                        sx={{
                            p: 2,
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor:
                                automation.action_type === action.value
                                    ? "primary.main"
                                    : "grey.200",
                            "&:hover": {
                                borderColor: "primary.light",
                                bgcolor: "grey.50",
                            },
                        }}
                        onClick={() =>
                            setAutomation({ ...automation, action_type: action.value })
                        }
                    >
                        <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
                            <Typography sx={{ fontSize: "2rem" }}>{action.icon}</Typography>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {action.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {action.description}
                                </Typography>
                            </Box>
                            {automation.action_type === action.value && (
                                <CheckCircle color="primary" />
                            )}
                        </Box>
                    </Paper>
                ))}
            </Box>

            {automation.action_type === "send_email" && (
                <Box>
                    <TextField
                        fullWidth
                        label="Email Subject"
                        value={automation.action_config.subject || ""}
                        onChange={(e) =>
                            setAutomation({
                                ...automation,
                                action_config: {
                                    ...automation.action_config,
                                    subject: e.target.value,
                                },
                            })
                        }
                        margin="normal"
                        placeholder="Welcome to our CRM!"
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Email Body"
                        value={automation.action_config.body || ""}
                        onChange={(e) =>
                            setAutomation({
                                ...automation,
                                action_config: {
                                    ...automation.action_config,
                                    body: e.target.value,
                                },
                            })
                        }
                        margin="normal"
                        placeholder="Hi {{name}},&#10;&#10;Thank you for signing up!&#10;&#10;Best regards,&#10;The Team"
                        helperText="Use {{field_name}} to insert field values"
                    />
                </Box>
            )}

            {automation.action_type === "webhook" && (
                <>
                    <TextField
                        fullWidth
                        label="Webhook URL"
                        value={automation.action_config.url || ""}
                        onChange={(e) =>
                            setAutomation({
                                ...automation,
                                action_config: {
                                    ...automation.action_config,
                                    url: e.target.value,
                                },
                            })
                        }
                        margin="normal"
                        placeholder="https://api.example.com/webhook"
                        type="url"
                    />

                    <FormControl fullWidth margin="normal">
                        <InputLabel>HTTP Method</InputLabel>
                        <Select
                            value={automation.action_config.method || "POST"}
                            onChange={(e) =>
                                setAutomation({
                                    ...automation,
                                    action_config: {
                                        ...automation.action_config,
                                        method: e.target.value,
                                    },
                                })
                            }
                            label="HTTP Method"
                        >
                            <MenuItem value="POST">POST</MenuItem>
                            <MenuItem value="PUT">PUT</MenuItem>
                            <MenuItem value="PATCH">PATCH</MenuItem>
                        </Select>
                    </FormControl>
                </>
            )}

            {automation.action_type === "update_field" && selectedEntity && (
                <>
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel>Field to Update</InputLabel>
                        <Select
                            value={automation.action_config.field_name || ""}
                            onChange={(e) =>
                                setAutomation({
                                    ...automation,
                                    action_config: {
                                        ...automation.action_config,
                                        field_name: e.target.value,
                                    },
                                })
                            }
                            label="Field to Update"
                        >
                            {selectedEntity.fields.map((field) => (
                                <MenuItem key={field.name} value={field.name}>
                                    {field.display_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="New Value"
                        value={automation.action_config.new_value || ""}
                        onChange={(e) =>
                            setAutomation({
                                ...automation,
                                action_config: {
                                    ...automation.action_config,
                                    new_value: e.target.value,
                                },
                            })
                        }
                        margin="normal"
                        placeholder="Enter the new value"
                    />
                </>
            )}
        </Box>
    );

    const renderSummary = () => {
        const trigger = triggerTypes.find((t) => t.value === automation.trigger_type);
        const action = actionTypes.find((a) => a.value === automation.action_type);
        const entity = entities.find((e) => e.id === automation.entity_id);

        return (
            <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    Review Your Automation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Make sure everything looks good before saving
                </Typography>

                <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            NAME
                        </Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
                            {automation.name || "Untitled Automation"}
                        </Typography>

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            ENTITY
                        </Typography>
                        <Chip label={entity?.display_name} size="small" sx={{ mb: 2 }} />

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            WHEN
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <Typography>{trigger?.icon}</Typography>
                            <Typography variant="body1">{trigger?.label}</Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            THEN
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography>{action?.icon}</Typography>
                            <Typography variant="body1">{action?.label}</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    };

    return (
        <Box>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Card>
                <CardContent sx={{ minHeight: 400 }}>
                    {activeStep === 0 && renderTriggerStep()}
                    {activeStep === 1 && renderConditionsStep()}
                    {activeStep === 2 && renderActionStep()}
                    {activeStep === 3 && renderSummary()}
                </CardContent>
            </Card>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                <Button onClick={onCancel} variant="outlined">
                    Cancel
                </Button>
                <Box sx={{ display: "flex", gap: 1 }}>
                    {activeStep > 0 && (
                        <Button onClick={handleBack}>Back</Button>
                    )}
                    {activeStep < 3 ? (
                        <Button variant="contained" onClick={handleNext}>
                            Next
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            startIcon={<AutoAwesome />}
                        >
                            Save Automation
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
