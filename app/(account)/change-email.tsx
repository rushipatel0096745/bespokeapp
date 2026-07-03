import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { colors, typography, spacing, radii, componentStyles } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChangeEmailScreen() {
    const { profile, refreshProfile } = useAuth();

    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ newEmail?: string; password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    function validate() {
        const next: typeof errors = {};
        if (!newEmail.trim()) next.newEmail = "New email is required.";
        else if (!isValidEmail(newEmail)) next.newEmail = "Enter a valid email address.";
        else if (newEmail.trim().toLowerCase() === profile?.email?.toLowerCase())
            next.newEmail = "This is already your current email.";
        if (!password) next.password = "Please enter your current password to confirm.";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;
        setIsLoading(true);

        try {
            // Re-authenticate first to confirm identity
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: profile!.email!,
                password,
            });

            if (signInError) {
                setErrors({ password: "Incorrect password. Please try again." });
                return;
            }

            // Request email change — Supabase sends a confirmation to the new address
            const { error } = await supabase.auth.updateUser({
                email: newEmail.trim().toLowerCase(),
            });

            if (error) {
                Alert.alert("Update failed", error.message);
                return;
            }

            await refreshProfile();

            Alert.alert(
                "Check your inbox",
                `We've sent a confirmation link to ${newEmail.trim()}. Click it to complete the change.`,
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (e) {
            Alert.alert("Something went wrong", "Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <ScreenWrapper scrollable header={<NavBar variant='back' title='Change email' />}>
            <View style={styles.body}>
                <Text style={styles.description}>
                    We'll send a confirmation link to your new email address. Your email won't change until you click
                    that link.
                </Text>

                {/* Current email — read only */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Current email</Text>
                    <View style={styles.readOnlyField}>
                        <Text style={styles.readOnlyText}>{profile?.email ?? "—"}</Text>
                    </View>
                </View>

                {/* New email */}
                <View style={styles.fieldGroup}>
                    <Input
                        label='New email'
                        placeholder='Enter new email address'
                        value={newEmail}
                        onChangeText={(t) => {
                            setNewEmail(t);
                            setErrors((p) => ({ ...p, newEmail: undefined }));
                        }}
                        autoCapitalize='none'
                        keyboardType='email-address'
                        returnKeyType='next'
                        autoComplete='email'
                    />
                    {errors.newEmail && <Text style={styles.error}>{errors.newEmail}</Text>}
                </View>

                {/* Current password confirmation */}
                <View style={styles.fieldGroup}>
                    <Input
                        label='Current password'
                        placeholder='Enter your current password'
                        value={password}
                        onChangeText={(t) => {
                            setPassword(t);
                            setErrors((p) => ({ ...p, password: undefined }));
                        }}
                        secureTextEntry
                        returnKeyType='done'
                        onSubmitEditing={handleSubmit}
                        autoComplete='current-password'
                    />
                    {errors.password && <Text style={styles.error}>{errors.password}</Text>}
                </View>

                <TouchableOpacity
                    style={[componentStyles.buttonGold, isLoading && styles.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.85}>
                    {isLoading ? (
                        <ActivityIndicator size='small' color={colors.charcoal} />
                    ) : (
                        <Text style={componentStyles.buttonGoldText}>Update email</Text>
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
    fieldLabel: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoalMid,
    },
    readOnlyField: {
        backgroundColor: colors.creamMid,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    readOnlyText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
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
