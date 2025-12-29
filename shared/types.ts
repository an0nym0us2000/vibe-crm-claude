/**
 * Shared TypeScript types between frontend and backend
 */

export interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Contact {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    position?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
    user_id: string;
}

export interface Deal {
    id: string;
    title: string;
    amount: number;
    stage: DealStage;
    contact_id?: string;
    description?: string;
    expected_close_date?: string;
    created_at: string;
    updated_at: string;
    user_id: string;
}

export enum DealStage {
    LEAD = "lead",
    QUALIFIED = "qualified",
    PROPOSAL = "proposal",
    NEGOTIATION = "negotiation",
    CLOSED_WON = "closed_won",
    CLOSED_LOST = "closed_lost",
}

export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description?: string;
    contact_id?: string;
    deal_id?: string;
    scheduled_at?: string;
    completed: boolean;
    created_at: string;
    updated_at: string;
    user_id: string;
}

export enum ActivityType {
    CALL = "call",
    EMAIL = "email",
    MEETING = "meeting",
    TASK = "task",
    NOTE = "note",
}

export interface AIGenerationRequest {
    prompt: string;
    context?: Record<string, any>;
    model?: string;
    max_tokens?: number;
}

export interface AIGenerationResponse {
    content: string;
    tokens_used: number;
    model: string;
}

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
