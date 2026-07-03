// hooks/useNotifications.ts
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

// ─── Foreground behaviour ─────────────────────────────────────────────────────
// Show the notification as a banner even when the app is open.
// Remove this if you want silent foreground handling.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ─── Deep link handler ────────────────────────────────────────────────────────

function handleNotificationTap(notification: Notifications.Notification) {
    const data = notification.request.content.data as Record<string, string>;
    if (!data?.screen) return;

    switch (data.screen) {
        case "post":
            if (data.post_id) router.push(`/community/${data.post_id}`);
            break;
        case "order":
            if (data.order_id) router.push(`/orders/${data.order_id}`);
            break;
        default:
            break;
    }
}

// ─── Token registration ───────────────────────────────────────────────────────

async function registerToken(userId: string) {
    if (!Device.isDevice) {
        console.log("Push notifications not supported on simulator/emulator");
        // return;
    }
    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        return;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // your EAS project ID
    });

    const token = tokenData.data;
    const platform = Platform.OS === "ios" ? "ios" : "android";

    // Upsert into push_tokens — unique constraint on token handles duplicates
    const { error } = await supabase
        .from("push_tokens")
        .upsert({ user_id: userId, token, platform }, { onConflict: "token" });

    if (error) console.error("Failed to register push token:", error);
    else console.log("Push token registered:", token);

    // Android: create notification channels per type
    if (Platform.OS === "android") {
        await Promise.all([
            Notifications.setNotificationChannelAsync("comment", {
                name: "Comments",
                importance: Notifications.AndroidImportance.HIGH,
                sound: "default",
            }),
            Notifications.setNotificationChannelAsync("reaction", {
                name: "Reactions",
                importance: Notifications.AndroidImportance.DEFAULT,
                sound: "default",
            }),
            Notifications.setNotificationChannelAsync("new_post", {
                name: "New posts",
                importance: Notifications.AndroidImportance.DEFAULT,
                sound: "default",
            }),
            Notifications.setNotificationChannelAsync("order_status", {
                name: "Order updates",
                importance: Notifications.AndroidImportance.HIGH,
                sound: "default",
            }),
        ]);
    }
}

// ─── Token cleanup on logout ──────────────────────────────────────────────────

export async function unregisterToken() {
    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });

        await supabase.from("push_tokens").delete().eq("token", tokenData.data);
    } catch (err) {
        console.error("Failed to unregister push token:", err);
    }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// Call this once in your root _layout.tsx when the user is authenticated.

export function useNotifications(userId: string | undefined) {
    const tapListener = useRef<Notifications.Subscription | null>(null);
    const foregroundListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Register token for this device
        registerToken(userId);

        // Handle tap on notification (app in background/killed)
        tapListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            handleNotificationTap(response.notification);
        });

        // Handle foreground notification (app is open)
        // You can show your own in-app toast here instead of the system banner
        foregroundListener.current = Notifications.addNotificationReceivedListener((notification) => {
            console.log("Foreground notification:", notification.request.content.title);
            // Optionally: showToast(notification.request.content.title ?? "")
        });

        return () => {
            tapListener.current?.remove();
            foregroundListener.current?.remove();
        };
    }, [userId]);

    // Handle the case where the app was launched by tapping a notification
    // (app was fully killed)
    useEffect(() => {
        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response) handleNotificationTap(response.notification);
        });
    }, []);
}
