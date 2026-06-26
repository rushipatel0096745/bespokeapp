// app/_layout.tsx
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { CormorantGaramond_600SemiBold_Italic } from "@expo-google-fonts/cormorant-garamond";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../theme/theme";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BasketProvider } from "@/hooks/useBasket";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
                        <Stack
                            screenOptions={{
                                headerShown: false,
                            }}
                        />
                    </BasketProvider>
                </QueryClientProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
