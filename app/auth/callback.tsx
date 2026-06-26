import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";

import { supabase } from "../../lib/supabase";

export default function CallbackScreen() {
    useEffect(() => {
        const handleUrl = async (url: string) => {
            try {
                await supabase.auth.exchangeCodeForSession(url);

                router.replace("/");
            } catch (e) {
                console.error(e);

                router.replace("/auth/login");
            }
        };

        Linking.getInitialURL().then((url) => {
            if (url) handleUrl(url);
        });

        const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}>
            <ActivityIndicator size='large' />
        </View>
    );
}
