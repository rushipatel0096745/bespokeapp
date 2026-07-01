import { Stack } from "expo-router";
import { colors } from "@/theme/theme";

export default function CommunityProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
            <Stack.Screen name='[authorId]' />
        </Stack>
    );
}
