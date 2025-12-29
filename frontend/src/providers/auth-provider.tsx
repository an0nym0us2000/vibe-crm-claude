/**
 * Refine Auth Provider
 * Handles authentication with Supabase
 */
import { AuthBindings } from "@refinedev/core";
import { supabaseClient, signIn, signUp, signOut } from "@/utils/supabase-client";

export const authProvider: AuthBindings = {
    /**
     * Login user
     */
    login: async ({ email, password }) => {
        try {
            const { data, error } = await signIn(email, password);

            if (error) {
                return {
                    success: false,
                    error: {
                        name: "LoginError",
                        message: error.message,
                    },
                };
            }

            if (!data.session) {
                return {
                    success: false,
                    error: {
                        name: "LoginError",
                        message: "No session returned",
                    },
                };
            }

            return {
                success: true,
                redirectTo: "/dashboard",
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    name: "LoginError",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    },

    /**
     * Register new user
     */
    register: async ({ email, password, full_name, company_name }) => {
        try {
            console.log("🔵 Starting registration for:", email);

            const { data, error } = await signUp(email, password, {
                full_name,
                company_name,
            });

            console.log("🔵 Signup response:", { data, error });

            if (error) {
                console.error("🔴 Registration error:", error);
                return {
                    success: false,
                    error: {
                        name: "RegisterError",
                        message: error.message,
                    },
                };
            }

            // Registration successful - user created
            // If email confirmation is required, data.session will be null
            // but the registration was still successful
            if (data.user) {
                console.log("✅ User created successfully:", data.user.id);
                console.log("🔵 Has session:", !!data.session);
                return {
                    success: true,
                    redirectTo: data.session ? "/onboarding" : undefined,
                };
            }

            console.error("🔴 No user returned from signup");
            return {
                success: false,
                error: {
                    name: "RegisterError",
                    message: "Failed to create user account",
                },
            };
        } catch (error) {
            console.error("🔴 Registration exception:", error);
            return {
                success: false,
                error: {
                    name: "RegisterError",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    },

    /**
     * Logout user
     */
    logout: async () => {
        try {
            const { error } = await signOut();

            if (error) {
                return {
                    success: false,
                    error: {
                        name: "LogoutError",
                        message: error.message,
                    },
                };
            }

            // Clear local storage
            localStorage.removeItem("currentWorkspaceId");

            return {
                success: true,
                redirectTo: "/login",
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    name: "LogoutError",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    },

    /**
     * Check if user is authenticated
     */
    check: async () => {
        try {
            const { data } = await supabaseClient.auth.getSession();

            if (data?.session) {
                return {
                    authenticated: true,
                };
            }

            return {
                authenticated: false,
                redirectTo: "/login",
                logout: true,
            };
        } catch (error) {
            return {
                authenticated: false,
                redirectTo: "/login",
                logout: true,
            };
        }
    },

    /**
     * Get user permissions (role-based)
     */
    getPermissions: async () => {
        try {
            const { data } = await supabaseClient.auth.getUser();

            if (data?.user) {
                // Get user role from metadata or workspace context
                const role = data.user.user_metadata?.role || "member";
                return role;
            }

            return null;
        } catch (error) {
            console.error("Error getting permissions:", error);
            return null;
        }
    },

    /**
     * Get user identity
     */
    getIdentity: async () => {
        try {
            const { data } = await supabaseClient.auth.getUser();

            if (data?.user) {
                return {
                    id: data.user.id,
                    email: data.user.email || "",
                    name: data.user.user_metadata?.full_name || data.user.email || "User",
                    avatar: data.user.user_metadata?.avatar_url,
                    full_name: data.user.user_metadata?.full_name,
                    company_name: data.user.user_metadata?.company_name,
                };
            }

            return null;
        } catch (error) {
            console.error("Error getting identity:", error);
            return null;
        }
    },

    /**
     * Handle authentication errors
     */
    onError: async (error) => {
        console.error("Auth error:", error);

        // Handle 401 Unauthorized
        if (error?.statusCode === 401) {
            return {
                logout: true,
                redirectTo: "/login",
                error: {
                    message: "Session expired. Please login again.",
                    name: "Unauthorized",
                },
            };
        }

        // Handle 403 Forbidden
        if (error?.statusCode === 403) {
            return {
                error: {
                    message: "You don't have permission to access this resource.",
                    name: "Forbidden",
                },
            };
        }

        return { error };
    },

    /**
     * Forgot password
     */
    forgotPassword: async ({ email }) => {
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                return {
                    success: false,
                    error: {
                        name: "ForgotPasswordError",
                        message: error.message,
                    },
                };
            }

            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    name: "ForgotPasswordError",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    },

    /**
     * Update password
     */
    updatePassword: async ({ password }) => {
        try {
            const { error } = await supabaseClient.auth.updateUser({
                password,
            });

            if (error) {
                return {
                    success: false,
                    error: {
                        name: "UpdatePasswordError",
                        message: error.message,
                    },
                };
            }

            return {
                success: true,
                redirectTo: "/dashboard",
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    name: "UpdatePasswordError",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    },
};
