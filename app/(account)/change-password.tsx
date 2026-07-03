import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { router } from "expo-router";
import { colors, typography, spacing, componentStyles } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface PasswordStrength {
    label: string;
    color: string;
    score: number; // 0–3
}

function getPasswordStrength(password: string): PasswordStrength {
    if (password.length === 0) return { label: "", color: colors.border, score: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: "Weak", color: colors.error, score: 1 };
    if (score === 2) return { label: "Fair", color: "#E08A00", score: 2 };
    if (score === 3) return { label: "Good", color: colors.success, score: 3 };
    return { label: "Strong", color: colors.success, score: 4 };
}

// ─── Password strength indicator ─────────────────────────────────────────────

function StrengthIndicator({ password }: { password: string }) {
    if (!password) return null;
    const { label, color, score } = getPasswordStrength(password);

    return (
        <View style={strengthStyles.container}>
            <View style={strengthStyles.bars}>
                {[1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        style={[strengthStyles.bar, { backgroundColor: i <= score ? color : colors.border }]}
                    />
                ))}
            </View>
            <Text style={[strengthStyles.label, { color }]}>{label}</Text>
        </View>
    );
}

const strengthStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginTop: spacing.xxs,
    },
    bars: {
        flexDirection: "row",
        gap: spacing.xxs,
        flex: 1,
    },
    bar: {
        flex: 1,
        height: 3,
        borderRadius: 2,
    },
    label: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        minWidth: 44,
        textAlign: "right",
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChangePasswordScreen() {
    const { profile } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});
    const [isLoading, setIsLoading] = useState(false);

    const newPasswordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    function validate() {
        const next: typeof errors = {};

        if (!currentPassword) next.currentPassword = "Current password is required.";

        if (!newPassword) next.newPassword = "New password is required.";
        else if (newPassword.length < 8) next.newPassword = "Password must be at least 8 characters.";
        else if (getPasswordStrength(newPassword).score < 2)
            next.newPassword = "Password is too weak. Add uppercase letters or numbers.";
        else if (newPassword === currentPassword)
            next.newPassword = "New password must be different from your current password.";

        if (!confirmPassword) next.confirmPassword = "Please confirm your new password.";
        else if (confirmPassword !== newPassword) next.confirmPassword = "Passwords don't match.";

        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;
        setIsLoading(true);

        try {
            // Re-authenticate to confirm identity before changing password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: profile!.email!,
                password: currentPassword,
            });

            if (signInError) {
                setErrors({ currentPassword: "Incorrect password. Please try again." });
                return;
            }

            // Update to new password
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) {
                Alert.alert("Update failed", error.message);
                return;
            }

            Alert.alert("Password updated", "Your password has been changed successfully.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch {
            Alert.alert("Something went wrong", "Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <ScreenWrapper scrollable header={<NavBar variant='back' title='Change password' />}>
            <View style={styles.body}>
                <Text style={styles.description}>
                    Choose a strong password with at least 8 characters, including uppercase letters and numbers.
                </Text>

                {/* Current password */}
                <View style={styles.fieldGroup}>
                    <Input
                        label='Current password'
                        placeholder='Enter your current password'
                        value={currentPassword}
                        onChangeText={(t) => {
                            setCurrentPassword(t);
                            setErrors((p) => ({ ...p, currentPassword: undefined }));
                        }}
                        secureTextEntry
                        returnKeyType='next'
                        onSubmitEditing={() => newPasswordRef.current?.focus()}
                        autoComplete='current-password'
                    />
                    {errors.currentPassword && <Text style={styles.error}>{errors.currentPassword}</Text>}
                </View>

                {/* New password */}
                <View style={styles.fieldGroup}>
                    <Input
                        ref={newPasswordRef}
                        label='New password'
                        placeholder='Enter new password'
                        value={newPassword}
                        onChangeText={(t) => {
                            setNewPassword(t);
                            setErrors((p) => ({ ...p, newPassword: undefined }));
                        }}
                        secureTextEntry
                        returnKeyType='next'
                        onSubmitEditing={() => confirmRef.current?.focus()}
                        autoComplete='new-password'
                    />
                    <StrengthIndicator password={newPassword} />
                    {errors.newPassword && <Text style={styles.error}>{errors.newPassword}</Text>}
                </View>

                {/* Confirm new password */}
                <View style={styles.fieldGroup}>
                    <Input
                        ref={confirmRef}
                        label='Confirm new password'
                        placeholder='Re-enter new password'
                        value={confirmPassword}
                        onChangeText={(t) => {
                            setConfirmPassword(t);
                            setErrors((p) => ({ ...p, confirmPassword: undefined }));
                        }}
                        secureTextEntry
                        returnKeyType='done'
                        onSubmitEditing={handleSubmit}
                        autoComplete='new-password'
                    />
                    {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
                </View>

                <TouchableOpacity
                    style={[componentStyles.buttonGold, isLoading && styles.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.85}>
                    {isLoading ? (
                        <ActivityIndicator size='small' color={colors.charcoal} />
                    ) : (
                        <Text style={componentStyles.buttonGoldText}>Update password</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    body: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.lg,
    },
    description: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.md * 1.6,
    },
    fieldGroup: {
        gap: spacing.xs,
    },
    error: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.error,
    },
    btnDisabled: {
        opacity: 0.6,
    },
});
