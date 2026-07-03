import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { router } from "expo-router";
import { colors, typography, spacing, componentStyles } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Sent state ───────────────────────────────────────────────────────────────

function SentState({ email, onResend }: { email: string; onResend: () => void }) {
    return (
        <View style={styles.sentWrap}>
            <Text style={styles.sentEmoji}>📬</Text>
            <Text style={styles.sentTitle}>Check your inbox</Text>
            <Text style={styles.sentBody}>
                We've sent a password reset link to <Text style={styles.sentEmail}>{email}</Text>. It may take a minute
                to arrive.
            </Text>
            <TouchableOpacity onPress={onResend} activeOpacity={0.7}>
                <Text style={styles.resendText}>Didn't get it? Send again</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[componentStyles.buttonPrimary, { marginTop: spacing.xl }]}
                onPress={() => router.replace("/login")}
                activeOpacity={0.85}>
                <Text style={componentStyles.buttonPrimaryText}>Back to sign in</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    function validate() {
        if (!email.trim()) {
            setEmailError("Email address is required.");
            return false;
        }
        if (!isValidEmail(email)) {
            setEmailError("Enter a valid email address.");
            return false;
        }
        setEmailError(null);
        return true;
    }

    async function handleSend() {
        if (!validate()) return;
        setIsLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            // Deep link back into the app to the reset screen
            // Update this to match your app's scheme configured in app.json
            redirectTo: "modernmum://reset-password",
        });

        setIsLoading(false);

        // Always show the sent state even if the email doesn't exist —
        // avoids leaking whether an account exists for a given email.
        if (!error) {
            setSent(true);
        } else {
            // Only surface genuine errors (network, rate limit etc.)
            setEmailError(error.message);
        }
    }

    if (sent) {
        return (
            <ScreenWrapper scrollable={false} withTabBar={false}>
                <SentState email={email.trim()} onResend={() => setSent(false)} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper scrollable withTabBar={false}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.brand}>Modern Mum Co</Text>
                    <Text style={styles.title}>Forgot password?</Text>
                    <Text style={styles.subtitle}>
                        Enter the email address linked to your account and we'll send you a reset link.
                    </Text>
                </View>

                {/* Form */}
                <View style={componentStyles.card}>
                    <Input
                        label='Email address'
                        placeholder='Enter your email'
                        value={email}
                        onChangeText={(t) => {
                            setEmail(t);
                            setEmailError(null);
                        }}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        autoCorrect={false}
                        autoComplete='email'
                        returnKeyType='done'
                        onSubmitEditing={handleSend}
                        errorText={emailError ?? undefined}
                        editable={!isLoading}
                    />

                    <TouchableOpacity
                        style={[componentStyles.buttonPrimary, styles.submitBtn, isLoading && styles.disabledBtn]}
                        onPress={handleSend}
                        disabled={isLoading}
                        activeOpacity={0.85}>
                        {isLoading ? (
                            <ActivityIndicator size='small' color={colors.white} />
                        ) : (
                            <Text style={componentStyles.buttonPrimaryText}>Send reset link</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Back to login */}
                <TouchableOpacity style={styles.backWrap} onPress={() => router.back()} activeOpacity={0.7}>
                    <Text style={styles.backText}>← Back to sign in</Text>
                </TouchableOpacity>
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
    submitBtn: {
        marginTop: spacing.lg,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    backWrap: {
        alignSelf: "center",
        marginTop: spacing.xl,
        padding: spacing.xs,
    },
    backText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoalMid,
    },

    // Sent state
    sentWrap: {
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
    sentEmail: {
        fontFamily: typography.fonts.sansMedium,
        color: colors.charcoal,
    },
    resendText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.gold,
        marginTop: spacing.xs,
    },
});
