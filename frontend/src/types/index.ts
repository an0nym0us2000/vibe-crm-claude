/**
 * TypeScript Global Type Definitions
 * Common types used across the application
 */

// Environment variables
declare namespace NodeJS {
    interface ProcessEnv {
        NEXT_PUBLIC_API_URL: string;
        NEXT_PUBLIC_SUPABASE_URL: string;
        NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
        NEXT_PUBLIC_APP_NAME: string;
        NEXT_PUBLIC_APP_URL: string;
        NEXT_PUBLIC_ENABLE_AI_GENERATION: string;
        NEXT_PUBLIC_ENABLE_AUTOMATION: string;
    }
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: number;
        message: string;
        type: string;
        details?: any;
    };
    message?: string;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T> {
    data: {
        records: T[];
        pagination: {
            page: number;
            per_page: number;
            total: number;
            total_pages: number;
            has_next: boolean;
            has_previous: boolean;
        };
    };
}

// Record Types
export interface CRMRecord {
    id: string;
    workspace_id: string;
    entity_id: string;
    data: Record<string, any>;
    tags?: string[];
    is_archived: boolean;
    created_at: string;
    updated_at?: string;
    created_by: string;
}

// User Types
export interface User {
    id: string;
    email: string;
    name?: string;
    full_name?: string;
    company_name?: string;
    avatar?: string;
}

// Workspace Types (from workspace-context)
export interface Workspace {
    id: string;
    name: string;
    slug: string;
    description?: string;
    owner_id: string;
    subscription_tier: string;
    is_active: boolean;
    created_at: string;
    user_role?: string;
    user_joined_at?: string;
}

export interface Entity {
    id: string;
    workspace_id: string;
    entity_name: string;
    display_name: string;
    display_name_singular: string;
    icon: string;
    description?: string;
    fields: FieldDefinition[];
    views_config: ViewsConfig;
    is_active: boolean;
    created_at: string;
    record_count?: number;
}

export interface FieldDefinition {
    name: string;
    display_name: string;
    type: FieldType;
    required?: boolean;
    options?: string[];
    placeholder?: string;
    help_text?: string;
    default_value?: any;
    validation?: Record<string, any>;
}

export type FieldType =
    | "text"
    | "textarea"
    | "email"
    | "phone"
    | "number"
    | "currency"
    | "select"
    | "multiselect"
    | "checkbox"
    | "date"
    | "datetime"
    | "url"
    | "file"
    | "user"
    | "relation";

export interface ViewsConfig {
    available_views?: ViewType[];
    default_view?: ViewType;
    color?: string;
}

export type ViewType = "table" | "kanban" | "calendar" | "timeline" | "cards" | "list";

// Team Member Types
export interface WorkspaceMember {
    user_id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: "owner" | "admin" | "member";
    joined_at: string;
    invited_by?: string;
}

// Automation Types
export interface AutomationRule {
    id: string;
    workspace_id: string;
    entity_id?: string;
    name: string;
    description?: string;
    trigger_type: string;
    trigger_config: Record<string, any>;
    action_type: string;
    action_config: Record<string, any>;
    is_active: boolean;
    created_at: string;
    created_by: string;
}

// Form Types
export interface LoginFormValues {
    email: string;
    password: string;
}

export interface RegisterFormValues {
    email: string;
    password: string;
    full_name?: string;
    company_name?: string;
}

export interface CreateRecordFormValues {
    [key: string]: any;
}
