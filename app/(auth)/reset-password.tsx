import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { colors, typography, spacing, componentStyles } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

// ─── Password strength ────────────────────────────────────────────────────────

interface PasswordStrength {
    label: string;
    color: string;
    score: number;
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
    bars: { flexDirection: "row", gap: spacing.xxs, flex: 1 },
    bar: { flex: 1, height: 3, borderRadius: 2 },
    label: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        minWidth: 44,
        textAlign: "right",
    },
});

// ─── Invalid / expired token state ───────────────────────────────────────────

function InvalidTokenState() {
    return (
        <View style={styles.centeredWrap}>
            <Text style={styles.sentEmoji}>⚠️</Text>
            <Text style={styles.sentTitle}>Link expired</Text>
            <Text style={styles.sentBody}>
                This password reset link has expired or already been used. Request a new one from the login screen.
            </Text>
            <TouchableOpacity
                style={[componentStyles.buttonPrimary, { marginTop: spacing.xl, alignSelf: "stretch" }]}
                onPress={() => router.replace("/forgot-password")}
                activeOpacity={0.85}>
                <Text style={componentStyles.buttonPrimaryText}>Request new link</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState() {
    return (
        <View style={styles.centeredWrap}>
            <Text style={styles.sentEmoji}>✅</Text>
            <Text style={styles.sentTitle}>Password updated</Text>
            <Text style={styles.sentBody}>
                Your password has been reset successfully. You can now sign in with your new password.
            </Text>
            <TouchableOpacity
                style={[componentStyles.buttonPrimary, { marginTop: spacing.xl, alignSelf: "stretch" }]}
                onPress={() => router.replace("/login")}
                activeOpacity={0.85}>
                <Text style={componentStyles.buttonPrimaryText}>Sign in</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResetPasswordScreen() {
    // Supabase appends the token as a URL hash fragment which Expo Router
    // exposes as search params after the deep link is parsed.
    const params = useLocalSearchParams<{ access_token?: string; type?: string }>();

    const [sessionReady, setSessionReady] = useState(false);
    const [tokenInvalid, setTokenInvalid] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // ── Exchange token for session on mount ───────────────────────────────────
    useEffect(() => {
        async function exchangeToken() {
            const accessToken = params.access_token;
            const type = params.type;

            if (!accessToken || type !== "recovery") {
                setTokenInvalid(true);
                return;
            }

            // Set the session using the token from the deep link
            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: "", // recovery tokens don't need a refresh token
            });

            if (error) {
                setTokenInvalid(true);
                return;
            }

            setSessionReady(true);
        }

        exchangeToken();
    }, []);

    // ── Validation ────────────────────────────────────────────────────────────

    function validate() {
        const next: typeof errors = {};
        if (!password) next.password = "New password is required.";
        else if (password.length < 8) next.password = "Password must be at least 8 characters.";
        else if (getPasswordStrength(password).score < 2)
            next.password = "Password is too weak. Add uppercase letters or numbers.";
        if (!confirmPassword) next.confirmPassword = "Please confirm your new password.";
        else if (confirmPassword !== password) next.confirmPassword = "Passwords don't match.";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    async function handleSubmit() {
        if (!validate()) return;
        setIsLoading(true);

        const { error } = await supabase.auth.updateUser({ password });

        setIsLoading(false);

        if (error) {
            Alert.alert("Update failed", error.message);
            return;
        }

        // Sign out so user logs in fresh with new password
        await supabase.auth.signOut();
        setSuccess(true);
    }

    // ── Render states ─────────────────────────────────────────────────────────

    if (tokenInvalid) {
        return (
            <ScreenWrapper scrollable={false} withTabBar={false}>
                <InvalidTokenState />
            </ScreenWrapper>
        );
    }

    if (success) {
        return (
            <ScreenWrapper scrollable={false} withTabBar={false}>
                <SuccessState />
            </ScreenWrapper>
        );
    }

    if (!sessionReady) {
        return (
            <ScreenWrapper scrollable={false} withTabBar={false}>
                <View style={styles.centeredWrap}>
                    <ActivityIndicator size='large' color={colors.gold} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper scrollable withTabBar={false}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.brand}>Modern Mum Co</Text>
                    <Text style={styles.title}>Set new password</Text>
                    <Text style={styles.subtitle}>Choose a strong password with at least 8 characters.</Text>
                </View>

                <View style={componentStyles.card}>
                    {/* New password */}
                    <View style={styles.fieldGroup}>
                        <Input
                            label='New password'
                            placeholder='Enter new password'
                            value={password}
                            onChangeText={(t) => {
                                setPassword(t);
                                setErrors((p) => ({ ...p, password: undefined }));
                            }}
                            isPassword
                            returnKeyType='next'
                            autoComplete='new-password'
                            errorText={errors.password}
                        />
                        <StrengthIndicator password={password} />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Input
                            label='Confirm new password'
                            placeholder='Re-enter new password'
                            value={confirmPassword}
                            onChangeText={(t) => {
                                setConfirmPassword(t);
                                setErrors((p) => ({ ...p, confirmPassword: undefined }));
                            }}
                            isPassword
                            returnKeyType='done'
                            onSubmitEditing={handleSubmit}
                            autoComplete='new-password'
                            errorText={errors.confirmPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={[componentStyles.buttonPrimary, styles.submitBtn, isLoading && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                        activeOpacity={0.85}>
                        {isLoading ? (
                            <ActivityIndicator size='small' color={colors.white} />
                        ) : (
                            <Text style={componentStyles.buttonPrimaryText}>Update password</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: "center",
    },
    header: {
        marginBottom: spacing.xxl,
        gap: spacing.xs,
    },
    brand: {
        fontFamily: typography.fonts.serif,
        fontSize: typography.sizes.xxl,
        color: colors.gold,
        letterSpacing: typography.letterSpacing.wide,
        marginBottom: spacing.sm,
    },
    title: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxxl,
        color: colors.charcoal,
    },
    subtitle: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.md * 1.6,
        marginTop: spacing.xs,
    },
    fieldGroup: {
        gap: spacing.xs,
        marginBottom: spacing.lg,
    },
    submitBtn: {
        marginTop: spacing.sm,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    centeredWrap: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.md,
    },
    sentEmoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    sentTitle: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxxl,
        color: colors.charcoal,
        textAlign: "center",
    },
    sentBody: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        textAlign: "center",
        lineHeight: typography.sizes.md * 1.6,
    },
});
