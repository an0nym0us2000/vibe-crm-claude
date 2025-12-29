import { AuthBindings } from "@refinedev/core";
import { supabaseClient } from "./supabase-client";

export const authProvider: AuthBindings = {
    login: async ({ email, password }) => {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                error,
            };
        }

        if (data?.user) {
            return {
                success: true,
                redirectTo: "/",
            };
        }

        return {
            success: false,
            error: {
                message: "Login failed",
                name: "Invalid credentials",
            },
        };
    },

    logout: async () => {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            return {
                success: false,
                error,
            };
        }

        return {
            success: true,
            redirectTo: "/login",
        };
    },

    check: async () => {
        const { data } = await supabaseClient.auth.getSession();
        const { session } = data;

        if (!session) {
            return {
                authenticated: false,
                redirectTo: "/login",
            };
        }

        return {
            authenticated: true,
        };
    },

    getPermissions: async () => {
        const { data } = await supabaseClient.auth.getUser();

        if (data?.user) {
            return data.user.role;
        }

        return null;
    },

    getIdentity: async () => {
        const { data } = await supabaseClient.auth.getUser();

        if (data?.user) {
            return {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name,
            };
        }

        return null;
    },

    onError: async (error) => {
        console.error(error);
        return { error };
    },
};
