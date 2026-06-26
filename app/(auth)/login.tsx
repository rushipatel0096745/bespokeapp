import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { colors, componentStyles, spacing, typography } from "../../theme/theme";
import ScreenWrapper from "../../components/layout/ScreenWrapper";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Missing fields", "Please enter both email and password.");
            return;
        }

        try {
            setLoading(true);

            const res = await signIn({ email, password });
            console.log("login....", res);

            // Alert.alert("Success", "Logged in successfully.");
        } catch (error: any) {
            Alert.alert("Login failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper scrollable={true} withTabBar={false}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.brand}>Modern Mum Co</Text>
                    <Text style={styles.title}>Welcome back</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>
                </View>

                <View style={componentStyles.card}>
                    <Text style={componentStyles.inputLabel}>Email</Text>
                    <TextInput
                        editable={!loading}
                        value={email}
                        onChangeText={setEmail}
                        placeholder='Enter your email'
                        placeholderTextColor={colors.charcoalLight}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        autoCorrect={false}
                        style={componentStyles.input}
                    />

                    <View style={{ height: spacing.md }} />

                    <Text style={componentStyles.inputLabel}>Password</Text>
                    <TextInput
                        editable={!loading}
                        value={password}
                        onChangeText={setPassword}
                        placeholder='Enter your password'
                        placeholderTextColor={colors.charcoalLight}
                        secureTextEntry
                        autoCapitalize='none'
                        autoCorrect={false}
                        style={componentStyles.input}
                    />

                    <TouchableOpacity style={styles.forgotWrap} activeOpacity={0.8}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[componentStyles.buttonPrimary, styles.primaryButton, loading && styles.disabledButton]}
                        activeOpacity={0.85}
                        onPress={handleLogin}
                        disabled={loading}>
                        <Text style={componentStyles.buttonPrimaryText}>{loading ? "SIGNING IN..." : "SIGN IN"}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don’t have an account?</Text>
                    <TouchableOpacity onPress={() => router.push("/signup")}>
                        <Text style={styles.footerLink}> Create one</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: "center",
    },
    header: {
        marginBottom: spacing.xxl,
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
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
    },
    primaryButton: {
        marginTop: spacing.lg,
    },
    disabledButton: {
        opacity: 0.7,
    },
    forgotWrap: {
        alignSelf: "flex-end",
        marginTop: spacing.md,
    },
    forgotText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.gold,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: spacing.xl,
    },
    footerText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalMid,
    },
    footerLink: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
    },
});
