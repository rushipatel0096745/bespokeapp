import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, typography, spacing, radii } from "../../theme/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = "gold" | "grey" | "success" | "error" | "cream";

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    style?: ViewStyle;
}

// ─── Variant maps ─────────────────────────────────────────────────────────────

const bg: Record<BadgeVariant, string> = {
    gold: colors.goldPale,
    grey: colors.creamMid,
    success: "#E6F4EE",
    error: "#FDECEA",
    cream: colors.cream,
};

const textColor: Record<BadgeVariant, string> = {
    gold: colors.gold,
    grey: colors.charcoalLight,
    success: colors.success,
    error: colors.error,
    cream: colors.charcoal,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Badge({ label, variant = "grey", style }: BadgeProps) {
    return (
        <View style={[styles.base, { backgroundColor: bg[variant] }, style]}>
            <Text style={[styles.label, { color: textColor[variant] }]}>{label}</Text>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    base: {
        alignSelf: "flex-start",
        borderRadius: radii.full,
        paddingVertical: 3,
        paddingHorizontal: spacing.sm,
    },
    label: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        letterSpacing: 0.4,
        includeFontPadding: false,
    },
});
