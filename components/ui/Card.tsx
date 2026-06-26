import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, radii, shadows } from "../../theme/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
    /**
     * "default"  — white card, cream border (standard)
     * "elevated" — white card, soft shadow, no border
     * "gold"     — gold-tinted border accent for CTAs
     */
    variant?: "default" | "elevated" | "gold";
    accessibilityLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Card({ children, onPress, style, variant = "default", accessibilityLabel }: CardProps) {
    const containerStyle = [
        styles.base,
        variant === "elevated" && styles.elevated,
        variant === "gold" && styles.gold,
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                accessibilityRole='button'
                accessibilityLabel={accessibilityLabel}
                style={containerStyle}>
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={containerStyle}>{children}</View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    base: {
        backgroundColor: colors.white,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
    },
    elevated: {
        borderWidth: 0,
        ...shadows.card,
    },
    gold: {
        borderWidth: 1.5,
        borderColor: colors.gold,
    },
});
