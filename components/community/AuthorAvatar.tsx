// components/community/AuthorAvatar.tsx
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radii, typography } from "@/theme/theme";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<AvatarSize, number> = {
    sm: 32,
    md: 40,
    lg: 56,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
    sm: typography.sizes.xs,
    md: typography.sizes.base,
    lg: typography.sizes.lg,
};

type Props = {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    size?: AvatarSize;
};

export function AuthorAvatar({ firstName, lastName, avatarUrl, size = "md" }: Props) {
    const dimension = SIZE_MAP[size];
    const fontSize = FONT_SIZE_MAP[size];
    const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

    const containerStyle = {
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
    };

    if (avatarUrl) {
        return <Image source={{ uri: avatarUrl }} style={[styles.image, containerStyle]} resizeMode='cover' />;
    }

    return (
        <View style={[styles.fallback, containerStyle]}>
            <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        backgroundColor: colors.creamMid,
    },
    fallback: {
        backgroundColor: colors.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    initials: {
        fontFamily: typography.fonts.sansBold,
        color: colors.white,
        letterSpacing: typography.letterSpacing.wide,
    },
});
