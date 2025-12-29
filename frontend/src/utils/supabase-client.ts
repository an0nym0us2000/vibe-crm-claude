/**
 * Supabase Client Configuration
 * Handles authentication and session management
 */
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

/**
 * Get current session access token
 * Automatically refreshes if expired
 */
export const getAccessToken = async (): Promise<string | null> => {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error('Error getting session:', error);
            return null;
        }

        return data.session?.access_token || null;
    } catch (error) {
        console.error('Failed to get access token:', error);
        return null;
    }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
    try {
        const { data, error } = await supabaseClient.auth.getUser();

        if (error) {
            console.error('Error getting user:', error);
            return null;
        }

        return data.user;
    } catch (error) {
        console.error('Failed to get user:', error);
        return null;
    }
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
    return await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });
};

/**
 * Sign up with email and password
 */
export const signUp = async (
    email: string,
    password: string,
    metadata?: {
        full_name?: string;
        company_name?: string;
    }
) => {
    return await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
        },
    });
};

/**
 * Sign out
 */
export const signOut = async () => {
    return await supabaseClient.auth.signOut();
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (session: any) => void) => {
    return supabaseClient.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
    const { data } = await supabaseClient.auth.getSession();
    return !!data.session;
};
