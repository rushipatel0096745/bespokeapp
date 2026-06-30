// app/_layout.tsx
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { CormorantGaramond_600SemiBold_Italic } from "@expo-google-fonts/cormorant-garamond";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BasketProvider } from "@/hooks/useBasket";
import { ToastProvider } from "@/components/layout/Toast";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// ─── Auth Guard ───────────────────────────────────────────────────────────────
// Sits inside AuthProvider so it can read auth state.
// Watches isAuthenticated reactively and redirects from ANY screen,
// covering the sign-out case where the user is deep inside the app.

const AUTH_GROUP = "(auth)";

function AuthGuard() {
    const { isAuthenticated, loading, profile } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // Wait until auth state is resolved

        const inAuthGroup = segments[0] === AUTH_GROUP;

        if (!isAuthenticated && !inAuthGroup) {
            // Signed out but still inside the app → send to login
            router.replace("/login");
        } else if (isAuthenticated && inAuthGroup) {
            // Already authenticated but on an auth screen → redirect in
            if (!profile?.completed_onboarding) {
                router.replace("/onboarding");
            } else {
                router.replace("/(tabs)");
            }
        }
    }, [isAuthenticated, loading, segments, profile?.completed_onboarding]);

    return null;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        CormorantGaramond_600SemiBold_Italic,
    });

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaProvider>
            <AuthProvider>
                <QueryClientProvider client={queryClient}>
                    <BasketProvider>
                        <ToastProvider>
                            {/* AuthGuard must be inside AuthProvider to access useAuth */}
                            <AuthGuard />
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                }}
                            />
                        </ToastProvider>
                    </BasketProvider>
                </QueryClientProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
