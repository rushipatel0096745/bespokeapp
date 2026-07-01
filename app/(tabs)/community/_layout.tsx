import { Stack } from "expo-router";
import { colors } from "@/theme/theme";

export default function CommunityLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
            <Stack.Screen name='index' />
            <Stack.Screen
                name='compose'
                options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                }}
            />
            <Stack.Screen name='[postId]' />
            <Stack.Screen name='profile/[authorId]' />
        </Stack>
    );
}
