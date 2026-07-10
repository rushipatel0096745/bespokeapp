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
import { StripeProvider } from "@stripe/stripe-react-native";
import { useNotifications } from "@/hooks/useNotifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// ─── Auth Guard ───────────────────────────────────────────────────────────────

const AUTH_GROUP = "(auth)";

function AuthGuard() {
    const { isAuthenticated, loading, profileLoading, profile } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    // Registers push token + sets up notification listeners when authenticated.
    // Passes undefined when logged out so the hook skips registration cleanly.
    useNotifications(profile?.id);

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === AUTH_GROUP;

        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/login");
        } else if (isAuthenticated && inAuthGroup) {
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
                            <StripeProvider
                                publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
                                merchantIdentifier='merchant.com.modernmumco'
                                urlScheme='modernmum'>
                                <AuthGuard />
                                <Stack screenOptions={{ headerShown: false }} />
                            </StripeProvider>
                        </ToastProvider>
                    </BasketProvider>
                </QueryClientProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
