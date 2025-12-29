/**
 * Kanban Board Component
 * Drag-and-drop board for pipeline management
 */
"use client";

import { useState } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
} from "@mui/material";
import {
    MoreVert,
    Edit,
    Delete,
    Visibility,
    AttachMoney,
    CalendarToday,
    Person,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import type { Entity, FieldDefinition } from "@/types";

interface Record {
    id: string;
    data: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

interface KanbanBoardProps {
    entityName: string;
    entityConfig: Entity;
    records: Record[];
    statusField: FieldDefinition;
    onUpdateRecord: (recordId: string, newStatus: string) => Promise<void>;
    onDeleteRecord: (recordId: string) => void;
}

// Sortable Card Component
function KanbanCard({
    record,
    entityName,
    entityConfig,
    onDelete,
}: {
    record: Record;
    entityName: string;
    entityConfig: Entity;
    onDelete: () => void;
}) {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: record.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Find display name field (usually first text field)
    const titleField = entityConfig.fields.find(
        (f) => f.type === "text" && f.name !== "status"
    );
    const title = titleField ? record.data[titleField.name] : record.id;

    // Find other important fields
    const emailField = entityConfig.fields.find((f) => f.type === "email");
    const currencyField = entityConfig.fields.find((f) => f.type === "currency");
    const dateField = entityConfig.fields.find((f) => f.type === "date");
    const selectFields = entityConfig.fields.filter((f) => f.type === "select");

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            sx={{
                mb: 2,
                cursor: isDragging ? "grabbing" : "grab",
                "&:hover": {
                    boxShadow: 3,
                },
                userSelect: "none",
            }}
        >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1 }}>
                        {title || "Untitled"}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={handleMenuClick}
                        sx={{ ml: 1 }}
                    >
                        <MoreVert fontSize="small" />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem
                            onClick={() => {
                                handleMenuClose();
                                router.push(`/dashboard/${entityName}/show/${record.id}`);
                            }}
                        >
                            <Visibility fontSize="small" sx={{ mr: 1 }} />
                            View
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                handleMenuClose();
                                router.push(`/dashboard/${entityName}/edit/${record.id}`);
                            }}
                        >
                            <Edit fontSize="small" sx={{ mr: 1 }} />
                            Edit
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                handleMenuClose();
                                onDelete();
                            }}
                            sx={{ color: "error.main" }}
                        >
                            <Delete fontSize="small" sx={{ mr: 1 }} />
                            Delete
                        </MenuItem>
                    </Menu>
                </Box>

                {/* Email */}
                {emailField && record.data[emailField.name] && (
                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                        <Person sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {record.data[emailField.name]}
                        </Typography>
                    </Box>
                )}

                {/* Currency */}
                {currencyField && record.data[currencyField.name] && (
                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                        <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: "success.main" }} />
                        <Typography variant="body2" fontWeight={600} color="success.main">
                            ${parseFloat(record.data[currencyField.name]).toLocaleString()}
                        </Typography>
                    </Box>
                )}

                {/* Date */}
                {dateField && record.data[dateField.name] && (
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                            {new Date(record.data[dateField.name]).toLocaleDateString()}
                        </Typography>
                    </Box>
                )}

                {/* Tags from select fields */}
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {selectFields.slice(0, 2).map((field) => {
                        const value = record.data[field.name];
                        if (!value || field.name === "status") return null;
                        return (
                            <Chip
                                key={field.name}
                                label={value}
                                size="small"
                                sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                        );
                    })}
                </Box>
            </CardContent>
        </Card>
    );
}

// Kanban Column Component
function KanbanColumn({
    status,
    records,
    entityName,
    entityConfig,
    onDeleteRecord,
}: {
    status: string;
    records: Record[];
    entityName: string;
    entityConfig: Entity;
    onDeleteRecord: (recordId: string) => void;
}) {
    return (
        <Box
            sx={{
                minWidth: 320,
                maxWidth: 320,
                bgcolor: "grey.50",
                borderRadius: 2,
                p: 2,
                height: "fit-content",
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                    {status}
                </Typography>
                <Chip
                    label={records.length}
                    size="small"
                    color="primary"
                    sx={{ height: 24 }}
                />
            </Box>

            <SortableContext
                items={records.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
            >
                <Box sx={{ minHeight: 100 }}>
                    {records.map((record) => (
                        <KanbanCard
                            key={record.id}
                            record={record}
                            entityName={entityName}
                            entityConfig={entityConfig}
                            onDelete={() => onDeleteRecord(record.id)}
                        />
                    ))}
                </Box>
            </SortableContext>

            {records.length === 0 && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                        No items
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

// Main Kanban Board Component
export function KanbanBoard({
    entityName,
    entityConfig,
    records,
    statusField,
    onUpdateRecord,
    onDeleteRecord,
}: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Get status options from field config
    const statusOptions = statusField.options || [];

    // Group records by status
    const recordsByStatus = statusOptions.reduce((acc, status) => {
        acc[status] = records.filter((r) => r.data[statusField.name] === status);
        return acc;
    }, {} as Record<string, Record[]>);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeRecord = records.find((r) => r.id === active.id);
        if (!activeRecord) return;

        const currentStatus = activeRecord.data[statusField.name];
        const newStatus = over.id as string;

        if (currentStatus !== newStatus) {
            // Update record status
            await onUpdateRecord(active.id as string, newStatus);
        }
    };

    const activeRecord = activeId ? records.find((r) => r.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Box
                sx={{
                    display: "flex",
                    gap: 3,
                    overflowX: "auto",
                    pb: 2,
                    height: "calc(100vh - 250px)",
                }}
            >
                {statusOptions.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        records={recordsByStatus[status] || []}
                        entityName={entityName}
                        entityConfig={entityConfig}
                        onDeleteRecord={onDeleteRecord}
                    />
                ))}
            </Box>

            <DragOverlay>
                {activeRecord ? (
                    <Card sx={{ width: 320, opacity: 0.9 }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={600}>
                                {activeRecord.data[statusField.name] || "Moving..."}
                            </Typography>
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
