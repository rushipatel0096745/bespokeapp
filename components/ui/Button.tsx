import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors, typography, spacing, radii, shadows } from "../../theme/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "gold" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    accessibilityLabel?: string;
    style?: ViewStyle;
}

// ─── Variant maps ─────────────────────────────────────────────────────────────

const containerVariant: Record<ButtonVariant, ViewStyle> = {
    primary: {
        backgroundColor: colors.charcoal,
        borderWidth: 0,
    },
    gold: {
        backgroundColor: colors.gold,
        borderWidth: 0,
    },
    outline: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: colors.charcoal,
    },
    ghost: {
        backgroundColor: "transparent",
        borderWidth: 0,
    },
};

const labelVariant: Record<ButtonVariant, TextStyle> = {
    primary: { color: colors.cream },
    gold: { color: colors.charcoal },
    outline: { color: colors.charcoal },
    ghost: { color: colors.charcoalLight },
};

const sizeContainer: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
    md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg },
    lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
};

const sizeLabel: Record<ButtonSize, TextStyle> = {
    sm: { fontSize: typography.sizes.sm, letterSpacing: 0.4 },
    md: { fontSize: typography.sizes.base, letterSpacing: 0.5 },
    lg: { fontSize: typography.sizes.md, letterSpacing: 0.6 },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Button({
    label,
    onPress,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    fullWidth = false,
    accessibilityLabel,
    style,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.75}
            accessibilityRole='button'
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            style={[
                styles.base,
                containerVariant[variant],
                sizeContainer[size],
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}>
            {loading ? (
                <ActivityIndicator size='small' color={variant === "gold" ? colors.charcoal : colors.cream} />
            ) : (
                <Text style={[styles.label, labelVariant[variant], sizeLabel[size]]}>{label}</Text>
            )}
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    base: {
        borderRadius: radii.sm,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-start",
    },
    fullWidth: {
        alignSelf: "stretch",
    },
    disabled: {
        opacity: 0.45,
    },
    label: {
        fontFamily: typography.fonts.sansMedium,
        includeFontPadding: false,
    },
});
