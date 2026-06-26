import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../context/AuthContext";

export default function Index() {
    const { loading, isAuthenticated, profile } = useAuth();
    console.log({
        loading,
        isAuthenticated,
        profile,
    });

    if (loading) {
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

    // User not logged in
    if (!isAuthenticated) {
        return <Redirect href='/login' />;
    }

    // Profile exists but onboarding not completed
    if (!profile?.completed_onboarding) {
        return <Redirect href='/onboarding' />;
    }

    // Everything completed
    return <Redirect href='/(tabs)' />;
}

// import { Redirect } from "expo-router";

// export default function Index() {
//     // -----------------------------
//     // Temporary authentication flag
//     // Change this to false to test Login
//     // -----------------------------
//     const isAuthenticated = true;

//     if (isAuthenticated) {
//         return <Redirect href='/(tabs)' />;
//     }

//     return <Redirect href='/login' />;
// }
