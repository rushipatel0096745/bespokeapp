import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    StyleProp,
    TextStyle,
} from "react-native";
import { colors, typography, spacing, radii } from "../../theme/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps extends Omit<TextInputProps, "style"> {
    label?: string;
    helperText?: string;
    errorText?: string;
    style?: StyleProp<TextStyle>;
    /** Show a password visibility toggle */
    isPassword?: boolean;
    containerStyle?: ViewStyle;
    /** Optional right-side icon/element */
    rightElement?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Input({
    label,
    helperText,
    errorText,
    isPassword = false,
    containerStyle,
    rightElement,
    style,
    ...inputProps
}: InputProps) {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(isPassword);

    const hasError = !!errorText;

    return (
        <View style={[styles.wrapper, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={[styles.inputRow, focused && styles.focused, hasError && styles.errored]}>
                <TextInput
                    {...inputProps}
                    secureTextEntry={isPassword ? hidden : false}
                    placeholderTextColor={colors.charcoalLight}
                    style={[styles.input, style]}
                    onFocus={(e) => {
                        setFocused(true);
                        inputProps.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        inputProps.onBlur?.(e);
                    }}
                    accessibilityLabel={label}
                    aria-invalid={hasError}
                />

                {/* Password toggle */}
                {isPassword && (
                    <TouchableOpacity
                        onPress={() => setHidden((h) => !h)}
                        accessibilityLabel={hidden ? "Show password" : "Hide password"}
                        style={styles.suffix}>
                        <Text style={styles.suffixText}>{hidden ? "Show" : "Hide"}</Text>
                    </TouchableOpacity>
                )}

                {/* Custom right element (e.g. search icon) */}
                {!isPassword && rightElement && <View style={styles.suffix}>{rightElement}</View>}
            </View>

            {/* Helper / error text */}
            {hasError ? (
                <Text style={styles.errorText} accessibilityRole='alert'>
                    {errorText}
                </Text>
            ) : helperText ? (
                <Text style={styles.helperText}>{helperText}</Text>
            ) : null}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    wrapper: {
        gap: spacing.xs,
    },
    label: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
        letterSpacing: 0.3,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: radii.sm,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    focused: {
        borderColor: colors.charcoal,
    },
    errored: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
        padding: 0, // remove Android default padding
        includeFontPadding: false,
    },
    suffix: {
        paddingLeft: spacing.sm,
    },
    suffixText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },
    helperText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },
    errorText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.error,
    },
});
