import { Stack } from "expo-router";
import { colors } from "@/theme/theme";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="saved-posts" />
        </Stack>
    );
}
