/**
 * Simple Notification Provider for Refine
 * Provides basic console-based notifications
 */
import { NotificationProvider } from "@refinedev/core";

export const notificationProvider: NotificationProvider = {
    open: ({ message, type, description }) => {
        console.log(`[${type?.toUpperCase()}] ${message}:`, description);
    },
    close: () => {
        // No-op for console notifications
    },
};
